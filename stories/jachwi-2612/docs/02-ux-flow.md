# 02 UX 설계 · 매봉역 30분 자취방

- 이 문서가 결정하는 것: 각 과업을 어떤 화면과 데이터로 이루는가
- 입력: 01 기획서 4절(사용자·대상), 5절(과업 T1~T6), 7절(대상 이름)
- 출력 대상: 03 비주얼 디렉션, `data/jachwi-2612.json`, 컴포넌트(`components/jachwi/`)

## 결정 현황

| 절 | 상태 | 비고 |
|---|---|---|
| 1 시나리오 | 확정 | |
| 2 페이지 | 확정 | 한 페이지 |
| 3 데이터 모델 | 확정 | |
| 4 인터랙션 원칙 | 확정 | |
| 5 컴포넌트 리스트 | 잠정 | 조립하며 행이 바뀔 수 있음 |

## 1. 시나리오

| 단계 | 화면(섹션) | 사용자 행동 | 대상 | 결과 |
|---|---|---|---|---|
| 1 | Hero | 태그라인과 3,463→21을 본다 | origin, listing | 결론을 먼저 안다 (T2) |
| 2 | Market | 동별 실거래 월세를 훑는다 | market | 적정가 감각 (T1) |
| 3 | Funnel | 단계별로 빠진 건수와 이유를 본다 | listing | 왜 21개인지 안다 (T2) |
| 4 | Traps | 함정 사례 4개의 건물 단면을 본다 | trap | 싼 방을 의심하는 눈 (T3) |
| 5 | Cost | 월세·관리비·연봉을 바꿔 본다 | benefit | 실제 월 부담 (T4) |
| 6 | Shortlist | 판정을 골라 후보를 보고 링크를 연다 | listing, grade | 문의할 곳 (T5) |
| 7 | Plan | 12월·2027 할 일을 본다 | step | 일정 (T6) |
| 8 | Sources | 출처와 수집 범위 한계를 본다 | - | 근거 (가치: 근거) |

## 2. 페이지

### 2.1 페이지 리스트
- `/frontend/jachwi-2612/` 하나. noindex, sitemap false, 목록 카드 없음.

### 2.2 계층 트리
```
JachwiPage
├ Hero
├ MarketSection ── MarketBar ×10
├ FunnelSection ── FunnelStep ×5
├ TrapSection ── TrapCard ×4 ── FloorStack
├ CostSection ── CostCalculator
├ ShortlistSection ── GradeFilter, ListingRow ×n ── FloorStack(mini)
├ PlanSection ── StepList ×2
└ SourceNote
```

## 3. 데이터 모델

| 이름 | 식별자 | 주요 속성 | 영속성 |
|---|---|---|---|
| origin | 고정 1 | 주소, 역, 좌표 | data JSON |
| market | dong | 동, 유형(다가구·빌라·오피스텔), 표본 수, 환산 월세 중앙값·p25·p75 | data JSON (국토부 2026-08~10) |
| listing | src+id | 출처, 동, 지번, 보증금, 월세, 관리비, 실부담, 면적, 층, 판정, 건물 요약, 층 목록, 출퇴근 분(잰 것만), URL, 중개사무소(상호·대표번호, ○·△만), 좌표(경도·위도, 네이버 길찾기용) | data JSON |
| grade | ○ △ ? ⚠ ✕ | 라벨, 뜻, 건수 | data JSON |
| trap | key | 제목, 가격, 겉보기, 실제, 근거, 건물 층 목록, 매물 층 | data JSON |
| benefit | key | 이름, 금액 규칙, 조건, 신청 시기, 출처 URL | data JSON + 계산 함수 |
| step | key | 시기, 할 일, 이유 | data JSON |

### 3.2 이름 사전
- 실부담 = 월세 + 관리비 + (보증금 - 1000) × 6% / 12 (만원). 공과금은 따로 범위로.
- 판정 ○ 정상 주택·그 층 주거 / △ 주택이나 층 모호·지하 주거, 또는 업무시설 안 오피스텔(주거용 사용·전입 확인 필요) / ? 대장 확인 필요(지번 없음·다른 건물일 수 있음) / ⚠ 고시원 / ✕ 비주거 층·대장에 없는 층·옥탑.
- v2(11-19, final-review): 업무시설 오피스텔을 ○에서 △로, ?의 뜻을 '대장 확인 필요'로 넓힘.
- v3(11-19, BK 지시): ○·△ 후보는 매물 상세 설명까지 읽어 전입 불가·반지하·위반건축물(네이버 isIllegalBuilding, 직방 nonCompliantBuilding)·용도 사무실을 ✕로 뺀다. 상세에 '전입 가능'이 적힌 매물은 행에 표시한다.

## 4. 인터랙션 원칙

1. 숫자를 먼저, 설명은 다음 (가치: 걸러냄). 섹션 첫 줄은 수치 한 줄.
2. 판정은 언제나 건물 단면으로 보여 준다 (가치: 근거). 글로만 "근생"이라 쓰지 않는다.
3. 계산기는 입력 즉시 다시 계산하고 기본값은 BK 조건(1000/60+10, 연봉 4,000만원)이다 (가치: 실제 부담).
4. 필터는 판정 칩 하나뿐이다. 정렬은 실부담 오름차순으로 고정한다.
5. 터치 기기에서는 hover 대신 행 전체가 링크다. 400px에서 표는 카드로 바뀐다.

## 5. 컴포넌트 리스트

| 컴포넌트 | 섹션 | 구분 | 카테고리 | 비고 |
|---|---|---|---|---|
| JachwiPage | 페이지 | 신규 | layout | 섹션 순서 고정, ScopedCssBaseline |
| Hero | Hero | 신규 | layout | 태그라인·결론 수치 (원칙 1) |
| MarketBar | Market | 신규 | data | p25~p75 범위 막대 + 중앙값 점 |
| FunnelStep | Funnel | 신규 | data | 건수 막대 폭 = 비율, 빠진 이유 (원칙 1) |
| FloorStack | Traps, Shortlist | 신규 | data | 건물 층을 용도 색으로 쌓고 매물 층 표시 (원칙 2) |
| TrapCard | Traps | 신규 | content | 겉보기/실제 두 줄 + FloorStack |
| CostCalculator | Cost | 신규 | input | MUI Slider·TextField, 결과 분해 막대 (원칙 3) |
| GradeFilter | Shortlist | 신규 | input | MUI ToggleButtonGroup (원칙 4) |
| ListingRow | Shortlist | 신규 | data | 가격·실부담·층·출퇴근·링크·중개사무소 전화(tel:)·네이버 지도 대중교통 길찾기(매물→회사), 400px 카드 (원칙 5). v2(11-19): 출퇴근 시간을 BK가 바로 다시 볼 수 있게 길찾기 링크 추가 |
| StepList | Plan | 신규 | content | 시기 + 할 일 |
| SourceNote | Sources | 신규 | content | 출처·수집일·한계 |

## 6. 다음 문서로 넘기는 것
- 섹션 8개 순서, FloorStack의 용도 분류(주거·근생·고시원·지하·없음), 판정 다섯 개.
