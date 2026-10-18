#!/usr/bin/env python3
"""
Fresher Job Radar - automatic refresher (no Claude, no API keys needed).

Runs in GitHub Actions twice a day. Pulls openings from public job APIs
(Amazon, Workday, Greenhouse, Lever, SmartRecruiters) and fresher job-listing
RSS feeds, keeps roles for 0-2 years of experience in India / India-remote at
software-industry employers, and writes data/jobs.json.

Every job is tagged with:
  category     technical | non-technical
  companyType  product | service | unknown   (config/companies.json)
  salary       {min, max, estimated, text}   in LPA; estimated=true when the
               posting gives no figure and a typical band is used instead
  keywords     skills mentioned in the posting (used by the resume builder)

Edit config/sources.json to add companies, config/companies.json to label them.
Any source that fails is skipped and logged; the run still succeeds.
"""
import datetime as dt
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "jobs.json")
STATUS = os.path.join(ROOT, "data", "sources-status.json")
SOURCES = os.path.join(ROOT, "config", "sources.json")
COMPANIES = os.path.join(ROOT, "config", "companies.json")

IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
NOW = dt.datetime.now(IST)
TODAY_LABEL = f"{NOW.day} {NOW.strftime('%b')}"
MAX_AGE_DAYS = 45
CAP = 220
UA = "Mozilla/5.0 (FresherJobRadar; +https://github.com/venkynani1/Jobs-Dashboard-)"

# ---------------------------------------------------------------- vocab
INDIA = re.compile(
    r"\b(india|bengaluru|bangalore|hyderabad|pune|chennai|mumbai|navi mumbai|thane|"
    r"gurugram|gurgaon|noida|delhi|new delhi|ncr|kolkata|ahmedabad|kochi|cochin|"
    r"thiruvananthapuram|trivandrum|coimbatore|mysore|mysuru|jaipur|indore|"
    r"chandigarh|mohali|bhubaneswar|vadodara|nagpur|vizag|visakhapatnam|gift city|"
    r"pan india|across india)\b", re.I)
ENTRY = re.compile(
    r"\b(intern(ship)?|trainee|graduate|grad|fresher|freshers|new grad|university|campus|"
    r"apprentice|entry[- ]level|early career|junior|jr\.?|associate|analyst|"
    r"engineer[- ]?(i|1)|developer[- ]?(i|1)|sde[- ]?(i|1)|swe[- ]?(i|1)|executive|"
    r"off[- ]campus|batch|get|pget)\b", re.I)
SENIOR = re.compile(
    r"\b(senior|sr\.?|staff|principal|lead|manager|director|architect|head|vp|avp|"
    r"vice president|chief|distinguished|expert|ii|iii|iv|sde[- ]?(2|3)|l[4-9]|"
    r"[3-9]\+?\s*(yrs?|years?)|1\d\+?\s*(yrs?|years?))\b", re.I)
RANGE = re.compile(r"\b0\s*(-|–|to)\s*[1-3]\s*(yrs?|years?)\b", re.I)
TECH = re.compile(
    r"(software|developer|engineer|sde|swe|devops|cloud|sre|site reliability|platform|"
    r"data|machine learning|\bml\b|\bai\b|genai|llm|python|java|full[- ]?stack|"
    r"back[- ]?end|front[- ]?end|web|mobile|android|ios|\bqa\b|test|automation|programmer|"
    r"security|cyber|network|database|\bdba\b|\bit\b|technical|technology|sap|salesforce|"
    r"servicenow|analytics|bi developer|power bi|tableau|ui|ux|systems)", re.I)
# not software-industry work at all -> drop
DROP = re.compile(
    r"\b(mechanical|civil|chemical|pharma|nurse|nursing|driver|warehouse|delivery|"
    r"electrician|plumber|welder|mbbs|doctor|teacher|chef|cook|security guard|"
    r"design verification|rtl|analog|layout|silicon|asic|physical design|vlsi|"
    r"pcb|manufacturing|production engineer|plant)\b", re.I)
