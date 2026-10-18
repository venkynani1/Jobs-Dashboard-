# Fresher Job Radar — AI handoff / project context

Give this file (plus the repo) to any AI assistant so it can continue the work without the original chat.
Last updated: 18 Oct 2026 (version 6). Owner: Venkatesh Ragipati (GitHub `venkynani1`).

---

## 1. What the app is

A free, installable web app (PWA) for job seekers in India:

- **Jobs tab** – software-industry jobs (0–3 years experience) in India + India-remote, grouped by company. Filters: role type (technical / non-technical), track (SDE, Python, Java, DevOps, AI/ML), city, product vs service company, salary, new only, hide applied. Sorts: company, newest found, salary, recently posted, best match.
- **Resume for this job** – builds a one-page, ATS-friendly resume tailored to the job from the user's own profile; download as PDF (browser print) or Word.
- **🎯 Prepare** – interview-prep links + checklist, a LinkedIn referral note, a full referral message and a cover letter, all generated from the profile.
- **Tracker tab** – application tracker (status, follow-up, notes), progress charts, Excel import/export, Google Calendar / .ics follow-ups, and **Gmail scan** that suggests status updates and finds untracked applications.
- **Profile & resume tab** – each user uploads their LinkedIn "Save to PDF" (parsed in the browser) or fills a form. Saved in the browser only; export/import as a .json file.

Live: https://jobsdashboard54.vercel.app (Vercel, deploys from GitHub `venkynani1/Jobs-Dashboard-`, branch `main`).

## 2. Hard rules (the owner's decisions — keep them)

1. **No server, no database, no paid services.** Everything runs in the browser or in the free GitHub Action. Personal data (profile, tracker) lives only in the user's browser (localStorage).
2. **Must keep working without any AI subscription.** No AI API calls at runtime.
3. **No built-in personal resume.** The owner's resume is NOT in the repo; he loads `Venkatesh_Ragipati_profile.json` (kept privately) via "Load profile file".
4. **Honest resumes.** Never add skills the user doesn't have as experience. Missing skills may only appear under "Currently learning", plus project ideas to close the gap.
5. **No scraping LinkedIn / Naukri** (their terms forbid it). Only links/searches to them. Jobs come from public company career APIs and fresher-site RSS feeds.
6. **Gmail access is read-only and in-browser.** One shared Google OAuth Client ID in `config/app.json`; the Google app is in *Testing* mode, so every user's Gmail must be added as a test user (Google Auth Platform → Audience → Test users, max 100).
7. Scope stays **0–3 years** (fetcher `MAX_YEARS = 3`; the app also hides anything needing more). An "any experience level" filter was built and then **deliberately reverted** by the owner — don't re-add unless asked.

## 3. Repo map

