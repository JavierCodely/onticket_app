/**
 * NumberInput Component
 * Input field that handles number formatting according to user's locale preference
 * Supports Argentine (1.234,56), Spanish (1.234,56), and US (1,234.56) formats
 */

import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { useNumberFormat, type NumberFormat } from '@/hooks/useNumberFormat';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value?: number | string;
  onChange?: (value: number | null) => void;
  allowNegative?: boolean;
  maxDecimals?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, allowNegative = false, maxDecimals = 2, ...props }, ref) => {
    const { format } = useNumberFormat();
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Get separators based on format
    const getSeparators = (fmt: NumberFormat) => {
      if (fmt === 'en-US') {
        return { thousand: ',', decimal: '.' };
      }
      // Both es-AR and es-ES use the same separators
      return { thousand: '.', decimal: ',' };
    };

    const separators = getSeparators(format);

    // Convert display string to number
    const parseDisplayValue = (str: string): number | null => {
      if (!str || str === '' || str === '-') return null;

      // Remove thousand separators and replace decimal separator with '.'
      let cleaned = str.replace(new RegExp(`\\${separators.thousand}`, 'g'), '');
      cleaned = cleaned.replace(separators.decimal, '.');

      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    };

    // Convert number to display string
    const formatDisplayValue = (num: number | string | undefined, focused: boolean): string => {
      if (num === undefined || num === null || num === '') return '';

      const numValue = typeof num === 'string' ? parseFloat(num) : num;
      if (isNaN(numValue)) return '';

      // When focused, show minimal formatting for easier editing
      if (focused) {
        const str = numValue.toString();
        // Just replace decimal point with the locale's decimal separator
        return str.replace('.', separators.decimal);
      }

      // When not focused, show full formatting with thousand separators
      const parts = numValue.toFixed(maxDecimals).split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];

      // Add thousand separators
      const withSeparators = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separators.thousand);

      if (maxDecimals > 0 && decimalPart) {
        return `${withSeparators}${separators.decimal}${decimalPart}`;
      }

      return withSeparators;
    };

    // Update display value when external value changes
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatDisplayValue(value, false));
      }
    }, [value, format, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Allow empty string
      if (input === '') {
        setDisplayValue('');
        onChange?.(null);
        return;
      }

      // Allow minus sign at start if negative numbers are allowed
      if (allowNegative && input === '-') {
        setDisplayValue('-');
        return;
      }

      // Only allow valid characters based on format
      const validChars = allowNegative
        ? `0-9\\${separators.thousand}\\${separators.decimal}-`
        : `0-9\\${separators.thousand}\\${separators.decimal}`;
      
      const regex = new RegExp(`^[${validChars}]+$`);
      
      if (!regex.test(input)) {
        return; // Reject invalid characters
      }

      // Count decimal separators - only allow one
      const decimalCount = (input.match(new RegExp(`\\${separators.decimal}`, 'g')) || []).length;
      if (decimalCount > 1) return;

      // Check decimal places limit
      const parts = input.split(separators.decimal);
      if (parts[1] && parts[1].length > maxDecimals) {
        return; // Reject if exceeds max decimals
      }

      setDisplayValue(input);

      // Parse and call onChange
      const numValue = parseDisplayValue(input);
      onChange?.(numValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Reformat to focused state (minimal formatting)
      const numValue = parseDisplayValue(displayValue);
      if (numValue !== null) {
        // If value is 0, clear the input for easier typing
        if (numValue === 0) {
          setDisplayValue('');
          // Select all text to make it easy to replace
          setTimeout(() => {
            e.target.select();
          }, 0);
        } else {
          setDisplayValue(formatDisplayValue(numValue, true));
        }
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Reformat to full formatting
      const numValue = parseDisplayValue(displayValue);
      if (numValue !== null) {
        setDisplayValue(formatDisplayValue(numValue, false));
      }
      props.onBlur?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';

