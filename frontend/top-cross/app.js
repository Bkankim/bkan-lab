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
  buy: '구매', best: '최강', warn: '주의', now: '그 자리 한정', common: '흔한 소모품'
};
const FLAG_TITLE = { now: '그 지역·방을 벗어나면 사라집니다', common: '진행률과 「놓치면 끝」 숫자에 넣지 않습니다' };
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
// 저장값이 없거나(키 없음·사이트 데이터 삭제) 읽지 못하면(파싱 실패·getItem 예외) null. 빈 기록과 구분한다
function readStore() {
  try {
    const t = localStorage.getItem(STORE_KEY);
    if (t == null) return null;
    const raw = JSON.parse(t);
    return { checked: raw.checked || {}, pos: raw.pos ?? null, theme: raw.theme || 'auto', view: raw.view || 'home', era: raw.era || null, onlyLeft: !!raw.onlyLeft, onlyMiss: !!raw.onlyMiss, char: raw.char || '크레스', showCommon: !!raw.showCommon };
  } catch { return null; }
}
const loadState = () => readStore() || { checked: {}, pos: null, theme: 'auto', view: 'home', era: null, onlyLeft: false, onlyMiss: false, char: '크레스', showCommon: false };
let S = loadState();
// 탭(창)이 여럿이면 다른 탭이 그사이 저장한 값을 덮지 않도록, 저장 직전 최신 값에 이 탭에서 바꾼 것만 얹는다.
// base = 이 탭이 마지막으로 읽거나 저장한 값. replace는 백업 복원·초기화처럼 통째로 바꿀 때.
// 저장값이 없거나 읽지 못하면 다른 탭의 저장이 아니므로 이 탭의 S를 통째로 쓴다(비움은 storage 이벤트로 받은 초기화만 인정).
const SHARED = ['pos', 'theme', 'showCommon'];
const snap = s => ({ checked: { ...s.checked }, pos: s.pos, theme: s.theme, showCommon: s.showCommon });
let base = snap(S);
function save(opts = {}) {
  try {
    const L = opts.replace ? null : readStore();
    if (L) {
      const checked = { ...L.checked };
      for (const k of new Set([...Object.keys(base.checked), ...Object.keys(S.checked)])) {
        if (!!S.checked[k] === !!base.checked[k]) continue;
        if (S.checked[k]) checked[k] = S.checked[k]; else delete checked[k];
      }
      S.checked = checked;
      for (const k of SHARED) if (S[k] === base[k]) S[k] = L[k];
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(S));
    base = snap(S);
  } catch { toast('이 브라우저에서는 진행 상태를 저장할 수 없습니다. 개인 정보 보호 모드를 꺼 주세요.'); }
}

/* ---------- 데이터 ---------- */
// id 찾기 표는 프로토타입 없는 객체로(백업·저장값의 'constructor' 같은 이름이 있는 id로 보이지 않게)
let D, gates = [], gateById = Object.create(null), areaById = Object.create(null), entryById = Object.create(null), eraById = Object.create(null);
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
// 흔한 소모품(flags common)은 스위치를 켜야 보이고, 켜도 진행률·놓치면 끝 숫자에는 넣지 않는다
const counted = e => !has(e, 'common');
const shown = e => S.showCommon || counted(e);
// 진행률(전체 진행·지역·캐릭터 x/y)은 챙길 대상만: 놓치면 끝이 아닌 요령(tip) 카드는 분자·분모에서 뺀다(카드는 그대로 보이고 체크도 된다)
const progress = e => counted(e) && (e.kind !== 'tip' || has(e, 'missable'));
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
  return D.entries.filter(e => { const d = deadlineOf(e); return d && gateById[d] && passed(gateById[d]) && has(e, 'missable') && !isDone(e.id) && shown(e); });
}

