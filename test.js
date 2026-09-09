// ============================================================================
//  test.js  —  3D concept page for donovanpeet.com/test  (Pass 1)
//  Vanilla ESM. Three.js vendored locally at /assets/three/.
//  The HTML content works fully without this script; 3D is an enhancement.
// ============================================================================

import * as THREE from '/assets/three/three.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js?v=22';

const anime = window.anime;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// ---------------------------------------------------------------------------
//  Seasonal palette  (mirror of the logic on the main index page)
// ---------------------------------------------------------------------------
const SEASON = (function () {
  const m = new Date().getMonth();
  let c;
  if (m >= 2 && m <= 4)        c = ['#8fd694', '#c8e88f', '#57c2c9'];
  else if (m >= 5 && m <= 7)   c = ['#ffb84d', '#ff7a2f', '#57c2c9'];
  else if (m >= 8 && m <= 10)  c = ['#c1502e', '#a8762e', '#ff7a2f'];
  else                         c = ['#7ec8d6', '#9fb8d4', '#57c2c9'];
  const r = document.documentElement.style;
  r.setProperty('--s1', c[0]);
  r.setProperty('--s2', c[1]);
  r.setProperty('--s3', c[2]);
  return c;
})();

// ---------------------------------------------------------------------------
//  Small utilities
// ---------------------------------------------------------------------------
function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function timecode(t) {
  const f = Math.floor(t * 24) % 24;
  const s = Math.floor(t) % 60;
  const m = Math.floor(t / 60) % 60;
  const p = (n) => String(n).padStart(2, '0');
  return p(m) + ':' + p(s) + ':' + p(f);
}

// ---------------------------------------------------------------------------
//  Intro loader
// ---------------------------------------------------------------------------
const loader = document.getElementById('introLoader');
const loaderFill = document.getElementById('introBarFill');
const loaderPct = document.getElementById('introPct');
let loaderDone = false;

function setLoader(pct) {
  if (loaderFill) loaderFill.style.width = pct + '%';
  if (loaderPct) loaderPct.textContent = Math.round(pct) + '%';
}
function finishLoader() {
  if (loaderDone) return;
  loaderDone = true;
  setLoader(100);
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('is-done');
    setTimeout(() => loader.remove(), 600);
  }, 180);
}
// fake progress until the scene reports ready
(function fakeProgress() {
  if (!loader) return;
  let p = 0;
  const iv = setInterval(() => {
    if (loaderDone) { clearInterval(iv); return; }
    p += (85 - p) * 0.12 + 1.5;
    if (p > 88) p = 88;
    setLoader(p);
  }, 90);
})();
// hard safety: never let the loader trap the page
setTimeout(finishLoader, 4000);

// ---------------------------------------------------------------------------
//  2D reveal-on-scroll (staggered per group)
// ---------------------------------------------------------------------------
(function reveals() {
  const els = Array.prototype.slice.call(document.querySelectorAll('.reveal2'));
  if (!els.length) return;
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const parent = en.target.parentElement;
      const group = parent
        ? Array.prototype.filter.call(parent.children, (c) =>
            c.classList && c.classList.contains('reveal2') && !c.classList.contains('is-in'))
        : [en.target];
      (group.length ? group : [en.target]).forEach((s, i) => {
        s.style.transitionDelay = (i * 70) + 'ms';
        s.classList.add('is-in');
        io.unobserve(s);
      });
    });
  }, { threshold: 0.15 });
  els.forEach((e) => io.observe(e));
})();

// ---------------------------------------------------------------------------
//  Animated counters
// ---------------------------------------------------------------------------
(function counters() {
  const els = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (!els.length) return;
  const fmt = (n) => { try { return n.toLocaleString('sk-SK'); } catch (e) { return String(n); } };
  function run(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduced || !anime || !target) {
      el.textContent = fmt(target) + suffix;
      return;
    }
    const obj = { v: 0 };
    anime({
      targets: obj, v: target, duration: 1600, easing: 'easeOutCubic',
      update: () => { el.textContent = fmt(Math.floor(obj.v)) + suffix; },
      complete: () => { el.textContent = fmt(target) + suffix; }
    });
  }
  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.5 });
  els.forEach((e) => io.observe(e));
})();

