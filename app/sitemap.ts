import type { MetadataRoute } from 'next';
import { SITE, sections } from '@/lib/site';

export const dynamic = 'force-static';

/** 랜딩, 분야 목록, 실험 본체. 카드에 sitemap: false가 있으면(noindex 페이지) 뺀다 */
export default function sitemap(): MetadataRoute.Sitemap {
  const urls = [`${SITE}/`];
  for (const s of sections) {
    urls.push(`${SITE}/${s.slug}/`);
    // 카드는 최신순이라 뒤집어 오래된 것부터 적는다
    for (const c of [...s.cards].reverse()) {
      if (c.sitemap !== false) urls.push(`${SITE}/${s.slug}/${c.slug}/`);
    }
  }
  return urls.map((url) => ({ url }));
}