/* ---------- 렌더: 공통 조각 ---------- */
function chips(e) {
  const out = [];
  for (const f of e.flags || []) if (FLAG[f]) out.push(`<span class="chip f-${f}"${FLAG_TITLE[f] ? ` title="${FLAG_TITLE[f]}"` : ''}>${FLAG[f]}</span>`);
  if (e.conf && e.conf !== '확정') out.push(`<span class="chip conf" title="출처 판정">${esc(e.conf)}</span>`);
  return out.join('');
}
function entryHTML(e, opts = {}) {
  const d = deadlineOf(e);
  const g = d && gateById[d];
  const area = areaById[e.area];
  const done = isDone(e.id);
  return `<article class="entry${done ? ' done' : ''}${has(e, 'missable') ? ' miss' : ''}${counted(e) ? '' : ' common'}${progress(e) ? '' : ' noprog'}" id="e-${esc(e.id)}" data-id="${esc(e.id)}">
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
// 지역 머리 숫자. 마지막 기회 지역은 목록이 아직 안 챙긴 것뿐이라 x/y의 x가 늘 0이 되므로 「남은 N」(진행률 집계 대상 중 미체크)으로 쓴다.
// 첫 렌더(areaDetails)와 체크 뒤 갱신(softRerender)이 이 함수 하나를 쓴다
const areaCount = (last, done, total) => last ? `남은 ${total - done}` : `${done}/${total}`;
// 다음 관문 전에 챙길 것을 지역 순서(스토리 순서)로 보여 준다.
// 이번 구간에 지나가는 지역(data.json gates[].areas)은 전부, 앞 구간 지역은 이 관문에서 사라지는 항목만(마지막 기회).
// 다 챙긴 지역은 접고, 남은 지역은 펼쳐 둔다.
function areaDetails(a, list, opts = {}) {
  const cnt = list.filter(counted), pr = list.filter(progress);
  const dn = pr.filter(e => isDone(e.id)).length;
  const missLeft = cnt.filter(e => has(e, 'missable') && !isDone(e.id)).length;
  const until = a.until && gateById[a.until];
  const open = opts.home ? (list.some(e => !isDone(e.id)) || a.id === openArea) : a.id === openArea;
  return `<details class="area${opts.last ? ' last' : ''}"${open ? ' open' : ''} data-area="${esc(a.id)}"${opts.home ? ' data-home="1"' : ''}>
    <summary>
      <span class="a-name">${nameJp(a.name, a.jp)}</span>
      <span class="a-meta">${opts.last ? '<span class="a-due">이 관문 전 마지막 기회</span>' : until ? `<span class="a-due${passed(until) ? ' past' : ''}">${esc(until.title)} 전까지</span>` : ''}<span class="a-due a-miss"${missLeft ? '' : ' hidden'}>놓치면 끝 ${missLeft}</span><span class="a-count"${pr.length ? '' : ' hidden'}>${areaCount(opts.last, dn, pr.length)}</span></span>
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
// skip = 위 「지난 관문에서 못 챙긴 것」에 이미 나온 카드(같은 카드를 한 화면에 두 번 그리지 않는다)
function storyAreas(g, expiring, skip) {
  const segIds = new Set(g.areas || []);
  const ids = new Set([...segIds, ...expiring.map(placeOf)]);
  const areas = [...ids].map(id => areaById[id]).filter(Boolean).sort((a, b) => storyIdx(a) - storyIdx(b));
  return areas.map(a => {
    const inSeg = segIds.has(a.id);
    // 앞 구간 지역은 아직 안 챙긴 것만(다 챙겼으면 지역째 숨김)
    const list = (inSeg ? D.entries.filter(e => placeOf(e) === a.id && shown(e)) : expiring.filter(e => placeOf(e) === a.id && !isDone(e.id))).filter(e => !skip.has(e.id));
    return list.length ? areaDetails(a, list, { home: true, last: !inSeg }) : '';
  }).join('');
}
let lateOpen = false;
// 0개면 숫자와 「개」를 뺀다(첫 렌더·체크 뒤 갱신 같은 규칙)
const lateTitle = n => `지난 관문에서 못 챙긴 것${n ? ` <span class="late-n">${n}</span>개` : ''}`;
const orbLine = (all, left) => !all ? '이 관문에 걸린 영구손실 항목은 없습니다' : left ? `놓치면 끝 ${left}개 남음` : '이 관문 전에 챙길 것은 다 챙겼습니다';
function viewHome() {
  const g = nextGate();
  const seg = segmentEntries(g);
  const miss = seg.filter(e => has(e, 'missable') && counted(e));
  const left = miss.filter(e => !isDone(e.id));
  const pct = miss.length ? (miss.length - left.length) / miss.length : 1;
  const era = g ? g.era : 'post';
  const late = overdue();
  const lateN = late.filter(counted).length;
  const all = D.entries.filter(counted), prog = D.entries.filter(progress);
  const total = prog.length, done = prog.filter(e => isDone(e.id)).length;
  const here = S.pos && gateById[S.pos] ? gateById[S.pos].title : null;
  const list = sortEntries(seg.filter(shown));
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
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
    ${standalone && !S.pos && !Object.keys(S.checked).length ? '<p class="hint">Safari에서 하던 체크는 홈 화면 앱으로 따라오지 않습니다. Safari로 연 이 페이지의 설정 탭에서 백업 파일을 받아, 이 앱의 설정 탭 「백업 불러오기」로 옮겨 오세요.</p>' : ''}
    <nav class="era-tiles" aria-label="시대로 바로 가기">
      ${D.eras.map(x => `<button class="tile${x.id === era ? ' cur' : ''}" data-act="era" data-era="${x.id}">${svg(x.id)}<span>${esc(x.name)}</span></button>`).join('')}
    </nav>
    ${late.length ? `<section class="panel late">
      <details class="late-box"${lateOpen ? ' open' : ''}>
        <summary class="panel-h"><h2>${lateTitle(lateN)}</h2><p>체크하지 않은 영구손실 항목입니다. 이미 챙겼다면 체크해 두세요. 다음 회차에 다시 노릴 수 있습니다.</p><span class="late-more">${svg('chevron', 'ic chev')}<span>목록 펼치기</span></span></summary>
        ${sortEntries(late).map(e => entryHTML(e, { showArea: true })).join('')}
      </details>
    </section>` : ''}
    ${g ? `<section class="panel">
      <header class="panel-h"><h2>${esc(g.title)} 전에</h2><p>${rich(g.desc || '')}</p><p class="sub-p">지나가는 순서대로 지역을 모았습니다. 「기한: ${esc(g.title)} 전」 표시가 이 관문을 넘으면 사라지는 항목이고, 「마지막 기회」는 앞 지역에서 아직 못 챙긴 것입니다.</p></header>
      ${storyAreas(g, list, new Set(late.map(e => e.id))) || '<p class="empty">이 구간에 챙길 항목이 없습니다. 그대로 진행해도 됩니다.</p>'}
      <button class="wide" data-act="pass">${svg('flag')}이 관문을 지났어요</button>
    </section>` : ''}
    <section class="stat-card">
      <div><span class="k">전체 진행</span><strong>${done}<small>/${total}</small></strong></div>
      <div><span class="k">놓치면 끝</span><strong>${all.filter(e => has(e, 'missable') && isDone(e.id)).length}<small>/${all.filter(e => has(e, 'missable')).length}</small></strong></div>
    </section>
  </section>`;
}

/* ---------- 뷰: 공략 ---------- */
// data.json guide: 장(chapters) 순서로 단계 한 줄씩. 단계의 cards가 true면 그 지역(area) 카드를 단계 아래에 끼운다
// (지역마다 cards:true 단계가 정확히 하나라 모든 카드가 한 번씩 나온다). 꿀팁은 tips[].step으로 단계에 붙는다.
let query = '';
function matches(e, q) {
  const a = areaById[e.area];
  return [e.name, e.jp, e.how, e.tip, a?.name, a?.jp, e.char, KIND[e.kind]].join(' ').toLowerCase().includes(q);
}
function filterList(list) {
  return list.filter(e => shown(e) && (!S.onlyLeft || !isDone(e.id)) && (!S.onlyMiss || has(e, 'missable')));
}
const REF_NAME = { password: '정령의 동굴 암호', dragunov: '드라구노프 이벤트 순서', coliseum: '투기장 회차별 보상', race: '미래 레이스 코스 기록 상품', aifread: '아이프리드 보물 지도', moria: '모리아 갱도 하층', grade: '그레이드 숍' };
// 지금 위치(S.pos = 마지막으로 지난 관문)가 속한 장 = 그 관문으로 끝나는 장의 다음 장
function curChapter() {
  const ch = D.guide?.chapters || [];
  const i = S.pos ? ch.findIndex(c => c.gate === S.pos) : -1;
  return ch[i + 1] || ch[i] || null;
}
// 공략 탭이면 시대 탭을 지금 장의 시대로 맞춘다(앱을 다시 열 때·위치가 바뀔 때)
const eraToCur = () => { const c = S.view === 'route' && D?.guide && curChapter(); if (c) S.era = c.era; };
// 지금 장이 그 시대의 첫 장이 아니면 그 장까지 내려간다
const scrollToCur = () => { const el = $('#view details.chap.cur'); if (el && el.previousElementSibling) el.scrollIntoView({ block: 'start' }); };
let tipsByStep = null;
const stepTips = id => {
  if (!tipsByStep) { tipsByStep = {}; (D.guide?.tips || []).forEach(t => (tipsByStep[t.step] ||= []).push(t)); }
  return tipsByStep[id] || [];
};
const unconfirmed = x => x.conf === '미확인' ? '<span class="chip conf g-unc" title="두 검증 중 한쪽만 원본과 맞춰 본 내용입니다">미확인</span>' : '';
const tipHTML = t => `<div class="g-tip" data-tip="${esc(t.id)}"><div class="g-marks"><span class="chip g-tipk">꿀팁</span>${t.glitch ? '<span class="chip g-glitch">버그 이용</span>' : ''}${unconfirmed(t)}</div><p>${esc(t.text)}</p></div>`;
function stepHTML(s, opts = {}) {
  const a = s.cards && areaById[s.area];
  return `<li class="g-step" data-step="${esc(s.id)}">
    ${opts.from ? `<p class="g-from">${esc(opts.from)}</p>` : ''}
    <p class="g-text">${esc(s.text)}${unconfirmed(s)}</p>
    ${s.boss ? `<p class="g-boss"><span class="g-k">보스</span><b>${esc(s.boss.name)}</b>${esc(s.boss.advice)}</p>` : ''}
    ${s.ref ? `<button class="g-ref" data-act="ref" data-ref="${esc(s.ref)}">${svg('book', 'ic mini')}참고: ${esc(REF_NAME[s.ref] || s.ref)}</button>` : ''}
    ${(opts.tips || stepTips(s.id)).map(tipHTML).join('')}
    ${a && !opts.noCards ? areaCards(a) : ''}
  </li>`;
}
// 지역 카드 묶음. 시점이 늦게 풀리는 카드(e.when)는 그 가상 지역 단계에 나온다
function areaCards(a) {
  const all = D.entries.filter(e => placeOf(e) === a.id && shown(e));
  if (!all.length) return '';
  const list = filterList(all);
  const cnt = all.filter(counted), pr = all.filter(progress);
  const dn = pr.filter(e => isDone(e.id)).length;
  const missLeft = cnt.filter(e => has(e, 'missable') && !isDone(e.id)).length;
  const until = a.until && gateById[a.until];
  return `<details class="area"${(a.id === openArea) ? ' open' : ''} data-area="${esc(a.id)}">
    <summary>
      <span class="a-name">${nameJp(a.name, a.jp)}</span>
      <span class="a-meta">${until ? `<span class="a-due${passed(until) ? ' past' : ''}">${esc(until.title)} 전까지</span>` : ''}<span class="a-due a-miss"${missLeft ? '' : ' hidden'}>놓치면 끝 ${missLeft}</span><span class="a-count"${pr.length ? '' : ' hidden'}>${dn}/${pr.length}</span></span>
      ${svg('chevron', 'ic chev')}
    </summary>
    <div class="a-body">${list.length ? sortEntries(list).map(e => entryHTML(e, { showArea: !!e.when })).join('') : '<p class="empty">조건에 맞는 항목이 없습니다.</p>'}</div>
  </details>`;
}
// 장 열림 상태: 지금 장만 펼치고, 직접 여닫은 장은 위치가 바뀔 때까지 기억한다
let chapOpen = {}, chapPos;
// 지난 장 안에 남은, 기한 관문이 아직 안 지난 놓치면 끝 카드 수(접힌 장 머리에 배지로)
const chapAreas = c => new Set(c.steps.filter(s => s.cards).map(s => s.area));
function chapLeft(c) {
  const ids = chapAreas(c);
  return D.entries.filter(e => {
    const g = gateById[deadlineOf(e)];
    return g && !passed(g) && ids.has(placeOf(e)) && counted(e) && has(e, 'missable') && !isDone(e.id);
  }).length;
}
const chapLeftHTML = n => `<span class="c-left"${n ? '' : ' hidden'}>아직 챙길 놓치면 끝 ${n}</span>`;
function chapterHTML(c, i, cur, ci) {
  const g = c.gate && gateById[c.gate];
  const isCur = c === cur;
  return `<details class="chap${isCur ? ' cur' : ''}${i < ci ? ' passed' : ''}" data-chap="${esc(c.id)}"${(chapOpen[c.id] ?? isCur) ? ' open' : ''}>
    <summary>
      <span class="c-k">${i + 1}장${isCur ? '<span class="c-here">지금 여기</span>' : ''}${i < ci ? chapLeftHTML(chapLeft(c)) : ''}</span>
      <span class="c-title">${esc(c.title)}</span>
      ${g ? `<span class="c-gate${passed(g) ? ' past' : ''}">${svg('flag', 'ic mini')}<span>${passed(g) ? '지난 관문' : '장 끝 관문'}: ${esc(g.title)}</span></span>` : ''}
      ${svg('chevron', 'ic chev')}
    </summary>
    <div class="c-body">
      ${g ? `<p class="c-warn${passed(g) ? ' past' : ''}">${svg('flag', 'ic mini')}<span><b>${esc(g.title)}</b> ${passed(g) ? '관문은 지났어요.' : '전에 챙기세요.'} ${rich(g.desc || '')}</span></p>` : ''}
      <ol class="g-steps">${c.steps.map(s => stepHTML(s)).join('')}</ol>
    </div>
  </details>`;
}
function viewRoute() {
  const q = query.trim().toLowerCase();
  const era = S.era;
  // 관문 줄은 그 관문으로 끝나는 장의 시대에 둔다(엔딩 관문은 미래 장 endgame-c3이 끝냄)
  const gateEra = g => D.guide?.chapters.find(c => c.gate === g.id)?.era || g.era;
  const eraGates = gates.filter(g => gateEra(g) === era);
  const filters = `<div class="filters">
      <label class="search">${svg('search')}<input type="search" placeholder="단계, 아이템, 지역 이름으로 찾기" value="${esc(query)}" data-act="q" enterkeyhint="search"></label>
      <div class="toggles">
        <button class="pill${S.onlyMiss ? ' on' : ''}" data-act="t-miss" aria-pressed="${S.onlyMiss}">놓치면 끝만</button>
        <button class="pill${S.onlyLeft ? ' on' : ''}" data-act="t-left" aria-pressed="${S.onlyLeft}">남은 것만</button>
      </div>
    </div>`;
  return `<section class="route guide">
    <div class="route-top"${q ? ' hidden' : ''}>
    <div class="seg-box"><div class="seg" role="tablist" aria-label="시대">
      <span class="seg-thumb" aria-hidden="true"></span>
      ${D.eras.map(x => `<button role="tab" class="seg-b${x.id === era ? ' cur' : ''}" aria-selected="${x.id === era}" data-act="era-tab" data-era="${x.id}">${esc(x.name)}</button>`).join('')}
    </div></div>
    <p class="era-range">${esc(eraById[era]?.range || '')}</p>
    ${eraGates.length ? `<ol class="gate-line">${eraGates.map(g => `<li class="${passed(g) ? 'passed' : ''}${nextGate() === g ? ' next' : ''}"><span class="dot"></span><span>${esc(g.title)}</span></li>`).join('')}</ol>` : ''}
    </div>
    ${filters}
    <div class="route-body">${routeBody()}</div>
  </section>`;
}
function routeBody() {
  const q = query.trim().toLowerCase();
  if (q) return guideSearch(q);
  // 캐시에 남은 옛 data.json(guide 없음)이면 지역 목록으로 카드만 보여 준다
  if (!D.guide) return D.areas.filter(a => a.era === S.era).sort((a, b) => a.order - b.order).map(areaCards).join('');
  if (chapPos !== S.pos) { chapOpen = {}; chapPos = S.pos; }
  const ch = D.guide.chapters, cur = curChapter(), ci = ch.indexOf(cur);
  return ch.map((c, i) => c.era === S.era ? chapterHTML(c, i, cur, ci) : '').join('') || '<p class="empty">이 시대에는 공략 단계가 없습니다.</p>';
}
// 검색: 단계(보스·지역 이름 포함)·꿀팁·카드를 모두 찾는다. 꿀팁만 맞으면 그 단계에 맞은 꿀팁만 붙여 보여 준다
function guideSearch(q) {
  const hit = (...xs) => xs.join(' ').toLowerCase().includes(q);
  const steps = []; let nTips = 0;
  (D.guide?.chapters || []).forEach((c, i) => c.steps.forEach(s => {
    const a = areaById[s.area];
    const own = hit(s.text, s.boss?.name, s.boss?.advice, a?.name, a?.jp);
    const tips = stepTips(s.id).filter(t => hit(t.text));
    if (!own && !tips.length) return;
    nTips += tips.length;
    steps.push(stepHTML(s, { from: `${i + 1}장 · ${c.title}`, tips: own ? stepTips(s.id) : tips, noCards: true }));
  }));
  const cards = filterList(D.entries.filter(e => matches(e, q)));
  if (!steps.length && !cards.length) return '<p class="empty">찾는 이름이 없습니다. 일본어 이름이나 지역 이름으로도 찾아 보세요.</p>';
  return `<p class="count">단계 ${steps.length}개 · 꿀팁 ${nTips}개 · 카드 ${cards.length}개 찾음</p>
    ${steps.length ? `<ol class="g-steps g-hits">${steps.join('')}</ol>` : ''}
    ${cards.length ? `<h3 class="g-h">카드</h3>${sortEntries(cards).map(e => entryHTML(e, { showArea: true })).join('')}` : ''}`;
}
let openArea = null;

/* ---------- 뷰: 캐릭터 ---------- */
function viewChars() {
  const c = S.char;
  const list = D.entries.filter(e => e.char === c && shown(e));
  const byKind = CHAR_KIND_ORDER.map(k => [k, list.filter(e => e.kind === k)]).filter(([, l]) => l.length);
  const cnt = list.filter(progress);
  const dn = cnt.filter(e => isDone(e.id)).length;
  return `<section class="chars">
    <nav class="avatars" aria-label="캐릭터">
      ${CHARS.map(([ko, jp]) => {
        const n = D.entries.filter(e => e.char === ko && progress(e)).length;
        return `<button class="ava${ko === c ? ' cur' : ''}" data-act="char" data-char="${ko}" aria-pressed="${ko === c}"><span class="ava-c">${esc(ko[0])}</span><span class="ava-n">${esc(ko)}</span><span class="sr">(${esc(jp)}) 항목 ${n}개</span></button>`;
      }).join('')}
    </nav>
    <header class="char-h"><h2>${esc(c)}</h2><p>${cnt.length ? `기술과 전용 요소 ${cnt.length}개 중 ${dn}개 챙김` : list.length ? '이 캐릭터에는 요령 카드만 있습니다.' : '이 캐릭터에 묶인 항목이 없습니다.'}</p></header>
    ${byKind.map(([k, l]) => `<section class="group"><h3 class="group-h">${KIND[k]}<span${l.some(progress) ? '' : ' hidden'}>${l.filter(e => progress(e) && isDone(e.id)).length}/${l.filter(progress).length}</span></h3>${l.map(e => entryHTML(e, { showArea: true })).join('')}</section>`).join('')}
  </section>`;
}

/* ---------- 뷰: 참고 ---------- */
let pwMode = 'hidden';
function viewRefs() {
  const R = D.refs || {};
  const I = R.intro || {};
  const intro = k => I[k] ? `<p class="ref-intro">${rich(I[k])}</p>` : '';
  const blocks = [];
  if (I.guide) blocks.push(`<section class="ref" id="r-guide"><h2>공략 탭 보는 법</h2>${intro('guide')}</section>`);
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
    blocks.push(`<section class="ref" id="r-mystic"><h2>비오의 5종</h2>${intro('mystic')}
      <h3 class="ref-h3">발동 조건(5종 공통)</h3>
      <ul class="ref-list plain">${(R.mystic.common || []).map(t => `<li>${rich(t)}</li>`).join('')}</ul>
      <h3 class="ref-h3">캐릭터별 얻는 법과 커맨드</h3>
      ${(R.mystic.rows || []).map(m => `<div class="myst"><div class="myst-h"><strong>${esc(m.name)}</strong><span>${esc(m.char)}</span>${m.conf && m.conf !== '확정' ? `<span class="chip conf">${esc(m.conf)}</span>` : ''}</div><p>${rich(m.cond)}</p><p class="cmd"><span class="cmd-k">커맨드</span>${esc(m.cmd)}</p></div>`).join('')}
    </section>`);
  }
  if (R.dragunov) blocks.push(`<section class="ref" id="r-dragunov"><h2>드라구노프 이벤트 순서</h2>${intro('dragunov')}<ol class="steps">${R.dragunov.map(t => `<li>${rich(t)}</li>`).join('')}</ol></section>`);
  const table = (title, rows, a, b, ka = '', kb = '', notes = [], k = '') => rows && rows.length ? `<section class="ref"${k ? ` id="r-${k}"` : ''}><h2>${title}</h2>${intro(k)}${(notes || []).map(n => `<p class="ref-p">${rich(n)}</p>`).join('')}<div class="tbl">${rows.map(r => `<div class="tr"><span class="td-a">${rich(r[a])}${ka}</span><span class="td-b">${rich(r[b])}${kb}${jpTag(r.jp)}${r.loc ? `<small class="td-loc">${svg('pin', 'ic mini')}${rich(r.loc)}</small>` : ''}</span></div>`).join('')}</div></section>` : '';
  blocks.push(table('투기장 회차별 보상', R.coliseum, 'n', 'reward', '회', '', R.coliseumNotes, 'coliseum'));
  blocks.push(table('미래 레이스 코스 기록 상품', R.race, 'time', 'reward', '', '', R.raceNotes, 'race'));
  blocks.push(table('아이프리드 보물 지도', R.aifread, 'n', 'reward', '번', '', R.aifreadNotes, 'aifread'));
  if (R.moria) blocks.push(`<section class="ref" id="r-moria"><h2>모리아 갱도 하층</h2>${intro('moria')}<ul class="ref-list">${R.moria.map(t => `<li>${rich(t)}</li>`).join('')}</ul></section>`);
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
      <p class="ref-p">아이폰은 Safari와 홈 화면 앱의 저장 공간이 따로입니다. Safari에서 쓰다가 홈 화면 앱으로 옮길 때는 먼저 Safari에서 백업 파일을 받고, 홈 화면 앱의 이 화면에서 불러오세요.</p>
      <div class="row2">
        <button class="pill big" data-act="export">백업 파일 받기</button>
        <label class="pill big">백업 불러오기<input type="file" accept="application/json,.json" data-act="import" hidden></label>
      </div>
    </section>
    <section class="ref"><h2>보기</h2>
      <button class="switch" role="switch" aria-checked="${S.showCommon}" data-act="t-common"><span>흔한 소모품도 보기</span><span class="sw-k" aria-hidden="true"></span></button>
      <p class="ref-p">애플구미처럼 상점에서 쉽게 사는 소모품·장비 카드는 기본으로 숨깁니다. 켜도 진행률과 「놓치면 끝」 숫자에는 넣지 않습니다.</p>
    </section>
    <section class="ref"><h2>사진 오프라인 저장</h2>
      <p class="ref-p">위치 사진은 화면에 나온 것만 이 기기에 남습니다. 와이파이에서 한 번 받아 두면 오프라인에서도 모든 사진이 보입니다.</p>
      <p class="ref-p shot-stat">사진 ${allShots().length}장</p>
      <div class="row2"><button class="pill big" data-act="shots-save">사진 전부 받기</button></div>
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

const posName = id => id && gateById[id] ? `${gateById[id].title} 지남` : '처음부터';
function importSheet(b) {
  const n = Object.keys(b.checked).length;
  const notes = [b.unknown ? `그중 ${b.unknown}개는 지금 안내에 없는 카드라 기록으로만 남깁니다(안내가 갱신되면 다시 보입니다).` : '', b.badPos ? '백업의 위치는 이 안내에 없는 관문이라 뺐습니다.' : ''].filter(Boolean).join(' ');
  return `<h2 class="sheet-h">백업 불러오기</h2><p class="sheet-p">백업: 체크 ${n}개, 위치 ${esc(posName(b.pos))}<br>지금: 체크 ${Object.keys(S.checked).length}개, 위치 ${esc(posName(S.pos))}${notes ? `<br>${esc(notes)}` : ''}</p>
    <p class="sheet-p">「바꾸기」는 백업한 때로 되돌리고, 「합치기」는 지금 체크를 남긴 채 백업의 체크를 더합니다(위치는 더 멀리 간 쪽).</p>
    <div class="row2"><button class="pill big" data-act="import-replace">이 백업으로 바꾸기</button><button class="pill big ghost" data-act="import-merge">지금 기록과 합치기</button></div>
    <div class="row2"><button class="pill big ghost" data-act="sheet-close">그만두기</button></div>`;
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
  const v = Object.hasOwn(VIEWS, S.view) ? S.view : 'home';
  const main = $('#view');
  const y = opts.keepScroll ? scrollY : 0;
  main.innerHTML = VIEWS[v]();
  main.dataset.view = v;
  if (v === 'records') shotStat();
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
    // 아주 좁으면 시대 탭이 여러 줄 격자가 되므로(app.css .seg) 그때만 알약 높이와 줄 위치를 따라간다
    const grid = getComputedStyle(seg).display === 'grid';
    th.style.width = cur.offsetWidth + 'px';
    th.style.height = grid ? cur.offsetHeight + 'px' : '';
    th.style.transform = `translate(${cur.offsetLeft - 4}px, ${grid ? cur.offsetTop - seg.querySelector('.seg-b').offsetTop : 0}px)`;
  });
}
function go(view) { S.view = view; save(); render(); }

function softRerender() {
  if (S.view === 'home') {
    // 링과 숫자를 갱신하되 목록은 그대로 둔다
    const g = nextGate();
    const miss = segmentEntries(g).filter(e => has(e, 'missable') && counted(e));
    const left = miss.filter(e => !isDone(e.id));
    const bar = $('.ring-bar'); if (bar) { const c = 2 * Math.PI * 46; bar.style.strokeDashoffset = c * (1 - (miss.length ? (miss.length - left.length) / miss.length : 1)); }
    const s = $('.orb-s'); if (s) { const pr = D.entries.filter(progress); s.textContent = g ? orbLine(miss.length, left.length) : `전체 ${pr.filter(e => isDone(e.id)).length}/${pr.length}`; }
    const st = $('.stat-card'); if (st) { const tmp = document.createElement('div'); tmp.innerHTML = viewHome(); st.replaceWith(tmp.querySelector('.stat-card')); }
    const lh = $('.panel.late summary h2'); if (lh) lh.innerHTML = lateTitle(document.querySelectorAll('.panel.late .entry:not(.done):not(.common)').length);
    document.querySelectorAll('details.area[data-home]').forEach(d => {
      const es = d.querySelectorAll('.entry:not(.noprog)'), c = d.querySelector('.a-count');
      if (c) c.textContent = areaCount(d.classList.contains('last'), d.querySelectorAll('.entry.done:not(.noprog)').length, es.length);
      const m = d.querySelector('.a-miss'), ml = d.querySelectorAll('.entry.miss:not(.done):not(.common)').length;
      if (m) { m.textContent = `놓치면 끝 ${ml}`; m.hidden = !ml; }
    });
  } else if (S.view === 'route') {
    document.querySelectorAll('details.area').forEach(d => {
      const all = D.entries.filter(e => placeOf(e) === d.dataset.area && counted(e)), pr = all.filter(progress);
      const c = d.querySelector('.a-count'); if (c) c.textContent = `${pr.filter(e => isDone(e.id)).length}/${pr.length}`;
      const m = d.querySelector('.a-miss'), ml = all.filter(e => has(e, 'missable') && !isDone(e.id)).length;
      if (m) { m.textContent = `놓치면 끝 ${ml}`; m.hidden = !ml; }
    });
    document.querySelectorAll('details.chap .c-left').forEach(el => {
      const c = D.guide.chapters.find(x => x.id === el.closest('details.chap').dataset.chap);
      if (c) el.outerHTML = chapLeftHTML(chapLeft(c));
    });
  } else if (S.view === 'chars') {
    document.querySelectorAll('.group').forEach(gr => {
      const ids = [...gr.querySelectorAll('.entry:not(.noprog)')].map(x => x.dataset.id);
      const sp = gr.querySelector('.group-h span'); if (sp) sp.textContent = `${ids.filter(isDone).length}/${ids.length}`;
    });
    const h = $('.char-h'); if (h) { const tmp = document.createElement('div'); tmp.innerHTML = viewChars(); h.replaceWith(tmp.querySelector('.char-h')); }
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
      // 같은 카드가 화면 여러 곳에 있으면 모두 함께 바꾼다
      document.querySelectorAll(`.entry[data-id="${CSS.escape(id)}"]`).forEach(el => {
        el.classList.toggle('done', !!S.checked[id]);
        el.querySelector('.tick')?.setAttribute('aria-pressed', String(!!S.checked[id]));
      });
      if (S.checked[id] && !reduceMotion.matches) { entryEl.classList.remove('pop'); void entryEl.offsetWidth; entryEl.classList.add('pop'); }
      softRerender();
      break;
    }
    case 'shot': if (t.closest('.shots[data-dragged]')) break; openSheet(shotSheet(entryById[id], +t.dataset.i), 'photo'); break;
    case 'pick': openSheet(pickSheet(), 'list'); $('.pick-b.cur')?.scrollIntoView({ block: 'center' }); break;
    case 'set-pos': S.pos = t.dataset.gate || null; eraToCur(); save(); closeSheet(); render(); if (S.view === 'route') scrollToCur(); toast(S.pos ? `${gateById[S.pos].title}까지 지난 것으로 표시했습니다.` : '처음부터로 돌렸습니다.'); break;
    case 'pass': {
      const g = nextGate(); if (!g) break;
      const left = segmentEntries(g).filter(e => has(e, 'missable') && counted(e) && !isDone(e.id));
      if (left.length) openSheet(passSheet(g, left), 'list');
      else { S.pos = g.id; save(); render(); toast(`${g.title} 통과. 다음 관문을 보여 드립니다.`); }
      break;
    }
    case 'pass-force': S.pos = t.dataset.gate; save(); closeSheet(); render(); break;
    case 'sheet-close': closeSheet(); break;
    case 'era': S.era = t.dataset.era; query = ''; go('route'); if (S.era === curChapter()?.era) scrollToCur(); break;
    case 'ref': query = ''; go('refs'); $(`#r-${CSS.escape(t.dataset.ref)}`)?.scrollIntoView({ block: 'start' }); break;
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
    case 'reset-do': S.checked = {}; S.pos = null; save({ replace: true }); closeSheet(); render(); toast('체크와 위치를 비웠습니다.'); break;
    case 't-common': S.showCommon = !S.showCommon; save(); render({ keepScroll: true }); break;
    case 'shots-save': saveShots(t); break;
    case 'import-replace': case 'import-merge': {
      const b = pendingImport; if (!b) break;
      pendingImport = null;
      if (act === 'import-replace') { S.checked = { ...b.checked }; S.pos = b.pos; save({ replace: true }); }
      else {
        S.checked = { ...S.checked, ...b.checked };
        if (b.pos && gateById[b.pos].idx > posIdx()) S.pos = b.pos;
        save();
      }
      closeSheet(); render({ keepScroll: true });
      toast(`백업을 ${act === 'import-replace' ? '불러왔습니다' : '합쳤습니다'}. 체크 ${Object.keys(S.checked).length}개, 위치 ${posName(S.pos)}.`);
      break;
    }
  }
});
document.addEventListener('change', async ev => {
  const t = ev.target;
  if (t.dataset.act === 'import') {
    await importBackup(t.files[0]); t.value = '';
  }
});
// 검색창은 그대로 두고 아래 결과만 다시 그린다. 한글 조합 중에는 그리지 않고 조합이 끝나면 그린다
function searchLater(inp) {
  query = inp.value;
  clearTimeout(qT);
  qT = setTimeout(() => {
    const sec = $('#view .route'); if (!sec) return;
    $('.route-top', sec).hidden = !!query.trim();
    $('.route-body', sec).innerHTML = routeBody();
    placeThumbs(sec);
  }, 160);
}
document.addEventListener('input', ev => {
  if (ev.target.dataset.act === 'q' && !ev.isComposing) searchLater(ev.target);
});
document.addEventListener('compositionend', ev => {
  if (ev.target.dataset?.act === 'q') searchLater(ev.target);
});
let qT;
document.addEventListener('toggle', ev => {
  if (ev.target.matches?.('details.area') && ev.target.open) openArea = ev.target.dataset.area;
  if (ev.target.matches?.('details.late-box')) lateOpen = ev.target.open;
  if (ev.target.matches?.('details.chap')) chapOpen[ev.target.dataset.chap] = ev.target.open;
}, true);
// 다른 탭(창)에서 저장하면 이 탭도 같은 체크·위치로 맞춘다
addEventListener('storage', ev => {
  if (ev.key !== null && ev.key !== STORE_KEY) return;
  // 키가 지워졌거나 읽지 못하는 값이면 따르지 않는다(다음 저장 때 이 탭 기록을 통째로 쓴다)
  const L = readStore(), oldPos = S.pos, oldEra = S.era;
  if (!L) return;
  S.checked = L.checked; for (const k of SHARED) S[k] = L[k];
  base = snap(S);
  applyTheme();
  if (!D) return;
  if (S.pos !== oldPos) eraToCur();
  if (S.view === 'route' && document.activeElement?.dataset.act === 'q') {
    // 검색 입력 중이면 입력창은 그대로 두고(한글 조합 보호), 시대가 바뀌었으면 시대 탭·관문 줄도 다시 그린다
    const sec = $('#view .route');
    if (S.era !== oldEra) {
      const tmp = document.createElement('div'); tmp.innerHTML = viewRoute();
      $('.route-top', sec).replaceWith($('.route-top', tmp));
      document.documentElement.dataset.era = S.era;
      placeThumbs(sec);
    }
    $('.route-body', sec).innerHTML = routeBody();
  } else {
    render({ keepScroll: true });
    if (S.pos !== oldPos && S.view === 'route') scrollToCur();
  }
});
// 공략 탭은 지금 장의 시대로 열고, 그 장이 시대의 첫 장이 아니면 그 장까지 내려간다
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
  query = '';
  const cur = b.dataset.view === 'route' && D?.guide && curChapter();
  if (cur) S.era = cur.era;
  go(b.dataset.view);
  if (cur) scrollToCur();
}));
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
// 직접 고른 테마는 상태 표시줄 색(theme-color)도 그 색으로
const THEME_BG = { light: '#e9e8ed', dark: '#2a2c34' };
function applyTheme() {
  const r = document.documentElement;
  if (S.theme === 'auto') delete r.dataset.theme; else r.dataset.theme = S.theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    m.dataset.auto ??= m.content;
    m.content = THEME_BG[S.theme] || m.dataset.auto;
  });
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
  if (j?.app !== 'topx') { toast('이 페이지의 백업 파일이 아닙니다.'); return; }
  const plain = o => !!o && typeof o === 'object' && !Array.isArray(o);
  const st = j.state;
  if (!plain(st) || !plain(st.checked) || (st.pos != null && typeof st.pos !== 'string')) { toast('백업 파일 형식이 맞지 않아 불러오지 않았습니다.'); return; }
  // 지금 data.json에 없는 카드 id도 버리지 않는다(옛 data.json이 캐시에서 왔을 수 있고, 데이터가 갱신되면 다시 쓰인다)
  const checked = {}; let unknown = 0;
  for (const [k, v] of Object.entries(st.checked)) {
    if (!v) continue;
    checked[k] = typeof v === 'number' ? v : Date.now();
    if (!entryById[k]) unknown++;
  }
  const pos = st.pos && gateById[st.pos] ? st.pos : null;
  const badPos = !!st.pos && !pos;
  if (!Object.keys(checked).length && !pos && badPos) { toast('이 안내의 관문과 맞는 기록이 없어 불러오지 않았습니다.'); return; }
  pendingImport = { checked, pos, unknown, badPos };
  openSheet(importSheet(pendingImport), 'list');
}
let pendingImport = null;

