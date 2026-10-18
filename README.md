# Fresher Job Radar

A one-page dashboard of software job openings for 0–3 years of experience (SDE-1 / Associate / Junior roles) in India and India-eligible remote, grouped by company, with direct apply links.

Tracks: SDE, Python, Java, DevOps, AI/ML.

## How it works

**Jobs tab** — filters for role type (technical / non-technical), track, city, product vs service company, salary, new only and hide applied. Each job has Apply, **Resume for this job**, Mark applied, and LinkedIn / Naukri search links.

**Tracker tab** — every "Mark applied" lands here; add applications from anywhere else with "Add application". Edit status, next step, follow-up date and notes inline. Export / import Excel (same columns as `Job_Application_Tracker.xlsx`). Saved in your browser, so export as a backup.

**Gmail updates** — "Check Gmail for updates" → Sign in with Google. Reads recent recruiting emails (read-only, inside the browser), suggests status changes for tracked companies and finds applications not yet tracked; the user approves each one. The app's Google Client ID is in `config/app.json`. While the Google app is in Testing mode, every user's Gmail must be added as a test user (Google Auth Platform → Audience → Test users, up to 100).

**Profile & resume tab** — every user builds their own profile: upload a LinkedIn "Save to PDF" file (parsed in the browser) or fill the form, add projects and bullets. Saved only in that browser; "Save profile file" / "Load profile file" move it between devices. There is no server or database, and no resume is built into the app.

Files: `index.html` + `app.js` (the app), `resume/` (resume template and LinkedIn parser), `data/jobs.json` (refreshed by the GitHub Action at 06:57 / 18:57 IST via `scripts/fetch_jobs.py`), `config/sources.json` (companies checked), `config/companies.json` (product / service labels).

Salaries: a figure stated in the posting is shown as is; otherwise a typical fresher range for that company type, marked *est.*

## Install as an app

The site is a Progressive Web App: it installs to the home screen / desktop, opens full-screen with its own icon, and works offline with the last job list it downloaded.

- **Android (Chrome):** tap **Install app** at the top, or ⋮ → *Install app*.
- **iPhone (Safari):** Share → *Add to Home Screen*.
- **Windows / Mac (Chrome or Edge):** the install icon in the address bar, or the **Install app** button.

Updates arrive automatically whenever the repo changes. `manifest.webmanifest`, `sw.js` and `icons/` make this work.

## New in this version

- **Match %** on every job and a **Best match for me** sort (needs your profile). **Recently posted** sort and "Posted 2d ago" on cards; **+N SIMILAR** marks the same role listed for other cities or sites.
- **🎯 Prepare** on every job: links to past interview questions (Glassdoor, AmbitionBox, GeeksforGeeks, LeetCode, YouTube), people to ask for referrals, a topic checklist, plus a ready **referral message** and **cover letter** written from your profile.
- **Tracker:** Progress charts (applications per week, funnel, response rate by source and company type), **📅 Add to Google Calendar** per follow-up and **Follow-ups to calendar** (.ics for any calendar app).
- **Data sources panel** (bottom of the Jobs tab): which company sites worked in the last refresh, which are failing and since when.

## Daily alerts (optional)

After each refresh, `scripts/notify.py` sends new jobs that match `config/alerts.json` (keywords, role type, company type). Add GitHub secrets under **Settings → Secrets and variables → Actions → New repository secret**:

- **Telegram:** `TELEGRAM_BOT_TOKEN` (from @BotFather → /newbot) and `TELEGRAM_CHAT_ID` (send your bot a message, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `chat.id`).
- **E-mail:** `ALERT_EMAIL_USER` (your Gmail), `ALERT_EMAIL_PASS` (a Gmail **App Password**: Google Account → Security → 2-Step Verification → App passwords), optional `ALERT_EMAIL_TO`.

With no secrets the step does nothing. It also warns when a job source has failed several runs in a row.
