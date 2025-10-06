/**
 * ProductForm Molecule
 * Form for creating and editing products with profit calculation
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/atoms/ImageUploader';
import { NumberInput } from '@/components/atoms/NumberInput';
import { CurrencyToggle } from '@/components/atoms/CurrencyToggle';
import { MultiCurrencyPriceInput } from '@/components/molecules/Productos/MultiCurrencyPriceInput';
import { useCurrency } from '@/hooks/useCurrency';
import type { Producto, CategoriaProducto } from '@/types/database/Productos';
import type { CurrencyCode } from '@/types/currency';

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
  // Multi-currency prices
  precio_compra_ars: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_venta_ars: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_compra_usd: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_venta_usd: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_compra_brl: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_venta_brl: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  stock: z.number().int().min(0, 'El stock debe ser mayor o igual a 0'),
  min_stock: z.number().int().min(0, 'El stock mínimo debe ser mayor o igual a 0'),
  max_stock: z.number().int().min(0, 'El stock máximo debe ser mayor o igual a 0'),
}).refine((data) => data.max_stock >= data.min_stock, {
  message: 'El stock máximo debe ser mayor o igual al stock mínimo',
  path: ['max_stock'],
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
  const [shouldDeleteImage, setShouldDeleteImage] = useState(false);
  const { defaultCurrency } = useCurrency();
  
  // Initialize active currencies based on default currency or existing product
  const getInitialCurrencies = (): CurrencyCode[] => {
    if (producto) {
      const currencies: CurrencyCode[] = [];
      if (producto.precio_venta_ars > 0 || producto.precio_compra_ars > 0) currencies.push('ARS');
      if (producto.precio_venta_usd > 0 || producto.precio_compra_usd > 0) currencies.push('USD');
      if (producto.precio_venta_brl > 0 || producto.precio_compra_brl > 0) currencies.push('BRL');
      return currencies.length > 0 ? currencies : [defaultCurrency];
    }
    return [defaultCurrency];
  };

  const [activeCurrencies, setActiveCurrencies] = useState<CurrencyCode[]>(getInitialCurrencies());

  const {
    register,
    control,
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
      precio_compra_ars: producto?.precio_compra_ars || 0,
      precio_venta_ars: producto?.precio_venta_ars || 0,
      precio_compra_usd: producto?.precio_compra_usd || 0,
      precio_venta_usd: producto?.precio_venta_usd || 0,
      precio_compra_brl: producto?.precio_compra_brl || 0,
      precio_venta_brl: producto?.precio_venta_brl || 0,
      stock: producto?.stock || 0,
      min_stock: producto?.min_stock || 0,
      max_stock: producto?.max_stock || 0,
    },
  });

  // Sync default currency changes when creating a new product
  useEffect(() => {
    // Only update when creating a new product (no existing producto)
    if (!producto) {
      // Update active currencies to match the default currency
      setActiveCurrencies([defaultCurrency]);
    }
  }, [defaultCurrency, producto]);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file === null && producto?.imagen_url) {
      // Usuario eliminó la imagen existente
      setShouldDeleteImage(true);
    } else {
      setShouldDeleteImage(false);
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    // Si el usuario eliminó la imagen, pasar null explícitamente
    const finalImageFile = shouldDeleteImage ? null : imageFile;
    await onSubmit(data, finalImageFile);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="h-full flex flex-col">
      {/* Three column layout for PC */}
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Column 1 - Basic Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold border-b pb-1.5">Información Básica</h3>
          <div className="space-y-3.5">
            <Label className="text-xs font-medium">Imagen del producto</Label>
            <div className="p-3 border border-border rounded-lg bg-card">
              <ImageUploader
                value={producto?.imagen_url}
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombre" className="text-xs font-medium">
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

          <div className="space-y-1.5">
            <Label htmlFor="categoria" className="text-xs font-medium">
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

        {/* Column 2 - Multi-Currency Pricing */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold border-b pb-1.5">Precios por Moneda</h3>
          
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Monedas activas *</Label>
            <CurrencyToggle
              value={activeCurrencies}
              onChange={setActiveCurrencies}
              disabled={isSubmitting}
            />
          </div>

          {/* Multi-Currency Price Inputs */}
          <div className="space-y-2">
            <MultiCurrencyPriceInput
              activeCurrencies={activeCurrencies}
              values={{
                ars: {
                  compra: watch('precio_compra_ars'),
                  venta: watch('precio_venta_ars'),
                },
                usd: {
                  compra: watch('precio_compra_usd'),
                  venta: watch('precio_venta_usd'),
                },
                brl: {
                  compra: watch('precio_compra_brl'),
                  venta: watch('precio_venta_brl'),
                },
              }}
              onChange={(currency, type, value) => {
                const lowerCode = currency.toLowerCase() as 'ars' | 'usd' | 'brl';
                if (type === 'compra') {
                  setValue(`precio_compra_${lowerCode}` as any, value);
                } else {
                  setValue(`precio_venta_${lowerCode}` as any, value);
                }
              }}
              disabled={isSubmitting}
              errors={errors as any}
            />
          </div>
        </div>

        {/* Column 3 - Inventory Management */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold border-b pb-1.5">Gestión de Inventario</h3>

          <div className="space-y-1.5">
            <Label htmlFor="stock" className="text-xs font-medium">
              Stock inicial *
            </Label>
            <Controller
              name="stock"
              control={control}
              render={({ field }) => (
                <NumberInput
                  id="stock"
                  value={field.value}
                  onChange={(val) => field.onChange(val ?? 0)}
                  disabled={isSubmitting}
                  placeholder="0"
                  maxDecimals={0}
                  className="bg-background"
                />
              )}
            />
            {errors.stock && (
              <p className="text-sm text-destructive mt-1">{errors.stock.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Cantidad de unidades disponibles
            </p>
          </div>

          {/* Stock management section */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Límites de stock</Label>
            
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="min_stock" className="text-xs font-medium">
                  Stock mínimo *
                </Label>
                <Controller
                  name="min_stock"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="min_stock"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={isSubmitting}
                      placeholder="0"
                      maxDecimals={0}
                      className="bg-background"
                    />
                  )}
                />
                {errors.min_stock && (
                  <p className="text-xs text-destructive mt-1">{errors.min_stock.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Alerta cuando llegue a este nivel
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max_stock" className="text-xs font-medium">
                  Stock máximo *
                </Label>
                <Controller
                  name="max_stock"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="max_stock"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={isSubmitting}
                      placeholder="0"
                      maxDecimals={0}
                      className="bg-background"
                    />
                  )}
                />
                {errors.max_stock && (
                  <p className="text-xs text-destructive mt-1">{errors.max_stock.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Capacidad máxima
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex gap-3 justify-end pt-2.5 mt-2.5 border-t border-border flex-shrink-0">
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