/* ---------- 사진 오프라인 저장 ---------- */
const allShots = () => [...new Set(D.entries.flatMap(e => (e.shots || []).map(p => p.f)))];
// 사진은 VERSION 캐시가 아닌 따로 둔 캐시에 저장한다(앱을 갱신해도 지워지지 않게, sw.js SHOTS와 같은 이름)
const SHOT_CACHE = 'topx-shots';
async function shotStat() {
  const el = $('.shot-stat'); if (!el) return;
  const list = allShots();
  if (!('caches' in window) || !navigator.serviceWorker?.controller) { el.textContent = `사진 ${list.length}장. 이 브라우저에서는 오프라인 저장을 쓸 수 없습니다.`; return; }
  // 사진 캐시만 센다(화면에 지나간 사진도 sw.js가 사진 캐시에 넣는다. VERSION 캐시는 다음 갱신 때 지워진다)
  const c = await caches.open(SHOT_CACHE);
  let n = 0; for (const f of list) if (await c.match(f)) n++;
  const est = await navigator.storage?.estimate?.().catch(() => null);
  if (el.isConnected) el.textContent = `사진 ${list.length}장 중 ${n}장 저장됨${est ? ` · 이 사이트가 쓰는 저장 공간 약 ${(est.usage / 1048576).toFixed(1)}MB` : ''}`;
}
async function saveShots(btn) {
  if (!('caches' in window) || !navigator.serviceWorker?.controller) { toast('이 브라우저에서는 사진을 오프라인으로 저장할 수 없습니다.'); return; }
  const c = await caches.open(SHOT_CACHE), list = allShots();
  let i = 0, ok = 0, fail = 0;
  btn.disabled = true;
  const el = $('.shot-stat');
  const work = async () => {
    while (i < list.length) {
      const f = list[i++];
      // 옛 워커가 VERSION 캐시에 넣어 둔 사진은 다음 갱신 때 지워지므로 사진 캐시로 옮겨 둔다
      try { if (!(await c.match(f))) { const r = (await caches.match(f)) || await fetch(f); if (!r.ok) throw new Error(r.status); await c.put(f, r); } ok++; } catch { fail++; }
      if (el?.isConnected) el.textContent = `받는 중 ${ok + fail}/${list.length}`;
    }
  };
  await Promise.all(Array.from({ length: 6 }, work));
  btn.disabled = false;
  await shotStat();
  toast(fail ? `사진 ${fail}장을 받지 못했습니다. 연결을 확인하고 다시 눌러 주세요.` : `사진 ${ok}장을 이 기기에 저장했습니다. 오프라인에서도 보입니다.`);
}

