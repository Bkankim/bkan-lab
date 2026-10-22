/* 테일즈 오브 판타지아 크로스 에디션 놓침 방지 안내
   데이터는 data.json, 진행 상태는 localStorage(이 기기에만 저장). */
(() => {
'use strict';

const STORE_KEY = 'topx:v1';

const KIND = {
  item: '아이템', equip: '장비', ougi: '오의·특기', spell: '술', summon: '소환',
  ninjutsu: '닌자술', mystic: '비오의', recipe: '레시피', collect: '수집품',
  title: '칭호', event: '이벤트', boss: '숨은 보스', tip: '요령'
};
const FLAG = {
  missable: '놓치면 끝', link: '링크 상자', hidden: '숨김', cond: '조건부',
  buy: '구매', best: '최강', warn: '주의'
};
const CHARS = [
  ['크레스', 'クレス'], ['체스터', 'チェスター'], ['민트', 'ミント'], ['클라스', 'クラース'],
  ['아체', 'アーチェ'], ['스즈', 'すず'], ['로디', 'ロンドリーネ']
];
const CHAR_KIND_ORDER = ['mystic', 'ougi', 'spell', 'summon', 'ninjutsu', 'equip', 'title', 'event', 'collect', 'item', 'recipe', 'boss', 'tip'];

const ICON = {
  present: '<circle cx="12" cy="13" r="4"/><path d="M12 3v2.5M4.5 6.5l1.8 1.8M19.5 6.5l-1.8 1.8M2.5 13H5M19 13h2.5M4 20h16"/>',
  past: '<path d="M5 20c0-9 6-15 15-15 0 9-6 15-15 15z"/><path d="M5 20l8-8"/>',
  future: '<path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z"/><path d="M17 3.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>',
  extra: '<path d="M7 4h10l3.5 5.5L12 20 3.5 9.5z"/><path d="M3.5 9.5h17M10 4l2 16 2-16"/>',
  post: '<path d="M4.5 12a7.5 7.5 0 0 1 13.3-4.8L20 9.5"/><path d="M20 4.5v5h-5"/><path d="M19.5 12a7.5 7.5 0 0 1-13.3 4.8L4 14.5"/><path d="M4 19.5v-5h5"/>',
  anytime: '<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M6.3 17.7l2.4-2.4M15.3 8.7l2.4-2.4"/>',
  home: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/>',
  route: '<circle cx="6" cy="5.5" r="2"/><circle cx="18" cy="18.5" r="2"/><path d="M8 5.5h6.5a3.5 3.5 0 0 1 0 7h-5a3.5 3.5 0 0 0 0 7H16"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M15.5 14.4c2.6-.2 4.4 1.4 5 4.4"/>',
  book: '<path d="M4 5.5c2.7-1.2 5.3-1.2 8 0v14c-2.7-1.2-5.3-1.2-8 0z"/><path d="M12 5.5c2.7-1.2 5.3-1.2 8 0v14c-2.7-1.2-5.3-1.2-8 0z"/>',
  check: '<path d="M5.5 12.5l4.2 4.2L18.5 8"/>',
  search: '<circle cx="11" cy="11" r="6.2"/><path d="M15.6 15.6L20 20"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  theme: '<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 1 0 15z" fill="currentColor" stroke="none"/>',
  flag: '<path d="M6 21V4"/><path d="M6 4.5h11l-2.5 4 2.5 4H6"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>'
};
const svg = (name, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ''}</svg>`;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
// 본문의 `이름` 표기는 이름 강조로 바꾼다
const rich = s => esc(s).replace(/`([^`]+)`/g, '<span class="nm">$1</span>');
// 일본어 원어는 한글 이름 뒤 괄호 안에 붙인다: 보아(ボア)
const jpTag = jp => jp ? `<span class="jp" lang="ja">(${esc(jp)})</span>` : '';
// 이름 뒤에 ' (설명)'이 붙어 있으면 원어는 본 이름 바로 뒤에: 애플구미(アップルグミ) (석상 밀기)
const nameJp = (name, jp) => { const m = /^(.+?)( \(.+\))$/.exec(name || ''); return m ? `${esc(m[1])}${jpTag(jp)}${esc(m[2])}` : `${esc(name)}${jpTag(jp)}`; };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- 상태 ---------- */
function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return { checked: raw.checked || {}, pos: raw.pos ?? null, theme: raw.theme || 'auto', view: raw.view || 'home', era: raw.era || null, onlyLeft: !!raw.onlyLeft, onlyMiss: !!raw.onlyMiss, char: raw.char || '크레스' };
  } catch { return { checked: {}, pos: null, theme: 'auto', view: 'home', era: null, onlyLeft: false, onlyMiss: false, char: '크레스' }; }
}
let S = loadState();
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch { toast('이 브라우저에서는 진행 상태를 저장할 수 없습니다. 개인 정보 보호 모드를 꺼 주세요.'); } }

