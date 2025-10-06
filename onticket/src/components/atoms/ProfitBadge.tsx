/**
 * ProfitBadge Atom
 * Displays profit margin percentage with color coding
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FormattedNumber } from '@/components/atoms/FormattedNumber';

interface ProfitBadgeProps {
  precioCompra: number;
  precioVenta: number;
  showIcon?: boolean;
}

export const ProfitBadge: React.FC<ProfitBadgeProps> = ({
  precioCompra,
  precioVenta,
  showIcon = false,
}) => {
  const calculateProfitMargin = () => {
    // Handle edge case: if buy price is 0, can't calculate margin
    if (precioCompra === 0 || precioCompra === null || precioCompra === undefined) {
      return 0;
    }

    // Profit Markup = ((Sell Price - Buy Price) / Buy Price) × 100
    // This shows the percentage increase over the purchase price
    // Example: Buy $1500, Sell $3000 = 100% markup (doubled the price)
    const markup = ((precioVenta - precioCompra) / precioCompra) * 100;

    // Round to 2 decimal places to avoid floating point errors
    const rounded = Math.round(markup * 100) / 100;

    return rounded;
  };

  const profitMargin = calculateProfitMargin();
  const isPositive = profitMargin > 0;
  const isZero = profitMargin === 0;

  const getVariant = () => {
    if (profitMargin >= 50) return 'default'; // Green for high profit (≥50%)
    if (profitMargin >= 20) return 'secondary'; // Gray for medium profit (20-49%)
    return 'destructive'; // Red for low/negative profit (<20%)
  };

  const getIcon = () => {
    if (isZero) return <Minus className="h-3 w-3" />;
    return isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  return (
    <Badge variant={getVariant()} className="gap-1">
      {showIcon && getIcon()}
      {profitMargin >= 0 ? '+' : ''}
      <FormattedNumber value={profitMargin} decimals={1} /> margen
    </Badge>
  );
};
