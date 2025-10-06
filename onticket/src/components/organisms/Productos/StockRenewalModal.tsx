/**
 * StockRenewalModal Organism
 * Modal dialog for renewing product stock
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StockRenewalForm } from '@/components/molecules/Productos';
import type { Producto, StockRenewalData } from '@/types/database/Productos';

interface StockRenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: Producto | null;
  onSubmit: (data: StockRenewalData) => Promise<void>;
  isSubmitting?: boolean;
}

export const StockRenewalModal: React.FC<StockRenewalModalProps> = ({
  open,
  onOpenChange,
  producto,
  onSubmit,
  isSubmitting = false,
}) => {
  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl">Renovar stock</DialogTitle>
          <DialogDescription>
            Ajusta el stock del producto agregando unidades o estableciendo un nuevo total
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <StockRenewalForm
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
