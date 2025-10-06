/**
 * ProductStats Molecule
 * Statistics panel for product inventory overview
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertCircle, DollarSign, Percent } from 'lucide-react';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import { FormattedNumber } from '@/components/atoms/FormattedNumber';
import { useCurrency } from '@/hooks/useCurrency';
import { calculateProductStats } from '@/lib/currency-utils';
import type { Producto } from '@/types/database/Productos';

interface ProductStatsProps {
  productos: Producto[];
}

export const ProductStats: React.FC<ProductStatsProps> = ({ productos }) => {
  const { defaultCurrency } = useCurrency();
  
  // Calculate all stats based on default currency
  const stats = calculateProductStats(productos, defaultCurrency);

  // Total units in stock across all products
  const totalStock = productos.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

  // Products completely out of stock
  const outOfStockProducts = productos.filter((p) => (Number(p.stock) || 0) === 0).length;

  // Calculate total profit margin percentage based on inventory
  const totalProfitMarginPercentage = stats.totalInventoryValue > 0
    ? (stats.totalPotentialProfit / stats.totalInventoryValue) * 100
    : 0;

  // Round to 2 decimal places to avoid floating point errors
  const roundToTwo = (num: number) => Math.round(num * 100) / 100;

  const totalAlerts = outOfStockProducts + stats.lowStockCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* Total Products Card */}
      <Card className="border-l-4 border-l-primary bg-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-primary">Total Productos</CardTitle>
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalProducts}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {totalStock} unidades en stock
          </p>
        </CardContent>
      </Card>

      {/* Inventory Value Card */}
      <Card className="border-l-4 border-l-purple-500 bg-purple-500/10 dark:bg-purple-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-400">Valor Inventario</CardTitle>
          <div className="h-10 w-10 rounded-full bg-purple-500 text-white flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
            <FormattedCurrency value={roundToTwo(stats.totalInventoryValue)} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Costo total del stock
          </p>
        </CardContent>
      </Card>

      {/* Potential Profit Card */}
      <Card className={`border-l-4 ${stats.totalPotentialProfit >= 0 ? 'border-l-success bg-success/10' : 'border-l-destructive bg-destructive/10'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-semibold ${stats.totalPotentialProfit >= 0 ? 'text-success' : 'text-destructive'}`}>Ganancia Potencial</CardTitle>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stats.totalPotentialProfit >= 0 ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
            <TrendingUp className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${stats.totalPotentialProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            <FormattedCurrency value={roundToTwo(stats.totalPotentialProfit)} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Si se vende todo el stock
          </p>
        </CardContent>
      </Card>

      {/* Profit Margin Percentage Card */}
      <Card className={`border-l-4 ${totalProfitMarginPercentage >= 0 ? 'border-l-blue-500 bg-blue-500/10' : 'border-l-orange-500 bg-orange-500/10'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-semibold ${totalProfitMarginPercentage >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
            Margen de Ganancia
          </CardTitle>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${totalProfitMarginPercentage >= 0 ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
            <Percent className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${totalProfitMarginPercentage >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
            <FormattedNumber value={roundToTwo(totalProfitMarginPercentage)} type="percentage" />
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Sobre el inventario total
          </p>
        </CardContent>
      </Card>

      {/* Stock Alerts Card */}
      <Card className={`border-l-4 ${totalAlerts > 0 ? 'border-l-destructive bg-destructive/10' : 'border-l-muted bg-muted/10'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-semibold ${totalAlerts > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>Alertas de Stock</CardTitle>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${totalAlerts > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${totalAlerts > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {totalAlerts}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            <span className={outOfStockProducts > 0 ? 'text-destructive font-semibold' : ''}>
              {outOfStockProducts} sin stock
            </span>
            {', '}
            <span className={stats.lowStockCount > 0 ? 'text-destructive/70 font-semibold' : ''}>
              {stats.lowStockCount} bajo stock
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
