/* Rendering, routing, transitions, hover effects, particles. Depends on data.js. */
/* ===================================================================== */
const app = document.getElementById("app");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const arrow = '<span class="arr" aria-hidden="true">→</span>';
const playIcon = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 1.2v11.6L12.5 7z" fill="currentColor"/></svg>';
const curveSVG = '<svg viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 95 C 70 95, 60 5, 200 5" fill="none" stroke="var(--mg)" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="M0 95 L 60 95 M200 5 L140 5" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/><rect x="-4" y="91" width="8" height="8" transform="rotate(45 0 95)" fill="var(--fg)"/><rect x="196" y="1" width="8" height="8" transform="rotate(45 200 5)" fill="var(--fg)"/></svg>';

function isFile(u) { return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(u || ""); }
function hostLabel(u) {
  try {
    const h = new URL(u).hostname.replace(/^www\./, "");
    if (/youtu/.test(h)) return "YouTube"; if (/vimeo/.test(h)) return "Vimeo";
    if (/drive\.google/.test(h)) return "Google Drive"; if (/instagram/.test(h)) return "Instagram";
    return h;
  } catch { return "external site"; }
}
function projectsIn(cat, fmt) {
  const key = CATS[cat].key, f = fmt === "short" ? "short-form" : "long-form";
  return PROJECTS.filter(p => p.category === key && p.format === f);
}

