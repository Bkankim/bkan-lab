// 우리의 1년: 곡 시각(초)을 정본으로 하는 타임라인 하나를 음원 재생 위치에 맞춰 매 프레임 seek한다.
// 같은 시각이면 같은 화면이 나오므로(시각 -> 화면), 나중에 HyperFrames로 mp4를 구울 때도 그대로 쓸 수 있다.
(() => {
  const D = window.ONE;
  const C = D.cue;
  const TRIM = D.trim;
  const BEAT = D.beat;
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), music = $('music'), video = $('video');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 역할별 이징: 등장 / 이동 / 퇴장
  const IN = 'expo.out', MOVE = 'power2.inOut', OUT = 'power2.in';

  // 결정적인 난수(새로고침해도 같은 기울기)
  let seed = 7;
  const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (b - a) * ((seed - 1) / 2147483646); };

  // ---------- 요소 만들기 ----------
  const cards = {};
  const stackEl = $('stack');
  for (const key of D.all) {
    const p = D.photos[key];
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<img src="${p.src}" alt="" decoding="async"><i class="dim"></i>`;
    el._p = p;
    stackEl.appendChild(el);
    cards[key] = el;
  }
  const stamps = {};
  for (const r of D.recall) {
    if (!r.milestone) continue;
    const s = document.createElement('div');
    s.className = 'stamp' + (r.photo ? ' corner' : '');
    s.innerHTML = `<b>${r.milestone}일</b><small>${r.date}</small>`;
    $('stamps').appendChild(s);
    stamps[r.milestone] = s;
  }
  const wallImgs = D.all.map((key) => {
    const im = document.createElement('img');
    im.src = D.photos[key].src; im.alt = '';
    $('wall').appendChild(im);
    return im;
  });

  // 문구 카드: [[텍스트, 클래스], ...]
  const saysEl = $('says');
  const say = (lines) => {
    const el = document.createElement('div');
    el.className = 'say';
    el.innerHTML = lines.map(([t, c]) => `<span class="${c || ''}">${t}</span>`).join('');
    saysEl.appendChild(el);
    return el;
  };
  const S = {
    o1: say([['우리가 만난 지'], ['벌써 1주년이네?']]),
    o2: say([['그동안 우린'], ['뭘 했을까?']]),
    d1: say([['전화 한 통으로'], ['시작된 우리']]),
    m1: say([['미국 생활 하느라'], ['너무너무 고생이 많지?']]),
    m2: say([['절대로 또'], ['아프지 말고!']]),
    m3: say([['바부리 똥뿌리야.', 'hand']]),
    m4: say([['사랑해.', 'big']]),
    m5: say([['1년.'], ['<b class="n" id="y100">1</b>년', 'rose'], ['<b class="n" id="y10000">100</b>년동안 사랑할게.']]),
    m6: say([['1주년 축하해.', 'big']]),
    m7: say([['우리 평생', 'big'], ['함께하자.', 'big rose']]),
  };

  // ---------- 타임라인 ----------
  let tl = null;
  let W = 0, H = 0;

  function fit(el, maxW, maxH) {
    const p = el._p;
    const k = Math.min(maxW / p.w, maxH / p.h);
    // 폴라로이드 여백(좌우 3.2%, 아래 9%)을 뺀 사진 영역 기준
    el.style.width = Math.round(p.w * k) + 'px';
    el.style.height = Math.round(p.h * k * 1.06) + 'px';
  }

  // 같은 날 사진 여러 장은 부채꼴
  const FAN = {
    1: [[0, 0, 1]],
    2: [[-.17, .01, .78], [.17, -.01, .78]],
    3: [[-.24, .02, .64], [0, -.02, .64], [.24, .02, .64]],
    4: [[-.27, .03, .56], [-.09, -.01, .56], [.09, .01, .56], [.27, -.03, .56]],
  };
  const FANROT = { 1: [0], 2: [-6, 5], 3: [-9, 1, 8], 4: [-11, -4, 3, 10] };

  function sayIn(t, el, tEnd, gap = .55) {
    const spans = el.children;
    tl.set(el, { autoAlpha: 1 }, t);
    tl.fromTo(spans, { autoAlpha: 0, y: 16, filter: 'blur(8px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .5, ease: IN, stagger: gap, immediateRender: false }, t);
    if (tEnd) tl.to(el, { autoAlpha: 0, y: -12, duration: .28, ease: OUT }, tEnd - .3);
  }

  function build() {
    seed = 7;
    if (tl) tl.kill();
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    gsap.set('.card, .stamp, .say, #wall img, #heart, #counter, #phone, #anniv, #dist, #dist *, #ring, #ring *, #gift, #lid, #wall',
      { clearProps: 'all' });
    tl = gsap.timeline({ paused: true });

    const sayTop = H * .40;
    for (const k in S) gsap.set(S[k], { top: sayTop, yPercent: -50 });

    // 하트: 시작 화면부터 가운데에서 뛰다가 1일에 카운터 점으로 간다
    const hs = W * .28 / 100;
    gsap.set('#heart', { x: W / 2 - 50, y: H * .36 - 45, scale: hs, transformOrigin: '50% 50%' });
    // 박자 펄스는 안쪽 path에 걸어 위치·크기 이동(svg 자체)과 겹치지 않게 한다
    gsap.set('#heart path', { transformOrigin: '50% 50%', scale: 1 });
    for (let b = C.open1 - 3 * BEAT; b < C.day1 - .2; b += BEAT) {
      tl.to('#heart path', { scale: 1.12, duration: .09, ease: 'power2.out' }, b)
        .to('#heart path', { scale: 1, duration: .45, ease: MOVE }, b + .09);
    }
    tl.to('#heart', { y: H * .2 - 45, scale: hs * .7, duration: .8, ease: MOVE }, C.open1 - .9);

    gsap.set(S.o1, { top: H * .5 }); gsap.set(S.o2, { top: H * .5 });
    sayIn(C.open1, S.o1, C.open2 - .2, .9);
    sayIn(C.open2, S.o2, C.day1 - .1, .9);

    // 1일: 하트가 카운터 점이 되고, 전화가 울린다
    const dot = $('dot').getBoundingClientRect();
    const dx = dot.left - r.left + dot.width / 2 - 50, dy = dot.top - r.top + dot.height / 2 - 45;
    tl.set('#counter', { autoAlpha: 0 }, 0);
    tl.to('#heart', { x: dx, y: dy, scale: 12 / 100, duration: .7, ease: MOVE }, C.day1);
    tl.fromTo('#counter', { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: .5, ease: IN, immediateRender: false }, C.day1 + .35);
    tl.fromTo('#phone', { autoAlpha: 0, scale: .85, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: .6, ease: IN, immediateRender: false }, C.day1 + .2);
    tl.fromTo('#phone .ring-waves i', { scale: 1, opacity: .9 }, { scale: 2.4, opacity: 0, duration: 1.4, ease: 'power1.out', stagger: { each: .45, repeat: 2 }, immediateRender: false }, C.day1 + .4);
    gsap.set(S.d1, { top: H * .82 });
    sayIn(C.day1 + .9, S.d1, D.recall[0].t, .4);
    tl.to('#phone', { autoAlpha: 0, scale: .8, duration: .4, ease: OUT }, D.recall[0].t - .35);

    // 회상: 슬롯마다 사진이 아래에서 올라와 쌓이고, 앞 슬롯은 뒤로 물러나 어두워진다
    const maxW = W * .74, maxH = H * .5;
    let prev = [], pprev = [], prevStamp = null;
    D.recall.forEach((s, i) => {
      const next = D.recall[i + 1];
      const span = (next ? next.t : C.roll365) - s.t;
      const dur = Math.min(.75, Math.max(.45, span * .4));
      const ks = s.photos || (s.photo ? [s.photo] : []);
      const els = ks.map((k) => cards[k]);
      if (pprev.length) tl.to(pprev, { autoAlpha: 0, duration: .35, ease: OUT }, s.t);
      if (prev.length) {
        tl.to(prev, { scale: (j, el) => el._s * .86, y: (j, el) => el._y - H * .03, duration: .5, ease: MOVE }, s.t);
        tl.to(prev.map((e) => e.lastChild), { opacity: .6, duration: .5 }, s.t);
      }
      if (prevStamp) tl.to(prevStamp, { autoAlpha: 0, scale: .7, duration: .3, ease: OUT }, s.t);
      prevStamp = null;
      const n = els.length;
      els.forEach((el, j) => {
        fit(el, maxW, maxH);
        const [fx, fy, fs] = FAN[n][j];
        el._s = fs; el._y = fy * H;
        const rot = n === 1 ? rnd(-4, 4) : FANROT[n][j];
        gsap.set(el, { xPercent: -50, yPercent: -50 });
        tl.fromTo(el,
          { autoAlpha: 1, x: fx * W + rnd(-30, 30), y: H * .72, rotation: rot + rnd(-14, 14), scale: fs },
          { x: fx * W, y: fy * H, rotation: rot, duration: dur, ease: IN, immediateRender: false }, s.t + j * .1);
      });
      if (s.milestone) {
        const st = stamps[s.milestone];
        tl.fromTo(st, { autoAlpha: 0, scale: 1.8, rotation: -18 },
          { autoAlpha: 1, scale: 1, rotation: -8, duration: .32, ease: 'back.out(2.2)', immediateRender: false }, s.t + (n ? .45 : 0));
        tl.fromTo('#stack', { x: 0 }, { x: 5, duration: .05, repeat: 3, yoyo: true, ease: 'none', immediateRender: false }, s.t + (n ? .77 : .32));
        prevStamp = st;
      }
      // 도장만 있는 슬롯은 쌓인 사진을 그대로 두고 다음 슬롯에서 정리한다
      if (n) { pprev = prev; prev = els; } else { pprev = []; }
    });
    // 마지막 사진·도장 정리
    tl.to(Object.values(cards), { autoAlpha: 0, duration: .4, ease: OUT }, C.anniv - .1);
    if (prevStamp) tl.to(prevStamp, { autoAlpha: 0, duration: .3 }, C.roll365);

    // 1주년: 카운터가 365까지 굴러간 뒤 '1주년'이 되고, 사진 벽이 깔린다
    tl.to('#counter', { autoAlpha: 0, y: -10, duration: .35, ease: OUT }, C.anniv - .05);
    tl.to('#heart', { autoAlpha: 0, duration: .2 }, C.anniv - .05);
    const wall = $('wall');
    // 50장 = 5열 10줄. 화면 높이에 맞춰 칸 크기를 정한다
    const cell = Math.min((W * .94 - 16) / 5, (H * .92 - 36) / 10);
    gsap.set(wall, { width: cell * 5 + 16, xPercent: -50, yPercent: -50 });
    tl.set(wall, { autoAlpha: 1 }, C.anniv);
    tl.fromTo(wallImgs, { autoAlpha: 0, scale: .2, rotation: () => rnd(-40, 40), x: () => rnd(-W * .4, W * .4), y: () => rnd(-H * .4, H * .4) },
      { autoAlpha: 1, scale: 1, rotation: 0, x: 0, y: 0, duration: .7, ease: IN, stagger: { each: .03, from: 'random' }, immediateRender: false }, C.anniv + .15);
    tl.fromTo(wall, { scale: 1.16 }, { scale: 1, duration: C.distance - C.anniv, ease: 'none', immediateRender: false }, C.anniv);
    tl.fromTo('#anniv', { autoAlpha: 0, scale: .6, yPercent: -50 }, { autoAlpha: 1, scale: 1, yPercent: -50, duration: .5, ease: 'back.out(2)', immediateRender: false }, C.anniv);
    tl.to(['#anniv', wall], { autoAlpha: 0, duration: .6, ease: OUT }, C.distance - .9);

    // 거리: 9,617km -> 하지만? -> 두 점이 다가가 영혼의 거리 1nm
    const dv = { v: 0 };
    tl.set('#dist', { autoAlpha: 1 }, C.distance - .2);
    tl.set(['#dBut', '#dSoul'], { autoAlpha: 0 }, C.distance - .2);
    tl.fromTo(['#dTitle', '#dNum'], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .5, ease: IN, stagger: .25, immediateRender: false }, C.distance);
    tl.fromTo('#dLine', { scaleX: 0 }, { scaleX: 1, duration: .9, ease: IN, immediateRender: false }, C.distance + .2);
    tl.fromTo(['#dA', '#dB'], { scale: 0 }, { scale: 1, duration: .4, ease: 'back.out(3)', stagger: .2, immediateRender: false }, C.distance + .3);
    tl.fromTo(dv, { v: 0 }, { v: 9617, duration: 2.2, ease: 'power3.out', immediateRender: false,
      onUpdate: () => { $('dVal').textContent = Math.round(dv.v).toLocaleString('en-US'); } }, C.distance + .4);
    tl.fromTo('#dBut', { autoAlpha: 0, scale: .8 }, { autoAlpha: 1, scale: 1, duration: .35, ease: 'back.out(2.5)', immediateRender: false }, C.but);
    const mapW = W * .76;
    tl.to('#dA', { x: mapW / 2, duration: C.soul - C.approach, ease: 'sine.inOut' }, C.approach);
    tl.to('#dB', { x: -mapW / 2, duration: C.soul - C.approach, ease: 'sine.inOut' }, C.approach);
    tl.to('#dLine', { scaleX: 0, duration: C.soul - C.approach, ease: 'sine.inOut' }, C.approach);
    tl.to('#dist .d-dot span', { autoAlpha: 0, duration: .4 }, C.soul - 1.5);
    tl.to(['#dTitle', '#dNum'], { autoAlpha: .3, duration: .6 }, C.approach);
    tl.to('#dBut', { autoAlpha: 0, y: -10, duration: .3, ease: OUT }, C.soul - .45);
    // 두 점이 만나는 순간 하트로
    const mapY = H * .48;
    tl.set('#heart', { autoAlpha: 1, x: W / 2 - 50, y: mapY - 45, scale: 0 }, C.soul - .05);
    tl.to(['#dA', '#dB'], { autoAlpha: 0, duration: .1 }, C.soul - .05);
    tl.to('#heart', { scale: .7, duration: .45, ease: 'back.out(3)' }, C.soul - .05);
    tl.fromTo('#dSoul', { autoAlpha: 0, scale: 1.4 }, { autoAlpha: 1, scale: 1, duration: .35, ease: IN, immediateRender: false }, C.soul);
    tl.to('#dist', { autoAlpha: 0, duration: .5, ease: OUT }, C.m1 - .6);
    tl.to('#heart', { y: H * .18 - 45, scale: .4, duration: .8, ease: MOVE }, C.m1 - .6);

    // 엔딩 멘트
    sayIn(C.m1, S.m1, C.m2, .7);
    sayIn(C.m2, S.m2, C.m3, .4);
    tl.set(S.m3, { autoAlpha: 1 }, C.m3);
    tl.fromTo(S.m3.children, { autoAlpha: 0, scale: 1.5, rotation: -10 }, { autoAlpha: 1, scale: 1, rotation: -3, duration: .4, ease: 'back.out(2.4)', immediateRender: false }, C.m3);
    tl.to(S.m3, { autoAlpha: 0, duration: .28, ease: OUT }, C.m4 - .3);
    sayIn(C.m4, S.m4, C.m5);
    // 1년. -> 100년 -> 10000년동안 사랑할게.
    const m5 = S.m5.children;
    tl.set(S.m5, { autoAlpha: 1 }, C.m5);
    tl.set(m5, { autoAlpha: 0 }, C.m5);
    tl.fromTo(m5[0], { autoAlpha: 0, y: 16, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .5, ease: IN, immediateRender: false }, C.m5);
    tl.fromTo(m5[1], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .4, ease: IN, immediateRender: false }, C.m5b);
    const y1 = { v: 1 }, y2 = { v: 100 };
    tl.fromTo(y1, { v: 1 }, { v: 100, duration: .7, ease: 'power2.out', immediateRender: false,
      onUpdate: () => { $('y100').textContent = Math.round(y1.v); } }, C.m5b);
    tl.fromTo(m5[2], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .4, ease: IN, immediateRender: false }, C.m5c);
    tl.fromTo(y2, { v: 100 }, { v: 10000, duration: 1, ease: 'power2.out', immediateRender: false,
      onUpdate: () => { $('y10000').textContent = Math.round(y2.v); } }, C.m5c);
    tl.to(S.m5, { autoAlpha: 0, y: -12, duration: .28, ease: OUT }, C.m6 - .3);
    sayIn(C.m6, S.m6, C.m7);
    sayIn(C.m7, S.m7, C.ring - .1, .45);

    // 반지 뽕, 뽕
    tl.to('#heart', { scale: 0, duration: .25, ease: OUT }, C.ring - .3);
    tl.fromTo('#ring', { autoAlpha: 0, scale: 0, rotation: -25 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: .5, ease: 'back.out(3)', immediateRender: false }, C.ring);
    tl.fromTo('#ring .rays', { rotation: 0, opacity: 0 }, { rotation: 40, opacity: 1, duration: 2.7, ease: 'none', immediateRender: false }, C.ring);
    tl.fromTo('#ring .spark', { scale: 0, rotation: 0 }, { scale: 1.3, rotation: 90, duration: .35, ease: 'back.out(3)', stagger: { each: .12, repeat: 1, yoyo: true }, immediateRender: false }, C.ring + .25);
    tl.fromTo('#ring .glint', { x: -40 }, { x: 120, duration: .6, ease: 'power2.inOut', immediateRender: false }, C.ring + .5);
    tl.fromTo('#ring .glint', { x: -40 }, { x: 120, duration: .6, ease: 'power2.inOut', immediateRender: false }, C.ring + 1.6);
    tl.to('#ring', { scale: 1.2, duration: .12, ease: 'power2.out' }, C.ringOut);
    tl.to('#ring', { scale: 0, autoAlpha: 0, duration: .22, ease: 'back.in(2)' }, C.ringOut + .12);

    // 선물상자
    tl.fromTo('#gift', { autoAlpha: 0, scale: 0, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: .55, ease: 'back.out(2.5)', immediateRender: false }, C.gift);
    tl.fromTo('#gift .bubble', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4, ease: IN, immediateRender: false }, C.gift + .9);
    tl.call(giftReady, null, C.gift + .6);
  }

  // ---------- 카운터 (시각 -> 표시, seek 안전) ----------
  const keys = [{ t: C.day1, v: 1, date: '2025.10.31' }];
  for (const s of D.recall) keys.push({ t: s.t, v: s.milestone || s.day, date: s.date });
  keys.push({ t: C.roll365, v: 365, date: '2026.10.30', dur: 1.2 });
  const numEl = $('num'), dateEl = $('date'), counterEl = $('counter');
  let shown = '';
  function renderCounter(t) {
    let i = -1;
    while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
    if (i < 0) return;
    const k = keys[i];
    let v = k.v, date = k.date;
    if (v == null) { v = null; }
    else {
      let pv = 1;
      for (let j = i - 1; j >= 0; j--) if (keys[j].v != null) { pv = keys[j].v; break; }
      const p = Math.min(1, (t - k.t) / (k.dur || .6));
      v = Math.round(pv + (v - pv) * (1 - Math.pow(1 - p, 3)));
    }
    const out = (v == null ? 'x' : v) + '|' + date;
    if (out === shown) return;
    shown = out;
    counterEl.classList.toggle('noday', v == null);
    if (v != null) numEl.textContent = v;
    dateEl.textContent = date;
  }

  // ---------- 효과음 (Web Audio로 합성) ----------
  let ac = null;
  function tone(f0, f1, dur, type, vol, when = 0) {
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur * .8);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + .05);
  }
  const pop = () => { tone(620, 160, .16, 'sine', .5); tone(1400, 0, .05, 'triangle', .12); };
  const chime = () => {
    [1047, 1319, 1568, 2093, 2637, 3136, 4186].forEach((f, i) => tone(f, 0, 1.3, 'triangle', .14, i * .05));
    [2093, 3136].forEach((f, i) => tone(f, 0, 2, 'sine', .06, .3 + i * .1));
  };
  const SFX = [[C.ring, pop], [C.ringOut + .12, pop], [C.gift, pop]];

  // ---------- 시계: 음원 재생 위치가 정본, 프레임 사이는 벽시계로 메운다 ----------
  let running = false, clock0 = 0, lastT = TRIM;
  function songNow() {
    const c = TRIM + (performance.now() - clock0) / 1000;
    if (!music.paused && !music.ended && music.readyState >= 2) {
      const a = TRIM + music.currentTime;
      if (Math.abs(a - c) > .15) { clock0 = performance.now() - music.currentTime * 1000; return a; }
    }
    return c;
  }
  gsap.ticker.add(() => {
    if (!running) return;
    const t = songNow();
    tl.time(Math.min(t, tl.duration()), false);
    renderCounter(t);
    for (const [at, fn] of SFX) if (lastT < at && t >= at) fn();
    lastT = t;
  });

  // ---------- 시작 ----------
  const openBtn = $('open');
  const srcs = D.all.map((k) => D.photos[k].src);
  let loaded = 0;
  const prog = () => { $('prog').textContent = Math.round(100 * loaded / srcs.length); };
  const ready = () => { openBtn.disabled = false; openBtn.textContent = '열어보기'; };
  Promise.all(srcs.map((src) => new Promise((res) => {
    const im = new Image(); im.onload = im.onerror = () => { loaded++; prog(); res(); }; im.src = src;
  }))).then(ready);
  setTimeout(ready, 12000);

  build();
  tl.time(TRIM);

  openBtn.addEventListener('click', () => {
    // 효과음용 오디오 컨텍스트와 영상 재생 권한을 이 탭(사용자 제스처) 안에서 미리 연다
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
      ac = new (window.AudioContext || window.webkitAudioContext)();
      ac.resume();
    } catch (e) { ac = null; }
    video.muted = true;
    const vp = video.play();
    if (vp) vp.then(() => { video.pause(); video.currentTime = 0; video.muted = false; }).catch(() => { video.muted = false; });
    else video.muted = false;

    music.currentTime = 0;
    music.play().catch(() => {});
    clock0 = performance.now();
    lastT = TRIM;
    running = true;
    gsap.to('#start', { autoAlpha: 0, duration: .5, ease: OUT });
    $('mute').hidden = false;
  }, { once: true });

  $('mute').addEventListener('click', () => {
    music.muted = !music.muted;
    $('mute').classList.toggle('off', music.muted);
  });

  let resizeT = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      if (opened) return;
      const t = running ? songNow() : TRIM;
      build();
      tl.time(Math.min(t, tl.duration()), false);
    }, 200);
  });

  // ---------- 선물 ----------
  const gift = $('gift');
  let idle = null, opened = false;
  function giftReady() {
    gift.disabled = false;
    if (idle) idle.kill();
    idle = gsap.timeline({ repeat: -1, repeatDelay: 1.1 })
      .to(gift, { rotation: -6, duration: .12, ease: 'power1.out' })
      .to(gift, { rotation: 5, duration: .12, ease: 'power1.inOut' })
      .to(gift, { rotation: -3, duration: .1, ease: 'power1.inOut' })
      .to(gift, { rotation: 0, duration: .14, ease: 'power1.out' });
    gsap.to('#gift .bubble', { y: -6, duration: .7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  gift.addEventListener('click', () => {
    if (opened || gift.disabled) return;
    opened = true;
    running = false;
    if (idle) idle.kill();
    gsap.killTweensOf('#gift .bubble');
    // 음악은 줄이다가 멈춘다(iOS는 볼륨을 못 바꿔서 멈춤만 된다)
    gsap.to(music, { volume: 0, duration: .8, ease: 'none', onComplete: () => music.pause() });
    if (ac) ac.resume();
    chime();
    confetti();
    const g = gsap.timeline();
    g.to(gift, { scaleY: .88, scaleX: 1.06, rotation: 0, duration: .12, ease: 'power2.out', transformOrigin: '50% 100%' })
      .to(gift, { scaleY: 1, scaleX: 1, duration: .3, ease: 'back.out(3)' })
      .to('#lid', { y: -120, rotation: -28, x: -30, opacity: 0, duration: .6, ease: 'power2.out', transformOrigin: '50% 100%' }, .12)
      .to('#gift .bubble', { opacity: 0, duration: .15 }, 0)
      .fromTo('#gift .burst', { opacity: 0, scale: .3, rotation: 0 }, { opacity: 1, scale: 1.2, rotation: 30, duration: .7, ease: 'power2.out' }, .15)
      .to('#gift .burst', { opacity: 0, duration: .5 }, .85)
      .to(gift, { autoAlpha: 0, scale: .6, y: 40, duration: .45, ease: OUT }, .75)
      .fromTo('#reveal', { autoAlpha: 0, scale: .2, y: H * .2 }, { autoAlpha: 1, scale: 1, y: 0, duration: .7, ease: IN }, .6)
      .call(() => {
        video.currentTime = 0;
        video.controls = true;
        const p = video.play();
        if (p) p.catch(() => { $('tapPlay').hidden = false; });
      }, null, .85);
  });

  $('tapPlay').addEventListener('click', () => { $('tapPlay').hidden = true; video.play(); });
  video.addEventListener('ended', () => {
    const a = $('after');
    a.hidden = false;
    gsap.fromTo(a, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .5, ease: IN });
  });
  $('again').addEventListener('click', () => { video.currentTime = 0; video.play(); });
  $('restart').addEventListener('click', () => location.reload());

  // ---------- 꽃가루 ----------
  function confetti() {
    if (reduce) return;
    const cv = $('fx'), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const x = cv.getContext('2d');
    x.scale(dpr, dpr);
    const cols = ['#ff6b8b', '#f2c45a', '#fbf7f2', '#ffd0dc', '#9fe3c8', '#bfe6ff'];
    const gr = gift.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const ox = gr.left - sr.left + gr.width / 2, oy = gr.top - sr.top + gr.height * .4;
    const ps = Array.from({ length: 150 }, () => {
      const a = rnd(-Math.PI * .95, -Math.PI * .05), sp = rnd(6, 15);
      return { x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: rnd(5, 10), h: rnd(8, 16), r: rnd(0, 6), vr: rnd(-.3, .3), c: cols[(rnd(0, 6) | 0) % 6] };
    });
    const t0 = performance.now();
    (function frame(now) {
      const el = (now - t0) / 1000;
      x.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += .32; p.vx *= .99; p.vy *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, 1 - Math.max(0, el - 2.2) / .8);
        x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.r * 2)), p.w, p.h * Math.abs(Math.cos(p.r * 2)));
        x.restore();
      }
      if (el < 3.1) requestAnimationFrame(frame); else x.clearRect(0, 0, W, H);
    })(t0);
  }

  // 확인용: ?t=초 로 그 곡 시각 화면을 바로 본다(재생 없음)
  const q = new URLSearchParams(location.search).get('t');
  if (q) {
    $('start').style.visibility = 'hidden';
    const t = parseFloat(q);
    tl.time(Math.min(t, tl.duration()), false);
    renderCounter(t);
    window.__seek = (s) => { tl.time(Math.min(s, tl.duration()), false); renderCounter(s); };
  }
})();
