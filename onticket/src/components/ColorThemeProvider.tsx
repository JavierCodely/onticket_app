/**
 * ColorThemeProvider Component
 * Initializes and provides color theme functionality
 * Works alongside next-themes for dark mode
 */

import { createContext, useContext, useEffect, useState } from 'react';

// Conditional logging - only in development
const isDev = import.meta.env.DEV;
const log = {
  info: (...args: any[]) => isDev && console.log(...args),
};

export type ColorTheme =
  | 'red'
  | 'rose'
  | 'orange'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'violet'
  | 'slate'
  | 'stone'
  | 'zinc'
  | 'gray'
  | 'neutral';

const COLOR_THEME_STORAGE_KEY = 'color-theme';
const DEFAULT_COLOR_THEME: ColorTheme = 'green';

interface ColorThemeContextValue {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextValue | undefined>(undefined);

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error('useColorTheme must be used within ColorThemeProvider');
  }
  return context;
};

interface ColorThemeProviderProps {
  children: React.ReactNode;
}

export const ColorThemeProvider: React.FC<ColorThemeProviderProps> = ({ children }) => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY) as ColorTheme;
      return stored || DEFAULT_COLOR_THEME;
    }
    return DEFAULT_COLOR_THEME;
  });

  // Apply theme immediately on mount
  useEffect(() => {
    const root = document.documentElement;
    const themes: ColorTheme[] = [
      'red',
      'rose',
      'orange',
      'green',
      'blue',
      'yellow',
      'violet',
      'slate',
      'stone',
      'zinc',
      'gray',
      'neutral',
    ];

    // Remove all theme classes
    themes.forEach((theme) => {
      root.classList.remove(`theme-${theme}`);
    });

    // Add current theme class
    root.classList.add(`theme-${colorTheme}`);

    // Save to localStorage
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);

    log.info('🎨 [ColorThemeProvider] Applied theme:', colorTheme);
  }, [colorTheme]);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme: setColorThemeState }}>
      {children}
    </ColorThemeContext.Provider>
  );
};
