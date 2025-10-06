/**
 * FormattedNumber Component
 * Displays numeric values formatted according to user preferences
 */

import React from 'react';
import { useNumberFormat, formatNumber, formatInteger, formatPercentage } from '@/hooks/useNumberFormat';

interface FormattedNumberProps {
  value: number;
  decimals?: number;
  type?: 'number' | 'integer' | 'percentage';
  className?: string;
}

export const FormattedNumber: React.FC<FormattedNumberProps> = ({
  value,
  decimals = 2,
  type = 'number',
  className,
}) => {
  const { format } = useNumberFormat();
  
  let formattedValue: string;
  
  switch (type) {
    case 'integer':
      formattedValue = formatInteger(value, format);
      break;
    case 'percentage':
      formattedValue = formatPercentage(value, format, decimals);
      break;
    case 'number':
    default:
      formattedValue = formatNumber(value, format, decimals);
      break;
  }
  
  return (
    <span className={className}>
      {formattedValue}
    </span>
  );
};

