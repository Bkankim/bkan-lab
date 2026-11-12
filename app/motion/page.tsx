import type { Metadata } from 'next';
import { SectionPage } from '@/components/SectionPage';
import { OG_IMAGE, SITE, getSection } from '@/lib/site';

const section = getSection('motion');

export const metadata: Metadata = {
  title: 'Motion - bkan lab',
  description: section.description,
  alternates: { canonical: `${SITE}/motion/` },
  openGraph: {
    type: 'website',
    title: 'Motion - bkan lab',
    description: section.description,
    images: [OG_IMAGE],
    url: `${SITE}/motion/`,
  },
};

export default function Motion() {
  return <SectionPage section={section} />;
}
