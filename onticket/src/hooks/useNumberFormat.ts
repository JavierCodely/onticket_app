/**
 * useNumberFormat Hook
 * Manages number and currency formatting preferences
 */

import { useState, useEffect } from 'react';

export type NumberFormat = 'en-US' | 'es-ES' | 'es-AR';

const STORAGE_KEY = 'number-format-preference';
const DEFAULT_FORMAT: NumberFormat = 'es-AR'; // Default to Argentine format

/**
 * Custom hook for managing number format preferences
 */
export function useNumberFormat() {
  const [format, setFormatState] = useState<NumberFormat>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'en-US' || stored === 'es-ES' || stored === 'es-AR')) {
        return stored as NumberFormat;
      }
    }
    return DEFAULT_FORMAT;
  });

  // Persist to localStorage whenever format changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, format);
    }
  }, [format]);

  const setFormat = (newFormat: NumberFormat) => {
    setFormatState(newFormat);
  };

  return { format, setFormat };
}

/**
 * Format a number according to the selected locale
 */
export function formatNumber(value: number, format: NumberFormat = 'es-AR', decimals: number = 2): string {
  return new Intl.NumberFormat(format, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format currency according to the selected locale
 */
export function formatCurrency(value: number, format: NumberFormat = 'es-AR', currency: string = 'USD'): string {
  // For Argentine format, we want to show $ instead of US$
  if (format === 'es-AR') {
    return new Intl.NumberFormat(format, {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value).replace('ARS', '$').replace(/\s/g, ' ');
  }
  
  return new Intl.NumberFormat(format, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage according to the selected locale
 */
export function formatPercentage(value: number, format: NumberFormat = 'es-AR', decimals: number = 2): string {
  return new Intl.NumberFormat(format, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format integer (no decimals) according to the selected locale
 */
export function formatInteger(value: number, format: NumberFormat = 'es-AR'): string {
  return new Intl.NumberFormat(format, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
