/**
 * ProfitBadge Atom
 * Displays profit margin percentage with color coding
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FormattedNumber } from '@/components/atoms/FormattedNumber';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import type { CurrencyCode } from '@/types/currency';

interface ProfitBadgePropsWithPrices {
  precioCompra: number;
  precioVenta: number;
  showIcon?: boolean;
  profit?: never;
  profitPercentage?: never;
  currency?: never;
}

interface ProfitBadgePropsWithProfit {
  profit: number;
  profitPercentage: number;
  currency: CurrencyCode;
  showIcon?: boolean;
  label?: string;
  colorScheme?: 'discount' | 'profit';
  precioCompra?: never;
  precioVenta?: never;
}

type ProfitBadgeProps = ProfitBadgePropsWithPrices | ProfitBadgePropsWithProfit;

export const ProfitBadge: React.FC<ProfitBadgeProps> = (props) => {
  const { showIcon = false } = props;

  let profitMargin: number;
  let profitAmount: number | undefined;
  let currency: CurrencyCode | undefined;
  let label = 'Ganancia';
  let colorScheme: 'discount' | 'profit' = 'profit';

  // Determine if using prices or direct profit values
  if ('precioCompra' in props && props.precioCompra !== undefined) {
    // Calculate profit margin from prices
    const { precioCompra, precioVenta } = props;

    if (precioCompra === 0 || precioCompra === null || precioCompra === undefined) {
      profitMargin = 0;
    } else {
      const markup = ((precioVenta - precioCompra) / precioCompra) * 100;
      profitMargin = Math.round(markup * 100) / 100;
    }
  } else {
    // Use direct profit values
    profitMargin = props.profitPercentage;
    profitAmount = props.profit;
    currency = props.currency;
    label = props.label || 'Ganancia';
    colorScheme = props.colorScheme || 'profit';
  }

  const isPositive = profitMargin > 0;
  const isZero = profitMargin === 0;

  const getVariant = () => {
    if (colorScheme === 'discount') {
      // Custom colors for discount
      // 0-30%: Green, 31-49%: Purple, 50%+: Gold
      return 'default'; // We'll use custom classes instead
    }

    // Default profit colors
    if (profitMargin >= 50) return 'default'; // Green for high profit (≥50%)
    if (profitMargin >= 20) return 'secondary'; // Gray for medium profit (20-49%)
    return 'destructive'; // Red for low/negative profit (<20%)
  };

  const getDiscountColorClass = () => {
    if (colorScheme !== 'discount') return '';

    if (profitMargin >= 50) {
      // Gold for 50%+
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-600';
    } else if (profitMargin >= 31) {
      // Purple neon for 31-49%
      return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-600';
    } else if (profitMargin >= 0) {
      // Green for 0-30%
      return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600';
    }

    // Negative discount (shouldn't happen, but handle it)
    return 'bg-red-500 text-white border-red-600';
  };

  const getIcon = () => {
    if (isZero) return <Minus className="h-3 w-3" />;
    return isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  return (
    <div className="flex flex-col gap-1">
      {profitAmount !== undefined && currency && (
        <div className="text-sm flex items-center justify-between">
          <span className="text-muted-foreground">{label}:</span>
          <FormattedCurrency
            value={profitAmount}
            currency={currency}
            className="font-mono font-semibold text-primary text-lg"
          />
        </div>
      )}
      {colorScheme === 'discount' ? (
        <Badge className={`gap-1 w-fit text-base ${getDiscountColorClass()}`}>
          {showIcon && getIcon()}
          {profitMargin >= 0 ? '+' : ''}
          <FormattedNumber value={profitMargin} decimals={1} />% {label.toLowerCase()}
        </Badge>
      ) : (
        <Badge variant={getVariant()} className="gap-1 w-fit text-base">
          {showIcon && getIcon()}
          {profitMargin >= 0 ? '+' : ''}
          <FormattedNumber value={profitMargin} decimals={1} />% {label.toLowerCase()}
        </Badge>
      )}
    </div>
  );
};
