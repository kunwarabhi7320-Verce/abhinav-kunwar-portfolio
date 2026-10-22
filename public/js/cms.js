/* Sanity CMS loader. Runs after data.js and before app.js.
   - Reads published projects either from this site's server (/api/projects) or, on a static host such as
     GitHub Pages, straight from Sanity's public read API using the config written by the build.
   - Converts them to the same shape as PROJECTS in data.js, so every existing card, filter and page keeps working.
   - Until the first project is published in Sanity, or if Sanity can't be reached and nothing is cached,
     the projects in data.js stay on the site.
   - Also reads the "Website text" document (headings, about, experience, testimonials, contact details…).
     Every field left empty there keeps the text from data.js. */
(function () {
  "use strict";
  const cfg = window.CMS_CONFIG || { enabled: false };
  const LOCAL = PROJECTS.slice();                         // the original data.js projects, kept as the fallback
  const CACHE_KEY = "cms.site.v2:" + (cfg.endpoint || `${cfg.projectId}/${cfg.dataset}`);
  const listeners = [];
  let resolveReady, applied = "local";
  const readyPromise = new Promise(r => { resolveReady = r; });

  const CAT_TYPE = { "ai-video": "AI Video", "motion-graphics": "Motion Graphics" };

  // Sanity image URL with the editor's crop applied and the hotspot kept in view (documented image URL parameters).
  function imageURL(t, width) {
    if (!t || !t.url) return "";
    const p = new URLSearchParams();
    const c = t.crop, W = t.width, H = t.height;
    if (c && W && H && (c.left || c.right || c.top || c.bottom)) {
      const x = Math.round(c.left * W), y = Math.round(c.top * H);
      p.set("rect", [x, y, Math.round(W - x - c.right * W), Math.round(H - y - c.bottom * H)].join(","));
    }
    p.set("w", String(width)); p.set("fit", "max"); p.set("auto", "format"); p.set("q", "80");
    return `${t.url}?${p}`;
  }
  function focal(t) {
    const h = t && t.hotspot, c = t && t.crop;
    if (!h) return "";
    // hotspot is relative to the full image; convert to the cropped image
    const l = (c && c.left) || 0, r = (c && c.right) || 0, tp = (c && c.top) || 0, b = (c && c.bottom) || 0;
    const x = (h.x - l) / Math.max(0.01, 1 - l - r), y = (h.y - tp) / Math.max(0.01, 1 - tp - b);
    const pct = v => Math.round(Math.min(1, Math.max(0, v)) * 100) + "%";
    return `${pct(x)} ${pct(y)}`;
  }

  function toProject(d) {
    if (!d || !d.id || !d.title || !CAT_TYPE[d.category] || !/^(short|long)-form$/.test(d.format)) return null;
    const wistia = String(d.wistiaId || "").trim();
    return {
      id: String(d.id), title: String(d.title),
      category: d.category, format: d.format,
      orientation: d.format === "long-form" ? "landscape" : "portrait",
      type: CAT_TYPE[d.category],
      description: d.description || "",
      context: d.clientName ? `Client: ${d.clientName}` : "",
      tags: Array.isArray(d.tags) ? d.tags.filter(Boolean).map(String) : [],
      tools: [], duration: "", approach: "",
      video: "", wistia: /^[a-z0-9]+$/i.test(wistia) ? wistia : "",
      thumbnail: imageURL(d.thumbnail, d.format === "long-form" ? 1280 : 720),
      thumbnailAlt: (d.thumbnail && d.thumbnail.alt) || "",
      thumbPos: focal(d.thumbnail),
      featured: !!d.featured,
      order: typeof d.order === "number" ? d.order : 9999,
      fromCms: true
    };
  }

  function replaceProjects(list) {
    PROJECTS.length = 0;
    for (const p of list) PROJECTS.push(p);
  }
  // Returns true when what's on screen should change.
  function apply(docs, source) {
    const list = (docs || []).map(toProject).filter(Boolean);
    const next = list.length ? list : LOCAL;               // nothing published yet → keep the current portfolio
    const nextTag = list.length ? source : "local";
    const changed = JSON.stringify(next) !== JSON.stringify(PROJECTS);
    replaceProjects(next);
    applied = nextTag;
    return changed;
  }
  /* ---------- Website text ---------- */
  const clone = v => JSON.parse(JSON.stringify(v));
  const CAT_TEXT = ["blurb", "intro"];
  const DEFAULTS = {
    TEXT: clone(TEXT),
    CONFIG: { email: CONFIG.email, phone: CONFIG.phone, linkedin: CONFIG.linkedin, calendly: CONFIG.calendly, location: CONFIG.location },
    EXPERIENCE: clone(EXPERIENCE), TESTIMONIALS: clone(TESTIMONIALS), TOOLS: clone(TOOLS), TICKER: clone(TICKER), WORKFLOW: clone(WORKFLOW),
    CATS: Object.fromEntries(Object.entries(CATS).map(([k, c]) => [k, { blurb: c.blurb, intro: c.intro, short: c.short.detail, long: c.long.detail }]))
  };
  const txt = (v, d) => (typeof v === "string" && v.trim() ? v.trim() : d);
  const strs = v => (Array.isArray(v) ? v.map(x => txt(x, "")).filter(Boolean) : []);
  const https = (v, d) => (typeof v === "string" && /^https:\/\/[^\s"<>]+$/i.test(v.trim()) ? v.trim() : d);
  const mail = (v, d) => (typeof v === "string" && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(v.trim()) ? v.trim() : d);
  // A list from the Studio replaces the default list only when it has at least one usable entry.
  const items = (v, map) => { const out = (Array.isArray(v) ? v : []).map(x => (x && typeof x === "object" ? map(x) : null)).filter(Boolean); return out.length ? out : null; };
  const fill = (arr, next) => { arr.length = 0; for (const x of next) arr.push(x); };
  const TONE = { ai: "ai", mg: "mg" }, TICK = { ai: "a", mg: "m" };
  const snapshot = () => JSON.stringify([TEXT, CONFIG, EXPERIENCE, TESTIMONIALS, TOOLS, TICKER, WORKFLOW, CATS]);

  function applySettings(raw) {
    const s = raw && typeof raw === "object" ? raw : {};
    const D = DEFAULTS;
    for (const k of Object.keys(D.TEXT)) {
      TEXT[k] = Array.isArray(D.TEXT[k]) ? (strs(s[k]).length ? strs(s[k]) : D.TEXT[k].slice()) : txt(s[k], D.TEXT[k]);
    }
    CONFIG.email = mail(s.email, D.CONFIG.email);
    CONFIG.phone = txt(s.phone, D.CONFIG.phone);
    CONFIG.linkedin = https(s.linkedin, D.CONFIG.linkedin);
    CONFIG.calendly = https(s.calendly, D.CONFIG.calendly);
    CONFIG.location = txt(s.location, D.CONFIG.location);

    fill(EXPERIENCE, items(s.experience, e => {
      const org = txt(e.org, ""), role = txt(e.role, "");
      if (!org && !role) return null;
      const x = { role, org, when: txt(e.when, ""), text: txt(e.text, "") };
      if (e.current) x.now = true;
      const sub = items(e.clients, c => (txt(c.name, "") || txt(c.text, "") ? { org: txt(c.name, ""), text: txt(c.text, "") } : null));
      if (sub) x.sub = sub;
      return x;
    }) || clone(D.EXPERIENCE));
    fill(TESTIMONIALS, items(s.testimonials, t => (txt(t.quote, "") && txt(t.name, "")
      ? { cat: t.practice === "motion" ? "motion" : "ai", name: txt(t.name, ""), role: txt(t.role, ""), quote: txt(t.quote, "") } : null)) || clone(D.TESTIMONIALS));
    fill(TOOLS, items(s.tools, g => (txt(g.name, "") && strs(g.items).length ? { name: txt(g.name, ""), tone: TONE[g.color] || "", items: strs(g.items) } : null)) || clone(D.TOOLS));
    fill(TICKER, items(s.ticker, t => (txt(t.text, "") ? [txt(t.text, ""), TICK[t.color] || ""] : null)) || clone(D.TICKER));
    fill(WORKFLOW, items(s.workflow, w => (txt(w.title, "") ? { t: txt(w.title, ""), d: txt(w.text, "") } : null)) || clone(D.WORKFLOW));

    for (const [k, c] of Object.entries(CATS)) {
      const d = D.CATS[k];
      for (const f of CAT_TEXT) c[f] = txt(s[k + f[0].toUpperCase() + f.slice(1)], d[f]);
      c.short.detail = txt(s[k + "ShortDetail"], d.short);
      c.long.detail = txt(s[k + "LongDetail"], d.long);
    }
    syncFooter();
  }
  // The footer is part of index.html (outside the redrawn pages), so its contact details are updated here.
  function syncFooter() {
    for (const el of document.querySelectorAll('[data-site="location"]')) el.textContent = CONFIG.location;
    for (const el of document.querySelectorAll('[data-site="linkedin"]')) el.href = CONFIG.linkedin;
  }

  function readCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; } }
  function writeCache(site) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), docs: site.docs, settings: site.settings })); } catch {} }
  // Projects and website text together; reports what changed on screen.
  function applySite(site, source) {
    const before = snapshot();
    applySettings(site.settings);
    const textChanged = snapshot() !== before;
    const projectsChanged = apply(site.docs, source);
    return { projects: projectsChanged, text: textChanged };
  }

  async function fetchDocs() {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000);
    try {
      let url;
      if (cfg.endpoint) url = cfg.endpoint;
      else {
        const q = new URLSearchParams({ query: cfg.query, perspective: "published" });
        url = `https://${cfg.projectId}.apicdn.sanity.io/v${cfg.apiVersion}/data/query/${cfg.dataset}?${q}`;
      }
      const res = await fetch(url, { signal: ctl.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const r = cfg.endpoint ? body : body.result;
      // Older builds asked for the project list only (an array); newer ones get { projects, settings }.
      const docs = Array.isArray(r) ? r : r && r.projects;
      if (!Array.isArray(docs)) throw new Error("Unexpected response");
      return { docs, settings: (!Array.isArray(r) && r && r.settings) || null };
    } finally { clearTimeout(t); }
  }

  async function load() {
    if (!cfg.enabled) { resolveReady(); return; }
    const cached = readCache();
    if (cached && Array.isArray(cached.docs)) { applySite(cached, "cache"); resolveReady(); }  // instant on repeat visits
    try {
      const site = await fetchDocs();
      writeCache(site);
      const changed = applySite(site, "sanity");
      resolveReady();
      if (changed.projects || changed.text) listeners.forEach(fn => { try { fn(changed); } catch (e) { console.error(e); } });
    } catch (err) {
      console.warn("Portfolio CMS unavailable, showing " + (applied === "local" ? "the built-in content" : "the last saved content") + ".", err.message || err);
      resolveReady();
    }
  }

  window.CMS = {
    get enabled() { return !!cfg.enabled; },
    get source() { return applied; },                       // "local" | "cache" | "sanity"
    /* Resolves when fresh data has arrived, or after `ms` so the page never waits long. */
    ready(ms) { return Promise.race([readyPromise, new Promise(r => setTimeout(r, ms || 0))]); },
    onUpdate(fn) { listeners.push(fn); }
  };
  load();
})();
