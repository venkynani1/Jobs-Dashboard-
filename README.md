# Fresher Job Radar

A one-page dashboard of software job openings for 0–2 years of experience (SDE-1 / Associate / Junior roles) in India and India-eligible remote, grouped by company, with direct apply links.

Tracks: SDE, Python, Java, DevOps, AI/ML.

## How it works

- `index.html` — the dashboard. Search, filter by track, mark jobs as applied (saved in your browser).
- `data/jobs.json` — the job list. A Claude scheduled task researches the web at **06:57 and 18:57 IST** every day and rewrites this file.
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
