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
  const getStyles = () => {
    if (stock === 0) {
      return {
        className: 'bg-red-100 text-red-800 border-red-400 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Sin stock'
      };
    }
    if (stock <= lowStockThreshold) {
      return {
        className: 'bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800',
        icon: <AlertCircle className="h-3 w-3" />,
        label: `Stock bajo (${stock})`
      };
    }
    return {
      className: 'bg-green-100 text-green-800 border-green-400 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
      icon: <CheckCircle className="h-3 w-3" />,
      label: `Stock: ${stock}`
    };
  };

  const styles = getStyles();

  return (
    <Badge className={`gap-1 border font-medium ${styles.className}`}>
      {showIcon && styles.icon}
      {styles.label}
    </Badge>
  );
};
