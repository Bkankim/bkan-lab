// 한 브리프, 네 엔진 - 네 편을 한 시계로 돌린다.
// 기준 시계는 "소리를 내는 편(active)"의 currentTime이고, 나머지는 어긋나면 그 시각으로 당긴다.
(() => {
  'use strict';

  // 수치 출처: 1라운드 측정(arm별 metrics.json)과 수정 1회 테스트 결과표
  const ENGINES = [
    {
      id: 'seek', name: 'seek', color: '#FFA5B1',
      how: '엔진 없이, 시간 t를 받아 화면을 그리는 HTML을 직접 짜고 브라우저로 한 장씩 찍음',
      first: '15:19', total: '32:36', cost: '$3.95', turns: 64,
      sound: '있음', rev: '7:22 · $2.61', blind: '1위',
    },
    {
      id: 'brag', name: 'brag', color: '#7CD7FF',
      how: '런칭 영상 플러그인 brag. 가벼운 판으로 바뀌어 HTML 장면을 크롬으로 캡처',
      first: '8:49', total: '9:53', cost: '$2.38', turns: 44,
      sound: '있음', rev: '4:45 · $1.92', blind: '상위 묶음',
    },
    {
      id: 'remotion', name: 'Remotion', color: '#FFD272',
      how: 'React 컴포넌트로 영상을 짜는 Remotion과 공식 스킬',
      first: '6:16', total: '14:31', cost: '$2.14', turns: 54,
      sound: '있음 (작게)', rev: '4:57 · $1.95', blind: '상위 묶음',
    },
    {
      id: 'hf', name: 'HyperFrames', short: 'HF', color: '#BC8BE2',
      how: 'HTML을 영상으로 굽는 HyperFrames와 공식 스킬',
      first: '12:38', total: '14:14', cost: '$3.89', turns: 76,
      sound: '없음', rev: '11:10 · $4.34', blind: '하위 묶음, 이름 공개 뒤 상위로',
      silentOrig: true,
    },
  ];

  const $ = (s) => document.querySelector(s);
  const grid = $('#grid');
  const tabs = $('#tabs');
  const playBtn = $('#play');
  const scrub = $('#scrub');
  const timeEl = $('#time');
  const modeBtns = [...document.querySelectorAll('.mode button')];
  const narrowMq = window.matchMedia('(max-width: 720px)');

  let mode = 'rev';
  let active = 0;
  let playing = false;
  let scrubbing = false;

  const src = (e) => `v/${e.id}-${mode}.mp4`;
  const fmt = (t) => {
    const s = Math.max(0, Math.floor(t));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  // 칸과 탭 만들기
  const tiles = ENGINES.map((e, i) => {
    const fig = document.createElement('figure');
    fig.className = 'tile';
    fig.style.setProperty('--c', e.color);
    fig.tabIndex = 0;
    fig.setAttribute('aria-label', `${e.name} 영상, 누르면 이 영상 소리만 켭니다`);
    fig.innerHTML = `
      <video playsinline muted preload="metadata" poster="v/${e.id}.jpg"></video>
      <button class="full" type="button" aria-label="${e.name} 전체 화면">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
      </button>
      <figcaption class="cap">
        <i class="dot" aria-hidden="true"></i>
        <span class="who"><span class="name">${e.name}</span><span class="how">${e.how}</span></span>
        <span class="sound"></span>
      </figcaption>`;
    const v = fig.querySelector('video');
    v.src = src(e);
    fig.addEventListener('click', () => select(i, true));
    fig.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(i, true); }
    });
    fig.querySelector('.full').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });
    v.addEventListener('ended', () => { if (i === active) loopAll(); });
    grid.appendChild(fig);

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.style.setProperty('--c', e.color);
    tab.textContent = e.short || e.name;
    tab.setAttribute('aria-label', e.name);
    tab.addEventListener('click', () => select(i, false));
    tabs.appendChild(tab);

    return { e, fig, v, tab };
  });

  // 표 채우기
  $('#facts').innerHTML = ENGINES.map((e) => `
    <tr>
      <td><i style="background:${e.color}"></i>${e.name}</td>
      <td class="num">${e.first}</td>
      <td class="num">${e.total}<small>${e.turns}턴</small></td>
      <td class="num">${e.cost}</td>
      <td>${e.sound}</td>
      <td class="num">${e.rev}</td>
      <td>${e.blind}</td>
    </tr>`).join('');

  const narrow = () => narrowMq.matches;
  const master = () => tiles[active].v;

  function paint() {
    tiles.forEach((t, i) => {
      const on = i === active;
      const silent = t.e.silentOrig && mode === 'orig';
      t.fig.classList.toggle('active', on);
      t.fig.classList.toggle('mute', silent);
      t.v.muted = !on;
      t.fig.querySelector('.sound').textContent = silent ? '원래 무음' : on ? '소리 켜짐' : '소리 끔';
      t.tab.setAttribute('aria-selected', String(on));
    });
    $('#hint').textContent = narrow()
      ? '엔진을 바꿔도 같은 시각에서 이어집니다.'
      : '영상을 누르면 그 영상 소리만 들립니다.';
    playBtn.classList.toggle('on', playing);
    playBtn.setAttribute('aria-label', playing ? '일시정지' : '재생');
    modeBtns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === mode)));
  }

  const safePlay = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };

  function runAll() {
    const t = master().currentTime;
    tiles.forEach((x, i) => {
      if (narrow() && i !== active) { x.v.pause(); return; }
      if (i !== active && Math.abs(x.v.currentTime - t) > 0.05) x.v.currentTime = t;
      if (playing) safePlay(x.v); else x.v.pause();
    });
  }

  function seekAll(t) {
    tiles.forEach((x) => { x.v.currentTime = t; });
  }

  function loopAll() {
    seekAll(0);
    if (playing) runAll();
  }

  function select(i, fromTile) {
    if (i === active && fromTile && !playing) { playing = true; paint(); runAll(); return; }
    const t = master().currentTime;
    active = i;
    if (Math.abs(master().currentTime - t) > 0.05) master().currentTime = t;
    if (fromTile && !playing) playing = true;
    paint();
    runAll();
  }

  function setMode(m) {
    if (m === mode) return;
    const t = master().currentTime;
    mode = m;
    tiles.forEach((x) => {
      x.v.src = src(x.e);
      x.v.addEventListener('loadedmetadata', () => {
        x.v.currentTime = Math.min(t, (x.v.duration || 30) - 0.05);
        if (playing && (!narrow() || x === tiles[active])) safePlay(x.v);
      }, { once: true });
      x.v.load();
    });
    paint();
  }

  playBtn.addEventListener('click', () => {
    playing = !playing;
    paint();
    runAll();
  });

  scrub.addEventListener('input', () => {
    scrubbing = true;
    seekAll(Number(scrub.value));
    timeEl.textContent = fmt(Number(scrub.value));
  });
  scrub.addEventListener('change', () => { scrubbing = false; runAll(); });

  modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  narrowMq.addEventListener('change', () => { paint(); runAll(); });

  // 시계: 막대 갱신 + 어긋남 보정
  function tick() {
    const m = master();
    if (!scrubbing) {
      scrub.value = String(m.currentTime);
      timeEl.textContent = fmt(m.currentTime);
    }
    if (playing && !narrow() && !scrubbing && !m.seeking) {
      tiles.forEach((x, i) => {
        if (i === active || x.v.seeking) return;
        if (x.v.ended || x.v.readyState < 2) return;
        if (Math.abs(x.v.currentTime - m.currentTime) > 0.15) x.v.currentTime = m.currentTime;
        if (x.v.paused && !m.paused) safePlay(x.v);
      });
    }
    requestAnimationFrame(tick);
  }

  // 다른 탭으로 나갔다 오면 다시 맞춘다
  document.addEventListener('visibilitychange', () => { if (!document.hidden && playing) runAll(); });

  paint();
  requestAnimationFrame(tick);
})();
