// 우리의 1년 2차: 곡 시각(초)이 정본인 타임라인 하나를 음원 재생 위치에 맞춰 매 프레임 seek한다.
// 쇼릴(prompt-motion improved-showreel-1) 실측 문법을 옮겼다: 박에서 터지고 지수 감속, 띠로 잘린 글자,
// 바탕색 띠 와이프가 곧 장면 전환, 앞 장면의 모양이 다음 장면이 된다(하트 -> 선 -> 줄 -> 화면).
(() => {
  const D = window.ONE;
  const C = D.cue;
  const TRIM = D.trim;
  const B = D.beat;
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), music = $('music'), video = $('video');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 쇼릴의 90도 회전을 프레임마다 잰 누적 비율(15프레임). 2~3프레임 가속 뒤 지수 감속, 튕김 없음
  const REEL = [0, .05, .164, .303, .443, .571, .678, .767, .837, .89, .929, .957, .977, .989, .997, 1];
  gsap.registerEase('reel', (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const x = p * 15, i = Math.floor(x);
    return REEL[i] + (REEL[i + 1] - REEL[i]) * (x - i);
  });
  const SNAP = .35;           // 15프레임@120BPM을 86BPM 박 길이에 맞춘 값
  const EXIT = 'power3.in';   // 나갈 때는 가속
  const DL = [0, .05, .02, .075, .035, .06, .012, .045];
  const lag = (i) => DL[i % DL.length];

  const PAL = {
    blush: { bg: '#FFEFF2', ink: '#2B0F1E', acc: '#FF4D7E' },
    rose: { bg: '#FF4D7E', ink: '#FFF8FA', acc: '#2B0F1E' },
    lav: { bg: '#8F7BFF', ink: '#FFF8FA', acc: '#2B0F1E' },
    plum: { bg: '#2B0F1E', ink: '#FFEFF2', acc: '#FF4D7E' },
  };
  const MONTHC = { 11: 'blush', 12: 'lav', 1: 'rose', 2: 'plum', 3: 'blush', 4: 'lav', 5: 'rose', 6: 'plum', 7: 'blush', 8: 'lav', 9: 'rose', 10: 'plum' };
  const BLK = { blush: '#FF4D7E', rose: '#2B0F1E', lav: '#FF4D7E', plum: '#FF4D7E' };

  // ---------- 바탕색 면: 시각 -> 색, 띠 와이프 ----------
  const STRIPN = 10;
  const stripsEl = $('strips');
  const strips = Array.from({ length: STRIPN }, () => stripsEl.appendChild(document.createElement('i')));
  let FK = [];
  const field = (t, c, mode = 'v') => FK.push({ t, c, mode });
  let fieldShown = '';
  function renderField(t) {
    let i = -1;
    while (i + 1 < FK.length && FK[i + 1].t <= t) i++;
    const k = i >= 0 ? FK[i] : { c: 'blush', mode: 'cut' };
    const prev = i > 0 ? FK[i - 1].c : 'blush';
    const dt = i >= 0 ? t - k.t : 99;
    const dur = .38, gap = .022;
    const active = k.mode !== 'cut' && dt < dur + gap * STRIPN;
    const base = active ? prev : k.c;
    const ink = active && dt < dur * .55 ? prev : k.c;
    const key = base + ink + (active ? Math.round(dt * 240) : '') + k.mode;
    if (key === fieldShown) return;
    fieldShown = key;
    stage.style.setProperty('--bg', PAL[base].bg);
    stage.style.setProperty('--ink', PAL[ink].ink);
    stage.style.setProperty('--acc', PAL[ink].acc);
    stripsEl.className = 'strips' + (k.mode === 'h' ? ' h' : '');
    strips.forEach((s, j) => {
      if (!active) { s.style.transform = k.mode === 'h' ? 'scaleY(0)' : 'scaleX(0)'; return; }
      const p = gsap.parseEase('reel')(Math.max(0, Math.min(1, (dt - j * gap) / dur)));
      s.style.background = PAL[k.c].bg;
      if (k.mode === 'h') { s.style.top = (j * 100 / STRIPN) + '%'; s.style.height = (100 / STRIPN + .3) + '%'; s.style.left = '0'; s.style.width = '100%'; s.style.transform = `scaleY(${p})`; }
      else { s.style.left = (j * 100 / STRIPN) + '%'; s.style.width = (100 / STRIPN + .3) + '%'; s.style.top = '0'; s.style.height = '100%'; s.style.transform = `scaleX(${p})`; }
    });
  }

  // ---------- 카운터: 오도미터(시각 -> 값, seek 안전) ----------
  const odo = $('odo');
  const odoCols = [100, 10, 1].map((unit) => {
    const col = document.createElement('span');
    col.className = 'col';
    col.innerHTML = '<b>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<span>${d}</span>`).join('') + '</b>';
    odo.appendChild(col);
    return { unit, col, reel: col.firstChild };
  });
  function setOdo(v) {
    for (const { unit, col, reel } of odoCols) {
      // 아랫자리가 9 -> 0으로 넘어가는 동안만 윗자리가 따라 구른다
      const pos = Math.floor(v / unit) % 10 + (unit > 1 ? Math.max(0, (v % unit) - (unit - 1)) : (v % 1));
      reel.style.transform = `translateY(${-pos}em)`;
      col.style.display = unit > 1 && v < unit - .5 ? 'none' : '';
    }
  }
  const keys = [{ t: C.day1, v: 1, date: '2025.10.31' }];
  for (const s of D.recall) keys.push({ t: s.t, v: s.milestone || s.day, date: s.date });
  keys.push({ t: C.roll365, v: 365, date: '2026.10.30', dur: 1.2 });
  const dateEl = $('date'), counterEl = $('counter');
  let cShown = '';
  function renderCounter(t) {
    let i = -1;
    while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
    if (i < 0) return;
    const k = keys[i];
    let v = k.v;
    if (v != null) {
      let pv = 1;
      for (let j = i - 1; j >= 0; j--) if (keys[j].v != null) { pv = keys[j].v; break; }
      const p = gsap.parseEase('reel')(Math.min(1, (t - k.t) / (k.dur || .6)));
      v = pv + (v - pv) * p;
    }
    const date = t - k.t > .1 || i === 0 ? k.date : (keys[i - 1] || k).date;
    const out = (v == null ? 'x' : v.toFixed(3)) + date;
    if (out === cShown) return;
    cShown = out;
    counterEl.classList.toggle('noday', v == null);
    if (v != null) setOdo(v);
    dateEl.textContent = date;
  }

  // ---------- 요소 만들기 ----------
  // 사진 스티커: 색 블록 + 6개 띠로 잘린 사진
  const BANDS = 6;
  const cards = {};
  const stackEl = $('stack');
  for (const key of D.all) {
    const p = D.photos[key];
    const el = document.createElement('div');
    el.className = 'ph';
    el.innerHTML = '<i class="blk"></i><div class="win">' + '<div class="bd"></div>'.repeat(BANDS) + '</div>';
    el._p = p;
    el._bands = Array.from(el.querySelectorAll('.bd'));
    el._blk = el.firstChild;
    el._win = el.querySelector('.win');
    stackEl.appendChild(el);
    cards[key] = el;
  }
  // 기념일 도장은 사진 아래 층(사진이 원으로 모여 도장 속으로 들어간다)
  stackEl.parentNode.insertBefore($('stamps'), stackEl);
  const stamps = {};
  for (const r of D.recall) {
    if (!r.milestone) continue;
    const s = document.createElement('div');
    s.className = 'stamp' + (r.photo ? ' photo' : '');
    s.innerHTML = (r.photo ? `<img src="${D.photos[r.photo].src}" alt="">` : '') + `<div class="tx"><b>${r.milestone}일</b><small>${r.date}</small></div>`;
    $('stamps').appendChild(s);
    stamps[r.milestone] = s;
  }
  const wallImgs = D.all.map((key) => {
    const im = document.createElement('img');
    im.src = D.photos[key].src; im.alt = '';
    $('wall').appendChild(im);
    return im;
  });

  // 띠로 잘린 문구: 같은 내용을 띠 수만큼 겹치고 각자 한 띠만 보인다
  const saysEl = $('says');
  function say(html, n = 8) {
    const el = document.createElement('div');
    el.className = 'say';
    let inner = `<div class="sz">${html}</div>`;
    for (let i = 0; i < n; i++) {
      const a = (i * 100 / n).toFixed(2), b = (100 - (i + 1) * 100 / n).toFixed(2);
      inner += `<div class="sl" style="clip-path: inset(${a}% -20% ${b}% -20%)">${html}</div>`;
    }
    el.innerHTML = inner;
    saysEl.appendChild(el);
    el._sl = Array.from(el.querySelectorAll('.sl'));
    return el;
  }
  const S = {
    w1: ['우리가', '만난 지', '벌써', '1주년이네?'].map((w, i) => say(`<p class="xl${i === 3 ? ' acc' : ''}">${w}</p>`)),
    w2: ['그동안', '우린', '뭘', '했을까?'].map((w) => say(`<p class="xl">${w}</p>`)),
    d1: say('<p class="sm">전화 한 통으로<br>시작된 우리</p>', 6),
    year: say('<p class="xxl pill">1주년</p>'),
    dTitle: say('<p class="sm">우리의 물리적 거리</p>', 5),
    dNum: say('<p class="xl"><span class="dv">0</span><span style="font-size:.45em">km</span></p>'),
    dBut: say('<p class="xl">하지만?</p>'),
    soulT: say('<p class="sm">영혼의 거리</p>', 5),
    soulN: say('<p class="xxl acc">1nm</p>'),
    m1a: say('<p>미국 생활 하느라</p>'), m1b: say('<p class="acc">너무너무 고생이 많지?</p>'),
    m2a: say('<p class="xl">절대로 또</p>'), m2b: say('<p class="xl acc">아프지 말고!</p>'),
    m3: say('<p class="hand acc">바부리 똥뿌리야.</p>', 6),
    m4: say('<p class="xxl">사랑해.</p>'),
    m5a: say('<p class="xl">1년.</p>'), m5b: say('<p class="xl acc"><span class="n y100">1</span>년</p>'),
    m5c: say('<p><span class="n y10000">100</span>년동안 사랑할게.</p>'),
    m6: say('<p class="xl">1주년<br>축하해.</p>'),
    m7a: say('<p class="xl">우리 평생</p>'), m7b: say('<p class="xl acc">함께하자.</p>'),
  };
  // 1주년 알약
  S.year.querySelectorAll('p').forEach((p) => Object.assign(p.style, { display: 'inline-block', background: '#2B0F1E', color: '#FFEFF2', padding: '.06em .22em .1em', borderRadius: '.18em' }));

  // 달마다 사진 수(진짜 데이터)
  const months = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const mcount = Object.fromEntries(months.map((m) => [m, 0]));
  for (const r of D.recall) {
    if (!r.date || r.date === '어느 날') continue;
    const m = +r.date.slice(5, 7);
    mcount[m] += r.photos ? r.photos.length : (r.photo ? 1 : 0);
  }

  // 거리 선의 점선
  const dLine = $('dLine');
  for (let i = 0; i < 18; i++) dLine.appendChild(document.createElement('i'));

  // ---------- 타임라인 ----------
  let tl = null;
  let W = 0, H = 0;
  const cy = (f) => H * f;

  // 그 시각의 바탕 팔레트(띠 와이프가 끝난 뒤 기준)
  function palAt(t) {
    let c = 'blush';
    for (const k of FK) if (k.t <= t) c = k.c;
    return PAL[c];
  }
  // 띠 i의 보이는 영역. g(%)만큼 위아래를 비워 띠 사이에 바탕색 이음매를 남긴다(쇼릴 f120~131)
  const band = (i, n, g) => `inset(${(i * 100 / n + g).toFixed(2)}% -20% ${(100 - (i + 1) * 100 / n + g).toFixed(2)}% -20%)`;
  function sliceIn(el, t, dir = 1, dur = SNAP) {
    const n = el._sl.length, P = palAt(t + .45);
    tl.set(el, { autoAlpha: 1 }, t);
    // 출발 상태를 한꺼번에 먼저 둔다. 늦게 출발하는 띠가 도착 자리에 미리 보이면 점멸처럼 보인다
    tl.set(el._sl, { x: (i) => dir * W * (.6 + (i % 4) * .09), color: P.acc, clipPath: (i) => band(i, n, .9) }, t);
    tl.to(el._sl, { x: 0, ease: 'reel', duration: dur, stagger: (i) => lag(i) }, t);
    // 강조색으로 들어와 본래 글자색으로, 이음매는 자리에 맞은 뒤 닫힌다
    tl.to(el._sl, { color: P.ink, clipPath: (i) => band(i, n, 0), ease: 'power2.out', duration: .22 }, t + dur * .7 + .08);
    tl.set(el._sl, { clearProps: 'color' }, t + dur + .3);
  }
  function sliceOut(el, t, dir = 1) {
    const n = el._sl.length;
    tl.to(el._sl, { clipPath: (i) => band(i, n, .9), duration: .06, ease: 'none' }, t);
    tl.to(el._sl, { x: (i) => -dir * W * (.55 + (i % 3) * .1), ease: EXIT, duration: .22, stagger: (i) => lag(i) * .5 }, t);
    tl.set(el, { autoAlpha: 0 }, t + .3);
  }
  const place = (el, y) => gsap.set(el, { top: y, yPercent: -50 });

  function fitCard(el, maxW, maxH) {
    const p = el._p;
    const k = Math.min(maxW / p.w, maxH / p.h);
    const w = Math.round(p.w * k), h = Math.round(p.h * k);
    el.style.width = w + 'px'; el.style.height = h + 'px';
    el._bands.forEach((b, i) => {
      const top = Math.floor(i * h / BANDS);
      Object.assign(b.style, { top: top + 'px', height: (Math.ceil(h / BANDS) + 1) + 'px', backgroundImage: `url(${p.src})`, backgroundSize: `${w}px ${h}px`, backgroundPosition: `0 ${-top}px` });
    });
  }
  function cardIn(el, t, dir) {
    tl.set(el, { autoAlpha: 1 }, t);
    tl.set(el._blk, { scale: 0 }, t);
    // 띠 출발 상태를 먼저 한꺼번에 둔다(점멸 방지). 납작하게 들어와 맞물리며 이음매가 닫힌다
    tl.set(el._bands, { x: (i) => dir * el.offsetWidth * (1.05 + (i % 3) * .12), scaleY: .82 }, t);
    tl.to(el._bands, { x: 0, ease: 'reel', duration: SNAP, stagger: (i) => lag(i) }, t);
    tl.to(el._bands, { scaleY: 1, ease: 'power2.out', duration: .2 }, t + SNAP * .7 + .08);
    tl.fromTo(el._blk, { scale: 0 }, { scale: 1, ease: 'reel', duration: SNAP, immediateRender: false }, t + .14);
  }
  function cardOut(el, t, dir) {
    tl.to(el._bands, { scaleY: .82, duration: .06, ease: 'none' }, t);
    tl.to(el._bands, { x: (i) => -dir * el.offsetWidth * (1.1 + (i % 3) * .1), ease: EXIT, duration: .22, stagger: (i) => lag(i) * .5 }, t);
    tl.to(el._blk, { scale: 0, ease: EXIT, duration: .18 }, t);
    tl.set(el, { autoAlpha: 0 }, t + .3);
  }

  function build() {
    if (tl) tl.kill();
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    gsap.set('.ph, .ph .bd, .ph .blk, .ph .win, .stamp, .stamp *, .say, .say .sl, #wall, #wall img, #heart, #heart path, #counter, #phone, #phone *, #lines i, #dist, #dist *, #chart, #ring, #ring *, #gift, #lid, #reveal', { clearProps: 'all' });
    FK = []; fieldShown = '';
    tl = gsap.timeline({ paused: true });

    // ===== 오프닝: 하트 -> 세로선 -> 90도 -> 세 줄 -> 화면 =====
    const hs = W * .3 / 100;
    gsap.set('#heart', { x: W / 2 - 50, y: cy(.34) - 45, scale: hs });
    gsap.set('#heart path', { transformOrigin: '50% 50%' });
    const b0 = C.open1 - 2 * B;          // 하트가 선이 되는 박
    for (let b = C.open1 - 4 * B; b < b0 - .1; b += B) {
      tl.to('#heart path', { scale: 1.1, duration: .07, ease: 'power2.out' }, b).to('#heart path', { scale: 1, duration: .4, ease: 'power2.out' }, b + .07);
    }
    const L = document.querySelectorAll('#lines i');
    tl.to('#heart', { scaleX: hs * .12, scaleY: hs * 2.2, duration: .12, ease: EXIT }, b0);
    tl.set('#heart', { autoAlpha: 0 }, b0 + .12);
    tl.set(L[0], { autoAlpha: 1, rotation: 90, scaleX: .15, height: 14, marginTop: -7, y: cy(.34) - cy(.5) }, b0 + .1);
    tl.to(L[0], { scaleX: 1, ease: 'reel', duration: SNAP }, b0 + .1);
    tl.to(L[0], { rotation: 0, y: 0, height: 22, marginTop: -11, ease: 'reel', duration: SNAP }, b0 + B);   // 쇼릴 f30~44
    tl.set([L[1], L[2]], { autoAlpha: 1, height: 22, marginTop: -11, rotation: 0 }, C.open1);
    tl.to(L[1], { y: -cy(.28), ease: 'reel', duration: SNAP }, C.open1);
    tl.to(L[2], { y: cy(.28), ease: 'reel', duration: SNAP }, C.open1);
    tl.to(L, { height: H * .36, marginTop: -H * .18, ease: 'reel', duration: SNAP }, C.open1 + B * .5);
    field(C.open1 + B * .5 + SNAP, 'rose', 'cut');
    tl.set(L, { autoAlpha: 0 }, C.open1 + B * .5 + SNAP);

    const w1t = [1, 3, 5, 7].map((k) => C.open1 + k * B);
    const w2t = [0, 2, 4, 6].map((k) => C.open2 + k * B);
    const w2c = ['lav', 'plum', 'rose', 'blush'];
    S.w1.forEach((el, i) => { place(el, cy(.5)); sliceIn(el, w1t[i]); sliceOut(el, i < 3 ? w1t[i + 1] - .06 : C.open2 - .2); });
    S.w2.forEach((el, i) => {
      place(el, cy(.5));
      field(w2t[i] - .08, w2c[i]);
      sliceIn(el, w2t[i] + .1);
      if (i < 3) sliceOut(el, w2t[i + 1] - .14);
    });
    // 마지막 단어가 가로로 눌려 막대가 되고, 막대가 전화기가 된다
    const last = S.w2[3];
    const squash = C.day1 - B;
    tl.to(last, { scaleX: .03, ease: EXIT, duration: .2 }, squash);
    tl.set(last, { autoAlpha: 0 }, squash + .2);
    tl.fromTo('#phone', { autoAlpha: 1, scaleX: .05, scaleY: .3 }, { scaleX: 1, scaleY: 1, ease: 'reel', duration: SNAP + .1, immediateRender: false }, squash + .2);
    tl.fromTo('#phone > *', { opacity: 0, y: 10 }, { opacity: 1, y: 0, ease: 'reel', duration: SNAP, stagger: .06, immediateRender: false }, C.day1);
    tl.fromTo('#phone .ring-waves i', { scale: 1, opacity: .9 }, { scale: 2.3, opacity: 0, duration: B * 2, ease: 'power2.out', stagger: { each: B * .66, repeat: 2 }, immediateRender: false }, C.day1);
    place(S.d1, cy(.82));
    sliceIn(S.d1, C.day1 + B);
    tl.fromTo('#counter', { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, ease: 'reel', duration: SNAP, immediateRender: false }, C.day1);
    tl.set('#counter', { autoAlpha: 0 }, 0);
    const r0 = D.recall[0].t;
    sliceOut(S.d1, r0 - .25);
    tl.to('#phone', { scaleY: .02, ease: EXIT, duration: .2 }, r0 - .25);
    tl.set('#phone', { autoAlpha: 0 }, r0 - .05);

    // ===== 회상: 달이 바뀌면 바탕색이 띠로 바뀌고, 사진은 띠로 잘려 들어온다 =====
    const maxW = W * .76, maxH = H * .48;
    let prev = [], prevStamp = null, prevC = 'blush';
    D.recall.forEach((s, i) => {
      const next = D.recall[i + 1];
      const end = next ? next.t : C.anniv;
      const ks = s.photos || [];
      const els = ks.map((k) => cards[k]);
      const dir = i % 2 ? -1 : 1;
      let fc = s.milestone ? (prevC === 'rose' ? 'lav' : 'rose') : (s.date === '어느 날' ? 'lav' : MONTHC[+s.date.slice(5, 7)]);

      // 앞 슬롯 정리
      if (s.milestone) {
        // 쌓인 사진이 원으로 오려지며 가운데로 모여든다(메타볼처럼 겹침)
        prev.forEach((el) => {
          tl.to(el._win, { borderRadius: '50%', ease: 'reel', duration: SNAP }, s.t - .05);
          tl.to(el._blk, { scale: 0, duration: .15 }, s.t - .05);
          tl.to(el, { x: 0, y: 0, rotation: 0, scale: .34, ease: 'reel', duration: SNAP }, s.t - .05);
          tl.to(el, { scale: 0, ease: EXIT, duration: .16 }, s.t + .22);
          tl.set(el, { autoAlpha: 0 }, s.t + .4);
        });
      } else prev.forEach((el) => cardOut(el, s.t - .05, dir));
      if (prevStamp) { tl.to(prevStamp, { scaleX: .02, ease: EXIT, duration: .2 }, s.t - .05); tl.set(prevStamp, { autoAlpha: 0 }, s.t + .15); }
      prevStamp = null;

      if (fc !== prevC) field(s.t - .06, fc, s.milestone ? 'cut' : (i % 3 === 2 ? 'h' : 'v'));
      if (s.milestone) {
        // 이전 바탕색이 큰 원으로 남았다가 조여서 도장이 된다(아이리스)
        const st = stamps[s.milestone];
        Object.assign(st.style, { background: PAL[prevC].bg, color: PAL[prevC].ink });
        tl.fromTo(st, { autoAlpha: 1, scale: 5.5, scaleX: 5.5 }, { scale: 1, scaleX: 1, ease: 'reel', duration: .45, immediateRender: false }, s.t - .06);
        tl.set(st.querySelectorAll('.tx, img'), { autoAlpha: 0 }, s.t - .06);
        tl.fromTo(st.querySelector('.tx'), { scale: 1.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: 'reel', duration: SNAP, immediateRender: false }, s.t + .4);
        const im = st.querySelector('img');
        if (im) tl.fromTo(im, { autoAlpha: 0 }, { autoAlpha: 1, duration: .3, immediateRender: false }, s.t + .35);
        prevStamp = st;
      }
      prevC = fc;

      const n = els.length;
      const FAN = { 1: [[0, 0, 1, 0]], 2: [[-.18, .01, .74, -5], [.18, -.01, .74, 5]], 3: [[-.25, .02, .6, -7], [0, -.02, .6, 0], [.25, .02, .6, 7]], 4: [[-.28, .03, .52, -8], [-.095, -.01, .52, -3], [.095, .01, .52, 3], [.28, -.03, .52, 8]] };
      els.forEach((el, j) => {
        fitCard(el, maxW, maxH);
        el._blk.style.background = BLK[fc];
        gsap.set(el, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1, rotation: 0 });
        cardIn(el, s.t + .06 + (n > 1 ? 0 : 0), dir);
      });
      // 같은 날 사진: 한 장으로 들어온 뒤 여러 장으로 갈라진다(쇼릴 f60~64 복제 분열)
      if (n > 1) {
        els.forEach((el, j) => {
          const [fx, fy, fs, fr] = FAN[n][j];
          tl.to(el, { x: fx * W, y: fy * H, scale: fs, rotation: fr, ease: 'reel', duration: SNAP }, s.t + .06 + B);
        });
      }
      els.forEach((el, j) => { el._s = n > 1 ? FAN[n][j][2] : 1; });
      // 머무는 동안은 박마다 아주 작게 숨쉰다(박 +4f 정점, 지수 감속)
      for (let b = s.t + .06 + B * (n > 1 ? 2 : 1); n && b < end - B * .6; b += B) {
        tl.to(els, { scale: (j, el) => el._s * 1.025, duration: .08, ease: 'power2.out' }, b)
          .to(els, { scale: (j, el) => el._s, duration: .45, ease: 'power3.out' }, b + .08);
      }
      if (n) prev = els; else prev = [];
    });
    prev.forEach((el) => cardOut(el, C.anniv - .1, 1));
    if (prevStamp) tl.set(prevStamp, { autoAlpha: 0 }, C.anniv);

    // ===== 1주년: 우리 1년 데이터 -> 원이 화면이 되고 사진 벽 =====
    field(C.anniv - .05, 'blush');
    tl.to('#counter', { autoAlpha: 0, y: -16, ease: EXIT, duration: .25 }, C.anniv - .05);
    const chart = $('chart');
    chart.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const ccx = W / 2, ccy = cy(.5), r0c = W * .13, gapR = W * .022, sw = W * .014;
    const maxN = Math.max(...Object.values(mcount));
    let svg = '';
    months.forEach((m, k) => {
      const rr = r0c + W * .06 + k * gapR, circ = 2 * Math.PI * rr, len = circ * (330 / 360) * (mcount[m] / maxN);
      const col = k % 2 ? '#8F7BFF' : '#FF4D7E';
      svg += `<circle cx="${ccx}" cy="${ccy}" r="${rr}" fill="none" stroke="#2B0F1E" stroke-opacity=".08" stroke-width="${sw}"/>`;
      svg += `<circle class="arc" data-len="${len}" data-c="${circ}" cx="${ccx}" cy="${ccy}" r="${rr}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="0 ${circ}" transform="rotate(-90 ${ccx} ${ccy})"/>`;
      svg += `<text class="lbl" x="${ccx - 6}" y="${ccy - rr + sw * .35}" text-anchor="end" font-size="${Math.max(7, W * .019)}" font-weight="800" fill="#2B0F1E">${m}월 ${mcount[m]}</text>`;
    });
    svg += `<circle class="core" cx="${ccx}" cy="${ccy}" r="${r0c}" fill="#FF4D7E"/>`;
    svg += `<text class="coreT" x="${ccx}" y="${ccy + W * .035}" text-anchor="middle" font-size="${W * .1}" font-weight="900" fill="#FFF8FA" letter-spacing="-2">365</text>`;
    svg += `<text class="coreS" x="${ccx}" y="${ccy + W * .075}" text-anchor="middle" font-size="${W * .026}" font-weight="800" fill="#FFF8FA">일 · 사진 ${D.all.length}장</text>`;
    chart.innerHTML = svg;
    const arcs = chart.querySelectorAll('.arc'), lbls = chart.querySelectorAll('.lbl');
    tl.set(chart, { autoAlpha: 1 }, C.anniv);
    tl.fromTo(chart.querySelector('.core'), { attr: { r: 0 } }, { attr: { r: r0c }, ease: 'reel', duration: SNAP, immediateRender: false }, C.anniv);
    tl.fromTo(chart.querySelectorAll('.coreT, .coreS'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, ease: 'reel', duration: SNAP, stagger: .08, immediateRender: false }, C.anniv + .15);
    arcs.forEach((a, k) => {
      const t = C.anniv + B + k * B * .5;
      tl.fromTo(a, { attr: { 'stroke-dasharray': `0 ${a.dataset.c}` } }, { attr: { 'stroke-dasharray': `${a.dataset.len} ${a.dataset.c}` }, ease: 'reel', duration: SNAP + .15, immediateRender: false }, t);
      tl.fromTo(lbls[k], { autoAlpha: 0 }, { autoAlpha: 1, duration: .15, immediateRender: false }, t);
    });
    tl.set(lbls, { autoAlpha: 0 }, 0);
    // 가운데 원이 박마다 뛴다
    for (let b = C.anniv + B; b < C.anniv + 9 * B; b += B) {
      tl.to(chart.querySelector('.core'), { attr: { r: r0c * 1.06 }, duration: .07, ease: 'power2.out' }, b).to(chart.querySelector('.core'), { attr: { r: r0c }, duration: .4, ease: 'power3.out' }, b + .07);
    }
    const collapse = C.anniv + 10 * B;
    arcs.forEach((a, k) => tl.to(a, { attr: { 'stroke-dasharray': `0 ${a.dataset.c}` }, ease: EXIT, duration: .22 }, collapse + (11 - k) * .025));
    tl.to(lbls, { autoAlpha: 0, duration: .1 }, collapse);
    tl.to(chart.querySelectorAll('.coreT, .coreS'), { autoAlpha: 0, duration: .1 }, collapse + .2);
    tl.to(chart.querySelector('.core'), { attr: { r: Math.hypot(W, H) * .6 }, ease: 'reel', duration: .45 }, collapse + .3);
    field(collapse + .75, 'rose', 'cut');
    tl.set(chart, { autoAlpha: 0 }, collapse + .76);
    // 사진 벽: 열마다 반 박씩
    const wall = $('wall');
    const cell = Math.min((W * .9 - 20) / 5, (H * .82 - 45) / 10);
    gsap.set(wall, { width: cell * 5 + 20, xPercent: -50, yPercent: -50 });
    const wt = collapse + .8;
    tl.set(wall, { autoAlpha: 1 }, wt);
    tl.fromTo(wallImgs, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, ease: 'reel', duration: SNAP, stagger: (i) => (i % 5) * B * .5 + Math.floor(i / 5) * .03, immediateRender: false }, wt);
    tl.fromTo(wall, { scale: 1.12 }, { scale: 1, ease: 'none', duration: C.distance - wt, immediateRender: false }, wt);
    place(S.year, cy(.5));
    sliceIn(S.year, wt + 5 * B * .5 + B);
    sliceOut(S.year, C.distance - .3);
    tl.to(wallImgs, { scale: 0, ease: EXIT, duration: .2, stagger: (i) => (4 - i % 5) * .03 }, C.distance - .3);
    tl.set(wall, { autoAlpha: 0 }, C.distance);

    // ===== 거리: 쌓이고 -> 한 점으로 빨려 들고 -> 1박 정적 -> 히트 =====
    field(C.distance - .1, 'lav');
    tl.set('#dist', { autoAlpha: 1 }, C.distance);
    place(S.dTitle, cy(.2)); place(S.dNum, cy(.28)); place(S.dBut, cy(.7));
    sliceIn(S.dTitle, C.distance);
    sliceIn(S.dNum, C.distance + B);
    const dv = { v: 0 };
    const dvs = S.dNum.querySelectorAll('.dv');
    tl.fromTo(dv, { v: 0 }, { v: 9617, duration: 2 * B, ease: 'power3.out', immediateRender: false,
      onUpdate: () => { const s = Math.round(dv.v).toLocaleString('en-US'); dvs.forEach((e) => { e.textContent = s; }); } }, C.distance + B);
    tl.fromTo('#dLine', { scaleX: 0 }, { scaleX: 1, ease: 'reel', duration: SNAP, immediateRender: false }, C.distance + 2 * B);
    tl.fromTo(['#dA', '#dB'], { scale: 0 }, { scale: 1, ease: 'reel', duration: SNAP, stagger: B * .5, immediateRender: false }, C.distance + 2 * B);
    sliceIn(S.dBut, C.but);
    const meet = C.soul - B;
    const mapW = W * .76;
    tl.to('#dA', { x: mapW / 2, ease: 'sine.in', duration: meet - C.approach }, C.approach);
    tl.to('#dB', { x: -mapW / 2, ease: 'sine.in', duration: meet - C.approach }, C.approach);
    tl.to('#dLine', { scaleX: 0, ease: 'sine.in', duration: meet - C.approach }, C.approach);
    tl.to('#dist .d-dot span', { autoAlpha: 0, duration: .3 }, meet - 1.2);
    tl.to([S.dTitle, S.dNum], { autoAlpha: .3, duration: .6 }, C.approach);
    sliceOut(S.dBut, meet - B);
    sliceOut(S.dTitle, meet - .2); sliceOut(S.dNum, meet - .2);
    tl.set('#dB', { autoAlpha: 0 }, meet);
    // 1박 정적: 점 하나만 남는다. 히트에 점이 하트가 되고 화면이 로즈로
    field(C.soul - .02, 'rose');
    tl.set('#heart', { autoAlpha: 1, x: W / 2 - 50, y: cy(.5) - 45, scaleX: 0, scaleY: 0 }, C.soul - .02);
    tl.set('#dA', { autoAlpha: 0 }, C.soul);
    tl.to('#heart', { scaleX: .9, scaleY: .9, ease: 'reel', duration: SNAP }, C.soul - .02);
    place(S.soulT, cy(.66)); place(S.soulN, cy(.77));
    sliceIn(S.soulT, C.soul + .05);
    sliceIn(S.soulN, C.soul + .18);
    tl.set('#dist', { autoAlpha: 0 }, C.soul + .1);
    sliceOut(S.soulT, C.m1 - .3); sliceOut(S.soulN, C.m1 - .3);
    tl.to('#heart', { y: cy(.15) - 45, scaleX: .42, scaleY: .42, ease: 'reel', duration: SNAP }, C.m1 - .3);

    // ===== 엔딩 멘트: 카드마다 바탕색이 띠로 바뀐다 =====
    const M = [
      [C.m1, 'plum', [[S.m1a, .44, 0], [S.m1b, .54, B]]],
      [C.m2, 'lav', [[S.m2a, .42, 0], [S.m2b, .55, B]]],
      [C.m3, 'blush', [[S.m3, .47, 0]]],
      [C.m4, 'rose', [[S.m4, .47, 0]]],
      [C.m5, 'plum', [[S.m5a, .34, 0], [S.m5b, .47, C.m5b - C.m5], [S.m5c, .6, C.m5c - C.m5]]],
      [C.m6, 'lav', [[S.m6, .47, 0]]],
      [C.m7, 'rose', [[S.m7a, .42, 0], [S.m7b, .55, B]]],
    ];
    M.forEach(([t, c, parts], i) => {
      const end = i + 1 < M.length ? M[i + 1][0] : C.ring;
      field(t - .1, c, i % 2 ? 'h' : 'v');
      parts.forEach(([el, y, off], j) => {
        place(el, cy(y));
        sliceIn(el, t + .06 + off, j % 2 ? -1 : 1);
        sliceOut(el, end - .2 - j * .03, j % 2 ? -1 : 1);
      });
    });
    // 1년. 100년 10000년: 숫자가 굴러간다
    const y1 = { v: 1 }, y2 = { v: 100 };
    const y1s = S.m5b.querySelectorAll('.y100'), y2s = S.m5c.querySelectorAll('.y10000');
    tl.fromTo(y1, { v: 1 }, { v: 100, duration: B, ease: 'power3.out', immediateRender: false, onUpdate: () => { y1s.forEach((e) => { e.textContent = Math.round(y1.v); }); } }, C.m5b + .1);
    tl.fromTo(y2, { v: 100 }, { v: 10000, duration: 1.5 * B, ease: 'power3.out', immediateRender: false, onUpdate: () => { y2s.forEach((e) => { e.textContent = Math.round(y2.v); }); } }, C.m5c + .1);

    // ===== 반지: 하트가 보석이 되고, 평면 원이 기울어 입체 반지가 된다 =====
    field(C.ring - .1, 'blush');
    const gemY = cy(.44) - (W * .58 * 220 / 200) / 2 + (W * .58) * (60 / 200);
    tl.to('#heart', { y: gemY - 45, scaleX: .3, scaleY: .3, ease: 'reel', duration: SNAP }, C.ring - .3);
    tl.to('#heart', { scaleX: 0, scaleY: 0, ease: EXIT, duration: .15 }, C.ring + .45);
    tl.set('#ring', { autoAlpha: 1 }, C.ring);
    tl.fromTo('#ring .band', { attr: { 'stroke-dasharray': '0 1000' } }, { attr: { 'stroke-dasharray': '415 1000' }, ease: 'reel', duration: SNAP, immediateRender: false }, C.ring);
    tl.fromTo('#ring .band-back', { autoAlpha: 0 }, { autoAlpha: 1, duration: .05, immediateRender: false }, C.ring + SNAP);
    tl.fromTo('#ring .band', { attr: { ry: 66 } }, { attr: { ry: 22 }, ease: 'reel', duration: SNAP, immediateRender: false }, C.ring + SNAP);
    tl.fromTo('#ring .band-back', { attr: { ry: 66, cy: 150 } }, { attr: { ry: 22, cy: 157 }, ease: 'reel', duration: SNAP, immediateRender: false }, C.ring + SNAP);
    gsap.set('#ring .gem', { transformOrigin: '50% 100%' });
    // 보석은 뽕 하기 전까지 숨긴다. 링이 기울면 윗변이 84 -> 128로 내려가므로 보석도 44만큼 같이 내려와 받침이 링에 붙어 있게 한다
    tl.set('#ring .gem', { scaleX: 0, scaleY: 0, y: 0 }, C.ring);
    tl.to('#ring .gem', { y: 44, ease: 'reel', duration: SNAP }, C.ring + SNAP);
    tl.fromTo('#ring .gem', { scaleX: 0, scaleY: 0 }, { scaleX: 1.03, scaleY: 1.03, ease: 'power2.out', duration: .16, immediateRender: false }, C.ring + .45);
    tl.to('#ring .gem', { scaleX: 1, scaleY: 1, ease: 'power2.out', duration: .14 }, C.ring + .61);
    tl.fromTo('#ring .spark', { scale: 0, rotation: 0 }, { scale: 1, rotation: 90, ease: 'reel', duration: SNAP, stagger: { each: B * .5, repeat: 1, yoyo: true }, immediateRender: false }, C.ring + .6);
    tl.to('#ring', { scaleX: 1.08, scaleY: .88, ease: 'power2.out', duration: .1 }, C.ringOut);
    tl.to('#ring', { scaleX: 0, scaleY: 0, ease: EXIT, duration: .2 }, C.ringOut + .1);
    tl.set('#ring', { autoAlpha: 0 }, C.ringOut + .3);

    // ===== 선물상자 =====
    tl.fromTo('#gift', { autoAlpha: 1, scaleX: 0, scaleY: 0 }, { scaleX: 1.03, scaleY: 1.03, ease: 'power2.out', duration: .18, immediateRender: false }, C.gift);
    tl.to('#gift', { scaleX: 1, scaleY: 1, ease: 'power2.out', duration: .14 }, C.gift + .18);
    tl.fromTo('#gift .bubble', { opacity: 0, y: 8 }, { opacity: 1, y: 0, ease: 'reel', duration: SNAP, immediateRender: false }, C.gift + B);
    tl.call(giftReady, null, C.gift + .5);
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
  const SFX = [[C.ring + .45, pop], [C.ringOut + .1, pop], [C.gift, pop]];

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
  function frame(t) {
    tl.time(Math.min(t, tl.duration()), false);
    renderField(t);
    renderCounter(t);
  }
  gsap.ticker.add(() => {
    if (!running) return;
    const t = songNow();
    frame(t);
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
  frame(TRIM);

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
    gsap.to('#start', { autoAlpha: 0, y: -20, duration: .3, ease: EXIT });
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
      const t = running ? songNow() : (preview ? previewT : TRIM);
      build();
      frame(t);
    }, 200);
  });

  // ---------- 선물 ----------
  const gift = $('gift');
  let idle = null, opened = false;
  function giftReady() {
    gift.disabled = false;
    if (idle) idle.kill();
    idle = gsap.timeline({ repeat: -1, repeatDelay: B * 2 })
      .to(gift, { rotation: -6, duration: .1, ease: 'power2.out' })
      .to(gift, { rotation: 5, duration: .12, ease: 'power2.inOut' })
      .to(gift, { rotation: 0, duration: .3, ease: 'reel' });
    gsap.to('#gift .bubble', { y: -6, duration: B, ease: 'sine.inOut', yoyo: true, repeat: -1 });
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
    ribbons();
    const g = gsap.timeline();
    g.to(gift, { scaleY: .88, scaleX: 1.06, rotation: 0, duration: .1, ease: 'power2.out', transformOrigin: '50% 100%' })
      .to(gift, { scaleY: 1, scaleX: 1, duration: .3, ease: 'reel' })
      .to('#lid', { y: -130, rotation: -24, x: -30, opacity: 0, duration: .5, ease: 'reel', transformOrigin: '50% 100%' }, .1)
      .to('#gift .bubble', { opacity: 0, duration: .12 }, 0)
      .to(gift, { scaleX: .02, ease: EXIT, duration: .2 }, .7)
      .set(gift, { autoAlpha: 0 }, .9)
      .fromTo('#reveal', { autoAlpha: 1, scaleX: .02, scaleY: .4 }, { scaleX: 1, scaleY: 1, duration: .45, ease: 'reel' }, .85)
      .call(() => {
        video.currentTime = 0;
        video.controls = true;
        const p = video.play();
        if (p) p.catch(() => { $('tapPlay').hidden = false; });
      }, null, 1);
  });

  $('tapPlay').addEventListener('click', () => { $('tapPlay').hidden = true; video.play(); });
  video.addEventListener('ended', () => {
    const a = $('after');
    a.hidden = false;
    gsap.fromTo(a, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: SNAP, ease: 'reel' });
  });
  $('again').addEventListener('click', () => { video.currentTime = 0; video.play(); });
  $('restart').addEventListener('click', () => location.reload());

  // ---------- 리본 띠(촤라란) ----------
  function ribbons() {
    if (reduce) return;
    const cv = $('fx'), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const x = cv.getContext('2d');
    x.scale(dpr, dpr);
    const cols = ['#FF4D7E', '#8F7BFF', '#2B0F1E', '#FFF8FA', '#FFB3C7'];
    const gr = gift.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const ox = gr.left - sr.left + gr.width / 2, oy = gr.top - sr.top + gr.height * .4;
    let sd = 11;
    const rn = (a, b) => { sd = (sd * 16807) % 2147483647; return a + (b - a) * ((sd - 1) / 2147483646); };
    const ps = Array.from({ length: 56 }, (_, i) => {
      const a = rn(-Math.PI * .92, -Math.PI * .08), sp = rn(7, 16);
      return { x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: rn(5, 8), h: rn(22, 44), r: rn(0, 6), vr: rn(-.25, .25), c: cols[i % cols.length] };
    });
    const t0 = performance.now();
    (function step(now) {
      const el = (now - t0) / 1000;
      x.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += .34; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, 1 - Math.max(0, el - 2.2) / .8);
        x.fillStyle = p.c;
        const k = Math.abs(Math.cos(p.r * 1.5));
        x.beginPath(); x.roundRect ? x.roundRect(-p.w / 2, -p.h / 2 * k, p.w, p.h * k, 3) : x.rect(-p.w / 2, -p.h / 2 * k, p.w, p.h * k); x.fill();
        x.restore();
      }
      if (el < 3.1) requestAnimationFrame(step); else x.clearRect(0, 0, W, H);
    })(t0);
  }

  // 확인용: ?t=초 로 그 곡 시각 화면을 바로 본다(재생 없음)
  const q = new URLSearchParams(location.search).get('t');
  const preview = !!q;
  let previewT = TRIM;
  if (q) {
    $('start').style.visibility = 'hidden';
    previewT = parseFloat(q);
    frame(previewT);
    window.__seek = (s) => { previewT = s; frame(s); };
  }
})();
