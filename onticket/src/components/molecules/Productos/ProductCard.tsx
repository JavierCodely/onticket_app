/**
 * ProductCard Molecule
 * Card view for displaying product information
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, Trash2, RefreshCw, ImageIcon } from 'lucide-react';
import { ProfitBadge } from '@/components/atoms/ProfitBadge';
import { StockBadge } from '@/components/atoms/StockBadge';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import { useCurrency } from '@/hooks/useCurrency';
import { getPriceForCurrency, calculateProfitMargin } from '@/lib/currency-utils';
import { getCategoryBadgeClass } from '@/lib/category-colors';
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
  const { defaultCurrency } = useCurrency();

  // Get prices based on default currency
  const precioCompra = getPriceForCurrency(producto, defaultCurrency, 'compra');
  const precioVenta = getPriceForCurrency(producto, defaultCurrency, 'venta');
  const profitMargin = calculateProfitMargin(precioCompra, precioVenta);

  // Check if product has low stock
  const isLowStock = producto.min_stock > 0 && producto.stock <= producto.min_stock;

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 ${
      isLowStock 
        ? 'border-l-red-500 border-2 border-red-500 shadow-red-100 dark:shadow-red-900/20' 
        : 'border-l-primary'
    }`}>
      {/* Header - Más compacto */}
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="text-center space-y-1">
          <h3 className="font-semibold text-base leading-tight">{producto.nombre}</h3>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className={getCategoryBadgeClass(producto.categoria)}>
              {producto.categoria}
            </span>
            {isLowStock && (
              <span className="inline-block px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold">
                ¡STOCK BAJO!
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content - Información compacta */}
      <CardContent className="space-y-2 py-2 px-3">
        {/* Imagen del producto - Arriba */}
        <div className="flex justify-center pb-1">
          <Avatar className="h-20 w-20 rounded-md">
            {producto.imagen_url ? (
              <AvatarImage src={producto.imagen_url} alt={producto.nombre} className="object-cover" />
            ) : (
              <AvatarFallback className="rounded-md bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        {/* Badges de Stock y Ganancia */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          <StockBadge stock={producto.stock} minStock={producto.min_stock} showIcon />
          <ProfitBadge
            precioCompra={precioCompra}
            precioVenta={precioVenta}
            showIcon
          />
        </div>

        {/* Precios - Más compactos */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-md bg-destructive text-destructive-foreground">
            <p className="text-[10px] font-semibold mb-0.5 opacity-90">Compra</p>
            <p className="font-bold text-sm">
              <FormattedCurrency value={precioCompra} />
            </p>
          </div>
          <div className="p-2 rounded-md bg-success text-success-foreground">
            <p className="text-[10px] font-semibold mb-0.5 opacity-90">Venta</p>
            <p className="font-bold text-sm">
              <FormattedCurrency value={precioVenta} />
            </p>
          </div>
        </div>

        {/* Ganancia - Más compacta */}
        {profitMargin > 0 && (
          <div className="p-1.5 rounded-md bg-cyan-500/20 dark:bg-cyan-500/10 border border-cyan-500/30 text-center">
            <p className="text-[10px] font-medium text-cyan-700 dark:text-cyan-400">
              Ganancia:{' '}
              <span className="font-bold text-xs text-cyan-800 dark:text-cyan-300">
                <FormattedCurrency value={precioVenta - precioCompra} />
              </span>
            </p>
          </div>
        )}
      </CardContent>

      {/* Footer - Botones más compactos */}
      <CardFooter className="gap-1.5 pt-2 pb-2 px-3 border-t flex-col">
        <div className="flex gap-1.5 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onEdit(producto)}
          >
            <Pencil className="h-3 w-3 mr-1.5" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => onRenewStock(producto)}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => onDelete(producto)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
