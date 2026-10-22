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

  // A player counts as "live" while it is either the one on screen or the one being warmed up behind a card.
  let warm = null;              // { card, p, host, player, state, apiReady } — prepared on hover/touch, not visible
  const live = a => a === active || a === warm;
  const playNow = player => { try { const r = player.play(); if (r && r.catch) r.catch(() => {}); } catch {} };
  /* One click must be enough. Some browsers ignore play() while the video is still loading, and strict ones
     (iPhone Safari) refuse sound once the click is a moment old. Keep asking until it really plays; as a last
     resort start it muted (Wistia then shows its own "click for sound" button). Stops as soon as it plays,
     or if the visitor pauses it. */
  function ensurePlaying(a) {
    if (a !== active || !a.player || a.started) return;
    const pl = a.player;
    playNow(pl);
    clearTimeout(a.retryT);
    let tries = 0;
    const check = () => {
      if (a !== active || a.started || a.player !== pl) return;
      if (pl.state === "playing") { a.started = true; return; }
      tries++;
      if (tries === 4) { try { pl.muted = true; } catch {} }
      playNow(pl);
      if (tries < 7) a.retryT = setTimeout(check, 600);
    };
    a.retryT = setTimeout(check, 600);
  }

  function fail(a, text) {
    if (a === warm) { discardWarm(); return; }           // a warm-up that fails is simply dropped
    if (active !== a) return;
    clearTimeout(a.timer);
    a.player?.remove(); a.player = null;
    setState(a, "error", `<div class="iv-msg" role="alert"><div><strong>Video unavailable</strong><p>${escHTML(text)}</p>
      <div class="iv-actions"><button type="button" class="iv-btn" data-iv="retry">Try again</button><button type="button" class="iv-btn" data-iv="close">Close</button></div></div></div>`);
  }

  async function mount(a) {
    const { p } = a, id = p.wistia;
    clearTimeout(a.timer);
    a.player?.remove(); a.player = null; a.apiReady = false;
    setState(a, "loading", loadingHTML);
    if (!K.VALID_ID.test(id || "")) return fail(a, "The video ID saved for this project isn't valid.");
    if (!navigator.onLine) return fail(a, "You appear to be offline. Check your connection and try again.");
    a.timer = setTimeout(() => { if (live(a) && a.state === "loading") fail(a, "The player is taking too long to load. Check your connection or content blocker."); }, K.LOAD_TIMEOUT);

    // Confirm the video exists while the player loads (never blocks playback if the check itself fails).
    fetch(K.OEMBED(id), { headers: { Accept: "application/json" } }).then(res => {
      if (!live(a) || a.state === "error") return;
      if (res.status === 404) fail(a, "This video isn't available on Wistia. It may have been removed or made private.");
      else if (res.status === 501) fail(a, "This video is still being processed. Please try again in a few minutes.");
    }).catch(() => {});

    try {
      await Promise.all([K.loadScript(K.PLAYER_JS, false), K.loadScript(K.MEDIA_JS(id), true)]);
      await customElements.whenDefined("wistia-player");
    } catch {
      return fail(a, navigator.onLine ? "The video player couldn't load. Please try again." : "You appear to be offline. Check your connection and try again.");
    }
    if (!live(a) || a.state === "error") return;

    const player = document.createElement("wistia-player");
    player.setAttribute("media-id", id);
    player.setAttribute("aspect", p.orientation === "landscape" ? "1.7778" : "0.5625");
    player.setAttribute("preload", "metadata");
    player.setAttribute("player-color", p.category === "ai-video" ? "2fd8ff" : "ff3fb4");
    if (p.thumbnail) player.setAttribute("poster", p.thumbnail);
    player.setAttribute("aria-label", `Video: ${p.title}`);
    player.autoplay = false;
    player.addEventListener("api-ready", () => {
      if (!live(a)) return;
      a.apiReady = true;
      clearTimeout(a.timer);
      if (a.state === "loading") setState(a, "ready");
      // Started by the visitor's click; if the browser still refuses, Wistia shows its own play button.
      if (a === active) ensurePlaying(a);
    }, { once: true });
    player.addEventListener("loaded-media-data", () => {
      if (!live(a)) return;
      if (a.state === "loading") { clearTimeout(a.timer); setState(a, "ready"); }
      if (a === active && a.apiReady) ensurePlaying(a);
    }, { once: true });
    player.addEventListener("play", () => { if (a === active) { a.started = true; clearTimeout(a.retryT); } });
    // Safety net for "one at a time": a player that is not the one on screen never keeps playing.
    player.addEventListener("play", () => { if (active !== a) { try { player.pause(); } catch {} } });
    player.addEventListener("enter-fullscreen", () => { a.fs = true; });
    player.addEventListener("cancel-fullscreen", () => { a.fs = false; });
    a.player = player;
    a.host.prepend(player);
  }

  function makeHost(poster, p, hidden) {
    const host = document.createElement("div");
    host.className = hidden ? "iv iv-warm" : "iv";
    if (hidden) host.setAttribute("aria-hidden", "true");
    else { host.tabIndex = -1; host.setAttribute("role", "region"); host.setAttribute("aria-label", `Video player: ${p.title}`); }
    poster.append(host);
    return host;
  }
  function discardWarm() {
    if (!warm) return;
    const w = warm; warm = null;
    clearTimeout(w.timer);
    try { w.player?.pause(); } catch {}
    w.player?.remove(); w.host.remove();
  }
  /* Warm-up: when a visitor shows intent (hovers or touches a card's play button) the player is created
     invisibly inside that card, so pressing play only has to show it and start playback. One at a time. */
  function prepare(card, p) {
    if (!card || !p || !p.wistia || !K.VALID_ID.test(p.wistia)) return;
    if ((active && active.card === card) || (warm && warm.card === card && warm.host.isConnected)) return;
    if (navigator.connection && navigator.connection.saveData) return;
    if (Date.now() - lastStop < 500) return;              // focus just returned to a play button after closing
    discardWarm();
    const poster = card.querySelector(".poster");
    if (!poster) return;
    warm = { card, p, host: makeHost(poster, p, true), player: null, state: "loading", timer: 0, fs: false, lastTap: null, apiReady: false };
    mount(warm);
  }
  // Fetch the shared player script ahead of time (small, cached afterwards).
  function warmup() { K.loadScript(K.PLAYER_JS, false).catch(() => {}); }

  function start(card, p, btn) {
    if (!card || !p || !p.wistia) return false;
    if (active && active.card === card && active.host.isConnected) {
      if (active.state === "error") mount(active);
      else if (active.player) { active.started = false; ensurePlaying(active); }
      return true;
    }
    stop({ keepWarm: true });
    const poster = btn?.closest(".poster") || card.querySelector(".poster");
    if (!poster) return false;
    card.classList.add("is-playing");
    card.querySelector("video.pv")?.pause();
    if (warm && warm.card === card && warm.host.isConnected && warm.state !== "error") {
      // Promote the warmed-up player: it is already loading (or loaded), so playback starts right away.
      active = warm; warm = null;
      Object.assign(active, { btn });
      const h = active.host;
      h.classList.remove("iv-warm"); h.removeAttribute("aria-hidden");
      h.tabIndex = -1; h.setAttribute("role", "region"); h.setAttribute("aria-label", `Video player: ${p.title}`);
      if (active.apiReady && active.player) ensurePlaying(active);
    } else {
      discardWarm();
      active = { card, p, btn, host: makeHost(poster, p, false), player: null, state: "loading", timer: 0, fs: false, lastTap: null, apiReady: false };
      mount(active);
    }
    active.host.focus({ preventScroll: true });
    return true;
  }

  let lastStop = 0;
  function stop(opts) {
    if (!opts?.keepWarm) discardWarm();
    if (!active) return;
    lastStop = Date.now();
    const a = active;
    active = null;
    clearTimeout(a.timer); clearTimeout(a.retryT);
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

  window.InlinePlayer = { start, stop, prepare, warmup, get active() { return !!active; }, get card() { return active?.card || null; } };
})();