/* ---------- 데이터 ---------- */
let D, gates = [], gateById = {}, areaById = {}, entryById = {}, eraById = {};
async function loadData() {
  const r = await fetch('data.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('data ' + r.status);
  D = await r.json();
  gates = [...D.gates].sort((a, b) => a.order - b.order);
  gates.forEach((g, i) => { g.idx = i; gateById[g.id] = g; });
  D.areas.forEach(a => areaById[a.id] = a);
  D.entries.forEach(e => entryById[e.id] = e);
  D.eras.forEach(e => eraById[e.id] = e);
  if (!S.era) S.era = D.eras[0].id;
}
const isDone = id => !!S.checked[id];
const has = (e, f) => (e.flags || []).includes(f);
const posIdx = () => (S.pos && gateById[S.pos]) ? gateById[S.pos].idx : -1;
const nextGate = () => gates[posIdx() + 1] || null;
const passed = g => g.idx <= posIdx();
function deadlineOf(e) { return e.deadline || areaById[e.area]?.until || null; }
function segmentEntries(g) {
  if (!g) return [];
  return D.entries.filter(e => deadlineOf(e) === g.id);
}
function sortEntries(list) {
  return [...list].sort((a, b) => (isDone(a.id) - isDone(b.id)) || (has(b, 'missable') - has(a, 'missable')) || ((areaById[a.area]?.order ?? 0) - (areaById[b.area]?.order ?? 0)));
}
function overdue() {
  return D.entries.filter(e => { const d = deadlineOf(e); return d && gateById[d] && passed(gateById[d]) && has(e, 'missable') && !isDone(e.id); });
}

/* ---------- 렌더: 공통 조각 ---------- */
function chips(e) {
  const out = [];
  for (const f of e.flags || []) if (FLAG[f]) out.push(`<span class="chip f-${f}">${FLAG[f]}</span>`);
  if (e.conf && e.conf !== '확정') out.push(`<span class="chip conf" title="출처 판정">${esc(e.conf)}</span>`);
  return out.join('');
}
function entryHTML(e, opts = {}) {
  const d = deadlineOf(e);
  const g = d && gateById[d];
  const area = areaById[e.area];
  const done = isDone(e.id);
  return `<article class="entry${done ? ' done' : ''}${has(e, 'missable') ? ' miss' : ''}" id="e-${esc(e.id)}" data-id="${esc(e.id)}">
    <button class="tick" data-act="check" aria-pressed="${done}" aria-label="${esc(e.name)} ${done ? '체크 해제' : '챙김으로 표시'}">${svg('check', 'ic tick-ic')}</button>
    <div class="body">
      <div class="head">
        <h3>${nameJp(e.name, e.jp)}</h3>
      </div>
      <div class="meta"><span class="kind">${KIND[e.kind] || esc(e.kind)}${e.char ? ` · ${esc(e.char)}` : ''}</span>${opts.showArea && area ? `<span class="where">${svg('pin', 'ic mini')}${esc(area.name)}</span>` : ''}${chips(e)}</div>
      <p class="how">${rich(e.how)}</p>
      ${shots(e)}
      ${e.tip ? `<p class="tip">${rich(e.tip)}</p>` : ''}
      ${g ? `<p class="due${passed(g) ? ' past' : ''}">${svg('flag', 'ic mini')}${passed(g) ? '지난 관문' : '기한'}: ${esc(g.title)} 전</p>` : ''}
    </div>
  </article>`;
}
// 위치 사진: data.json의 e.shots = [{f: 'shots/<파일>', cap, src, url}]
function shots(e) {
  if (!e.shots?.length) return '';
  return `<div class="shots${e.shots.length > 1 ? ' multi' : ''}">${e.shots.map((p, i) => `<button class="shot" data-act="shot" data-i="${i}" aria-label="${esc(e.name)} 위치 사진 크게 보기"><img src="${esc(p.f)}" alt="${esc(p.cap || e.name + ' 위치')}" draggable="false" loading="lazy" decoding="async" width="${p.w || 640}" height="${p.h || 480}">${p.cap ? `<span class="shot-cap">${esc(p.cap)}</span>` : ''}</button>`).join('')}</div>`;
}
function shotSheet(e, i) {
  const p = e.shots[i];
  return `<figure class="viewer"><img src="${esc(p.f)}" alt="${esc(p.cap || e.name + ' 위치')}"><figcaption>${esc(e.name)}${p.cap ? ` · ${esc(p.cap)}` : ''}<br><span class="credit">사진 출처: ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.src || p.url)}</a>` : esc(p.src || '')}</span></figcaption></figure>
    <div class="row2"><button class="pill big ghost" data-act="sheet-close" autofocus>닫기</button></div>`;
}
function ring(pct, label) {
  const r = 46, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--ring-a)"/><stop offset="1" stop-color="var(--ring-b)"/></linearGradient></defs>
    <circle class="ring-track" cx="50" cy="50" r="${r}"/>
    <circle class="ring-bar" cx="50" cy="50" r="${r}" stroke="url(#rg)" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-target="${c * (1 - pct)}"/>
  </svg><span class="sr">${esc(label)}</span>`;
}
function drawRings(root = document) {
  root.querySelectorAll('.ring-bar').forEach(el => {
    const t = el.dataset.target;
    if (reduceMotion.matches) { el.style.strokeDashoffset = t; return; }
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.strokeDashoffset = t; }));
  });
}

