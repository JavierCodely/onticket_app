/**
 * useColorTheme Hook
 * Manages color theme selection (independent of light/dark mode)
 */

import { useEffect, useState } from 'react';

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
const DEFAULT_COLOR_THEME: ColorTheme = 'blue';

export const useColorTheme = () => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY) as ColorTheme;
      return stored || DEFAULT_COLOR_THEME;
    }
    return DEFAULT_COLOR_THEME;
  });

  useEffect(() => {
    // Apply theme class to document element
    const root = document.documentElement;

    // Remove all theme classes
    const themes: ColorTheme[] = ['red', 'rose', 'orange', 'green', 'blue', 'yellow', 'violet', 'slate', 'stone', 'zinc', 'gray', 'neutral'];
    themes.forEach(theme => {
      root.classList.remove(`theme-${theme}`);
    });

    // Add current theme class
    root.classList.add(`theme-${colorTheme}`);

    // Save to localStorage
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  return {
    colorTheme,
    setColorTheme: setColorThemeState,
  };
};
