"""idala-demo 영상 전달 경로 시험.

lab.bkan.dev가 Cloudflare 존 프록시(무료 플랜 IP)를 타면 KT 회선에서 LAX로 돌아 약 1Mbps만 나온다.
2026-11-04 lab 레코드를 DNS only로 바꿔 Pages IP(ICN)로 직결했다. 이 시험은 그 상태를 지킨다:
영상이 재생보다 빨리 오고, 장면 점프·탐색·전후 비교가 깨지지 않는다(Range 206 필요).

실행: PAGE_URL=<페이지 주소> uv run --with pytest --with playwright pytest tools/video-origin -q
VIDEO_ENGINE=chromium|webkit 로 엔진을 고른다.
"""
import os
import pytest
from playwright.sync_api import sync_playwright

PAGE_URL = os.environ.get("PAGE_URL", "http://127.0.0.1:18900/motion/idala-demo/")
BROWSER = os.environ.get("VIDEO_ENGINE", "chromium")


@pytest.fixture
def page():
    with sync_playwright() as p:
        # 오픈소스 Chromium은 H.264를 못 튼다. 크롬 계열은 설치된 Google Chrome으로 시험한다
        if BROWSER == "chromium":
            # HOST_RULES 로 DNS를 바꾸지 않고 다른 경로를 흉내 낸다(예: "MAP lab.bkan.dev 172.66.44.130")
            args = [f"--host-resolver-rules={os.environ['HOST_RULES']}"] if os.environ.get("HOST_RULES") else []
            browser = p.chromium.launch(channel="chrome", args=args)
        else:
            browser = p.webkit.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        pg = ctx.new_page()
        pg.goto(PAGE_URL, wait_until="load")
        yield pg
        browser.close()


PLAY_SECONDS = 30
# 30초 동안 최소 이만큼은 진행해야 "멈추지 않고 재생"으로 본다(첫 버퍼 1~2초 여유)
MIN_PROGRESS = 26


@pytest.mark.cdn
def test_hero_plays_through_without_stalling(page):
    hero = page.locator(".final video")
    hero.evaluate(
        "v => { window.heroWaits = 0; v.addEventListener('waiting', () => window.heroWaits++);"
        " v.muted = true; return v.play(); }"
    )
    page.wait_for_timeout(PLAY_SECONDS * 1000)
    t = hero.evaluate("v => v.currentTime")
    waits = page.evaluate("window.heroWaits")
    assert t >= MIN_PROGRESS, f"{PLAY_SECONDS}초 동안 {t:.1f}초만 재생, waiting {waits}회"


# 히어로 평균 비트레이트 약 1.7Mbps. 버퍼링 없이 재생하려면 넉넉히 3배 이상이 들어와야 한다
MIN_MBPS = 5
MEASURE_JS = """async u => {
  const c = new AbortController(); setTimeout(() => c.abort(), 10000);
  const t0 = performance.now(); let n = 0;
  try { const r = await fetch(u, {signal: c.signal, cache: 'no-store'});
        const rd = r.body.getReader();
        for (;;) { const {done, value} = await rd.read(); if (done) break; n += value.length; } }
  catch (e) {}
  return n * 8 / 1e6 / ((performance.now() - t0) / 1000);
}"""


@pytest.mark.cdn
def test_hero_source_delivers_faster_than_playback(page):
    src = page.locator(".final video").evaluate("v => v.currentSrc || v.src")
    mbps = page.evaluate(MEASURE_JS, src)
    assert mbps >= MIN_MBPS, f"{src} 전송 {mbps:.1f}Mbps"


GRID_STATE = """() => [...document.querySelectorAll('#grid video')].map(v =>
  ({t: v.currentTime, paused: v.paused, err: v.error && v.error.code}))"""


def test_scene_jump_keeps_four_engines_together(page):
    page.locator("#play").scroll_into_view_if_needed()
    page.locator("#play").click()
    page.wait_for_timeout(3000)
    page.locator('button[aria-label="사진이 손톱에 장면, 44초로 이동"]').click()
    page.wait_for_timeout(5000)
    s = page.evaluate(GRID_STATE)
    ts = [x["t"] for x in s]
    assert all(x["err"] is None and not x["paused"] for x in s), s
    assert 45 <= min(ts) and max(ts) <= 52, ts
    assert max(ts) - min(ts) < 0.5, ts


def test_hero_seek_far_ahead_resumes(page):
    hero = page.locator(".final video")
    hero.evaluate("v => { v.muted = true; return v.play(); }")
    page.wait_for_timeout(1500)
    hero.evaluate("v => { v.currentTime = 90; }")
    page.wait_for_timeout(4000)
    st = hero.evaluate("v => ({t: v.currentTime, paused: v.paused, err: v.error && v.error.code})")
    assert st["err"] is None and not st["paused"], st
    assert 91 <= st["t"] <= 95, st


def test_before_after_clips_play(page):
    boxes = page.locator(".cmp")
    assert boxes.count() == 5
    for i in range(5):
        boxes.nth(i).scroll_into_view_if_needed()
        page.wait_for_timeout(2500)
        st = boxes.nth(i).evaluate(
            "b => [...b.querySelectorAll('video')].map(v => ({t: v.currentTime, err: v.error && v.error.code}))"
        )
        assert all(x["err"] is None and x["t"] > 0.5 for x in st), (i, st)


# Range: 브라우저가 영상 중간으로 넘길 때 쓰는 요청. 정답은 리포의 원본 파일 바이트다
REPO = __import__("pathlib").Path(__file__).resolve().parents[2]


@pytest.mark.parametrize("name,start,end", [
    ("final.mp4", 1_000_000, 1_000_999),
    ("hf.mp4", 0, 1),
    ("c1a.mp4", 200_000, None),
])
def test_video_range_returns_exact_bytes(name, start, end):
    import urllib.request
    url = PAGE_URL.split("#")[0].rstrip("/") + f"/v/{name}"
    data = (REPO / "motion/idala-demo/v" / name).read_bytes()
    last = len(data) - 1 if end is None else end
    req = urllib.request.Request(url, headers={
        "Range": f"bytes={start}-{'' if end is None else end}", "User-Agent": "bkan-lab-range-test"})
    with urllib.request.urlopen(req, timeout=30) as r:
        assert r.status == 206
        assert r.headers["Content-Range"] == f"bytes {start}-{last}/{len(data)}"
        assert r.headers["Accept-Ranges"] == "bytes"
        body = r.read()
    assert body == data[start:last + 1]
