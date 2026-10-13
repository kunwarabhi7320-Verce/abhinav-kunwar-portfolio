/* Sanity CMS loader. Runs after data.js and before app.js.
   - Reads published projects either from this site's server (/api/projects) or, on a static host such as
     GitHub Pages, straight from Sanity's public read API using the config written by the build.
   - Converts them to the same shape as PROJECTS in data.js, so every existing card, filter and page keeps working.
   - Until the first project is published in Sanity, or if Sanity can't be reached and nothing is cached,
     the projects in data.js stay on the site. */
(function () {
  "use strict";
  const cfg = window.CMS_CONFIG || { enabled: false };
  const LOCAL = PROJECTS.slice();                         // the original data.js projects, kept as the fallback
  const CACHE_KEY = "cms.projects.v1:" + (cfg.endpoint || `${cfg.projectId}/${cfg.dataset}`);
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
  function readCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; } }
  function writeCache(docs) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), docs })); } catch {} }

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
      const docs = cfg.endpoint ? body.projects : body.result;
      if (!Array.isArray(docs)) throw new Error("Unexpected response");
      return docs;
    } finally { clearTimeout(t); }
  }

  async function load() {
    if (!cfg.enabled) { resolveReady(); return; }
    const cached = readCache();
    if (cached && Array.isArray(cached.docs)) { apply(cached.docs, "cache"); resolveReady(); }  // instant on repeat visits
    try {
      const docs = await fetchDocs();
      writeCache(docs);
      const changed = apply(docs, "sanity");
      resolveReady();
      if (changed) listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    } catch (err) {
      console.warn("Portfolio CMS unavailable, showing " + (applied === "local" ? "the built-in projects" : "the last saved projects") + ".", err.message || err);
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
