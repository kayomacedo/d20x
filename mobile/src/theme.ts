import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';

export type ThemeId = 'slate' | 'forest' | 'crimson' | 'violet' | 'parchment';

export type ThemeColors = {
  bg: string;
  page: string;
  surface: string;
  surfaceMuted: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  indigo: string;
  indigoStrong: string;
  amber: string;
  amberBorder: string;
  emerald: string;
  emeraldStrong: string;
  red: string;
  redStrong: string;
  white: string;
  onAccent: string;
  keypad: string;
  keypadAlt: string;
  badgeNeutral: string;
  badgeNeutralText: string;
  placeholder: string;
  chip: string;
};

export type ThemeDef = {
  id: ThemeId;
  name: string;
  hint: string;
  statusBar: 'light' | 'dark';
  colors: ThemeColors;
};

export const THEMES: Record<ThemeId, ThemeDef> = {
  slate: {
    id: 'slate',
    name: 'Noite',
    hint: 'Azul escuro clássico',
    statusBar: 'light',
    colors: {
      bg: '#0f172a',
      page: '#020617',
      surface: '#020617',
      surfaceMuted: '#02061799',
      card: '#020617',
      border: '#1e293b',
      text: '#f1f5f9',
      muted: '#94a3b8',
      faint: '#64748b',
      indigo: '#a5b4fc',
      indigoStrong: '#6366f1',
      amber: '#fcd34d',
      amberBorder: '#92400e80',
      emerald: '#34d399',
      emeraldStrong: '#10b981',
      red: '#f87171',
      redStrong: '#dc2626',
      white: '#ffffff',
      onAccent: '#ffffff',
      keypad: '#0f172a',
      keypadAlt: '#1e293b',
      badgeNeutral: '#e2e8f0',
      badgeNeutralText: '#0f172a',
      placeholder: '#475569',
      chip: '#0f172a',
    },
  },
  forest: {
    id: 'forest',
    name: 'Floresta',
    hint: 'Verde de taverna e druidas',
    statusBar: 'light',
    colors: {
      bg: '#10231a',
      page: '#07130e',
      surface: '#0a1812',
      surfaceMuted: '#0a181299',
      card: '#0c1c15',
      border: '#1d3a2c',
      text: '#ecfdf3',
      muted: '#86a897',
      faint: '#5c7a6c',
      indigo: '#6ee7b7',
      indigoStrong: '#059669',
      amber: '#fbbf24',
      amberBorder: '#854d1080',
      emerald: '#34d399',
      emeraldStrong: '#10b981',
      red: '#fb7185',
      redStrong: '#be123c',
      white: '#f8fafc',
      onAccent: '#ecfdf5',
      keypad: '#12261c',
      keypadAlt: '#1a3a2a',
      badgeNeutral: '#d1fae5',
      badgeNeutralText: '#064e3b',
      placeholder: '#4b6b5a',
      chip: '#12261c',
    },
  },
  crimson: {
    id: 'crimson',
    name: 'Carmesim',
    hint: 'Vermelho de warlock',
    statusBar: 'light',
    colors: {
      bg: '#1c1014',
      page: '#0c0709',
      surface: '#14090c',
      surfaceMuted: '#14090c99',
      card: '#1a0c10',
      border: '#3f1d27',
      text: '#fff1f2',
      muted: '#d4a5af',
      faint: '#9f6d78',
      indigo: '#fda4af',
      indigoStrong: '#e11d48',
      amber: '#fbbf24',
      amberBorder: '#9a341280',
      emerald: '#4ade80',
      emeraldStrong: '#16a34a',
      red: '#fb7185',
      redStrong: '#be123c',
      white: '#fff7ed',
      onAccent: '#fff1f2',
      keypad: '#241016',
      keypadAlt: '#3f1d27',
      badgeNeutral: '#ffe4e6',
      badgeNeutralText: '#4c0519',
      placeholder: '#70414c',
      chip: '#241016',
    },
  },
  violet: {
    id: 'violet',
    name: 'Arcano',
    hint: 'Roxo de mago',
    statusBar: 'light',
    colors: {
      bg: '#16121f',
      page: '#0b0810',
      surface: '#100c18',
      surfaceMuted: '#100c1899',
      card: '#161022',
      border: '#2e2444',
      text: '#f5f3ff',
      muted: '#c4b5fd',
      faint: '#8b7aa8',
      indigo: '#c4b5fd',
      indigoStrong: '#7c3aed',
      amber: '#fbbf24',
      amberBorder: '#854d1080',
      emerald: '#5eead4',
      emeraldStrong: '#0d9488',
      red: '#f472b6',
      redStrong: '#be185d',
      white: '#faf5ff',
      onAccent: '#faf5ff',
      keypad: '#1b1528',
      keypadAlt: '#2e2444',
      badgeNeutral: '#ede9fe',
      badgeNeutralText: '#2e1065',
      placeholder: '#6b5f86',
      chip: '#1b1528',
    },
  },
  parchment: {
    id: 'parchment',
    name: 'Pergaminho',
    hint: 'Claro, mesa de taverna',
    statusBar: 'dark',
    colors: {
      bg: '#f3e6c8',
      page: '#e8d4a8',
      surface: '#faf3e3',
      surfaceMuted: '#efe0beaa',
      card: '#fff8e8',
      border: '#d6c4a0',
      text: '#3f2f1c',
      muted: '#7a6548',
      faint: '#9a8460',
      indigo: '#9a4b14',
      indigoStrong: '#b45309',
      amber: '#b45309',
      amberBorder: '#b4530980',
      emerald: '#3f6b4b',
      emeraldStrong: '#3f6b4b',
      red: '#9f1239',
      redStrong: '#9f1239',
      white: '#3f2f1c',
      onAccent: '#fff7ed',
      keypad: '#efe0be',
      keypadAlt: '#e6d3a6',
      badgeNeutral: '#3f2f1c',
      badgeNeutralText: '#faf3e3',
      placeholder: '#a38b62',
      chip: '#efe0be',
    },
  },
};