/* ---------- 뷰: 홈 ---------- */
// 다음 관문 전에 챙길 것을 지역 순서(스토리 순서)로 보여 준다.
// 이번 구간에 지나가는 지역(data.json gates[].areas)은 전부, 앞 구간 지역은 이 관문에서 사라지는 항목만(마지막 기회).
// 다 챙긴 지역은 접고, 남은 지역은 펼쳐 둔다.
function areaDetails(a, list, opts = {}) {
  const dn = list.filter(e => isDone(e.id)).length;
  const missLeft = list.filter(e => has(e, 'missable') && !isDone(e.id)).length;
  const until = a.until && gateById[a.until];
  const open = opts.home ? (dn < list.length || a.id === openArea) : a.id === openArea;
  return `<details class="area${opts.last ? ' last' : ''}"${open ? ' open' : ''} data-area="${esc(a.id)}"${opts.home ? ' data-home="1"' : ''}>
    <summary>
      <span class="a-name">${nameJp(a.name, a.jp)}</span>
      <span class="a-meta">${opts.last ? '<span class="a-due">이 관문 전 마지막 기회</span>' : until ? `<span class="a-due${passed(until) ? ' past' : ''}">${esc(until.title)} 전까지</span>` : ''}${missLeft ? `<span class="a-due">놓치면 끝 ${missLeft}</span>` : ''}<span class="a-count">${dn}/${list.length}</span></span>
      ${svg('chevron', 'ic chev')}
    </summary>
    <div class="a-body">${sortEntries(list).map(e => entryHTML(e, { showArea: !!e.when })).join('')}</div>
  </details>`;
}
// 장소보다 늦게 풀리는 카드(아체 합류 후 등)는 e.when 시점 묶음(data.json areas[].virtual)에 둔다
const placeOf = e => e.when || e.area;
// 스토리 순서 = 관문 순서대로 이어 붙인 gates[].areas 순서(지역 order보다 우선)
let storySeq = null;
const storyIdx = a => { if (!storySeq) { storySeq = {}; gates.forEach(g => (g.areas || []).forEach(id => { if (!(id in storySeq)) storySeq[id] = Object.keys(storySeq).length; })); } return storySeq[a.id] ?? 1e4 + a.order; };
function storyAreas(g, expiring) {
  const segIds = new Set(g.areas || []);
  const ids = new Set([...segIds, ...expiring.map(placeOf)]);
  const areas = [...ids].map(id => areaById[id]).filter(Boolean).sort((a, b) => storyIdx(a) - storyIdx(b));
  return areas.map(a => {
    const inSeg = segIds.has(a.id);
    // 앞 구간 지역은 아직 안 챙긴 것만(다 챙겼으면 지역째 숨김)
    const list = inSeg ? D.entries.filter(e => placeOf(e) === a.id) : expiring.filter(e => placeOf(e) === a.id && !isDone(e.id));
    return list.length ? areaDetails(a, list, { home: true, last: !inSeg }) : '';
  }).join('');
}
const orbLine = (all, left) => !all ? '이 관문에 걸린 영구손실 항목은 없습니다' : left ? `놓치면 끝 ${left}개 남음` : '이 관문 전에 챙길 것은 다 챙겼습니다';
function viewHome() {
  const g = nextGate();
  const seg = segmentEntries(g);
  const miss = seg.filter(e => has(e, 'missable'));
  const left = miss.filter(e => !isDone(e.id));
  const pct = miss.length ? (miss.length - left.length) / miss.length : 1;
  const era = g ? g.era : 'post';
  const late = overdue();
  const total = D.entries.length, done = D.entries.filter(e => isDone(e.id)).length;
  const here = S.pos && gateById[S.pos] ? gateById[S.pos].title : null;
  const list = sortEntries(seg);
  return `<section class="home">
    <div class="orb-well">
      ${ring(pct, g ? `이번 구간 놓침 항목 ${miss.length}개 중 ${miss.length - left.length}개 챙김` : '모든 관문 통과')}
      <div class="orb">
        <div class="sky"></div>
        <div class="orb-ic">${svg(era)}</div>
        <div class="orb-text">
          <span class="orb-k">${g ? '다음 관문' : '모든 관문 통과'}</span>
          <strong class="orb-t">${esc(g ? g.title : '엔딩 후 요소만 남았습니다')}</strong>
          <span class="orb-s">${g ? orbLine(miss.length, left.length) : `전체 ${done}/${total}`}</span>
        </div>
      </div>
    </div>
    <div class="where-bar">
      <div><span class="k">지금 위치</span><span class="v">${here ? `${esc(here)} 지남` : '처음부터'}</span></div>
      <button class="pill" data-act="pick">위치 바꾸기</button>
    </div>
    <nav class="era-tiles" aria-label="시대로 바로 가기">
      ${D.eras.map(x => `<button class="tile${x.id === era ? ' cur' : ''}" data-act="era" data-era="${x.id}">${svg(x.id)}<span>${esc(x.name)}</span></button>`).join('')}
    </nav>
    ${late.length ? `<section class="panel late">
      <header class="panel-h"><h2>지난 관문에서 못 챙긴 것</h2><p>체크하지 않은 영구손실 항목입니다. 이미 챙겼다면 체크해 두세요. 다음 회차에 다시 노릴 수 있습니다.</p></header>
      ${sortEntries(late).map(e => entryHTML(e, { showArea: true })).join('')}
    </section>` : ''}
    ${g ? `<section class="panel">
      <header class="panel-h"><h2>${esc(g.title)} 전에</h2><p>${rich(g.desc || '')}</p><p class="sub-p">지나가는 순서대로 지역을 모았습니다. 「기한: ${esc(g.title)} 전」 표시가 이 관문을 넘으면 사라지는 항목이고, 「마지막 기회」는 앞 지역에서 아직 못 챙긴 것입니다.</p></header>
      ${storyAreas(g, list) || '<p class="empty">이 구간에 챙길 항목이 없습니다. 그대로 진행해도 됩니다.</p>'}
      <button class="wide" data-act="pass">${svg('flag')}이 관문을 지났어요</button>
    </section>` : ''}
    <section class="stat-card">
      <div><span class="k">전체 진행</span><strong>${done}<small>/${total}</small></strong></div>
      <div><span class="k">놓치면 끝</span><strong>${D.entries.filter(e => has(e, 'missable') && isDone(e.id)).length}<small>/${D.entries.filter(e => has(e, 'missable')).length}</small></strong></div>
    </section>
  </section>`;
}

