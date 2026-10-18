// Fresher Job Radar app logic (no server; data in data/jobs.json, personal data in this browser)
const BOARDS=[
 ["LinkedIn","Software engineer · entry · 24h","https://www.linkedin.com/jobs/search/?keywords=software%20engineer&location=India&f_E=1%2C2&f_TPR=r86400"],
 ["LinkedIn","Java developer · entry · 24h","https://www.linkedin.com/jobs/search/?keywords=java%20developer&location=India&f_E=1%2C2&f_TPR=r86400"],
 ["LinkedIn","Python developer · entry · 24h","https://www.linkedin.com/jobs/search/?keywords=python%20developer&location=India&f_E=1%2C2&f_TPR=r86400"],
 ["LinkedIn","DevOps / Cloud · entry · 24h","https://www.linkedin.com/jobs/search/?keywords=devops%20cloud%20engineer&location=India&f_E=1%2C2&f_TPR=r86400"],
 ["LinkedIn","AI / ML · entry · 24h","https://www.linkedin.com/jobs/search/?keywords=machine%20learning%20engineer&location=India&f_E=1%2C2&f_TPR=r86400"],
 ["LinkedIn","Non-tech at IT cos · entry · 24h","https://www.linkedin.com/jobs/search/?keywords=associate%20analyst%20operations&location=India&f_E=1%2C2&f_TPR=r86400&f_I=4%2C96"],
 ["Naukri","Software engineer · 0–2 yrs","https://www.naukri.com/software-engineer-jobs?experience=1&jobAge=3"],
 ["Naukri","Java developer · 0–2 yrs","https://www.naukri.com/java-developer-jobs?experience=1&jobAge=3"],
 ["Naukri","Python developer · 0–2 yrs","https://www.naukri.com/python-developer-jobs?experience=1&jobAge=3"],
 ["Naukri","DevOps · 0–2 yrs","https://www.naukri.com/devops-engineer-jobs?experience=1&jobAge=3"],
 ["Naukri","Fresher IT jobs","https://www.naukri.com/fresher-jobs?jobAge=3"],
 ["Indeed India","Software fresher · last day","https://in.indeed.com/jobs?q=software+engineer+fresher&fromage=1"],
 ["Wellfound","Startup engineering roles","https://wellfound.com/role/l/software-engineer/india"],
 ["Instahyre","Fresher tech jobs","https://www.instahyre.com/search-jobs/"],
 ["Foundit","Software jobs 0–2 yrs","https://www.foundit.in/search/software-engineer-jobs"]
];

const PORTALS=[["Accenture","https://www.accenture.com/in-en/careers/jobsearch?jk=associate%20software%20engineer"],["Adobe","https://careers.adobe.com/us/en/search-results?keywords=software%20engineer&location=India"],["Amazon","https://www.amazon.jobs/en/search?base_query=software+development+engineer&country=IND"],["Atlassian","https://www.atlassian.com/company/careers/all-jobs?location=India"],["Capgemini","https://www.capgemini.com/in-en/careers/job-search/"],["Cisco","https://jobs.cisco.com/"],["Cognizant","https://careers.cognizant.com/in-en/"],["Deloitte India","https://www2.deloitte.com/in/en/careers.html"],["Flipkart","https://www.flipkartcareers.com/"],["Goldman Sachs","https://higher.gs.com/"],["Google","https://www.google.com/about/careers/applications/jobs/results/?location=India&target_level=EARLY"],["HCLTech","https://www.hcltech.com/careers"],["IBM","https://www.ibm.com/careers/search?field_keyword_05[0]=India"],["Infosys","https://career.infosys.com/joblist"],["JPMorgan Chase","https://careers.jpmorgan.com/in/en/students/programs"],["Microsoft","https://jobs.careers.microsoft.com/global/en/search?lc=India"],["NVIDIA","https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite"],["Oracle","https://careers.oracle.com/"],["PayPal","https://careers.pypl.com/"],["Qualcomm","https://careers.qualcomm.com/"],["Razorpay","https://razorpay.com/jobs/"],["Salesforce","https://careers.salesforce.com/en/jobs/?country=India"],["Swiggy","https://careers.swiggy.com/"],["TCS (NQT)","https://www.tcs.com/careers/india"],["Walmart Global Tech","https://careers.walmart.com/"],["Wipro","https://careers.wipro.com/"],["Zoho","https://www.zoho.com/careers/"]];

const IDEAS={
 "kubernetes":"Deploy TalentGuard's Flask API on a local k3s/minikube cluster with a Deployment, Service and HorizontalPodAutoscaler; add the manifests to the repo.",
 "docker":"Add a Dockerfile and docker-compose (API + PostgreSQL) to the Training Feedback FastAPI app and document one-command startup.",
 "ci/cd":"Add a GitHub Actions pipeline to one of your repos: lint, run pytest, build a Docker image and deploy on push to main.",
 "jenkins":"Write a Jenkinsfile that builds and tests a Spring Boot service and publishes a Docker image.",
 "terraform":"Provision an EC2 instance + security group + S3 bucket with Terraform and deploy one of your apps to it.",
 "aws":"Host the Multi-Attendance Extractor on S3 + CloudFront and add a Lambda that emails the generated report.",
 "azure":"Deploy the FastAPI Training Feedback demo to Azure App Service with a GitHub Actions workflow.",
 "gcp":"Deploy TalentGuard's API to Google Cloud Run and store model artifacts in Cloud Storage.",
 "linux":"Write bash scripts that back up a PostgreSQL database nightly with cron and rotate logs; document them in a repo.",
 "kafka":"Build two Spring Boot microservices that talk over Kafka (order-placed → notification) with docker-compose.",
 "microservices":"Split the job-portal app into user, job and application services behind a Spring Cloud Gateway.",
 "spring boot":"Rebuild the attendance tool's API in Spring Boot with JPA, validation and JUnit tests.",
 "junit":"Add JUnit 5 + Mockito tests (80%+ coverage) to a Spring Boot service and show the coverage badge.",
 "angular":"Recreate the Multi-Attendance Extractor UI in Angular to show framework range.",
 "node.js":"Write a small Express + PostgreSQL REST API (CRUD + JWT auth) with Jest tests.",
 "mongodb":"Add a MongoDB-backed audit log to the Event Control Hub and a query page for HR.",
 "redis":"Add Redis caching to TalentGuard's risk-score endpoint and measure the latency drop.",
 "graphql":"Expose the Event Control Hub data through a GraphQL endpoint with Apollo.",
 "pytorch":"Train a small PyTorch text classifier on training-feedback comments (positive/negative) and serve it with FastAPI.",
 "tensorflow":"Rebuild TalentGuard's best model as a TensorFlow/Keras network and compare it with the scikit-learn results.",
 "llm":"Build a RAG chatbot over Hexaware-style training docs using an open LLM, embeddings and a vector store.",
 "rag":"Build a RAG Q&A app over PDFs with LangChain + a vector DB, with an evaluation set of 20 questions.",
 "langchain":"Build a LangChain agent that answers questions about attendance reports by calling your extractor's output.",
 "nlp":"Sentiment + topic extraction on training-feedback text with spaCy/transformers, shown in a dashboard.",
 "spark":"Process a large public dataset with PySpark (aggregations, joins) and write results to Parquet.",
 "airflow":"Schedule the attendance-report pipeline as an Airflow DAG with retries and email alerts.",
 "etl":"Build an ETL that loads Teams/Webex attendance exports into PostgreSQL daily and powers a dashboard.",
 "power bi":"Build a Power BI dashboard on training attendance and feedback data (trends, completion, ratings).",
 "tableau":"Publish a Tableau Public dashboard on the IBM HR attrition dataset used in TalentGuard.",
 "selenium":"Write a Selenium/Playwright end-to-end test suite for the QR attendance app's admin flow.",
 "playwright":"Add Playwright end-to-end tests for the Event Control Hub registration and scan flow.",
 "data structures":"Solve 100 LeetCode problems by topic (arrays, trees, graphs, DP) and keep notes in a public repo.",
 "algorithms":"Solve 100 LeetCode problems by topic and add a write-up of 10 favourite solutions.",
 "system design":"Write a design doc for scaling the Event Control Hub to 50,000 attendees (queues, caching, sharding).",
 "go":"Rewrite the attendance CSV merger as a Go CLI with concurrency and benchmark it against the JS version.",
 "c#":"Your ASP.NET migration work already shows C#/.NET reading skills; add a small .NET 8 Web API to make it explicit.",
 ".net":"Build a .NET 8 minimal API with EF Core that mirrors one module of the Training Feedback app.",
 "communication":"Write a short case-study post (LinkedIn/Medium) on the Training Feedback migration: problem, approach, result.",
 "stakeholder management":"Describe how you gathered requirements from the training support team for the attendance tools.",
 "excel":"Your exceljs reports already show this; add an Excel pivot/report template used by the training team to your portfolio."
};

