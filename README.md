# bkan-lab

`https://lab.bkan.dev` 소스. 만들어 보고 싶은 화면을 실험하는 공개 실험실이다.

## 구조
- `/` 랜딩: 분야 목록
- `/frontend/` 분야 페이지: 실험 목록
- `/frontend/<슬러그>/` 실험 한 개. `index.html` + 카톡·SNS 미리보기용 `og.jpg`

## 새 실험 추가
1. `<분야>/<슬러그>/index.html`을 만든다. `<head>`에 og 태그(title, description, image, url)를 넣는다. og:image는 파일 URL이어야 한다(data URI 불가).
2. 분야 페이지 목록과 `sitemap.xml`에 한 줄 추가한다. 랜딩의 실험 개수도 갱신한다.
3. main에 push하면 Actions가 Cloudflare Pages(`bkan-lab`)로 배포하고 라이브를 검증한다.

## 생산 지표 (`tools/lab-metrics/`, 배포 제외)
실험마다 만드는 데 든 딸깍·AI 작업 시간·모델·API 환산 비용을 에이전트 세션 기록에서 뽑아 `frontend/<슬러그>/metrics.json`에 쓴다.
1. `uv run --script tools/lab-metrics/lab_metrics.py find <키워드>...`로 키워드(슬러그·주제어)가 나오는 후보 세션을 찾는다(Claude Code·Codex, 딸깍 수는 근사치).
2. `... prompts <세션> [--runtime codex]`로 사람 입력을 보고 `items.json`에 구간(`from`/`to`), 주제 밖 입력(`exclude`), 교정(`corrections`), 첫 배포 시각(`first_release_to`)을 적는다.
3. `... build [슬러그]`로 집계한다. `--dry-run`은 파일을 쓰지 않는다.

카드의 "만든 것"·"쓰임" 줄은 `items.json`의 `made`·`used`에서 나온다. 쓰임은 누가 무엇에 실제로 썼는지 한 줄로 적고, 아직 안 쓰였으면 키를 빼서 줄을 숨긴다.

정의: 딸깍은 사람이 보낸 메시지(자동 알림·훅 제외, 60초 안에 거의 같은 문장을 다시 보낸 것은 1회). AI 작업 시간은 본체·서브에이전트가 실제로 일한 구간의 합집합(10분 넘는 공백과 사람 승인 대기는 빼고, 백그라운드 실행은 넣음). 비용은 `pricing.json` 정가로 환산한 값이고, aside exec 같은 외부 실행의 LLM 비용은 들어가지 않는다.

## 규칙
- 한번 공유한 주소는 바꾸지 않는다. 옮겨야 하면 `_redirects`로 옛 주소를 새 주소로 보낸다.
- 미리보기 내용을 바꿨으면 이미지에 `?v=N`을 올리고 카카오 캐시를 지운다(`developers.kakao.com/tool/clear/og`).
- 커밋 신원은 noreply(`Bkankim`)로 저장소 로컬 설정에 고정돼 있다.
