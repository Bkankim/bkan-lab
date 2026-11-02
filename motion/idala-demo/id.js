// idala 해커톤 데모영상 - 파일럿과 v2 세 편을 한 시계로 돌리고, 수정 전후 비교 영상을 붙인다.
// 기준 시계는 "소리를 내는 편(active)"의 currentTime이고, 나머지는 어긋나면 그 시각으로 당긴다.
(() => {
  'use strict';

  // 수치 출처: motion-lab arm 세션 기록(timing.txt·result 줄), 최종 MP4의 ebur128·freezedetect(n=0.003, d=0.6) 측정
  const ENGINES = [
    {
      id: 'pilot', name: '파일럿', color: '#a9a6a0',
      how: 'brag, 첫 시나리오. 움직임은 엔진에 맡김',
      total: '72분', cost: '$12.34', freeze: '20곳', lufs: '-14.3 LUFS',
    },
    {
      id: 'brag', name: 'brag', color: '#5cb8e6',
      how: '런칭 영상 플러그인 brag, 시나리오 v2',
      total: '83분', cost: '$14.82', freeze: '0곳', lufs: '-14.0 LUFS',
    },
    {
      id: 'hf', name: 'HyperFrames', short: 'HF', color: '#a77bd6',
      how: 'HTML을 영상으로 렌더링하는 HyperFrames, 시나리오 v2. 수정 전 원본',
      total: '148분', cost: '$19.09', freeze: '5곳', lufs: '-14.2 LUFS',
    },
    {
      id: 'remotion', name: 'Remotion', color: '#e6b440',
      how: 'React 컴포넌트로 영상을 작성하는 Remotion, 시나리오 v2',
      total: '139분', cost: '$19.14', freeze: '0곳', lufs: '-14.3 LUFS',
    },
  ];
  // 수정 다섯 번(HyperFrames 판을 만든 세션을 이어서). 음량은 회차마다 ebur128로 잰 값(모두 -14.2)
  const REVS = [
    ['1차 수정', '36분', '$14.17', '5곳 → 0곳'], ['2차 수정', '10분', '$2.93', '0곳'], ['3차 수정', '15분', '$2.05', '0곳'],
    ['4차 수정', '8분', '$5.11', '0곳'], ['5차 수정 (제출)', '16분', '$6.28', '0곳'],
  ];

  // 시나리오 v2 장면표 (시작 시각, 이름)
  const SCENES = [
    [0, '훅'], [4, '사진 세 장'], [10, '문제'], [14, '약속'], [18, 'STEP 1'], [26, '생성'], [36, 'STEP 2'],
    [44, '사진이 손톱에'], [52, '품질'], [58, 'STEP 3'], [64, '내 손'], [76, '동작 원리'], [92, '예시 손'],
    [100, '누구에게'], [108, '9월 29일 이후'], [114, '엔드카드'],
  ];

  const $ = (s) => document.querySelector(s);
  const grid = $('#grid');
  const tabs = $('#tabs');
  const scenesEl = $('#scenes');
  const playBtn = $('#play');
  const scrub = $('#scrub');
  const timeEl = $('#time');
  const narrowMq = window.matchMedia('(max-width: 720px)');

  let active = 2; // 제출본으로 이어진 HyperFrames 판이 처음 소리를 낸다
  let playing = false;
  let scrubbing = false;
  let soundOn = true;
  let warmed = false;

  const fmt = (t) => {
    const s = Math.max(0, Math.floor(t));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const clampT = (v, t) => Math.max(0, Math.min(t, (v.duration || 120) - 0.05));
  const narrow = () => narrowMq.matches;

  const tiles = ENGINES.map((e, i) => {
    const fig = document.createElement('figure');
    fig.className = 'tile';
    fig.style.setProperty('--c', e.color);
    fig.tabIndex = 0;
    fig.setAttribute('aria-label', `${e.name} 영상`);
    fig.innerHTML = `
      <div class="screen">
        <video playsinline muted preload="metadata" poster="v/${e.id}.jpg" src="v/${e.id}.mp4"></video>
      </div>
      <button class="full" type="button" aria-label="${e.name} 전체 화면">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
      </button>
      <figcaption class="cap">
        <i class="dot" aria-hidden="true"></i>
        <span class="who"><span class="name">${e.name}</span><span class="how">${e.how}</span></span>
        <button class="sound" type="button"></button>
      </figcaption>`;
    const v = fig.querySelector('video');
    const offControls = () => { if (document.fullscreenElement !== v && !v.webkitDisplayingFullscreen) v.controls = false; };
    document.addEventListener('fullscreenchange', offControls);
    v.addEventListener('webkitendfullscreen', () => { v.controls = false; });
    v.addEventListener('ended', () => { if (v === master() && !scrubbing) loopAll(); });
    // 전체 화면의 네이티브 컨트롤로 재생·정지해도 전역 상태를 따라가게 한다(끝나서 멈춘 것은 loopAll이 처리)
    v.addEventListener('play', () => {
      if (v === master() && !scrubbing && !playing && !v.paused) { playing = true; paint(); runAll(); }
    });
    v.addEventListener('pause', () => {
      if (v === master() && !scrubbing && playing && v.paused && !v.ended && !v.seeking) { playing = false; paint(); runAll(); }
    });
    // 전체 화면에서 켠 네이티브 컨트롤(탐색·음량) 클릭이 칸 재생·정지로 번지지 않게
    fig.addEventListener('click', () => { if (v.controls || document.fullscreenElement) return; select(i, true); });
    fig.addEventListener('keydown', (ev) => {
      if (ev.target !== fig) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(i, true); }
    });
    fig.querySelector('.full').addEventListener('click', (ev) => {
      ev.stopPropagation();
      // 전체 화면으로 띄우는 편이 소리를 내도록 먼저 고른다
      select(i, false);
      // 전체 화면 안에서도 재생·탐색할 수 있게 네이티브 컨트롤을 켜고, 나오면 끈다
      v.controls = true;
      if (v.requestFullscreen) v.requestFullscreen().catch(() => { v.controls = false; });
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });
    // 소리 버튼: 소리 나는 칸이면 켜고 끄고, 다른 칸이면 소리를 그 칸으로 옮긴다
    fig.querySelector('.sound').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (i === active) soundOn = !soundOn;
      else { soundOn = true; select(i, false); }
      paint();
    });
    grid.appendChild(fig);

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.style.setProperty('--c', e.color);
    tab.textContent = e.short || e.name;
    tab.setAttribute('aria-label', e.name);
    tab.addEventListener('click', () => select(i, false));
    tabs.appendChild(tab);

    return { e, fig, v, tab, btn: fig.querySelector('.sound') };
  });

  // 장면 버튼: 누르면 네 편을 그 장면 시작으로 옮긴다
  const sceneBtns = SCENES.map(([t, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="t">${t}초</span>${label}`;
    b.setAttribute('aria-label', `${label} 장면, ${t}초로 이동`);
    b.addEventListener('click', () => jump(t));
    scenesEl.appendChild(b);
    return b;
  });

  // 표 채우기
  $('#facts').innerHTML = ENGINES.map((e) => `
    <tr>
      <td><i style="background:${e.color}"></i>${e.name}</td>
      <td class="num">${e.total}</td>
      <td class="num">${e.cost}</td>
      <td class="num">${e.freeze}</td>
      <td class="num">${e.lufs}</td>
    </tr>`).join('') + REVS.map(([n, t, c, f]) => `
    <tr class="rev">
      <td><i style="background:#a77bd6"></i>${n}</td>
      <td class="num">${t}</td>
      <td class="num">${c}</td>
      <td class="num">${f}</td>
      <td class="num">-14.2 LUFS</td>
    </tr>`).join('');

  const master = () => tiles[active].v;
  const allVids = () => tiles.map((x) => x.v);

  function paint() {
    tiles.forEach((x, i) => {
      const on = i === active;
      const audible = on && soundOn;
      x.v.muted = !audible;
      x.fig.classList.toggle('active', on);
      x.btn.classList.toggle('on', audible);
      x.btn.textContent = audible ? '소리 켜짐' : '소리 끔';
      x.btn.setAttribute('aria-pressed', String(audible));
      x.btn.setAttribute('aria-label', `${x.e.name} 소리 ${audible ? '끄기' : '켜기'}`);
      x.tab.setAttribute('aria-selected', String(on));
    });
    $('#hint').textContent = narrow()
      ? '판을 바꿔도 재생은 같은 시각에서 이어집니다.'
      : '영상을 누르면 재생하거나 정지하고, 소리 버튼으로 그 영상의 소리를 켜고 끕니다.';
    playBtn.classList.toggle('on', playing);
    playBtn.setAttribute('aria-label', playing ? '일시정지' : '재생');
  }

  let sceneNow = -1;
  function paintScene(t) {
    let k = 0;
    SCENES.forEach(([s], i) => { if (t >= s - 0.01) k = i; });
    if (k === sceneNow) return;
    sceneNow = k;
    sceneBtns.forEach((b, i) => b.classList.toggle('now', i === k));
    // 버튼 줄이 옆으로 넘칠 때(좁은 화면) 지금 장면 버튼이 보이게 줄만 옆으로 민다. 페이지는 움직이지 않는다
    if (scenesEl.scrollWidth > scenesEl.clientWidth) {
      const btn = sceneBtns[k];
      const left = btn.offsetLeft - (scenesEl.clientWidth - btn.offsetWidth) / 2;
      scenesEl.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }
  }

  function stopAll() {
    playing = false;
    allVids().forEach((v) => v.pause());
    paint();
  }

  // 브라우저가 소리 있는 재생을 막으면(제스처 밖) 시계가 멈춘 채 도는 상태를 남기지 않는다
  const safePlay = (v) => {
    const p = v.play();
    if (p && p.catch) {
      p.catch((err) => {
        if (err && err.name === 'NotAllowedError' && v === master() && playing) stopAll();
      });
    }
  };

  // 맨 위 제출본 영상과 소리가 겹치지 않게: 동시 재생을 시작하면 제출본을 멈춘다
  const finalV = document.querySelector('.final video');
  if (finalV) finalV.addEventListener('play', () => { if (playing) stopAll(); });

  function runAll() {
    if (playing && finalV && !finalV.paused) finalV.pause();
    const t = master().currentTime;
    tiles.forEach((x, i) => {
      const v = x.v;
      if (narrow() && i !== active) { v.pause(); return; }
      if (i !== active && Math.abs(v.currentTime - t) > 0.05) v.currentTime = clampT(v, t);
      if (playing) safePlay(v); else v.pause();
    });
    // 한 번 재생을 시작한 넓은 화면에서는 네 편을 끝까지 미리 받아 둔다
    if (playing && !warmed && !narrow()) {
      warmed = true;
      allVids().forEach((v) => { v.preload = 'auto'; });
    }
  }

  function seekAll(t) {
    allVids().forEach((v) => { v.currentTime = clampT(v, t); });
  }

  function loopAll() {
    seekAll(0);
    if (playing) runAll();
  }

  function jump(t) {
    seekAll(t);
    scrub.value = String(t);
    timeEl.textContent = fmt(t);
    paintScene(t);
    if (!playing) playing = true;
    paint();
    runAll();
  }

  function select(i, fromTile) {
    if (i === active) {
      // 칸을 다시 누르면 재생·정지를 오간다
      if (fromTile) { playing = !playing; paint(); runAll(); }
      return;
    }
    const t = master().currentTime;
    active = i;
    if (Math.abs(master().currentTime - t) > 0.05) master().currentTime = clampT(master(), t);
    if (fromTile && !playing) playing = true;
    paint();
    runAll();
  }

  playBtn.addEventListener('click', () => {
    playing = !playing;
    paint();
    runAll();
  });

  // 끄는 동안은 네 편을 멈추고 소리 나는 편만 따라가게 하고, 손을 떼면 한 번에 맞춘다
  scrub.addEventListener('input', () => {
    if (!scrubbing) {
      scrubbing = true;
      allVids().forEach((v) => v.pause());
    }
    const t = Number(scrub.value);
    master().currentTime = clampT(master(), t);
    timeEl.textContent = fmt(t);
    paintScene(t);
  });
  function endScrub() {
    if (!scrubbing) return;
    scrubbing = false;
    seekAll(Number(scrub.value));
    runAll();
  }
  ['change', 'pointerup', 'pointercancel', 'touchend', 'touchcancel', 'blur']
    .forEach((ev) => scrub.addEventListener(ev, endScrub));

  narrowMq.addEventListener('change', () => { paint(); runAll(); });

  // 시계: 막대·장면 갱신 + 어긋남 보정
  function tick() {
    const m = master();
    if (!scrubbing) {
      scrub.value = String(m.currentTime);
      timeEl.textContent = fmt(m.currentTime);
      paintScene(m.currentTime);
    }
    if (playing && !narrow() && !scrubbing) {
      // 소리 나는 편이 버퍼링 중이면 나머지도 같이 기다린다
      const stalled = m.seeking || m.readyState < 3 || m.paused;
      tiles.forEach((x, i) => {
        const v = x.v;
        if (i === active || v.seeking || v.ended) return;
        if (stalled) { if (!v.paused) v.pause(); return; }
        if (v.readyState < 2) return;
        if (Math.abs(v.currentTime - m.currentTime) > 0.15) v.currentTime = clampT(v, m.currentTime);
        if (v.paused) safePlay(v);
      });
    }
    requestAnimationFrame(tick);
  }

  // 다른 탭으로 나갔다 오면 다시 맞춘다
  document.addEventListener('visibilitychange', () => { if (!document.hidden && playing) runAll(); });

  paint();
  paintScene(0);
  requestAnimationFrame(tick);
})();