/* ---------- 시작 ---------- */
// 새로고침 때 브라우저가 옛 스크롤 위치를 되살리지 않게 한다(화면은 앱이 다시 그리고 공략 탭은 지금 장으로 내려간다)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
applyTheme();
// 첫 scrollToCur 뒤 사용자 입력(휠·터치·키·포인터·장 열기/검색의 click·input)이 있었는지. scroll 이벤트는 쓰지 않는다(scrollToCur 자신도 scroll을 낸다)
let touched = false;
for (const t of ['wheel', 'touchstart', 'keydown', 'pointerdown', 'click', 'input']) addEventListener(t, () => { touched = true; }, { capture: true, passive: true });
loadData().then(() => {
  document.documentElement.classList.add('ready');
  eraToCur();
  render({ noScroll: true });
  touched = false; // 데이터를 기다리는 동안의 입력은 첫 scrollToCur이 이미 덮으므로 세지 않는다
  if (S.view === 'route') scrollToCur();
  // 글꼴이 늦게 와 장 높이가 바뀌면 한 번 더 지금 장으로(그사이 다른 탭으로 갔거나 사용자가 손을 댔으면 그대로)
  document.fonts?.ready.then(() => { if (S.view === 'route' && !query && !touched) scrollToCur(); });
  navigator.storage?.persist?.().catch(() => {});
}).catch(() => {
  $('#view').innerHTML = '<p class="empty">공략 데이터를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요. 한 번 연 뒤에는 오프라인에서도 열립니다.</p>';
});
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
})();
