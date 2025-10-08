/**
 * ComboModal Organism
 * Modal dialog for creating and editing combos
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ComboForm } from '@/components/molecules/Combos/ComboForm';
import type { ComboWithProducts, ComboFormData } from '@/types/database/Combos';
import type { Producto } from '@/types/database/Productos';

interface ComboModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combo?: ComboWithProducts | null;
  productos: Producto[];
  onSubmit: (data: ComboFormData, imageFile: File | null | undefined) => Promise<void>;
  isSubmitting?: boolean;
}

export const ComboModal: React.FC<ComboModalProps> = ({
  open,
  onOpenChange,
  combo,
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
            <DialogTitle className="text-3xl">
              {combo ? 'Editar combo' : 'Crear nuevo combo'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {combo
                ? 'Modifica los datos del combo y guarda los cambios'
                : 'Completa el formulario para agregar un nuevo combo al inventario'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 bg-background flex-1 overflow-hidden">
          <ComboForm
            key={`combo-form-${formKey}`}
            combo={combo}
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
