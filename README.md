# Fresher Job Radar

A one-page dashboard of software job openings for 0–2 years of experience (SDE-1 / Associate / Junior roles) in India and India-eligible remote, grouped by company, with direct apply links.

Tracks: SDE, Python, Java, DevOps, AI/ML.

## How it works

- `index.html` — the dashboard. Filters: role type (technical / non-technical), track, product vs service company, salary, new only, hide applied.
- **Resume for this job** — every job has a button that builds a one-page, ATS-friendly resume tailored to that role (summary, skill order, experience bullets, best two projects) and downloads it as PDF or Word. It shows the keyword match, missing skills and a project idea for each gap. Runs in the browser; no server or API key.
- `resume/resume.json` — your resume data. Edit this file to update the resume everywhere. `resume/resume-render.js` is the template.
- `data/jobs.json` — the job list, rewritten by a free **GitHub Action** (`.github/workflows/refresh-jobs.yml`) at **06:57 and 18:57 IST** using `scripts/fetch_jobs.py`.
- `config/sources.json` — companies and feeds the fetcher checks. `config/companies.json` — product / service labels.

Salaries: when a posting states a figure it is shown as is; otherwise a typical fresher range for that company type is shown and marked *est.*

LinkedIn and Naukri don't allow automatic collection, so each job has LinkedIn / Naukri search links and the page has pre-filtered board searches.