TRACK_RULES = [
    ("AI/ML", r"\b(ai|ml|machine learning|genai|gen ai|llm|data scien|deep learning|nlp|computer vision|agentic)"),
    ("DevOps", r"\b(devops|cloud|sre|site reliability|platform|infra|kubernetes|aws|azure|gcp|cloudops|release)"),
    ("Python", r"\b(python|django|flask|fastapi|data engineer|automation)"),
    ("Java", r"\b(java|spring|j2ee|android)"),
]
SKILLS = [
    "Java", "Spring Boot", "Spring", "Hibernate", "Microservices", "Python", "Django", "Flask", "FastAPI",
    "JavaScript", "TypeScript", "React", "Angular", "Vue", "Next.js", "Node.js", "Express", "HTML", "CSS",
    "Tailwind", "C++", "C#", ".NET", "Go", "Golang", "Kotlin", "Swift", "Rust", "Scala", "PHP",
    "SQL", "PL/SQL", "MySQL", "PostgreSQL", "SQL Server", "Oracle", "MongoDB", "Redis", "Cassandra",
    "Elasticsearch", "Kafka", "RabbitMQ", "Spark", "Hadoop", "Airflow", "Snowflake", "Databricks", "ETL",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions",
    "CI/CD", "Linux", "Bash", "Shell scripting", "Git", "REST", "GraphQL", "gRPC", "Postman", "Swagger",
    "JUnit", "pytest", "Selenium", "Playwright", "Cypress", "Jira", "Agile", "Scrum",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch",
    "scikit-learn", "pandas", "NumPy", "LLM", "GenAI", "RAG", "LangChain", "Prompt Engineering", "MLflow",
    "Power BI", "Tableau", "Excel", "Data Structures", "Algorithms", "OOP", "System Design",
    "Prometheus", "Grafana", "Networking", "Salesforce", "ServiceNow", "SAP",
    "Communication", "Stakeholder management", "MS Office",
]
SKILL_RX = [(s, re.compile(r"(?<![A-Za-z])" + re.escape(s) + r"(?![A-Za-z])", re.I)) for s in SKILLS]

# typical fresher CTC bands in LPA, used only when a posting has no figure
BANDS = {
    ("product", "technical"): (8, 20), ("service", "technical"): (3.5, 7), ("unknown", "technical"): (4, 10),
    ("product", "non-technical"): (4, 9), ("service", "non-technical"): (2.5, 5), ("unknown", "non-technical"): (3, 6),
}
TOP_PRODUCT = {"google", "microsoft", "amazon", "atlassian", "nvidia", "uber", "salesforce", "adobe",
               "databricks", "rubrik", "goldman sachs", "phonepe", "walmart global tech", "visa", "cred"}


def tracks_for(text, category):
    if category == "non-technical":
        return ["Non-tech"]
    t = [name for name, rx in TRACK_RULES if re.search(rx, text, re.I)]
    if re.search(r"(software|developer|sde|swe|engineer|full[- ]?stack|back[- ]?end|programmer|qa|test)", text, re.I):
        t.insert(0, "SDE")
    return t or ["SDE"]


def too_senior(title):
    t = re.sub(r"associate product manager", "apm", title, flags=re.I)
    return bool(SENIOR.search(RANGE.sub(" fresher ", t)))


def years_required(text):
    """Smallest 'N+ years' / 'N-M years' requirement in text, or None."""
    best = None
    for m in re.finditer(r"(\d{1,2})\s*(?:\+|(?:-|–|to)\s*\d{1,2})?\s*(?:yrs?|years?)", text, re.I):
        n = int(m.group(1))
        best = n if best is None else min(best, n)
    return best


def category_of(title):
    return "technical" if TECH.search(title) else "non-technical"


def keywords_of(text):
    return [s for s, rx in SKILL_RX if rx.search(text or "")][:25]


def salary_of(text):
    t = (text or "").replace(",", "")
    m = re.search(r"(\d{1,2}(?:\.\d)?)\s*(?:-|–|to)\s*(\d{1,2}(?:\.\d)?)\s*(?:LPA|lakhs?|L\b)", t, re.I)
    if m:
        a, b = float(m.group(1)), float(m.group(2))
        if 1 <= a <= b <= 80:
            return {"min": a, "max": b, "estimated": False, "text": f"₹{a:g}–{b:g} LPA"}
    m = re.search(r"(?:₹|rs\.?|inr)?\s*(\d{1,2}(?:\.\d)?)\s*(?:LPA|lakhs? per annum)", t, re.I)
    if m:
        a = float(m.group(1))
        if 1 <= a <= 80:
            return {"min": a, "max": a, "estimated": False, "text": f"₹{a:g} LPA"}
    return None


