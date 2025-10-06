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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3 bg-primary text-primary-foreground">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg truncate">{producto.nombre}</h3>
            <p className="text-sm font-medium opacity-90">{producto.categoria}</p>
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
          <div className="p-3 rounded-lg bg-destructive text-destructive-foreground shadow-sm">
            <p className="text-xs font-semibold mb-1.5 opacity-90">Compra</p>
            <p className="font-bold text-xl">${producto.precio_compra.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-success text-success-foreground shadow-sm">
            <p className="text-xs font-semibold mb-1.5 opacity-90">Venta</p>
            <p className="font-bold text-xl">${producto.precio_venta.toFixed(2)}</p>
          </div>
        </div>

        {profitMargin > 0 && (
          <div className="p-3 rounded-lg bg-secondary text-secondary-foreground text-center shadow-sm">
            <p className="text-xs font-medium opacity-90">
              Ganancia por unidad:{' '}
              <span className="font-bold text-base">
                ${(producto.precio_venta - producto.precio_compra).toFixed(2)}
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
