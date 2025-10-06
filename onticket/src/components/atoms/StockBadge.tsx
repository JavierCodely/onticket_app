/**
 * StockBadge Atom
 * Displays stock status with color coding
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface StockBadgeProps {
  stock: number;
  showIcon?: boolean;
  lowStockThreshold?: number;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  stock,
  showIcon = false,
  lowStockThreshold = 10,
}) => {
  const getVariant = () => {
    if (stock === 0) return 'destructive'; // Red for out of stock
    if (stock <= lowStockThreshold) return 'outline'; // Yellow/warning for low stock
    return 'secondary'; // Green for good stock
  };

  const getIcon = () => {
    if (stock === 0) return <XCircle className="h-3 w-3" />;
    if (stock <= lowStockThreshold) return <AlertCircle className="h-3 w-3" />;
    return <CheckCircle className="h-3 w-3" />;
  };

  const getLabel = () => {
    if (stock === 0) return 'Sin stock';
    if (stock <= lowStockThreshold) return `Stock bajo (${stock})`;
    return `Stock: ${stock}`;
  };

  return (
    <Badge variant={getVariant()} className="gap-1">
      {showIcon && getIcon()}
      {getLabel()}
    </Badge>
  );
};
