/**
 * ProductStats Molecule
 * Statistics panel for product inventory overview
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import type { Producto } from '@/types/database/Productos';

interface ProductStatsProps {
  productos: Producto[];
}

export const ProductStats: React.FC<ProductStatsProps> = ({ productos }) => {
  const totalProductos = productos.length;

  // Total units in stock across all products
  const totalStock = productos.reduce((sum, p) => {
    const stock = Number(p.stock) || 0;
    return sum + stock;
  }, 0);

  // Products with low stock (1-10 units)
  const lowStockProducts = productos.filter((p) => {
    const stock = Number(p.stock) || 0;
    return stock > 0 && stock <= 10;
  }).length;

  // Products completely out of stock
  const outOfStockProducts = productos.filter((p) => {
    const stock = Number(p.stock) || 0;
    return stock === 0;
  }).length;

  // Total value of inventory at purchase price
  const totalInventoryValue = productos.reduce((sum, p) => {
    const precioCompra = Number(p.precio_compra) || 0;
    const stock = Number(p.stock) || 0;
    return sum + (precioCompra * stock);
  }, 0);

  // Total potential revenue if all stock is sold at sell price
  const potentialRevenue = productos.reduce((sum, p) => {
    const precioVenta = Number(p.precio_venta) || 0;
    const stock = Number(p.stock) || 0;
    return sum + (precioVenta * stock);
  }, 0);

  // Potential profit = Revenue - Cost
  const potentialProfit = potentialRevenue - totalInventoryValue;

  // Round to 2 decimal places to avoid floating point errors
  const roundToTwo = (num: number) => Math.round(num * 100) / 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProductos}</div>
          <p className="text-xs text-muted-foreground">
            {totalStock} unidades en stock
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${roundToTwo(totalInventoryValue).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Costo total del stock
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ganancia Potencial</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${potentialProfit >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            ${roundToTwo(potentialProfit).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Si se vende todo el stock
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas de Stock</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {outOfStockProducts + lowStockProducts}
          </div>
          <p className="text-xs text-muted-foreground">
            {outOfStockProducts} sin stock, {lowStockProducts} bajo stock
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
