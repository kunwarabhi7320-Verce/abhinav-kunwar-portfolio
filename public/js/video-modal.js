/* Wistia video player in a modal, opened from project cards and project pages.
   Uses Wistia's documented player web component (<wistia-player media-id="…">) loaded from fast.wistia.com
   only when a video is opened. Only the media ID from the CMS is used — no embed HTML is ever stored or injected. */
(function () {
  "use strict";
  const PLAYER_JS = "https://fast.wistia.com/player.js";
  const MEDIA_JS = id => `https://fast.wistia.com/embed/${id}.js`;
  // Wistia's documented oEmbed endpoint: 404 = no such video, 501 = still processing.
  const OEMBED = id => `https://fast.wistia.com/oembed.json?url=${encodeURIComponent("https://home.wistia.com/medias/" + id)}`;
  const LOAD_TIMEOUT = 15000;
  const VALID_ID = /^[a-z0-9]{4,32}$/i;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let root, panel, stage, titleEl, metaEl, closeBtn, detailsLink;
  let opener = null, scrollY = 0, openId = null, timer = 0, isOpen = false;
  const scripts = new Map();   // src → Promise

  const escHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function build() {
    if (root) return;
    root = document.createElement("div");
    root.className = "vmodal";
    root.hidden = true;
    root.innerHTML = `
      <div class="vm-backdrop" data-vm-close></div>
      <div class="vm-panel" role="dialog" aria-modal="true" aria-labelledby="vm-title">
        <div class="vm-head">
          <div class="vm-titles"><span class="vm-meta mono" id="vm-meta"></span><h2 class="vm-title" id="vm-title"></h2></div>
          <button type="button" class="vm-close" aria-label="Close video" data-vm-close>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>
          </button>
        </div>
        <div class="vm-stage"></div>
        <div class="vm-foot"><a class="textlink vm-details" href="#">Project details →</a><span class="mono muted vm-hint">Esc to close</span></div>
      </div>`;
    document.body.append(root);
    panel = root.querySelector(".vm-panel");
    stage = root.querySelector(".vm-stage");
    titleEl = root.querySelector(".vm-title");
    metaEl = root.querySelector(".vm-meta");
    closeBtn = root.querySelector(".vm-close");
    detailsLink = root.querySelector(".vm-details");
    // Backdrop and close button close; clicks inside the panel never reach the backdrop (it is a sibling).
    root.addEventListener("click", e => { if (e.target.closest("[data-vm-close]")) close(); });
    detailsLink.addEventListener("click", () => close({ restoreFocus: false, keepScroll: false }));
    document.addEventListener("keydown", e => { if (isOpen && e.key === "Escape") { e.preventDefault(); close(); } });
    // Keep focus inside the dialog (the page behind is inert as well).
    document.addEventListener("focusin", e => { if (isOpen && !root.contains(e.target)) closeBtn.focus(); });
  }

  function loadScript(src, asModule) {
    if (scripts.has(src)) return scripts.get(src);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src; s.async = true; if (asModule) s.type = "module";
      s.onload = () => resolve(); s.onerror = () => { scripts.delete(src); s.remove(); reject(new Error("load failed: " + src)); };
      document.head.append(s);
    });
    scripts.set(src, p);
    return p;
  }

  function setState(state, html) {
    stage.dataset.state = state;
    const msg = stage.querySelector(".vm-msg");
    if (msg) msg.remove();
    if (html) stage.insertAdjacentHTML("beforeend", `<div class="vm-msg" role="${state === "error" ? "alert" : "status"}">${html}</div>`);
  }

  function showError(p, text) {
    clearTimeout(timer);
    stage.querySelector("wistia-player")?.remove();
    setState("error", `<div><strong>This video can't be played right now.</strong><p>${escHTML(text)}</p>
      <div class="vm-actions"><button type="button" class="btn small vm-retry">Try again</button><button type="button" class="btn small" data-vm-close>Close</button></div></div>`);
    stage.querySelector(".vm-retry").addEventListener("click", () => mount(p));
  }

  async function mount(p) {
    const id = p.wistia;
    openId = id;
    stage.innerHTML = p.thumbnail
      ? `<img class="vm-poster" src="${escHTML(p.thumbnail)}" alt="${escHTML(p.thumbnailAlt || "")}" ${p.thumbPos ? `style="object-position:${escHTML(p.thumbPos)}"` : ""}>`
      : "";
    setState("loading", `<span class="vm-spin" aria-hidden="true"></span><span class="sr">Loading video…</span>`);
    if (!VALID_ID.test(id || "")) { showError(p, "The video ID saved for this project isn't valid."); return; }
    if (!navigator.onLine) { showError(p, "You appear to be offline. Check your connection and try again."); return; }

    clearTimeout(timer);
    timer = setTimeout(() => { if (openId === id && stage.dataset.state === "loading") showError(p, "The video player is taking too long to load. Check your connection, or turn off a content blocker for this site, then try again."); }, LOAD_TIMEOUT);

    // Check the video exists while the player loads (never blocks playback if the check itself fails).
    fetch(OEMBED(id), { headers: { Accept: "application/json" } }).then(res => {
      if (openId !== id || stage.dataset.state === "error") return;
      if (res.status === 404) showError(p, "This video isn't available on Wistia. It may have been removed or made private.");
      else if (res.status === 501) showError(p, "This video is still being processed by Wistia. Please try again in a few minutes.");
    }).catch(() => {});

    try {
      await Promise.all([loadScript(PLAYER_JS, false), loadScript(MEDIA_JS(id), true)]);
      await customElements.whenDefined("wistia-player");
    } catch (err) {
      if (openId === id) showError(p, navigator.onLine
        ? "The video couldn't be found or the player couldn't load. If you're the owner, check the Wistia media ID in the CMS."
        : "You appear to be offline. Check your connection and try again.");
      return;
    }
    if (openId !== id || !isOpen || stage.dataset.state === "error") return;   // closed, switched or already failed

    const player = document.createElement("wistia-player");
    player.setAttribute("media-id", id);
    player.setAttribute("aspect", p.orientation === "landscape" ? "1.7778" : "0.5625");
    player.setAttribute("preload", "metadata");
    player.setAttribute("player-color", p.category === "ai-video" ? "2fd8ff" : "ff3fb4");
    if (p.thumbnail) player.setAttribute("poster", p.thumbnail);
    player.setAttribute("aria-label", `Video: ${p.title}`);
    player.autoplay = false;                 // never start on its own (and never with sound)
    const ready = () => { if (openId === id && stage.dataset.state === "loading") { clearTimeout(timer); setState("ready"); } };
    player.addEventListener("api-ready", ready, { once: true });
    player.addEventListener("loaded-media-data", ready, { once: true });
    stage.append(player);
  }

  function lockScroll() {
    scrollY = window.scrollY;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add("vm-lock");
    if (sbw > 0) document.body.style.paddingRight = sbw + "px";
    for (const el of document.body.children) if (el !== root && el.tagName !== "SCRIPT") { el.dataset.vmInert = el.inert ? "keep" : "1"; el.inert = true; }
  }
  function unlockScroll(restore) {
    document.documentElement.classList.remove("vm-lock");
    document.body.style.paddingRight = "";
    for (const el of document.body.querySelectorAll(":scope > [data-vm-inert]")) { if (el.dataset.vmInert === "1") el.inert = false; delete el.dataset.vmInert; }
    if (restore && Math.abs(window.scrollY - scrollY) > 1) window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
  }

  function open(p, from) {
    if (!p || !p.wistia) return false;
    build();
    opener = from || document.activeElement;
    const cat = p.category === "ai-video" ? "ai" : "motion";
    root.dataset.cat = cat;
    panel.classList.toggle("portrait", p.orientation !== "landscape");
    panel.classList.toggle("landscape", p.orientation === "landscape");
    titleEl.textContent = p.title;
    metaEl.textContent = `${p.category === "ai-video" ? "AI Video" : "Motion Graphics"} · ${p.format === "long-form" ? "Long form · 16:9" : "Short form · 9:16"}`;
    detailsLink.href = `#work.${p.id}`;
    detailsLink.hidden = location.hash === `#work.${p.id}`;
    lockScroll();
    root.hidden = false; isOpen = true;
    if (!reduceMotion) root.classList.remove("in"), void root.offsetWidth, root.classList.add("in");
    closeBtn.focus({ preventScroll: true });
    mount(p);
    return true;
  }

  function close(opts) {
    if (!isOpen) return;
    const o = Object.assign({ restoreFocus: true, keepScroll: true }, opts);
    isOpen = false; openId = null; clearTimeout(timer);
    stage.innerHTML = "";                      // removes the player, which stops playback
    delete stage.dataset.state;
    root.hidden = true; root.classList.remove("in");
    unlockScroll(o.keepScroll);
    if (o.restoreFocus && opener && opener.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  }

  window.VideoModal = { open, close, get isOpen() { return isOpen; } };
})();
