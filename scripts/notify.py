#!/usr/bin/env python3
"""
Send the new jobs from the latest refresh to Telegram and/or e-mail.

Runs in the GitHub Action right after fetch_jobs.py. Each channel is used only
when its secrets exist, so with no secrets this script does nothing:

  Telegram : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
  E-mail   : ALERT_EMAIL_USER (a Gmail address), ALERT_EMAIL_PASS (a Gmail App Password),
             ALERT_EMAIL_TO (optional, defaults to ALERT_EMAIL_USER)

Filters live in config/alerts.json.
"""
import html
import json
import os
import smtplib
import sys
import urllib.parse
import urllib.request
from email.mime.text import MIMEText

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(ROOT, "config", "alerts.json")))
board = json.load(open(os.path.join(ROOT, "data", "jobs.json")))
try:
    status = json.load(open(os.path.join(ROOT, "data", "sources-status.json")))
except (OSError, ValueError):
    status = {"sources": []}


def wanted(j):
    if not j.get("isNew"):
        return False
    if cfg.get("categories") and j.get("category", "technical") not in cfg["categories"]:
        return False
    if cfg.get("companyTypes") and j.get("companyType", "unknown") not in cfg["companyTypes"]:
        return False
    if cfg.get("officialLinksOnly") and j.get("sourceType") != "official":
        return False
    kws = [k.lower() for k in cfg.get("keywords", [])]
    if not kws:
        return True
    hay = " ".join([j.get("role", ""), " ".join(j.get("keywords", [])), " ".join(j.get("tracks", []))]).lower()
    return any(k in hay for k in kws)


jobs = [j for j in board.get("jobs", []) if wanted(j)]
jobs.sort(key=lambda j: (j.get("sourceType") != "official", j.get("companyType") != "product"))
broken = [s for s in status.get("sources", []) if not s.get("ok") and s.get("failStreak", 0) >= cfg.get("warnAfterFailedRuns", 3)]
if not jobs and not broken:
    print("Nothing new to send.")
    sys.exit(0)

limit = cfg.get("maxJobsPerAlert", 20)
shown, more = jobs[:limit], max(0, len(jobs) - limit)
app = cfg.get("appUrl", "")


def line_txt(j):
    sal = (j.get("salary") or {}).get("text", "")
    return f"• {j['company']} — {j['role']} ({j.get('location', '')}){' · ' + sal if sal else ''}\n  {j.get('applyUrl', '')}"


def line_html(j):
    e = html.escape
    sal = (j.get("salary") or {}).get("text", "")
    return (f"• <b>{e(j['company'])}</b> — <a href=\"{e(j.get('applyUrl', ''))}\">{e(j['role'])}</a>"
            f" ({e(j.get('location', ''))}){' · ' + e(sal) if sal else ''}")


head = f"🔔 {len(jobs)} new job{'s' if len(jobs) != 1 else ''} matching your alerts"
warn = (f"\n\n⚠️ {len(broken)} job source(s) failing for {cfg.get('warnAfterFailedRuns', 3)}+ runs: "
        + ", ".join(s["name"] for s in broken)) if broken else ""
sent = False
tried = False

tok, chat = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
if tok and chat:
    tried = True
    body = [f"<b>{html.escape(head)}</b>"] + [line_html(j) for j in shown]
    if more:
        body.append(f"…and {more} more.")
    if app:
        body.append(f'\n<a href="{html.escape(app)}">Open Job Radar</a>')
    text = "\n".join(body) + html.escape(warn)
    chunks, cur = [], ""
    for ln in text.split("\n"):
        if len(cur) + len(ln) > 3800:
            chunks.append(cur)
            cur = ""
        cur += ln + "\n"
    chunks.append(cur)
    for c in chunks:
        data = urllib.parse.urlencode({"chat_id": chat, "text": c, "parse_mode": "HTML", "disable_web_page_preview": "true"}).encode()
        try:
            urllib.request.urlopen(f"https://api.telegram.org/bot{tok}/sendMessage", data=data, timeout=20).read()
            sent = True
        except Exception as e:
            print("Telegram failed:", e)

user, pw = os.environ.get("ALERT_EMAIL_USER"), os.environ.get("ALERT_EMAIL_PASS")
if user and pw:
    tried = True
    to = os.environ.get("ALERT_EMAIL_TO") or user
    items = "".join(f"<li style='margin:6px 0'>{line_html(j)[2:]}</li>" for j in shown)
    htm = (f"<h3 style='font-family:Arial'>{html.escape(head)}</h3><ul style='font-family:Arial;font-size:14px'>{items}</ul>"
           + (f"<p>…and {more} more.</p>" if more else "")
           + (f"<p><a href='{html.escape(app)}'>Open Job Radar</a></p>" if app else "")
           + (f"<p style='color:#9a5b00'>{html.escape(warn.strip())}</p>" if warn else ""))
    msg = MIMEText(htm, "html", "utf-8")
    msg["Subject"], msg["From"], msg["To"] = head.replace("🔔 ", "Job Radar: "), user, to
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
            s.login(user, pw)
            s.sendmail(user, [x.strip() for x in to.split(",")], msg.as_string())
        sent = True
    except Exception as e:
        print("E-mail failed:", e)

print("Alert sent." if sent else ("Alert could not be sent (see errors above)." if tried else "No alert channel configured (add the GitHub secrets to enable)."))
if tried and not sent:
    sys.exit(1)
