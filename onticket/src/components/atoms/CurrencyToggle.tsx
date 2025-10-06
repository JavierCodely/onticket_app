/**
 * CurrencyToggle Component
 * Toggle buttons for selecting active currencies
 */

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CURRENCIES, type CurrencyCode } from '@/types/currency';
import { cn } from '@/lib/utils';

interface CurrencyToggleProps {
  value: CurrencyCode[];
  onChange: (currencies: CurrencyCode[]) => void;
  disabled?: boolean;
  className?: string;
}

export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const handleValueChange = (newValue: string[]) => {
    // Ensure at least one currency is selected
    if (newValue.length === 0) return;
    onChange(newValue as CurrencyCode[]);
  };

  return (
    <ToggleGroup
      type="multiple"
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
      className={cn("justify-start gap-2", className)}
    >
      {Object.values(CURRENCIES).map((currency) => (
        <ToggleGroupItem
          key={currency.code}
          value={currency.code}
          aria-label={`Toggle ${currency.name}`}
          className={cn(
            "flex items-center gap-2 px-4 py-2 border-2",
            value.includes(currency.code)
              ? "bg-primary/10 border-primary text-primary hover:bg-primary/20"
              : "border-border hover:bg-muted"
          )}
        >
          <span className="text-xl">{currency.flag}</span>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm">{currency.code}</span>
            <span className="text-xs opacity-75">{currency.symbol}</span>
          </div>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

