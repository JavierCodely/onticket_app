/**
 * ProductTable Organism
 * Table layout for displaying products with images
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Package, RefreshCw } from 'lucide-react';
import { ProfitBadge } from '@/components/atoms/ProfitBadge';
import { StockBadge } from '@/components/atoms/StockBadge';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import { useCurrency } from '@/hooks/useCurrency';
import { getPriceForCurrency } from '@/lib/currency-utils';
import type { Producto } from '@/types/database/Productos';

interface ProductTableProps {
  productos: Producto[];
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
  onRenewStock: (producto: Producto) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  productos,
  onEdit,
  onDelete,
  onRenewStock,
}) => {
  const { defaultCurrency } = useCurrency();

  if (productos.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">No se encontraron productos</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Intenta ajustar los filtros</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[80px] font-semibold">Imagen</TableHead>
            <TableHead className="font-semibold">Nombre</TableHead>
            <TableHead className="font-semibold">Categoría</TableHead>
            <TableHead className="text-right font-semibold">P. Compra</TableHead>
            <TableHead className="text-right font-semibold">P. Venta</TableHead>
            <TableHead className="font-semibold">Ganancia</TableHead>
            <TableHead className="font-semibold">Stock</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.map((producto) => {
            // Check if product has low stock
            const isLowStock = producto.min_stock > 0 && producto.stock <= producto.min_stock;
            
            // Get prices for default currency using utility function
            const precioCompra = getPriceForCurrency(producto, defaultCurrency, 'compra');
            const precioVenta = getPriceForCurrency(producto, defaultCurrency, 'venta');
            
            return (
            <TableRow 
              key={producto.id} 
              className={`hover:bg-muted/30 transition-colors ${
                isLowStock 
                  ? 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20' 
                  : ''
              }`}
            >
              <TableCell>
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-border shadow-sm">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-foreground">
                {producto.nombre}
                {isLowStock && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                    STOCK BAJO
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {producto.categoria}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                  <span className="font-semibold text-red-700 dark:text-red-400">
                    <FormattedCurrency value={precioCompra} />
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <span className="font-bold text-green-700 dark:text-green-400">
                    <FormattedCurrency value={precioVenta} />
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <ProfitBadge
                  precioCompra={precioCompra}
                  precioVenta={precioVenta}
                />
              </TableCell>
              <TableCell>
                <StockBadge stock={producto.stock} minStock={producto.min_stock} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                    onClick={() => onEdit(producto)}
                    title="Editar producto"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-950 dark:hover:text-purple-400"
                    onClick={() => onRenewStock(producto)}
                    title="Renovar stock"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-400"
                    onClick={() => onDelete(producto)}
                    title="Eliminar producto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