// ======================================================================
// helpers
const $ = id => document.getElementById(id);
function el(tag, attrs, ...kids) { const n = document.createElement(tag); for (const k in attrs || {}) { const v = attrs[k]; if (v == null) continue; if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else if (k.startsWith("on")) n[k] = v; else if (k === "value") n.value = v; else n.setAttribute(k, v); } for (const c of kids) if (c != null) n.append(c); return n; }
function safeUrl(u) { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null } catch (e) { return null } }
function fmt(iso) { const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
const today = () => new Date().toISOString().slice(0, 10);
const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }, del(k) { try { localStorage.removeItem(k); } catch (e) { } } };

// ======================================================================
// job enrichment (fallbacks so filters work even on older data)
const TECH_RX = /(software|developer|engineer|sde|swe|devops|cloud|sre|platform|data|machine learning|\bml\b|\bai\b|genai|llm|python|java|full[- ]?stack|back[- ]?end|front[- ]?end|web|mobile|android|ios|\bqa\b|test|automation|programmer|security|cyber|network|database|\bit\b|technical|technology|sap|salesforce|analytics|power bi|ui|ux|systems)/i;
const BANDS = { "product|technical": [8, 20], "service|technical": [3.5, 7], "unknown|technical": [4, 10], "product|non-technical": [4, 9], "service|non-technical": [2.5, 5], "unknown|non-technical": [3, 6] };
const CITIES = [
  ["Bengaluru", /bengaluru|bangalore/i], ["Hyderabad", /hyderabad|secunderabad/i], ["Chennai", /chennai|siruseri/i], ["Pune", /pune/i],
  ["Mumbai", /mumbai|thane|powai|navi mumbai/i], ["Delhi NCR", /delhi|gurugram|gurgaon|noida|\bncr\b|faridabad|ghaziabad/i], ["Kolkata", /kolkata/i],
  ["Kerala", /kochi|cochin|trivandrum|thiruvananthapuram|ernakulam|kerala/i], ["Gujarat", /ahmedabad|vadodara|gift city|gandhinagar|surat/i],
  ["Coimbatore", /coimbatore/i], ["Mysuru", /mysore|mysuru/i], ["Jaipur", /jaipur/i], ["Indore", /indore/i], ["Chandigarh / Mohali", /chandigarh|mohali/i],
  ["Bhubaneswar", /bhubaneswar/i], ["Visakhapatnam", /vizag|visakhapatnam/i], ["Nagpur", /nagpur/i], ["Remote", /remote|work from home|\bwfh\b/i]
];
const PAN_RX = /pan india|across india|multiple|all india|^\s*india\s*$|^\s*ind\s*$/i;
let COMPANY_MAP = {};
function companyType(name) {
  const n = (name || "").toLowerCase();
  if (COMPANY_MAP[n]) return COMPANY_MAP[n];
  for (const k in COMPANY_MAP) if (n.startsWith(k + " ") || n.startsWith(k + "(") || n === k) return COMPANY_MAP[k];
  return "unknown";
}
function enrich(j) {
  if (!j.category) j.category = TECH_RX.test(j.role || "") ? "technical" : "non-technical";
  if (!j.companyType || j.companyType === "unknown") j.companyType = companyType(j.company);
  if (!j.salary) {
    const b = BANDS[j.companyType + "|" + j.category] || [4, 10];
    j.salary = /\bintern/i.test(j.role || "") ? { min: null, max: null, estimated: true, text: "Stipend (internship)" } : { min: b[0], max: b[1], estimated: true, text: `₹${b[0]}–${b[1]} LPA (est.)` };
  }
  j._cities = CITIES.filter(([, rx]) => rx.test(j.location || "")).map(([c]) => c);
  if (!j._cities.length || PAN_RX.test(j.location || "")) j._pan = true;
  return j;
}

// ======================================================================
// state
const state = { board: null, builtin: null, q: "", cat: "all", track: "All", ctype: "all", sal: 0, city: "all", sort: "company", newOnly: false, hideApplied: false, tab: "jobs", trkFilter: "all" };
const TRK = "jobRadarTracker", PROF = "jobRadarProfile";
let tracker = LS.get(TRK, null);
if (!tracker) { // migrate old "applied" ticks
  tracker = []; const old = LS.get("jobRadarApplied", {});
  Object.keys(old).forEach(id => tracker.push({ uid: "t" + Math.random().toString(36).slice(2, 9), jobId: id, company: id, role: "", status: "Applied", appliedOn: today(), source: "Job Radar" }));
  LS.set(TRK, tracker);
}
const STATUSES = ["Saved", "Applied", "Application Received", "Online Assessment", "Interview Scheduled", "Interviewed", "HR / Offer Discussion", "Offer", "Rejected", "No Response", "Withdrawn"];
const RANK = { "Saved": 0, "Applied": 1, "No Response": 1, "Application Received": 2, "Online Assessment": 3, "Interview Scheduled": 4, "Interviewed": 5, "HR / Offer Discussion": 6, "Offer": 7, "Rejected": 7, "Withdrawn": 8 };
const ST_COLOR = { "Offer": ["--fresh-soft", "--fresh"], "Rejected": ["--warn-soft", "#c0392b"], "Interview Scheduled": ["--accent-soft", "--accent"], "Interviewed": ["--accent-soft", "--accent"], "HR / Offer Discussion": ["--fresh-soft", "--fresh"], "Online Assessment": ["--warn-soft", "--warn"], "Application Received": ["--plum-soft", "--plum"] };
const SOURCES = ["Job Radar", "LinkedIn", "Naukri", "Company site", "Referral", "Campus / Drive", "Other"];
const saveTracker = () => { LS.set(TRK, tracker); renderTrackerCount(); };
const trackedJob = id => tracker.find(t => t.jobId === id);
const activeResume = () => LS.get(PROF, null) || state.builtin;

