// 모션 엔진 4개 비교 - 네 편을 한 시계로 돌린다.
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
  const MODES = ['orig', 'rev'];

  let mode = 'rev';
  let active = 0;
  let playing = false;
  let scrubbing = false;
  let soundOn = true;
  let warmed = false;

  const fmt = (t) => {
    const s = Math.max(0, Math.floor(t));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const clampT = (v, t) => Math.max(0, Math.min(t, (v.duration || 30) - 0.05));
  const narrow = () => narrowMq.matches;

  // 칸마다 두 판(처음 만든 것·수정 뒤)의 영상을 따로 두고, 보이는 쪽만 바꾼다.
  // src를 갈아 끼우지 않으니 판을 바꿀 때 다시 받지 않고, 안 보이는 판은 확실히 멈춘다.
  const tiles = ENGINES.map((e, i) => {
    const fig = document.createElement('figure');
    fig.className = 'tile';
    fig.style.setProperty('--c', e.color);
    fig.tabIndex = 0;
    fig.setAttribute('aria-label', `${e.name} 영상`);
    fig.innerHTML = `
      <div class="screen">
        ${MODES.map((m) => `<video data-mode="${m}" playsinline muted preload="metadata" poster="v/${e.id}.jpg" src="v/${e.id}-${m}.mp4"></video>`).join('')}
      </div>
      <button class="full" type="button" aria-label="${e.name} 전체 화면">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
      </button>
      <figcaption class="cap">
        <i class="dot" aria-hidden="true"></i>
        <span class="who"><span class="name">${e.name}</span><span class="how">${e.how}</span></span>
        <button class="sound" type="button"></button>
      </figcaption>`;
    const vids = {};
    fig.querySelectorAll('video').forEach((v) => {
      vids[v.dataset.mode] = v;
      v.addEventListener('ended', () => { if (v === master() && !scrubbing) loopAll(); });
    });
    fig.addEventListener('click', () => select(i, true));
    fig.addEventListener('keydown', (ev) => {
      if (ev.target !== fig) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(i, true); }
    });
    fig.querySelector('.full').addEventListener('click', (ev) => {
      ev.stopPropagation();
      // 전체 화면으로 띄우는 편이 소리를 내도록 먼저 고른다
      select(i, false);
      const v = vids[mode];
      if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
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

    return { e, fig, vids, tab, btn: fig.querySelector('.sound') };
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

  const cur = (x) => x.vids[mode];
  const master = () => cur(tiles[active]);
  const allVids = () => tiles.flatMap((x) => MODES.map((m) => x.vids[m]));

  function paint() {
    tiles.forEach((x, i) => {
      const on = i === active;
      const silent = x.e.silentOrig && mode === 'orig';
      const audible = on && soundOn;
      MODES.forEach((m) => {
        const v = x.vids[m];
        v.hidden = m !== mode;
        v.muted = !(audible && m === mode);
      });
      x.fig.classList.toggle('active', on);
      x.btn.classList.toggle('on', audible && !silent);
      x.btn.classList.toggle('mute', silent);
      x.btn.textContent = silent ? '원래 무음' : audible ? '소리 켜짐' : '소리 끔';
      x.btn.setAttribute('aria-pressed', String(audible));
      x.btn.setAttribute('aria-label', `${x.e.name} 소리 ${audible ? '끄기' : '켜기'}`);
      x.tab.setAttribute('aria-selected', String(on));
    });
    $('#hint').textContent = narrow()
      ? '엔진을 바꿔도 같은 시각에서 이어집니다.'
      : '영상을 누르면 재생과 정지, 소리 버튼으로 그 영상 소리를 켜고 끕니다.';
    playBtn.classList.toggle('on', playing);
    playBtn.setAttribute('aria-label', playing ? '일시정지' : '재생');
    modeBtns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === mode)));
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

  // 지금 보이는 판만 돌리고, 안 보이는 판은 항상 멈춘다
  function runAll() {
    const t = master().currentTime;
    tiles.forEach((x, i) => {
      MODES.forEach((m) => { if (m !== mode) x.vids[m].pause(); });
      const v = cur(x);
      if (narrow() && i !== active) { v.pause(); return; }
      if (i !== active && Math.abs(v.currentTime - t) > 0.05) v.currentTime = clampT(v, t);
      if (playing) safePlay(v); else v.pause();
    });
    // 한 번 재생을 시작한 넓은 화면에서는 다른 판도 미리 받아 둬 전환을 매끄럽게
    if (playing && !warmed && !narrow()) {
      warmed = true;
      allVids().forEach((v) => { v.preload = 'auto'; });
    }
  }

  function seekAll(t) {
    tiles.forEach((x) => { const v = cur(x); v.currentTime = clampT(v, t); });
  }

  function loopAll() {
    seekAll(0);
    if (playing) runAll();
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

  function setMode(m) {
    if (m === mode) return;
    const t = master().currentTime;
    tiles.forEach((x) => x.vids[mode].pause());
    mode = m;
    tiles.forEach((x) => {
      const v = cur(x);
      if (v.readyState >= 1) v.currentTime = clampT(v, t);
      else v.addEventListener('loadedmetadata', () => { if (cur(x) === v) v.currentTime = clampT(v, master().currentTime || t); }, { once: true });
    });
    if (master().readyState < 1) master().currentTime = t; // 메타데이터 전이면 시작 위치로 잡힌다
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
  });
  function endScrub() {
    if (!scrubbing) return;
    scrubbing = false;
    seekAll(Number(scrub.value));
    runAll();
  }
  ['change', 'pointerup', 'pointercancel', 'touchend', 'touchcancel', 'blur']
    .forEach((ev) => scrub.addEventListener(ev, endScrub));

  modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  narrowMq.addEventListener('change', () => { paint(); runAll(); });

  // 시계: 막대 갱신 + 어긋남 보정
  function tick() {
    const m = master();
    if (!scrubbing) {
      scrub.value = String(m.currentTime);
      timeEl.textContent = fmt(m.currentTime);
    }
    if (playing && !narrow() && !scrubbing) {
      // 소리 나는 편이 버퍼링 중이면 나머지도 같이 기다린다
      const stalled = m.seeking || m.readyState < 3 || m.paused;
      tiles.forEach((x, i) => {
        const v = cur(x);
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
  requestAnimationFrame(tick);
})();
