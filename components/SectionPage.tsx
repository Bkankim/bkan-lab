import Link from 'next/link';
import type { ReactNode } from 'react';
import { Ledger } from '@/components/Ledger';
import { readMetrics, type Card, type Section, type ToolRow } from '@/lib/site';

function ToolsRow({ row }: { row: ToolRow }) {
  return (
    <div>
      <dt>{row.label}</dt>
      <dd>
        {row.own?.map((html, i) => <p className="own" key={i} dangerouslySetInnerHTML={{ __html: html }} />)}
        {row.chips && (
          <ul>
            {row.chips.map((chip) => (
              <li key={chip.href + chip.name}>
                <a href={chip.href} target="_blank" rel="noopener" dangerouslySetInnerHTML={{ __html: chip.name }} />
              </li>
            ))}
          </ul>
        )}
        {row.note && <span className="note" dangerouslySetInnerHTML={{ __html: row.note }} />}
      </dd>
    </div>
  );
}

function Entry({ section, card }: { section: string; card: Card }) {
  return (
    <li className="entry">
      {/* 실험 본체는 public/의 정적 페이지라 <Link>가 아니라 <a>로 건다 */}
      <a href={`/${section}/${card.slug}/`}>
        <img src={card.image} alt={card.alt} width={1200} height={630} loading="lazy" />
        <span>
          <span className="title-row">
            <span className="name">{card.name}</span>
            <span className="when">{card.when}</span>
          </span>
          <span className="desc" dangerouslySetInnerHTML={{ __html: card.desc }} />
          {card.metrics && <Ledger r={readMetrics(section, card.slug)} />}
          {card.verdict && (
            <span className="verdict">
              {card.verdict.map((row) => (
                <span className="row" key={row.k}>
                  <span className="k">{row.k}</span>
                  <span dangerouslySetInnerHTML={{ __html: row.html }} />
                </span>
              ))}
            </span>
          )}
        </span>
      </a>
      {/* 카드 전체가 <a>라 도구 링크를 안에 넣으면 링크가 겹친다. 그래서 <a> 밖에 둔다 */}
      <div className="tools" aria-label="활용 도구">
        <p className="k">활용 도구</p>
        <dl>
          {card.tools.map((row) => (
            <ToolsRow row={row} key={row.label} />
          ))}
        </dl>
      </div>
    </li>
  );
}

export function Foot() {
  return (
    <footer className="wrap foot">
      만든 사람 김병현. 포트폴리오와 블로그는 <a href="https://bkan.dev">bkan.dev</a>에 있습니다.
    </footer>
  );
}

/** 분야 목록 페이지: 머리 띠 + 실험 카드 목록 */
export function SectionPage({ section, children }: { section: Section; children?: ReactNode }) {
  return (
    <>
      <header className="print strip">
        <div className="wrap">
          <Link className="crumb" href="/">
            bkan lab 처음으로
          </Link>
          <h1>{section.title}</h1>
          <p className="lede" dangerouslySetInnerHTML={{ __html: section.lede }} />
        </div>
      </header>
      <main className="wrap section">
        <ul className="shelf">
          {section.cards.map((card) => (
            <Entry section={section.slug} card={card} key={card.slug} />
          ))}
        </ul>
        {children}
      </main>
      <Foot />
    </>
  );
}
