/**
 * useCurrency Hook
 * Manages default currency preference
 */

import { useState, useEffect } from 'react';
import type { CurrencyCode } from '@/types/currency';

const STORAGE_KEY = 'default-currency-preference';
const DEFAULT_CURRENCY: CurrencyCode = 'ARS';

/**
 * Custom hook for managing default currency preference
 */
export function useCurrency() {
  const [defaultCurrency, setDefaultCurrencyState] = useState<CurrencyCode>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'ARS' || stored === 'USD' || stored === 'BRL')) {
        return stored as CurrencyCode;
      }
    }
    return DEFAULT_CURRENCY;
  });

  // Persist to localStorage whenever currency changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, defaultCurrency);
    }
  }, [defaultCurrency]);

  const setDefaultCurrency = (currency: CurrencyCode) => {
    setDefaultCurrencyState(currency);
  };

  return { defaultCurrency, setDefaultCurrency };
}