// ---------------------------------------------------------------------------
//  Scroll progress bar + back-to-top
// ---------------------------------------------------------------------------
(function scrollUi() {
  const fill = document.getElementById('scrollFill');
  const back = document.getElementById('backToTop');
  let ticking = false;
  function update() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    if (fill) fill.style.transform = 'scaleX(' + pct + ')';
    if (back) back.classList.toggle('is-visible', window.scrollY > 600);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
  if (back) {
    back.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }
})();

// ---------------------------------------------------------------------------
//  Scrollspy nav
// ---------------------------------------------------------------------------
(function scrollspy() {
  const links = document.querySelectorAll('[data-nav]');
  const sections = Array.prototype.map.call(links, (a) =>
    document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const link = document.querySelector('[data-nav][href="#' + en.target.id + '"]');
      if (link) link.classList.toggle('is-active', en.isIntersecting);
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  sections.forEach((s) => io.observe(s));
})();

// ---------------------------------------------------------------------------
//  Discord copy-to-clipboard
// ---------------------------------------------------------------------------
document.querySelectorAll('[data-discord]').forEach((btn) => {
  const original = btn.textContent;
  btn.addEventListener('click', () => {
    const id = btn.dataset.discord;
    const done = () => {
      btn.textContent = 'Skopírované ✓';
      setTimeout(() => { btn.textContent = original; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(done).catch(() => {
        if (window.showToast) window.showToast('Discord: ' + id);
      });
    } else if (window.showToast) {
      window.showToast('Discord: ' + id);
    }
  });
});

// ---------------------------------------------------------------------------
//  Privacy notice
// ---------------------------------------------------------------------------
(function privacy() {
  const n = document.getElementById('privacyNotice');
  if (!n) return;
  let seen = false;
  try { seen = localStorage.getItem('t3d-privacy') === '1'; } catch (e) {}
  if (seen) { n.remove(); return; }
  n.hidden = false;
  const close = document.getElementById('privacyNoticeClose');
  if (close) close.addEventListener('click', () => {
    try { localStorage.setItem('t3d-privacy', '1'); } catch (e) {}
    n.remove();
  });
})();

// ---------------------------------------------------------------------------
//  Video lightbox (YouTube IFrame API) + TikTok open-in-new-tab
// ---------------------------------------------------------------------------
(function videoLightbox() {
  const lightbox = document.getElementById('videoLightbox');
  const slot = document.getElementById('lightboxVideo');
  const closeBtn = document.getElementById('lightboxClose');
  if (!lightbox || !slot || !closeBtn) return;

  let apiLoading = false, apiReady = false, pendingId = null, player = null, returnFocus = null;

  function loadApi() {
    if (apiLoading || apiReady) return;
    apiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }
  const prevReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    if (pendingId) { createPlayer(pendingId); pendingId = null; }
    if (typeof prevReady === 'function') prevReady();
  };
  function createPlayer(id) {
    slot.innerHTML = '<div id="ytLightboxPlayer"></div>';
    player = new YT.Player('ytLightboxPlayer', {
      host: 'https://www.youtube-nocookie.com',
      videoId: id,
      playerVars: { autoplay: 1, rel: 0, origin: window.location.origin },
      events: { onReady: (e) => { e.target.setVolume(25); e.target.playVideo(); } }
    });
  }
  function open(id) {
    returnFocus = document.activeElement;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (apiReady) createPlayer(id); else { pendingId = id; loadApi(); }
    setTimeout(() => closeBtn.focus(), 50);
  }
  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (player && player.destroy) { player.destroy(); player = null; }
    slot.innerHTML = '';
    if (returnFocus && returnFocus.focus) { returnFocus.focus(); returnFocus = null; }
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close();
    if (e.key !== 'Tab' || !lightbox.classList.contains('is-open')) return;
    const f = Array.from(lightbox.querySelectorAll('button, iframe, [tabindex]:not([tabindex="-1"])'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (e.shiftKey) { if (a === first || !lightbox.contains(a)) { e.preventDefault(); last.focus(); } }
    else { if (a === last || !lightbox.contains(a)) { e.preventDefault(); first.focus(); } }
  });
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  window.openLightbox = open;
})();

// ---------------------------------------------------------------------------
//  Video belt (rule-3 safe: two identical sets, each translateX(0) -> -100%)
// ---------------------------------------------------------------------------
(function videoBelt() {
  const track = document.getElementById('beltTrack');
  if (!track) return;
  const sets = track.querySelectorAll('.belt-set');
  if (sets.length < 2) return;
  const first = sets[0];
  const originals = Array.prototype.slice.call(first.children);
  // repeat clusters until one set comfortably exceeds the viewport (seamless loop)
  let guard = 0;
  while (first.scrollWidth < window.innerWidth * 1.35 && guard++ < 12) {
    originals.forEach((c) => first.appendChild(c.cloneNode(true)));
  }
  sets[1].innerHTML = first.innerHTML;

  const speed = 42; // px/s
  const dur = (first.scrollWidth / speed).toFixed(2) + 's';
  sets.forEach((s) => { s.style.animationDuration = dur; });

  track.querySelectorAll('.reel-thumb').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.platform === 'tiktok') {
        window.open(btn.dataset.tiktokUrl, '_blank', 'noopener,noreferrer');
      } else if (window.openLightbox && btn.dataset.videoId) {
        window.openLightbox(btn.dataset.videoId);
      }
    });
  });
})();

