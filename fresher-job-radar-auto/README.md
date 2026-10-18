# Fresher Job Radar

A one-page dashboard of software job openings for 0–2 years of experience (SDE-1 / Associate / Junior roles) in India and India-eligible remote, grouped by company, with direct apply links.

Tracks: SDE, Python, Java, DevOps, AI/ML.

## How it works

- `index.html` — the dashboard. Search, filter by track, mark jobs as applied (saved in your browser).
- `data/jobs.json` — the job list. A free **GitHub Action** (`.github/workflows/refresh-jobs.yml`) runs at **06:57 and 18:57 IST** every day, runs `scripts/fetch_jobs.py`, and commits the updated file. GitHub Pages then redeploys the site. No Claude subscription or API key is needed.
- `config/sources.json` — the companies and feeds the fetcher checks: Amazon, Workday career sites, Greenhouse, Lever and SmartRecruiters boards, and RSS feeds from fresher job sites. Add or remove entries here.

## Automatic refresh

1. **Settings → Actions → General → Workflow permissions:** choose *Read and write permissions* and save.
2. **Actions tab → Refresh jobs → Run workflow** to test it once. The log shows `ok` or `FAIL` for each source.
3. After that it runs on its own twice a day. Jobs that disappear from a company's site are removed; listing-site jobs drop off after 45 days.
- Also includes pre-filtered "last 24 hours / entry level" searches on LinkedIn, Naukri and Indeed, plus official career portals for 30+ companies.

## Run it

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root. The site will be at `https://venkynani1.github.io/Jobs-Dashboard-/`.
- **Locally:** `python3 -m http.server` in this folder, then open http://localhost:8000 (opening the file directly blocks loading `jobs.json`).

## Job record format

```json
{
  "id": "amazon-sde1-2026",
  "company": "Amazon",
  "role": "Software Dev Engineer I",
  "location": "Bengaluru",
  "experience": "Freshers",
  "batch": "2026 grads only",
  "tracks": ["SDE", "Java"],
  "applyUrl": "https://...",
  "careersUrl": "https://...",
  "sourceType": "official | aggregator",
  "foundOn": "14 Oct",
  "isNew": true
}
```

Links marked **VIA LISTING** point to fresher job-listing sites. Confirm on the company's own careers page before submitting anything.
