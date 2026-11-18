'use client';
// 02 UX 2.2 계층 트리의 섹션들. 각 섹션 머리는 왼쪽 번호·제목, 오른쪽 핵심 수치(03 비주얼 2절, 02 UX 원칙 1).
import { useMemo, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { FloorStack, UseLegend } from './FloorStack';
import { computeCost } from './cost';
import { SRC_LABEL, type Grade, type JachwiData, type Listing } from './types';

const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}`;
const median = (xs: number[]) => {
  const v = [...xs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

export function Section({ no, title, figure, children, id }: { no: number; title: string; figure?: ReactNode; children: ReactNode; id: string }) {
  return (
    <Box component="section" id={id} aria-labelledby={`${id}-t`} sx={{ borderTop: 1, borderColor: 'divider', py: { xs: 5, md: 7 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: { xs: 1.5, md: 4 }, mb: 4, alignItems: 'end' }}>
        <Box>
          <Typography variant="overline" color="primary" component="p">
            §{no}
          </Typography>
          <Typography variant="h2" id={`${id}-t`}>
            {title}
          </Typography>
        </Box>
        {figure && (
          <Typography variant="body1" color="text.secondary" component="div">
            {figure}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}

const Big = ({ children }: { children: ReactNode }) => (
  <Typography variant="num" sx={{ fontSize: '1.6rem', color: 'text.primary', mr: 0.5 }}>
    {children}
  </Typography>
);

export function Hero({ d }: { d: JachwiData }) {
  const ok = d.grades.find((g) => g.key === '○')?.count ?? 0;
  const okRows = d.listings.filter((l) => l.grade === '○');
  const med = Math.round(median(okRows.map((l) => l.real)));
  return (
    <Box component="header" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 5, md: 8 } }}>
      <Typography variant="overline" color="text.secondary" component="p">
        자취방 감정서 · {d.origin.station} · {d.asof} 수집
      </Typography>
      <Typography variant="h1" sx={{ mt: 2, mb: 3 }}>
        {d.tagline}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
        출발지는 {d.origin.address}이다({d.origin.station} {d.origin.walk}).
        <br />
        여기서 반경 약 3km 안의 월세·전세 매물을 네 플랫폼에서 모았다.
        <br />
        반지하·전입 불가·근생·고시원·옥탑을 차례로 걸러서 건축물대장상 정상 주택만 남겼다.
        <br />
        남은 후보는 카카오맵 대중교통 최단 경로로 잰 출퇴근 시간이 모두 30분 안이다.
      </Typography>
      <Box
        component="dl"
        sx={{ mt: 5, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, borderTop: 2, borderColor: 'text.primary', pt: 2 }}
      >
        {[
          ['모은 매물', `${won(d.funnel[0].n)}건`],
          ['정상 주택', `${ok}건`],
          ['정상 주택 실부담 중앙값', `월 ${med}만원`],
          ['겨울 공과금 별도', `월 ${d.fee.utilities.winter[0]}~${d.fee.utilities.winter[1]}만원`],
        ].map(([k, v]) => (
          <Box key={k}>
            <Typography component="dt" variant="overline" color="text.secondary">
              {k}
            </Typography>
            <Typography component="dd" variant="num" sx={{ m: 0, fontSize: { xs: '1.4rem', md: '1.9rem' }, display: 'block' }}>
              {v}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function MarketSection({ d }: { d: JachwiData }) {
  // 축 최대값은 데이터의 상위 25% 최댓값을 20 단위로 올린 값
  const max = Math.ceil(Math.max(...d.market.flatMap((m) => m.kinds.map((k) => k.p75))) / 20) * 20;
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((max / 4) * i));
  const kinds = ['다가구', '빌라', '오피스텔'] as const;
  const color = { 다가구: 'use.home', 빌라: 'text.secondary', 오피스텔: 'use.shop' } as const;
  // T1 호가와 비교: 실거래(다가구·빌라 동별 중앙값의 중앙)와 매물 호가(원룸·빌라 거리대별)를 같은 환산 기준으로 놓는다
  const realRoom = median(d.market.flatMap((m) => m.kinds.filter((k) => k.kind !== '오피스텔').map((k) => k.median)));
  const realOt = median(d.market.flatMap((m) => m.kinds.filter((k) => k.kind === '오피스텔').map((k) => k.median)));
  const askRoom = median(d.asking.map((a) => a.villa));
  const askOt = median(d.asking.map((a) => a.officetel));
  return (
    <Section
      no={1}
      id="market"
      title="이 동네 원룸 시세"
      figure={
        <>
          국토부 전월세 실거래 2026년 8~10월, 전용 15~35㎡, 보증금 1,000만원 기준 환산.
          <br />
          지금 나온 매물의 호가는 원룸 기준으로 실거래보다 <b>{won(askRoom - realRoom)}만원</b> 높다(아래 표).
        </>
      }
    >
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {kinds.map((k) => (
          <Box key={k} sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color[k] }} />
            <Typography variant="overline" color="text.secondary">
              {k}
            </Typography>
          </Box>
        ))}
        <Typography variant="overline" color="text.secondary">
          막대 = 가운데 50%, 점 = 중앙값, 단위 만원
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {d.market.map((m) => (
          <Box key={m.dong} sx={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 1.5, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {m.dong}
            </Typography>
            <Box sx={{ position: 'relative', height: 30, borderLeft: 1, borderColor: 'divider', overflow: 'hidden' }}>
              {m.kinds.map((k, i) => (
                <Box
                  key={k.kind}
                  title={`${m.dong} ${k.kind}: 중앙 ${k.median}, 가운데 50% ${k.p25}~${k.p75}, ${k.n}건`}
                  sx={{ position: 'absolute', top: i * 10 + 1, left: `${(k.p25 / max) * 100}%`, width: `${((k.p75 - k.p25) / max) * 100}%`, height: 6, '&::before': { content: '""', position: 'absolute', inset: 0, bgcolor: color[k.kind as (typeof kinds)[number]], opacity: 0.35 } }}
                >
                  <Box sx={{ position: 'absolute', left: `${((k.median - k.p25) / Math.max(k.p75 - k.p25, 1)) * 100}%`, top: -2, width: 10, height: 10, ml: '-5px', borderRadius: '50%', bgcolor: color[k.kind as (typeof kinds)[number]] }} />
                </Box>
              ))}
            </Box>
          </Box>
        ))}
        <Box sx={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 1.5 }}>
          <span />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {ticks.map((v) => (
              <Typography key={v} variant="overline" color="text.secondary">
                {v}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
      <Box component="table" sx={{ mt: 4, width: '100%', borderCollapse: 'collapse', '& th, & td': { py: 1, px: 1, borderBottom: 1, borderColor: 'divider', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }, '& th:first-of-type, & td:first-of-type': { textAlign: 'left' } }}>
        <caption style={{ captionSide: 'top', textAlign: 'left', paddingBottom: 8 }}>
          <Typography variant="overline" color="text.secondary">
            호가와 실거래 비교, 월세 중앙값(만원, 보증금 1,000만원 기준 환산). 호가: 직방·다방·피터팬 월세 매물 1,679건(2026-11-18 수집), 회사에서 거리대별
          </Typography>
        </caption>
        <thead>
          <tr>
            <Typography component="th" variant="overline" color="text.secondary">구분</Typography>
            <Typography component="th" variant="overline" color="text.secondary">원룸·빌라</Typography>
            <Typography component="th" variant="overline" color="text.secondary">오피스텔</Typography>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Typography component="td" variant="body2">실거래(위 동들의 중앙값)</Typography>
            <Typography component="td" variant="num">{won(realRoom)}</Typography>
            <Typography component="td" variant="num">{won(realOt)}</Typography>
          </tr>
          {d.asking.map((a) => (
            <tr key={a.band}>
              <Typography component="td" variant="body2">호가 · {a.band}</Typography>
              <Typography component="td" variant="num">{a.villa}</Typography>
              <Typography component="td" variant="num">{a.officetel}</Typography>
            </tr>
          ))}
        </tbody>
      </Box>
    </Section>
  );
}

export function FunnelSection({ d }: { d: JachwiData }) {
  const top = d.funnel[0].n;
  return (
    <Section no={2} id="funnel" title={`왜 ${d.funnel.at(-1)?.n}개인가`} figure={<><Big>{won(top)}</Big>건에서 <Big>{d.funnel.at(-1)?.n}</Big>건이 남았다. 남은 비율은 {(((d.funnel.at(-1)?.n ?? 0) / top) * 100).toFixed(1)}%다.</>}>
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 2 }}>
        {d.funnel.map((s, i) => (
          <Box component="li" key={s.label} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 0.5, md: 3 }, alignItems: 'center' }}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {i + 1}. {s.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {s.why}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ flex: 1, height: 18, bgcolor: 'divider' }}>
                <Box sx={{ height: '100%', width: `${Math.max((s.n / top) * 100, 0.6)}%`, bgcolor: i === d.funnel.length - 1 ? 'use.home' : 'text.primary', transition: 'width 200ms ease-out', '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }} />
              </Box>
              <Typography variant="num" sx={{ width: 56, textAlign: 'right' }}>
                {won(s.n)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Section>
  );
}

export function TrapSection({ d }: { d: JachwiData }) {
  return (
    <Section no={3} id="traps" title="싼 방은 왜 싼가" figure={<>1,000/50대 방을 건축물대장과 맞춰 보면 이렇게 나온다.<br />매물 화면에 적힌 층은 대장에 기록된 층과 다를 수 있다.</>}>
      <Box sx={{ mb: 3 }}>
        <UseLegend />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {d.traps.map((t) => (
          <Box key={t.key} component="article" sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', p: { xs: 2, md: 3 }, display: 'grid', gap: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" component="p">
                {t.price}
              </Typography>
              <Typography variant="h3">{t.title}</Typography>
            </Box>
            <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: '48px 1fr', rowGap: 0.75, columnGap: 1 }}>
              <Typography component="dt" variant="overline" color="text.secondary">
                겉보기
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                {t.looks}
              </Typography>
              <Typography component="dt" variant="overline" color="primary">
                실제
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 500 }}>
                {t.real}
              </Typography>
            </Box>
            <FloorStack building={t.building} at={t.at} />
            <Typography variant="overline" color="text.secondary">
              근거: {t.evidence} ·{' '}
              <Link href={t.url} target="_blank" rel="noopener">
                매물
              </Link>
            </Typography>
          </Box>
        ))}
      </Box>
    </Section>
  );
}

export function CostSection({ d }: { d: JachwiData }) {
  const [rent, setRent] = useState(60);
  const [fee, setFee] = useState(10);
  const [deposit, setDeposit] = useState(1000);
  const [salary, setSalary] = useState(4000);
  const c = useMemo(() => computeCost({ deposit, rent, fee, salary }), [deposit, rent, fee, salary]);
  const sliders: [string, number, (v: number) => void, number, number, number, string][] = [
    ['월세', rent, setRent, 30, 90, 1, '만원'],
    ['관리비', fee, setFee, 0, 25, 1, '만원'],
    ['보증금', deposit, setDeposit, 0, 5000, 100, '만원'],
    ['연봉(세전)', salary, setSalary, 2400, 8000, 100, '만원'],
  ];
  const parts = [
    { k: '월세+관리비', v: (rent + fee) * 12, c: 'text.primary' },
    // 보증금 1,000만원 기준 환산(02 UX 3.2). 많이 넣으면 더하고, 적게 넣으면 뺀다
    { k: '보증금 환산(1,000만원 기준, 6%)', v: (deposit - 1000) * 0.06, c: 'text.primary' },
    { k: '세액공제', v: -c.taxCredit, c: 'use.home' },
    { k: '서울 청년월세', v: -c.seoulYouth, c: 'use.home' },
  ];
  return (
    <Section
      no={4}
      id="cost"
      title="실제로 나가는 돈"
      figure={
        <>
          혜택을 빼면 월 <Big>{won(c.netMonthly)}</Big>만원.
          <br />
          청년월세에 떨어지면 월 {won(c.netMonthlyNoYouth)}만원이고, 겨울에는 공과금 {d.fee.utilities.winter[0]}~{d.fee.utilities.winter[1]}만원이 더 붙는다.
        </>
      }
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 } }}>
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          {sliders.map(([label, v, set, min, max, step, unit]) => (
            <Box key={label}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" id={`s-${label}`}>
                  {label}
                </Typography>
                <Typography variant="num">
                  {won(v)}
                  {unit}
                </Typography>
              </Box>
              <Slider aria-labelledby={`s-${label}`} value={v} min={min} max={max} step={step} onChange={(_, n) => set(n as number)} size="small" />
            </Box>
          ))}
          <Typography variant="body2" color="text.secondary">
            관리비 중앙값은 원룸 {d.fee.villa.median}만원, 오피스텔 {d.fee.officetel.median}만원이다(수집 매물 기준).
          </Typography>
        </Box>
        <Box>
          <Box component="dl" sx={{ m: 0, display: 'grid', gap: 1.25 }}>
            {parts.map((p) => (
              <Box key={p.k} sx={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                <Typography component="dt" variant="body2">
                  {p.k} <Typography component="span" variant="overline" color="text.secondary">1년</Typography>
                </Typography>
                <Typography component="dd" variant="num" sx={{ m: 0, color: p.c }}>
                  {p.v < 0 ? '−' : ''}
                  {won(Math.abs(p.v))}만원
                </Typography>
              </Box>
            ))}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', pt: 0.5 }}>
              <Typography component="dt" variant="body1" sx={{ fontWeight: 700 }}>
                월 실제 부담
              </Typography>
              <Typography component="dd" variant="num" sx={{ m: 0, fontSize: '1.5rem' }}>
                {won(c.netMonthly)}만원
              </Typography>
            </Box>
          </Box>
          <Box component="ul" sx={{ mt: 3, pl: 2.5, color: 'text.secondary', '& li': { mb: 0.75 } }}>
            <Typography component="li" variant="body2">
              세액공제 {Math.round(c.creditRate * 100)}%: 총급여 5,500만원 이하 17%, 8,000만원 이하 15%, 월세 연 1,000만원 한도. 무주택 세대주이고 전입신고를 해야 한다. 다음 해 2월 연말정산에 반영된다.
            </Typography>
            <Typography component="li" variant="body2">
              서울 청년월세 {c.seoulEligible ? '대상' : <b>대상 아님</b>}: 월 20만원×12개월, 중위소득 150%(1인 월 384.7만원) 이하, 보증금 8,000만원 이하, 월세 60만원 이하 또는 환산 90만원 이하. 선정제(2025년 약 55%).
            </Typography>
            <Typography component="li" variant="body2">
              국토부 청년월세는 청년가구 중위소득 60% 이하가 대상이라서 연봉이 월 154만원을 넘으면 대상이 아니다.
            </Typography>
            <Typography component="li" variant="body2">
              따로 1회: 서울 중개보수·이사비 최대 {c.moveOnce}만원(영수증 필수).
            </Typography>
          </Box>
        </Box>
      </Box>
    </Section>
  );
}

// 네이버 지도 대중교통 길찾기(매물 -> 회사). 형식: /p/directions/경도,위도,이름,,/경도,위도,이름,,/-/transit (2026-11-19 확인)
function naverTransit(l: Listing, o: JachwiData['origin']) {
  if (!l.coord) return null;
  const name = encodeURIComponent(`${l.dong} ${l.jibun ?? ''}`.trim());
  return `https://map.naver.com/p/directions/${l.coord.lon},${l.coord.lat},${name},,/${o.lon},${o.lat},${encodeURIComponent('회사')},,/-/transit`;
}

