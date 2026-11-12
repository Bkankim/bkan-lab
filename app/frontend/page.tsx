import type { Metadata } from 'next';
import { SectionPage } from '@/components/SectionPage';
import { OG_IMAGE, SITE, getSection, readMetrics } from '@/lib/site';

const section = getSection('frontend');

export const metadata: Metadata = {
  title: 'Frontend - bkan lab',
  description: section.description,
  alternates: { canonical: `${SITE}/frontend/` },
  openGraph: {
    type: 'website',
    title: 'Frontend - bkan lab',
    description: section.description,
    images: [OG_IMAGE],
    url: `${SITE}/frontend/`,
  },
};

export default function Frontend() {
  // 마지막 집계일: 카드 지표 가운데 가장 늦게 잰 날
  const asof = section.cards
    .filter((c) => c.metrics)
    .map((c) => readMetrics('frontend', c.slug).measured_at.slice(0, 10))
    .sort()
    .at(-1);
  return (
    <SectionPage section={section}>
      <section className="method" aria-labelledby="method-title">
        <h2 id="method-title">숫자는 어떻게 셌나</h2>
        <dl>
          <div>
            <dt>딸깍</dt>
            <dd>
              제가 AI에게 직접 보낸 메시지 수입니다. 작업 완료 알림 같은 자동 메시지는 빼고, 1분 안에 거의 같은 문장을 고쳐 다시 보낸 것은 한 번으로
              셉니다. &quot;4 → 18&quot;은 첫 배포까지 4번, 지금까지 18번이라는 뜻입니다. 교정은 그중 AI의 결과나 해석이 지시에 못 미쳐 바로잡은
              메시지입니다. 새 요구나 취향 변경은 교정으로 세지 않습니다.
            </dd>
          </div>
          <div>
            <dt>소요 시간</dt>
            <dd>
              AI(본체와 서브에이전트)가 실제로 일한 시간입니다. 여럿이 동시에 일한 시간은 한 번만 셉니다. 10분 넘게 아무 기록이 없던 시간과 제 승인을
              기다린 시간은 뺐습니다. 첫 지시부터 마지막 작업까지 걸린 시간은 &apos;경과&apos;로 따로 적었습니다.
            </dd>
          </div>
          <div>
            <dt>API 정가 환산</dt>
            <dd>
              쓴 토큰을 Anthropic API 정가(캐시 쓰기·읽기 단가 포함)로 계산한 값입니다. 실제로는 정액 구독으로 썼습니다. 브라우저 에이전트(aside)
              안에서 쓴 토큰은 기록이 없어 빠져 있습니다.
            </dd>
          </div>
          <div>
            <dt>서브에이전트</dt>
            <dd>본체 AI가 일을 나눠 맡긴 하위 AI의 수입니다.</dd>
          </div>
        </dl>
        <p className="asof">에이전트 세션 기록에서 스크립트로 뽑았습니다. 마지막 집계 {asof}.</p>
      </section>
    </SectionPage>
  );
}
