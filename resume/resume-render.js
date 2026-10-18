// Resume renderer: renderResume(resume, job) -> full HTML document string.
// job is optional {role, company, tracks:[], category:"technical"|"non-technical"}.
// Works in the browser (window.renderResume) and in Node (module.exports).
(function (root) {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function pickSummary(r, job) {
    if (!job) return r.summary.default;
    if (job.category === "non-technical") return r.summary.nontech || r.summary.default;
    const order = ["AI/ML", "DevOps", "Python", "Java", "SDE"];
    const t = order.find(x => (job.tracks || []).includes(x));
    return (t && r.summary[t]) || r.summary.default;
  }

  function scoreTags(tags, job) {
    if (!job) return 0;
    return (tags || []).reduce((s, t) => s + ((job.tracks || []).includes(t) ? 2 : 0) + (t === "all" ? 5 : 0), 0);
  }

  function kwHits(text, job) {
    const t = String(text || "").toLowerCase();
    return ((job && job.keywords) || []).reduce((n, k) => n + (t.includes(String(k).toLowerCase()) ? 1 : 0), 0);
  }

  function jobWords(job) {
    return ((job && (job.role + " " + (job.keywords || []).join(" "))) || "").toLowerCase();
  }

  function orderSkills(r, job) {
    const words = jobWords(job);
    return r.skills.map(g => {
      const items = [...g.items].sort((a, b) =>
        (words.includes(b.toLowerCase().split(" ")[0]) ? 1 : 0) - (words.includes(a.toLowerCase().split(" ")[0]) ? 1 : 0));
      return { group: g.group, items };
    });
  }

  function renderResume(r, job) {
    const projects = [...r.projects]
      .map((p, i) => ({ p, i, s: scoreTags(p.tags, job) + kwHits(p.stack + " " + p.bullets.join(" "), job) }))
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .slice(0, 2)
      .map(x => x.p);
    const c = r.contact;
    const exp = r.experience.map(e => {
      const bullets = e.bullets
        .map((b, i) => ({ b, i, s: scoreTags(b.tags, job) + kwHits(b.text, job) }))
        .sort((a, b) => b.s - a.s || a.i - b.i)
        .slice(0, job ? 5 : 6)
        .map(x => x.b.text);
      return `<div class="item">
        <div class="row"><b>${esc(e.company)}</b><span>${esc(e.location)}</span></div>
        ${e.roles.map(ro => `<div class="row sub"><span>${esc(ro.title)}</span><span>${esc(ro.dates)}</span></div>`).join("")}
        <ul>${bullets.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>`;
    }).join("");
    const extra = (job && job.extraSkills && job.extraSkills.length)
      ? `<div class="skill"><b>Currently learning:</b> ${job.extraSkills.map(esc).join(", ")}</div>` : "";

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
<div class="contact">${[c.location, c.phone, c.email, c.linkedin, c.github].map(esc).join(" &nbsp;|&nbsp; ")}</div>
<h2>Summary</h2><p>${esc(pickSummary(r, job))}</p>
<h2>Skills</h2>${orderSkills(r, job).map(g => `<div class="skill"><b>${esc(g.group)}:</b> ${g.items.map(esc).join(", ")}</div>`).join("")}${extra}
<h2>Experience</h2>${exp}
<h2>Projects</h2>${projects.map(p => `<div class="item">
  <div class="row"><b>${esc(p.name)}</b><span class="stack">${esc(p.link)}</span></div>
  <div class="stack">${esc(p.stack)}</div>
  <ul>${p.bullets.slice(0, job ? 2 : 3).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}
<h2>Achievements &amp; Certifications</h2><ul>${(r.achievements||[]).map(a=>`<li>${esc(a)}</li>`).join("")}<li>Certifications: ${r.certifications.filter(c=>!(r.achievements||[]).join(" ").includes(c)).map(esc).join(", ")}</li></ul>
<h2>Education</h2>${r.education.map(e => `<div class="row"><span><b>${esc(e.degree)}</b>, ${esc(e.school)}${e.score ? " — " + esc(e.score) : ""}</span><span>${esc(e.dates)}</span></div>`).join("")}
</body></html>`;
  }
  root.renderResume = renderResume;
  if (typeof module !== "undefined") module.exports = { renderResume };
})(typeof window !== "undefined" ? window : globalThis);
