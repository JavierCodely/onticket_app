/**
 * ProductModal Organism
 * Modal dialog for creating and editing products
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductForm } from '@/components/molecules/Productos';
import type { Producto, ProductoFormData } from '@/types/database/Productos';

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: Producto | null;
  onSubmit: (data: ProductoFormData, imageFile: File | null) => Promise<void>;
  isSubmitting?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  open,
  onOpenChange,
  producto,
  onSubmit,
  isSubmitting = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 bg-background">
        <div className="px-6 py-4 border-b bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {producto ? 'Editar producto' : 'Crear nuevo producto'}
            </DialogTitle>
            <DialogDescription>
              {producto
                ? 'Modifica los datos del producto y guarda los cambios'
                : 'Completa el formulario para agregar un nuevo producto al inventario'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-6 bg-background overflow-y-auto max-h-[calc(90vh-8rem)]">
          <ProductForm
            producto={producto}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