def slug(*parts):
    s = "-".join(p for p in parts if p)
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:80]


def clean(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def accept(title, text=""):
    """Entry-level, software-industry role? Returns category or None."""
    if DROP.search(title) or too_senior(title):
        return None
    yrs = years_required(RANGE.sub(" ", text)) if text else None
    if yrs is not None and yrs >= 3:
        return None
    if not (ENTRY.search(title) or RANGE.search(title) or RANGE.search(text) or (yrs is not None and yrs <= 1)):
        return None
    return category_of(title)


# ---------------------------------------------------------------- http
def http(url, data=None, headers=None, timeout=25):
    h = {"User-Agent": UA, "Accept": "application/json, text/xml, */*"}
    h.update(headers or {})
    body = None
    if data is not None:
        body = json.dumps(data).encode()
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def get_json(url, **kw):
    return json.loads(http(url, **kw).decode("utf-8", "replace"))


def recent(d):
    if d is None:
        return True
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return (NOW - d).days <= MAX_AGE_DAYS


def parse_iso(s):
    if not s:
        return None
    try:
        return dt.datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except ValueError:
        return None


def day(d):
    """datetime -> 'YYYY-MM-DD' (IST), or None."""
    if d is None:
        return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(IST).date().isoformat()


def job(company, role, location, url, source, category, text="", experience=None,
        careers=None, source_type="official", posted=None):
    yrs = years_required(RANGE.sub(" ", text))
    rng = RANGE.search(role + " " + text)
    exp = experience or (rng.group(0) if rng else (f"{yrs}+ yrs" if yrs else "Entry level"))
    o = {
        "id": slug(company, role, (location or "").split(",")[0]),
        "company": company.strip(),
        "role": role.strip(),
        "location": (location or "India").strip(),
        "experience": exp,
        "category": category,
        "tracks": tracks_for(role + " " + text[:400], category),
        "keywords": keywords_of(role + " " + text),
        "applyUrl": url,
        "sourceType": source_type,
        "source": source,
    }
    if posted:
        o["postedOn"] = posted
    sal = salary_of(role + " " + text)
    if sal:
        o["salary"] = sal
    if careers:
        o["careersUrl"] = careers
    return o


# ---------------------------------------------------------------- sources
def src_amazon(cfg):
    out = []
    for q in cfg.get("queries", ["software development engineer"]):
        url = ("https://www.amazon.jobs/en/search.json?result_limit=100&sort=recent"
               "&country=IND&base_query=" + urllib.parse.quote(q))
        for j in get_json(url).get("jobs", []):
            title = j.get("title", "")
            quals = clean(j.get("basic_qualifications", ""))
            text = quals + " " + clean(j.get("description_short", "") or j.get("description", ""))
            if DROP.search(title) or too_senior(title):
                continue
            yrs = years_required(quals)
            if yrs is not None and yrs >= 3:
                continue
            if not (ENTRY.search(title) or yrs is None or yrs <= 1 or re.search(r"currently enrolled|graduat", quals, re.I)):
                continue
            posted = None
            try:
                posted = dt.datetime.strptime(j.get("posted_date", ""), "%B %d, %Y")
            except ValueError:
                pass
            if not recent(posted):
                continue
            out.append(job("Amazon", f"{title} (Job {j.get('id_icims','')})".replace(" (Job )", ""),
                           j.get("normalized_location") or j.get("location", "India"),
                           "https://www.amazon.jobs" + j.get("job_path", ""), "amazon",
                           category_of(title), text, posted=day(posted),
                           careers="https://www.amazon.jobs/en/search?base_query=software+development+engineer&country=IND"))
    return out


WD_AGE = re.compile(r"(\d+)\+?\s+Days? Ago", re.I)


def src_workday(cfg):
    out = []
    host, tenant, site, company = cfg["host"], cfg["tenant"], cfg["site"], cfg["company"]
    base = f"https://{host}/wday/cxs/{tenant}/{site}"
    seen, errors = set(), []
    queries = cfg.get("queries", ["software engineer", "associate", "intern", "graduate", "analyst", "trainee"])
    for q in queries:
        try:
            res = get_json(base + "/jobs", data={"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": q + " India"})
        except Exception as e:
            errors.append(e)
            if len(errors) == len(queries):
                raise errors[-1]  # site unreachable: report FAIL so its old jobs are kept
            continue
        for p in res.get("jobPostings", []):
            path = p.get("externalPath", "")
            if not path or path in seen:
                continue
            seen.add(path)
            title, loc, posted = p.get("title", ""), p.get("locationsText", ""), p.get("postedOn", "")
            if not INDIA.search(loc + " " + path) or "30+" in posted:
                continue
            m = WD_AGE.search(posted)
            if m and int(m.group(1)) > MAX_AGE_DAYS:
                continue
            if DROP.search(title) or too_senior(title):
                continue
            text = ""
            try:  # job description, for experience check + skills keywords
                info = get_json(base + path).get("jobPostingInfo", {})
                text = clean(info.get("jobDescription", ""))
            except Exception:
                pass
            cat = accept(title, text)
            if not cat:
                continue
            ago = 0 if re.search(r"today", posted, re.I) else 1 if re.search(r"yesterday", posted, re.I) else (int(m.group(1)) if m else None)
            out.append(job(company, title, loc, f"https://{host}/en-US/{site}{path}", "workday", cat, text,
                           careers=f"https://{host}/en-US/{site}",
                           posted=(NOW - dt.timedelta(days=ago)).date().isoformat() if ago is not None else None))
    return out


def src_greenhouse(cfg):
    out = []
    res = get_json(f"https://boards-api.greenhouse.io/v1/boards/{cfg['token']}/jobs?content=true")
    for j in res.get("jobs", []):
        title, loc = j.get("title", ""), (j.get("location") or {}).get("name", "")
        if not INDIA.search(loc) and not re.search(r"remote.*(india|apac)", loc, re.I):
            continue
        if not recent(parse_iso(j.get("first_published") or j.get("updated_at"))):
            continue
        text = clean(j.get("content", ""))
        cat = accept(title, text)
        if cat:
            out.append(job(cfg["company"], title, loc, j.get("absolute_url", ""), "greenhouse", cat, text,
                           posted=day(parse_iso(j.get("first_published") or j.get("updated_at")))))
    return out


def src_lever(cfg):
    out = []
    for j in get_json(f"https://api.lever.co/v0/postings/{cfg['site']}?mode=json"):
        title = j.get("text", "")
        cats = j.get("categories") or {}
        loc = cats.get("location", "") or ", ".join(cats.get("allLocations", []) or [])
        if not (INDIA.search(loc) or j.get("country") == "IN"):
            continue
        created = j.get("createdAt")
        if created and not recent(dt.datetime.fromtimestamp(created / 1000, dt.timezone.utc)):
            continue
        text = clean(j.get("descriptionPlain", "")) + " " + " ".join(
            clean(l.get("content", "")) for l in j.get("lists", []) or [])
        cat = accept(title + " " + cats.get("commitment", ""), text)
        if cat:
            out.append(job(cfg["company"], title, loc, j.get("hostedUrl", ""), "lever", cat, text,
                           posted=day(dt.datetime.fromtimestamp(created / 1000, dt.timezone.utc)) if created else None))
    return out


def src_smartrecruiters(cfg):
    out = []
    cid = cfg["id"]
    res = get_json(f"https://api.smartrecruiters.com/v1/companies/{cid}/postings?country=in&limit=100")
    for j in res.get("content", []):
        title = j.get("name", "")
        loc = j.get("location") or {}
        loc_s = ", ".join(x for x in [loc.get("city"), loc.get("region"), "India"] if x)
        if not recent(parse_iso(j.get("releasedDate"))):
            continue
        lvl = (j.get("experienceLevel") or {}).get("label", "")
        if DROP.search(title) or too_senior(title):
            continue
        if not (ENTRY.search(title) or re.search(r"entry|intern|associate", lvl, re.I)):
            continue
        out.append(job(cfg["company"], title, loc_s, f"https://jobs.smartrecruiters.com/{cid}/{j.get('id')}",
                       "smartrecruiters", category_of(title), lvl, posted=day(parse_iso(j.get("releasedDate")))))
    return out


COMPANY_SPLIT = re.compile(
    r"\s+(off[- ]campus|recruitment|hiring|is hiring|walk[- ]?in|careers|internship|jobs?|"
    r"mega|freshers?|drive|registration|\d{4})\b", re.I)


def src_rss(cfg):
    out = []
    root = ET.fromstring(http(cfg["url"], headers={"Accept": "application/rss+xml, text/xml"}))
    for it in root.iter("item"):
        title = clean(it.findtext("title"))
        link = (it.findtext("link") or "").strip()
        desc = clean(it.findtext("description"))[:1500]
        pub = None
        try:
            pub = dt.datetime.strptime((it.findtext("pubDate") or "").strip()[:25], "%a, %d %b %Y %H:%M:%S")
        except ValueError:
            pass
        if pub and (NOW.replace(tzinfo=None) - pub).days > 7:
            continue
        if DROP.search(title):
            continue
        yrs = years_required(RANGE.sub(" ", title))
        if yrs is not None and yrs >= 3:
            continue
        company = COMPANY_SPLIT.split(title)[0].strip(" |:-–")
        if not company or len(company) > 40:
            continue
        loc = " / ".join(dict.fromkeys(w.title() for w in INDIA.findall(title))) or "India"
        out.append(job(company, title, loc, link, "rss:" + cfg["name"], category_of(title), desc,
                       experience="Freshers", source_type="aggregator",
                       posted=day(pub.replace(tzinfo=dt.timezone.utc)) if pub else None))
    return out


HANDLERS = {"amazon": src_amazon, "workday": src_workday, "greenhouse": src_greenhouse,
            "lever": src_lever, "smartrecruiters": src_smartrecruiters, "rss": src_rss}


def log(msg):
    print(msg, file=sys.stderr, flush=True)


# ---------------------------------------------------------------- enrich
def load_companies():
    try:
        m = json.load(open(COMPANIES))
    except (OSError, ValueError):
        return {}
    out = {}
    for typ in ("product", "service"):
        for name in m.get(typ, []):
            out[name.lower()] = typ
    return out


def company_type(name, cmap):
    n = (name or "").lower()
    if n in cmap:
        return cmap[n]
    for k, v in cmap.items():  # "IBM Research" -> "ibm", "Amazon (Pay)" -> "amazon"
        if re.match(re.escape(k) + r"\b", n):
            return v
    return "unknown"


def enrich(j, cmap):
    """Fill in fields for jobs written by older versions or by hand."""
    j.setdefault("category", category_of(j.get("role", "")))
    if j["category"] == "non-technical":
        j["tracks"] = ["Non-tech"]
    j.setdefault("keywords", keywords_of(j.get("role", "") + " " + " ".join(j.get("tracks", []))))
    j["companyType"] = j.get("companyType") or company_type(j.get("company"), cmap)
    if not j.get("salary") or j["salary"].get("estimated"):
        lo, hi = BANDS[(j["companyType"], j["category"])]
        if j["company"].lower() in TOP_PRODUCT and j["category"] == "technical":
            lo, hi = 15, 35
        if re.search(r"\bintern", j.get("role", ""), re.I):
            j["salary"] = {"min": None, "max": None, "estimated": True, "text": "Stipend (internship)"}
        else:
            j["salary"] = {"min": lo, "max": hi, "estimated": True, "text": f"₹{lo:g}–{hi:g} LPA (est.)"}
    return j


# ---------------------------------------------------------------- merge
def found_date(label, year):
    try:
        d = dt.datetime.strptime(f"{label} {year}", "%d %b %Y").replace(tzinfo=IST)
        if d > NOW + dt.timedelta(days=2):
            d = d.replace(year=year - 1)
        return d
    except (ValueError, TypeError):
        return NOW


def key(j):
    norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
    return (norm(j["company"]), norm(j["role"]), norm(j["location"])[:12])


def next_refresh():
    for h, m in ((6, 57), (18, 57)):
        t = NOW.replace(hour=h, minute=m, second=0, microsecond=0)
        if t > NOW:
            return t
    return (NOW + dt.timedelta(days=1)).replace(hour=6, minute=57, second=0, microsecond=0)


def main():
    cfg = json.load(open(SOURCES))
    cmap = load_companies()
    try:
        board = json.load(open(DATA))
    except (OSError, ValueError):
        board = {"jobs": []}
    old = board.get("jobs", [])

    try:
        prev_status = {x["name"] + "|" + x["type"]: x for x in json.load(open(STATUS)).get("sources", [])}
    except (OSError, ValueError, KeyError):
        prev_status = {}
    fetched, ok_sources, failed, status = [], set(), [], []
    for s in cfg["sources"]:
        name = s.get("company") or s.get("name") or s["type"]
        prev = prev_status.get(name + "|" + s["type"], {})
        try:
            got = HANDLERS[s["type"]](s)
            ok_sources.add(name)
            log(f"ok   {s['type']:<15} {name:<28} {len(got)} roles")
            fetched.extend(got)
            status.append({"name": name, "type": s["type"], "ok": True, "count": len(got), "error": "",
                           "lastOk": NOW.isoformat(timespec="seconds"), "failStreak": 0})
        except Exception as e:
            failed.append(name)
            err = f"{type(e).__name__}: {str(e)[:120]}"
            log(f"FAIL {s['type']:<15} {name:<28} {err}")
            status.append({"name": name, "type": s["type"], "ok": False, "count": 0, "error": err,
                           "lastOk": prev.get("lastOk"), "failStreak": prev.get("failStreak", 0) + 1})
        time.sleep(0.5)
    with open(STATUS, "w", encoding="utf-8") as f:
        json.dump({"checkedAt": NOW.isoformat(timespec="seconds"), "sources": status}, f, ensure_ascii=False, indent=1)

    fetched_by_key = {}
    for j in fetched:
        if j["applyUrl"].startswith("http"):
            fetched_by_key.setdefault(key(j), j)

    result, seen = [], set()
    for j in old:
        k = key(j)
        if k in seen:
            continue
        age_ok = (NOW - found_date(j.get("foundOn"), NOW.year)).days <= MAX_AGE_DAYS
        src = j.get("source", "")
        api_source = src and not src.startswith("rss:")
        if k in fetched_by_key:
            f = fetched_by_key[k]
            for x in ("applyUrl", "location", "keywords", "category", "tracks", "postedOn"):
                if f.get(x):
                    j[x] = f[x]
            if f.get("salary"):
                j["salary"] = f["salary"]
        elif api_source and j.get("company") in ok_sources:
            continue  # the company's site answered and the job is gone -> closed
        if not age_ok:
            continue
        j["isNew"] = False
        result.append(j)
        seen.add(k)

    new, ids = [], {j["id"] for j in result}
    for k, j in fetched_by_key.items():
        if k in seen:
            continue
        base, n = j["id"], 2
        while j["id"] in ids:
            j["id"] = f"{base}-{n}"
            n += 1
        ids.add(j["id"])
        j["foundOn"], j["isNew"] = TODAY_LABEL, True
        new.append(j)
        seen.add(k)

    new.sort(key=lambda j: (j["sourceType"] != "official", j["category"] != "technical"))
    jobs = [enrich(j, cmap) for j in (new + result)[:CAP]]
    # flag the same role listed several times (other cities / another site)
    norm_role = lambda r: re.sub(r"\(.*?\)|\b(job|req|r)\s*[-#:]?\s*\w*\d\w*|[^a-z ]", " ", (r or "").lower()).split()
    groups = {}
    for j in jobs:
        groups.setdefault((j["company"].lower(), " ".join(norm_role(j["role"]))), []).append(j)
    for g in groups.values():
        for j in g:
            j["similar"] = len(g) - 1

    board = {"refreshedAt": NOW.isoformat(timespec="seconds"),
             "nextRefreshAt": next_refresh().isoformat(timespec="seconds"),
             "jobs": jobs}
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(board, f, ensure_ascii=False, indent=2)
    n_new = sum(1 for j in jobs if j.get("isNew"))
    log(f"\nwrote {len(jobs)} roles ({n_new} new); {len(failed)} sources failed: {', '.join(failed) or '-'}")
    gh = os.environ.get("GITHUB_OUTPUT")
    if gh:
        with open(gh, "a") as f:
            f.write(f"total={len(jobs)}\nnew={n_new}\n")


if __name__ == "__main__":
    main()
