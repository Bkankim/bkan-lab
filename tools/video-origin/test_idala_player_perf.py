"""idala-demo 플레이어 최적화 시험(지연 로드·재탐색 억제).

후보(PAGE_URL)를 기준(BASELINE_URL, 기본은 공개판)과 같은 실행 안에서 번갈아 재서
"나빠지지 않았는지"를 본다. Chrome 계열만(느린 회선 흉내에 CDP가 필요하다).

실행: PAGE_URL=<후보> uv run --no-project --python 3.14 --with pytest --with playwright \
      pytest tools/video-origin/test_idala_player_perf.py -q
"""
import os
import statistics

import pytest
from playwright.sync_api import sync_playwright

PAGE_URL = os.environ.get("PAGE_URL", "https://lab.bkan.dev/motion/idala-demo/")
BASELINE_URL = os.environ.get("BASELINE_URL", "https://lab.bkan.dev/motion/idala-demo/")
ROUNDS = int(os.environ.get("PERF_ROUNDS", "3"))
GRID = "() => [...document.querySelectorAll('#grid video')]"


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
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


# B. 처음 화면에서는 아래쪽 전후 비교 클립(c1a~c5b, 10개)을 받지 않는다
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
        const v = [...document.querySelectorAll('#grid video')];
        if (v.every(x => x.currentTime >= 1)) return (performance.now() - t0) / 1000;
        await new Promise(r => setTimeout(r, 50));
      }
      return 99;
    }""")
    ctx.close()
    return t


# C. 지연 로드 때문에 "바로 재생"이 늦어지면 안 된다(페이지를 열자마자 순간 이동해 누르는 최악의 경우)
def test_start_latency_not_worse_than_baseline(browser):
    cand, base = [], []
    for _ in range(ROUNDS):
        base.append(start_latency(browser, BASELINE_URL))
        cand.append(start_latency(browser, PAGE_URL))
    print(f"\n시작 시간 기준 {base} / 후보 {cand}")
    assert max(cand) < 15
    assert statistics.median(cand) <= statistics.median(base) + 0.05, (base, cand)


# C2. 사람처럼 스크롤해 내려가 누르면 기준과 같아야 한다(지연 로드가 미리 준비할 시간이 있다)
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