export const THEME_LIST = Object.values(THEMES);

export const colors = THEMES.slate.colors;

export const radius = {
  md: 10,
  lg: 12,
  xl: 14,
};

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEMES;
}

type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemeDef;
  colors: ThemeColors;
  statusBar: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'slate',
  theme: THEMES.slate,
  colors: THEMES.slate.colors,
  statusBar: 'light',
});

export function ThemeProvider({ themeId, children }: { themeId: ThemeId; children: ReactNode }) {
  const theme = THEMES[themeId] ?? THEMES.slate;
  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId: theme.id,
      theme,
      colors: theme.colors,
      statusBar: theme.statusBar,
    }),
    [theme],
  );
  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemedStyles(factory: (palette: ThemeColors) => Record<string, unknown>): any {
  const { colors: palette } = useTheme();
  return useMemo(
    () => StyleSheet.create(factory(palette) as StyleSheet.NamedStyles<any>),
    [palette, factory],
  );
}

export function useLayoutScale() {
  const { width, height } = useWindowDimensions();
  const compact = width < 390 || height < 740;

  return {
    width,
    height,
    compact,
    screenPad: compact ? 10 : 12,
    keyPadV: compact ? 8 : 10,
    inputSize: compact ? 20 : 22,
    totalSize: compact ? 28 : 32,
    titleSize: compact ? 14 : 16,
  };
}

export function webPageStyle(palette: ThemeColors): ViewStyle {
  return {
    flex: 1,
    minHeight: '100%',
    backgroundColor: palette.page,
    alignItems: 'center',
  };
}

export function webFrameStyle(palette: ThemeColors): ViewStyle {
  return {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    minHeight: '100%',
    backgroundColor: palette.bg,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: palette.border,
  };
}
