#!/usr/bin/env python3
"""
Fresher Job Radar - automatic refresher (no Claude, no API keys needed).

Runs in GitHub Actions twice a day. It pulls openings from public job APIs
(Amazon, Workday, Greenhouse, Lever, SmartRecruiters) and from fresher
job-listing RSS feeds, keeps only entry-level software roles in India or
India-eligible remote, merges them into data/jobs.json and exits.

Edit config/sources.json to add or remove companies. Any source that fails
(site down, blocked, renamed) is skipped and logged; the run still succeeds.
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
SOURCES = os.path.join(ROOT, "config", "sources.json")

IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
NOW = dt.datetime.now(IST)
TODAY_LABEL = f"{NOW.day} {NOW.strftime('%b')}"
MAX_AGE_DAYS = 45
CAP = 150
UA = "Mozilla/5.0 (FresherJobRadar; +https://github.com/venkynani1/Jobs-Dashboard-)"

# ---------------------------------------------------------------- filters
INDIA = re.compile(
    r"\b(india|bengaluru|bangalore|hyderabad|pune|chennai|mumbai|navi mumbai|thane|"
    r"gurugram|gurgaon|noida|delhi|new delhi|ncr|kolkata|ahmedabad|kochi|cochin|"
    r"thiruvananthapuram|trivandrum|coimbatore|mysore|mysuru|jaipur|indore|"
    r"chandigarh|mohali|bhubaneswar|vadodara|nagpur|vizag|visakhapatnam|gift city|ind)\b",
    re.I,
)
ENTRY = re.compile(
    r"\b(intern(ship)?|trainee|graduate|grad|fresher|freshers|new grad|university|campus|"
    r"apprentice|entry[- ]level|early career|junior|jr\.?|associate|"
    r"engineer[- ]?(i|1)\b|developer[- ]?(i|1)\b|sde[- ]?(i|1)\b|swe[- ]?(i|1)\b|"
    r"0\s*[-–to]+\s*[12]\s*(yrs?|years?)|off[- ]campus|batch)\b",
    re.I,
)
SENIOR = re.compile(
    r"\b(senior|sr\.?|staff|principal|lead|manager|director|architect|head|vp|"
    r"vice president|chief|distinguished|expert|specialist ii|"
    r"ii|iii|iv|[2-9]\+?\s*(yrs?|years?)|sde[- ]?(2|3|ii|iii)|l[4-9])\b",
    re.I,
)
SOFTWARE = re.compile(
    r"(software|developer|engineer|sde|swe|devops|cloud|sre|site reliability|platform|"
    r"data|machine learning|\bml\b|\bai\b|genai|llm|python|java|full[- ]?stack|"
    r"back[- ]?end|front[- ]?end|web|mobile|android|ios|qa|test|automation|programmer|"
    r"analyst - (data|tech)|technology|it )",
    re.I,
)
NON_SOFTWARE = re.compile(
    r"\b(mechanical|civil|electrical engineer|hardware|sales|marketing|hr|human resources|"
    r"recruit|account(ant|ing)|finance analyst|legal|customer support|service desk|"
    r"help ?desk|bpo|voice process|chemical|pharma|nurse|driver|warehouse|"
    r"design verification|rtl|analog|layout|silicon|asic|physical design)\b",
    re.I,
)
TRACK_RULES = [
    ("AI/ML", r"\b(ai|ml|machine learning|genai|gen ai|llm|data scien|deep learning|nlp|computer vision|agentic)"),
    ("DevOps", r"\b(devops|cloud|sre|site reliability|platform|infra|kubernetes|aws|azure|gcp|cloudops|release)"),
    ("Python", r"\b(python|django|flask|fastapi|data engineer|automation)"),
    ("Java", r"\b(java|spring|j2ee|android)"),
]


def tracks_for(text):
    t = [name for name, rx in TRACK_RULES if re.search(rx, text, re.I)]
    if re.search(r"(software|developer|sde|swe|engineer|full[- ]?stack|back[- ]?end|programmer)", text, re.I):
        t.insert(0, "SDE")
    return t or ["SDE"]


RANGE = re.compile(r"\b0\s*(-|–|to)\s*[1-3]\s*(yrs?|years?)\b", re.I)


def too_senior(title):
    return bool(SENIOR.search(RANGE.sub(" fresher ", title)))


def is_entry_software(title, extra=""):
    if too_senior(title) or NON_SOFTWARE.search(title):
        return False
    if not SOFTWARE.search(title):
        return False
    return bool(ENTRY.search(title) or ENTRY.search(extra))


def slug(*parts):
    s = "-".join(p for p in parts if p)
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:80]


def clean(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


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
    """True if datetime d is within MAX_AGE_DAYS (or unknown)."""
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


def job(company, role, location, url, source, experience="Entry level", careers=None,
        source_type="official", extra=""):
    o = {
        "id": slug(company, role, location.split(",")[0] if location else ""),
        "company": company.strip(),
        "role": role.strip(),
        "location": location.strip() or "India",
        "experience": experience,
        "tracks": tracks_for(role + " " + extra),
        "applyUrl": url,
        "sourceType": source_type,
        "source": source,
    }
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
            if too_senior(title) or NON_SOFTWARE.search(title):
                continue
            # Amazon titles rarely say "fresher": accept SDE I / intern / new grad, or quals with 0-1 yrs
            if not (ENTRY.search(title) or re.search(r"\b(0|1)\+? years?\b|currently enrolled|graduat", quals, re.I)):
                continue
            if re.search(r"\b([3-9]|1\d)\+? years?\b", quals):
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
                           careers="https://www.amazon.jobs/en/search?base_query=software+development+engineer&country=IND",
                           extra=quals))
    return out


WD_AGE = re.compile(r"(\d+)\+?\s+Days? Ago", re.I)


def src_workday(cfg):
    out = []
    host, tenant, site, company = cfg["host"], cfg["tenant"], cfg["site"], cfg["company"]
    api = f"https://{host}/wday/cxs/{tenant}/{site}/jobs"
    seen = set()
    for q in cfg.get("queries", ["software engineer", "associate", "intern", "graduate"]):
        try:
            res = get_json(api, data={"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": q + " India"})
        except Exception as e:  # one bad query shouldn't kill the company
            log(f"  workday {company} '{q}': {e}")
            continue
        for p in res.get("jobPostings", []):
            path = p.get("externalPath", "")
            if not path or path in seen:
                continue
            seen.add(path)
            title, loc, posted = p.get("title", ""), p.get("locationsText", ""), p.get("postedOn", "")
            if not INDIA.search(loc + " " + path):
                continue
            if "30+" in posted:
                continue  # Workday shows "30+ Days Ago" for anything older; too stale to trust
            m = WD_AGE.search(posted)
            if m and int(m.group(1)) > MAX_AGE_DAYS:
                continue
            if not is_entry_software(title):
                continue
            out.append(job(company, title, loc, f"https://{host}/en-US/{site}{path}", "workday",
                           careers=f"https://{host}/en-US/{site}"))
    return out


def src_greenhouse(cfg):
    out = []
    res = get_json(f"https://boards-api.greenhouse.io/v1/boards/{cfg['token']}/jobs")
    for j in res.get("jobs", []):
        title, loc = j.get("title", ""), (j.get("location") or {}).get("name", "")
        if not INDIA.search(loc) and not re.search(r"remote.*(india|apac)", loc, re.I):
            continue
        if not recent(parse_iso(j.get("first_published") or j.get("updated_at"))):
            continue
        if is_entry_software(title):
            out.append(job(cfg["company"], title, loc, j.get("absolute_url", ""), "greenhouse"))
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
        if is_entry_software(title, cats.get("commitment", "")):
            out.append(job(cfg["company"], title, loc, j.get("hostedUrl", ""), "lever"))
    return out


def src_smartrecruiters(cfg):
    out = []
    cid = cfg["id"]
    res = get_json(f"https://api.smartrecruiters.com/v1/companies/{cid}/postings?country=in&limit=100")
    for j in res.get("content", []):
        title = j.get("name", "")
        loc = (j.get("location") or {})
        loc_s = ", ".join(x for x in [loc.get("city"), loc.get("region"), "India"] if x)
        if not recent(parse_iso(j.get("releasedDate"))):
            continue
        lvl = ((j.get("experienceLevel") or {}).get("label", ""))
        if too_senior(title) or NON_SOFTWARE.search(title) or not SOFTWARE.search(title):
            continue
        if not (ENTRY.search(title) or re.search(r"entry|intern|associate", lvl, re.I)):
            continue
        out.append(job(cfg["company"], title, loc_s,
                       f"https://jobs.smartrecruiters.com/{cid}/{j.get('id')}", "smartrecruiters"))
    return out


COMPANY_SPLIT = re.compile(
    r"\s+(off[- ]campus|recruitment|hiring|is hiring|walk[- ]?in|careers|internship|jobs?|"
    r"mega|freshers?|drive|registration|\d{4})\b", re.I)


def src_rss(cfg):
    """WordPress feeds of fresher listing sites -> aggregator entries."""
    out = []
    root = ET.fromstring(http(cfg["url"], headers={"Accept": "application/rss+xml, text/xml"}))
    for it in root.iter("item"):
        title = clean(it.findtext("title"))
        link = (it.findtext("link") or "").strip()
        desc = clean(it.findtext("description"))[:600]
        pub = None
        try:
            pub = dt.datetime.strptime((it.findtext("pubDate") or "").strip()[:25], "%a, %d %b %Y %H:%M:%S")
        except ValueError:
            pass
        if pub and (NOW.replace(tzinfo=None) - pub).days > 7:
            continue  # listing sites: only the last week
        text = title + " " + desc
        if NON_SOFTWARE.search(title) or re.search(r"(?<![-–\d])\s([3-9]|1\d)\+?\s*(yrs?|years?)\b", " " + RANGE.sub(" ", title), re.I):
            continue
        if not SOFTWARE.search(text) or not re.search(
                r"(software|developer|sde|engineer|devops|cloud|data|python|java|ai|ml|it)", title, re.I):
            continue
        company = COMPANY_SPLIT.split(title)[0].strip(" |:-–")
        if not company or len(company) > 40:
            continue
        loc_m = INDIA.findall(title)
        loc = " / ".join(dict.fromkeys(w.title() for w in loc_m if w.lower() not in ("ind",))) or "India"
        role = title
        out.append(job(company, role, loc, link, "rss:" + cfg["name"], experience="Freshers",
                       source_type="aggregator", extra=desc))
    return out


HANDLERS = {
    "amazon": src_amazon, "workday": src_workday, "greenhouse": src_greenhouse,
    "lever": src_lever, "smartrecruiters": src_smartrecruiters, "rss": src_rss,
}


def log(msg):
    print(msg, file=sys.stderr, flush=True)


# ---------------------------------------------------------------- merge
def found_date(label, fallback_year):
    try:
        d = dt.datetime.strptime(f"{label} {fallback_year}", "%d %b %Y").replace(tzinfo=IST)
        if d > NOW + dt.timedelta(days=2):
            d = d.replace(year=fallback_year - 1)
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
    try:
        board = json.load(open(DATA))
    except (OSError, ValueError):
        board = {"jobs": []}
    old = board.get("jobs", [])

    fetched, ok_sources, failed = [], set(), []
    for s in cfg["sources"]:
        name = s.get("company") or s.get("name") or s["type"]
        try:
            got = HANDLERS[s["type"]](s)
            ok_sources.add(name)
            log(f"ok   {s['type']:<15} {name:<28} {len(got)} roles")
            fetched.extend(got)
        except Exception as e:
            failed.append(name)
            log(f"FAIL {s['type']:<15} {name:<28} {type(e).__name__}: {str(e)[:120]}")
        time.sleep(0.5)

    fetched_by_key = {}
    for j in fetched:
        if j["applyUrl"].startswith("http"):
            fetched_by_key.setdefault(key(j), j)

    result, seen = [], set()
    # 1) existing jobs: keep if still listed, or if from a source we could not check and still young
    for j in old:
        k = key(j)
        if k in seen:
            continue
        age_ok = (NOW - found_date(j.get("foundOn"), NOW.year)).days <= MAX_AGE_DAYS
        src = j.get("source", "")
        api_source = src and not src.startswith("rss:")
        if k in fetched_by_key:
            j.update({x: fetched_by_key[k][x] for x in ("applyUrl", "location") if fetched_by_key[k].get(x)})
        elif api_source and j.get("company") in ok_sources:
            continue  # source answered and the job is gone -> closed
        if not age_ok:
            continue
        j["isNew"] = False
        result.append(j)
        seen.add(k)

    # 2) brand-new jobs
    new = []
    ids = {j["id"] for j in result}
    for k, j in fetched_by_key.items():
        if k in seen:
            continue
        base, n = j["id"], 2
        while j["id"] in ids:
            j["id"] = f"{base}-{n}"; n += 1
        ids.add(j["id"])
        j["foundOn"], j["isNew"] = TODAY_LABEL, True
        new.append(j)
        seen.add(k)

    # official links first, then most recent
    new.sort(key=lambda j: j["sourceType"] != "official")
    jobs = (new + result)[:CAP]

    board = {
        "refreshedAt": NOW.isoformat(timespec="seconds"),
        "nextRefreshAt": next_refresh().isoformat(timespec="seconds"),
        "jobs": jobs,
    }
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
