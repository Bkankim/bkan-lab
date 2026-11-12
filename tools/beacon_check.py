"""배포 산출물의 모든 HTML에 Cloudflare Web Analytics beacon이 제대로 들어 있는지 검사.

lab.bkan.dev는 DNS only라 Cloudflare가 beacon을 자동으로 넣지 못한다. 그래서 페이지마다 직접 넣고,
새 페이지가 beacon 없이 나가지 않게 배포 전에 이 검사를 돌린다.

사용: python3 tools/beacon_check.py <배포 산출물 디렉터리>   (CI에서는 /tmp/dist)
리포 루트에는 돌리지 않는다(_workspace 등 배포 안 하는 HTML이 섞여 있다).
"""
import re
import sys
from html import unescape
from pathlib import Path

BEACON = re.compile(r'<script[^>]*static\.cloudflareinsights\.com/beacon\.min\.js[^>]*>')
# 손으로 쓴 페이지는 '{"token": "…"}', Next.js가 만든 페이지는 "{&quot;token&quot;: …}" 꼴이다(unescape 뒤 비교)
TOKEN = re.compile(r'''data-cf-beacon=(['"])\{"token": "([^"]*)"\}\1''')


def main():
    root = Path(sys.argv[1])
    errors = []
    tokens = {}
    pages = sorted(root.rglob('*.html')) if root.is_dir() else []
    if not pages:
        print(f'FAIL  {root}: 검사할 HTML이 없습니다(경로를 확인하세요)')
        sys.exit(1)
    for path in pages:
        rel = path.relative_to(root)
        html = path.read_text(encoding='utf-8')
        tags = BEACON.findall(html)
        if not tags:
            errors.append(f'{rel}: beacon script가 없습니다')
            continue
        if len(tags) > 1:
            errors.append(f'{rel}: beacon script가 {len(tags)}개입니다(한 페이지에 하나만)')
            continue
        body_end = html.rfind('</body>')
        if body_end == -1 or html.find(tags[0]) > body_end:
            errors.append(f'{rel}: beacon script가 </body> 앞에 있어야 합니다')
            continue
        m = TOKEN.search(unescape(tags[0]))
        if not m or not m.group(2):
            errors.append(f'{rel}: data-cf-beacon token이 비었거나 형식이 다릅니다')
            continue
        tokens.setdefault(m.group(2), []).append(str(rel))
    if len(tokens) > 1:
        detail = ', '.join(f'{t[:8]}…({len(files)}개, 예: {files[0]})' for t, files in tokens.items())
        errors.append(f'페이지마다 token이 다릅니다: {detail}')
    for e in errors:
        print('FAIL ', e)
    if errors:
        sys.exit(1)
    print(f'PASS  web analytics beacon ({len(pages)}개 페이지)')


main()
