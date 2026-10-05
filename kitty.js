/* Pixel kitty guide for nazhatanika.github.io
   A canvas-drawn pixel cat that walks the page, highlights each block, and ends with a sign. */
(() => {
  'use strict';

  /* ---------------- configuration (paces) ---------------- */
  const PACES = {
    slow:   { walk: 95,  pause: 2800, hop: 460, label: 'Slow' },
    normal: { walk: 175, pause: 1900, hop: 320, label: 'Normal' },
    fast:   { walk: 320, pause: 1150, hop: 230, label: 'Fast' }
  };
  const STORE_KEY = 'kitty-guide-choice';
  const SCALE = 7;                 // css pixels per sprite pixel
  const GRID_W = 20, GRID_H = 16;

  const C = {
    fur: '#e8a34a', fur2: '#f4c184', cream: '#fdeed3',
    eye: '#2b2b33', pink: '#e8798f', tear: '#7fc4ff', spark: '#ffd35c', white: '#ffffff'
  };

  /* ---------------- sprite drawing ----------------
     Drawn on an integer pixel grid so the cat stays crisp.
     Poses: walk1..walk4, idle, sit, happy1, happy2, sad */
  function drawCat(ctx, pose) {
    const px = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x) * SCALE, Math.round(y) * SCALE, w * SCALE, h * SCALE);
    };

    let bob = 0, tailSway = 0;
    let eyes = 'open', tear = false, tailUp = false, earDown = false, sit = false;
    let legs = [[0, 0], [0, 0], [0, 0], [0, 0]];   // [dx, lift] per leg: front L, front R, back L, back R

    switch (pose) {
      case 'walk1': legs = [[2, 0], [-2, 0], [-2, 0], [2, 0]]; tailSway = 1; bob = -1; break;
      case 'walk2': legs = [[0, 2], [0, 0], [0, 0], [0, 2]]; tailSway = 0; bob = 0; break;
      case 'walk3': legs = [[-2, 0], [2, 0], [2, 0], [-2, 0]]; tailSway = -1; bob = -1; break;
      case 'walk4': legs = [[0, 0], [0, 2], [0, 2], [0, 0]]; tailSway = 0; bob = 0; break;
      case 'idle': tailUp = true; break;
      case 'sit': sit = true; tailUp = true; break;
      case 'happy1': eyes = 'happy'; tailUp = true; bob = -2; break;
      case 'happy2': eyes = 'happy'; tailUp = true; bob = -5; legs = [[0, 2], [0, 2], [0, 2], [0, 2]]; break;
      case 'sad': eyes = 'sad'; tear = true; earDown = true; tailSway = -1; bob = 1; break;
    }

    const by = 6 + bob + (sit ? 2 : 0);
    const hy = 0 + bob + (sit ? 2 : 0);

    if (sit) {
      px(4, by + 2, 10, 5, C.fur);                 // haunches
      px(4, by + 2, 10, 1, C.fur2);
      px(5, by + 1, 8, 2, C.fur);                  // chest
      px(6, by + 3, 6, 4, C.cream);                // belly
      px(4, by + 6, 2, 2, C.fur);                  // front paws
      px(12, by + 6, 2, 2, C.fur);
      px(13, by + 5, 3, 1, C.fur);                 // tail curled round
      px(15, by + 4, 1, 2, C.fur);
      px(14, by + 3, 2, 1, C.fur);
    } else {
      px(4, by, 10, 6, C.fur);                     // body
      px(4, by, 10, 1, C.fur2);                    // back highlight
      px(6, by + 2, 6, 4, C.cream);                // chest and belly
      [5, 7, 10, 12].forEach((x, i) => {           // legs on top so lifts stay visible
        const dx = legs[i][0], lift = legs[i][1];
        px(x + dx, by + 5 - lift, 2, 3, C.fur);
        px(x + dx, by + 7 - lift, 2, 1, C.fur2);   // paw
      });
      const tx = 14 + tailSway, ty = by + 2;
      if (tailUp) {
        px(tx, ty, 2, 1, C.fur); px(tx + 1, ty - 2, 1, 2, C.fur);
        px(tx + 2, ty - 4, 1, 2, C.fur); px(tx + 1, ty - 5, 2, 1, C.fur);
      } else {
        px(tx, ty, 2, 1, C.fur); px(tx + 1, ty - 1, 2, 1, C.fur); px(tx + 2, ty - 2, 1, 2, C.fur);
      }
    }

    px(5, hy + 1, 8, 5, C.fur);                    // head
    px(5, hy + 1, 8, 1, C.fur2);
    if (earDown) {
      px(5, hy, 2, 1, C.fur); px(11, hy, 2, 1, C.fur);
      px(5, hy + 1, 1, 1, C.pink); px(12, hy + 1, 1, 1, C.pink);
    } else {
      px(5, hy - 1, 2, 2, C.fur); px(11, hy - 1, 2, 2, C.fur);
      px(5, hy, 1, 1, C.pink); px(12, hy, 1, 1, C.pink);
    }
    px(7, hy + 3, 4, 2, C.cream);                  // muzzle
    if (eyes === 'open') {
      px(7, hy + 2, 1, 2, C.eye); px(10, hy + 2, 1, 2, C.eye);
      px(7, hy + 2, 1, 1, C.white); px(10, hy + 2, 1, 1, C.white);
    } else if (eyes === 'happy') {
      px(6, hy + 2, 2, 1, C.eye); px(9, hy + 2, 2, 1, C.eye);
      px(6, hy + 1, 1, 1, C.eye); px(10, hy + 1, 1, 1, C.eye);
    } else if (eyes === 'sad') {
      px(7, hy + 2, 1, 2, C.eye); px(10, hy + 2, 1, 2, C.eye);
    }
    px(8, hy + 4, 1, 1, C.pink);                   // nose
    if (tear) { px(11, hy + 4, 1, 1, C.tear); px(11, hy + 5, 1, 1, C.tear); }
    if (pose === 'happy1' || pose === 'happy2') {
      const s = pose === 'happy1' ? 0 : 1;
      px(2, hy - 1 - s, 1, 1, C.spark); px(15, hy - 2 - s, 1, 1, C.spark);
      px(1, hy + 2, 1, 1, C.spark); px(17, hy + 1 - s, 1, 1, C.spark);
      if (s) { px(9, hy - 4, 1, 1, C.spark); px(4, hy - 3, 1, 1, C.spark); }
    }
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
    { sel: '#contact',                        say: 'That is the whole tour. One more thing...' }
  ];

  /* ---------------- engine ---------------- */
  let pace = 'normal';
  let running = false, aborted = false, autoEnd = null, snap = false;
  let cat = null, bubble = null, sign = null, prompt = null;
  const state = { x: 0, targetX: 0, dir: 1, frame: 0, mode: 'idle', bob: 0, moving: false, leaving: false, onArrive: null };

  const cfg = () => PACES[pace] || PACES.normal;
  const canvasW = () => GRID_W * SCALE;
  const canvasH = () => GRID_H * SCALE;

  function ensureDom() {
    if (cat) return;
    cat = document.createElement('canvas');
    cat.className = 'kitty';
    cat.width = canvasW(); cat.height = canvasH();
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
    drawCat(ctx, state.mode);
    ctx.restore();
    cat.style.left = state.x + 'px';
    cat.style.transform = 'translateY(' + (state.bob || 0) + 'px)';
  }

  function loop() {
    const speed = cfg().walk, dt = 1 / 60;
    const cycle = ['walk1', 'walk2', 'walk3', 'walk4'];

    if (state.moving) {
      const dx = state.targetX - state.x, step = speed * dt;
      if (Math.abs(dx) <= step) state.x = state.targetX;
      else { state.x += Math.sign(dx) * step; state.dir = Math.sign(dx); }
      state.frame += Math.abs(step) / (SCALE * 1.9);
      state.mode = cycle[Math.floor(state.frame) % 4];
      state.bob = -Math.abs(Math.sin(state.frame * 1.6)) * 1.2;
      if (state.x === state.targetX) {
        state.moving = false; state.bob = 0;
        const f = state.onArrive; state.onArrive = null; if (f) f();
      }
    } else if (state.leaving) {
      state.x += state.dir * speed * dt * 1.5;
      state.frame += 0.3;
      state.mode = cycle[Math.floor(state.frame) % 4];
      state.bob = -Math.abs(Math.sin(state.frame * 1.6)) * 1.2;
      if (state.x < -canvasW() - 60 || state.x > window.innerWidth + 60) {
        state.leaving = false; running = false;
        cat.style.display = 'none';
        if (bubble) bubble.style.display = 'none';
        return;
      }
    }

    render();
    if (running) requestAnimationFrame(loop);
  }

  function run() { if (!running) { running = true; requestAnimationFrame(loop); } }

  function walkTo(x, cb) {
    state.targetX = Math.max(16, Math.min(window.innerWidth - canvasW() - 16, x));
    state.dir = state.targetX >= state.x ? 1 : -1;
    state.onArrive = cb;
    state.moving = true;
    cat.style.display = 'block';
    run();
    if (snap) { state.x = state.targetX; state.moving = false; render(); if (cb) cb(); }
  }

  function showBubble(text, wide) {
    bubble.innerHTML = '<span class="kitty-text"></span><button class="kitty-x" aria-label="End the tour">x</button>';
    bubble.querySelector('.kitty-text').textContent = text;
    bubble.querySelector('.kitty-x').addEventListener('click', () => { stopTour(); walkOff(1); });
    bubble.classList.toggle('wide', !!wide);
    bubble.style.display = 'block';
    positionBubble();
  }

  function positionBubble() {
    if (!bubble || bubble.style.display === 'none') return;
    const w = bubble.offsetWidth, h = bubble.offsetHeight;
    let x = state.x + canvasW() / 2 - w / 2;
    x = Math.max(12, Math.min(window.innerWidth - w - 12, x));
    bubble.style.left = x + 'px';
    bubble.style.top = (window.innerHeight - canvasH() - h - 16) + 'px';
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
    if (i >= STEPS.length) { offerSign(); return; }
    const el = document.querySelector(STEPS[i].sel);
    if (!el) { tourStep(i + 1); return; }
    el.scrollIntoView({ behavior: snap ? 'instant' : 'smooth', block: 'start' });
    setTimeout(() => {
      if (aborted) return;
      const r = el.getBoundingClientRect();
      walkTo(r.left - 24, () => {
        highlight(el);
        showBubble(STEPS[i].say);
        const wait = cfg().pause + Math.min(1400, STEPS[i].say.length * 9);
        setTimeout(() => { if (!aborted) tourStep(i + 1); }, wait);
      });
    }, 600);
  }

  function offerSign() {
    highlight(null);
    state.mode = 'sit';
    render();
    bubble.style.display = 'none';   // the sign carries the question, no bubble needed
    sign.innerHTML =
      '<div class="kitty-sign-board">Will you hire me?</div>' +
      '<div class="kitty-sign-btns"><button class="kitty-yes">Yes</button><button class="kitty-no">No</button></div>';
    sign.style.display = 'block';
    positionSign();
    sign.querySelector('.kitty-yes').addEventListener('click', celebrate);
    sign.querySelector('.kitty-no').addEventListener('click', reject);
    if (autoEnd) setTimeout(() => { (autoEnd === 'yes' ? celebrate : reject)(); }, 900);
  }

  function positionSign() {
    if (!sign || sign.style.display === 'none') return;
    const w = sign.offsetWidth, h = sign.offsetHeight;
    let x = state.x + canvasW() / 2 - w / 2;
    x = Math.max(12, Math.min(window.innerWidth - w - 12, x));
    sign.style.left = x + 'px';
    sign.style.top = (window.innerHeight - canvasH() - h - 6) + 'px';
  }

  function celebrate() {
    sign.style.display = 'none';
    bubble.style.display = 'none';
    state.mode = 'happy1'; state.bob = 0; render();
    confetti();
    let n = 0;
    const iv = setInterval(() => {
      state.mode = n % 2 ? 'happy2' : 'happy1'; render(); n++;
      if (n > 9) {
        clearInterval(iv);
        showBubble('Yay! I will go tell Anika. Thanks for looking around!');
        setTimeout(() => { bubble.style.display = 'none'; walkOff(1); }, 2800);
      }
    }, cfg().hop);
  }

  function reject() {
    sign.style.display = 'none';
    state.mode = 'sad'; render();
    showBubble('Oh. Okay... I will show myself out.');
    setTimeout(() => { bubble.style.display = 'none'; walkOff(-1); }, 2600);
  }

  function walkOff(dir) {
    state.dir = dir;
    state.leaving = true;
    state.frame = 0;
    cat.style.display = 'block';
    run();
  }

  function confetti() {
    const colors = ['#4f46e5', '#e8a34a', '#e8798f', '#ffd35c', '#7fc4ff'];
    for (let i = 0; i < 60; i++) {
      const d = document.createElement('i');
      d.className = 'kitty-confetti';
      d.style.background = colors[i % colors.length];
      d.style.left = (state.x + canvasW() / 2 + (Math.random() * 170 - 85)) + 'px';
      d.style.top = (window.innerHeight - canvasH() - 10) + 'px';
      d.style.animationDelay = (Math.random() * 0.5) + 's';
      d.style.animationDuration = (1.1 + Math.random() * 0.9) + 's';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 2600);
    }
  }

  /* ---------------- entry prompt ---------------- */
  function showPrompt() {
    prompt = document.createElement('div');
    prompt.className = 'kitty-prompt';
    prompt.innerHTML =
      '<div class="kitty-prompt-title">A pixel kitty wants to show you around</div>' +
      '<div class="kitty-prompt-body">It walks the page, highlights each part, and asks you one question at the end.</div>' +
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
    state.x = -canvasW() - 20;
    state.dir = 1;
    state.mode = 'walk1';
    state.bob = 0;
    state.moving = false;
    state.leaving = false;
    cat.style.display = 'block';
    run();
    tourStep(fromStep || 0);
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
      sheet.width = poses.length * canvasW(); sheet.height = canvasH();
      sheet.style.cssText = 'position:fixed;left:0;top:0;z-index:99;background:#fff';
      document.body.appendChild(sheet);
      const sc = sheet.getContext('2d');
      poses.forEach((p, i) => {
        const tmp = document.createElement('canvas');
        tmp.width = canvasW(); tmp.height = canvasH();
        drawCat(tmp.getContext('2d'), p);
        sc.drawImage(tmp, i * canvasW(), 0);
      });
      return;
    }
    if (params.get('kitty') === '1') {              // debug: jump straight in
      pace = params.get('pace') || 'normal';
      autoEnd = params.get('end') || null;
      snap = params.get('snap') === '1';
      const pose = params.get('pose');             // debug: freeze one pose on screen
      if (pose) {
        state.x = 120; state.mode = pose; cat.style.display = 'block'; render();
        if (pose.indexOf('happy') === 0) confetti();
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