function ListingRow({ l, origin }: { l: Listing; origin: JachwiData['origin'] }) {
  // 옥탑은 단면의 옥탑 칸(n=99)을 가리킨다. 저·중·고·빈 값은 층을 모르므로 표시하지 않는다
  const at = /^-?\d+/.test(l.floor) ? parseInt(l.floor, 10) : l.floor.includes('옥탑') ? 99 : null;
  const floorLabel = !l.floor ? '층 정보 없음' : /^[-\d저중고]/.test(l.floor) ? `${l.floor}층` : l.floor;
  return (
    <Box
      component="li"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '28px 110px 1.4fr 92px 96px 1.6fr 76px' },
        gap: { xs: 0.5, md: 2 },
        alignItems: 'center',
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        // 02 UX 원칙 5: 행 전체가 링크다(링크의 ::after가 행을 덮는 stretched link)
        position: 'relative',
        '&:hover': { bgcolor: 'action.hover' },
        '&:focus-within': { outline: 2, outlineColor: 'primary.main', outlineStyle: 'solid', outlineOffset: -2 },
      }}
    >
      <Typography variant="body1" color={l.grade === '○' ? 'use.home' : l.grade === '✕' || l.grade === '⚠' ? 'primary' : 'text.secondary'} sx={{ fontWeight: 700 }}>
        {l.grade}
      </Typography>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {l.dong}
        </Typography>
        <Typography variant="overline" color="text.secondary">
          {l.jibun ?? '지번 없음'}
        </Typography>
      </Box>
      <Box>
        <Typography variant="num">
          {won(l.deposit)}/{l.rent} + {l.fee}
        </Typography>
        <Typography variant="overline" color="text.secondary" component="p">
          {l.m2 ? `${l.m2}㎡ · ` : ''}
          {floorLabel}{l.built ? ` · ${l.built}년` : ''}
        </Typography>
      </Box>
      <Typography variant="num" sx={{ fontSize: '1.1rem' }} title="월세+관리비, 보증금 1,000만원 기준 환산">
        {l.real}
        <Typography component="span" variant="overline" color="text.secondary">
          {' '}
          실부담
        </Typography>
      </Typography>
      <Box>
        <Typography variant="num" color={l.commute && l.commute > 30 ? 'primary' : 'text.primary'}>
          {l.commute ? `${l.commute}분` : '-'}
        </Typography>
        {naverTransit(l, origin) && (
          <Link
            href={naverTransit(l, origin) as string}
            target="_blank"
            rel="noopener"
            variant="overline"
            title={l.coord?.approx ? '지번이 없어 플랫폼이 흐린 위치 기준' : '네이버 지도 대중교통 길찾기(매물 → 회사)'}
            // 행 전체 링크(::after) 위에 올려 이 링크만 따로 누르게 한다
            sx={{ position: 'relative', zIndex: 1, display: 'block', lineHeight: 1.4 }}
          >
            네이버 길찾기{l.coord?.approx ? '(대략)' : ''} ↗
          </Link>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        {/* ?(대장 확인 필요)는 대장이 이 매물의 건물인지 모르므로 매물 층을 표시하지 않는다(final-review C15) */}
        {l.building && <FloorStack building={l.building} at={l.grade === '?' ? null : at} compact />}
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
            {l.note.replace(/^[^,]+, /, '')}
          </Typography>
          {l.broker?.name && (
            <Typography variant="overline" sx={{ lineHeight: 1.4, display: 'block', color: 'text.primary' }}>
              {l.broker.name}
              {l.broker.phone && (
                <>
                  {' · '}
                  {/* 행 전체 링크(::after) 위에 올려 전화 링크만 따로 누르게 한다 */}
                  <Link href={`tel:${l.broker.phone.replace(/-/g, '')}`} sx={{ position: 'relative', zIndex: 1, fontWeight: 500 }}>
                    {l.broker.phone}
                  </Link>
                </>
              )}
            </Typography>
          )}
        </Box>
      </Box>
      <Link
        href={l.url}
        target="_blank"
        rel="noopener"
        variant="body2"
        aria-label={`${l.dong} ${l.jibun ?? ''} ${l.deposit}/${l.rent} ${SRC_LABEL[l.src]} 매물 열기`}
        sx={{ fontWeight: 500, '&::after': { content: '""', position: 'absolute', inset: 0 }, '&:focus-visible': { outline: 'none' } }}
      >
        {SRC_LABEL[l.src]} ↗
      </Link>
    </Box>
  );
}

