import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

const colors = {
  background: '#0F0F1A',
  backgroundVoid: '#07070D',
  surface1: '#1A1A2E',
  surface2: '#232338',
  surface3: '#2A2A3E',
  pressed: '#252538',
  overlay: 'rgba(7, 7, 13, 0.72)',

  text: '#FFFFFF',
  textSecondary: '#B7B7CC',
  textTertiary: '#888899',
  textDisabled: '#5A5A6E',
  textOnColor: '#0B0B12',

  primary: '#2EA043',
  primaryBright: '#34C75A',
  primaryDim: '#1F6B2E',

  blue: '#2563EB',
  blueBright: '#3B82F6',
  blueDim: '#1E3A8A',

  purple: '#7C3AED',
  purpleBright: '#8B5CF6',
  purpleDim: '#4C1D95',

  orange: '#EA580C',
  orangeBright: '#F97316',
  orangeDim: '#9A3412',

  red: '#DC2626',
  redBright: '#EF4444',
  redDim: '#7F1D1D',

  gold: '#F5B400',
  goldBright: '#FBBF24',
  goldDim: '#92740B',

  streak: '#F59E0B',

  border: '#2A2A3E',
  borderStrong: '#3A3A55',
  divider: '#2A2A3E',

  success: '#2EA043',
  info: '#2563EB',
  warn: '#EA580C',
  danger: '#DC2626',
  xp: '#F5B400',

  categoryPhysical: '#2EA043',
  categoryMental: '#7C3AED',
  categoryCareer: '#2563EB',
  categoryRelationships: '#DC2626',
  categoryHome: '#EA580C',

  rarityCommon: '#9CA3AF',
  rarityUncommon: '#2EA043',
  rarityRare: '#2563EB',
  rarityEpic: '#7C3AED',
  rarityLegendary: '#F5B400',
  rarityMythic: '#DC2626',
} as const;

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 9999,
} as const;

const typography = {
  fontDisplay: 'Sora',
  fontBody: 'Manrope',
  fontMono: 'JetBrains Mono',

  sizeDisplay: 44,
  sizeH1: 32,
  sizeH2: 24,
  sizeH3: 20,
  sizeH4: 18,
  sizeBody: 16,
  sizeBodySm: 14,
  sizeCaption: 12,
  sizeMicro: 11,

  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightSemi: '600' as const,
  weightBold: '700' as const,
  weightHeavy: '800' as const,
} as const;

interface ThemeContextValue {
  colors: typeof colors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      spacing,
      radii,
      typography,
      isDark: colorScheme !== 'light',
    }),
    [colorScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
