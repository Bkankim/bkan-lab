/* portfolio.bkan.dev js/projects.js 의 작업 카드 데이터 스냅샷 (bkan-portfolio a2fe529). 원본이 바뀌면 다시 뜬다. */
window.PROJECTS = [
    {
        id: 'hindsight-crew',
        category: 'agent',
        status: 'active',
        resultIcon: 'fa-brain',
        tags: ['Hindsight', 'MCP 게이트웨이', 'Docker · PostgreSQL', '비공개'],
        links: [
            { kind: 'blog', href: 'https://blog.bkan.dev/hindsight-crew', label: { ko: '개발일지' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/silent-failure-is-not-success', label: { ko: '18건 거짓 성공' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/recall-at-the-chokepoint', label: { ko: '기억을 길목에' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/duplicate-recalls-were-one-loop', label: { ko: '캐시를 안 만든 판정' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/tag-rules-at-write-time-two-weeks', label: { ko: '저장 시점 태그 규칙' } },
            { kind: 'github', href: 'https://github.com/vectorize-io/hindsight/issues/5487', label: { ko: '업스트림 제보' } }
        ],
        ko: {
            title: 'Hindsight-Crew',
            subtitle: '에이전트 메모리 서버 · 개인 · 2026.07 - 현재 · 비공개',
            summary: '팀 메모리를 권한과 규칙으로 통제하는 게이트웨이 서버',
            desc: '실무에서 쓴 Hindsight 팀 메모리를 명령 하나로 다시 세울 수 있게 만든 MCP 게이트웨이입니다. Hindsight 기본 인증은 공유 키 하나라 누가 어느 기억에 쓰는지 가를 수 없어서, 그 앞에 권한과 규칙을 강제하는 서버를 세웠습니다.',
            bullets: [
                '기억 조회 권한은 요청에 담긴 이름이 아닌 접속 토큰으로만 판정 (6주 팀원 배포 직전의 권한 분리에서 출발)',
                '저장 성공 여부는 에이전트 보고가 아닌 서버 기록으로만 판정, "막혔다" 기록이 예전 "됐다" 기록과 부딪히면 거절 대신 경고',
                '같은 유형의 오판이 나는 길목에서 예전 기억을 자동으로 꺼내 붙이고, 같은 실수가 두 번 기록되면 규칙 초안을 써서 등록은 사람이 승인',
                '60초 안에 반복된 같은 조회를 출처별로 갈라 대부분이 한 세션의 반복임을 확인하고, 결과 캐시는 만들지 않음'
            ],
            result: 'Claude Code·Codex 등 여러 에이전트가 같은 기억을 사용, 찾은 업스트림 버그는 제보해 수정됨'
        }
    },
    {
        id: 'agent-ops',
        category: 'agent',
        status: 'active',
        resultIcon: 'fa-diagram-project',
        tags: ['Claude Code 스킬', 'Codex', 'Git worktree', '비공개'],
        links: [
            { kind: 'blog', href: 'https://blog.bkan.dev/review-skills', label: { ko: '검수·지휘 스킬 개발일지' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/agent-ops', label: { ko: '설정 정본 개발일지' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/bk-hq', label: { ko: '1기 BK-HQ' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/more-reviewers-same-verdict', label: { ko: '리뷰어 수 실험' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/agents-wrote-done', label: { ko: "에이전트가 적은 '완료'" } },
            { kind: 'blog', href: 'https://blog.bkan.dev/issue-convention-without-a-hook', label: { ko: '훅 없는 이슈 규약' } }
        ],
        ko: {
            title: '에이전트 작업 운영 체계',
            subtitle: '개인 · 2026.07 - 현재 · 비공개',
            summary: '이슈를 병렬 워커에 맡겨 계획 리뷰와 결과 검수를 거쳐 머지까지 가는 체계',
            desc: '이슈를 병렬 워커에 맡겨 계획 리뷰와 결과 검수를 거쳐 머지까지 가는 체계와, 여러 에이전트 런타임의 설정 정본입니다. 역할별 에이전트 팀으로 만든 1기(BK-HQ)는 일부 역할만 실제로 일해서 접고 다시 짰습니다.',
            bullets: [
                '계획 리뷰: 새 컨텍스트 리뷰어와 다른 회사 모델(Codex)이 서로 모르게 검토. 리뷰어 하나가 결함을 찾고도 통과시킨 일이 4번 중 4번이라, 판정은 재현된 지적만으로 스크립트가 냄',
                '결과 검수: 명세 대조 → 버그 → 보안 순서로 독립 리뷰어가 보고, 검증을 거친 결함만 수정',
                '여러 에이전트 런타임의 지침·훅·스킬·MCP 설정을 한 저장소에 두고 연결해, 한 곳만 고치면 모두 적용',
                '사람 승인은 시작할 때 1회, 머지 뒤에 도착해 반영되지 않던 외부 리뷰는 머지 전 교차 리뷰로 당김'
            ],
            result: '워커가 일하기 전에 계획 리뷰가 낸 판정 50건 중, 그대로 통과한 계획은 0건'
        }
    },
    {
        id: 'smartthink',
        category: 'agent',
        status: 'archived',
        resultIcon: 'fa-chess-knight',
        tags: ['Claude Code 스킬', '멘탈 모델', 'Cynefin', 'MIT'],
        links: [
            { kind: 'github', href: 'https://github.com/Bkankim/smartthink', label: 'GitHub' },
            { kind: 'blog', href: 'https://blog.bkan.dev/smartthink', label: { ko: '개발일지' } }
        ],
        ko: {
            title: 'SmartThink',
            subtitle: 'Claude Code 스킬 · 오픈소스 · 2026.02 - 10',
            summary: '일을 맡기기 전에 멘탈 모델 원문을 골라 세션에 싣는 Claude Code 스킬',
            desc: '전략·의사결정처럼 머리를 써야 하는 일이 오면, 그 일에 맞는 멘탈 모델 레퍼런스를 골라 원문 그대로 세션에 싣고 턴을 끝냅니다. 일은 그렇게 무장한 세션에 직접 시킵니다.',
            bullets: [
                '처음엔 레퍼런스를 읽고 답까지 내는 분석 명령이었다가, 9월 v3에서 답 대신 답할 세션을 만드는 쪽으로 바꿈',
                '레퍼런스는 요약하지 않고 원문 그대로 싣고, 전부 넣지 않고 Cynefin 진단으로 후보를 고른 뒤 사용자가 승인해야 읽음',
                '직접 쓰다가 드러난 결함 셋과 남은 일을 개발일지에 공개'
            ],
            result: '2~4월 PC에서 39일 동안 쓰다가, 맥으로 옮긴 v3는 실제 작업에 쓴 일이 적어 v3.0.2에서 보관'
        }
    },
    {
        id: 'cct',
        category: 'agent',
        status: 'active',
        resultIcon: 'fa-wallet',
        tags: ['Bash · Zsh', 'Claude Code', 'macOS · Linux · WSL2'],
        links: [
            { kind: 'github', href: 'https://github.com/Bkankim/cct', label: 'GitHub' },
            { kind: 'blog', href: 'https://blog.bkan.dev/cct', label: { ko: '개발일지' } }
        ],
        ko: {
            title: 'cct',
            subtitle: '셸 도구 · 오픈소스 · 2026.06 - 현재',
            summary: '명령 한 번으로 Claude 계정을 바꿔 쓰는 터미널 스위치와 사용량 대시보드',
            desc: 'Claude 계정을 여럿 쓰는데 바꿀 때마다 OAuth 로그아웃·로그인을 거쳐야 했고, 그마저 할 수 없는 상황도 있었습니다. 그래서 `claude setup-token`으로 받은 장기 토큰을 로컬 지갑에 두고 `cct <라벨>` 한 번으로 계정을 바꿔 Claude Code를 실행하게 만들었고, 오픈소스로 공개하면서 편의 기능과 사용량 대시보드를 더했습니다.',
            bullets: [
                '프록시나 자동 라우터가 아니라, 어떤 계정을 쓸지는 항상 사용자가 고르게 함',
                '지갑을 옮기면 새 환경에서 계정마다 브라우저 로그인을 반복하지 않음',
                '재설치 때 기존 지갑·활성 라벨·잠금 파일을 덮어쓰지 않게 설치 스크립트 설계, 목록에는 토큰 값을 표시하지 않음',
                '사용량을 보려는 호출이 사용량을 쓰던 문제를 고쳐, 대화 중인 계정의 사용률을 호출 없이 읽는 로컬 대시보드'
            ],
            result: '9월 말부터 거의 매일 쓰는 Claude Code 실행 경로, 공개 리포(MIT)로 운영 중'
        }
    },
    {
        id: 'ent-team-memory',
        category: 'work',
        status: 'completed',
        resultIcon: 'fa-users',
        tags: ['Hindsight', '권한 게이트웨이', 'Claude Code 스킬'],
        links: [
            { kind: 'case', href: 'for-teams/memory-isolation.html', label: { ko: '케이스 스터디' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/denominator-not-the-search', label: { ko: '0.45 채점 기록' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/undersampled-is-not-a-result', label: { ko: '임베딩 비교 판정' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/team-tier-memory-was-lost', label: { ko: '팀 단계에서 서버를 잃다' } }
        ],
        ko: {
            title: '팀 메모리와 일일보고 자동화',
            subtitle: '기업 AI · 프리랜서 · 2026.05 - 06',
            summary: '개인용 에이전트 메모리를 팀 메모리로 넓혀 일일 업무보고를 자동화',
            desc: '팀마다 업무 에이전트를 두자는 대표님의 요청에, 개인 업무용으로 시험하던 Hindsight를 팀 메모리로 넓혀 일일 업무보고부터 자동화했습니다.',
            bullets: [
                '약 1주 직접 시험하다 전체 기록이 노출되는 문제를 찾아, 권한 게이트웨이로 본인 기록만 보이게 분리한 뒤 배포',
                '일일보고 스킬이 그날 기록에서 임원 보고에 맞지 않는 항목(도구 설치·개인 설정 등)을 걸러 초안 작성',
                '기록 211건에서 카테고리 질의 재현율 15.6% → 일일보고 조회를 날짜 기준으로 교체 (하루치 41건, 0.10초, 누락 0)',
                '자동 보고서 1편을 직접 채점해 재현율 0.45. 빠진 22건 중 21건은 임원 보고에서 일부러 빼는 항목, 실제 누락 1건은 주간보고에 반영'
            ],
            result: '팀원 4명에게 배포, 일일 보고 작성 시간 약 30분 → 5분 이내'
        }
    },
    {
        id: 'ent-team-ops',
        category: 'work',
        status: 'completed',
        resultIcon: 'fa-people-arrows',
        tags: ['결정 기록', '보고 규칙', '인수인계'],
        links: [
            { kind: 'blog', href: 'https://blog.bkan.dev/four-rules-for-reporting-ai-output', label: { ko: '보고서 AI 표기 규칙' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/rulemaker-is-the-first-violator', label: { ko: '셀프 머지 금지의 첫 예외' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/mtime-as-the-record', label: { ko: '서버를 잃은 오후' } }
        ],
        ko: {
            title: '팀 운영과 인계',
            subtitle: '기업 AI · 프리랜서 · 2026.05 - 06',
            summary: '여러 AI 도구가 함께 일하는 3인 개발팀의 저장소·결정 기록·인수인계',
            desc: '여러 AI 도구와 에이전트 세션이 한 저장소에서 함께 일하는 개발팀에서, 기술 리드로 개발 저장소 관리와 결정 기록을 맡았습니다.',
            bullets: [
                '개발팀 저장소·브랜치 규칙 수립, 기술·비기술 결정 기록 체계 운영 (회의 결정 매일 기록)',
                '보고서 AI 사용 표기 규칙: AI로 쓰거나 검수한 부분은 그대로 표기, 직접 호출해 보기 전에는 "작동" 보고 금지',
                'AI 에이전트 세션별로 작업 공간을 나누고 지정 파일만 커밋하게 함. 다른 AI 코딩 도구가 실행한 파괴적 작업을 전수 점검해 되돌릴 1건만 원복',
                '남은 기록과 파일 수정 시각으로 업무 타임라인을 복원해 인수인계 범위 확정, 넘기기 전 비밀번호·토큰 검사'
            ],
            result: '팀 메모리 서버가 회수된 뒤 2시간 안에 로컬 사본으로 작업 복구, 개발팀용·비개발자 팀장용 인수인계서 작성'
        }
    },
    {
        id: 'ent-crm',
        category: 'work',
        status: 'completed',
        resultIcon: 'fa-database',
        tags: ['PostgreSQL', 'ETL', 'goose'],
        links: [
            { kind: 'blog', href: 'https://blog.bkan.dev/rows-are-not-calls', label: { ko: '통화 기록 중복 판정' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/tiebreaker-was-not-technical', label: { ko: '마이그레이션 도구 선정' } }
        ],
        ko: {
            title: '고객·통화 데이터 설계',
            subtitle: '기업 AI · 프리랜서 · 2026.05 - 06',
            summary: '레거시 CRM과 통화 기록을 합친 고객·통화 DB 설계와 이관 경로',
            desc: '레거시 CRM과 통화 SaaS 기록을 합쳐 통화 품질로 영업사원을 평가하는 새 CRM 모듈입니다. 고객·통화 데이터 트랙을 기획부터 개발까지 맡았습니다.',
            bullets: [
                '고객·통화를 통합한 PostgreSQL DB 27테이블 설계, 레거시 CRM 고객 기록 약 9.5만 건의 이관 경로 마련',
                '자동응답 안내와 상담원 연결이 한 통화에 두 줄로 남는 구조를 확인하고 발신번호·인입 시각(±120초) 기준으로 중복 제거',
                '마이그레이션 도구는 유료 등급·트랜잭션 버그·롤포워드 한계로 후보를 거르고, 마지막 둘은 조직 상황으로 골라 goose 채택',
                '스키마 설계는 다른 회사 모델(Codex)에 독립 검토를 맡겨 반영, 녹취 누락 의심 구간(두 달 이상)은 인수인계 긴급 과제로 등록'
            ],
            result: '통화 수가 약 40% 부풀려진 원인을 찾아, 평가 분모가 틀리지 않도록 적재 단계에 중복 제거 규칙 반영'
        }
    },
    {
        id: 'ent-onprem-llm',
        category: 'work',
        status: 'completed',
        resultIcon: 'fa-server',
        tags: ['맥 서버 ×15', 'Tailscale', 'GGUF / MLX'],
        links: [
            { kind: 'case', href: 'for-teams/onprem-llm.html', label: { ko: '케이스 스터디' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/cutover-closed-without-after-numbers', label: { ko: '야간 교체 기록' } }
        ],
        ko: {
            title: '사내 로컬 LLM 장비와 네트워크',
            subtitle: '기업 AI · 프리랜서 · 2026.05 - 06',
            summary: '맥 서버 15대 독립망과 모델 배정, 사무실 네트워크 야간 교체',
            desc: '사내 로컬 LLM을 맥 서버로 돌릴 수 있는 범위를 판단하고, 서버를 받을 사무실 네트워크를 바꿨습니다.',
            bullets: [
                '서버 15대를 Tailscale 독립망으로 연결하고 서버별 모델·역할 배정',
                '메모리 한도로 최대 모델 배치안 기각, 비상업 라이선스 모델은 고객 응대용에서 제외, 서버별 권장 컨텍스트 상한(64k) 명시',
                '네트워크 교체 점검표·되돌리기 경로를 미리 준비, 측정 못 한 사후 수치는 그대로 적고 완료 판정을 낮춰 보고'
            ],
            result: '맥 서버 15대 독립망과 모델 배정표, 사무실 네트워크 장비 야간 교체 3.5시간 내 완료 (개발팀 공동 작업 지휘)'
        }
    },
    {
        id: 'ent-doc-pipeline',
        category: 'work',
        status: 'completed',
        resultIcon: 'fa-file-lines',
        tags: ['Python', 'OOXML (ECMA-376)', 'pandoc', 'MinerU VLM', 'typst'],
        links: [
            { kind: 'case', href: 'for-teams/doc-pipeline.html', label: { ko: '케이스 스터디' } }
        ],
        ko: {
            title: '한국어 문서 파이프라인',
            subtitle: 'DOCX 변경추적 라이브러리 · 기업 AI · 프리랜서',
            summary: '변경추적이 있는 보고 문서를 LLM이 읽게 바꾸는 라이브러리와 스킬',
            desc: '임원 보고가 HWP/DOCX/PDF로 돌아가는데, 변경추적이 있는 문서를 LLM 파이프라인에 태울 도구가 없었습니다.',
            bullets: [
                'DOCX 변경추적·코멘트 순수 XML 라이브러리, LibreOffice 의존 제거. pandoc round-trip을 TDD 규칙으로',
                '스캔 한국어 PDF는 MinerU VLM으로 읽고 typst로 다시 렌더해 검증',
                'Claude Code 스킬로 패키징해 대표님 PC의 Claude 데스크톱에도 설치'
            ],
            result: '동일 과업 A/B 파일럿에서 67초 → 31초, 도구 호출 절반'
        }
    },
    {
        id: 'ashd',
        category: 'project',
        status: 'archived',
        resultIcon: 'fa-receipt',
        tags: ['Next.js', 'Supabase', 'Google Vision OCR', 'Eval Gate (F1)'],
        links: [
            { kind: 'external', href: 'https://ashd.bkan.dev', label: 'ashd.bkan.dev' },
            { kind: 'github', href: 'https://github.com/Bkankim/ashd-v2', label: 'GitHub' },
            { kind: 'blog', href: 'https://blog.bkan.dev/ashd', label: { ko: '개발일지' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/landing-names-the-product-first', label: { ko: '랜딩 문구 규칙' } }
        ],
        ko: {
            title: 'ASHD',
            subtitle: '영수증 OCR+LLM 추출 서비스 · 2026.02 - 07',
            summary: '영수증 사진에서 구매 정보를 뽑아 환불·보증 기한을 알려 주는 웹 서비스',
            desc: '구매 뒤 1~2년 동안 유효한 보증·환불 기한을 챙겨 주는 도구가 없어서, 영수증·보증서 사진에서 구매 정보를 OCR과 LLM으로 뽑아 기한을 알려 주는 서비스를 만들었습니다.',
            bullets: [
                '필드별 F1 평가를 CI에 걸어, 시드 정답셋 기준점 아래로 떨어지는 변경은 머지 차단',
                'KORIE 314예제에서 구매일 F1 89% → 99% (CI 게이트와 별도 측정)',
                '랜딩 첫 화면은 제품 범주부터 말하고, 서술은 스키마와 코드에 있는 것만 쓰도록 문구를 고침'
            ],
            result: '라이브 배포 후 과금 전 중단, 공개 스냅샷'
        }
    },
    {
        id: 'ourfolio',
        category: 'project',
        status: 'archived',
        resultIcon: 'fa-id-card',
        tags: ['Next.js', 'Neon · Drizzle', 'Cloudflare R2', 'Sentry'],
        links: [
            { kind: 'external', href: 'https://ourfolio.bkan.dev/demo', label: { ko: '라이브 데모' } },
            { kind: 'github', href: 'https://github.com/Bkankim/project-ourfolio', label: 'GitHub' },
            { kind: 'blog', href: 'https://blog.bkan.dev/landing-names-the-product-first', label: { ko: '랜딩 문구 규칙' } }
        ],
        ko: {
            title: 'OurFolio',
            subtitle: '증거 기반 포트폴리오 빌더 · 2026.03 - 09',
            summary: '프로필과 프로젝트를 올리면 공개 페이지가 생기는 포트폴리오 빌더',
            desc: 'SaaS를 처음부터 만들고 수익화까지 붙여 보려고 만든 포트폴리오 빌더입니다. 프로필과 프로젝트를 올리면 공개 페이지가 생기고, 방문자 문의와 조회 통계를 모아 줍니다.',
            bullets: [
                '스키마 전환을 확장·축소 두 단계 마이그레이션으로 나눠 라이브 DB에서 무중단 배포',
                '에러 트래킹으로 나가는 이메일·토큰을 전송 전에 지우고, 그 규칙을 테스트로 강제',
                '한·영 번역 키가 서로 맞는지 테스트로 강제'
            ],
            result: 'v1 완성 후 수익화를 접고 공개 쇼케이스로 운영'
        }
    },
    {
        id: 'bluepy',
        category: 'project',
        status: 'archived',
        resultIcon: 'fa-shield-halved',
        tags: ['Python', 'AsyncSSH', 'MIT'],
        links: [
            { kind: 'github', href: 'https://github.com/Bkankim/Bluepy', label: 'GitHub' },
            { kind: 'blog', href: 'https://blog.bkan.dev/bluepy', label: { ko: '개발일지' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/closing-means-deleting-false-claims', label: { ko: '검사기를 지우고 닫음' } }
        ],
        ko: {
            title: 'BluePy',
            subtitle: '서버 보안 점검 CLI · 오픈소스 · 2025.10 - 2026.06',
            summary: 'KISA 기준 서버 보안 점검을 SSH로 돌려 항목별 판정을 내는 CLI',
            desc: 'KISA 기준 보안 점검을 SSH로 원격 실행해 항목별 PASS·FAIL·MANUAL로 보고하는 도구를 다시 설계했습니다.',
            bullets: [
                '무조건 PASS를 내던 기존 검사기는 빼고, 실제 명령 출력으로 검증한 점검만 기본 실행 (기본 스캔은 검증된 다섯 규칙)',
                '통과한 적 없는 테스트는 지우고 닫음',
                'Linux·macOS 대상'
            ],
            result: '명령 출력으로 검증된 규칙만 기본으로 연 v0.1 공개(MIT), 도커 위 SSH 합격 시험 통과'
        }
    },
    {
        id: 'bkan-blog',
        category: 'project',
        status: 'active',
        resultIcon: 'fa-pen-nib',
        tags: ['Python', '근거 게이트', 'Cloudflare Pages'],
        links: [
            { kind: 'external', href: 'https://blog.bkan.dev', label: 'blog.bkan.dev' },
            { kind: 'blog', href: 'https://blog.bkan.dev/compose-before-polish', label: { ko: '윤문 앞 문서를 바꿈' } },
            { kind: 'blog', href: 'https://blog.bkan.dev/humanizer-off-after-a-month', label: { ko: '게이트를 한 달 만에 끔' } }
        ],
        ko: {
            title: '기술 블로그 파이프라인',
            subtitle: '2026.08 - 현재 · blog.bkan.dev',
            summary: '에이전트가 초안을 쓰고 공개 위험·사실 오류를 확인한 뒤 발행하는 파이프라인',
            desc: '블로그를 꾸준히 운영하되 글마다 사료를 손으로 모아 쓰지 않으려고 만든 파이프라인입니다. Hindsight 기억에서 사료를 찾는 일부터 제 결정 규칙과 문체로 쓰는 집필, 공개 위험·사실 오류 확인까지 에이전트가 맡습니다.',
            bullets: [
                '근거 절에 열 수 있는 링크나 측정 조건이 없는 판정문은 빌드 실패',
                '같은 사료로 여러 번 뽑아 보고, 결과를 가른 템플릿·규범 문서를 집필 단계로 고정',
                '초안은 에이전트가 쓰고 교정과 판정은 직접 함. 집필 방식은 글마다 공개'
            ],
            result: '사료 조사부터 윤문까지 사람 개입 없는 런으로 돌리고, 교정과 발행 판단만 사람이 함'
        }
    },
    {
        id: 'smb-edu',
        category: 'project',
        status: 'archived',
        resultIcon: 'fa-chalkboard-user',
        tags: ['Gemini', 'ChatGPT GPTs', '교재 · 실습 자료'],
        links: [
            { kind: 'blog', href: 'https://blog.bkan.dev/claimed-quota-is-not-the-limit', label: { ko: '한도 실측 기록' } }
        ],
        ko: {
            title: '소상공인 AI 교육 자료',
            subtitle: '2026.07 - 08 · 강의 전 보류',
            summary: '무료 계정만으로 따라 할 수 있는 AI 활용 강의 교재와 실습 자료',
            desc: '제주에서 소상공인 대상 AI 교육 과정을 준비하며, 수강생이 무료 계정만으로 따라 할 수 있게 만든 교재와 실습 자료입니다.',
            bullets: [
                '무료 사용 한도는 문서 수치 대신 실측값으로 교재에 기재 (Gemini 무료 Pro 문서상 하루 5회 안팎 → 실측 7회 이상)'
            ],
            result: '제작 완료, 강의 전 보류'
        }
    },
    {
        id: 'rag-edu',
        category: 'project',
        status: 'completed',
        resultIcon: 'fa-book',
        tags: ['RAG', 'BM25', 'FAISS', 'Upstage Solar'],
        links: [
            { kind: 'pdf', href: 'assets/RAG_educate/RAG_개요서_김병현.pdf', label: { ko: '기획서' } },
            { kind: 'pdf', href: 'assets/RAG_educate/RAG_교육자료_김병현.pdf', label: { ko: '교재' } },
            { kind: 'colab', href: 'https://colab.research.google.com/gist/Bkankim/a0a548b3c070a291dc5909f4e4ba0d58/RAG_practice_bkan.ipynb', label: { ko: '실습 노트북 (Colab)' } }
        ],
        ko: {
            title: 'RAG 교육 콘텐츠',
            subtitle: '2025.12 · 채용 과제',
            summary: '키워드·벡터·하이브리드 검색을 비교하는 실무자용 RAG 교재와 실습',
            desc: '채용 과제로 만든 실무자용 RAG 교육 기획서·교재·실습 노트북입니다.',
            bullets: [
                '키워드(BM25)·벡터·하이브리드 검색을 같은 질문 세트로 비교',
                'Hit@k·MRR로 검색기를 고르는 실습 구성'
            ],
            result: '과제는 탈락, 준비하며 정리한 기획서·교재·실습 노트북은 공개'
        }
    },
    {
        id: 'c-rag',
        category: 'edu',
        status: 'completed',
        resultIcon: 'fa-trophy',
        tags: ['RAG', 'LangGraph', 'Solar Embedding'],
        links: [
            { kind: 'github', href: 'https://github.com/Bkankim/informationretrieval-ir_ad_2', label: 'GitHub' }
        ],
        ko: {
            title: '과학 질의응답 RAG 검색 대회 · 팀 1위',
            subtitle: 'AI 부트캠프 (w. Upstage) 14기',
            summary: 'LangGraph로 검색·답변 흐름 정리와 과학 외 질문 처리를 맡음',
            desc: '과학 질의응답 RAG 검색 대회에서 LangGraph로 검색·답변 흐름 정리와 과학 외 질문 처리를 맡았습니다.',
            result: '팀 MAP/MRR 베이스라인 대비 +107% (0.4242 → 0.8795 / 0.8818)'
        }
    },
    {
        id: 'c-cv',
        category: 'edu',
        status: 'completed',
        resultIcon: 'fa-trophy',
        tags: ['Swin Transformer', 'ConvNeXt', 'EfficientNet'],
        links: [
            { kind: 'github', href: 'https://github.com/Bkankim/CV-Competition', label: 'GitHub' }
        ],
        ko: {
            title: '문서 이미지 분류 CV 대회 · 팀 2등',
            subtitle: 'AI 부트캠프 (w. Upstage) 14기',
            summary: '17클래스 스캔 문서 분류, 전처리·학습·추론 파이프라인을 맡음',
            desc: '17클래스 스캔 문서 분류 대회에서 전처리·학습·추론 파이프라인을 맡았습니다.',
            result: '팀 F1 베이스라인 대비 +470% (0.1701 → 0.9689)'
        }
    },
    {
        id: 'c-toss',
        category: 'edu',
        status: 'completed',
        resultIcon: 'fa-chart-line',
        tags: ['LightGBM', 'PyTorch'],
        links: [
            { kind: 'github', href: 'https://github.com/Bkankim/toss-ad-click-prediction', label: 'GitHub' }
        ],
        ko: {
            title: '토스 NEXT ML Challenge · 광고 클릭률 예측',
            subtitle: '데이콘 · 2025.09 - 10 · 팀 참가',
            summary: '최종 제출에 쓴 LightGBM 학습 파이프라인을 맡음',
            desc: '광고 클릭률 예측 대회에서 최종 제출에 쓴 LightGBM 학습 파이프라인을 맡았습니다.',
            result: 'Private 리더보드 팀 상위 10%'
        }
    },
];
