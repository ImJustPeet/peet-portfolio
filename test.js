// ============================================================================
//  test.js  —  3D concept page for donovanpeet.com/test  (Pass 1)
//  Vanilla ESM. Three.js vendored locally at /assets/three/.
//  The HTML content works fully without this script; 3D is an enhancement.
// ============================================================================

import * as THREE from '/assets/three/three.module.min.js';

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

// rounded-rectangle THREE.Shape centred on the origin
function roundedShape(w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// soft-edged panel: rounded rect extruded with a small bevel, then centred.
// axis 'y' -> flat slab (thin on Y); axis 'z' -> upright panel (thin on Z)
function roundedPanel(w, h, thick, radius, mat, axis) {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w, h, radius), {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: thick * 0.4,
    bevelSize: thick * 0.4,
    bevelSegments: 4,
    curveSegments: 14
  });
  geo.center();
  if (axis === 'y') geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = mesh.receiveShadow = false;
  return mesh;
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

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c0b0a, 9, 24);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.6, 9);
  camera.lookAt(0, 0.15, 0);

  // ---- soft studio reflections (procedural, no asset / no addon) ----
  const envCanvas = document.createElement('canvas');
  envCanvas.width = 64; envCanvas.height = 160;
  {
    const g = envCanvas.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 160);
    grd.addColorStop(0.00, '#c9c2b4');   // bright soft key overhead
    grd.addColorStop(0.35, '#6b6459');
    grd.addColorStop(0.52, '#332f2a');
    grd.addColorStop(1.00, '#0b0a09');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 160);
    g.fillStyle = 'rgba(255,150,80,0.55)'; g.fillRect(0, 6, 64, 24);    // warm rim
    g.fillStyle = 'rgba(90,200,210,0.30)'; g.fillRect(0, 128, 64, 18);  // cool bounce
  }
  const envTex = new THREE.CanvasTexture(envCanvas);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  pmrem.dispose(); envTex.dispose();

  // ---- lights ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(4, 7, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 1.0);
  fill.position.set(-3, 1, 8);
  scene.add(fill);
  const accent = new THREE.PointLight(new THREE.Color(SEASON[1]), 34, 40, 2);
  accent.position.set(-3, 2, 4);
  scene.add(accent);
  const rim = new THREE.PointLight(new THREE.Color(SEASON[2]), 22, 40, 2);
  rim.position.set(4, -2, 2);
  scene.add(rim);

  // ---- laptop ----
  const laptop = new THREE.Group();
  const W = 3.5, D = 2.42;                         // body footprint
  const aluMat = new THREE.MeshStandardMaterial({ color: 0x8b8781, metalness: 1.0, roughness: 0.44, envMapIntensity: 2.0 });
  const wellMat = new THREE.MeshStandardMaterial({ color: 0x0d0c0b, metalness: 0.6, roughness: 0.7 });
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x1b1815, metalness: 0.35, roughness: 0.55 });
  const padMat = new THREE.MeshStandardMaterial({ color: 0x211e1b, metalness: 0.8, roughness: 0.3, envMapIntensity: 1.4 });
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x090807, metalness: 0.25, roughness: 0.45 });

  // base slab
  const base = roundedPanel(W, D, 0.16, 0.16, aluMat, 'y');
  base.position.y = 0;
  laptop.add(base);

  // recessed keyboard well
  const well = roundedPanel(W - 0.5, 1.28, 0.05, 0.08, wellMat, 'y');
  well.position.set(0, 0.085, -0.36);
  laptop.add(well);

  // instanced keycaps
  const KCOLS = 15, KROWS = 5, KGAP = 0.192, KSZ = 0.15;
  const keyGeo = new THREE.BoxGeometry(KSZ, 0.05, KSZ);
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, KCOLS * KROWS + 1);
  const dummy = new THREE.Object3D();
  let ki = 0;
  const kx0 = -((KCOLS - 1) * KGAP) / 2;
  const kz0 = -0.36 - ((KROWS - 1) * KGAP) / 2;
  for (let r = 0; r < KROWS; r++) {
    for (let c = 0; c < KCOLS; c++) {
      dummy.position.set(kx0 + c * KGAP, 0.115, kz0 + r * KGAP);
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      keys.setMatrixAt(ki++, dummy.matrix);
    }
  }
  dummy.position.set(0, 0.115, kz0 + (KROWS - 0.15) * KGAP);   // spacebar
  dummy.scale.set(4.6, 1, 1); dummy.updateMatrix();
  keys.setMatrixAt(ki++, dummy.matrix);
  keys.instanceMatrix.needsUpdate = true;
  laptop.add(keys);

  // trackpad
  const trackpad = roundedPanel(1.28, 0.86, 0.02, 0.06, padMat, 'y');
  trackpad.position.set(0, 0.084, 0.62);
  laptop.add(trackpad);

  // hinge barrel + pivot at the rear edge of the base
  const hingeBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, W - 0.5, 20),
    new THREE.MeshStandardMaterial({ color: 0x161311, metalness: 0.9, roughness: 0.5 })
  );
  hingeBar.rotation.z = Math.PI / 2;
  hingeBar.position.set(0, 0.075, -D / 2 + 0.05);
  laptop.add(hingeBar);

  const hinge = new THREE.Group();
  hinge.position.set(0, 0.075, -D / 2 + 0.05);
  laptop.add(hinge);

  // lid: upright rounded panel, thin on Z
  const LID_H = 2.28;
  const lid = roundedPanel(W, LID_H, 0.09, 0.12, aluMat, 'z');
  lid.position.set(0, LID_H / 2, 0);
  hinge.add(lid);

  // black bezel frame just in front of the lid
  const bezel = roundedPanel(W - 0.16, LID_H - 0.16, 0.02, 0.09, bezelMat, 'z');
  bezel.position.set(0, LID_H / 2, 0.05);
  hinge.add(bezel);

  // camera notch
  const notch = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x05213a, metalness: 0.1, roughness: 0.2 })
  );
  notch.position.set(0, LID_H - 0.11, 0.075);
  hinge.add(notch);

  // ---- animated NLE screen (canvas texture) ----
  const scr = document.createElement('canvas');
  scr.width = 1024; scr.height = 600;
  const sctx = scr.getContext('2d');
  const scrTex = new THREE.CanvasTexture(scr);
  scrTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.42, (W - 0.42) * (scr.height / scr.width)),
    new THREE.MeshBasicMaterial({ map: scrTex })
  );
  screen.position.set(0, LID_H / 2 + 0.02, 0.10);
  hinge.add(screen);

  // faint screen glow spilling onto the keyboard
  const screenGlow = new THREE.PointLight(new THREE.Color(SEASON[2]), 0, 6, 2);
  screenGlow.position.set(0, LID_H * 0.4, 0.5);
  hinge.add(screenGlow);

  // rotation.x = 0  -> lid vertical, screen faces the viewer (+Z)
  // rotation.x > 0  -> lid tips forward onto the keyboard (closed)
  // rotation.x < 0  -> lid leans back past vertical (open working angle)
  const LID_CLOSED = 1.35;    // nearly shut
  const LID_OPEN = -0.22;     // ~103 degrees, natural open angle toward viewer
  hinge.rotation.x = LID_CLOSED;

  laptop.position.set(0, -0.1, 0);
  laptop.rotation.y = -0.5;
  scene.add(laptop);

  // laptop drifts from lower-right (peeking) to centre as the lid opens
  const LAP_FROM = new THREE.Vector3(1.7, -1.0, 0.4);
  const LAP_TO = new THREE.Vector3(0, -0.1, 0);

  // ---- floating file chips (anchored to the right, clear of the hero copy) ----
  const CHIP_TEXT = ['hook_v3.mp4', 'color_pass.png', 'voiceover_final.wav', 'export_4k.mp4'];
  const CHIP_ANCHOR = [
    { x: 2.15, y: 2.05, z: 0.4, ph: 0.0, depth: 0.12 },
    { x: 2.45, y: 0.70, z: -0.6, ph: 1.7, depth: 0.08 },
    { x: 2.15, y: -0.80, z: 0.7, ph: 3.1, depth: 0.14 },
    { x: 2.45, y: -1.95, z: -0.1, ph: 4.6, depth: 0.10 }
  ];
  const chips = CHIP_TEXT.map((txt, i) => {
    const cc = document.createElement('canvas');
    cc.width = 700; cc.height = 150;
    const tex = new THREE.CanvasTexture(cc);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.43),
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

  // ---- screen painter ----
  const CLIP_COLORS = ['#ff7a2f', '#57c2c9', '#8fd694', '#ffb84d', '#c1502e'];
  const TRACK_Y = [92, 192, 300, 402, 500];
  function drawScreen(t) {
    const w = scr.width, h = scr.height;
    sctx.fillStyle = '#0c0b0a'; sctx.fillRect(0, 0, w, h);

    sctx.fillStyle = '#161413'; sctx.fillRect(0, 0, w, 56);
    sctx.fillStyle = SEASON[1]; sctx.fillRect(0, 0, 4, 56);
    sctx.fillStyle = '#9b948c';
    sctx.font = '22px "JetBrains Mono", ui-monospace, monospace';
    sctx.textBaseline = 'alphabetic';
    sctx.fillText('PEET_EDIT_v3.prproj', 22, 36);
    sctx.fillStyle = '#f3efe9';
    sctx.fillText(timecode(t), w - 150, 36);

    for (let i = 0; i < TRACK_Y.length; i++) {
      const ty = TRACK_Y[i];
      sctx.fillStyle = '#131109'; sctx.fillRect(0, ty, w, 76);
      sctx.strokeStyle = 'rgba(243,239,233,0.04)';
      sctx.beginPath(); sctx.moveTo(0, ty); sctx.lineTo(w, ty); sctx.stroke();

      let x = ((t * 34 * (i + 1)) % 260) - 260;
      let k = 0;
      while (x < w) {
        const cw = 110 + ((i * 47 + k * 29) % 96);
        sctx.fillStyle = CLIP_COLORS[(i + k) % CLIP_COLORS.length];
        roundRect(sctx, x + 6, ty + 9, cw, 58, 8); sctx.fill();
        if (i === 1 || i === 2) {
          sctx.strokeStyle = 'rgba(12,11,10,0.45)'; sctx.lineWidth = 1;
          sctx.beginPath();
          for (let px = 0; px < cw; px += 5) {
            const amp = Math.abs(Math.sin((x + px) * 0.12 + t * 3 + i)) * 20;
            sctx.moveTo(x + 6 + px, ty + 38 - amp);
            sctx.lineTo(x + 6 + px, ty + 38 + amp);
          }
          sctx.stroke();
        }
        x += cw + 10; k++;
      }
    }

    const px = (Math.sin(t * 0.55) * 0.5 + 0.5) * w;
    sctx.strokeStyle = '#f3efe9'; sctx.lineWidth = 2;
    sctx.beginPath(); sctx.moveTo(px, 56); sctx.lineTo(px, h); sctx.stroke();
    sctx.fillStyle = '#f3efe9';
    sctx.beginPath();
    sctx.moveTo(px - 7, 56); sctx.lineTo(px + 7, 56); sctx.lineTo(px, 70);
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
    heroProgress = clamp(window.scrollY / (hb * 0.82), 0, 1);
    // scene is fully opaque through the hero, then fades right out before the
    // next section arrives so the 2D content reads cleanly
    sceneFade = 1 - clamp((window.scrollY - hb * 0.45) / (hb * 0.27), 0, 1);
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

    const open = reduced ? 1 : easeInOut(heroProgress);
    hinge.rotation.x = LID_CLOSED + (LID_OPEN - LID_CLOSED) * open;
    screenGlow.intensity = open * 3.4;

    // once the scene has faded out, skip the paint entirely (perf + no bleed-through)
    if (!reduced && sceneFade <= 0.02) {
      canvas.style.opacity = '0';
      if (running) rafId = requestAnimationFrame(frame);
      return;
    }

    if (!reduced) {
      // laptop glides from lower-right into the centre as the lid opens
      laptop.position.x = LAP_FROM.x + (LAP_TO.x - LAP_FROM.x) * open;
      laptop.position.z = LAP_FROM.z + (LAP_TO.z - LAP_FROM.z) * open;
      laptop.position.y = LAP_FROM.y + (LAP_TO.y - LAP_FROM.y) * open + Math.sin(t * 0.6) * 0.05;
      laptop.rotation.y = -0.5 + Math.sin(t * 0.25) * 0.2 + ptr.x * 0.3 + (1 - open) * 0.55;
      laptop.rotation.x = 0.02 + ptr.y * 0.09;

      camera.position.z = 9 - heroProgress * 1.1;
      camera.position.y = 0.6 + heroProgress * 0.24;
      camera.position.x += ((ptr.x * 0.5) - camera.position.x) * 0.04;
      camera.lookAt(0, 0.15, 0);

      accent.position.x = -3 + ptr.x * 4;
      accent.position.y = 2 - ptr.y * 3;

      for (const c of chips) {
        const u = c.userData;
        c.position.x = u.bx + Math.sin(t * 0.3 + u.ph) * 0.14 + ptr.x * u.depth;
        c.position.y = u.by + Math.cos(t * 0.4 + u.ph) * 0.16 - ptr.y * u.depth * 0.8;
        c.lookAt(camera.position);
        c.material.opacity = 0.3 + sceneFade * 0.65;
      }

      canvas.style.opacity = sceneFade.toFixed(3);
      drawScreen(t);
    } else {
      laptop.position.copy(LAP_TO);
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
    renderer.render(scene, camera);   // first paint
    finishLoader();
    if (reduced) { hinge.rotation.x = LID_OPEN; frame(); }
    else { startLoop(); }
  }
  boot();
}
