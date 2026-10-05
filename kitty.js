/* Pixel kitty guide for nazhatanika.github.io
   A 32x32 pixel-art cat that walks ON the page, up to each block of text, highlights it,
   then holds up a little sign and pads away. */
(() => {
  'use strict';

  /* ---------------- configuration (paces) ---------------- */
  const PACES = {
    slow:   { walk: 90,  pause: 2900, hop: 500, label: 'Slow' },
    normal: { walk: 165, pause: 2000, hop: 340, label: 'Normal' },
    fast:   { walk: 310, pause: 1200, hop: 240, label: 'Fast' }
  };
  const STORE_KEY = 'kitty-guide-choice';
  const SPR = 32;                  // sprite grid: 32x32 pixels
  const SCALE = 4;                 // css pixels per sprite pixel -> 128px cat

  /* palette: two fur tones, cream, pink, warm dark outline */
  const PAL = {
    '#': '#43301f',   // outline
    'o': '#f2a94e',   // fur base
    'O': '#ffd08d',   // fur light
    '-': '#c67a2c',   // fur shadow
    'c': '#fff3dd',   // cream
    'p': '#f28aa0',   // pink
    'e': '#43301f',   // eye
    'w': '#ffffff',   // eye shine
    't': '#8fd0ff',   // tear
    's': '#ffd35c'    // sparkle
  };

  /* ---------------- pixel grid helpers ---------------- */
  const grid = () => Array.from({ length: SPR }, () => new Array(SPR).fill('.'));
  const get = (g, x, y) => (x >= 0 && y >= 0 && x < SPR && y < SPR) ? g[y][x] : '.';
  const set = (g, x, y, ch) => { if (x >= 0 && y >= 0 && x < SPR && y < SPR) g[y][x] = ch; };

  function ellipse(g, cx, cy, rx, ry, ch) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) set(g, x, y, ch);
      }
  }
  function rect(g, x, y, w, h, ch) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(g, x + i, y + j, ch);
  }
  function shade(g) {                        // top pixel of each column lighter, bottom two darker
    for (let x = 0; x < SPR; x++) {
      let top = -1, bot = -1;
      for (let y = 0; y < SPR; y++) if (g[y][x] === 'o') { if (top < 0) top = y; bot = y; }
      if (top < 0) continue;
      if (bot > top) g[bot][x] = '-';
      if (bot - 1 > top) g[bot - 1][x] = '-';
      if (g[top][x] === 'o') g[top][x] = 'O';
    }
  }
  function outline(g) {                      // one pixel of dark all around the silhouette
    const src = g.map(r => r.slice());
    for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
      if (src[y][x] !== '.') continue;
      if (get(src, x - 1, y) !== '.' || get(src, x + 1, y) !== '.' ||
          get(src, x, y - 1) !== '.' || get(src, x, y + 1) !== '.') set(g, x, y, '#');
    }
  }
  function shift(g, dy) {
    const copy = g.map(r => r.slice());
    for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++)
      g[y][x] = (y - dy >= 0 && y - dy < SPR) ? copy[y - dy][x] : '.';
  }

  /* ---------------- the cat ---------------- */
  function poseCfg(pose) {
    const P = { legs: [[0, 0], [0, 0], [0, 0], [0, 0]], tail: 'mid', eyes: 'open',
                ears: 'up', bob: 0, tear: false, sparkle: false };
    switch (pose) {
      case 'walk1': P.legs = [[2, 0], [-2, 0], [-2, 0], [2, 0]]; P.tail = 'sway1'; P.bob = -1; break;
      case 'walk2': P.legs = [[0, 2], [0, 0], [0, 0], [0, 2]]; break;
      case 'walk3': P.legs = [[-2, 0], [2, 0], [2, 0], [-2, 0]]; P.tail = 'sway1'; P.bob = -1; break;
      case 'walk4': P.legs = [[0, 0], [0, 2], [0, 2], [0, 0]]; break;
      case 'idle': P.tail = 'up'; break;
      case 'sit': P.tail = 'curl'; P.legs = [[0, 5], [0, 5], [0, 5], [0, 5]]; P.bob = 3; break;
      case 'happy1': P.eyes = 'happy'; P.tail = 'up'; P.bob = -2; P.sparkle = true; break;
      case 'happy2': P.eyes = 'happy'; P.tail = 'up'; P.bob = -5; P.sparkle = true; break;
      case 'sad': P.eyes = 'sad'; P.ears = 'down'; P.tear = true; P.tail = 'down'; P.bob = 1; break;
    }
    return P;
  }

  function drawTail(g, mode) {
    const paths = {
      up:    [[6, 14], [4, 13], [3, 11], [2, 9], [2, 6], [3, 4]],
      mid:   [[6, 14], [4, 13], [3, 11], [2, 9], [2, 7], [3, 6]],
      sway1: [[6, 14], [4, 13], [3, 12], [2, 10], [2, 8], [4, 7]],
      down:  [[6, 14], [4, 14], [3, 16], [2, 18], [3, 20]],
      curl:  [[5, 24], [7, 26], [10, 26], [13, 25]]
    };
    (paths[mode] || paths.mid).forEach(([x, y]) => rect(g, x, y, 3, 3, 'o'));
  }

  function drawEars(g, mode) {
    if (mode === 'down') {
      rect(g, 15, 4, 6, 2, 'o'); rect(g, 25, 4, 6, 2, 'o');
      set(g, 16, 5, 'p'); set(g, 29, 5, 'p');
      return;
    }
    const ear = (x0, y0) => {
      for (let i = 0; i < 5; i++) {
        const w = i + 2, sx = x0 + Math.floor((6 - w) / 2);
        for (let j = 0; j < w; j++) set(g, sx + j, y0 + i, 'o');
      }
      set(g, x0 + 2, y0 + 3, 'p'); set(g, x0 + 3, y0 + 3, 'p'); set(g, x0 + 3, y0 + 2, 'p');
    };
    ear(15, 0); ear(25, 0);
  }

  function drawFace(g, eyes, tear) {
    if (eyes === 'open') {
      rect(g, 19, 7, 2, 3, 'e'); rect(g, 26, 7, 2, 3, 'e');
      set(g, 19, 7, 'w'); set(g, 26, 7, 'w');
      set(g, 17, 11, 'p'); set(g, 18, 11, 'p'); set(g, 28, 11, 'p'); set(g, 29, 11, 'p');   // blush
    } else if (eyes === 'happy') {
      set(g, 18, 8, 'e'); set(g, 19, 7, 'e'); set(g, 20, 8, 'e');
      set(g, 25, 8, 'e'); set(g, 26, 7, 'e'); set(g, 27, 8, 'e');
      set(g, 17, 11, 'p'); set(g, 18, 11, 'p'); set(g, 28, 11, 'p'); set(g, 29, 11, 'p');
    } else if (eyes === 'sad') {
      rect(g, 19, 8, 2, 2, 'e'); rect(g, 26, 8, 2, 2, 'e');
      set(g, 19, 7, '-'); set(g, 20, 7, '-'); set(g, 26, 7, '-'); set(g, 27, 7, '-');
    }
    rect(g, 24, 12, 2, 1, 'p');                      // nose
    if (tear) { set(g, 29, 12, 't'); set(g, 29, 13, 't'); set(g, 29, 14, 't'); }
  }

  function buildCat(pose) {
    const P = poseCfg(pose);
    const g = grid();
    drawTail(g, P.tail);                             // behind everything
    [7, 11, 17, 21].forEach((x, i) => {              // legs, hidden behind the body
      const dx = P.legs[i][0], lift = P.legs[i][1];
      rect(g, x + dx, 20 - lift, 3, 8, 'o');
      rect(g, x + dx, 26 - lift, 3, 2, 'O');         // paw
    });
    ellipse(g, 14, 17, 9, 6.5, 'o');                 // body loaf
    ellipse(g, 17, 20.5, 5, 3, 'c');                 // cream chest and belly
    if (P.tail === 'curl') drawTail(g, 'curl');      // sitting: tail wraps round the front
    rect(g, 7, 11, 2, 3, '-'); rect(g, 11, 11, 2, 2, '-');   // back stripes
    ellipse(g, 22.5, 9.5, 7, 6.5, 'o');              // head
    ellipse(g, 24.5, 13, 3.5, 2.5, 'c');             // muzzle
    rect(g, 20, 4, 2, 3, '-'); rect(g, 24, 3, 2, 2, '-');    // head stripes
    drawEars(g, P.ears);
    drawFace(g, P.eyes, P.tear);
    shade(g);
    outline(g);
    if (P.sparkle) {
      [[3, 5], [30, 7], [2, 15], [29, 18]].forEach(([x, y]) => {
        set(g, x, y, 's'); set(g, x - 1, y, 's'); set(g, x + 1, y, 's');
        set(g, x, y - 1, 's'); set(g, x, y + 1, 's');
      });
    }
    if (P.bob) shift(g, P.bob);
    return g;
  }

  const frames = new Map();
  function frameCanvas(pose) {
    if (frames.has(pose)) return frames.get(pose);
    const g = buildCat(pose);
    const cv = document.createElement('canvas');
    cv.width = SPR; cv.height = SPR;
    const cx = cv.getContext('2d');
    for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
      const ch = g[y][x];
      if (ch === '.') continue;
      cx.fillStyle = PAL[ch] || '#ff00ff';
      cx.fillRect(x, y, 1, 1);
    }
    frames.set(pose, cv);
    return cv;
  }

  /* ---------------- tour script ---------------- */
  const STEPS = [
    { sel: '.hero .lede',                     say: 'Hi, I am the pixel kitty. This is Anika: computer science and math at Mount Holyoke, and she likes cats.' },
    { sel: '#projects .card:nth-child(1)',    say: 'Project one: a model that predicts which customers will come back, plus dashboards for the support team.' },
    { sel: '#projects .card:nth-child(2)',    say: 'Project two: a pipeline that predicts how robots perform, shipped as a Dockerized API.' },
    { sel: '#experience .job:nth-child(1)',   say: 'She trained generative models on biological data at NITMB.' },
    { sel: '#experience .job:nth-child(2)',   say: 'Then at the RNA Institute she built pipelines that turn messy biomedical data into something usable.' },
    { sel: '#experience .job:nth-child(3)',   say: 'She also runs the student team at the IT Help Desk on campus.' },
    { sel: '#experience .job:nth-child(4)',   say: 'And she mentors other students in statistics, machine learning, and data visualization.' },
    { sel: '#skills .skills',                 say: 'Here is everything she works with, from Python and SQL to Windows, macOS, and Linux.' },
    { sel: '#recognition .card:nth-child(1)', say: 'She was selected for the NITMB summer research program and gave a talk on modeling cell state transitions.' },
    { sel: '#recognition .card:nth-child(2)', say: 'She was also picked for the RNA Institute bioinformatics program.' },
    { sel: '#recognition .card:nth-child(3)', say: 'Her team won an award in the college AWS generative AI competition.' },
    { sel: '#contact',                        say: 'And that is everything. Thanks for walking around with me!' }
  ];

  /* ---------------- engine ---------------- */
  let pace = 'normal';
  let running = false, aborted = false, snap = false, lastScroll = 0;
  let cat = null, bubble = null, sign = null, prompt = null;
  const state = { x: 0, y: 0, tx: 0, ty: 0, dir: 1, frame: 0, mode: 'idle', moving: false, leaving: false, onArrive: null };

  const cfg = () => PACES[pace] || PACES.normal;
  const catW = () => SPR * SCALE;
  const catH = () => SPR * SCALE;
  const pageW = () => document.documentElement.clientWidth;

  function ensureDom() {
    if (cat) return;
    cat = document.createElement('canvas');
    cat.className = 'kitty';
    cat.width = catW(); cat.height = catH();
    cat.setAttribute('aria-hidden', 'true');
    cat.style.display = 'none';
    document.body.appendChild(cat);

    bubble = document.createElement('div');
    bubble.className = 'kitty-bubble';
    bubble.style.display = 'none';
    document.body.appendChild(bubble);

    sign = document.createElement('div');
    sign.className = 'kitty-sign';
    sign.style.display = 'none';
    document.body.appendChild(sign);
  }

  function render() {
    if (!cat) return;
    const ctx = cat.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cat.width, cat.height);
    ctx.save();
    if (state.dir < 0) { ctx.translate(cat.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(frameCanvas(state.mode), 0, 0, cat.width, cat.height);
    ctx.restore();
    cat.style.left = Math.round(state.x) + 'px';
    cat.style.top = Math.round(state.y) + 'px';
  }

  function keepInView() {                       // camera follows the cat down the page
    const now = Date.now();
    if (now - lastScroll < 420) return;
    const vy = state.y - window.scrollY;
    const low = window.innerHeight - 190;
    if (vy > low) { lastScroll = now; window.scrollTo({ top: Math.round(window.scrollY + (vy - low)), behavior: 'smooth' }); }
    else if (vy < 90) { lastScroll = now; window.scrollTo({ top: Math.max(0, Math.round(window.scrollY + vy - 150)), behavior: 'smooth' }); }
  }

  function loop() {
    const speed = cfg().walk, dt = 1 / 60;
    const cycle = ['walk1', 'walk2', 'walk3', 'walk4'];

    if (state.moving) {
      const dx = state.tx - state.x, dy = state.ty - state.y;
      const dist = Math.hypot(dx, dy), step = speed * dt;
      if (dist <= step) { state.x = state.tx; state.y = state.ty; }
      else { state.x += dx / dist * step; state.y += dy / dist * step; }
      if (Math.abs(dx) > 3) state.dir = dx > 0 ? 1 : -1;
      state.frame += step / (SPR * SCALE / 9);
      state.mode = cycle[Math.floor(state.frame) % 4];
      if (state.x === state.tx && state.y === state.ty) {
        state.moving = false; state.mode = 'idle';
        const f = state.onArrive; state.onArrive = null;
        render();
        if (f) f();                                    // may queue the next walk
        if (!state.moving && !state.leaving) { running = false; return; }
      } else {
        keepInView();
      }
    } else if (state.leaving) {
      state.x -= speed * dt * 1.6;
      state.frame += 0.28;
      state.mode = cycle[Math.floor(state.frame) % 4];
      keepInView();
      if (state.x < -catW() - 40) {
        state.leaving = false; running = false;
        cat.style.display = 'none';
        return;
      }
    }

    render();
    if (running) requestAnimationFrame(loop);
  }

  function run() { if (!running) { running = true; requestAnimationFrame(loop); } }

  function walkTo(tx, ty, cb) {
    tx = Math.max(8, Math.min(pageW() - catW() - 8, tx));
    ty = Math.max(window.scrollY + 40, ty);
    state.tx = tx; state.ty = ty;
    if (Math.abs(tx - state.x) > 3) state.dir = tx >= state.x ? 1 : -1;
    state.onArrive = cb;
    state.moving = true;
    cat.style.display = 'block';
    run();
    if (snap) { state.x = tx; state.y = ty; state.moving = false; render(); if (cb) cb(); }
  }

  function showBubble(text) {
    bubble.innerHTML = '<span class="kitty-text"></span><button class="kitty-x" aria-label="End the tour">x</button>';
    bubble.querySelector('.kitty-text').textContent = text;
    bubble.querySelector('.kitty-x').addEventListener('click', () => { stopTour(); walkOff(); });
    bubble.style.display = 'block';
    positionBubble();
  }

  function positionBubble() {
    if (!bubble || bubble.style.display === 'none') return;
    const w = bubble.offsetWidth, h = bubble.offsetHeight;
    let x = state.x + catW() / 2 - w / 2;
    x = Math.max(window.scrollX + 12, Math.min(window.scrollX + pageW() - w - 12, x));
    bubble.style.left = Math.round(x) + 'px';
    bubble.style.top = Math.round(state.y - h - 12) + 'px';
  }

  function highlight(el) {
    document.querySelectorAll('.kitty-highlight').forEach(e => e.classList.remove('kitty-highlight'));
    if (el) el.classList.add('kitty-highlight');
  }

  function stopTour() {
    aborted = true; state.moving = false;
    highlight(null);
    if (bubble) bubble.style.display = 'none';
    if (sign) sign.style.display = 'none';
  }

  function tourStep(i) {
    if (aborted) return;
    if (i >= STEPS.length) { showSign(); return; }
    const el = document.querySelector(STEPS[i].sel);
    if (!el) { tourStep(i + 1); return; }
    const r = el.getBoundingClientRect();
    const px = r.left + window.scrollX, py = r.top + window.scrollY;
    let tx, ty;
    if (r.left > catW() + 16) { tx = px - catW() - 10; ty = py + 4; }     // stand to the left of the block
    else { tx = px + 4; ty = py + r.height + 2; }                          // no room: stand under it
    walkTo(tx, ty, () => {
      highlight(el);
      showBubble(STEPS[i].say);
      const wait = cfg().pause + Math.min(1500, STEPS[i].say.length * 9);
      setTimeout(() => { if (!aborted) tourStep(i + 1); }, wait);
    });
  }

  function showSign() {
    highlight(null);
    state.mode = 'sit';
    render();
    bubble.style.display = 'none';
    sign.innerHTML = '<div class="kitty-sign-board">Hope you enjoy!</div>';
    sign.style.display = 'block';
    positionSign();
    setTimeout(() => {
      if (aborted) return;
      sign.style.display = 'none';
      state.mode = 'happy1'; render();
      setTimeout(() => { state.mode = 'happy2'; render(); }, cfg().hop);
      setTimeout(() => { if (!aborted) walkOff(); }, cfg().hop * 2.4);
    }, 3000);
  }

  function positionSign() {
    if (!sign || sign.style.display === 'none') return;
    const w = sign.offsetWidth, h = sign.offsetHeight;
    let x = state.x + catW() / 2 - w / 2;
    x = Math.max(window.scrollX + 12, Math.min(window.scrollX + pageW() - w - 12, x));
    sign.style.left = Math.round(x) + 'px';
    sign.style.top = Math.round(state.y - h - 14) + 'px';
  }

  function walkOff() {
    state.dir = -1;
    state.leaving = true;
    state.frame = 0;
    cat.style.display = 'block';
    run();
  }

  /* ---------------- entry prompt ---------------- */
  function showPrompt() {
    prompt = document.createElement('div');
    prompt.className = 'kitty-prompt';
    prompt.innerHTML =
      '<div class="kitty-prompt-title">A pixel kitty wants to show you around</div>' +
      '<div class="kitty-prompt-body">It walks the page, sits by each part, and waves goodbye at the end.</div>' +
      '<div class="kitty-paces" role="radiogroup" aria-label="Walking pace">' +
      '<button data-pace="slow">Slow</button><button data-pace="normal" class="on">Normal</button><button data-pace="fast">Fast</button></div>' +
      '<div class="kitty-prompt-btns"><button class="kitty-start">Yes, take the tour</button><button class="kitty-skip">No thanks</button></div>';
    document.body.appendChild(prompt);
    prompt.querySelectorAll('[data-pace]').forEach(b => b.addEventListener('click', () => {
      pace = b.dataset.pace;
      prompt.querySelectorAll('[data-pace]').forEach(o => o.classList.toggle('on', o === b));
    }));
    prompt.querySelector('.kitty-start').addEventListener('click', () => { remember('yes'); prompt.remove(); start(); });
    prompt.querySelector('.kitty-skip').addEventListener('click', () => { remember('no'); prompt.remove(); });
  }

  function remember(v) { try { localStorage.setItem(STORE_KEY, v); } catch (e) {} }
  function recalled() { try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; } }

  function start(fromStep) {
    ensureDom();
    stopTour();
    aborted = false;
    const i = fromStep || 0;
    const el = document.querySelector(STEPS[Math.min(i, STEPS.length - 1)].sel);
    const r = el ? el.getBoundingClientRect() : { top: 0, left: 0 };
    state.y = r.top + window.scrollY;
    state.x = -catW() - 30;
    state.dir = 1;
    state.mode = 'walk1';
    state.moving = false;
    state.leaving = false;
    cat.style.display = 'block';
    render();
    run();
    tourStep(i);
  }

  function addNavButton() {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'kitty-nav';
    a.title = 'Take the kitty tour';
    a.textContent = 'Kitty tour';
    a.addEventListener('click', (e) => { e.preventDefault(); start(); });
    nav.appendChild(a);
  }

  function init() {
    ensureDom();
    addNavButton();
    const params = new URLSearchParams(location.search);
    if (params.get('kitty') === 'sheet') {          // debug: every pose in one strip
      const poses = ['walk1', 'walk2', 'walk3', 'walk4', 'idle', 'sit', 'happy1', 'happy2', 'sad'];
      const sheet = document.createElement('canvas');
      sheet.width = poses.length * catW(); sheet.height = catH();
      sheet.style.cssText = 'position:fixed;left:0;top:0;z-index:99;background:#fff;image-rendering:pixelated';
      document.body.appendChild(sheet);
      const sc = sheet.getContext('2d');
      sc.imageSmoothingEnabled = false;
      poses.forEach((p, i) => sc.drawImage(frameCanvas(p), i * catW(), 0, catW(), catH()));
      return;
    }
    if (params.get('kitty') === '1') {              // debug: jump straight in
      pace = params.get('pace') || 'normal';
      snap = params.get('snap') === '1';
      const pose = params.get('pose');              // debug: freeze one pose on screen
      if (pose) {
        state.x = 140; state.y = window.scrollY + 160;
        state.mode = pose; cat.style.display = 'block'; render();
        return;
      }
      const step = parseInt(params.get('step') || '0', 10);
      start(step > 0 ? step : 0);
      return;
    }
    if (recalled()) return;                          // already asked once
    setTimeout(showPrompt, 1200);
  }

  window.addEventListener('resize', () => { positionBubble(); positionSign(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