/* ---------- 뷰: 진행표 ---------- */
let query = '';
function matches(e, q) {
  const a = areaById[e.area];
  return [e.name, e.jp, e.how, e.tip, a?.name, a?.jp, e.char, KIND[e.kind]].join(' ').toLowerCase().includes(q);
}
function filterList(list) {
  return list.filter(e => (!S.onlyLeft || !isDone(e.id)) && (!S.onlyMiss || has(e, 'missable')));
}
function viewRoute() {
  const q = query.trim().toLowerCase();
  const filters = `<div class="filters">
      <label class="search">${svg('search')}<input type="search" placeholder="아이템, 기술, 지역 이름으로 찾기" value="${esc(query)}" data-act="q" enterkeyhint="search"></label>
      <div class="toggles">
        <button class="pill${S.onlyMiss ? ' on' : ''}" data-act="t-miss" aria-pressed="${S.onlyMiss}">놓치면 끝만</button>
        <button class="pill${S.onlyLeft ? ' on' : ''}" data-act="t-left" aria-pressed="${S.onlyLeft}">남은 것만</button>
      </div>
    </div>`;
  if (q) {
    const hits = filterList(D.entries.filter(e => matches(e, q)));
    return `<section class="route">${filters}<p class="count">${hits.length}개 찾음</p>${sortEntries(hits).map(e => entryHTML(e, { showArea: true })).join('') || '<p class="empty">찾는 이름이 없습니다. 일본어 이름이나 지역 이름으로도 찾아 보세요.</p>'}</section>`;
  }
  const era = S.era;
  const eraGates = gates.filter(g => g.era === era);
  const areas = D.areas.filter(a => a.era === era).sort((a, b) => a.order - b.order);
  return `<section class="route">
    <div class="seg" role="tablist" aria-label="시대">
      <span class="seg-thumb" aria-hidden="true"></span>
      ${D.eras.map(x => `<button role="tab" class="seg-b${x.id === era ? ' cur' : ''}" aria-selected="${x.id === era}" data-act="era-tab" data-era="${x.id}">${esc(x.name)}</button>`).join('')}
    </div>
    <p class="era-range">${esc(eraById[era]?.range || '')}</p>
    ${eraGates.length ? `<ol class="gate-line">${eraGates.map(g => `<li class="${passed(g) ? 'passed' : ''}${nextGate() === g ? ' next' : ''}"><span class="dot"></span><span>${esc(g.title)}</span></li>`).join('')}</ol>` : ''}
    ${filters}
    ${areas.map(a => {
      const list = filterList(D.entries.filter(e => e.area === a.id));
      const all = D.entries.filter(e => e.area === a.id);
      if (!all.length) return '';
      const dn = all.filter(e => isDone(e.id)).length;
      const until = a.until && gateById[a.until];
      return `<details class="area"${(a.id === openArea) ? ' open' : ''} data-area="${esc(a.id)}">
        <summary>
          <span class="a-name">${nameJp(a.name, a.jp)}</span>
          <span class="a-meta">${until ? `<span class="a-due${passed(until) ? ' past' : ''}">${esc(until.title)} 전까지</span>` : ''}<span class="a-count">${dn}/${all.length}</span></span>
          ${svg('chevron', 'ic chev')}
        </summary>
        <div class="a-body">${list.length ? sortEntries(list).map(e => entryHTML(e)).join('') : '<p class="empty">조건에 맞는 항목이 없습니다.</p>'}</div>
      </details>`;
    }).join('')}
  </section>`;
}
let openArea = null;

