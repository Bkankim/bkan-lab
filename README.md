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

## 규칙
- 한번 공유한 주소는 바꾸지 않는다. 옮겨야 하면 `_redirects`로 옛 주소를 새 주소로 보낸다.
- 미리보기 내용을 바꿨으면 이미지에 `?v=N`을 올리고 카카오 캐시를 지운다(`developers.kakao.com/tool/clear/og`).
- 커밋 신원은 noreply(`Bkankim`)로 저장소 로컬 설정에 고정돼 있다.