// ======================================================================
// JOBS
function chipRow(box, label, opts, cur, set) { box.textContent = ""; box.append(el("span", { class: "lbl", text: label })); opts.forEach(([v, t]) => box.append(el("button", { class: "chip", type: "button", "aria-pressed": String(cur === v), text: t, onclick: () => { set(v); renderControls(); renderJobs(); } }))); }
function renderControls() {
  chipRow($("catRow"), "Role type", [["all", "All"], ["technical", "Technical"], ["non-technical", "Non-technical"]], state.cat, v => { state.cat = v; if (v === "non-technical") state.track = "All"; });
  const tr = $("trackRow");
  if (state.cat === "non-technical") { tr.hidden = true; return; }
  tr.hidden = false;
  chipRow(tr, "Track", ["All", "SDE", "Python", "Java", "DevOps", "AI/ML"].map(t => [t, t]), state.track, v => state.track = v);
}
function renderCityOptions() {
  const J = (state.board && state.board.jobs) || [];
  const counts = {}; J.forEach(j => j._cities.forEach(c => counts[c] = (counts[c] || 0) + 1));
  const pan = J.filter(j => j._pan).length;
  const sel = $("city"); const cur = sel.value; sel.textContent = "";
  sel.append(el("option", { value: "all", text: "All cities" }));
  CITIES.map(([c]) => c).filter(c => counts[c]).sort((a, b) => counts[b] - counts[a]).forEach(c => sel.append(el("option", { value: c, text: `${c} (${counts[c]}${pan ? " + " + pan + " pan-India" : ""})` })));
  sel.append(el("option", { value: "pan", text: `Pan India / unspecified only (${pan})` }));
  sel.value = [...sel.options].some(o => o.value === cur) ? cur : "all";
}
function matches(j) {
  if (state.cat !== "all" && j.category !== state.cat) return false;
  if (state.track !== "All" && !(j.tracks || []).includes(state.track)) return false;
  if (state.ctype !== "all" && j.companyType !== state.ctype) return false;
  if (state.sal > 0 && !((j.salary && j.salary.max) >= state.sal)) return false;
  if (state.city === "pan" && !j._pan) return false;
  if (state.city !== "all" && state.city !== "pan" && !(j._cities.includes(state.city) || j._pan)) return false;
  if (state.newOnly && !j.isNew) return false;
  if (state.hideApplied && trackedJob(j.id)) return false;
  if (!state.q) return true;
  const hay = [j.company, j.role, j.location, j.experience, (j.keywords || []).join(" "), (j.tracks || []).join(" "), j.companyType, j.category].join(" ").toLowerCase();
  return state.q.split(/\s+/).every(w => hay.includes(w));
}
function renderStamp() {
  const s = $("stamp"); s.textContent = ""; const b = state.board;
  if (!b) { s.append(el("span", { text: "Could not load the job list." })); return; }
  const J = b.jobs || [];
  s.append(el("span", {}, "Refreshed ", el("b", { text: fmt(b.refreshedAt) })));
  if (b.nextRefreshAt) s.append(el("span", {}, "Next ", el("b", { text: fmt(b.nextRefreshAt) })));
  s.append(el("span", {}, el("b", { text: String(J.length) }), " roles"));
  s.append(el("span", {}, el("b", { text: String(J.filter(j => j.isNew).length) }), " new"));
  s.append(el("span", {}, el("b", { text: String(J.filter(j => j.category === "non-technical").length) }), " non-tech"));
}
function renderJobs() {
  const box = $("companies"), cnt = $("count"); const jobs = (state.board && state.board.jobs) || [];
  box.textContent = "";
  if (!jobs.length) { box.append(el("div", { class: "empty", text: "No roles saved yet." })); cnt.textContent = ""; return; }
  const shown = jobs.filter(matches); cnt.textContent = shown.length + " of " + jobs.length + " roles";
  if (!shown.length) { box.append(el("div", { class: "empty" }, "Nothing matches these filters. ", el("button", { class: "btn", type: "button", text: "Reset filters", onclick: resetFilters }))); return; }
  const groups = new Map(); shown.forEach(j => { const k = j.company || "Other"; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(j); });
  let entries = [...groups.entries()];
  const smax = j => (j.salary && j.salary.max) || 0;
  if (state.sort === "company") entries.sort((a, b) => a[0].localeCompare(b[0]));
  if (state.sort === "new") entries.sort((a, b) => (b[1].some(j => j.isNew) - a[1].some(j => j.isNew)) || a[0].localeCompare(b[0]));
  if (state.sort === "salary") entries.sort((a, b) => Math.max(...b[1].map(smax)) - Math.max(...a[1].map(smax)));
  entries.forEach(([co, list]) => {
    const card = el("article", { class: "co" });
    const t = list[0].companyType;
    const head = el("div", { class: "co-head" }, el("div", {}, el("span", { class: "co-name", text: co }), t && t !== "unknown" ? el("span", { class: "co-type", text: t + "-based" }) : null));
    const portal = list.find(j => safeUrl(j.careersUrl || ""));
    if (portal) head.append(el("a", { class: "co-portal", href: safeUrl(portal.careersUrl), target: "_blank", rel: "noopener", text: "Careers site ↗" }));
    card.append(head);
    list.forEach(j => card.append(jobRow(j)));
    box.append(card);
  });
}
function jobRow(j) {
  const tr = trackedJob(j.id);
  const row = el("div", { class: "job" + (tr ? " applied" : "") });
  row.append(el("div", { class: "role", text: j.role || "Role" }));
  const meta = el("div", { class: "meta" });
  [j.location, j.experience, j.batch, j.foundOn ? "Found " + j.foundOn : null].filter(Boolean).forEach(t => meta.append(el("span", { text: t })));
  if (j.salary && j.salary.text) meta.append(el("span", { class: "sal" + (j.salary.estimated ? " est" : ""), text: j.salary.text }));
  row.append(meta);
  const tags = el("div", { class: "tags" });
  if (j.isNew) tags.append(el("span", { class: "tag new", text: "NEW" }));
  if (j.sourceType === "aggregator") tags.append(el("span", { class: "tag agg", text: "VIA LISTING" }));
  if (j.category === "non-technical") tags.append(el("span", { class: "tag nt", text: "NON-TECH" }));
  (j.tracks || []).filter(t => t !== "Non-tech").forEach(t => tags.append(el("span", { class: "tag", text: t })));
  if (tr) tags.append(el("span", { class: "tag", text: "TRACKED · " + tr.status }));
  row.append(tags);
  const act = el("div", { class: "actions" });
  const url = safeUrl(j.applyUrl);
  if (url) act.append(el("a", { class: "btn primary", href: url, target: "_blank", rel: "noopener", text: "Apply" }));
  act.append(el("button", { class: "btn plum", type: "button", text: "📄 Resume for this job", onclick: () => openResume(j) }));
  act.append(el("button", { class: "btn", type: "button", text: tr ? "Applied ✓" : "Mark applied", onclick: () => { toggleApplied(j); renderJobs(); } }));
  const q = encodeURIComponent(((j.role || "").replace(/\(.*?\)/g, "") + " " + j.company).trim());
  act.append(el("a", { class: "mini", href: "https://www.linkedin.com/jobs/search/?keywords=" + q + "&location=India", target: "_blank", rel: "noopener", text: "LinkedIn" }));
  act.append(el("a", { class: "mini", href: "https://www.naukri.com/" + encodeURIComponent((j.company || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")) + "-jobs?k=" + q, target: "_blank", rel: "noopener", text: "Naukri" }));
  row.append(act);
  return row;
}
function toggleApplied(j) {
  const t = trackedJob(j.id);
  if (t) { if (!confirm("Remove " + j.company + " – " + j.role + " from your tracker?")) return; tracker = tracker.filter(x => x !== t); }
  else tracker.unshift({ uid: "t" + Date.now().toString(36), jobId: j.id, company: j.company, role: j.role, location: j.location, link: j.applyUrl, appliedOn: today(), source: "Job Radar", status: "Applied", lastUpdate: today(), nextStep: "", followUp: addDays(today(), 7), notes: "", evidence: "" });
  saveTracker();
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
function resetFilters() {
  Object.assign(state, { q: "", cat: "all", track: "All", ctype: "all", sal: 0, city: "all", newOnly: false, hideApplied: false });
  $("q").value = ""; $("ctype").value = "all"; $("sal").value = "0"; $("city").value = "all"; $("newOnly").checked = false; $("hideApplied").checked = false;
  renderControls(); renderJobs();
}

// ======================================================================
// RESUME TAILORING
const TRACK_SKILLS = { SDE: ["Data Structures", "Algorithms", "OOP", "REST", "Git"], Java: ["Java", "Spring Boot", "Microservices", "JUnit"], Python: ["Python", "FastAPI", "pandas", "pytest"], DevOps: ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux"], "AI/ML": ["Machine Learning", "scikit-learn", "LLM", "PyTorch"], "Non-tech": ["Communication", "Stakeholder management", "Excel"] };
const ALIAS = { "rest": ["rest apis", "rest api", "restful"], "spring": ["spring boot"], "vue": ["vue.js", "vue 3"], "llm": ["llm prompt"], "genai": ["gen ai", "llm"], "prompt engineering": ["prompt"], "machine learning": ["scikit-learn", "machine-learning"], "oop": ["java"], "git": ["github"] };
function hasSkill(txt, k) { const l = k.toLowerCase(); if (txt.includes(l)) return true; return (ALIAS[l] || []).some(a => txt.includes(a)); }
function analyse(j) {
  const r = activeResume(); const txt = JSON.stringify(r).toLowerCase();
  let kws = (j.keywords || []).slice();
  (j.tracks || []).forEach(t => (TRACK_SKILLS[t] || []).forEach(s => { if (!kws.some(k => k.toLowerCase() === s.toLowerCase())) kws.push(s); }));
  if (j.category === "non-technical" && !kws.length) kws = TRACK_SKILLS["Non-tech"].slice();
  kws = [...new Set(kws)].slice(0, 18);
  const have = kws.filter(k => hasSkill(txt, k)), miss = kws.filter(k => !hasSkill(txt, k));
  return { kws, have, miss, score: kws.length ? Math.round(100 * have.length / kws.length) : 100 };
}
function headlineFor(j, have) {
  const role = (j.role || "").toLowerCase(); let t = "Software Engineer";
  if (j.category === "non-technical") t = "Technology Professional";
  else if (/data eng/.test(role)) t = "Data Engineer";
  else if (/devops|cloud|sre|platform/.test(role)) t = "Cloud / DevOps Engineer";
  else if (/machine learning|\bml\b|\bai\b|genai|data scien/.test(role)) t = "AI / ML Engineer";
  else if (/qa|test|sdet|automation/.test(role)) t = "Software Engineer (QA Automation)";
  else if (/full ?stack/.test(role)) t = "Full Stack Engineer";
  else if (/front ?end|\bui\b/.test(role)) t = "Frontend Engineer";
  else if (/back ?end|java|python/.test(role)) t = "Backend Engineer";
  const top = have.filter(k => !/communication|stakeholder|excel|oop|^git$/i.test(k)).slice(0, 4);
  const cert = /aws certified/i.test(JSON.stringify(activeResume())) ? " | AWS Certified" : "";
  return t + (top.length ? " | " + top.join(", ") : "") + cert;
}
function tailoredJob(j, a, addLearning) {
  return { role: j.role, company: j.company, tracks: j.category === "non-technical" ? [] : (j.tracks || []), category: j.category, keywords: a.have.concat(a.miss), headline: headlineFor(j, a.have), extraSkills: addLearning ? a.miss.slice(0, 5) : [] };
}
function fileBase(j) { const n = ((activeResume() || {}).name || "Resume").replace(/\s+/g, "_"); return (n + "_Resume" + (j ? "_" + j.company : "")).replace(/[^A-Za-z0-9_]+/g, "_").replace(/_+$/, ""); }
function downloadPDF(html, name) {
  const w = window.open("", "_blank");
  if (!w) { alert("Allow pop-ups for this site to download the PDF."); return; }
  w.document.open(); w.document.write(html.replace(/<title>.*?<\/title>/, "<title>" + name + "</title>").replace("</body>", "<script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body>")); w.document.close();
}
function downloadWord(html, name) {
  const doc = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>" + html.replace(/^<!doctype html><html>/i, "").replace(/<\/html>\s*$/, "") + "</html>";
  const a = el("a", { href: URL.createObjectURL(new Blob(["﻿" + doc], { type: "application/msword" })), download: name + ".doc" });
  document.body.append(a); a.click(); a.remove();
}
function openResume(j) {
  const d = $("dlg"), b = $("dlgBody"); b.textContent = "";
  if (!activeResume() || !window.renderResume) { b.append(el("p", { text: "Resume data is still loading. Try again in a moment." })); d.showModal(); return; }
  const a = analyse(j);
  b.append(el("div", { class: "row", style: "justify-content:space-between" }, el("h3", { text: "Resume for " + j.company }), el("button", { class: "btn", type: "button", text: "✕", onclick: () => d.close() })));
  b.append(el("div", { class: "note", text: j.role + " · using " + (LS.get(PROF, null) ? "your uploaded profile" : "the built-in resume") }));
  b.append(el("div", {}, el("span", { class: "score", text: a.score + "% " }), el("span", { class: "note", text: "keyword match with your resume" })));
  const bar = el("div", { class: "bar" }); const i = el("i"); i.style.width = a.score + "%"; bar.append(i); b.append(bar);
  if (a.have.length) { b.append(el("b", { text: "Matched — moved to the top of your resume" })); const k = el("div", { class: "kw" }); a.have.forEach(s => k.append(el("span", { class: "ok", text: s }))); b.append(k); }
  const chk = el("input", { type: "checkbox" }); chk.checked = true;
  if (a.miss.length) {
    b.append(el("b", { text: "Missing — skills this job asks for" })); const k = el("div", { class: "kw" }); a.miss.forEach(s => k.append(el("span", { class: "no", text: s }))); b.append(k);
    b.append(el("label", { class: "toggle", style: "color:var(--ink)" }, chk, " Add the top missing skills as \"Currently learning\" on this resume"));
    b.append(el("div", { class: "note", text: "They're labelled as learning, not as experience, so the resume stays honest in interviews. Build one of these to turn a gap into a real project:" }));
    a.miss.slice(0, 4).forEach(s => { const idea = IDEAS[s.toLowerCase()] || ("Build a small project using " + s + ", push it to GitHub and add it to your profile's Projects."); b.append(el("div", { class: "idea" }, el("b", { text: s }), idea)); });
  }
  b.append(el("div", { class: "note", text: "The resume puts the summary, skills, experience bullets and the two most relevant projects for this role first. It stays one page and ATS-readable." }));
  const go = fn => () => { const html = renderResume(activeResume(), tailoredJob(j, a, chk.checked)); fn(html, fileBase(j)); };
  b.append(el("div", { class: "actions" }, el("button", { class: "btn primary", type: "button", text: "⬇ Download PDF", onclick: go(downloadPDF) }), el("button", { class: "btn", type: "button", text: "⬇ Download Word", onclick: go(downloadWord) })));
  b.append(el("div", { class: "note", text: "PDF opens your browser's print window — choose \"Save as PDF\"." }));
  d.showModal();
}

// ======================================================================
// TRACKER
function renderTrackerCount() { $("trkCount").textContent = tracker.length ? "(" + tracker.length + ")" : ""; }
function stBadge(s) { const c = ST_COLOR[s]; const sp = el("span", { class: "st", text: s }); if (c) { sp.style.background = c[0].startsWith("--") ? `var(${c[0]})` : c[0]; sp.style.color = c[1].startsWith("--") ? `var(${c[1]})` : c[1]; } else { sp.style.background = "var(--bg)"; sp.style.color = "var(--muted)"; } return sp; }
function renderTracker() {
  const f = $("trkFilter"); if (f.options.length === 1) STATUSES.forEach(s => f.append(el("option", { value: s, text: s })));
  const st = $("trkStats"); st.textContent = "";
  const count = s => tracker.filter(t => t.status === s).length;
  const responded = tracker.filter(t => RANK[t.status] >= 3 && t.status !== "Withdrawn").length;
  const sent = tracker.filter(t => t.status !== "Saved").length;
  const overdue = tracker.filter(t => t.followUp && t.followUp < today() && !["Offer", "Rejected", "Withdrawn"].includes(t.status)).length;
  [["Tracked", tracker.length], ["Applied", sent], ["Interviews", count("Interview Scheduled") + count("Interviewed") + count("HR / Offer Discussion")], ["Offers", count("Offer")], ["Rejected", count("Rejected")], ["Response rate", sent ? Math.round(100 * responded / sent) + "%" : "—"], ["Follow-ups due", overdue]]
    .forEach(([k, v]) => st.append(el("div", { class: "stat" }, el("b", { text: String(v) }), el("span", { text: k }))));
  const body = $("trkBody"); body.textContent = "";
  const rows = tracker.filter(t => state.trkFilter === "all" || t.status === state.trkFilter);
  if (!rows.length) { body.append(el("tr", {}, el("td", { colspan: "9", class: "note", text: tracker.length ? "No applications with this status." : "Nothing tracked yet. Click \"Mark applied\" on a job, or \"Add application\" for one you applied to elsewhere." }))); return; }
  rows.forEach(t => {
    const upd = (k, v) => { t[k] = v; if (k === "status") t.lastUpdate = today(); saveTracker(); if (k === "status") renderTracker(); };
    const stSel = el("select", { onchange: e => upd("status", e.target.value) }); STATUSES.forEach(s => stSel.append(el("option", { value: s, text: s }))); stSel.value = t.status || "Applied";
    const srcSel = el("select", { onchange: e => upd("source", e.target.value) }); SOURCES.forEach(s => srcSel.append(el("option", { value: s, text: s }))); srcSel.value = t.source || "Other";
    const link = safeUrl(t.link || "");
    body.append(el("tr", {},
      el("td", {}, el("input", { value: t.company || "", onchange: e => upd("company", e.target.value) })),
      el("td", {}, el("input", { value: t.role || "", onchange: e => upd("role", e.target.value) }), link ? el("a", { class: "mini", href: link, target: "_blank", rel: "noopener", text: "Job link ↗" }) : null),
      el("td", {}, el("input", { type: "date", value: t.appliedOn || "", onchange: e => upd("appliedOn", e.target.value) })),
      el("td", {}, srcSel),
      el("td", {}, stSel, el("div", { class: "note", text: t.lastUpdate ? "Updated " + t.lastUpdate : "" })),
      el("td", {}, el("input", { value: t.nextStep || "", placeholder: "e.g. Prepare DSA", onchange: e => upd("nextStep", e.target.value) })),
      el("td", {}, el("input", { type: "date", value: t.followUp || "", onchange: e => upd("followUp", e.target.value), style: t.followUp && t.followUp < today() && !["Offer", "Rejected", "Withdrawn"].includes(t.status) ? "border-color:#c0392b" : null })),
      el("td", {}, el("textarea", { onchange: e => upd("notes", e.target.value) }, t.notes || ""), t.evidence ? el("div", { class: "note", text: "✉ " + t.evidence }) : null),
      el("td", {}, el("button", { class: "btn", type: "button", title: "Delete", text: "🗑", onclick: () => { if (confirm("Delete " + (t.company || "this row") + "?")) { tracker = tracker.filter(x => x !== t); saveTracker(); renderTracker(); } } }))
    ));
  });
}
const XCOLS = ["Company", "Role", "Location", "Applied On", "Source", "Job Link", "Status", "Last Update", "Next Step", "Follow-up Date", "Recruiter / Contact", "Notes", "Email Evidence"];
const XKEYS = ["company", "role", "location", "appliedOn", "source", "link", "status", "lastUpdate", "nextStep", "followUp", "contact", "notes", "evidence"];
function exportExcel() {
  if (!window.XLSX) { alert("Excel library didn't load. Check your connection and reload."); return; }
  const rows = tracker.map(t => XCOLS.reduce((o, c, i) => { o[c] = t[XKEYS[i]] || ""; return o; }, {}));
  const ws = XLSX.utils.json_to_sheet(rows, { header: XCOLS });
  ws["!cols"] = [22, 34, 18, 12, 14, 36, 20, 12, 26, 13, 22, 34, 40].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Applications");
  XLSX.writeFile(wb, "Job_Application_Tracker_" + today() + ".xlsx");
}
function excelDate(v) { if (v == null || v === "") return ""; if (typeof v === "number") { const d = new Date(Math.round((v - 25569) * 86400000)); return d.toISOString().slice(0, 10); } const d = new Date(v); return isNaN(d) ? String(v) : d.toISOString().slice(0, 10); }
function importExcel(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const wb = XLSX.read(new Uint8Array(fr.result), { type: "array" });
      const ws = wb.Sheets["Applications"] || wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      let added = 0, updated = 0;
      rows.forEach(r => {
        const t = {}; XCOLS.forEach((c, i) => { let v = r[c]; if (["appliedOn", "lastUpdate", "followUp"].includes(XKEYS[i])) v = excelDate(v); t[XKEYS[i]] = v == null ? "" : String(v); });
        if (!t.company || /example row/i.test(t.notes)) return;
        if (!STATUSES.includes(t.status)) t.status = "Applied";
        const ex = tracker.find(x => (x.company || "").toLowerCase() === t.company.toLowerCase() && (x.role || "").toLowerCase() === (t.role || "").toLowerCase());
        if (ex) { Object.keys(t).forEach(k => { if (t[k]) ex[k] = t[k]; }); updated++; }
        else { tracker.push({ uid: "t" + Math.random().toString(36).slice(2, 9), ...t }); added++; }
      });
      saveTracker(); renderTracker(); alert(`Imported: ${added} added, ${updated} updated.`);
    } catch (e) { alert("Couldn't read that file: " + e.message); }
  };
  fr.readAsArrayBuffer(file);
}
function addManual() {
  const d = $("dlg"), b = $("dlgBody"); b.textContent = "";
  const f = {}; const inp = (k, label, type, opts) => { const i = opts ? el("select") : el("input", { type: type || "text" }); if (opts) opts.forEach(o => i.append(el("option", { value: o, text: o }))); f[k] = i; return el("label", {}, label, i); };
  b.append(el("div", { class: "row", style: "justify-content:space-between" }, el("h3", { text: "Add an application" }), el("button", { class: "btn", type: "button", text: "✕", onclick: () => d.close() })));
  b.append(el("div", { class: "form" }, inp("company", "Company *"), inp("role", "Role"), inp("location", "Location"), inp("appliedOn", "Applied on", "date"), inp("source", "Source", null, SOURCES), inp("status", "Status", null, STATUSES), inp("link", "Job link", "url"), inp("followUp", "Follow-up date", "date"), inp("contact", "Recruiter / contact"), inp("notes", "Notes")));
  f.appliedOn.value = today(); f.status.value = "Applied"; f.source.value = "LinkedIn"; f.followUp.value = addDays(today(), 7);
  b.append(el("div", { class: "actions" }, el("button", { class: "btn primary", type: "button", text: "Add to tracker", onclick: () => {
    if (!f.company.value.trim()) { f.company.focus(); return; }
    const t = { uid: "t" + Date.now().toString(36), lastUpdate: today() }; Object.keys(f).forEach(k => t[k] = f[k].value.trim());
    tracker.unshift(t); saveTracker(); renderTracker(); d.close();
  } })));
  d.showModal();
}

// ---------------- Gmail (read-only, in the browser)
const GM_KEY = "jobRadarGmailClientId";
const GM_RULES = [
  ["Offer", /offer letter|pleased to (extend|offer)|delighted to offer|offer of employment|your offer/i],
  ["Rejected", /unfortunately|regret to inform|not (be )?moving forward|move forward with other|other candidates|not been selected|not selected|will not be proceeding|position has been filled|decided not to proceed/i],
  ["Interview Scheduled", /interview|schedule (a|your) (call|discussion)|technical round|hr round|meet the team|invitation to (a )?discussion/i],
  ["Online Assessment", /assessment|online test|coding (test|challenge|round)|hackerrank|codility|hackerearth|mettl|amcat|test link|aptitude|codesignal/i],
  ["Application Received", /thank you for (applying|your application|your interest)|application (has been )?(received|submitted)|we have received your application|successfully applied|application confirmation|application was sent|applied (to|for)|received your application/i]
];
function gmailUI(msg) {
  const box = $("gmailBox"); box.textContent = "";
  const id = LS.get(GM_KEY, "");
  const card = el("div", { class: "card" });
  card.append(el("h2", { text: "Gmail updates" }));
  if (msg) card.append(msg);
  const cid = el("input", { value: id, placeholder: "xxxxxxxx.apps.googleusercontent.com" });
  card.append(el("div", { class: "form" }, el("label", { class: "wide" }, "Google OAuth Client ID (one-time setup)", cid)));
  card.append(el("div", { class: "actions" }, el("button", { class: "btn primary", type: "button", text: "Connect & scan last 60 days", onclick: () => { LS.set(GM_KEY, cid.value.trim()); scanGmail(cid.value.trim()); } }), el("button", { class: "btn", type: "button", text: "Close", onclick: () => box.textContent = "" })));
  card.append(el("details", {}, el("summary", { text: "One-time setup (about 10 minutes, free)" }), el("ol", {},
    el("li", {}, "Open console.cloud.google.com → create a project (any name)."),
    el("li", {}, "APIs & Services → Library → search \"Gmail API\" → Enable."),
    el("li", {}, "OAuth consent screen → External → fill app name + your email → Scopes: add gmail.readonly → Test users: add venkateshragipati048@gmail.com (and anyone else who uses this app)."),
    el("li", {}, "Credentials → Create credentials → OAuth client ID → Web application → Authorized JavaScript origins: " + location.origin + " → Create."),
    el("li", {}, "Copy the Client ID into the box above and click Connect. Google will warn the app is unverified — that's expected for your own test app; continue."),
    el("li", {}, "Access is read-only, the token stays in this browser tab, and no email leaves your browser."))));
  box.append(card);
}

const PLATFORMS = /^(linkedin|naukri|indeed|foundit|monster|instahyre|hackerrank|codility|hackerearth|mettl|glassdoor|internshala|wellfound|angellist|cutshort|superset|unstop|hirist|iimjobs|apna|shine|timesjobs|gmail|googlemail|outlook|yahoo|myworkday|myworkdayjobs|workday|greenhouse|lever|smartrecruiters|icims|successfactors|taleo|oraclecloud|ashbyhq|zohorecruit|keka|darwinbox|freshteam|naukrimail)$/i;
function sourceOf(from) { const f = from.toLowerCase(); return /linkedin/.test(f) ? "LinkedIn" : /naukri/.test(f) ? "Naukri" : "Other"; }
function roleOf(subj) { const r = subj.match(/application (?:received|submitted|confirmation)\s*[:\-–]\s*([^|]{3,60})/i); if (r) return r[1].trim(); const m = subj.match(/(?:for (?:the )?(?:role|position|post) of|for (?:the )?position|application for|applying for|applied for)\s*[:\-]?\s*(?:the\s+)?([A-Z][^|,;–\-]{2,60}?)(?:\s+(?:at|with|role|position)\b|[|,;–]|$)/i); return m ? m[1].trim() : ""; }
function guessCompany(from, subj, snippet) {
  const text = subj + " | " + (snippet || "");
  const pats = [/^(?:\S+\s+)?([A-Z][\w&.]+(?:\s+[A-Z][\w&.]+){0,2}) invites you/, /\b(?:test|assessment|interview|challenge) (?:for|from|with)\s+([A-Z][\w&.]+(?:\s+[A-Z][\w&.]+){0,2})(?=\s*[!.,|–\-]|\s*$)/, /application (?:was )?sent to\s+([^,|–\-:]+)/i, /(?:thank you for (?:applying|your (?:application|interest)) (?:to|at|in|with))\s+([A-Z][\w&. ]{1,40}?)(?=[!.,|–\-]|\s+for\b|$)/i, /your application (?:to|with|at)\s+([A-Z][\w&. ]{1,40}?)(?=[!.,|–\-]|\s+for\b|$)/i, /\bat\s+([A-Z][\w&.]+(?:\s+[A-Z][\w&.]+){0,3})\s*(?:[!.,|–\-]|$)/];
  for (const rx of pats) { const m = rx.source.includes("invites you") ? (snippet || "").match(rx) : /test\|assessment/.test(rx.source) ? subj.match(rx) : text.match(rx); if (m && m[1] && !PLATFORMS.test(m[1].trim())) return m[1].trim().slice(0, 40); }
  const name = (from.match(/^\s*"?([^"<]+?)"?\s*</) || [, ""])[1]
    .replace(/\b(careers?|recruit(ing|ment|er)?s?|talent( acquisition)?( team)?|hiring( team)?|hr( team)?|jobs?|team|no-?reply|do not reply|via workday|notifications?|people|campus|university|india|ta)\b/gi, "")
    .replace(/[|@:\-–]+/g, " ").replace(/\s+/g, " ").trim();
  if (name && name.length >= 2 && !PLATFORMS.test(name) && !/\s@|\d{3,}/.test(name)) return name.slice(0, 40);
  const addr = (from.match(/([a-z0-9._%+-]+)@([a-z0-9.-]+)/i) || [, "", ""]);
  if (/myworkday|workday|icims|taleo|successfactors/i.test(addr[2]) && addr[1] && !/no-?reply|notification|donotreply/i.test(addr[1])) return addr[1].length <= 4 ? addr[1].toUpperCase() : addr[1].charAt(0).toUpperCase() + addr[1].slice(1);
  const dom = addr[2].toLowerCase().split(".");
  const sld = dom.length >= 2 ? dom[dom.length - (/^(co|com|org|net)$/.test(dom[dom.length - 2]) ? 3 : 2)] : "";
  if (sld && !PLATFORMS.test(sld)) return sld.charAt(0).toUpperCase() + sld.slice(1);
  return null;
}
function loadGis() { return new Promise((res, rej) => { if (window.google && google.accounts && google.accounts.oauth2) return res(); const s = el("script", { src: "https://accounts.google.com/gsi/client" }); s.onload = res; s.onerror = () => rej(new Error("Couldn't load Google sign-in")); document.head.append(s); }); }
async function scanGmail(clientId) {
  if (!/apps\.googleusercontent\.com$/.test(clientId)) { gmailUI(el("p", { class: "errmsg", text: "Paste a valid OAuth Client ID first (see setup below)." })); return; }
  try {
    await loadGis();
    const token = await new Promise((res, rej) => {
      const tc = google.accounts.oauth2.initTokenClient({ client_id: clientId, scope: "https://www.googleapis.com/auth/gmail.readonly", callback: r => r.error ? rej(new Error(r.error)) : res(r.access_token) });
      tc.requestAccessToken();
    });
    gmailUI(el("p", { class: "note", text: "Scanning your inbox…" }));
    const api = (p) => fetch("https://gmail.googleapis.com/gmail/v1/users/me/" + p, { headers: { Authorization: "Bearer " + token } }).then(r => { if (!r.ok) throw new Error("Gmail API " + r.status); return r.json(); });
    const q = 'newer_than:60d -in:sent (application OR applying OR applied OR interview OR assessment OR offer OR unfortunately OR shortlisted OR "next steps" OR hackerrank OR codility OR "test link" OR candidature)';
    const list = await api("messages?maxResults=100&q=" + encodeURIComponent(q));
    const msgs = await Promise.all((list.messages || []).map(m => api(`messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`).catch(() => null)));
    const props = [], found = new Map();
    msgs.filter(Boolean).forEach(m => {
      const h = n => ((m.payload.headers || []).find(x => x.name === n) || {}).value || "";
      const subj = h("Subject"), from = h("From"), date = new Date(Number(m.internalDate)).toISOString().slice(0, 10);
      const text = (subj + " " + m.snippet).replace(/&#39;/g, "'");
      const hay = (from + " " + text).toLowerCase();
      const rule = GM_RULES.find(([, rx]) => rx.test(text)); if (!rule) return;
      let matched = false;
      tracker.forEach(t => {
        const words = (t.company || "").toLowerCase().replace(/\(.*?\)/g, "").split(/[^a-z0-9&]+/).filter(w => w.length >= 3 && !["the", "and", "india", "technologies", "technology", "global", "services", "solutions", "limited", "ltd", "pvt", "inc", "group", "tech", "corp", "corporation", "software", "labs", "consulting", "systems", "careers"].includes(w));
        if (!words.length || !words.some(w => new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)").test(hay))) return;
        matched = true;
        const cur = t.status || "Applied", nxt = rule[0];
        const better = nxt === "Offer" || nxt === "Rejected" ? !["Offer", "Rejected", "Withdrawn"].includes(cur) : (RANK[nxt] > (RANK[cur] || 0));
        if (!better) return;
        const prev = props.find(p => p.t === t), cand = { t, status: nxt, date, subj, from };
        if (!prev) props.push(cand);
        else if (RANK[nxt] > RANK[prev.status] || (RANK[nxt] === RANK[prev.status] && date > prev.date)) Object.assign(prev, cand);
      });
      if (!matched) { // an application the tracker doesn't know about yet
        const co = guessCompany(from, subj, m.snippet || ""); if (!co) return;
        const k = co.toLowerCase(); if (tracker.some(t => (t.company || "").toLowerCase() === k)) return;
        const f = found.get(k), cand = { company: co, status: rule[0], date, subj, from, source: sourceOf(from) };
        if (!f) found.set(k, { ...cand, first: date });
        else { if (date < f.first) f.first = date; if (RANK[rule[0]] > RANK[f.status] || (RANK[rule[0]] === RANK[f.status] && date > f.date)) Object.assign(f, cand); }
      }
    });
    const box = el("div"); const checks = [], adds = [];
    const scanned = msgs.filter(Boolean).length;
    if (!props.length && !found.size) box.append(el("p", { class: "okmsg", text: `Scanned ${scanned} recent recruiting emails — nothing new for your tracker.` }));
    if (props.length) {
      box.append(el("b", { text: `Status updates for tracked applications (${props.length})` }));
      props.forEach(p => { const c = el("input", { type: "checkbox" }); c.checked = true; checks.push([c, p]); box.append(el("label", { class: "idea", style: "display:flex;gap:8px;align-items:flex-start" }, c, el("span", {}, el("b", { text: `${p.t.company}: ${p.t.status} → ${p.status}` }), `${p.date} · ${p.subj} · ${p.from.replace(/<.*?>/, "").trim()}`))); });
    }
    if (found.size) {
      box.append(el("b", { text: `Applications found in Gmail that aren't in your tracker (${found.size})` }));
      [...found.values()].sort((a, b) => b.date.localeCompare(a.date)).forEach(f => { const c = el("input", { type: "checkbox" }); c.checked = true; adds.push([c, f]); box.append(el("label", { class: "idea", style: "display:flex;gap:8px;align-items:flex-start" }, c, el("span", {}, el("b", { text: `${f.company} — ${f.status}` }), `${f.date} · ${f.subj} · ${f.from.replace(/<.*?>/, "").trim()}`))); });
      box.append(el("p", { class: "note", text: "Company names are guessed from the sender and subject — untick anything that isn't a job application, and fix names or roles in the table afterwards." }));
    }
    if (props.length || found.size) box.append(el("button", { class: "btn primary", type: "button", text: "Apply selected", onclick: () => {
      checks.forEach(([c, p]) => { if (c.checked) { p.t.status = p.status; p.t.lastUpdate = p.date; p.t.evidence = `${p.date}: ${p.subj}`; } });
      adds.forEach(([c, f]) => { if (c.checked) tracker.unshift({ uid: "t" + Math.random().toString(36).slice(2, 9), company: f.company, role: roleOf(f.subj), appliedOn: f.first, source: f.source, status: f.status, lastUpdate: f.date, followUp: ["Offer", "Rejected"].includes(f.status) ? "" : addDays(f.date, 7), notes: "", evidence: `${f.date}: ${f.subj}` }); });
      saveTracker(); renderTracker(); gmailUI(el("p", { class: "okmsg", text: "Tracker updated." }));
    } }));
    gmailUI(box);
  } catch (e) { gmailUI(el("p", { class: "errmsg", text: "Gmail check failed: " + e.message })); }
}

// ======================================================================
// PROFILE
function toForm(r) {
  const sum = typeof r.summary === "string" ? r.summary : (r.summary || {}).default || "";
  const skills = (r.skills || []).map(g => `${g.group}: ${g.items.join(", ")}`).join("\n");
  const exp = (r.experience || []).map(e => [`## ${e.company} | ${e.location || ""}`, ...(e.roles || []).map(x => `${x.title} | ${x.dates}`), ...(e.bullets || []).map(b => "- " + (typeof b === "string" ? b : b.text))].join("\n")).join("\n\n");
  const proj = (r.projects || []).map(p => [`## ${p.name} | ${p.stack || ""} | ${p.link || ""}`, ...(p.bullets || []).map(b => "- " + b)].join("\n")).join("\n\n");
  const edu = (r.education || []).map(e => [e.degree, e.school, e.dates, e.score].join(" | ")).join("\n");
  const c = r.contact || {};
  return { name: r.name, title: r.title, location: c.location, phone: c.phone, email: c.email, linkedin: c.linkedin, github: c.github, summary: sum, skills, experience: exp, projects: proj, achievements: (r.achievements || []).join("\n"), certifications: (r.certifications || []).join("\n"), education: edu };
}
function fromForm(f, base) {
  const lines = s => (s || "").split("\n").map(x => x.trim()).filter(Boolean);
  const blocks = s => (s || "").split(/\n(?=##\s)/).map(b => b.trim()).filter(b => b.startsWith("##"));
  const r = {};
  r.name = f.name.trim(); r.title = f.title.trim();
  r.contact = { location: f.location.trim(), phone: f.phone.trim(), email: f.email.trim(), linkedin: f.linkedin.trim(), github: f.github.trim() };
  if (base && typeof base.summary === "object") r.summary = { ...base.summary, default: f.summary.trim() }; else r.summary = f.summary.trim();
  r.skills = lines(f.skills).map(l => { const i = l.indexOf(":"); return i > 0 ? { group: l.slice(0, i).trim(), items: l.slice(i + 1).split(",").map(x => x.trim()).filter(Boolean) } : { group: "Skills", items: l.split(",").map(x => x.trim()).filter(Boolean) }; });
  r.experience = blocks(f.experience).map(b => { const ls = b.split("\n").map(x => x.trim()).filter(Boolean); const [company, location] = ls[0].replace(/^##\s*/, "").split("|").map(x => x.trim()); const roles = [], bullets = []; ls.slice(1).forEach(l => { if (/^[-•*]\s*/.test(l)) bullets.push({ text: l.replace(/^[-•*]\s*/, "") }); else { const [title, dates] = l.split("|").map(x => x.trim()); roles.push({ title, dates: dates || "" }); } }); return { company, location: location || "", roles, bullets }; });
  r.projects = blocks(f.projects).map(b => { const ls = b.split("\n").map(x => x.trim()).filter(Boolean); const [name, stack, link] = ls[0].replace(/^##\s*/, "").split("|").map(x => x.trim()); return { name, stack: stack || "", link: link || "", bullets: ls.slice(1).map(l => l.replace(/^[-•*]\s*/, "")) }; });
  r.achievements = lines(f.achievements); r.certifications = lines(f.certifications);
  r.education = lines(f.education).map(l => { const [degree, school, dates, score] = l.split("|").map(x => (x || "").trim()); return { degree, school: school || "", dates: dates || "", score: score || "" }; });
  return r;
}
let editingBase = null;
function showEditor(r, base) {
  editingBase = base || null;
  const f = toForm(r), box = $("profForm"); box.textContent = "";
  const F = [["name", "Full name"], ["title", "Headline (under your name)", "wide"], ["location", "City"], ["phone", "Phone"], ["email", "Email"], ["linkedin", "LinkedIn URL"], ["github", "GitHub URL"],
  ["summary", "Summary (3–4 lines)", "wide", 1], ["skills", "Skills — one group per line:  Languages: Java, Python", "wide", 1], ["experience", "Experience —  ## Company | City   then   Role | Dates   then   - bullet", "wide", 1],
  ["projects", "Projects —  ## Name | Tech stack | link   then   - bullet", "wide", 1], ["achievements", "Achievements — one per line", "wide", 1], ["certifications", "Certifications — one per line", "wide", 1], ["education", "Education — Degree | College | Years | CGPA (one per line)", "wide", 1]];
  F.forEach(([k, label, cls, ta]) => { const i = ta ? el("textarea", { "data-k": k }) : el("input", { "data-k": k }); i.value = f[k] || ""; box.append(el("label", { class: cls || null }, label, i)); });
  $("profEditor").hidden = false; $("profEditor").scrollIntoView({ behavior: "smooth" });
}
function readEditor() { const f = {}; $("profForm").querySelectorAll("[data-k]").forEach(i => f[i.dataset.k] = i.value); return fromForm(f, editingBase); }
function renderProfile() {
  const p = LS.get(PROF, null);
  $("profWho").textContent = p ? `Using your uploaded profile: ${p.name || "(no name)"}. Every "Resume for this job" download is built from it.` : `Using the built-in resume${state.builtin ? " (" + state.builtin.name + ")" : ""}. Upload your own LinkedIn PDF to use yours instead — it stays in this browser only.`;
}
async function handlePdf(file) {
  const msg = $("profMsg"); msg.textContent = "Reading your PDF…"; msg.className = "note";
  try {
    if (!window.pdfjsLib) throw new Error("PDF library didn't load; check your connection.");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const lines = await LinkedInParser.linesFromPdf(await file.arrayBuffer());
    const parsed = LinkedInParser.parseLinkedIn(lines);
    if (!parsed.name) throw new Error("This doesn't look like a LinkedIn profile PDF.");
    const r = LinkedInParser.toResume(parsed);
    msg.className = "okmsg"; msg.textContent = `Read ${parsed.name}: ${parsed.experience.reduce((n, g) => n + g.roles.length, 0)} roles, ${r.skills.reduce((n, g) => n + g.items.length, 0)} skills, ${r.education.length} education entries. Review below, add projects and bullet points, then Save.`;
    showEditor(r, null);
  } catch (e) { msg.className = "errmsg"; msg.textContent = "Couldn't read that PDF: " + e.message; }
}

// ======================================================================
// boot
function showTab(t) {
  state.tab = t; document.querySelectorAll(".tabbtn").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === t)));
  ["jobs", "tracker", "profile"].forEach(x => $("tab-" + x).hidden = x !== t);
  if (t === "tracker") renderTracker(); if (t === "profile") renderProfile(); if (t === "jobs") renderJobs();
}
document.querySelectorAll(".tabbtn").forEach(b => b.onclick = () => showTab(b.dataset.tab));
["ctype", "sal", "sort", "city"].forEach(id => $(id).onchange = e => { state[id] = id === "sal" ? Number(e.target.value) : e.target.value; renderJobs(); });
$("newOnly").onchange = e => { state.newOnly = e.target.checked; renderJobs(); };
$("hideApplied").onchange = e => { state.hideApplied = e.target.checked; renderJobs(); };
$("resetF").onclick = resetFilters;
$("q").addEventListener("input", e => { state.q = e.target.value.trim().toLowerCase(); renderJobs(); });
$("baseResume").onclick = $("profDl").onclick = () => { const r = activeResume(); if (r) downloadPDF(renderResume(r, null), fileBase(null)); };
$("trkAdd").onclick = addManual; $("trkExport").onclick = exportExcel;
$("trkImport").onchange = e => { if (e.target.files[0]) importExcel(e.target.files[0]); e.target.value = ""; };
$("trkFilter").onchange = e => { state.trkFilter = e.target.value; renderTracker(); };
$("gmailBtn").onclick = () => gmailUI(null);
$("liPdf").onchange = e => { if (e.target.files[0]) handlePdf(e.target.files[0]); e.target.value = ""; };
$("profEditBuiltin").onclick = () => { const src = LS.get(PROF, null) || state.builtin; if (src) showEditor(src, src); };
$("profReset").onclick = () => { if (LS.get(PROF, null) && !confirm("Remove your uploaded profile from this browser and use the built-in resume?")) return; LS.del(PROF); $("profEditor").hidden = true; renderProfile(); };
$("profSave").onclick = () => { const r = readEditor(); if (!r.name) { alert("Add your name first."); return; } LS.set(PROF, r); renderProfile(); $("profMsg").className = "okmsg"; $("profMsg").textContent = "Saved. All resume downloads now use this profile."; };
$("profPreview").onclick = () => downloadPDF(renderResume(readEditor(), null), "Preview");
BOARDS.forEach(([n, d, u]) => $("boards").append(el("a", { class: "lk", href: u, target: "_blank", rel: "noopener" }, el("strong", { text: n }), el("span", { text: d }))));
PORTALS.forEach(([n, u]) => $("portals").append(el("a", { class: "lk", href: u, target: "_blank", rel: "noopener" }, el("strong", { text: n }), el("span", { text: new URL(u).hostname.replace(/^www\./, "") }))));
renderControls(); renderTrackerCount();
const nocache = { cache: "no-store" };
fetch("resume/resume.json?t=" + Date.now(), nocache).then(r => r.json()).then(r => { state.builtin = r; renderProfile(); }).catch(() => { });
Promise.all([
  fetch("config/companies.json?t=" + Date.now(), nocache).then(r => r.json()).catch(() => ({})),
  fetch("data/jobs.json?t=" + Date.now(), nocache).then(r => r.json())
]).then(([cm, b]) => {
  ["product", "service"].forEach(t => (cm[t] || []).forEach(n => COMPANY_MAP[n.toLowerCase()] = t));
  (b.jobs || []).forEach(enrich);
  state.board = b; renderStamp(); renderCityOptions(); renderJobs();
}).catch(() => { state.board = null; renderStamp(); renderJobs(); });
