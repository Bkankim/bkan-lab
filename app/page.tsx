import type { Metadata } from 'next';
import Link from 'next/link';
import { Foot } from '@/components/SectionPage';
import { OG_IMAGE, SITE, sections } from '@/lib/site';

export const metadata: Metadata = {
  title: 'bkan lab',
  description: '일상에서 필요한 걸 에이전트로 딸깍 몇 번에 만들어 보고, 어디까지 되는지 실험하는 김병현의 실험실입니다.',
  alternates: { canonical: `${SITE}/` },
  openGraph: {
    type: 'website',
    title: 'bkan lab',
    description: '일상에서 필요한 걸 에이전트로 딸깍 몇 번에 만들어 보고, 어디까지 되는지 실험합니다.',
    images: [OG_IMAGE],
    url: `${SITE}/`,
  },
};

export default function Home() {
  return (
    <>
      <header className="print develop hero">
        <div className="wrap">
          <h1>bkan lab</h1>
          <p className="lede">
            일상에서 필요한 걸 에이전트로 딸깍 몇 번에 만들어 보고, 어디까지 되는지 실험합니다.
            <br />
            떠오른 그날 바로 시작하는 즉흥 실험도 함께 올립니다.
            <br />
            만든 것 중 일부는 가족과 지인이 실제로 씁니다.
          </p>
        </div>
      </header>

      <main className="wrap section">
        <ul className="shelf">
          {sections.map((s) => (
            <li key={s.slug}>
              <Link href={`/${s.slug}/`}>
                <span className="name">{s.title}</span>
                <span className="count">실험 {s.cards.length}개</span>
                <span className="desc">{s.shelfDesc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <Foot />
    </>
  );
}