/* ---------- Visual pieces ---------- */
function aiVis(id) {
  return `<div class="z"><canvas data-field="${id}"></canvas><div class="ai-frames" aria-hidden="true"><span></span><span></span><span></span></div></div>`;
}
function motionVis() {
  const word = "MOTION".split("").map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("");
  return `<div class="z graph" aria-hidden="true">
    <svg viewBox="0 0 400 160" preserveAspectRatio="none">
      <path id="ease" d="M0 150 C 150 150, 120 10, 400 10" fill="none" stroke="var(--mg)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
      <path d="M0 150 L 120 150 M400 10 L 250 10" stroke="var(--muted)" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>
      <circle cx="120" cy="150" r="4" fill="var(--muted)"/><circle cx="250" cy="10" r="4" fill="var(--muted)"/>
      <rect x="-6" y="144" width="12" height="12" transform="rotate(45 0 150)" fill="var(--fg)"/>
      <rect x="394" y="4" width="12" height="12" transform="rotate(45 400 10)" fill="var(--fg)"/>
      ${reduceMotion ? "" : `<circle r="6" fill="var(--mg)"><animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;.6;1" calcMode="linear"><mpath href="#ease"/></animateMotion></circle>`}
    </svg>
    <div class="kin">${word}</div>
    <span class="lbl mono">Speed graph · ease in / out</span>
  </div>`;
}
function doorCard(cat) {
  const c = CATS[cat], count = PROJECTS.filter(p => p.category === c.key).length;
  const vis = cat === "ai" ? aiVis("door-ai") : motionVis();
  return `<a class="door" data-cat="${cat}" href="#${cat}">
    <div class="door-vis">${vis}<div class="door-meta mono" aria-hidden="true"><span><b>●</b> ${cat === "ai" ? "Generated · 9:16 / 16:9" : "Keyframed · 9:16 / 16:9"}</span><span>${count} ${count === 1 ? "project" : "projects"}</span></div></div>
    <div class="door-body">
      <span class="eyebrow">${cat === "ai" ? "Practice 01" : "Practice 02"}</span>
      <h3>${c.lines.map(l => `<span class="line"><span>${esc(l)}</span><span aria-hidden="true">${esc(l)}</span></span>`).join("")}</h3>
      <p>${esc(c.blurb)}</p>
      <span class="door-cta">Open the gallery ${arrow}</span>
    </div></a>`;
}
function posterHTML(p, withPreview) {
  const cat = KEY_TO_SLUG[p.category];
  const ar = p.orientation === "landscape" ? "16:9" : "9:16";
  const art = p.thumbnail
    ? `<img src="${esc(p.thumbnail)}" alt="" loading="lazy" decoding="async">`
    : `<div class="art ${cat === "ai" ? "ai" : "motion"}">${cat === "motion" ? curveSVG : ""}</div>`;
  const pv = withPreview && p.video && isFile(p.video) ? `<video class="pv" src="${esc(p.video)}" muted loop playsinline preload="none"></video>` : "";
  const badge = p.video ? `<span class="play">${playIcon}</span>` : `<span class="chip-soon">Video soon</span>`;
  return `<div class="poster ${p.orientation === "landscape" ? "landscape" : "portrait"}">
    <div class="z">${art}${pv}</div>
    ${p.thumbnail ? "" : `<div class="crop"><i></i><i></i><i></i><i></i></div><div class="ttl">${esc(p.title)}</div>`}
    <div class="meta-top mono"><span>${cat === "ai" ? "AI Video" : "Motion"} · ${p.format === "short-form" ? "Short" : "Long"}</span><span>${ar}</span></div>${badge}</div>`;
}
function projectCard(p, i) {
  const cat = KEY_TO_SLUG[p.category];
  return `<a class="card" data-cat="${cat}" href="#work.${esc(p.id)}" style="--i:${i || 0}">
    ${posterHTML(p, true)}
    <div class="card-body">
      <span class="kind mono">${esc(p.type)} · ${p.orientation === "landscape" ? "16:9" : "9:16"}</span>
      <h3><span>${esc(p.title)}</span></h3>
      <p>${esc(p.description)}</p>
      ${p.tools.length ? `<p class="mono" style="font-size:.64rem">${esc(p.tools.join(" · "))}</p>` : ""}
      <div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <span class="more">View project ${arrow}</span>
    </div></a>`;
}
function slotCard(orientation, n, i) {
  return `<div class="slot" aria-hidden="true" style="--i:${i}"><div class="poster ${orientation}"><div class="inner"><div><span class="mono">Slot ${String(n).padStart(2, "0")} · ${orientation === "landscape" ? "16:9" : "9:16"}</span><strong>Reserved for new work</strong></div></div></div></div>`;
}
function ctaBand() {
  return `<div class="cta-band">
    <div><span class="eyebrow">Available for projects</span><h2 style="margin-top:1rem">Let's make something worth watching.</h2></div>
    <div class="ctas"><a class="btn primary" href="#contact">Start a project ${arrow}</a><a class="btn" href="${esc(CONFIG.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a></div>
  </div>`;
}

/* ---------- Views ---------- */
function viewHome() {
  const featured = PROJECTS.filter(p => p.featured).slice(0, 3);
  const words = [["Where", ""], ["Ideas", ""], ["Become", ""], ["Visual", "ai-w"], ["Experiences.", "mg-w"]];
  const h1 = words.map(([w, c], i) => `<span class="w"><span class="${c}" style="animation-delay:${i * 70}ms">${w}</span></span>`).join(" ");
  const reel = CONFIG.showreel.video
    ? (isFile(CONFIG.showreel.video) ? `<a class="btn" href="#reel">Watch showreel</a>` : `<a class="btn" href="${esc(CONFIG.showreel.video)}" target="_blank" rel="noopener">Watch showreel ↗</a>`) : "";
  const tick = TICKER.map(([t, c]) => `<span class="${c}">${esc(t)}</span>`).join("");
  return `<div class="view">
  <div class="wrap hero" id="hero">
    <div>
      <span class="eyebrow">AI Video Editor &amp; Motion Graphics Designer · ${esc(CONFIG.location)} · IST · Working globally</span>
      <h1 aria-label="Where Ideas Become Visual Experiences.">${h1}</h1>
      <p class="lead">I blend AI filmmaking, motion graphics, and creative editing to transform ideas into compelling visual content.</p>
      <div class="ctas"><a class="btn primary" href="#portfolio">Explore My Work ${arrow}</a><a class="btn" href="#contact">Let's Work Together</a>${reel}</div>
    </div>
    <figure class="pc" id="pc" style="margin-block:0">
      <div class="pc-glow" aria-hidden="true"></div>
      <div class="pc-panel" aria-hidden="true"></div>
      <div class="pc-frame" aria-hidden="true"></div>
      <span class="pc-tag t1">Frame 001 · A-cam</span>
      <img class="pc-img" src="${esc(CONFIG.photos.hero)}" width="900" height="1157" alt="Illustrated portrait of Abhinav Kunwar in a black jacket" fetchpriority="high" decoding="async">
      <span class="pc-chip">Motion</span>
      <span class="pc-tag t2" data-tc>00:00:00:00</span>
      <figcaption class="pc-tag t3"><b>●</b> Abhinav Kunwar · AI film / motion</figcaption>
    </figure>
  </div>
  <div class="ticker" aria-label="Tools and techniques"><div class="ticker-track">${tick}${tick}</div></div>

  <section class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Two practices</span><h2>Two Styles, One Editor.</h2></div><p class="lead" style="max-width:42ch">Every project lives in one of two galleries, each split into short form and long form.</p></div>
    <div class="doors">${doorCard("ai")}${doorCard("motion")}</div>
  </section>

  <section class="wrap" style="padding-top:0">
    <div class="sec-head"><div><span class="eyebrow">Featured work</span><h2>Few Projects</h2></div><a class="textlink" href="#portfolio">View the full portfolio →</a></div>
    <div class="grid-mixed">${featured.map((p, i) => projectCard(p, i)).join("")}</div>
  </section>

  <section class="wrap intro">
    <div><span class="eyebrow">Introduction</span><h2>Creative thinking. Modern production.</h2></div>
    <div>
      <p class="lead" style="color:var(--fg)">I combine AI-generated visuals, motion graphics, editing and sound, from AI ads for Meta and Google to long-form podcast edits.</p>
      <div class="mini-xp">${EXPERIENCE.map(e => `<div><strong>${esc(e.org)}</strong><span class="mono">${esc(e.when)}</span></div>`).join("")}</div>
      <div style="margin-top:1.6rem"><a class="textlink" href="#about">More about me →</a></div>
    </div>
  </section>
  <div class="wrap">${ctaBand()}</div>
  </div>`;
}
function viewPortfolio() {
  return `<div class="view wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span class="sep">/</span><span class="here">Portfolio</span></nav>
    <div class="cat-hero"><span class="eyebrow">Portfolio</span><h1>Two practices.<br>One editor.</h1>
      <p class="lead">AI Video Projects for generated commercials and films. Motion Graphics Video Projects for design, typography and edits.</p></div>
    <div class="doors" style="padding-bottom:clamp(4rem,8vw,6rem)">${doorCard("ai")}${doorCard("motion")}</div>
  </div>`;
}
function catArt(cat) {
  if (cat === "ai") {
    return `<figure class="cat-art art-ai" data-tilt>
      <div class="ca-frame" aria-hidden="true"></div>
      <div class="ca-panel" aria-hidden="true"><canvas data-field="cat-ai"></canvas></div>
      <div class="ca-ring" aria-hidden="true"></div>
      <img class="ca-img" src="${esc(CONFIG.photos.aiPortrait)}" width="820" height="853" alt="Illustrated portrait of Abhinav Kunwar in a white hoodie" loading="eager" decoding="async">
      <span class="ca-tag t-a" aria-hidden="true">Frame 002 · Gen</span>
      <span class="ca-tag t-b" aria-hidden="true"><b>●</b> AI Video</span>
    </figure>`;
  }
  return `<figure class="cat-art art-mg" data-tilt>
    <div class="mg-layer l1" aria-hidden="true"></div>
    <div class="mg-layer l2" aria-hidden="true"></div>
    <div class="mg-layer l3" aria-hidden="true"></div>
    <div class="mg-anchor" aria-hidden="true"></div>
    <img class="ca-img" src="${esc(CONFIG.photos.motionPortrait)}" width="640" height="1037" alt="Illustrated full-length portrait of Abhinav Kunwar in a black jacket" loading="eager" decoding="async">
    <div class="mg-keys" aria-hidden="true"><span class="mono">Position</span><div class="trk"><i></i><i></i><i></i><i></i></div></div>
    <span class="ca-tag t-c" aria-hidden="true">Layer 03 · Comp</span>
  </figure>`;
}
function viewGallery(cat, fmt) {
  const c = CATS[cat], f = c[fmt], list = projectsIn(cat, fmt);
  const orientation = fmt === "short" ? "portrait" : "landscape";
  const other = cat === "ai" ? "motion" : "ai";
  const nShort = projectsIn(cat, "short").length, nLong = projectsIn(cat, "long").length;
  const minSlots = fmt === "short" ? 3 : 2;
  const slots = Math.max(0, minSlots - list.length);
  const cards = list.map((p, i) => projectCard(p, i)).join("") + Array.from({ length: slots }, (_, i) => slotCard(orientation, list.length + i + 1, list.length + i)).join("");
  const nameHTML = cat === "ai" ? `<em>AI Video</em> Projects` : `<em>Motion Graphics</em> Video Projects`;
  return `<div class="view wrap" data-cat="${cat}">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span class="sep">/</span><a href="#portfolio">Portfolio</a><span class="sep">/</span><span class="here">${esc(c.name)}</span></nav>
    <div class="cat-hero has-art">
      <div class="cat-copy">
        <span class="eyebrow">${cat === "ai" ? "Practice 01" : "Practice 02"} · ${esc(c.fx)}</span>
        <h1>${nameHTML}</h1>
        <p class="lead">${esc(c.intro)}</p>
      </div>
      ${catArt(cat)}
      <div class="cat-band" aria-hidden="true"></div>
    </div>
    <div class="toolbar">
      <nav class="seg" aria-label="Format">
        <a href="#${cat}-short" ${fmt === "short" ? 'aria-current="page"' : ""}>Short form <span class="mono">9:16 · ${nShort}</span></a>
        <a href="#${cat}-long" ${fmt === "long" ? 'aria-current="page"' : ""}>Long form <span class="mono">16:9 · ${nLong}</span></a>
      </nav>
      <a class="btn small" href="#${other}" data-cat="${other}">${esc(CATS[other].name)} ${arrow}</a>
    </div>
    <div class="gallery-wrap">
      <p class="muted" style="margin-bottom:1.4rem;max-width:62ch">${esc(f.detail)}</p>
      ${list.length === 0 ? `<div class="empty-note"><p>${esc(f.empty)}</p><a class="textlink" href="#contact">Commission one →</a></div>` : ""}
      <div class="${fmt === "short" ? "grid-short" : "grid-long"}" id="gallery">${cards}</div>
      <div class="back-row"><a class="textlink" href="#portfolio">← Both practices</a><span class="mono muted">${list.length} ${list.length === 1 ? "project" : "projects"} · ${esc(f.title)}</span></div>
    </div>
  </div>`;
}
function playerHTML(p) {
  const o = p.orientation === "landscape" ? "landscape" : "portrait";
  const cat = KEY_TO_SLUG[p.category];
  let stage;
  if (p.video && isFile(p.video)) {
    stage = `<video src="${esc(p.video)}" controls playsinline preload="metadata" ${p.thumbnail ? `poster="${esc(p.thumbnail)}"` : ""} aria-label="${esc(p.title)}"></video>`;
  } else if (p.video) {
    stage = `${p.thumbnail ? `<img src="${esc(p.thumbnail)}" alt="" loading="lazy">` : `<div class="art ${cat}"></div>`}<div class="placeholder"><div><span class="mono muted">Hosted on ${esc(hostLabel(p.video))}</span><strong>${esc(p.title)}</strong><div style="margin-top:1rem"><a class="btn primary small" href="${esc(p.video)}" target="_blank" rel="noopener">Watch on ${esc(hostLabel(p.video))} ↗</a></div></div></div>`;
  } else {
    stage = `<div class="art ${cat}">${cat === "motion" ? curveSVG : ""}</div><div class="crop"><i></i><i></i><i></i><i></i></div>
      <div class="placeholder"><div><span class="mono muted">${o === "portrait" ? "9:16" : "16:9"} · Awaiting upload</span><strong>Video coming soon</strong><p>The cut for this project is being added to the portfolio.</p></div></div>`;
  }
  return `<div class="player"><div class="stage ${o}">${stage}</div><div class="bar mono"><span class="tc" data-tc>00:00:00:00</span><span>${p.duration ? esc(p.duration) : (o === "portrait" ? "Vertical" : "Widescreen")}</span></div></div>`;
}
function viewProject(id) {
  const p = PROJECTS.find(x => x.id === id);
  if (!p) return viewNotFound();
  const cat = KEY_TO_SLUG[p.category], fmt = FMT_TO_SLUG[p.format], c = CATS[cat];
  const sib = projectsIn(cat, fmt), idx = sib.indexOf(p), prev = sib[idx - 1], next = sib[idx + 1];
  const row = (k, v) => v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : "";
  return `<div class="view wrap" data-cat="${cat}">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#portfolio">Portfolio</a><span class="sep">/</span><a href="#${cat}">${esc(c.name)}</a><span class="sep">/</span><a href="#${cat}-${fmt}">${esc(c[fmt].title)}</a><span class="sep">/</span><span class="here">${esc(p.title)}</span></nav>
    <div class="detail ${p.orientation === "landscape" ? "" : "portrait"}">
      ${playerHTML(p)}
      <div class="info">
        <span class="eyebrow">${esc(c.name)} · ${esc(c[fmt].title)}</span>
        <h1>${esc(p.title)}</h1>
        <p class="desc">${esc(p.description)}</p>
        <dl class="specs">
          ${row("Project type", esc(p.type))}${row("Context", esc(p.context))}${row("Duration", esc(p.duration))}
          ${row("Tools", p.tools.length ? esc(p.tools.join(", ")) : "")}
          ${row("Tags", `<div class="tags" style="margin:0">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>`)}
        </dl>
        ${p.approach ? `<div class="case"><h2>Approach</h2><p>${esc(p.approach)}</p></div>` : ""}
        ${p.caseStudy ? `<div class="case"><h2>Case study</h2><p>${esc(p.caseStudy)}</p></div>` : ""}
        <div class="pn">
          ${prev ? `<a class="textlink" href="#work.${esc(prev.id)}">← ${esc(prev.title)}</a>` : `<a class="textlink" href="#${cat}-${fmt}">← Back to gallery</a>`}
          ${next ? `<a class="textlink" href="#work.${esc(next.id)}">${esc(next.title)} →</a>` : `<a class="textlink" href="#contact">Start a similar project →</a>`}
        </div>
      </div>
    </div>
  </div>`;
}
function viewAbout() {
  return `<div class="view">
  <div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span class="sep">/</span><span class="here">About</span></nav></div>
  <section class="wrap about-grid about-stage" id="about-stage" data-pz="mix" style="padding-top:clamp(3.4rem,5vw,4.2rem)">
    <div class="as-deco" aria-hidden="true">
      <span class="as-corner tl"></span><span class="as-corner tr"></span><span class="as-corner bl"></span><span class="as-corner br"></span>
      <div class="as-ruler"><i>00:00:00</i><i>00:00:05</i><i>00:00:10</i><i>00:00:15</i><i>00:00:20</i></div>
      <span class="as-reg"></span>
      <div class="as-lights"><i style="left:44%;top:22%;--d:12"></i><i style="left:6%;top:78%;--d:-9;animation-delay:-1.3s"></i><i style="left:58%;top:86%;--d:8;animation-delay:-2.1s"></i><i style="right:4%;top:40%;--d:-12;animation-delay:-.6s"></i><i style="left:33%;top:64%;--d:6;animation-delay:-3s"></i></div>
      <div class="as-sweep"></div>
      <span class="as-rec mono"><b>●</b> Rec <span data-tc>00:00:00:00</span></span>
    </div>
    <div>
      <span class="eyebrow">About</span>
      <h2>Creative Thinking. Modern Production.</h2>
      <ul class="as-tags" aria-label="Practice areas">
        <li style="--k:var(--ai)">AI Filmmaking</li>
        <li style="--k:var(--mg)">Motion Design</li>
        <li style="--k:var(--fg)">Visual Storytelling</li>
      </ul>
    </div>
    <div>
      <div class="prose">
        <p>I'm Abhinav Kunwar, an AI and motion graphics video editor focused on visual storytelling, advertising, and modern video production.</p>
        <p>I combine professional editing, AI-generated visuals, motion graphics, and sound to turn ideas into compelling video content. My work spans AI-powered advertisements, short-form social content, cinematic storytelling, and long-form editing.</p>
        <p>Using Adobe Premiere Pro, After Effects, Veo, Higgsfield AI and other emerging tools, I look for new ways to make visually distinctive content that fits each project.</p>
      </div>
      <div class="facts mono">
        <span><strong>Based in</strong> ${esc(CONFIG.location)}</span>
        <span><strong>Education</strong> B.Tech Mechanical Engineering, MMMUT Gorakhpur · 2023 – 2027</span>
      </div>
    </div>
  </section>
  <section class="wrap" id="experience">
    <div class="sec-head"><div><span class="eyebrow">Experience</span><h2>Where I've worked</h2></div></div>
    <div class="timeline">
      ${EXPERIENCE.map(e => `<div class="job">
        <div class="when mono">${esc(e.when)}${e.now ? '<span class="now">● Active</span>' : ""}</div>
        <div><h3>${esc(e.org)} <span>· ${esc(e.role)}</span></h3>
          ${e.text ? `<p>${esc(e.text)}</p>` : ""}
          ${e.sub ? `<ul class="xp-lines">${e.sub.map(s => `<li><strong>${esc(s.org)}</strong> · ${esc(s.text)}</li>`).join("")}</ul>` : ""}
        </div></div>`).join("")}
    </div>
    <div class="quotes-head"><span class="eyebrow">Testimonials</span></div>
    <div class="quotes">
      ${TESTIMONIALS.map(t => `<figure class="quote" data-cat="${t.cat}">
        <span class="qmark" aria-hidden="true">“</span>
        <blockquote><p>${esc(t.quote)}</p></blockquote>
        <figcaption><strong>— ${esc(t.name)}</strong><span>${esc(t.role)}</span></figcaption>
      </figure>`).join("")}
    </div>
  </section>
  <section class="wrap" id="skills">
    <div class="sec-head"><div><span class="eyebrow">Skills &amp; tools</span><h2>The kit</h2></div></div>
    <div class="tools">${TOOLS.map(g => `<div class="toolgroup ${g.tone}"><h3>${esc(g.name)} <span class="mono">${g.items.length}</span></h3><ul>${g.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>
  </section>
  <section class="wrap" id="workflow">
    <div class="sec-head"><div><span class="eyebrow">Creative workflow</span><h2>From brief to export</h2></div><p class="lead" style="max-width:40ch">The same six stages run under every project, AI-generated or animated.</p></div>
    <div class="steps">${WORKFLOW.map((s, i) => `<div class="step"><span class="mono">Stage ${String(i + 1).padStart(2, "0")}</span><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`).join("")}</div>
  </section>
  <div class="wrap">${ctaBand()}</div>
  </div>`;
}
const iconMail = '<svg class="fh-ico" viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4.5" width="15" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 6l6.5 5 6.5-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const iconCal = '<svg class="fh-ico" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 8.5h14M7 3v3M13 3v3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="6" y="11" width="2.5" height="2.5" rx=".5" fill="currentColor"/></svg>';
const iconSend = '<svg class="send-ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10l14-6.5-4.5 14-2.6-5.9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.9 11.6L17 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const sendLabel = `Send ${iconSend}`;
function viewContact() {
  return `<div class="view wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span class="sep">/</span><span class="here">Contact</span></nav>
    <div class="contact">
      <div>
        <span class="eyebrow">Contact</span>
        <h1>Let's Make Something Worth Watching.</h1>
        <p class="lead" style="margin-top:1.2rem">Tell me about the product, the platform and the deadline. I work with brands, agencies and creators worldwide.</p>
        <div class="channels">
          <div class="channel"><span class="k mono">Email</span><span class="v">${esc(CONFIG.email)}</span><span class="acts"><button class="btn small" type="button" data-copy="${esc(CONFIG.email)}">Copy</button></span></div>
          <div class="channel"><span class="k mono">Phone / WhatsApp</span><span class="v">${esc(CONFIG.phone)}</span><span class="acts"><button class="btn small" type="button" data-copy="${esc(CONFIG.phone)}">Copy</button></span></div>
          <div class="channel"><span class="k mono">LinkedIn</span><span class="v">in/abhinav-kunwar</span><span class="acts"><a class="btn small" href="${esc(CONFIG.linkedin)}" target="_blank" rel="noopener">Open ↗</a></span></div>
          <div class="channel"><span class="k mono">Location</span><span class="v">${esc(CONFIG.location)} · IST (UTC+5:30)</span></div>
        </div>
      </div>
      <form class="form" id="brief-form" novalidate>
        <div class="form-head" role="group" aria-label="Contact options">
          <button type="button" class="fh-opt fh-email" aria-pressed="true" id="fh-email">${iconMail}<span>Email Me</span></button>
          <a class="fh-opt fh-call" href="${esc(CONFIG.calendly)}" target="_blank" rel="noopener">${iconCal}<span>Book a Call</span><span class="fh-ext" aria-hidden="true">↗</span><span class="sr"> (opens Calendly in a new tab)</span></a>
        </div>
        <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" tabindex="-1" autocomplete="off"></div>
        <div class="row2">
          <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required><span class="err" id="e-name"></span></div>
          <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required><span class="err" id="e-email"></span></div>
        </div>
        <div class="row2">
          <div class="field"><label for="f-type">Project type</label>
            <select id="f-type" name="type"><option>AI Video Production</option><option>Motion Graphics</option><option>Short-Form Editing</option><option>Long-Form Editing</option><option>DTC / UGC Ads</option><option>Real Estate Videos</option><option>Other</option></select></div>
          <div class="field"><label for="f-budget">Budget range (USD)</label>
            <select id="f-budget" name="budget"><option>Not sure yet</option><option>Under $250</option><option>$250 – $750</option><option>$750 – $2,000</option><option>$2,000+</option></select></div>
        </div>
        <div class="field"><label for="f-message">Message</label><textarea id="f-message" name="message" required placeholder="What are you making, where will it run, and when do you need it?"></textarea><span class="err" id="e-message"></span></div>
        <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center;justify-content:space-between">
          <p class="form-note">Your message goes straight to my inbox.</p>
          <button class="btn primary" type="submit" id="f-submit">${sendLabel}</button>
        </div>
        <div id="ready" hidden aria-live="polite"></div>
      </form>
    </div>
  </div>`;
}
function viewNotFound() {
  return `<div class="view wrap" style="padding-block:6rem"><span class="eyebrow">Not found</span><h1 style="font-size:clamp(2.4rem,6vw,4rem);margin-top:1rem">That page isn't on the timeline.</h1>
    <div style="margin-top:2rem;display:flex;gap:.7rem;flex-wrap:wrap"><a class="btn primary" href="#portfolio">Go to portfolio ${arrow}</a><a class="btn" href="#home">Home</a></div></div>`;
}

/* ---------- Routing ---------- */
function parse(h) {
  h = ALIASES[h] || h;
  if (h === "" || h === "home") return { view: "home", nav: "home" };
  if (h === "portfolio") return { view: "portfolio", nav: "" };
  if (h === "ai" || h === "motion") return { view: "gallery", cat: h, fmt: "short", nav: h };
  let m = h.match(/^(ai|motion)-(short|long)$/);
  if (m) return { view: "gallery", cat: m[1], fmt: m[2], nav: m[1] };
  if (h.startsWith("work.")) { const p = PROJECTS.find(x => x.id === h.slice(5)); return { view: "project", id: h.slice(5), cat: p ? KEY_TO_SLUG[p.category] : null, nav: p ? KEY_TO_SLUG[p.category] : "" }; }
  if (["about", "experience", "skills", "workflow"].includes(h)) return { view: "about", nav: "about", anchor: h };
  if (h === "contact") return { view: "contact", nav: "contact" };
  return { view: "404", nav: "" };
}
function render(r) {
  const html = r.view === "home" ? viewHome() : r.view === "portfolio" ? viewPortfolio() : r.view === "gallery" ? viewGallery(r.cat, r.fmt)
    : r.view === "project" ? viewProject(r.id) : r.view === "about" ? viewAbout() : r.view === "contact" ? viewContact() : viewNotFound();
  app.innerHTML = html;
  document.querySelectorAll("[data-nav]").forEach(a => { if (a.dataset.nav === r.nav) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  closeMenu();
  window.scrollTo(0, 0);
  if (r.anchor && r.anchor !== "about") document.getElementById(r.anchor)?.scrollIntoView();
  mountFields(); bindView();
}
/* Short form ⇄ Long form inside the same gallery: swap only the toolbar and the gallery,
   leaving the heading, portrait and scroll position untouched (no full re-render, no scroll-to-top). */
function switchFormat(r) {
  const view = app.querySelector(".view[data-cat]");
  const y = window.scrollY;
  const tpl = document.createElement("template");
  tpl.innerHTML = viewGallery(r.cat, r.fmt).trim();
  const fresh = tpl.content.firstElementChild;
  for (const sel of [".toolbar", ".gallery-wrap"]) view.querySelector(sel).replaceWith(fresh.querySelector(sel));
  // If the new gallery is shorter, the page would end above the current view and the browser would pull it up.
  // Hold the gallery area just tall enough that the toolbar stays exactly where it was.
  const wrap = view.querySelector(".gallery-wrap");
  const deficit = y + window.innerHeight - document.documentElement.scrollHeight;
  if (deficit > 0) wrap.style.minHeight = `${wrap.offsetHeight + deficit}px`;
  // Restore instantly (the page uses smooth scrolling, which would otherwise animate this).
  if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo({ top: y, left: 0, behavior: "instant" });
  view.querySelector(`.seg a[href="#${r.cat}-${r.fmt}"]`)?.focus({ preventScroll: true });
}
let prevRoute = null, busy = false, first = true;
async function onRoute() {
  const r = parse((location.hash || "#home").slice(1));
  if (r.view === "gallery" && prevRoute?.view === "gallery" && prevRoute.cat === r.cat && !busy && app.querySelector(".view[data-cat] .gallery-wrap")) {
    prevRoute = r; switchFormat(r); return;
  }
  const entering = r.cat && (!prevRoute || prevRoute.cat !== r.cat) && !first && !reduceMotion;
  prevRoute = r;
  if (entering && !busy) {
    busy = true;
    try { await transition(r.cat, () => render(r)); } finally { busy = false; }
  } else render(r);
  if (!first) app.focus({ preventScroll: true });
  first = false;
}
window.addEventListener("hashchange", onRoute);

/* ---------- Transitions: AI iris (cyan) vs Motion slats (violet/magenta) ---------- */
const fx = document.getElementById("fx");
let lastPoint = null;
document.addEventListener("pointerdown", e => { lastPoint = { x: e.clientX, y: e.clientY }; }, true);
document.addEventListener("keydown", () => { lastPoint = null; }, true);
const wait = ms => new Promise(r => setTimeout(r, ms));
async function transition(cat, swap) {
  const W = innerWidth, H = innerHeight;
  const pt = lastPoint || { x: W / 2, y: H / 2 };
  fx.classList.add("on");
  if (cat === "ai") {
    fx.innerHTML = `<div class="fx-ai" style="--fx:${pt.x}px;--fy:${pt.y}px"><div class="fx-title"><small>Practice 01 · Generated light</small>AI Video Projects</div></div>`;
    const el = fx.firstElementChild, title = el.querySelector(".fx-title");
    const R = Math.hypot(Math.max(pt.x, W - pt.x), Math.max(pt.y, H - pt.y)) + 20;
    const a1 = el.animate([{ clipPath: `circle(0px at ${pt.x}px ${pt.y}px)` }, { clipPath: `circle(${R}px at ${pt.x}px ${pt.y}px)` }], { duration: 480, easing: "cubic-bezier(.75,0,.2,1)", fill: "forwards" });
    title.animate([{ opacity: 0, letterSpacing: ".08em", filter: "blur(8px)" }, { opacity: 1, letterSpacing: "-.05em", filter: "blur(0)" }], { duration: 460, delay: 160, easing: "cubic-bezier(.2,.7,.1,1)", fill: "forwards" });
    await a1.finished; swap(); await wait(140);
    const a2 = el.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], { duration: 460, easing: "cubic-bezier(.7,0,.25,1)", fill: "forwards" });
    title.animate([{ transform: "translate(-50%,-50%)" }, { transform: "translate(-50%,-120%)", opacity: 0 }], { duration: 380, easing: "ease-in", fill: "forwards" });
    await a2.finished;
  } else {
    const n = W < 640 ? 5 : 8;
    fx.innerHTML = `<div class="fx-mg">${"<i></i>".repeat(n)}<div class="fx-title"><small>Practice 02 · Keyframed</small>Motion Graphics<br>Video Projects</div></div>`;
    const slats = [...fx.querySelectorAll(".fx-mg i")], title = fx.querySelector(".fx-title");
    const fromLeft = pt.x < W / 2;
    const order = i => fromLeft ? i : n - 1 - i;
    const ins = slats.map((s, i) => s.animate([{ transform: "scaleY(0)", transformOrigin: "bottom" }, { transform: "scaleY(1)", transformOrigin: "bottom" }], { duration: 340, delay: order(i) * 38, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" }));
    title.animate([{ opacity: 0, transform: "translate(-50%,-30%) skewY(6deg)" }, { opacity: 1, transform: "translate(-50%,-50%) skewY(0)" }], { duration: 480, delay: 200, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "forwards" });
    await Promise.all(ins.map(a => a.finished)); swap(); await wait(150);
    const outs = slats.map((s, i) => s.animate([{ transform: "scaleY(1)", transformOrigin: "top" }, { transform: "scaleY(0)", transformOrigin: "top" }], { duration: 360, delay: order(i) * 38, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" }));
    title.animate([{ opacity: 1 }, { opacity: 0, transform: "translate(-50%,-70%)" }], { duration: 260, easing: "ease-in", fill: "forwards" });
    await Promise.all(outs.map(a => a.finished));
  }
  fx.innerHTML = ""; fx.classList.remove("on");
}

/* ---------- Menu, toast, copy ---------- */
const menuBtn = document.getElementById("menu-btn"), siteNav = document.getElementById("site-nav");
function closeMenu() { siteNav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "Menu"; }
menuBtn.addEventListener("click", () => {
  const open = !siteNav.classList.contains("open");
  siteNav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open)); menuBtn.textContent = open ? "Close" : "Menu";
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
const toastEl = document.getElementById("toast"); let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2200); }
function selectNode(n) { if (!n) return; const r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-copy]"); if (!b) return;
  const v = b.closest(".channel")?.querySelector(".v");
  try { navigator.clipboard.writeText(b.dataset.copy).then(() => toast("Copied " + b.dataset.copy), () => { selectNode(v); toast("Press Ctrl/Cmd+C to copy"); }); }
  catch { selectNode(v); toast("Press Ctrl/Cmd+C to copy"); }
});

/* ---------- Hover previews (only for real video files) ---------- */
document.addEventListener("pointerover", e => {
  const card = e.target.closest(".card"); if (!card || card.contains(e.relatedTarget)) return;
  const v = card.querySelector("video.pv"); if (!v || reduceMotion) return;
  card.classList.add("previewing"); v.play().catch(() => card.classList.remove("previewing"));
});
document.addEventListener("pointerout", e => {
  const card = e.target.closest(".card"); if (!card || card.contains(e.relatedTarget)) return;
  const v = card.querySelector("video.pv"); if (!v) return;
  card.classList.remove("previewing"); v.pause();
});

/* ---------- Per-view bindings ---------- */
function bindView() {
  const form = document.getElementById("brief-form");
  if (form) {
    form.addEventListener("submit", onSubmit);
    formStartedAt = Date.now(); sending = false;
    document.getElementById("fh-email").addEventListener("click", () => document.getElementById("f-name").focus());
  }
  const pc = document.getElementById("pc"), hero = document.getElementById("hero");
  if (pc && hero) tilt(pc, hero);
  document.querySelectorAll(".cat-art[data-tilt]").forEach(el => tilt(el, el));
  const stage = document.getElementById("about-stage");
  if (stage) tilt(stage.querySelector(".as-deco"), stage);
}
function tilt(el, area) {
  if (reduceMotion || !matchMedia("(pointer:fine)").matches) return;
  area.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width)).toFixed(3));
    el.style.setProperty("--py", Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height)).toFixed(3));
  });
  area.addEventListener("pointerleave", () => { el.style.setProperty("--px", 0); el.style.setProperty("--py", 0); });
}
function setErr(id, msg) { const el = document.getElementById("e-" + id); el.textContent = msg; el.closest(".field").classList.toggle("bad", !!msg); }
let formStartedAt = 0, sending = false;
async function onSubmit(e) {
  e.preventDefault();
  if (sending) return;                       // ignore double clicks while a request is in flight
  const v = id => document.getElementById("f-" + id).value.trim();
  const data = { name: v("name"), email: v("email"), type: v("type"), budget: v("budget"), message: v("message"),
    website: document.getElementById("f-website").value, startedAt: formStartedAt };
  let ok = true;
  setErr("name", data.name ? "" : (ok = false, "Add your name."));
  setErr("email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email) ? "" : (ok = false, "Add an email address I can reply to."));
  setErr("message", data.message.length >= 10 ? "" : (ok = false, "Describe the project in a sentence or two."));
  if (!ok) { document.querySelector(".field.bad input, .field.bad textarea")?.focus(); return; }
  const form = document.getElementById("brief-form"), ready = document.getElementById("ready"), btn = document.getElementById("f-submit");
  sending = true;
  btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.innerHTML = '<span class="spin" aria-hidden="true"></span>Sending…';
  ready.hidden = true; ready.innerHTML = "";
  let result;
  try {
    const res = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
    let body = null; try { body = await res.json(); } catch {}
    // No JSON reply means there is no contact server here (static hosting such as GitHub Pages).
    result = res.ok && body && body.ok ? { ok: true } : body ? { ok: false, error: body.error, fields: body.fields } : { ok: false, noServer: true };
  } catch {
    result = { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
  }
  sending = false;
  btn.disabled = false; btn.removeAttribute("aria-busy"); btn.innerHTML = sendLabel;
  ready.hidden = false;
  if (result.ok) {
    ["name", "email", "message"].forEach(id => { document.getElementById("f-" + id).value = ""; });
    formStartedAt = Date.now();
    ready.innerHTML = `<div class="ready ok" role="status"><h3>Message sent</h3><p class="muted">Your message has been sent successfully. I'll get back to you soon.</p></div>`;
  } else {
    if (result.fields) for (const [k, msg] of Object.entries(result.fields)) if (document.getElementById("e-" + k)) setErr(k, msg);
    if (result.noServer) {
      const mail = `mailto:${CONFIG.email}?subject=${encodeURIComponent(`New Portfolio Inquiry — ${data.type}`)}&body=${encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\nProject Type: ${data.type}\nBudget Range: ${data.budget}\n\n${data.message}`)}`;
      ready.innerHTML = `<div class="ready fail" role="alert"><h3>Your message wasn't sent</h3><p class="muted">The form can't send from this copy of the site. <a href="${esc(mail)}">Send it from your email app</a> instead (your message is already filled in), or write to ${esc(CONFIG.email)}. Your details are still in the form.</p></div>`;
      ready.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
      return;
    }
    ready.innerHTML = `<div class="ready fail" role="alert"><h3>Your message wasn't sent</h3><p class="muted">${esc(result.error || "Something went wrong. Please try again.")} Your details are still in the form.</p></div>`;
  }
  ready.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
}

/* ---------- Timecode ---------- */
const tcStart = performance.now();
setInterval(() => {
  const els = document.querySelectorAll("[data-tc]"); if (!els.length) return;
  const f = Math.floor((performance.now() - tcStart) / 40), p = n => String(n).padStart(2, "0");
  const s = `${p(Math.floor(f / 90000) % 24)}:${p(Math.floor(f / 1500) % 60)}:${p(Math.floor(f / 25) % 60)}:${p(f % 25)}`;
  els.forEach(el => el.textContent = s);
}, 40);

/* ---------- Generative "latent field" canvases (AI practice) ---------- */
let fields = [];
function makeField(canvas, seed) {
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, pts = [];
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const css = getComputedStyle(document.documentElement);
  const c1 = css.getPropertyValue("--ai").trim() || "#2fd8ff", c2 = css.getPropertyValue("--ai-2").trim() || "#1e4bff", fg = css.getPropertyValue("--fg").trim() || "#eef0f5";
  const r = canvas.getBoundingClientRect(); if (!r.width) return null;
  w = r.width; h = r.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#07080b"; ctx.fillRect(0, 0, w, h);
  const n = Math.round(Math.min(240, (w * h) / 1300));
  pts = Array.from({ length: n }, (_, i) => ({ x: Math.random() * w, y: Math.random() * h, c: i % 6 === 0 ? c1 : i % 3 === 0 ? c2 : fg, life: Math.random() * 200 }));
  const k = 0.0042 + (seed % 5) * 0.0004;
  function step(t) {
    const tt = t * 0.00012 + seed;
    ctx.fillStyle = "rgba(7,8,11,0.075)"; ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (const p of pts) {
      const a = (Math.sin(p.x * k + tt) + Math.cos(p.y * k * 1.3 - tt * 0.8)) * Math.PI;
      const nx = p.x + Math.cos(a) * 1.1, ny = p.y + Math.sin(a) * 1.1;
      ctx.strokeStyle = p.c; ctx.globalAlpha = p.c === fg ? 0.28 : 0.9;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
      p.x = nx; p.y = ny; p.life--;
      if (p.life < 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) { p.x = Math.random() * w; p.y = Math.random() * h; p.life = 120 + Math.random() * 200; }
    }
    ctx.globalAlpha = 1;
  }
  return { canvas, step };
}
function mountFields() {
  fields = [];
  document.querySelectorAll("canvas[data-field]").forEach((c, i) => {
    const f = makeField(c, i * 1.7 + c.dataset.field.length); if (!f) return;
    if (reduceMotion) { for (let s = 0; s < 260; s++) f.step(s * 16); } else fields.push(f);
  });
}
function loop(t) { for (const f of fields) if (f.canvas.isConnected) f.step(t); requestAnimationFrame(loop); }
if (!reduceMotion) requestAnimationFrame(loop);
let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(mountFields, 200); });