// ---------------------------------------------------------------------------
//  WebGL capability check + boot
// ---------------------------------------------------------------------------
const canvas = document.getElementById('scene');
let webglOK = false;
try {
  const probe = document.createElement('canvas');
  webglOK = !!(window.WebGLRenderingContext &&
    (probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl')));
} catch (e) { webglOK = false; }

if (!webglOK || !canvas) {
  document.body.classList.add('no-webgl');
  finishLoader();
} else {
  try {
    initScene();
  } catch (err) {
    console.error('[test.js] scene init failed, falling back to 2D:', err);
    document.body.classList.add('no-webgl');
    finishLoader();
  }
}

// ---------------------------------------------------------------------------
//  The 3D scene
// ---------------------------------------------------------------------------
function initScene() {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c0b0a, 9, 24);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.6, 9);
  camera.lookAt(0, 0.15, 0);

  // ---- studio HDR environment (real IBL for the metal) ----
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  new RGBELoader().load('/assets/hdr/studio.hdr?v=2', (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose(); pmrem.dispose();
  });

  // ---- lights (accents on top of the HDR) ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(4, 7, 6);
  scene.add(key);
  const fillTop = new THREE.DirectionalLight(0xffffff, 1.4);
  fillTop.position.set(-2, 5, 8);
  scene.add(fillTop);
  const accent = new THREE.PointLight(new THREE.Color(SEASON[1]), 26, 40, 2);
  accent.position.set(-3, 2, 4);
  scene.add(accent);
  const rim = new THREE.PointLight(new THREE.Color(SEASON[2]), 20, 40, 2);
  rim.position.set(4, -2, 2);
  scene.add(rim);

  // ---- laptop (real GLB model, MacBook Pro 14) ----
  const laptop = new THREE.Group();
  laptop.position.set(0, -0.15, 0);
  laptop.rotation.y = -0.5;
  scene.add(laptop);

  // arrival: model glides from lower-right (angled) to centre (near front-on) on scroll
  const LAP_FROM = new THREE.Vector3(1.9, -1.05, 0.1);
  const LAP_TO = new THREE.Vector3(0, 0.12, 0);
  const YAW_FROM = -0.95, YAW_TO = -0.12;

  // screen surface: real Premiere timeline image if present, else a procedural NLE
  const scr = document.createElement('canvas');
  scr.width = 1600; scr.height = 1040;
  const sctx = scr.getContext('2d');
  const scrTex = new THREE.CanvasTexture(scr);
  scrTex.colorSpace = THREE.SRGBColorSpace;
  scrTex.flipY = false;                       // match glTF UV convention
  scrTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // set once the Premiere screenshot asset is in place; '' = use the procedural NLE
  const TIMELINE_SRC = '/assets/premiere-timeline.webp?v=1';
  let timelineImg = null;
  if (TIMELINE_SRC) {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { timelineImg = im; drawScreen(0); };
    im.onerror = () => {};
    im.src = TIMELINE_SRC;
  }

  // point light that "turns on" with the screen and spills onto the keys
  const screenGlow = new THREE.PointLight(new THREE.Color(SEASON[2]), 0, 8, 2);
  screenGlow.position.set(0, 1.35, 0.0);
  laptop.add(screenGlow);

  // soft contact shadow on the ground
  const shCanvas = document.createElement('canvas');
  shCanvas.width = shCanvas.height = 256;
  {
    const g = shCanvas.getContext('2d');
    const rg = g.createRadialGradient(128, 128, 6, 128, 128, 122);
    rg.addColorStop(0, 'rgba(0,0,0,0.5)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.beginPath(); g.ellipse(128, 128, 122, 80, 0, 0, Math.PI * 2); g.fill();
  }
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 4.4),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(shCanvas),
      transparent: true, depthWrite: false, opacity: 0
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -1.75;
  scene.add(contactShadow);

  // load the model
  let model = null;
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load('/assets/models/macbook/scene.gltf?v=2', (gltf) => {
    model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const ctr = box.getCenter(new THREE.Vector3());
    const s = (isMobile ? 2.7 : 3.5) / size.x;   // smaller on phones so it isn't cramped
    model.scale.setScalar(s);
    model.position.set(-ctr.x * s, -ctr.y * s, -ctr.z * s);

    let screenMesh = null;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      const m = o.material;
      const mn = m && m.name;
      if (mn === 'HlQwFCAPWzetDQy' || o.name === 'tfTbkkzhxqpKRgC') { screenMesh = o; return; }
      if (!m || m.isMeshBasicMaterial) return;
      // the Sketchfab metals are authored fully-rough -> they only show a dim
      // blurred env average. Sharpen them so aluminium catches the studio lights.
      if (m.metalness >= 0.5) {
        m.roughness = THREE.MathUtils.clamp((m.roughness || 1) * 0.32, 0.05, 0.38);
        m.metalness = 0.92;
        m.envMapIntensity = 2.6;
      } else {
        m.envMapIntensity = 1.6;
      }
      m.needsUpdate = true;
    });
    if (screenMesh) {
      screenMesh.material = new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false });
      const wp = screenMesh.getWorldPosition(new THREE.Vector3());
      laptop.worldToLocal(wp);
      screenGlow.position.copy(wp);
    }

    laptop.add(model);
    drawScreen(0);
    finishLoader();
    if (reduced) frame();
  }, undefined, (err) => {
    console.error('[test.js] GLB load failed, falling back to 2D:', err);
    document.body.classList.add('no-webgl');
    finishLoader();
  });

  // ---- floating file chips (anchored to the right, clear of the hero copy) ----
  const CHIP_TEXT = ['hook_v3.mp4', 'color_pass.png', 'voiceover_final.wav', 'export_4k.mp4'];
  // far to the right and BEHIND the laptop (negative z) so a chip never crosses
  // the model's screen; they also fade out as the model arrives centre-frame
  const CHIP_ANCHOR = [
    { x: 3.5, y: 2.7, z: -1.2, ph: 0.0, depth: 0.12 },
    { x: 4.0, y: 1.4, z: -1.6, ph: 1.7, depth: 0.09 },
    { x: 3.6, y: -1.7, z: -1.3, ph: 3.1, depth: 0.13 },
    { x: 4.1, y: -2.7, z: -1.7, ph: 4.6, depth: 0.10 }
  ];
  const chips = CHIP_TEXT.map((txt, i) => {
    const cc = document.createElement('canvas');
    cc.width = 700; cc.height = 150;
    const tex = new THREE.CanvasTexture(cc);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.37),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    const a = CHIP_ANCHOR[i];
    mesh.userData = { bx: a.x, by: a.y, bz: a.z, ph: a.ph, depth: a.depth };
    mesh.position.set(a.x, a.y, a.z);
    scene.add(mesh);
    return mesh;
  });

  function paintChip(mesh, txt) {
    const cc = mesh.material.map.image;
    const cx = cc.getContext('2d');
    cx.clearRect(0, 0, cc.width, cc.height);
    cx.fillStyle = 'rgba(22,20,19,0.92)';
    roundRect(cx, 6, 6, cc.width - 12, cc.height - 12, 16); cx.fill();
    cx.strokeStyle = 'rgba(243,239,233,0.20)'; cx.lineWidth = 2; cx.stroke();
    cx.fillStyle = SEASON[1];
    cx.fillRect(6, 6, 5, cc.height - 12);
    cx.fillStyle = '#f3efe9';
    cx.font = '600 40px "JetBrains Mono", ui-monospace, monospace';
    cx.textBaseline = 'middle';
    cx.fillText(txt, 34, cc.height / 2 + 2);
    mesh.material.map.needsUpdate = true;
  }
  chips.forEach((m, i) => paintChip(m, CHIP_TEXT[i]));

  // ---- screen painter: real Premiere screenshot if loaded, else procedural NLE ----
  const CLIP_COLORS = ['#7a4bd0', '#4b73d0', '#6f8f2e', '#8a6a2e', '#c1502e'];
  function drawScreen(t) {
    const w = scr.width, h = scr.height;

    if (timelineImg && timelineImg.naturalWidth) {
      // fit the full width of the timeline; Premiere's dark chrome fills the rest
      const iw = timelineImg.naturalWidth, ih = timelineImg.naturalHeight;
      const sc = w / iw;
      const dw = w, dh = ih * sc;
      sctx.fillStyle = '#0e0d0b'; sctx.fillRect(0, 0, w, h);
      sctx.drawImage(timelineImg, 0, 58 + (h - 58 - dh) * 0.5, dw, dh);
    } else {
      sctx.fillStyle = '#0c0b0a'; sctx.fillRect(0, 0, w, h);
      const scaleY = h / 600;
      for (let i = 0; i < 6; i++) {
        const ty = (150 + i * 130) * scaleY;
        const th = 96 * scaleY;
        sctx.fillStyle = '#131109'; sctx.fillRect(0, ty, w, th);
        let x = ((t * 34 * (i + 1)) % 260) - 260, k = 0;
        while (x < w) {
          const cw = 150 + ((i * 47 + k * 29) % 130);
          sctx.fillStyle = CLIP_COLORS[(i + k) % CLIP_COLORS.length];
          roundRect(sctx, x + 8, ty + 12, cw, th - 24, 8); sctx.fill();
          x += cw + 12; k++;
        }
      }
    }

    // Premiere-style top bar
    sctx.fillStyle = 'rgba(20,18,16,0.96)'; sctx.fillRect(0, 0, w, 60);
    sctx.fillStyle = SEASON[1]; sctx.fillRect(0, 0, 5, 60);
    sctx.fillStyle = '#c9c3ba';
    sctx.font = '600 26px "JetBrains Mono", ui-monospace, monospace';
    sctx.textBaseline = 'middle';
    sctx.fillText('PEET_EDIT_v3.prproj', 26, 31);
    sctx.fillStyle = '#f3efe9';
    sctx.fillText(timecode(t), w - 172, 31);

    // slow sweeping playhead
    const px = ((t * 0.055) % 1) * w;
    sctx.strokeStyle = 'rgba(243,239,233,0.9)'; sctx.lineWidth = 2;
    sctx.beginPath(); sctx.moveTo(px, 60); sctx.lineTo(px, h); sctx.stroke();
    sctx.fillStyle = '#f3efe9';
    sctx.beginPath();
    sctx.moveTo(px - 8, 60); sctx.lineTo(px + 8, 60); sctx.lineTo(px, 76);
    sctx.closePath(); sctx.fill();

    scrTex.needsUpdate = true;
  }

  // ---- interaction / scroll state ----
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!isMobile && !reduced) {
    window.addEventListener('pointermove', (e) => {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  const heroEl = document.getElementById('hero');
  let heroProgress = 0;
  let sceneFade = 1;
  function readScroll() {
    const hb = heroEl ? heroEl.offsetHeight : window.innerHeight;
    // the model finishes arriving well before the scene starts to fade, so it
    // gets a clean beat centre-frame before the 2D sections come up
    heroProgress = clamp(window.scrollY / (hb * 0.48), 0, 1);
    sceneFade = 1 - clamp((window.scrollY - hb * 0.6) / (hb * 0.28), 0, 1);
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // ---- render loop ----
  const clock = new THREE.Clock();
  let rafId = 0;
  let running = false;

  function frame() {
    const t = clock.getElapsedTime();

    ptr.x += (ptr.tx - ptr.x) * 0.05;
    ptr.y += (ptr.ty - ptr.y) * 0.05;

    const p = reduced ? 1 : easeInOut(heroProgress);   // arrival progress
    screenGlow.intensity = p * 3.2;

    // once the scene has faded out, skip the paint entirely (perf + no bleed-through)
    if (!reduced && sceneFade <= 0.02) {
      canvas.style.opacity = '0';
      if (running) rafId = requestAnimationFrame(frame);
      return;
    }

    if (!reduced) {
      // model glides from lower-right into the centre and turns to face us
      laptop.position.x = LAP_FROM.x + (LAP_TO.x - LAP_FROM.x) * p;
      laptop.position.z = LAP_FROM.z + (LAP_TO.z - LAP_FROM.z) * p;
      laptop.position.y = LAP_FROM.y + (LAP_TO.y - LAP_FROM.y) * p + Math.sin(t * 0.6) * 0.04;
      laptop.rotation.y = YAW_FROM + (YAW_TO - YAW_FROM) * p + Math.sin(t * 0.22) * 0.14 + ptr.x * 0.22;
      laptop.rotation.x = 0.03 + ptr.y * 0.07 + (1 - p) * 0.06;

      camera.position.z = 9 - heroProgress * 1.5;
      camera.position.y = 0.6 + heroProgress * 0.28;
      camera.position.x += ((ptr.x * 0.5) - camera.position.x) * 0.04;
      camera.lookAt(0, 0.28, 0);

      accent.position.x = -3 + ptr.x * 4;
      accent.position.y = 2 - ptr.y * 3;

      contactShadow.position.x = laptop.position.x;
      contactShadow.position.z = laptop.position.z + 0.3;
      contactShadow.material.opacity = 0.55 * p * sceneFade;

      const chipAlpha = (0.25 + sceneFade * 0.6) * (1 - p * 0.8);   // recede as the laptop lands
      for (const c of chips) {
        const u = c.userData;
        c.position.x = u.bx + Math.sin(t * 0.3 + u.ph) * 0.14 + ptr.x * u.depth;
        c.position.y = u.by + Math.cos(t * 0.4 + u.ph) * 0.16 - ptr.y * u.depth * 0.8;
        c.lookAt(camera.position);
        c.material.opacity = chipAlpha;
        c.visible = chipAlpha > 0.02;
      }

      canvas.style.opacity = sceneFade.toFixed(3);
      drawScreen(t);
    } else {
      laptop.position.copy(LAP_TO);
      laptop.rotation.y = YAW_TO;
      contactShadow.material.opacity = 0.4;
      for (const c of chips) c.lookAt(camera.position);
      drawScreen(0);
    }

    renderer.render(scene, camera);

    if (!reduced && running) rafId = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else if (!reduced) startLoop();
  });

  // pause the loop when the hero (the only 3D section in Pass 1) is well out of view
  if ('IntersectionObserver' in window && heroEl) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (reduced) return;
        if (en.isIntersecting || window.scrollY < window.innerHeight * 2) startLoop();
        else stopLoop();
      });
    }, { rootMargin: '100% 0px 100% 0px' });
    io.observe(heroEl);
  }

  // ---- go ----
  function boot() {
    // repaint canvas textures once webfonts are ready so the mono font shows
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        chips.forEach((m, i) => paintChip(m, CHIP_TEXT[i]));
        drawScreen(0);
      });
    }
    renderer.render(scene, camera);   // first paint (bg + chips; model streams in)
    // finishLoader() + the reduced-motion single render happen in the GLB callback.
    // The module-level 4s timeout is the safety net if the model never loads.
    if (!reduced) startLoop();
  }
  boot();
}
