/**
 * StockRenewalForm Molecule
 * Form for renewing/adjusting product stock
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { StockBadge } from '@/components/atoms/StockBadge';
import { NumberInput } from '@/components/atoms/NumberInput';
import type { Producto } from '@/types/database/Productos';

const stockRenewalSchema = z.object({
  tipo: z.enum(['add', 'set']),
  cantidad: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
});

type StockRenewalData = z.infer<typeof stockRenewalSchema>;

interface StockRenewalFormProps {
  producto: Producto;
  onSubmit: (data: StockRenewalData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const StockRenewalForm: React.FC<StockRenewalFormProps> = ({
  producto,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StockRenewalData>({
    resolver: zodResolver(stockRenewalSchema),
    defaultValues: {
      tipo: 'add',
      cantidad: 0,
    },
  });

  const tipo = watch('tipo');
  const cantidad = watch('cantidad');

  const calcularNuevoStock = () => {
    if (tipo === 'add') {
      return producto.stock + (cantidad || 0);
    }
    return cantidad || 0;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <Label className="text-sm text-muted-foreground">Producto</Label>
          <p className="font-semibold text-lg">{producto.nombre}</p>
          <div className="mt-2">
            <StockBadge stock={producto.stock} showIcon />
          </div>
        </div>

        <div>
          <Label>Tipo de ajuste</Label>
          <RadioGroup
            value={tipo}
            onValueChange={(value) => setValue('tipo', value as 'add' | 'set')}
            disabled={isSubmitting}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="add" id="add" />
              <Label htmlFor="add" className="font-normal cursor-pointer">
                Agregar al stock actual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="set" id="set" />
              <Label htmlFor="set" className="font-normal cursor-pointer">
                Establecer stock exacto
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="cantidad">
            {tipo === 'add' ? 'Cantidad a agregar' : 'Nuevo stock total'}
          </Label>
          <Controller
            name="cantidad"
            control={control}
            render={({ field }) => (
              <NumberInput
                id="cantidad"
                value={field.value}
                onChange={(val) => field.onChange(val ?? 0)}
                disabled={isSubmitting}
                placeholder="0"
                maxDecimals={0}
              />
            )}
          />
          {errors.cantidad && (
            <p className="text-sm text-destructive mt-1">{errors.cantidad.message}</p>
          )}
        </div>

        {cantidad > 0 && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <Label>Vista previa</Label>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock actual:</span>
                <span className="font-medium">{producto.stock}</span>
              </div>
              {tipo === 'add' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cantidad a agregar:</span>
                  <span className="font-medium text-green-600">+{cantidad}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Nuevo stock:</span>
                <span className="font-semibold text-green-600">{calcularNuevoStock()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Actualizando...' : 'Actualizar stock'}
        </Button>
      </div>
    </form>
  );
};