/* ---------- Ambient particles: cyan near AI areas, violet/magenta near Motion, cursor-aware ---------- */
(function particles() {
  const cv = document.getElementById("particles"); if (!cv) return;
  const ctx = cv.getContext("2d");
  const coarse = matchMedia("(pointer:coarse)").matches;
  const COL = { ai: [47, 216, 255], ai2: [74, 120, 255], mg: [255, 63, 180], mg2: [168, 86, 255], n: [238, 240, 245] };
  let W = 0, H = 0, dpr = 1, P = [], zones = [], running = false, frame = 0;
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: false };
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  const mk = () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .1 - .03,
    r: .6 + Math.random() * 1.1, a: .16 + Math.random() * .3, d: .3 + Math.random() * .9, c: COL.n.slice(), alt: Math.random() < .55, ph: Math.random() * 6.28 });
  function size() {
    W = innerWidth; H = innerHeight; dpr = Math.min(1.5, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(coarse ? 26 : 70, (W * H) / (coarse ? 26000 : 17000)));
    while (P.length < n) P.push(mk()); P.length = n;
  }
  function readZones() {
    zones = [...document.querySelectorAll(".view[data-cat], .door[data-cat], .card[data-cat], .quote[data-cat], .cat-art, [data-pz]")].map(el => {
      const r = el.getBoundingClientRect(), cat = el.dataset.cat || el.dataset.pz || el.closest("[data-cat]")?.dataset.cat;
      return { l: r.left - 70, t: r.top - 70, r: r.right + 70, b: r.bottom + 70, cat, area: r.width * r.height };
    }).filter(z => z.cat && z.b > 0 && z.t < H).sort((a, b) => a.area - b.area);
  }
  function target(p) {
    const z = zones.find(z => p.x > z.l && p.x < z.r && p.y > z.t && p.y < z.b);
    if (!z) return [COL.n, .5];
    if (z.cat === "mix") return [p.alt ? COL.ai : COL.mg, 1];
    return z.cat === "ai" ? [p.alt ? COL.ai : COL.ai2, 1] : [p.alt ? COL.mg : COL.mg2, 1];
  }
  function draw(t, still) {
    mouse.x += (mouse.tx - mouse.x) * .12; mouse.y += (mouse.ty - mouse.y) * .12;
    par.x += (par.tx - par.x) * .04; par.y += (par.ty - par.y) * .04;
    ctx.clearRect(0, 0, W, H);
    for (const p of P) {
      if (!still) {
        p.x += p.vx + Math.sin(t * .0004 + p.ph) * .05; p.y += p.vy;
        if (mouse.on) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 19600) { const d = Math.sqrt(d2) || 1, f = (1 - d / 140) * .55; p.x += dx / d * f; p.y += dy / d * f; }
        }
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      }
      const [tg, k] = target(p);
      for (let i = 0; i < 3; i++) p.c[i] += (tg[i] - p.c[i]) * (still ? 1 : .05);
      ctx.fillStyle = `rgba(${p.c[0] | 0},${p.c[1] | 0},${p.c[2] | 0},${(p.a * k).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(p.x + par.x * p.d, p.y + par.y * p.d, p.r, 0, 6.2832); ctx.fill();
    }
  }
  function loop(t) {
    if (!running) return;
    frame++;
    if (!coarse || frame % 2 === 0) draw(t, false);   // touch: gentle ambient drift at half rate
    requestAnimationFrame(loop);
  }
  function start() { if (running || reduceMotion || document.hidden) return; running = true; requestAnimationFrame(loop); }
  size(); readZones();
  if (reduceMotion) { draw(0, true); }
  else start();
  if (!coarse && !reduceMotion) {
    addEventListener("pointermove", e => {
      mouse.tx = e.clientX; mouse.ty = e.clientY;
      if (!mouse.on) { mouse.x = mouse.tx; mouse.y = mouse.ty; mouse.on = true; }
      par.tx = (e.clientX / W - .5) * -16; par.ty = (e.clientY / H - .5) * -12;
    }, { passive: true });
    document.addEventListener("pointerleave", () => { mouse.on = false; par.tx = par.ty = 0; });
  }
  let zq = false;
  const queueZones = () => { if (zq) return; zq = true; requestAnimationFrame(() => { zq = false; readZones(); if (reduceMotion) draw(0, true); }); };
  addEventListener("scroll", queueZones, { passive: true });
  addEventListener("resize", () => { size(); queueZones(); });
  addEventListener("hashchange", () => { setTimeout(queueZones, 60); setTimeout(queueZones, 1100); });
  setInterval(queueZones, 800);
  document.addEventListener("visibilitychange", () => { if (document.hidden) running = false; else start(); });
})();

onRoute();
