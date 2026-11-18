# 03 비주얼 디렉션 · 매봉역 30분 자취방

- 이 문서가 결정하는 것: 정체성과 화면이 어떻게 보이는가
- 입력: 01 기획서 3절(가치), 02 UX 2절(페이지), 4절(원칙), 6절(넘기는 것)
- 출력 대상: `components/jachwi/theme.ts`(MUI 테마), 컴포넌트

## 결정 현황

| 절 | 상태 | 비고 |
|---|---|---|
| 1 무드 | 확정 | |
| 2 레이아웃 | 확정 | |
| 3 토큰 | 확정 | |
| 4 에셋 | 확정 | 사진·생성 이미지 없음 |
| 5 변경 토큰 요약 | 확정 | |

## 1. 무드

- 키워드: 도면, 감정서, 건축물대장.
- 태도: (1) 부동산 광고가 아니라 감정평가서처럼 보인다. (2) 색은 장식이 아니라 용도 분류다. (3) 숫자가 가장 크다.
- 하지 않는 것: 집 사진, 그라데이션 히어로, 이모지 아이콘, 둥근 알약 버튼 남발, 보라·파랑 그라데이션, "AI가 찾은 최고의 방" 같은 문구.

## 2. 레이아웃 전략

- 공간 모델: 고정 폭 한 단(본문 최대 1080px, 좌우 여백 최소 16px). 섹션 구분은 선(1px 괘선)과 섹션 번호(§1~§8).
- 각 섹션 머리: 왼쪽 번호·제목, 오른쪽 핵심 수치 한 줄. 1024px 이상에서 머리 2열(1:2), 아래는 1열.
- Market: 동 10줄의 가로 범위 막대, 축 0~140만원 공통.
- Traps: 1024px 이상 2×2 그리드, 아래는 1열.
- Shortlist: 1024px 이상 표, 640px 아래 카드.

## 3. 토큰 방향

### 3.1 색

| 역할 | 이름 | 값 | MUI 토큰 | 근거 |
|---|---|---|---|---|
| 바탕 | paper | #F6F4EE | palette.background.default | 감정서 종이 (근거) |
| 표면 | sheet | #FFFFFF | palette.background.paper | |
| 글자 | ink | #1C1B19 | palette.text.primary | |
| 보조 글자 | ink-soft | #5F5B53 | palette.text.secondary | |
| 괘선 | rule | #D9D4C7 | palette.divider | 도면 괘선 |
| 강조 | stamp | #B3261E | palette.primary.main | 도장 빨강 = 판정·걸러냄 (걸러냄) |
| 용도: 주거 | use-home | #2F6B4F | palette.use.home | 정상 |
| 용도: 근생 | use-shop | #C08A2B | palette.use.shop | 주의 |
| 용도: 고시원 | use-goshi | #C2552B | palette.use.goshi | 경고 |
| 용도: 지하 | use-under | #6B7280 | palette.use.under | 반지하 |
| 용도: 대장에 없음 | use-none | 빗금 #B3261E | palette.use.none | 위반 의심 |

어두운 테마: paper #15140F, sheet #1E1C17, ink #EDE9DF, ink-soft #A8A294, rule #3A372F, 용도색은 명도만 +10%.

### 3.2 타이포

| 역할 | 서체 | 방향 | MUI variant |
|---|---|---|---|
| 제목 | Hahmlet 700 | lab 공용 세리프, 감정서 제목 | h1~h3 |
| 본문 | IBM Plex Sans KR 400/500 | lab 공용 | body1, body2 |
| 숫자 | IBM Plex Sans KR 500, tabular-nums | 표 정렬 | 사용자 정의 `num` |
| 라벨 | IBM Plex Sans KR 500, 12px, 자간 0.04em | 도면 범례 | overline |

### 3.3 형태·표면·모션

| 축 | 방향 | 값 |
|---|---|---|
| 모서리 | 거의 각지게 | shape.borderRadius 2 |
| 그림자 | 없음, 괘선으로 구분 | elevation 0 |
| 모션 | 숫자·막대만 짧게 | 200ms ease-out, prefers-reduced-motion이면 없음 |

## 4. 이미지·에셋 방향

- 히어로·og: 사진 없음. FloorStack 단면 다섯 개를 나란히 세운 도식이 대표 이미지다.
  - FORMAT: 1200×630, 종이 바탕
  - LOOK: 도면 괘선, 용도 색면
  - SUBJECT: 3,463 → 21 숫자와 건물 단면
  - 하지 않는 것: 집 사진, 지도 스크린샷, 사람

## 5. 변경 토큰 요약 (MUI 기본값 → 이 페이지)

| 토큰 경로 | 현재값(MUI 기본) | 변경값 | 적용 대상 |
|---|---|---|---|
| palette.background.default | #fff | #F6F4EE | 페이지 |
| palette.primary.main | #1976d2 | #B3261E | 칩·강조 |
| palette.text.primary | rgba(0,0,0,.87) | #1C1B19 | 본문 |
| palette.divider | rgba(0,0,0,.12) | #D9D4C7 | 괘선 |
| shape.borderRadius | 4 | 2 | 전부 |
| typography.fontFamily | Roboto | IBM Plex Sans KR | 본문 |
| typography.h1~h3.fontFamily | Roboto | Hahmlet | 제목 |
| components.MuiPaper.defaultProps.elevation | 1 | 0 | 표면 |
| components.MuiToggleButton 선택색 | primary 8% | stamp 12% | GradeFilter |

## 6. 다음으로 넘기는 것
- `theme.ts`는 5절 표를 그대로 넣는다. 용도 색은 `palette.use.*` 확장으로 둔다.
