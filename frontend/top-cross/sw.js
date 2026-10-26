// 테오판 X 놓침 방지 안내: 한 번 열면 오프라인에서도 열리도록 캐시한다.
// 앱 파일을 바꾸면 VERSION을 올린다.
const VERSION = 'topx-v10';
// index.html은 라이브에서 './'로 308 리다이렉트되므로 넣지 않는다(리다이렉트된 응답은 페이지 탐색에 쓰면 네트워크 오류)
const CORE = ['./', './app.css?v=10', './app.js?v=10', './data.json', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
// 응답이 이만큼 늦으면 캐시본을 먼저 보여 주고, 새 응답은 뒤에서 받아 다음에 쓴다
const WAIT_MS = 3000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
// 설정 「사진 전부 받기」가 쓰는 캐시. VERSION을 올려도 지우지 않는다(app.js SHOT_CACHE와 같은 이름)
const SHOTS = 'topx-shots';
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('topx-') && k !== VERSION && k !== SHOTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 실패 응답(404·5xx)이나 data.json 자리에 온 다른 내용(와이파이 로그인 화면 등)은 캐시하지 않는다
const good = (r, type) => r.ok && (r.headers.get('content-type') || '').includes(type);
// 새 내용을 먼저, 실패·지연이면 캐시. 캐시 키는 하나로 고정(주소 쿼리마다 사본이 쌓이지 않게).
// 늦은 응답은 이벤트 수명(waitUntil)에 묶지 않는다(캐시본을 준 뒤 옛 워커를 붙잡아 두지 않게).
// 캐시는 caches.match로 찾는다: 새 VERSION이 옛 캐시를 지운 뒤 옛 워커가 caches.open하면 빈 캐시를 다시 만든다.
function fresh(e, key, type) {
  const cached = caches.match(key);
  const net = fetch(e.request).then(r => {
    if (good(r, type) && !r.redirected) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(key, copy)); }
    return r;
  });
  return new Promise(resolve => {
    let done = false;
    const give = r => { if (!done && r) { done = true; resolve(r); } };
    const timer = setTimeout(() => cached.then(give), WAIT_MS);
    net.then(r => good(r, type) || r.type === 'opaqueredirect' ? r : cached.then(hit => hit || r), () => cached.then(hit => hit || Response.error()))
      .then(r => { clearTimeout(timer); give(r); });
  });
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  // 페이지와 공략 데이터
  if (req.mode === 'navigate' && /\/(index\.html)?$/.test(url.pathname)) { e.respondWith(fresh(e, './', 'text/html')); return; }
  if (url.pathname.endsWith('/data.json')) { e.respondWith(fresh(e, './data.json', 'json')); return; }
  // 나머지(앱 파일, 글꼴, 사진)는 캐시 먼저, 뒤에서 갱신
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
