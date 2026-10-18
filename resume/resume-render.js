// Resume renderer: renderResume(resume, job) -> full HTML document string.
// job is optional {role, company, tracks:[], category, keywords:[], headline, extraSkills:[]}.
// Works with the hand-written resume.json and with profiles built from a LinkedIn PDF
// (missing tags, single summary, no projects are all fine).
(function (root) {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TRACK_RX = {
    "AI/ML": /\b(ai|ml|machine learning|genai|llm|scikit|tensorflow|pytorch|model|nlp|data scien|prompt)/i,
    "DevOps": /\b(devops|cloud|aws|azure|gcp|docker|kubernetes|ci\/cd|deploy|vercel|render|serverless|linux|infra)/i,
    "Python": /\b(python|fastapi|flask|django|pandas|pytest)/i,
    "Java": /\b(java\b|spring|hibernate|junit|maven)/i,
    "SDE": /\b(api|backend|front ?end|full[- ]?stack|react|database|sql|built|developed|application)/i
  };
  const autoTags = text => Object.keys(TRACK_RX).filter(k => TRACK_RX[k].test(text || ""));
  const bText = b => typeof b === "string" ? b : (b && b.text) || "";
  const bTags = b => (b && b.tags) || autoTags(bText(b));

  function pickSummary(r, job) {
    const s = r.summary || "";
    if (typeof s === "string") return s;
    if (!job) return s.default || "";
    if (job.category === "non-technical") return s.nontech || s.default || "";
    const order = ["AI/ML", "DevOps", "Python", "Java", "SDE"];
    const t = order.find(x => (job.tracks || []).includes(x));
    return (t && s[t]) || s.default || "";
  }

  function scoreTags(tags, job) {
    if (!job) return 0;
    return (tags || []).reduce((s, t) => s + ((job.tracks || []).includes(t) ? 2 : 0) + (t === "all" ? 5 : 0), 0);
  }

  function kwHits(text, job) {
    const t = String(text || "").toLowerCase();
    return ((job && job.keywords) || []).reduce((n, k) => n + (t.includes(String(k).toLowerCase()) ? 1 : 0), 0);
  }

  function orderSkills(r, job) {
    const words = ((job && (job.role + " " + (job.keywords || []).join(" "))) || "").toLowerCase();
    return (r.skills || []).filter(g => g.items && g.items.length).map(g => {
      const items = [...g.items].sort((a, b) =>
        (words.includes(b.toLowerCase().split(" ")[0]) ? 1 : 0) - (words.includes(a.toLowerCase().split(" ")[0]) ? 1 : 0));
      return { group: g.group, items };
    });
  }

  function renderResume(r, job) {
    const projects = (r.projects || [])
      .map((p, i) => ({ p, i, s: scoreTags(p.tags || autoTags(p.stack + " " + (p.bullets || []).join(" ")), job) + kwHits(p.stack + " " + (p.bullets || []).join(" "), job) }))
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .slice(0, 2)
      .map(x => x.p);
    const c = r.contact || {};
    const exp = (r.experience || []).map(e => {
      const bullets = (e.bullets || [])
        .map((b, i) => ({ b, i, s: scoreTags(bTags(b), job) + kwHits(bText(b), job) }))
        .sort((a, b) => b.s - a.s || a.i - b.i)
        .slice(0, job ? 5 : 6)
        .map(x => bText(x.b))
        .filter(Boolean);
      return `<div class="item">
        <div class="row"><b>${esc(e.company)}</b><span>${esc(e.location)}</span></div>
        ${(e.roles || []).map(ro => `<div class="row sub"><span>${esc(ro.title)}</span><span>${esc(ro.dates)}</span></div>`).join("")}
        ${bullets.length ? `<ul>${bullets.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}</div>`;
    }).join("");
    const extra = (job && job.extraSkills && job.extraSkills.length)
      ? `<div class="skill"><b>Currently learning:</b> ${job.extraSkills.map(esc).join(", ")}</div>` : "";
    const ach = r.achievements || [];
    const certs = (r.certifications || []).filter(x => !ach.join(" ").includes(x));
    const achBlock = (ach.length || certs.length)
      ? `<h2>${ach.length ? "Achievements &amp; Certifications" : "Certifications"}</h2>` +
        (ach.length ? `<ul>${ach.map(a => `<li>${esc(a)}</li>`).join("")}${certs.length ? `<li>Certifications: ${certs.map(esc).join(", ")}</li>` : ""}</ul>`
                    : `<p>${certs.map(esc).join(" &nbsp;•&nbsp; ")}</p>`) : "";

    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.name)} – Resume${job ? " – " + esc(job.company) : ""}</title>
<style>
@page{size:A4;margin:11mm 13mm}
*{box-sizing:border-box}
body{font-family:Calibri,"Segoe UI",Arial,sans-serif;font-size:10pt;line-height:1.28;color:#111;margin:0}
h1{font-size:20pt;margin:0;letter-spacing:.5px}
.tag{font-size:10.5pt;color:#333;margin:2px 0 4px}
.contact{font-size:9.4pt;color:#333}
h2{font-size:10.5pt;text-transform:uppercase;letter-spacing:1px;border-bottom:1.2px solid #222;margin:8px 0 3px;padding-bottom:1px}
.row{display:flex;justify-content:space-between;gap:10px}
.sub{font-style:italic;color:#222}
.item{margin-bottom:5px;break-inside:avoid}
ul{margin:2px 0 0 0;padding-left:16px}
li{margin:1px 0}
.skill{margin:1px 0}
.stack{font-size:9.3pt;color:#444}
p{margin:0}
</style></head><body>
<h1>${esc(r.name)}</h1>
<div class="tag">${esc(job && job.headline ? job.headline : r.title)}</div>
<div class="contact">${[c.location, c.phone, c.email, c.linkedin, c.github].filter(Boolean).map(esc).join(" &nbsp;|&nbsp; ")}</div>
${pickSummary(r, job) ? `<h2>Summary</h2><p>${esc(pickSummary(r, job))}</p>` : ""}
<h2>Skills</h2>${orderSkills(r, job).map(g => `<div class="skill"><b>${esc(g.group)}:</b> ${g.items.map(esc).join(", ")}</div>`).join("")}${extra}
${exp ? `<h2>Experience</h2>${exp}` : ""}
${projects.length ? `<h2>Projects</h2>${projects.map(p => `<div class="item">
  <div class="row"><b>${esc(p.name)}</b><span class="stack">${esc(p.link || "")}</span></div>
  ${p.stack ? `<div class="stack">${esc(p.stack)}</div>` : ""}
  <ul>${(p.bullets || []).slice(0, job ? 2 : 3).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}` : ""}
${achBlock}
${(r.education || []).length ? `<h2>Education</h2>${r.education.map(e => `<div class="row"><span><b>${esc(e.degree)}</b>, ${esc(e.school)}${e.score ? " — " + esc(e.score) : ""}</span><span>${esc(e.dates)}</span></div>`).join("")}` : ""}
</body></html>`;
  }
  root.renderResume = renderResume;
  if (typeof module !== "undefined") module.exports = { renderResume };
})(typeof window !== "undefined" ? window : globalThis);
