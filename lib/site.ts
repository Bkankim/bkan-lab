import fs from 'node:fs';
import path from 'node:path';
import frontend from '@/data/frontend.json';
import motion from '@/data/motion.json';

export const SITE = 'https://lab.bkan.dev';
export const OG_IMAGE = `${SITE}/assets/og-lab.png?v=2`;

export type ToolRow = {
  label: string;
  /** 모델·직접 만든 것: 이름과 괄호 설명(HTML) */
  own?: string[];
  /** 알려진 도구: 이름 칩 + 공식 링크 */
  chips?: { name: string; href: string }[];
  note?: string;
};

export type Card = {
  slug: string;
  name: string;
  /** 실험 폴더를 처음 커밋한 날(한국 시간) */
  when: string;
  image: string;
  alt: string;
  /** 두 문장: 계기 + 목적. 줄바꿈 자리는 <br> */
  desc: string;
  /** motion 카드의 결론·다음 */
  verdict?: { k: string; html: string }[];
  /** true면 public/<분야>/<슬러그>/metrics.json으로 지표 상자를 그린다 */
  metrics: boolean;
  tools: ToolRow[];
  /** false면 sitemap에서 뺀다(noindex 페이지) */
  sitemap?: boolean;
};

export type Section = {
  slug: string;
  title: string;
  /** 랜딩 분야 줄의 한 문장 */
  shelfDesc: string;
  description: string;
  lede: string;
  cards: Card[];
};

export const sections: Section[] = [frontend as Section, motion as Section];

export function getSection(slug: string): Section {
  const found = sections.find((s) => s.slug === slug);
  if (!found) throw new Error(`분야 없음: ${slug}`);
  return found;
}

export type Metrics = {
  measured_at: string;
  elapsed_ms: number;
  ai_work_ms: number;
  clicks: number;
  corrections: number | null;
  input_chars: number;
  ai_ms_per_click: number;
  subagents: number;
  models: { model: string; output_share: number }[];
  cost_usd_api_equiv: number;
  made?: string;
  used?: string;
  first_release?: { clicks: number };
};

/** tools/lab-metrics가 쓴 실험별 지표. 빌드 때 읽는다 */
export function readMetrics(section: string, slug: string): Metrics {
  const file = path.join(process.cwd(), 'public', section, slug, 'metrics.json');
  const r = JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, unknown>;
  // 칸이 빠진 파일은 "undefined번" 같은 글자로 나가지 않게 빌드를 멈춘다
  const required = ['measured_at', 'elapsed_ms', 'ai_work_ms', 'clicks', 'corrections', 'input_chars', 'ai_ms_per_click', 'subagents', 'models', 'cost_usd_api_equiv'];
  const missing = required.filter((key) => !(key in r));
  if (missing.length > 0) throw new Error(`${section}/${slug}/metrics.json에 칸이 없습니다: ${missing.join(', ')}`);
  return r as Metrics;
}