/* ---------- 뷰: 캐릭터 ---------- */
function viewChars() {
  const c = S.char;
  const list = D.entries.filter(e => e.char === c);
  const byKind = CHAR_KIND_ORDER.map(k => [k, list.filter(e => e.kind === k)]).filter(([, l]) => l.length);
  const dn = list.filter(e => isDone(e.id)).length;
  return `<section class="chars">
    <nav class="avatars" aria-label="캐릭터">
      ${CHARS.map(([ko, jp]) => {
        const n = D.entries.filter(e => e.char === ko).length;
        return `<button class="ava${ko === c ? ' cur' : ''}" data-act="char" data-char="${ko}" aria-pressed="${ko === c}"><span class="ava-c">${esc(ko[0])}</span><span class="ava-n">${esc(ko)}</span><span class="sr">(${esc(jp)}) 항목 ${n}개</span></button>`;
      }).join('')}
    </nav>
    <header class="char-h"><h2>${esc(c)}</h2><p>${list.length ? `기술과 전용 요소 ${list.length}개 중 ${dn}개 챙김` : '이 캐릭터에 묶인 항목이 없습니다.'}</p></header>
    ${byKind.map(([k, l]) => `<section class="group"><h3 class="group-h">${KIND[k]}<span>${l.filter(e => isDone(e.id)).length}/${l.length}</span></h3>${l.map(e => entryHTML(e, { showArea: true })).join('')}</section>`).join('')}
  </section>`;
}

