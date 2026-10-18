# Fresher Job Radar

A one-page dashboard of software job openings for 0–2 years of experience (SDE-1 / Associate / Junior roles) in India and India-eligible remote, grouped by company, with direct apply links.

Tracks: SDE, Python, Java, DevOps, AI/ML.

## How it works

**Jobs tab** — filters for role type (technical / non-technical), track, city, product vs service company, salary, new only and hide applied. Each job has Apply, **Resume for this job**, Mark applied, and LinkedIn / Naukri search links.

**Tracker tab** — every "Mark applied" lands here; add applications from anywhere else with "Add application". Edit status, next step, follow-up date and notes inline. Export / import Excel (same columns as `Job_Application_Tracker.xlsx`). Saved in your browser, so export as a backup.

**Gmail updates** — "Check Gmail for updates" reads recent recruiting emails (read-only, inside your browser) and suggests status changes (assessment, interview, rejection, offer) for tracked companies; you approve each one. Needs a free Google OAuth Client ID once — the setup steps are shown in the app.

**Profile & resume tab** — anyone can upload their LinkedIn "Save to PDF" file; it is parsed in the browser into an editable profile (add projects and bullets), and all tailored resumes then use it. Nothing is uploaded anywhere. Without an uploaded profile, `resume/resume.json` (the owner's resume) is used.

Files: `index.html` + `app.js` (the app), `resume/` (resume data, template, LinkedIn parser), `data/jobs.json` (refreshed by the GitHub Action at 06:57 / 18:57 IST via `scripts/fetch_jobs.py`), `config/sources.json` (companies checked), `config/companies.json` (product / service labels).

Salaries: a figure stated in the posting is shown as is; otherwise a typical fresher range for that company type, marked *est.*
