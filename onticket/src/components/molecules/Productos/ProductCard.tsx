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
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg truncate">{producto.nombre}</h3>
            <p className="text-sm text-muted-foreground">{producto.categoria}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <StockBadge stock={producto.stock} showIcon />
          <ProfitBadge
            precioCompra={producto.precio_compra}
            precioVenta={producto.precio_venta}
            showIcon
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Compra</p>
            <p className="font-semibold">${producto.precio_compra.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Venta</p>
            <p className="font-semibold text-green-600">${producto.precio_venta.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2 pt-3 flex-col">
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
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onDelete(producto)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
