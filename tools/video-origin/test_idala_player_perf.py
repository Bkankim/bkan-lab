"""엔진 비교 플레이어 최적화 시험(지연 로드·미리 받기). idala·먼작귀·요즘레시피 공용.

후보(PAGE_URL)를 기준(BASELINE_URL, 기본은 PAGE_URL과 같은 글의 공개판)과 같은 실행 안에서
번갈아 재서 "나빠지지 않았는지"를 본다. 기준 비교·느린 회선은 Chrome 계열만(CDP가 필요하다),
VIDEO_ENGINE=webkit이면 기능 시험(B·D·F)만 돈다.

실행: PAGE_URL=<후보> BASELINE_URL=<공개판> uv run --no-project --python 3.14 --with pytest --with playwright \
      pytest tools/video-origin/test_idala_player_perf.py -q
"""
import os
import statistics
from urllib.parse import urlsplit

import pytest
from playwright.sync_api import sync_playwright

PAGE_URL = os.environ.get("PAGE_URL", "https://lab.bkan.dev/motion/idala-demo/")
# 기준은 따로 주지 않으면 후보와 같은 경로의 공개판이다(preview 주소를 넣어도 같은 글끼리 비교)
BASELINE_URL = os.environ.get("BASELINE_URL") or "https://lab.bkan.dev" + urlsplit(PAGE_URL).path
ROUNDS = int(os.environ.get("PERF_ROUNDS", "3"))
ENGINE = os.environ.get("VIDEO_ENGINE", "chromium")
# 먼작귀처럼 한 칸에 두 판(처음·수정 뒤)을 겹쳐 두는 글은 보이는 판만 센다
VISIBLE = "[...document.querySelectorAll('#grid video')].filter(v => !v.hidden)"
GRID = f"() => {VISIBLE}"
chrome_only = pytest.mark.skipif(ENGINE != "chromium", reason="기준 비교·느린 회선은 Chrome(CDP)만")


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        b = p.webkit.launch() if ENGINE == "webkit" else p.chromium.launch(channel="chrome")
        yield b
        b.close()


def new_page(browser, url, width=1440, height=900, throttle_mbps=None):
    ctx = browser.new_context(viewport={"width": width, "height": height})
    pg = ctx.new_page()
    if throttle_mbps:
        cdp = ctx.new_cdp_session(pg)
        cdp.send("Network.enable")
        bps = throttle_mbps * 1e6 / 8
        cdp.send("Network.emulateNetworkConditions", {
            "offline": False, "latency": 40, "downloadThroughput": bps, "uploadThroughput": bps})
    pg.goto(url, wait_until="domcontentloaded")
    return ctx, pg


# B. 처음 화면에서는 아래쪽 전후 비교 클립(c*, 글 끝 compare.js)을 받지 않는다
def test_first_screen_skips_before_after_clips(browser):
    ctx, pg = new_page(browser, PAGE_URL)
    pg.wait_for_timeout(3000)
    mp4 = pg.evaluate("() => performance.getEntriesByType('resource')"
                      ".map(e => e.name.split('/').pop()).filter(n => /\\.mp4/.test(n))")
    ctx.close()
    assert not [n for n in mp4 if n.startswith("c")], mp4


def start_latency(browser, url, wheel=False):
    """비교 영역으로 내려가 곧바로 재생을 눌러, 네 편이 모두 1초 지점을 넘기까지 걸린 시간(초).
    wheel=False는 순간 이동(최악), True는 사람처럼 휠로 내려가는 경우."""
    ctx, pg = new_page(browser, url)
    pg.wait_for_timeout(1500)
    if wheel:
        pg.mouse.move(720, 450)
        target = pg.locator("#play").evaluate("b => b.getBoundingClientRect().top + scrollY - 300")
        while pg.evaluate("scrollY") < target - 10:
            pg.mouse.wheel(0, 300)
            pg.wait_for_timeout(60)
    pg.locator("#play").scroll_into_view_if_needed()
    pg.locator("#play").click()
    t = pg.evaluate("""async () => {
      const t0 = performance.now();
      while (performance.now() - t0 < 15000) {
        const v = VIS;
        if (v.every(x => x.currentTime >= 1)) return (performance.now() - t0) / 1000;
        await new Promise(r => setTimeout(r, 50));
      }
      return 99;
    }""".replace("VIS", VISIBLE))
    ctx.close()
    return t


# C. 지연 로드 때문에 "바로 재생"이 늦어지면 안 된다(페이지를 열자마자 순간 이동해 누르는 최악의 경우)
@chrome_only
def test_start_latency_not_worse_than_baseline(browser):
    cand, base = [], []
    for _ in range(ROUNDS):
        base.append(start_latency(browser, BASELINE_URL))
        cand.append(start_latency(browser, PAGE_URL))
    print(f"\n시작 시간 기준 {base} / 후보 {cand}")
    assert max(cand) < 15
    assert statistics.median(cand) <= statistics.median(base) + 0.05, (base, cand)


