// 02 UX 설계 3절 데이터 모델. data/jachwi-2612.json의 모양이다.
import type { UseKey } from './theme';

export type Grade = '○' | '△' | '?' | '⚠' | '✕';

export type Floor = { n: number; use: UseKey; label: string };
export type Building = {
  main: string;
  ground: number;
  under: number;
  households: number;
  approved: string;
  floors: Floor[];
} | null;

export type Listing = {
  src: 'naver' | 'zigbang' | 'dabang' | 'peterpan';
  url: string;
  dong: string;
  jibun: string | null;
  deposit: number;
  rent: number;
  fee: number;
  real: number;
  m2: number | null;
  floor: string;
  grade: Grade;
  note: string;
  text: string;
  built: string;
  commute: number | null;
  building: Building;
};

export type Trap = {
  key: string;
  title: string;
  price: string;
  looks: string;
  real: string;
  evidence: string;
  building: Building;
  at: number;
  url: string;
};

export type MarketRow = { dong: string; kinds: { kind: string; n: number; p25: number; median: number; p75: number }[] };

export type JachwiData = {
  asof: string;
  tagline: string;
  origin: { address: string; station: string; walk: string; lat: number; lon: number };
  funnel: { label: string; n: number; why: string }[];
  market: MarketRow[];
  asking: { band: string; villa: number; officetel: number }[];
  fee: {
    villa: { median: number; p25: number; p75: number };
    officetel: { median: number; p25: number; p75: number };
    utilities: { summer: [number, number]; winter: [number, number] };
  };
  traps: Trap[];
  grades: { key: Grade; count: number; label: string }[];
  listings: Listing[];
};

export const SRC_LABEL: Record<Listing['src'], string> = { naver: '네이버', zigbang: '직방', dabang: '다방', peterpan: '피터팬' };
