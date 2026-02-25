import { ReactNode, createContext, useContext, useMemo } from 'react';
import { colors, spacing, radii } from './tokens';

type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  radii: typeof radii;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      colors,
      spacing,
      radii
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}

