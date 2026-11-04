// lab 공통: 수정 전후 비교 끌기 슬라이더.
// <div class="cmp" data-a="경로(확장자 없이)" data-b="..." data-label="..." [data-la data-lb]> 에 .mp4·.jpg 쌍을 겹쳐 놓는다.
(() => {
  'use strict';
  const boxes = Array.from(document.querySelectorAll('.cmp'));
  const items = boxes.map((box, k) => {
    const la = box.dataset.la || '수정 전';
    const lb = box.dataset.lb || '수정 후';
    const lazy = box.hasAttribute('data-lazy');
    const source = (url) => lazy ? `data-src="${url}.mp4"` : `src="${url}.mp4"`;
    box.innerHTML = `
      <video class="a" muted loop playsinline preload="${lazy ? 'none' : 'metadata'}" poster="${box.dataset.a}.jpg" ${source(box.dataset.a)}></video>
      <video class="b" muted loop playsinline preload="${lazy ? 'none' : 'metadata'}" poster="${box.dataset.b}.jpg" ${source(box.dataset.b)}></video>
      <span class="lab la">${la}</span><span class="lab lb">${lb}</span>
      <span class="line" aria-hidden="true"><span class="knob"><svg viewBox="0 0 24 24"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg></span></span>
      <input type="range" min="0" max="100" step="0.5" value="50" aria-label="${box.dataset.label}: ${la} / ${lb} 경계 위치">
      <span class="clab">${box.dataset.label}</span>`;
    const a = box.querySelector('.a');
    const b = box.querySelector('.b');
    const r = box.querySelector('input');
    const set = () => box.style.setProperty('--x', `${r.value}%`);
    r.addEventListener('input', set);
    set();
    return { box, a, b, k, on: false };
  });

  const play = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      const it = items.find((x) => x.box === en.target);
      if (!it) return;
      it.on = en.isIntersecting;
      if (it.on) {
        [it.a, it.b].forEach((v) => { if (v.dataset.src && !v.hasAttribute('src')) v.src = v.dataset.src; v.preload = 'auto'; play(v); });
      }
      else { it.a.pause(); it.b.pause(); }
    });
  }, { threshold: 0.25 });
  items.forEach((it) => io.observe(it.box));

  // 뒤 영상(후)을 앞 영상(전)의 시각에 맞춘다
  function tick() {
    items.forEach((it) => {
      if (!it.on || it.a.readyState < 2 || it.b.readyState < 2) return;
      if (Math.abs(it.b.currentTime - it.a.currentTime) > 0.06) it.b.currentTime = it.a.currentTime;
      if (it.b.paused && !it.a.paused) play(it.b);
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // 움직임 줄이기 설정이면 자동 재생하지 않고 첫 프레임만 둔다
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    io.disconnect();
    items.forEach((it) => { it.a.pause(); it.b.pause(); });
  }
})();
