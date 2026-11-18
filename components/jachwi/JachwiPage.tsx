'use client';
// 02 UX 2.2 계층 트리의 최상위. 섹션 순서는 시나리오(02 UX 1절)를 따른다.
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { CostSection, FunnelSection, Hero, MarketSection, PlanSection, ShortlistSection, SourceNote, TrapSection } from './sections';
import type { JachwiData } from './types';

export function JachwiPage({ d }: { d: JachwiData }) {
  return (
    <ThemeProvider theme={theme}>
      {/* 공용 lab.css의 파란 종이 바탕이 MUI 영역 밖으로 비치지 않게 이 페이지만 덮는다(dembrandt 2026-11-19) */}
      <GlobalStyles styles={(t) => ({ 'html, body': { background: (t.vars ?? t).palette.background.default, color: (t.vars ?? t).palette.text.primary, margin: 0 } })} />
      <ScopedCssBaseline sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        <Box component="main" sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: 10 }}>
          <Hero d={d} />
          <MarketSection d={d} />
          <FunnelSection d={d} />
          <TrapSection d={d} />
          <CostSection d={d} />
          <ShortlistSection d={d} />
          <PlanSection />
          <SourceNote d={d} />
        </Box>
      </ScopedCssBaseline>
    </ThemeProvider>
  );
}
