/* In-card Wistia playback for project cards.
   - Pressing a card's play button mounts Wistia's documented <wistia-player> inside that card's poster
     (same size and position, so nothing on the page moves) and starts it.
   - One video at a time across every gallery: starting another card stops and removes the previous player.
   - Double-click (mouse) or double-tap (touch) on the playing video toggles fullscreen through Wistia's
     requestFullscreen()/cancelFullscreen(), falling back to the browser Fullscreen API. A single click never does.
   Only the media ID from the CMS is used; nothing else is injected. */
(function () {
  "use strict";
  const K = window.WistiaKit;
  if (!K) return;
  const TAP_MS = 320, TAP_PX = 32;
  // Player controls that must keep their own behaviour (double-clicking a button must not go fullscreen).
  const CONTROL = 'button, input, select, textarea, a[href], [role="button"], [role="slider"], [role="menu"], [role="menuitem"], [role="menuitemradio"], [role="checkbox"], [role="listbox"], [role="option"]';
  const escHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let active = null;          // { card, p, btn, host, player, state, timer, fs, lastTap }
  let lastTouchFs = 0;

  function setState(a, state, html) {
    a.state = state;
    a.host.dataset.state = state;
    a.host.querySelector(".iv-msg")?.remove();
    if (html) a.host.insertAdjacentHTML("beforeend", html);
  }
  const loadingHTML = `<div class="iv-msg iv-loading"><span class="vm-spin" aria-hidden="true"></span><span class="sr" role="status">Loading video…</span></div>`;

  function fail(a, text) {
    if (active !== a) return;
    clearTimeout(a.timer);
    a.player?.remove(); a.player = null;
    setState(a, "error", `<div class="iv-msg" role="alert"><div><strong>Video unavailable</strong><p>${escHTML(text)}</p>
      <div class="iv-actions"><button type="button" class="iv-btn" data-iv="retry">Try again</button><button type="button" class="iv-btn" data-iv="close">Close</button></div></div></div>`);
  }

  async function mount(a) {
    const { p } = a, id = p.wistia;
    clearTimeout(a.timer);
    a.player?.remove(); a.player = null;
    setState(a, "loading", loadingHTML);
    if (!K.VALID_ID.test(id || "")) return fail(a, "The video ID saved for this project isn't valid.");
    if (!navigator.onLine) return fail(a, "You appear to be offline. Check your connection and try again.");
    a.timer = setTimeout(() => { if (active === a && a.state === "loading") fail(a, "The player is taking too long to load. Check your connection or content blocker."); }, K.LOAD_TIMEOUT);

    // Confirm the video exists while the player loads (never blocks playback if the check itself fails).
    fetch(K.OEMBED(id), { headers: { Accept: "application/json" } }).then(res => {
      if (active !== a || a.state === "error") return;
      if (res.status === 404) fail(a, "This video isn't available on Wistia. It may have been removed or made private.");
      else if (res.status === 501) fail(a, "This video is still being processed. Please try again in a few minutes.");
    }).catch(() => {});

    try {
      await Promise.all([K.loadScript(K.PLAYER_JS, false), K.loadScript(K.MEDIA_JS(id), true)]);
      await customElements.whenDefined("wistia-player");
    } catch {
      return fail(a, navigator.onLine ? "The video player couldn't load. Please try again." : "You appear to be offline. Check your connection and try again.");
    }
    if (active !== a || a.state === "error") return;

    const player = document.createElement("wistia-player");
    player.setAttribute("media-id", id);
    player.setAttribute("aspect", p.orientation === "landscape" ? "1.7778" : "0.5625");
    player.setAttribute("preload", "metadata");
    player.setAttribute("player-color", p.category === "ai-video" ? "2fd8ff" : "ff3fb4");
    if (p.thumbnail) player.setAttribute("poster", p.thumbnail);
    player.setAttribute("aria-label", `Video: ${p.title}`);
    player.autoplay = false;
    player.addEventListener("api-ready", () => {
      if (active !== a) return;
      clearTimeout(a.timer);
      if (a.state === "loading") setState(a, "ready");
      // Started by the visitor's click; if the browser still refuses, Wistia shows its own play button.
      try { const r = player.play(); if (r && r.catch) r.catch(() => {}); } catch {}
    }, { once: true });
    player.addEventListener("loaded-media-data", () => { if (active === a && a.state === "loading") { clearTimeout(a.timer); setState(a, "ready"); } }, { once: true });
    // Safety net for "one at a time": a player that is no longer the active one never keeps playing.
    player.addEventListener("play", () => { if (active !== a) { try { player.pause(); } catch {} } });
    player.addEventListener("enter-fullscreen", () => { a.fs = true; });
    player.addEventListener("cancel-fullscreen", () => { a.fs = false; });
    a.player = player;
    a.host.prepend(player);
  }

  function start(card, p, btn) {
    if (!card || !p || !p.wistia) return false;
    if (active && active.card === card && active.host.isConnected) {
      if (active.state === "error") mount(active);
      else if (active.player) { try { const r = active.player.play(); if (r && r.catch) r.catch(() => {}); } catch {} }
      return true;
    }
    stop();
    const poster = btn?.closest(".poster") || card.querySelector(".poster");
    if (!poster) return false;
    const host = document.createElement("div");
    host.className = "iv";
    host.tabIndex = -1;
    host.setAttribute("role", "region");
    host.setAttribute("aria-label", `Video player: ${p.title}`);
    poster.append(host);
    card.classList.add("is-playing");
    card.querySelector("video.pv")?.pause();
    active = { card, p, btn, host, player: null, state: "loading", timer: 0, fs: false, lastTap: null };
    mount(active);
    host.focus({ preventScroll: true });
    return true;
  }

  function stop(opts) {
    if (!active) return;
    const a = active;
    active = null;
    clearTimeout(a.timer);
    if (inFullscreen(a)) exitFs(a);
    try { a.player?.pause(); } catch {}
    a.player?.remove();                      // removing the player stops playback and frees it
    a.host.remove();
    a.card.classList.remove("is-playing");
    if (opts?.restoreFocus && a.btn?.isConnected) a.btn.focus({ preventScroll: true });
  }

  /* ---------- Fullscreen ---------- */
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  function inFullscreen(a) { const el = fsEl(); return a.fs || !!(el && (el === a.host || a.host.contains(el))); }
  function enterFs(a) {
    const fallback = () => {
      const h = a.host;
      try { const r = h.requestFullscreen ? h.requestFullscreen() : h.webkitRequestFullscreen?.(); if (r && r.catch) r.catch(() => {}); } catch {}
    };
    if (a.player && typeof a.player.requestFullscreen === "function") {
      try { const r = a.player.requestFullscreen(); if (r && r.catch) r.catch(fallback); } catch { fallback(); }
    } else fallback();
  }
  function exitFs(a) {
    const native = () => {
      try {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch {}
    };
    // Leave the way we came in: through Wistia if the player went fullscreen, natively if the fallback did.
    if (fsEl() !== a.host && a.player && typeof a.player.cancelFullscreen === "function") {
      try { const r = a.player.cancelFullscreen(); if (r && r.catch) r.catch(native); } catch { native(); }
    } else native();
    a.fs = false;
  }
  // Enter or leave based on the state at the moment of the gesture. Both directions are idempotent, so if the
  // player also reacts to the double-click itself the result is still the same.
  function toggleFs(a) { if (inFullscreen(a)) exitFs(a); else enterFs(a); }

  function onControls(a, e) {
    for (const n of e.composedPath()) {
      if (n === a.host) break;
      if (n instanceof Element && n !== a.player && n.matches(CONTROL)) return true;
    }
    // The control bar can live in a closed shadow root; treat the bottom strip as controls too.
    const r = a.host.getBoundingClientRect();
    return e.clientY > r.bottom - Math.max(44, r.height * 0.14);
  }

  document.addEventListener("dblclick", e => {
    const a = active;
    if (!a || a.state === "error" || !a.host.contains(e.target)) return;
    if (Date.now() - lastTouchFs < 700) return;            // already handled as a double-tap
    if (onControls(a, e)) return;
    e.preventDefault();                                     // no text selection on double-click
    toggleFs(a);
  });
  document.addEventListener("pointerup", e => {
    const a = active;
    if (e.pointerType !== "touch" || !a || a.state === "error" || !a.host.contains(e.target)) return;
    if (onControls(a, e)) { a.lastTap = null; return; }
    const t = { t: e.timeStamp, x: e.clientX, y: e.clientY }, prev = a.lastTap;
    if (prev && t.t - prev.t < TAP_MS && Math.hypot(t.x - prev.x, t.y - prev.y) < TAP_PX) {
      a.lastTap = null; lastTouchFs = Date.now();
      toggleFs(a);
    } else a.lastTap = t;
  }, true);
  document.addEventListener("fullscreenchange", () => { if (active && !fsEl()) active.fs = false; });
  document.addEventListener("webkitfullscreenchange", () => { if (active && !fsEl()) active.fs = false; });

  // Error overlay buttons
  document.addEventListener("click", e => {
    const b = e.target.closest?.("[data-iv]");
    if (!b || !active || !active.host.contains(b)) return;
    e.preventDefault();
    if (b.dataset.iv === "retry") mount(active);
    else stop({ restoreFocus: true });
  });
  // Esc inside a card's player (not fullscreen) closes it and returns focus to its play button.
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape" || !active || inFullscreen(active) || !active.host.contains(document.activeElement)) return;
    stop({ restoreFocus: true });
  });

  window.InlinePlayer = { start, stop, get active() { return !!active; }, get card() { return active?.card || null; } };
})();