# C2. 사람처럼 스크롤해 내려가 누르면 기준과 같아야 한다(지연 로드가 미리 준비할 시간이 있다)
@chrome_only
def test_start_latency_after_natural_scroll_matches_baseline(browser):
    cand, base = [], []
    for _ in range(ROUNDS):
        base.append(start_latency(browser, BASELINE_URL, wheel=True))
        cand.append(start_latency(browser, PAGE_URL, wheel=True))
    print(f"\n스크롤 시작 시간 기준 {base} / 후보 {cand}")
    assert statistics.median(cand) <= statistics.median(base) + 0.1, (base, cand)


# D. 좁은 화면: 고른 한 편이 재생되고, 다른 편으로 바꾸면 그 편이 이어서 재생된다
def test_narrow_screen_plays_selected_engine_and_switches(browser):
    ctx, pg = new_page(browser, PAGE_URL, width=400, height=860)
    pg.locator("#play").scroll_into_view_if_needed()
    pg.locator("#play").click()
    pg.wait_for_timeout(3000)
    states = pg.evaluate(f"() => ({GRID})().map(v => ({{t: v.currentTime, paused: v.paused}}))")
    playing = [s for s in states if not s["paused"]]
    assert len(playing) == 1 and playing[0]["t"] > 1.5, states
    tabs = pg.locator("#tabs [role=tab]")
    tabs.nth(3).click()
    pg.wait_for_timeout(3000)
    after = pg.evaluate(f"() => ({GRID})().map(v => ({{t: v.currentTime, paused: v.paused, err: v.error && v.error.code}}))")
    ctx.close()
    playing = [s for s in after if not s["paused"]]
    assert len(playing) == 1 and playing[0]["t"] > 3, after
    assert all(s["err"] is None for s in after), after


def slow_run(browser, url, mbps=3, seconds=20):
    ctx, pg = new_page(browser, url, throttle_mbps=mbps)
    pg.locator("#play").scroll_into_view_if_needed()
    pg.evaluate(f"""() => {{ window.seeks = 0;
      ({GRID})().forEach(v => v.addEventListener('seeking', () => window.seeks++)); }}""")
    pg.locator("#play").click()
    pg.wait_for_timeout(seconds * 1000)
    r = pg.evaluate(f"() => ({{t: ({GRID})().map(v => v.currentTime), seeks: window.seeks}})")
    ctx.close()
    return min(r["t"]), max(r["t"]) - min(r["t"]), r["seeks"]


# E. 느린 회선(3Mbps)에서 진행량·어긋남·초당 재탐색이 기준보다 나빠지면 안 된다
@chrome_only
def test_slow_network_playback_not_worse_than_baseline(browser):
    base = [slow_run(browser, BASELINE_URL) for _ in range(2)]
    cand = [slow_run(browser, PAGE_URL) for _ in range(2)]
    print(f"\n느린 회선 (진행, 어긋남, 재탐색) 기준 {base} / 후보 {cand}")
    bp, cp = max(b[0] for b in base), max(c[0] for c in cand)
    assert cp >= bp - 1.0, (base, cand)
    assert min(c[1] for c in cand) <= max(b[1] for b in base) + 0.5, (base, cand)
    # 재탐색은 회차 편차가 크고(공개판도 12~26회) 재생을 많이 할수록 보정도 는다. 재생 1초당 횟수로 본다
    rate = lambda runs: min(r[2] / max(r[0], 0.1) for r in runs)
    assert rate(cand) <= rate(base) * 1.2, (base, cand)


# F. 판 바꾸기(먼작귀의 처음 판·수정 뒤): 재생 중 바꾸면 새 판 네 편이 같은 시각에서 이어 재생된다
def test_mode_switch_keeps_playing_in_sync(browser):
    ctx, pg = new_page(browser, PAGE_URL)
    if pg.locator(".mode button").count() == 0:
        ctx.close()
        pytest.skip("판 바꾸기가 없는 글")
    pg.locator("#play").scroll_into_view_if_needed()
    pg.locator("#play").click()
    pg.wait_for_timeout(3000)
    other = pg.locator(".mode button[aria-checked=false]").first
    other.click()
    pg.wait_for_timeout(4000)
    r = pg.evaluate(f"() => ({GRID})().map(v => ({{t: v.currentTime, paused: v.paused, mode: v.dataset.mode, err: v.error && v.error.code}}))")
    ctx.close()
    assert len({x["mode"] for x in r}) == 1 and len(r) == 4, r
    assert all(not x["paused"] and x["err"] is None and x["t"] > 3 for x in r), r
    ts = [x["t"] for x in r]
    assert max(ts) - min(ts) < 0.5, r