| Path | What it does |
|---|---|
| `index.html` | Page markup + CSS (light/dark), tabs, dialogs. Loads SheetJS 0.18.5 and pdf.js 3.11.174 from cdnjs. |
| `app.js` | All app logic: filters, job cards, match score, resume dialog, Prepare dialog, tracker, Excel, Gmail scan, calendar, progress charts, profile editor, PWA install. |
| `resume/resume-render.js` | `renderResume(profile, job)` → resume HTML (one page, ATS-friendly). Reorders summary/skills/bullets/projects by job keywords & tracks. |
| `resume/linkedin-parser.js` | LinkedIn PDF → lines (pdf.js) → sections → profile JSON. Two-column layout heuristics. |
| `scripts/fetch_jobs.py` | Runs in GitHub Actions. Pulls jobs from Amazon, Workday, Greenhouse, Lever, SmartRecruiters APIs and RSS feeds; filters entry-level software roles in India; tags category, companyType, salary (stated or estimated), keywords, postedOn, similar; merges with existing list; writes `data/jobs.json` and `data/sources-status.json`. |
| `scripts/notify.py` | After each refresh: sends new matching jobs to Telegram and/or e-mail (only if GitHub secrets exist). |
| `config/sources.json` | Company sources the fetcher checks (type + ids). |
| `config/companies.json` | Product / service labels for company names. |
| `config/alerts.json` | Alert keywords/filters + app URL. |
| `config/app.json` | `{"gmailClientId": "..."}` – public OAuth client id (not a secret). |
| `data/jobs.json` | The job list (written by the Action — don't hand-edit). |
| `data/sources-status.json` | Per-source ok/fail, count, last success, fail streak. |
| `.github/workflows/refresh-jobs.yml` | Cron 06:57 & 18:57 IST (`27 1,13 * * *` UTC) + manual run. Fetch → commit `data/` with rebase-retry → notify. Needs *Settings → Actions → Workflow permissions: Read and write*. |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA: install, offline cache (network-first for own files, cache-first for CDN). Bump `VERSION` in `sw.js` when changing cached files. |

## 4. Data shapes

**Job** (`data/jobs.json` → `jobs[]`):
```json
{"id":"slug","company":"","role":"","location":"","experience":"0-2 years","category":"technical|non-technical",
 "tracks":["SDE","Java"],"keywords":["Java","AWS"],"applyUrl":"","careersUrl":"","sourceType":"official|aggregator",
 "source":"greenhouse|lever|workday|amazon|smartrecruiters|rss:<name>","foundOn":"18 Oct","postedOn":"2026-10-16",
 "isNew":true,"companyType":"product|service|unknown","similar":1,
 "salary":{"min":8,"max":20,"estimated":true,"text":"₹8–20 LPA (est.)"}}
```
Board: `{"refreshedAt": ISO+05:30, "nextRefreshAt": ISO, "jobs": [...]}`. Jobs from API sources are removed when the company's site answers without them (closed); others age out after 45 days; cap 220.

**Profile** (localStorage `jobRadarProfile`, same as the exported .json):
```json
{"name":"","title":"","contact":{"location":"","phone":"","email":"","linkedin":"","github":""},
 "summary":"text  OR  {\"default\":\"\",\"SDE\":\"\",\"Java\":\"\",\"Python\":\"\",\"DevOps\":\"\",\"AI/ML\":\"\",\"nontech\":\"\"}",
 "skills":[{"group":"Languages","items":["Java"]}],
 "experience":[{"company":"","location":"","roles":[{"title":"","dates":""}],"bullets":[{"text":"","tags":["SDE","all"]}]}],
 "projects":[{"name":"","stack":"","link":"","tags":[],"bullets":[""]}],
 "achievements":[""],"certifications":[""],"education":[{"degree":"","school":"","dates":"","score":""}]}
```
**Tracker row** (localStorage `jobRadarTracker`): `uid, jobId, company, role, location, link, appliedOn, source, status, lastUpdate, nextStep, followUp, contact, notes, evidence`.
Statuses: Saved, Applied, Application Received, Online Assessment, Interview Scheduled, Interviewed, HR / Offer Discussion, Offer, Rejected, No Response, Withdrawn.
Other localStorage keys: `jobRadarPrep` (checklist ticks), `jobRadarGmailClientId` (optional override).
Excel columns (import/export + `Job_Application_Tracker.xlsx` template): Company, Role, Location, Applied On, Source, Job Link, Status, Last Update, Next Step, Follow-up Date, Recruiter / Contact, Notes, Email Evidence.

## 5. Accounts & settings already in place

- GitHub repo `venkynani1/Jobs-Dashboard-` (should be **private**; Vercel deploys it).
- Google Cloud project with Gmail API, OAuth consent in Testing, Web client with origin `https://jobsdashboard54.vercel.app`; client id in `config/app.json`.
- Optional GitHub secrets for alerts: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `ALERT_EMAIL_USER`, `ALERT_EMAIL_PASS` (Gmail App Password), `ALERT_EMAIL_TO`.
- The old Claude scheduled task ("Job Radar refresh") is **disabled**; the GitHub Action replaced it.

## 6. How to work on it

- **Run locally:** `python3 -m http.server` in the repo root → http://localhost:8000 (opening the file directly breaks `fetch`).
- **Refresh jobs locally:** `python3 scripts/fetch_jobs.py` (needs internet; prints ok/FAIL per source).
- **Deploy:** commit to `main` → Vercel redeploys; installed apps update on next open.
- **Add a company:** add an entry to `config/sources.json` (Workday needs host/tenant/site; Greenhouse `token`; Lever `site`; SmartRecruiters `id`), label it in `config/companies.json`, run the Action, check the Data sources panel.
- Keep the resume **one page**: tailored resumes show 5 experience bullets and 2 projects × 2 bullets.
- Test in a phone-width viewport (390px): no horizontal page scroll.

## 7. Known limitations

- Match % and tracks are keyword-based (no AI). Claude-researched legacy jobs have few keywords.
- Some sources in `config/sources.json` may fail (sites change) — see the Data sources panel.
- Gmail company detection is heuristic; every change needs user approval.
- Tracker/profile are per browser and per site address; use Excel / profile-file export to move them.

## 8. Ideas not done yet (owner said "later")

1. Sync tracker/profile across devices via the user's own Google Drive (no database).
2. Play Store listing (wrap the PWA as a TWA, $25 one-time).
3. Google verification so any Gmail can sign in without being a test user (needs a paid security assessment).

---

### Starter prompt for a new AI assistant

> I'm continuing development of my app "Fresher Job Radar". Read `AI_HANDOFF.md` first, then the files it lists. Follow the hard rules in section 2 exactly (no server/database, no runtime AI, honest resumes, no LinkedIn/Naukri scraping, 0–3 years scope). Before changing code, tell me which files you'll touch. Give me complete updated files I can upload to GitHub. My request: …
