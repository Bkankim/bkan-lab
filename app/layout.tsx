import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
};

// lab.bkan.dev는 DNS only라 Cloudflare가 Web Analytics beacon을 자동으로 넣지 못한다.
// 그래서 공용 틀에 직접 넣는다(tools/beacon_check.py가 배포 전에 페이지마다 하나씩 있는지 본다)
const BEACON = '{"token": "ae655c6ae08e401ea37ed39f25af4d6e"}';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hahmlet:wght@600;700&family=IBM+Plex+Sans+KR:wght@400;500&display=swap"
        />
        <link rel="icon" type="image/png" href="/assets/favicon.png" />
        {/* 손으로 쓴 공용 스타일. /assets/*는 1시간 캐시라 고치면 ?v=를 올린다 */}
        <link rel="stylesheet" href="/assets/lab.css?v=6" />
      </head>
      <body>
        {children}
        <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={BEACON} />
      </body>
    </html>
  );
}
