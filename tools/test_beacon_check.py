"""tools/beacon_check.py 시험. 실행: uv run --no-project --python 3.14 --with pytest pytest tools/test_beacon_check.py -q"""
import shutil
import subprocess
import sys
from pathlib import Path

CHECK = Path(__file__).with_name('beacon_check.py')
REPO = Path(__file__).resolve().parent.parent
# .github/workflows/deploy.yml Build dist의 rsync 제외와 같게 둔다(어느 깊이든 / 루트에서만)
EXCLUDE_ANY = {'.git', '.github', '_workspace', '.wrangler', '.fablize'}
EXCLUDE_ROOT = {'tools', 'functions'}
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
    tracked = subprocess.run(['git', '-C', str(REPO), 'ls-files', '*.html'],
                             capture_output=True, text=True, check=True).stdout.split()
    return [p for p in tracked
            if not EXCLUDE_ANY & set(Path(p).parts[:-1]) and Path(p).parts[0] not in EXCLUDE_ROOT]


def test_every_deployed_page_in_repo_has_beacon(tmp_path):
    files = deployed_html()
    for rel in files:
        (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(REPO / rel, tmp_path / rel)
    r = run(tmp_path)
    assert r.returncode == 0, r.stdout
    assert f'({len(files)}개 페이지)' in r.stdout
