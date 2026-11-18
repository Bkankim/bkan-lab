import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import data from '@/data/jachwi-2612.json';
import { JachwiPage } from '@/components/jachwi/JachwiPage';
import type { JachwiData } from '@/components/jachwi/types';
import { SITE } from '@/lib/site';

// BK 개인용 조사 리포트. 공개 주소지만 검색엔진에 내보내지 않고 목록 카드·sitemap에도 넣지 않는다.
export const metadata: Metadata = {
  title: '3,463개에서 20개로 - 매봉역 30분 자취방',
  description: '매봉역 30분 안 원룸 월세 3,463건을 반지하·전입 불가·근생·고시원·옥탑으로 걸러 정상 주택 20건과 실제 부담을 정리한 조사 리포트',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE}/frontend/jachwi-2612/` },
  openGraph: {
    type: 'article',
    title: '3,463개에서 20개로 - 매봉역 30분 자취방',
    description: '반지하·전입 불가·근생·고시원·옥탑을 걸러 남긴 정상 주택 20건과 실제 부담',
    images: [`${SITE}/frontend/jachwi-2612/og.jpg?v=1`],
    url: `${SITE}/frontend/jachwi-2612/`,
  },
};

export default function Page() {
  return (
    <AppRouterCacheProvider options={{ key: 'jw' }}>
      <JachwiPage d={data as unknown as JachwiData} />
    </AppRouterCacheProvider>
  );
}
