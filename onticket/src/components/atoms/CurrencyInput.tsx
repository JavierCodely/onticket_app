/**
 * CurrencyInput Component
 * Specialized input for currency values with formatting
 */

import React, { forwardRef } from 'react';
import { NumberInput } from './NumberInput';

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof NumberInput>, 'maxDecimals'> {
  // Currency inputs always use 2 decimals
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (props, ref) => {
    return (
      <NumberInput
        {...props}
        ref={ref}
        maxDecimals={2}
        allowNegative={false}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

