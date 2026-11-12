"""tools/beacon_check.py 시험. 실행: uv run --no-project --python 3.14 --with pytest pytest tools/test_beacon_check.py -q"""
import shutil
import subprocess
import sys
from pathlib import Path

CHECK = Path(__file__).with_name('beacon_check.py')
REPO = Path(__file__).resolve().parent.parent
TOKEN = '0123456789abcdef0123456789abcdef'


def snippet(token=TOKEN):
    return ("<script defer src='https://static.cloudflareinsights.com/beacon.min.js' "
            f"data-cf-beacon='{{\"token\": \"{token}\"}}'></script>")


def page(body_end=None):
    return f'<!doctype html><html><head><title>t</title></head><body><p>x</p>{body_end or ""}</body></html>\n'


def run(path):
    return subprocess.run([sys.executable, str(CHECK), str(path)], capture_output=True, text=True)


def test_page_without_beacon_fails(tmp_path):
    (tmp_path / 'index.html').write_text(page())
    r = run(tmp_path)
    assert r.returncode == 1
    assert 'FAIL' in r.stdout and 'index.html' in r.stdout


def test_pages_with_one_beacon_pass(tmp_path):
    (tmp_path / 'index.html').write_text(page(snippet()))
    (tmp_path / 'sub').mkdir()
    (tmp_path / 'sub' / 'index.html').write_text(page(snippet()))
    r = run(tmp_path)
    assert r.returncode == 0, r.stdout
    assert 'PASS' in r.stdout and '2개 페이지' in r.stdout


def test_page_with_two_beacons_fails(tmp_path):
    (tmp_path / 'index.html').write_text(page(snippet() + snippet()))
    r = run(tmp_path)
    assert r.returncode == 1
    assert 'FAIL' in r.stdout and 'index.html' in r.stdout


def test_pages_with_different_tokens_fail(tmp_path):
    (tmp_path / 'a.html').write_text(page(snippet()))
    (tmp_path / 'b.html').write_text(page(snippet('ffffffffffffffffffffffffffffffff')))
    r = run(tmp_path)
    assert r.returncode == 1
    assert 'FAIL' in r.stdout and 'token' in r.stdout


def test_page_with_empty_token_fails(tmp_path):
    (tmp_path / 'index.html').write_text(page(snippet('')))
    r = run(tmp_path)
    assert r.returncode == 1
    assert 'FAIL' in r.stdout and 'index.html' in r.stdout


def test_escaped_double_quote_beacon_passes(tmp_path):
    # Next.js(React)는 속성을 큰따옴표로 감싸고 안쪽 따옴표를 &quot;로 내보낸다
    tag = ('<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" '
           f'data-cf-beacon="{{&quot;token&quot;: &quot;{TOKEN}&quot;}}"></script>')
    (tmp_path / 'index.html').write_text(page(tag))
    r = run(tmp_path)
    assert r.returncode == 0, r.stdout


def test_beacon_after_body_end_fails(tmp_path):
    (tmp_path / 'index.html').write_text(page() + snippet())
    r = run(tmp_path)
    assert r.returncode == 1
    assert 'FAIL' in r.stdout and 'index.html' in r.stdout


def test_directory_without_html_fails(tmp_path):
    r = run(tmp_path)
    assert r.returncode == 1
    assert 'FAIL' in r.stdout


def test_missing_directory_fails(tmp_path):
    r = run(tmp_path / 'no-such-dist')
    assert r.returncode == 1
    assert 'FAIL' in r.stdout


def deployed_html():
    # 손으로 쓴 페이지는 public/ 아래에만 있다. Next.js가 만드는 페이지는 CI가 산출물(out/)에서 본다
    return subprocess.run(['git', '-C', str(REPO), 'ls-files', 'public/*.html'],
                          capture_output=True, text=True, check=True).stdout.split()


def test_every_static_page_in_repo_has_beacon(tmp_path):
    files = deployed_html()
    for rel in files:
        (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(REPO / rel, tmp_path / rel)
    r = run(tmp_path)
    assert r.returncode == 0, r.stdout
    assert f'({len(files)}개 페이지)' in r.stdout
