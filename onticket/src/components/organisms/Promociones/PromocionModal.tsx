/**
 * PromocionModal Organism
 * Modal dialog for creating and editing promotions
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PromocionForm } from '@/components/molecules/Promociones/PromocionForm';
import type { PromocionWithProducto, PromocionFormData } from '@/types/database/Promociones';
import type { Producto } from '@/types/database/Productos';

interface PromocionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promocion?: PromocionWithProducto | null;
  productos: Producto[];
  onSubmit: (data: PromocionFormData, imageFile: File | null | undefined) => Promise<void>;
  isSubmitting?: boolean;
}

export const PromocionModal: React.FC<PromocionModalProps> = ({
  open,
  onOpenChange,
  promocion,
  productos,
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
              {promocion ? 'Editar promoción' : 'Crear nueva promoción'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {promocion
                ? 'Modifica los datos de la promoción y guarda los cambios'
                : 'Completa el formulario para agregar una nueva promoción'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 bg-background flex-1 overflow-hidden">
          <PromocionForm
            key={`promocion-form-${formKey}`}
            promocion={promocion}
            productos={productos}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
