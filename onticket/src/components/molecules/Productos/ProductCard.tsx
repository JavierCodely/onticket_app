/**
 * ProductCard Molecule
 * Card view for displaying product information
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';
import { ProfitBadge } from '@/components/atoms/ProfitBadge';
import { StockBadge } from '@/components/atoms/StockBadge';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import type { Producto } from '@/types/database/Productos';

interface ProductCardProps {
  producto: Producto;
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
  onRenewStock: (producto: Producto) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  onEdit,
  onDelete,
  onRenewStock,
}) => {
  const profitMargin = producto.precio_compra > 0
    ? ((producto.precio_venta - producto.precio_compra) / producto.precio_compra) * 100
    : 0;

  // Check if product has low stock
  const isLowStock = producto.min_stock > 0 && producto.stock <= producto.min_stock;

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 ${
      isLowStock 
        ? 'border-l-red-500 border-2 border-red-500 shadow-red-100 dark:shadow-red-900/20' 
        : 'border-l-primary'
    }`}>
      <CardHeader className="pb-3">
        <div className="text-center space-y-1">
          <h3 className="font-semibold text-lg">{producto.nombre}</h3>
          <p className="text-sm text-muted-foreground">{producto.categoria}</p>
          {isLowStock && (
            <div className="inline-block px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold mt-2">
              ¡STOCK BAJO!
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="flex gap-2 flex-wrap">
          <StockBadge stock={producto.stock} minStock={producto.min_stock} showIcon />
          <ProfitBadge
            precioCompra={producto.precio_compra}
            precioVenta={producto.precio_venta}
            showIcon
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-destructive text-destructive-foreground shadow-sm">
            <p className="text-xs font-semibold mb-1.5 opacity-90">Compra</p>
            <p className="font-bold text-xl">
              <FormattedCurrency value={producto.precio_compra} />
            </p>
          </div>
          <div className="p-3 rounded-lg bg-success text-success-foreground shadow-sm">
            <p className="text-xs font-semibold mb-1.5 opacity-90">Venta</p>
            <p className="font-bold text-xl">
              <FormattedCurrency value={producto.precio_venta} />
            </p>
          </div>
        </div>

        {profitMargin > 0 && (
          <div className="p-3 rounded-lg bg-cyan-500/20 dark:bg-cyan-500/10 border border-cyan-500/30 text-center shadow-sm">
            <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400">
              Ganancia por unidad:{' '}
              <span className="font-bold text-base text-cyan-800 dark:text-cyan-300">
                <FormattedCurrency value={producto.precio_venta - producto.precio_compra} />
              </span>
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-3 flex-col border-t">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(producto)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRenewStock(producto)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(producto)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
