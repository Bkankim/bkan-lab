"""놓치지 않는 판타지아(frontend/top-cross) 배포 전 캐시 검사.

라이브는 앱 파일·사진을 오래 캐시하고 서비스 워커는 캐시를 먼저 쓰므로, 아래를 어기면 고친 파일이 사용자에게 안 간다.
- app.js·app.css를 바꾸면 index.html과 sw.js의 ?v= 숫자를 올린다.
- 서비스 워커가 미리 담는 파일(app.js·app.css·manifest·아이콘)을 바꾸면 sw.js VERSION을 올린다.
- 이미 있는 사진(shots/*.webp)은 내용을 바꾸지 않는다. 고친 사진은 새 파일 이름으로 넣는다.

사용: python3 tools/topx_cache_check.py <기준 커밋> [<대상 커밋, 기본 HEAD>]
"""
import re
import subprocess
import sys

APP = 'frontend/top-cross/'
PRECACHED = ('app.js', 'app.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png')


def git(*args):
    return subprocess.run(['git', *args], check=True, capture_output=True, text=True).stdout


def show(rev, path):
    try:
        return git('show', f'{rev}:{path}')
    except subprocess.CalledProcessError:
        return ''


def main():
    base = sys.argv[1]
    head = sys.argv[2] if len(sys.argv) > 2 else 'HEAD'
    changes = [line.split('\t') for line in git('diff', '--name-status', '--no-renames', base, head, '--', APP).splitlines()]
    changed = {p[len(APP):]: s for s, p in changes}
    errors = []

    def ver(rev, path, pattern):
        m = re.search(pattern, show(rev, APP + path))
        return m.group(1) if m else None

    if {'app.js', 'app.css'} & changed.keys():
        for path in ('index.html', 'sw.js'):
            for ref in ('app.js', 'app.css'):
                pat = re.escape(ref) + r'\?v=(\d+)'
                if ver(base, path, pat) == ver(head, path, pat):
                    errors.append(f'{path}의 {ref}?v= 숫자를 올리세요(app.js·app.css가 바뀜)')
    if set(PRECACHED) & changed.keys():
        pat = r"VERSION = '([^']+)'"
        if ver(base, 'sw.js', pat) == ver(head, 'sw.js', pat):
            errors.append('sw.js VERSION을 올리세요(서비스 워커가 미리 담는 파일이 바뀜)')
    for path, status in changed.items():
        if path.startswith('shots/') and status == 'M':
            errors.append(f'{path}: 이미 있는 사진의 내용을 바꿨습니다. 새 파일 이름으로 넣으세요(캐시된 옛 사진이 계속 보임)')

    for e in errors:
        print('FAIL ', e)
    if errors:
        sys.exit(1)
    print(f'PASS  top-cross 캐시 검사 ({len(changed)}개 파일 변경)')


main()
