'use client';
// 03 비주얼 디렉션 5절(변경 토큰 요약)을 그대로 넣은 MUI 테마. 용도 색은 palette.use 확장이다.
import { createTheme } from '@mui/material/styles';

export type UseKey = 'home' | 'shop' | 'goshi' | 'under' | 'none';

declare module '@mui/material/styles' {
  interface Palette {
    use: Record<UseKey, string>;
    useText: Record<UseKey, string>;
    stamp: string;
  }
  interface PaletteOptions {
    use?: Record<UseKey, string>;
    useText?: Record<UseKey, string>;
    stamp?: string;
  }
  interface TypographyVariants {
    num: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    num?: React.CSSProperties;
  }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    num: true;
  }
}

const DISPLAY = '"Hahmlet", "Noto Serif KR", "AppleMyungjo", serif';
const TEXT = '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'media', cssVarPrefix: 'jw' },
  colorSchemes: {
    light: {
      palette: {
        background: { default: '#F6F4EE', paper: '#FFFFFF' },
        text: { primary: '#1C1B19', secondary: '#5F5B53' },
        divider: '#D9D4C7',
        primary: { main: '#B3261E' },
        stamp: '#B3261E',
        use: { home: '#2F6B4F', shop: '#C08A2B', goshi: '#C2552B', under: '#6B7280', none: '#B3261E' },
        // 용도 칸 위 글자색. 대비 4.5:1 이상(근생 황토는 흰 글자 3.04:1이라 검은 글자, dembrandt --wcag 2026-11-19)
        useText: { home: '#FFFFFF', shop: '#1C1B19', goshi: '#FFFFFF', under: '#FFFFFF', none: '#1C1B19' },
      },
    },
    dark: {
      palette: {
        background: { default: '#15140F', paper: '#1E1C17' },
        text: { primary: '#EDE9DF', secondary: '#A8A294' },
        divider: '#3A372F',
        primary: { main: '#E0574E' },
        stamp: '#E0574E',
        use: { home: '#4E9A74', shop: '#D9A548', goshi: '#DE7148', under: '#8B93A1', none: '#E0574E' },
        useText: { home: '#1C1B19', shop: '#1C1B19', goshi: '#1C1B19', under: '#1C1B19', none: '#EDE9DF' },
      },
    },
  },
  shape: { borderRadius: 2 },
  typography: {
    fontFamily: TEXT,
    h1: { fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(2.4rem, 7vw, 4.6rem)', lineHeight: 1.05, letterSpacing: '-0.02em' },
    h2: { fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 3.4vw, 2.1rem)', lineHeight: 1.2 },
    h3: { fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.15rem', lineHeight: 1.35 },
    body1: { fontSize: '1rem', lineHeight: 1.7 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    overline: { fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.04em', lineHeight: 1.5, textTransform: 'none' },
    num: { fontFamily: TEXT, fontWeight: 500, fontVariantNumeric: 'tabular-nums' },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiTypography: { defaultProps: { variantMapping: { num: 'span' } } },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          textTransform: 'none',
          // MUI 기본 글자색 rgba(0,0,0,.54)는 팔레트 밖 값이라 보조 글자색으로 고정(dembrandt --tokens 2026-11-19)
          color: (t.vars ?? t).palette.text.secondary,
          borderColor: (t.vars ?? t).palette.divider,
          '&.Mui-selected, &.Mui-selected:hover': {
            color: (t.vars ?? t).palette.text.primary,
            backgroundColor: `color-mix(in srgb, ${(t.vars ?? t).palette.stamp} 12%, transparent)`,
          },
        }),
      },
    },
  },
});
