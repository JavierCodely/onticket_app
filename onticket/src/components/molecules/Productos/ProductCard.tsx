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

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-[1.02] border-t-4 border-t-primary">
      <CardHeader className="pb-3 bg-gradient-to-r from-muted/50 to-background">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg truncate">{producto.nombre}</h3>
            <p className="text-sm font-medium text-primary/70">{producto.categoria}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="flex gap-2 flex-wrap">
          <StockBadge stock={producto.stock} showIcon />
          <ProfitBadge
            precioCompra={producto.precio_compra}
            precioVenta={producto.precio_venta}
            showIcon
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Compra</p>
            <p className="font-bold text-lg text-red-700 dark:text-red-400">${producto.precio_compra.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Venta</p>
            <p className="font-bold text-lg text-green-700 dark:text-green-400">${producto.precio_venta.toFixed(2)}</p>
          </div>
        </div>

        {profitMargin > 0 && (
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-center">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Ganancia por unidad:{' '}
              <span className="font-bold text-sm">
                ${(producto.precio_venta - producto.precio_compra).toFixed(2)}
              </span>
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-3 flex-col border-t bg-muted/30">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-400"
            onClick={() => onEdit(producto)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 dark:hover:bg-purple-950 dark:hover:text-purple-400"
            onClick={() => onRenewStock(producto)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-400"
            onClick={() => onDelete(producto)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