export function ShortlistSection({ d }: { d: JachwiData }) {
  const [on, setOn] = useState<Grade[]>(['○']);
  // 02 UX 원칙 4: 정렬은 실부담 오름차순 고정(판정을 여럿 골라도 섞어서 정렬)
  const rows = d.listings.filter((l) => on.includes(l.grade)).sort((a, b) => a.real - b.real);
  return (
    <Section no={5} id="shortlist" title="후보" figure={<>판정별로 골라 볼 수 있다. 정렬은 실부담 순이다.<br />출퇴근 시간은 카카오맵 대중교통 최단 경로 기준이며, 잰 곳만 나온다.</>}>
      <ToggleButtonGroup value={on} onChange={(_, v: Grade[]) => setOn(v.length ? v : on)} size="small" aria-label="판정 고르기" sx={{ flexWrap: 'wrap', mb: 2 }}>
        {d.grades.map((g) => (
          <ToggleButton key={g.key} value={g.key} aria-label={g.label}>
            {g.key} {g.label} · {g.count}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '28px 110px 1.4fr 92px 96px 1.6fr 76px', gap: 2, pb: 1, borderBottom: 2, borderColor: 'text.primary' }}>
        {['', '위치', '보증금/월세+관리비', '실부담', '출퇴근', '건축물대장', ''].map((h, i) => (
          <Typography key={i} variant="overline" color="text.secondary">
            {h}
          </Typography>
        ))}
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {rows.map((l) => (
          <ListingRow key={l.url} l={l} origin={d.origin} />
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {rows.length}건. 반지하·전입 불가 매물은 이미 뺐다. 건물 단면에서 빨간 테두리로 표시한 곳이 매물의 층이다(층이 저·중·고로만 나온 매물은 표시하지 않았다).
      </Typography>
    </Section>
  );
}

const PLAN = [
  { when: '11월 말~12월 초', what: '○ 후보에 문의하고 방문', why: '지상 몇 층인지, 실물 사진, 전입·확정일자 가능 여부, 관리비 포함 항목, 근저당' },
  { when: '12월 첫째 주', what: '계약', why: '임차인 본인 명의, 계약서상 월세 60만원 이하, 중개보수 영수증' },
  { when: '12월 20~24일', what: '이사, 세대주로 전입신고 + 확정일자', why: '이사비 영수증. 12/31 전에 전입하면 12월분 세액공제와 청약 무주택 기간이 시작된다' },
  { when: '2027년 2월', what: '연말정산: 12월분 월세 세액공제', why: '약 10만원' },
  { when: '2027년 4월·8월', what: '서울 중개보수·이사비 신청', why: '최대 40만원, 2026년은 2024-01-01 이후 이사부터 인정' },
  { when: '2027년 5월', what: '서울 청년월세 신청', why: '월 20만원×12개월, 선정제' },
  { when: '수시', what: '청년안심주택 추가모집 확인', why: '강남·서초 단지가 몇 주에 한 번씩 1~7세대를 모집' },
];

export function PlanSection() {
  return (
    <Section no={6} id="plan" title="언제 무엇을" figure={<>12월은 자격을 만드는 달,<br />돈은 2027년에 신청해서 받는다.</>}>
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {PLAN.map((p) => (
          <Box component="li" key={p.when + p.what} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '160px 1fr 1.4fr' }, gap: { xs: 0.25, md: 3 }, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="num" color="primary">
              {p.when}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {p.what}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {p.why}
            </Typography>
          </Box>
        ))}
      </Box>
    </Section>
  );
}

export function SourceNote({ d }: { d: JachwiData }) {
  const L = (href: string, t: string) => (
    <Link href={href} target="_blank" rel="noopener">
      {t}
    </Link>
  );
  return (
    <Section no={7} id="sources" title="근거와 한계">
      <Box component="ul" sx={{ pl: 2.5, m: 0, color: 'text.secondary', '& li': { mb: 1 } }}>
        <Typography component="li" variant="body2">
          매물: 네이버부동산·직방·다방·피터팬, {d.asof} 수집. 다방은 15페이지까지만 수집했고, 피터팬은 정렬이 무작위라서 누락이 있다. 당근부동산은 수집에 실패했다.
        </Typography>
        <Typography component="li" variant="body2">
          시세: 국토교통부 전월세 실거래(강남·서초·송파, 2026년 8~10월).
        </Typography>
        <Typography component="li" variant="body2">
          판정: 공공데이터포털 건축물대장 표제부·층별 개요. 위반건축물 표시는 이 API에 없으므로 계약 전에 {L('https://www.gov.kr', '정부24')}에서 열람해 확인한다.
        </Typography>
        <Typography component="li" variant="body2">
          혜택: 조세특례제한법 제95조의2, 주택임대차보호법 시행령 제10·11조, {L('https://m.bokjiro.go.kr/ssis-tem/cms/mob/customer/notice/1309500_1155.html', '복지로 청년월세')},{' '}
          {L('https://www.seoul.go.kr/news/news_notice.do?nttNo=457234', '서울 청년월세 2026 공고')}, {L('https://mediahub.seoul.go.kr/archives/2019098', '서울 중개보수·이사비')},{' '}
          {L('https://soco.seoul.go.kr/youth/bbs/BMSR00015/list.do?menuNo=400008', '청년안심주택 공고')}.
        </Typography>
        <Typography component="li" variant="body2">
          세액공제 계산은 국민연금·건강보험 요율의 근사치로 낸 추정이다. 실부담 = 월세 + 관리비 + (보증금 − 1,000) × 6% ÷ 12.
        </Typography>
      </Box>
    </Section>
  );
}
