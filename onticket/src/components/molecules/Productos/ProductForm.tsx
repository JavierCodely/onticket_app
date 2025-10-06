/**
 * ProductForm Molecule
 * Form for creating and editing products with profit calculation
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/atoms/ImageUploader';
import { ProfitBadge } from '@/components/atoms/ProfitBadge';
import type { Producto, CategoriaProducto } from '@/types/database/Productos';

const CATEGORIAS: CategoriaProducto[] = [
  'Vodka',
  'Vino',
  'Champan',
  'Tequila',
  'Sin Alcohol',
  'Cerveza',
  'Cocteles',
  'Otros',
];

const productSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoria: z.enum([
    'Vodka',
    'Vino',
    'Champan',
    'Tequila',
    'Sin Alcohol',
    'Cerveza',
    'Cocteles',
    'Otros',
  ] as const),
  precio_compra: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_venta: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  stock: z.number().int().min(0, 'El stock debe ser mayor o igual a 0'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  producto?: Producto | null;
  onSubmit: (data: ProductFormData, imageFile: File | null) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  producto,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nombre: producto?.nombre || '',
      categoria: producto?.categoria || 'Otros',
      precio_compra: producto?.precio_compra || 0,
      precio_venta: producto?.precio_venta || 0,
      stock: producto?.stock || 0,
    },
  });

  const precioCompra = watch('precio_compra');
  const precioVenta = watch('precio_venta');

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit(data, imageFile);
  };

  // Handler to prevent non-numeric input in number fields
  const handleNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    const currentValue = (e.target as HTMLInputElement).value;

    // Allow: backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(key)) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Allow: home, end, left, right, up, down arrows
    if (['Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }

    // Allow: decimal point (only one)
    if (key === '.' && !currentValue.includes('.')) {
      return;
    }

    // Block: if not a digit
    if (!/^\d$/.test(key)) {
      e.preventDefault();
    }
  };

  // Handler for integer-only fields (stock)
  const handleIntegerInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    // Allow: backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(key)) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Allow: home, end, left, right, up, down arrows
    if (['Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }

    // Block: if not a digit (no decimal points allowed)
    if (!/^\d$/.test(key)) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Image and basic info */}
        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Imagen del producto</Label>
            <div className="p-4 border border-border rounded-lg bg-card">
              <ImageUploader
                value={producto?.imagen_url}
                onChange={setImageFile}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-medium">
              Nombre del producto *
            </Label>
            <Input
              id="nombre"
              {...register('nombre')}
              disabled={isSubmitting}
              placeholder="Ej: Vodka Absolut 750ml"
              className="bg-background"
            />
            {errors.nombre && (
              <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-sm font-medium">
              Categoría *
            </Label>
            <Select
              value={watch('categoria')}
              onValueChange={(value) => setValue('categoria', value as CategoriaProducto)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && (
              <p className="text-sm text-destructive mt-1">{errors.categoria.message}</p>
            )}
          </div>
        </div>

        {/* Right column - Pricing and stock */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio_compra" className="text-sm font-medium">
                Precio de compra *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="precio_compra"
                  type="number"
                  step="0.01"
                  {...register('precio_compra', { valueAsNumber: true })}
                  disabled={isSubmitting}
                  placeholder="0.00"
                  className="pl-7 bg-background"
                  onKeyDown={handleNumericInput}
                />
              </div>
              {errors.precio_compra && (
                <p className="text-sm text-destructive mt-1">{errors.precio_compra.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio_venta" className="text-sm font-medium">
                Precio de venta *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="precio_venta"
                  type="number"
                  step="0.01"
                  {...register('precio_venta', { valueAsNumber: true })}
                  disabled={isSubmitting}
                  placeholder="0.00"
                  className="pl-7 bg-background"
                  onKeyDown={handleNumericInput}
                />
              </div>
              {errors.precio_venta && (
                <p className="text-sm text-destructive mt-1">{errors.precio_venta.message}</p>
              )}
            </div>
          </div>

          {/* Profit calculation display */}
          {precioCompra > 0 && precioVenta > 0 && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Cálculo de ganancia</Label>
                <ProfitBadge
                  precioCompra={precioCompra}
                  precioVenta={precioVenta}
                  showIcon
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Precio de compra:</span>
                  <span className="font-medium">${precioCompra.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Precio de venta:</span>
                  <span className="font-medium">${precioVenta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 pt-2 border-t border-border">
                  <span className="font-medium">Ganancia bruta:</span>
                  <span className="font-semibold text-green-600 dark:text-green-500">
                    ${(precioVenta - precioCompra).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="stock" className="text-sm font-medium">
              Stock inicial *
            </Label>
            <Input
              id="stock"
              type="number"
              {...register('stock', { valueAsNumber: true })}
              disabled={isSubmitting}
              placeholder="0"
              className="bg-background"
              onKeyDown={handleIntegerInput}
            />
            {errors.stock && (
              <p className="text-sm text-destructive mt-1">{errors.stock.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Puedes ajustar el stock más tarde desde el botón "Renovar Stock"
            </p>
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex gap-3 justify-end pt-6 border-t border-border bg-background">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Guardando...'
            : producto
            ? 'Actualizar producto'
            : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
};
