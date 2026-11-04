// mp4에 Range(중간부터 받기)를 붙인다.
// lab.bkan.dev는 KT 회선의 LAX 우회를 피하려고 Cloudflare 존 프록시 없이(DNS only) Pages에 직결한다(2026-11-04).
// 그런데 Pages 정적 응답은 Range를 무시하고 항상 200 전체를 주므로, Chrome이 영상을 "넘길 수 없음"으로 보고
// 장면 점프·재생 막대가 동작하지 않는다.
//
// JS로 바이트를 잘라 보내면 1MB당 CPU 약 15ms가 들어 무료 한도(요청당 10ms)를 넘는다(2026-11-04 실측 최대 375ms).
// 그래서 Workers Cache API에 Content-Length를 붙인 전체 응답을 넣어 두고, Range는 캐시가 직접(네이티브로) 206을 만든다.
// 캐시 키에 ETag를 넣어 영상이 바뀌면 새 캐시를 쓴다. 호출 범위는 _routes.json에서 영상 폴더로 좁힌다.

// 배포 때 tools/video_sizes.py가 산출물에서 재서 만든다(정적 응답에 Content-Length가 없어서)
import SIZES from './video-sizes.json';

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const size = SIZES[decodeURIComponent(url.pathname)];
  if (!size || !['GET', 'HEAD'].includes(request.method)) return next();

  const res = await next();
  const etag = res.headers.get('ETag');
  if (res.status !== 200 || !etag) return res;

  const cache = caches.default;
  const key = `${url.origin}${url.pathname}?etag=${encodeURIComponent(etag)}`;
  const lookup = () => cache.match(new Request(key, { method: request.method, headers: request.headers }));

  let hit = await lookup();
  if (hit) {
    res.body?.cancel();
  } else {
    // 원본 스트림을 길이 고정 스트림으로 흘려 캐시에 넣는다(바이트는 JS를 거치지 않는다)
    const { readable, writable } = new FixedLengthStream(size);
    const piping = res.body.pipeTo(writable);
    const headers = new Headers(res.headers);
    headers.set('Content-Length', String(size));
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    await Promise.all([cache.put(key, new Response(readable, { status: 200, headers })), piping]);
    hit = await lookup();
    if (!hit) return next(); // 캐시에 못 넣었으면 Range 없이라도 재생은 되게 한다
  }

  const out = new Response(hit.body, hit);
  out.headers.set('Accept-Ranges', 'bytes');
  out.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return out;
}
