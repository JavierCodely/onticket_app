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

  // Total value of inventory at purchase price (costo de todo el stock)
  const totalInventoryValue = productos.reduce((sum, p) => {
    const precioCompra = Number(p.precio_compra) || 0;
    const stock = Number(p.stock) || 0;
    const value = precioCompra * stock;
    return sum + value;
  }, 0);

  // Total potential revenue if all stock is sold at sell price (ingreso si se vende todo)
  const potentialRevenue = productos.reduce((sum, p) => {
    const precioVenta = Number(p.precio_venta) || 0;
    const stock = Number(p.stock) || 0;
    const revenue = precioVenta * stock;
    return sum + revenue;
  }, 0);

  // Potential profit = Revenue - Cost (ganancia = ingreso - costo)
  const potentialProfit = potentialRevenue - totalInventoryValue;

  // Round to 2 decimal places to avoid floating point errors
  const roundToTwo = (num: number) => Math.round(num * 100) / 100;

  // Debug: Log calculations
  console.log('[ProductStats] Calculation details:', {
    totalProducts: totalProductos,
    totalUnits: totalStock,
    totalInventoryCost: roundToTwo(totalInventoryValue),
    totalPotentialRevenue: roundToTwo(potentialRevenue),
    totalPotentialProfit: roundToTwo(potentialProfit),
    productDetails: productos.map(p => ({
      name: p.nombre,
      stock: p.stock,
      buyPrice: p.precio_compra,
      sellPrice: p.precio_venta,
      inventoryValue: p.precio_compra * p.stock,
      potentialRevenue: p.precio_venta * p.stock,
      profit: (p.precio_venta * p.stock) - (p.precio_compra * p.stock)
    }))
  });

  const totalAlerts = outOfStockProducts + lowStockProducts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Products Card */}
      <Card className="border-l-4 border-l-primary bg-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-primary">Total Productos</CardTitle>
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{totalProductos}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {totalStock} unidades en stock
          </p>
        </CardContent>
      </Card>

      {/* Inventory Value Card */}
      <Card className="border-l-4 border-l-secondary bg-secondary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-secondary-foreground">Valor Inventario</CardTitle>
          <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-secondary-foreground">
            ${roundToTwo(totalInventoryValue).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Costo total del stock
          </p>
        </CardContent>
      </Card>

      {/* Potential Profit Card */}
      <Card className={`border-l-4 ${potentialProfit >= 0 ? 'border-l-success bg-success/10' : 'border-l-destructive bg-destructive/10'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-semibold ${potentialProfit >= 0 ? 'text-success' : 'text-destructive'}`}>Ganancia Potencial</CardTitle>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${potentialProfit >= 0 ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
            <TrendingUp className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${potentialProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${roundToTwo(potentialProfit).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Si se vende todo el stock
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
            <span className={lowStockProducts > 0 ? 'text-destructive/70 font-semibold' : ''}>
              {lowStockProducts} bajo stock
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
