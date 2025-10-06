/**
 * ProductGrid Organism
 * Grid layout for displaying products in card view
 */

import React from 'react';
import { ProductCard } from '@/components/molecules/Productos';
import type { Producto } from '@/types/database/Productos';

interface ProductGridProps {
  productos: Producto[];
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
  onRenewStock: (producto: Producto) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  productos,
  onEdit,
  onDelete,
  onRenewStock,
}) => {
  if (productos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {productos.map((producto) => (
        <ProductCard
          key={producto.id}
          producto={producto}
          onEdit={onEdit}
          onDelete={onDelete}
          onRenewStock={onRenewStock}
        />
      ))}
    </div>
  );
};
