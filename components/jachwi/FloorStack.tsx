'use client';
// 건물 층을 용도 색으로 쌓고 매물 층을 표시한다(02 UX 4절 원칙 2: 판정은 언제나 건물 단면으로).
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Building } from './types';
import type { UseKey } from './theme';

export const USE_LABEL: Record<UseKey, string> = {
  home: '주거',
  shop: '근생(상가·사무실)',
  goshi: '고시원',
  under: '지하 주거',
  none: '대장에 없음',
};

type Props = {
  building: Building;
  /** 매물이 있는 층(지하 -1). 모르면 null */
  at: number | null;
  compact?: boolean;
  title?: string;
};

export function FloorStack({ building, at, compact = false, title }: Props) {
  if (!building || !building.floors.length) {
    return (
      <Typography variant="overline" color="text.secondary">
        건축물대장 층 정보 없음
      </Typography>
    );
  }
  const floors = [...building.floors];
  const top = Math.max(...floors.map((f) => (f.n === 99 ? 0 : f.n)));
  // 매물 층이 대장에 없으면 빈 층(빗금)을 위에 더한다
  const phantom = at !== null && at > top && !floors.some((f) => f.n === at);
  const rows = [...(phantom ? [{ n: at as number, use: 'none' as UseKey, label: '대장에 없는 층' }] : []), ...floors.sort((a, b) => b.n - a.n)];
  const h = compact ? 5 : 30;
  return (
    <Box
      component="figure"
      sx={{ m: 0, display: 'grid', gap: compact ? '1px' : '3px', width: compact ? 36 : '100%', maxWidth: 360, flexShrink: 0 }}
      aria-label={title ?? `건물 단면: 지상 ${building.ground}층, 지하 ${building.under}층`}
    >
      {rows.map((f) => {
        const here = at !== null && f.n === at;
        const name = f.n === 99 ? '옥탑' : f.n < 0 ? `지하${-f.n}` : `${f.n}층`;
        return (
          <Box key={`${f.n}-${f.label}`} sx={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '52px 1fr', alignItems: 'center', gap: compact ? 0 : 1 }}>
            {!compact && (
              <Typography variant="overline" color={here ? 'primary' : 'text.secondary'} sx={{ textAlign: 'right', fontWeight: here ? 700 : 500 }}>
                {name}
              </Typography>
            )}
            <Box
              title={`${name}: ${f.label || USE_LABEL[f.use]}`}
              sx={(t) => ({
                height: h,
                px: compact ? 0 : 1,
                display: 'flex',
                alignItems: 'center',
                color: (t.vars ?? t).palette.useText[f.use],
                fontSize: 12,
                background:
                  f.use === 'none'
                    ? `repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, ${(t.vars ?? t).palette.use.none} 35%, transparent) 6px 8px)`
                    : (t.vars ?? t).palette.use[f.use],
                border: here && !compact ? `2px solid ${(t.vars ?? t).palette.text.primary}` : f.use === 'none' ? `1px dashed ${(t.vars ?? t).palette.use.none}` : 'none',
                outline: here ? `${compact ? 2 : 3}px solid ${(t.vars ?? t).palette.stamp}` : 'none',
                outlineOffset: compact ? 1 : 2,
                opacity: f.n < 0 && f.use !== 'under' ? 0.75 : 1,
              })}
            >
              {!compact && (
                <Box component="span" sx={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: f.use === 'none' ? 700 : 500 }}>
                  {here ? '◀ 이 방 · ' : ''}
                  {f.label || USE_LABEL[f.use]}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
      <Box sx={{ height: compact ? 1 : 2, bgcolor: 'text.primary', ml: compact ? 0 : '60px' }} aria-hidden />
    </Box>
  );
}

export function UseLegend() {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {(Object.keys(USE_LABEL) as UseKey[]).map((k) => (
        <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={(t) => ({
              width: 14,
              height: 14,
              background: k === 'none' ? `repeating-linear-gradient(135deg, transparent 0 3px, ${(t.vars ?? t).palette.use.none} 3px 5px)` : (t.vars ?? t).palette.use[k],
              border: k === 'none' ? `1px dashed ${(t.vars ?? t).palette.use.none}` : 'none',
            })}
          />
          <Typography variant="overline" color="text.secondary">
            {USE_LABEL[k]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