/* ---------- 뷰: 참고 ---------- */
let pwMode = 'hidden';
function viewRefs() {
  const R = D.refs || {};
  const I = R.intro || {};
  const intro = k => I[k] ? `<p class="ref-intro">${rich(I[k])}</p>` : '';
  const blocks = [];
  if (R.glossary) blocks.push(`<section class="ref"><h2>용어 풀이</h2><dl class="gloss">${R.glossary.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${rich(d)}</dd>`).join('')}</dl></section>`);
  if (R.password) {
    const seq = R.password[pwMode] || [];
    blocks.push(`<section class="ref" id="r-password"><h2>${esc(R.password.title || '정령의 동굴 암호')}</h2>${intro('password')}
      <div class="seg small" role="tablist"><span class="seg-thumb" aria-hidden="true"></span>
        <button role="tab" class="seg-b${pwMode === 'hidden' ? ' cur' : ''}" data-act="pw" data-mode="hidden" aria-selected="${pwMode === 'hidden'}">1. 숨은 정답 먼저</button>
        <button role="tab" class="seg-b${pwMode === 'normal' ? ' cur' : ''}" data-act="pw" data-mode="normal" aria-selected="${pwMode === 'normal'}">2. 정규 정답</button>
      </div>
      <div class="pw-grid">${(R.password.grid || []).map((row, i) => `<div class="pw-row"><span class="pw-k">${i + 1}칸</span>${row.map((ch, j) => `<span class="pw-cell${seq[i] === j + 1 ? ' hit' : ''}" style="--d:${i * 90}ms"><b>${esc(ch).replace(/\(([^)]+)\)$/, '<span class="jp" lang="ja">($1)</span>')}</b><small>${j + 1}번째</small></span>`).join('')}</div>`).join('')}</div>
      <p class="pw-seq">각 칸에서 <strong>${seq.join(' · ')}</strong>번째를 고릅니다.</p>
      ${(R.password.notes || []).map(n => `<p class="ref-p">${rich(n)}</p>`).join('')}
    </section>`);
  }
  if (R.mystic) {
    blocks.push(`<section class="ref"><h2>비오의 5종</h2>${intro('mystic')}
      <h3 class="ref-h3">발동 조건(5종 공통)</h3>
      <ul class="ref-list plain">${(R.mystic.common || []).map(t => `<li>${rich(t)}</li>`).join('')}</ul>
      <h3 class="ref-h3">캐릭터별 얻는 법과 커맨드</h3>
      ${(R.mystic.rows || []).map(m => `<div class="myst"><div class="myst-h"><strong>${esc(m.name)}</strong><span>${esc(m.char)}</span>${m.conf && m.conf !== '확정' ? `<span class="chip conf">${esc(m.conf)}</span>` : ''}</div><p>${rich(m.cond)}</p><p class="cmd"><span class="cmd-k">커맨드</span>${esc(m.cmd)}</p></div>`).join('')}
    </section>`);
  }
  if (R.dragunov) blocks.push(`<section class="ref"><h2>드라구노프 이벤트 순서</h2>${intro('dragunov')}<ol class="steps">${R.dragunov.map(t => `<li>${rich(t)}</li>`).join('')}</ol></section>`);
  const table = (title, rows, a, b, ka = '', kb = '', notes = [], k = '') => rows && rows.length ? `<section class="ref"><h2>${title}</h2>${intro(k)}${(notes || []).map(n => `<p class="ref-p">${rich(n)}</p>`).join('')}<div class="tbl">${rows.map(r => `<div class="tr"><span class="td-a">${rich(r[a])}${ka}</span><span class="td-b">${rich(r[b])}${kb}${jpTag(r.jp)}${r.loc ? `<small class="td-loc">${svg('pin', 'ic mini')}${rich(r.loc)}</small>` : ''}</span></div>`).join('')}</div></section>` : '';
  blocks.push(table('투기장 회차별 보상', R.coliseum, 'n', 'reward', '회', '', R.coliseumNotes, 'coliseum'));
  blocks.push(table('미래 레이스 코스 기록 상품', R.race, 'time', 'reward', '', '', R.raceNotes, 'race'));
  blocks.push(table('아이프리드 보물 지도', R.aifread, 'n', 'reward', '번', '', R.aifreadNotes, 'aifread'));
  if (R.moria) blocks.push(`<section class="ref"><h2>모리아 갱도 하층</h2>${intro('moria')}<ul class="ref-list">${R.moria.map(t => `<li>${rich(t)}</li>`).join('')}</ul></section>`);
  blocks.push(table('그레이드 숍', R.grade, 'cost', 'name', ' 그레이드', '', R.gradeNotes, 'grade'));
  if (R.unresolved) blocks.push(`<section class="ref muted"><h2>끝까지 확정하지 못한 것</h2>${intro('unresolved')}<ul class="ref-list">${R.unresolved.map(t => `<li>${rich(t)}</li>`).join('')}</ul></section>`);
  return `<section class="refs">${blocks.join('')}</section>`;
}

/* ---------- 뷰: 설정 ---------- */
function viewRecords() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `<section class="records">
    <section class="ref"><h2>이 기기에 저장됩니다</h2>
      <p class="ref-p">체크와 위치는 이 브라우저 안에만 남고 어디에도 올라가지 않습니다. 아이폰 Safari는 오래 열지 않은 사이트의 저장 데이터를 지울 수 있으니 ${standalone ? '지금처럼 홈 화면 앱으로 쓰면서' : '공유 버튼의 「홈 화면에 추가」로 앱처럼 쓰고,'} 가끔 백업 파일을 받아 두세요.</p>
      <div class="row2">
        <button class="pill big" data-act="export">백업 파일 받기</button>
        <label class="pill big">백업 불러오기<input type="file" accept="application/json,.json" data-act="import" hidden></label>
      </div>
    </section>
    <section class="ref"><h2>화면</h2>
      <div class="seg small" role="tablist"><span class="seg-thumb" aria-hidden="true"></span>
        ${[['auto', '기기 설정'], ['light', '밝게'], ['dark', '어둡게']].map(([k, v]) => `<button role="tab" class="seg-b${S.theme === k ? ' cur' : ''}" data-act="theme" data-theme="${k}" aria-selected="${S.theme === k}">${v}</button>`).join('')}
      </div>
    </section>
    <section class="ref muted"><h2>처음부터 다시</h2>
      <p class="ref-p">2회차를 시작할 때 체크와 위치를 비웁니다.</p>
      <button class="pill" data-act="reset">체크와 위치 비우기</button>
    </section>
    <p class="colophon">조사 기준: PSP 「나리키리 던전 X(なりきりダンジョンX)」 수록 크로스 에디션(일본판)과 알렉스 팀 한글패치 0.95a. 일본 공략 위키, 실기 공략 영상, 국내외 커뮤니티를 교차 확인했고 확정되지 않은 항목은 판정을 함께 적었습니다. 갱신 ${esc(D.updated)}.</p>
  </section>`;
}

/* ---------- 시트(아래에서 올라오는 창) ---------- */
const sheet = () => $('#sheet');
function openSheet(html, cls = '') {
  const s = sheet();
  s.className = 'sheet ' + cls;
  $('.sheet-in', s).innerHTML = html;
  if (!s.open) s.showModal();
}
function closeSheet() { const s = sheet(); if (s.open) s.close(); }
function pickSheet() {
  const p = posIdx();
  return `<h2 class="sheet-h">어디까지 왔나요</h2><p class="sheet-p">마지막으로 지난 관문을 고르세요. 그 다음 관문 전에 챙길 것을 첫 화면에 모아 드립니다.</p>
    <ol class="pick">
      <li><button class="pick-b${p === -1 ? ' cur' : ''}" data-act="set-pos" data-gate="">처음부터 (아직 아무 관문도 안 지남)</button></li>
      ${gates.map(g => `<li><button class="pick-b${g.idx === p ? ' cur' : ''}" data-act="set-pos" data-gate="${esc(g.id)}"><span class="pe">${esc(eraById[g.era]?.name || '')}</span>${esc(g.title)}</button></li>`).join('')}
    </ol>`;
}
function passSheet(g, left) {
  return `<h2 class="sheet-h">${esc(g.title)}</h2><p class="sheet-p">아직 체크하지 않은 영구손실 항목이 ${left.length}개 있습니다. 이 관문을 넘으면 그 회차에서는 다시 얻을 수 없습니다.</p>
    <ul class="ref-list">${left.slice(0, 8).map(e => `<li>${esc(e.name)}</li>`).join('')}${left.length > 8 ? `<li>그 밖에 ${left.length - 8}개</li>` : ''}</ul>
    <div class="row2"><button class="pill big" data-act="sheet-close">돌아가서 챙기기</button><button class="pill big ghost" data-act="pass-force" data-gate="${esc(g.id)}">그래도 지났어요</button></div>`;
}

/* ---------- 토스트 ---------- */
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- 라우팅·그리기 ---------- */
const VIEWS = { home: viewHome, route: viewRoute, chars: viewChars, refs: viewRefs, records: viewRecords };
function render(opts = {}) {
  const v = VIEWS[S.view] ? S.view : 'home';
  const main = $('#view');
  const y = opts.keepScroll ? scrollY : 0;
  main.innerHTML = VIEWS[v]();
  main.dataset.view = v;
  document.querySelectorAll('.tab').forEach(b => { const on = b.dataset.view === v; b.classList.toggle('cur', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
  if (v === 'home') { const g = nextGate(); document.documentElement.dataset.era = g ? g.era : 'post'; }
  else if (v === 'route') document.documentElement.dataset.era = S.era;
  placeThumbs(main);
  drawRings(main);
  if (opts.keepScroll) scrollTo(0, y); else if (!opts.noScroll) scrollTo(0, 0);
}
function placeThumbs(root) {
  root.querySelectorAll('.seg').forEach(seg => {
    const cur = seg.querySelector('.seg-b.cur'), th = seg.querySelector('.seg-thumb');
    if (!cur || !th) return;
    th.style.width = cur.offsetWidth + 'px';
    th.style.transform = `translateX(${cur.offsetLeft - 4}px)`;
  });
}
function go(view) { S.view = view; save(); render(); }

function softRerender() {
  if (S.view === 'home') {
    // 링과 숫자를 갱신하되 목록은 그대로 둔다
    const g = nextGate();
    const miss = segmentEntries(g).filter(e => has(e, 'missable'));
    const left = miss.filter(e => !isDone(e.id));
    const bar = $('.ring-bar'); if (bar) { const c = 2 * Math.PI * 46; bar.style.strokeDashoffset = c * (1 - (miss.length ? (miss.length - left.length) / miss.length : 1)); }
    const s = $('.orb-s'); if (s && g) s.textContent = orbLine(miss.length, left.length);
    const st = $('.stat-card'); if (st) { const tmp = document.createElement('div'); tmp.innerHTML = viewHome(); st.replaceWith(tmp.querySelector('.stat-card')); }
    document.querySelectorAll('details.area[data-home]').forEach(d => {
      const es = d.querySelectorAll('.entry'), c = d.querySelector('.a-count');
      if (c) c.textContent = `${d.querySelectorAll('.entry.done').length}/${es.length}`;
    });
  } else if (S.view === 'route') {
    document.querySelectorAll('details.area').forEach(d => {
      const all = D.entries.filter(e => e.area === d.dataset.area);
      const c = d.querySelector('.a-count'); if (c) c.textContent = `${all.filter(e => isDone(e.id)).length}/${all.length}`;
    });
  } else if (S.view === 'chars') {
    document.querySelectorAll('.group').forEach(gr => {
      const ids = [...gr.querySelectorAll('.entry')].map(x => x.dataset.id);
      const sp = gr.querySelector('.group-h span'); if (sp) sp.textContent = `${ids.filter(isDone).length}/${ids.length}`;
    });
  }
}

/* ---------- 이벤트 ---------- */
document.addEventListener('click', async ev => {
  const t = ev.target.closest('[data-act]');
  if (!t) return;
  const act = t.dataset.act;
  const entryEl = t.closest('.entry');
  const id = t.dataset.id || entryEl?.dataset.id;
  switch (act) {
    case 'check': {
      if (S.checked[id]) delete S.checked[id]; else S.checked[id] = Date.now();
      save();
      t.setAttribute('aria-pressed', String(!!S.checked[id]));
      entryEl.classList.toggle('done', !!S.checked[id]);
      if (S.checked[id] && !reduceMotion.matches) { entryEl.classList.remove('pop'); void entryEl.offsetWidth; entryEl.classList.add('pop'); }
      softRerender();
      break;
    }
    case 'shot': if (t.closest('.shots[data-dragged]')) break; openSheet(shotSheet(entryById[id], +t.dataset.i), 'photo'); break;
    case 'pick': openSheet(pickSheet(), 'list'); $('.pick-b.cur')?.scrollIntoView({ block: 'center' }); break;
    case 'set-pos': S.pos = t.dataset.gate || null; save(); closeSheet(); render(); toast(S.pos ? `${gateById[S.pos].title}까지 지난 것으로 표시했습니다.` : '처음부터로 돌렸습니다.'); break;
    case 'pass': {
      const g = nextGate(); if (!g) break;
      const left = segmentEntries(g).filter(e => has(e, 'missable') && !isDone(e.id));
      if (left.length) openSheet(passSheet(g, left), 'list');
      else { S.pos = g.id; save(); render(); toast(`${g.title} 통과. 다음 관문을 보여 드립니다.`); }
      break;
    }
    case 'pass-force': S.pos = t.dataset.gate; save(); closeSheet(); render(); break;
    case 'sheet-close': closeSheet(); break;
    case 'era': S.era = t.dataset.era; query = ''; go('route'); break;
    case 'era-tab': {
      S.era = t.dataset.era; save();
      const seg = t.closest('.seg');
      seg.querySelectorAll('.seg-b').forEach(b => { b.classList.toggle('cur', b === t); b.setAttribute('aria-selected', String(b === t)); });
      placeThumbs(seg.parentElement);
      document.documentElement.dataset.era = S.era;
      setTimeout(() => render({ noScroll: true }), reduceMotion.matches ? 0 : 220);
      break;
    }
    case 't-miss': S.onlyMiss = !S.onlyMiss; save(); render({ keepScroll: true }); break;
    case 't-left': S.onlyLeft = !S.onlyLeft; save(); render({ keepScroll: true }); break;
    case 'char': S.char = t.dataset.char; save(); render({ noScroll: true }); break;
    case 'pw': pwMode = t.dataset.mode; render({ keepScroll: true }); break;
    case 'theme': S.theme = t.dataset.theme; save(); applyTheme(); render({ keepScroll: true }); break;
    case 'export': exportBackup(); break;
    case 'reset': openSheet(`<h2 class="sheet-h">체크와 위치를 비울까요</h2><p class="sheet-p">${Object.keys(S.checked).length}개 체크와 지금 위치가 사라집니다.</p><div class="row2"><button class="pill big ghost" data-act="sheet-close">그만두기</button><button class="pill big" data-act="reset-do">비우기</button></div>`, 'list'); break;
    case 'reset-do': S.checked = {}; S.pos = null; save(); closeSheet(); render(); toast('체크와 위치를 비웠습니다.'); break;
  }
});
document.addEventListener('change', async ev => {
  const t = ev.target;
  if (t.dataset.act === 'import') {
    await importBackup(t.files[0]); t.value = '';
  }
});
document.addEventListener('input', ev => {
  if (ev.target.dataset.act === 'q') {
    query = ev.target.value;
    clearTimeout(qT);
    qT = setTimeout(() => {
      const pos = ev.target.selectionStart;
      render({ noScroll: true });
      const inp = $('input[data-act="q"]'); if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); }
    }, 160);
  }
});
let qT;
document.addEventListener('toggle', ev => {
  if (ev.target.matches?.('details.area') && ev.target.open) openArea = ev.target.dataset.area;
}, true);
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { query = ''; go(b.dataset.view); }));
$('#sheet').addEventListener('click', ev => { if (ev.target === ev.currentTarget) closeSheet(); });
addEventListener('resize', () => placeThumbs(document));

/* PC: 사진이 여러 장이면 마우스로 끌어 넘긴다(터치는 기본 스크롤). 놓으면 가까운 사진에 맞춘다 */
let drag = null;
document.addEventListener('pointerdown', ev => {
  if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
  const box = ev.target.closest('.shots.multi'); if (!box) return;
  ev.preventDefault(); // 글자 선택·이미지 끌기 방지(클릭은 그대로)
  drag = { box, x: ev.clientX, left: box.scrollLeft, dx: 0 };
  box.classList.add('dragging');
});
addEventListener('pointermove', ev => {
  if (!drag) return;
  drag.dx = ev.clientX - drag.x;
  drag.box.scrollLeft = drag.left - drag.dx;
});
addEventListener('pointerup', () => {
  if (!drag) return;
  const { box, dx, left } = drag; drag = null;
  const items = [...box.children], pad = items[0].offsetLeft;
  let i = items.reduce((best, el, k) => Math.abs(el.offsetLeft - pad - box.scrollLeft) < Math.abs(items[best].offsetLeft - pad - box.scrollLeft) ? k : best, 0);
  const from = items.findIndex(el => el.offsetLeft - pad >= left - 2);
  if (Math.abs(dx) > 40 && i === from) i = Math.max(0, Math.min(items.length - 1, from + (dx < 0 ? 1 : -1)));
  box.scrollTo({ left: items[i].offsetLeft - pad, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  setTimeout(() => box.classList.remove('dragging'), 350);
  if (Math.abs(dx) > 5) { box.dataset.dragged = '1'; setTimeout(() => delete box.dataset.dragged, 0); }
});

/* ---------- 테마 ---------- */
function applyTheme() {
  const r = document.documentElement;
  if (S.theme === 'auto') delete r.dataset.theme; else r.dataset.theme = S.theme;
}

/* ---------- 백업 ---------- */
async function exportBackup() {
  toast('백업 파일을 만드는 중입니다.');
  const body = JSON.stringify({ app: 'topx', version: 2, at: new Date().toISOString(), state: { checked: S.checked, pos: S.pos } });
  const name = `topx-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([body], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: '테오판 X 진행 백업' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
async function importBackup(file) {
  if (!file) return;
  let j;
  try { j = JSON.parse(await file.text()); } catch { toast('백업 파일을 읽지 못했습니다. 이 페이지에서 받은 .json 파일인지 확인해 주세요.'); return; }
  if (j.app !== 'topx') { toast('이 페이지의 백업 파일이 아닙니다.'); return; }
  S.checked = { ...S.checked, ...(j.state?.checked || {}) };
  if (j.state?.pos !== undefined) S.pos = j.state.pos;
  save();
  render({ keepScroll: true });
  toast('백업을 불러왔습니다.');
}

/* ---------- 시작 ---------- */
applyTheme();
loadData().then(() => {
  document.documentElement.classList.add('ready');
  render({ noScroll: true });
}).catch(() => {
  $('#view').innerHTML = '<p class="empty">공략 데이터를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요. 한 번 연 뒤에는 오프라인에서도 열립니다.</p>';
});
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
})();
