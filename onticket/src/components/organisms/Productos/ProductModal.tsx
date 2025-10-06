/**
 * ProductModal Organism
 * Modal dialog for creating and editing products
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  // Generate a unique key every time the modal opens to force remount
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open) {
      // Generate new key when modal opens
      setFormKey(prev => prev + 1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] h-[90vh] p-0 gap-0 bg-background flex flex-col">
        <div className="px-6 py-3 border-b bg-background flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {producto ? 'Editar producto' : 'Crear nuevo producto'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {producto
                ? 'Modifica los datos del producto y guarda los cambios'
                : 'Completa el formulario para agregar un nuevo producto al inventario'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 bg-background flex-1 overflow-hidden">
          <ProductForm
            key={`product-form-${formKey}`}
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
