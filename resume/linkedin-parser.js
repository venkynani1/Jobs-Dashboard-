// LinkedIn "Save to PDF" profile -> resume JSON. Runs fully in the browser.
//   linesFromPdf(arrayBuffer) -> Promise<lines>   (needs window.pdfjsLib)
//   parseLinkedIn(lines)      -> parsed sections
//   toResume(parsed)          -> resume object for renderResume()
// A "line" is {page, x, y, size, text}; y grows downward.
(function (root) {
  const MONTHS = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const DATE_RX = new RegExp("^(" + MONTHS + "\\s+)?\\d{4}\\s*[-–]\\s*(Present|(" + MONTHS + "\\s+)?\\d{4})", "i");
  const DURATION_RX = /^(\d+\s+years?)?\s*(\d+\s+months?)?$/i;
  const SIDEBAR = ["contact", "top skills", "languages", "certifications", "honors-awards", "honors & awards", "publications", "patents"];
  const MAIN = ["summary", "experience", "education", "licenses & certifications", "volunteer experience", "projects"];

  const SKILL_GROUPS = {
    "Languages": ["Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Golang", "Kotlin", "Swift", "Scala", "PHP", "Ruby", "Rust", "SQL", "PL/SQL", "HTML", "CSS", "Bash", "MATLAB"],
    "Frameworks": ["Spring Boot", "Spring", "Hibernate", "React", "Angular", "Vue.js", "Next.js", "Node.js", "Express", "Django", "Flask", "FastAPI", ".NET", "ASP.NET", "Tailwind CSS", "Bootstrap", "Microservices", "REST APIs", "RESTful API Design", "GraphQL"],
    "Databases": ["MySQL", "PostgreSQL", "SQL Server", "Oracle", "MongoDB", "Redis", "Cassandra", "Firebase", "Supabase", "DynamoDB"],
    "Cloud & DevOps": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "Git", "GitHub", "GitLab", "CI/CD", "Linux", "AWS CLI", "AWS IAM"],
    "Data & AI": ["Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch", "scikit-learn", "pandas", "NumPy", "Power BI", "Tableau", "Excel", "LLM", "Generative AI"],
    "Tools": ["Postman", "Swagger", "Jira", "VS Code", "Eclipse", "STS", "IntelliJ", "Selenium", "JUnit", "Maven", "Gradle", "Figma", "Proteus", "Arduino"]
  };

  const clean = s => String(s || "").replace(/\s+/g, " ").trim();
  const isDate = t => DATE_RX.test(clean(t));
  const isDuration = t => { const c = clean(t); return !!c && DURATION_RX.test(c) && /\d/.test(c); };

  async function linesFromPdf(buf) {
    const pdfjs = root.pdfjsLib;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
    const out = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const rows = [];
      tc.items.forEach(it => {
        if (!it.str || !it.str.trim()) return;
        const size = Math.hypot(it.transform[0], it.transform[1]);
        const x = it.transform[4], y = vp.height - it.transform[5];
        const col = x < vp.width * 0.3 ? 0 : 1;
        let row = rows.find(r => r.col === col && Math.abs(r.y - y) < size * 0.4);
        if (!row) { row = { col, y, x, size, parts: [] }; rows.push(row); }
        row.parts.push({ x, str: it.str, w: it.width || 0 });
        row.x = Math.min(row.x, x); row.size = Math.max(row.size, size);
      });
      rows.forEach(r => {
        r.parts.sort((a, b) => a.x - b.x);
        let text = "";
        r.parts.forEach((pt, i) => {
          if (i && !text.endsWith(" ") && !pt.str.startsWith(" ") && pt.x - (r.parts[i - 1].x + r.parts[i - 1].w) > r.size * 0.15) text += " ";
          text += pt.str;
        });
        out.push({ page: p, x: Math.round(r.x), y: Math.round(r.y), size: Math.round(r.size * 10) / 10, text: clean(text), col: r.col });
      });
    }
    return out;
  }

  // join wrapped lines inside a list block: a small vertical gap means "same item"
  function joinItems(lines) {
    if (!lines.length) return [];
    const gaps = [];
    for (let i = 1; i < lines.length; i++) if (lines[i].page === lines[i - 1].page) gaps.push(lines[i].y - lines[i - 1].y);
    const minGap = gaps.length ? Math.min(...gaps) : 0;
    const items = [];
    lines.forEach((l, i) => {
      const prev = lines[i - 1];
      const wrapped = prev && prev.page === l.page && (l.y - prev.y) <= minGap * 1.15 && gaps.some(g => g > minGap * 1.25);
      if (wrapped) items[items.length - 1] += (/[-@./]$/.test(items[items.length - 1]) ? "" : " ") + l.text;
      else items.push(l.text);
    });
    return items.map(clean);
  }

  function paragraphs(lines) {
    const out = [];
    let cur = [];
    lines.forEach((l, i) => {
      const prev = lines[i - 1];
      if (prev && prev.page === l.page && l.y - prev.y > l.size * 1.7) { out.push(cur.join(" ")); cur = []; }
      cur.push(l.text);
    });
    if (cur.length) out.push(cur.join(" "));
    return out.map(clean).filter(Boolean);
  }

  function parseLinkedIn(lines) {
    lines = lines.map(l => ({ ...l, text: clean(l.text) })).filter(l => l.text && !/^Page \d+ of \d+$/i.test(l.text));
    const pageW = Math.max(...lines.map(l => l.x)) || 600;
    lines.forEach(l => { if (l.col == null) l.col = l.x < pageW * 0.45 ? 0 : 1; });
    const order = (a, b) => a.page - b.page || a.y - b.y;
    const side = lines.filter(l => l.col === 0).sort(order);
    const main = lines.filter(l => l.col === 1).sort(order);

    const sections = (arr, names) => {
      const res = { _top: [] }; let cur = "_top";
      arr.forEach(l => {
        const k = l.text.toLowerCase();
        if (names.includes(k)) { cur = k; res[cur] = res[cur] || []; return; }
        (res[cur] = res[cur] || []).push(l);
      });
      return res;
    };
    const S = sections(side, SIDEBAR), M = sections(main, MAIN);

    // header: biggest font on page 1 = name, next lines = headline, location
    const top = M._top || [];
    const maxSize = Math.max(...top.map(l => l.size));
    const nameIdx = top.findIndex(l => l.size === maxSize);
    const name = top[nameIdx] ? top[nameIdx].text : "";
    const after = top.slice(nameIdx + 1);
    const location = after.length > 1 ? after[after.length - 1].text : "";
    const headline = clean(after.slice(0, Math.max(1, after.length - 1)).map(l => l.text).join(" "));

    // contact (wrapped e-mail / URL pieces are glued back together)
    const contactLines = (S.contact || []).map(l => l.text);
    // glue a line to the previous one only when it continues a broken token (e-mail / URL)
    const glued = contactLines.reduce((acc, t, i) => {
      const prev = contactLines[i - 1] || "";
      const cont = i && (/[-@./_]$/.test(prev) || (t.length <= 4 && !/\s/.test(t)) || (/@/.test(prev) && !/\s/.test(t) && !/^www\./i.test(t)));
      return acc + (i ? (cont ? "" : " ") : "") + t;
    }, "");
    const email = (glued.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}(?![A-Za-z0-9])/) || [""])[0];
    let phone = "";
    contactLines.forEach(t => { const m = t.match(/\+?[\d][\d\s-]{8,}\d/g) || []; m.forEach(x => { if (!phone && x.replace(/\D/g, "").length >= 10) phone = x.trim(); }); });
    const linkedin = (glued.match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i) || [""])[0];
    const github = (glued.match(/github\.com\/[A-Za-z0-9_-]+/i) || [""])[0];

    const topSkills = joinItems(S["top skills"] || []);
    const certifications = joinItems(S.certifications || []);
    const languages = joinItems(S.languages || []);
    const honors = joinItems(S["honors-awards"] || S["honors & awards"] || []);
    const summary = paragraphs(M.summary || []);

    // experience
    const ex = M.experience || [];
    const groups = [];
    let lastUsed = -1;
    for (let i = 0; i < ex.length; i++) {
      if (!isDate(ex[i].text)) continue;
      const title = ex[i - 1] ? ex[i - 1].text : "";
      let company = null;
      if (ex[i - 2] && isDuration(ex[i - 2].text)) company = ex[i - 3] ? ex[i - 3].text : "";
      else if (ex[i - 2] && (i - 2 > lastUsed) && (!groups.length || ex[i - 2].size > ex[i - 1].size + 0.2)) company = ex[i - 2].text;
      else if (!groups.length && ex[i - 2]) company = ex[i - 2].text;
      // description of the previous role = lines between its location and this role's header
      if (groups.length) {
        const g = groups[groups.length - 1], r = g.roles[g.roles.length - 1];
        const end = i - (company && !(ex[i - 2] && isDuration(ex[i - 2].text)) ? 2 : (company ? 3 : 1));
        r.desc = ex.slice(r._next, end).map(l => l.text);
      }
      if (company !== null || !groups.length) groups.push({ company: company || "", roles: [] });
      const dates = clean(ex[i].text.replace(/\(.*?\)/g, ""));
      let loc = "", next = i + 1;
      if (ex[i + 1] && !isDate(ex[i + 1].text) && !isDuration(ex[i + 1].text) && (ex[i + 1].size <= ex[i].size + 0.2) && ex[i + 1].text.length < 60) { loc = ex[i + 1].text; next = i + 2; }
      groups[groups.length - 1].roles.push({ title, dates, location: loc, _next: next, desc: [] });
      lastUsed = next - 1;
    }
    if (groups.length) {
      const g = groups[groups.length - 1], r = g.roles[g.roles.length - 1];
      r.desc = ex.slice(r._next).map(l => l.text);
    }

    // education: school lines are the bigger font; details follow
    const ed = M.education || [];
    const edu = [];
    if (ed.length) {
      const big = Math.max(...ed.map(l => l.size));
      ed.forEach(l => {
        if (l.size >= big - 0.2) edu.push({ school: l.text, detail: "" });
        else if (edu.length) edu[edu.length - 1].detail = clean(edu[edu.length - 1].detail + " " + l.text);
      });
    }

    return { name, headline, location, email, phone, linkedin, github, topSkills, certifications, languages, honors, summary, experience: groups, education: edu };
  }

  function titleCase(s) {
    if (s !== s.toUpperCase()) return s;
    const small = ["and", "of", "in", "to", "for", "the", "at", "on"];
    return s.toLowerCase().split(/(\s+|-)/).map((w, i) => {
      if (/^\s+$|^-$/.test(w)) return w;
      if (i && small.includes(w)) return w;
      if (w.length <= 2 && /^[a-z]+$/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join("");
  }

  function bulletsFrom(desc) {
    const text = clean((desc || []).join(" "));
    if (!text) return [];
    const parts = text.split(/\s*(?:•|·|▪|◦|•|(?:^|\s)- )\s*/).map(clean).filter(p => p.length > 3);
    const src = parts.length > 1 ? parts : text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    return src.map(clean).filter(p => p.length > 3).slice(0, 6).map(t => ({ text: t.replace(/[.;]$/, "") + "." }));
  }

  function skillsFrom(p) {
    p = { ...p, topSkills: p.topSkills.map(s => s.replace(/AWS Command Line Interface \(CLI\)/i, "AWS CLI").replace(/AWS Identity and Access Management \(AWS IAM\)/i, "AWS IAM")) };
    const hay = " " + [p.topSkills.join(" , "), p.summary.join(" "), p.experience.map(g => g.roles.map(r => r.desc.join(" ")).join(" ")).join(" ")].join(" ") + " ";
    const groups = [];
    const used = new Set();
    Object.entries(SKILL_GROUPS).forEach(([g, list]) => {
      const items = list.filter(s => {
        const rx = new RegExp("(^|[^A-Za-z+#.])" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![A-Za-z+#])", "i");
        return rx.test(hay);
      });
      // keep the longer name when both "Spring" and "Spring Boot" matched
      const items2 = items.filter(s => !items.some(o => o !== s && o.toLowerCase().startsWith(s.toLowerCase() + " ") && !/^aws$/i.test(s)));
      items2.forEach(s => used.add(s.toLowerCase()));
      if (items2.length) groups.push({ group: g, items: items2 });
    });
    const other = p.topSkills.filter(s => !used.has(s.toLowerCase()) && ![...used].some(u => s.toLowerCase().includes(u)));
    if (other.length) groups.push({ group: "Other", items: other });
    return groups;
  }

  function toResume(p) {
    const firstPara = p.summary.find(s => s.length > 120) || p.summary[0] || "";
    const sentences = firstPara.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
    const certs = p.certifications.map(c => titleCase(c).replace(/Programmning/i, "Programming"));
    return {
      name: titleCase(p.name),
      title: p.headline,
      contact: { location: p.location, phone: p.phone, email: p.email, linkedin: p.linkedin, github: p.github },
      summary: { default: sentences },
      skills: skillsFrom(p),
      experience: p.experience.map(g => ({
        company: g.company,
        location: (g.roles[0] && g.roles[0].location) || "",
        roles: g.roles.map(r => ({ title: r.title, dates: r.dates.replace(/\b(January|February|March|April|June|July|August|September|October|November|December)\b/g, m => m.slice(0, 3)) })),
        bullets: g.roles.flatMap(r => bulletsFrom(r.desc))
      })),
      projects: [],
      achievements: p.honors,
      certifications: certs,
      education: p.education.slice(0, /\b(B\.?\s?E|B\.?\s?Tech|B\.?\s?Sc|BCA|MCA|M\.?\s?Tech|M\.?\s?Sc|MBA|Bachelor|Master)/i.test((p.education[0] || {}).detail || "") ? 1 : 2).map(e => {
        const m = e.detail.match(/\(([^)]*)\)/);
        const dates = m ? m[1].replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+/g, "") : "";
        return { school: e.school, degree: titleCase(clean(e.detail.replace(/·?\s*\([^)]*\)/, "")).replace(/\s+,/g, ",")), dates, score: "" };
      })
    };
  }

  const api = { linesFromPdf, parseLinkedIn, toResume };
  root.LinkedInParser = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
