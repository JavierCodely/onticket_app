/**
 * FormattedCurrency Component
 * Displays currency values formatted according to user preferences
 */

import React from 'react';
import { useNumberFormat, formatCurrency } from '@/hooks/useNumberFormat';
import { useCurrency } from '@/hooks/useCurrency';
import type { CurrencyCode } from '@/types/currency';

interface FormattedCurrencyProps {
  value: number;
  className?: string;
  currency?: CurrencyCode;
}

export const FormattedCurrency: React.FC<FormattedCurrencyProps> = ({ 
  value, 
  className, 
  currency 
}) => {
  const { format } = useNumberFormat();
  const { defaultCurrency } = useCurrency();
  
  // Use provided currency or fall back to default
  const displayCurrency = currency || defaultCurrency;
  
  // Apply the appropriate currency symbol based on the currency code
  const getCurrencySymbol = (code: CurrencyCode): string => {
    switch (code) {
      case 'ARS': return '$';
      case 'USD': return 'U$S';
      case 'BRL': return 'R$';
      default: return '$';
    }
  };
  
  const symbol = getCurrencySymbol(displayCurrency);
  const formattedValue = formatCurrency(value, format).replace(/^\$/, '');
  
  return (
    <span className={className}>
      {symbol} {formattedValue}
    </span>
  );
};

