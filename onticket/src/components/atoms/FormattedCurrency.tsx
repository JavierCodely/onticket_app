/**
 * FormattedCurrency Component
 * Displays currency values formatted according to user preferences
 */

import React from 'react';
import { useNumberFormat, formatCurrency } from '@/hooks/useNumberFormat';

interface FormattedCurrencyProps {
  value: number;
  className?: string;
}

export const FormattedCurrency: React.FC<FormattedCurrencyProps> = ({ value, className }) => {
  const { format } = useNumberFormat();
  
  return (
    <span className={className}>
      {formatCurrency(value, format)}
    </span>
  );
};

