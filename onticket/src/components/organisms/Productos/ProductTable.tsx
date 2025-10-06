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
  if (productos.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Imagen</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">P. Compra</TableHead>
            <TableHead className="text-right">P. Venta</TableHead>
            <TableHead>Ganancia</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.map((producto) => (
            <TableRow key={producto.id}>
              <TableCell>
                <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{producto.nombre}</TableCell>
              <TableCell>{producto.categoria}</TableCell>
              <TableCell className="text-right">
                ${producto.precio_compra.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-semibold text-green-600">
                ${producto.precio_venta.toFixed(2)}
              </TableCell>
              <TableCell>
                <ProfitBadge
                  precioCompra={producto.precio_compra}
                  precioVenta={producto.precio_venta}
                />
              </TableCell>
              <TableCell>
                <StockBadge stock={producto.stock} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(producto)}
                    title="Editar producto"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRenewStock(producto)}
                    title="Renovar stock"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(producto)}
                    title="Eliminar producto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
