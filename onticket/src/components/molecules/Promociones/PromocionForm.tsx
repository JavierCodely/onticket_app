/**
 * PromocionForm Molecule
 * Form for creating and editing promotions with automatic discount calculation
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/atoms/ImageUploader';
import { NumberInput } from '@/components/atoms/NumberInput';
import { Switch } from '@/components/ui/switch';
import { ProfitBadge } from '@/components/atoms/ProfitBadge';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import { useCurrency } from '@/hooks/useCurrency';
import type { PromocionWithProducto, PromocionFormData } from '@/types/database/Promociones';
import type { Producto } from '@/types/database/Productos';
import type { CurrencyCode } from '@/types/currency';

const promocionSchema = z.object({
  producto_id: z.string().min(1, 'Debes seleccionar un producto'),
  precio_promocion_ars: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_promocion_usd: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_promocion_brl: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  cantidad_minima: z.number().int().min(1, 'La cantidad mínima debe ser al menos 1'),
  cantidad_maxima: z.number().int().min(1, 'La cantidad máxima debe ser al menos 1').nullable(),
  limite_usos: z.number().int().min(1, 'El límite debe ser al menos 1').nullable(),
  limite_usos_por_venta: z.number().int().min(1, 'El límite por venta debe ser al menos 1'),
  activo: z.boolean(),
  tiene_limite_usos: z.boolean(),
  tiene_cantidad_maxima: z.boolean(),
}).refine(
  (data) => {
    if (data.tiene_cantidad_maxima && data.cantidad_maxima !== null) {
      return data.cantidad_maxima >= data.cantidad_minima;
    }
    return true;
  },
  {
    message: 'La cantidad máxima debe ser mayor o igual a la mínima',
    path: ['cantidad_maxima'],
  }
);

type PromocionFormSchema = z.infer<typeof promocionSchema>;

interface PromocionFormProps {
  promocion?: PromocionWithProducto | null;
  productos: Producto[];
  onSubmit: (data: PromocionFormData, imageFile: File | null | undefined) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const PromocionForm: React.FC<PromocionFormProps> = ({
  promocion,
  productos,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { defaultCurrency } = useCurrency();
  const [imageFile, setImageFile] = useState<File | null | undefined>(undefined);
  const [shouldDeleteImage, setShouldDeleteImage] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PromocionFormSchema>({
    resolver: zodResolver(promocionSchema),
    defaultValues: {
      producto_id: promocion?.producto_id || '',
      precio_promocion_ars: promocion?.precio_promocion_ars || 0,
      precio_promocion_usd: promocion?.precio_promocion_usd || 0,
      precio_promocion_brl: promocion?.precio_promocion_brl || 0,
      cantidad_minima: promocion?.cantidad_minima || 1,
      cantidad_maxima: promocion?.cantidad_maxima,
      limite_usos: promocion?.limite_usos,
      limite_usos_por_venta: promocion?.limite_usos_por_venta || 1,
      activo: promocion?.activo ?? true,
      tiene_limite_usos: promocion?.limite_usos !== null,
      tiene_cantidad_maxima: promocion?.cantidad_maxima !== null,
    },
  });

  const watchProductoId = watch('producto_id');
  const watchPrecioPromocionArs = watch('precio_promocion_ars');
  const watchPrecioPromocionUsd = watch('precio_promocion_usd');
  const watchPrecioPromocionBrl = watch('precio_promocion_brl');
  const watchTieneLimiteUsos = watch('tiene_limite_usos');
  const watchTieneCantidadMaxima = watch('tiene_cantidad_maxima');
  const watchCantidadMinima = watch('cantidad_minima');
  const watchCantidadMaxima = watch('cantidad_maxima');

  // Get selected product
  const selectedProducto = productos.find((p) => p.id === watchProductoId);

  // Calculate discounts for all currencies
  const descuentos = React.useMemo(() => {
    if (!selectedProducto) return { ars: 0, usd: 0, brl: 0 };
    return {
      ars: selectedProducto.precio_venta_ars - (watchPrecioPromocionArs || 0),
      usd: selectedProducto.precio_venta_usd - (watchPrecioPromocionUsd || 0),
      brl: selectedProducto.precio_venta_brl - (watchPrecioPromocionBrl || 0),
    };
  }, [selectedProducto, watchPrecioPromocionArs, watchPrecioPromocionUsd, watchPrecioPromocionBrl]);

  const porcentajesDescuento = React.useMemo(() => {
    if (!selectedProducto) return { ars: 0, usd: 0, brl: 0 };
    return {
      ars: selectedProducto.precio_venta_ars > 0 ? (descuentos.ars / selectedProducto.precio_venta_ars) * 100 : 0,
      usd: selectedProducto.precio_venta_usd > 0 ? (descuentos.usd / selectedProducto.precio_venta_usd) * 100 : 0,
      brl: selectedProducto.precio_venta_brl > 0 ? (descuentos.brl / selectedProducto.precio_venta_brl) * 100 : 0,
    };
  }, [descuentos, selectedProducto]);

  // Calculate financial projections for minimum quantity
  const proyeccionMinima = React.useMemo(() => {
    if (!selectedProducto || !watchCantidadMinima) return null;
    
    const cantidad = watchCantidadMinima;
    
    return {
      ars: {
        totalSinPromocion: selectedProducto.precio_venta_ars * cantidad,
        totalConPromocion: watchPrecioPromocionArs * cantidad,
        descuentoTotal: (selectedProducto.precio_venta_ars - watchPrecioPromocionArs) * cantidad,
        costoTotal: selectedProducto.precio_compra_ars * cantidad,
        gananciaSinPromocion: (selectedProducto.precio_venta_ars - selectedProducto.precio_compra_ars) * cantidad,
        gananciaConPromocion: (watchPrecioPromocionArs - selectedProducto.precio_compra_ars) * cantidad,
      },
      usd: {
        totalSinPromocion: selectedProducto.precio_venta_usd * cantidad,
        totalConPromocion: watchPrecioPromocionUsd * cantidad,
        descuentoTotal: (selectedProducto.precio_venta_usd - watchPrecioPromocionUsd) * cantidad,
        costoTotal: selectedProducto.precio_compra_usd * cantidad,
        gananciaSinPromocion: (selectedProducto.precio_venta_usd - selectedProducto.precio_compra_usd) * cantidad,
        gananciaConPromocion: (watchPrecioPromocionUsd - selectedProducto.precio_compra_usd) * cantidad,
      },
      brl: {
        totalSinPromocion: selectedProducto.precio_venta_brl * cantidad,
        totalConPromocion: watchPrecioPromocionBrl * cantidad,
        descuentoTotal: (selectedProducto.precio_venta_brl - watchPrecioPromocionBrl) * cantidad,
        costoTotal: selectedProducto.precio_compra_brl * cantidad,
        gananciaSinPromocion: (selectedProducto.precio_venta_brl - selectedProducto.precio_compra_brl) * cantidad,
        gananciaConPromocion: (watchPrecioPromocionBrl - selectedProducto.precio_compra_brl) * cantidad,
      },
    };
  }, [selectedProducto, watchCantidadMinima, watchPrecioPromocionArs, watchPrecioPromocionUsd, watchPrecioPromocionBrl]);

  // Calculate financial projections for maximum quantity
  const proyeccionMaxima = React.useMemo(() => {
    if (!selectedProducto || !watchTieneCantidadMaxima || !watchCantidadMaxima) return null;
    
    const cantidad = watchCantidadMaxima;
    
    return {
      ars: {
        totalSinPromocion: selectedProducto.precio_venta_ars * cantidad,
        totalConPromocion: watchPrecioPromocionArs * cantidad,
        descuentoTotal: (selectedProducto.precio_venta_ars - watchPrecioPromocionArs) * cantidad,
        costoTotal: selectedProducto.precio_compra_ars * cantidad,
        gananciaSinPromocion: (selectedProducto.precio_venta_ars - selectedProducto.precio_compra_ars) * cantidad,
        gananciaConPromocion: (watchPrecioPromocionArs - selectedProducto.precio_compra_ars) * cantidad,
      },
      usd: {
        totalSinPromocion: selectedProducto.precio_venta_usd * cantidad,
        totalConPromocion: watchPrecioPromocionUsd * cantidad,
        descuentoTotal: (selectedProducto.precio_venta_usd - watchPrecioPromocionUsd) * cantidad,
        costoTotal: selectedProducto.precio_compra_usd * cantidad,
        gananciaSinPromocion: (selectedProducto.precio_venta_usd - selectedProducto.precio_compra_usd) * cantidad,
        gananciaConPromocion: (watchPrecioPromocionUsd - selectedProducto.precio_compra_usd) * cantidad,
      },
      brl: {
        totalSinPromocion: selectedProducto.precio_venta_brl * cantidad,
        totalConPromocion: watchPrecioPromocionBrl * cantidad,
        descuentoTotal: (selectedProducto.precio_venta_brl - watchPrecioPromocionBrl) * cantidad,
        costoTotal: selectedProducto.precio_compra_brl * cantidad,
        gananciaSinPromocion: (selectedProducto.precio_venta_brl - selectedProducto.precio_compra_brl) * cantidad,
        gananciaConPromocion: (watchPrecioPromocionBrl - selectedProducto.precio_compra_brl) * cantidad,
      },
    };
  }, [selectedProducto, watchTieneCantidadMaxima, watchCantidadMaxima, watchPrecioPromocionArs, watchPrecioPromocionUsd, watchPrecioPromocionBrl]);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file === null && promocion?.imagen_url) {
      setShouldDeleteImage(true);
    } else {
      setShouldDeleteImage(false);
    }
  };

  const handleFormSubmit = async (data: PromocionFormSchema) => {
    const finalImageFile = shouldDeleteImage ? null : imageFile;
    await onSubmit(data, finalImageFile);
  };

  // Helper to check if currency has values
  const hasCurrencyValues = (producto: Producto | undefined, currency: CurrencyCode) => {
    if (!producto) return false;
    
    switch (currency) {
      case 'ARS':
        return producto.precio_venta_ars > 0 || producto.precio_compra_ars > 0;
      case 'USD':
        return producto.precio_venta_usd > 0 || producto.precio_compra_usd > 0;
      case 'BRL':
        return producto.precio_venta_brl > 0 || producto.precio_compra_brl > 0;
      default:
        return false;
    }
  };

  // Component to render currency projection
  const CurrencyProjection: React.FC<{
    currency: CurrencyCode;
    projection: any;
    isFirst: boolean;
    isDefault: boolean;
  }> = ({ currency, projection, isFirst, isDefault }) => {
    const currencyKey = currency.toLowerCase() as 'ars' | 'usd' | 'brl';
    const data = projection[currencyKey];
    const discount = porcentajesDescuento[currencyKey];

    if (!hasCurrencyValues(selectedProducto, currency)) return null;

    return (
      <div className={`space-y-1.5 text-base ${!isFirst ? 'border-t pt-2' : ''}`}>
        <div className={`font-medium text-sm uppercase tracking-wide flex items-center gap-1.5 ${
          isDefault ? 'text-primary' : ''
        }`}>
          {currency}
          {isDefault && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">PREDETERMINADA</span>}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sin promoción:</span>
          <FormattedCurrency value={data.totalSinPromocion} currency={currency} className="font-mono text-lg" />
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Con promoción:</span>
          <FormattedCurrency value={data.totalConPromocion} currency={currency} className="font-mono font-semibold text-xl text-green-600 dark:text-green-400" />
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="text-muted-foreground">Descuento:</span>
          <FormattedCurrency value={data.descuentoTotal} currency={currency} className="font-mono text-lg text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">% Descuento:</span>
          <span className="font-mono text-lg text-orange-600 dark:text-orange-400">{discount.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="text-muted-foreground">Costo total:</span>
          <FormattedCurrency value={data.costoTotal} currency={currency} className="font-mono text-lg" />
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ganancia sin promo:</span>
          <FormattedCurrency value={data.gananciaSinPromocion} currency={currency} className="font-mono text-lg text-green-600 dark:text-green-400" />
        </div>
        <div className="flex justify-between font-semibold border-t pt-1">
          <span>Ganancia con promo:</span>
          <FormattedCurrency value={data.gananciaConPromocion} currency={currency} className="font-mono text-xl text-green-700 dark:text-green-300" />
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="h-full flex flex-col">
      <div className="grid grid-cols-4 gap-6 flex-1 min-h-0 overflow-y-auto">
        {/* Column 1 - Basic Info & Image */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold border-b pb-1.5">Información Básica</h3>

          <div className="space-y-3.5">
            <Label className="text-base font-medium">Imagen de la promoción</Label>
            <div className="p-3 border border-border rounded-lg bg-card">
              <ImageUploader
                value={promocion?.imagen_url}
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="producto_id" className="text-base font-medium">
              Producto *
            </Label>
            <Controller
              name="producto_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting || !!promocion}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((producto) => (
                      <SelectItem key={producto.id} value={producto.id}>
                        {producto.nombre} - {producto.categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.producto_id && (
              <p className="text-xs text-destructive">{errors.producto_id.message}</p>
            )}
            {!!promocion && (
              <p className="text-xs text-muted-foreground">
                No se puede cambiar el producto de una promoción existente
              </p>
            )}
          </div>

          {/* Product Info */}
          {selectedProducto && (
            <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-1">
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock:</span>
                  <span className="font-mono font-semibold">{selectedProducto.stock}</span>
                </div>

                {/* ARS Prices */}
                {(selectedProducto.precio_venta_ars > 0 || selectedProducto.precio_compra_ars > 0) && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P. Compra (ARS):</span>
                      <FormattedCurrency
                        value={selectedProducto.precio_compra_ars}
                        currency="ARS"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P. Venta (ARS):</span>
                      <FormattedCurrency
                        value={selectedProducto.precio_venta_ars}
                        currency="ARS"
                        className="font-mono font-semibold text-xs"
                      />
                    </div>
                  </>
                )}

                {/* USD Prices */}
                {(selectedProducto.precio_venta_usd > 0 || selectedProducto.precio_compra_usd > 0) && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P. Compra (USD):</span>
                      <FormattedCurrency
                        value={selectedProducto.precio_compra_usd}
                        currency="USD"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P. Venta (USD):</span>
                      <FormattedCurrency
                        value={selectedProducto.precio_venta_usd}
                        currency="USD"
                        className="font-mono font-semibold text-xs"
                      />
                    </div>
                  </>
                )}

                {/* BRL Prices */}
                {(selectedProducto.precio_venta_brl > 0 || selectedProducto.precio_compra_brl > 0) && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P. Compra (BRL):</span>
                      <FormattedCurrency
                        value={selectedProducto.precio_compra_brl}
                        currency="BRL"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P. Venta (BRL):</span>
                      <FormattedCurrency
                        value={selectedProducto.precio_venta_brl}
                        currency="BRL"
                        className="font-mono font-semibold text-xs"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="activo" className="text-base font-medium">
                Promoción activa
              </Label>
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="activo"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Las promociones inactivas no estarán disponibles para la venta
            </p>
          </div>
        </div>

        {/* Column 2 - Quantity & Limits */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold border-b pb-1.5">Cantidades y Límites</h3>

          {/* Cantidad Mínima */}
          <div className="space-y-1.5">
            <Label htmlFor="cantidad_minima" className="text-base font-medium">
              Cantidad mínima *
            </Label>
            <Controller
              name="cantidad_minima"
              control={control}
              render={({ field }) => (
                <NumberInput
                  id="cantidad_minima"
                  value={field.value}
                  onChange={(val) => field.onChange(val ?? 1)}
                  disabled={isSubmitting}
                  placeholder="1"
                  maxDecimals={0}
                  className="bg-background"
                />
              )}
            />
            {errors.cantidad_minima && (
              <p className="text-xs text-destructive">{errors.cantidad_minima.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Cantidad mínima de productos para activar la promoción
            </p>
          </div>

          {/* Cantidad Máxima */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">¿Tiene cantidad máxima?</Label>
              <Controller
                name="tiene_cantidad_maxima"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        setValue('cantidad_maxima', null);
                      }
                    }}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            {watchTieneCantidadMaxima && (
              <div className="space-y-1.5">
                <Label htmlFor="cantidad_maxima" className="text-base font-medium">
                  Cantidad máxima
                </Label>
                <Controller
                  name="cantidad_maxima"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="cantidad_maxima"
                      value={field.value || 0}
                      onChange={(val) => field.onChange(val)}
                      disabled={isSubmitting}
                      placeholder="0"
                      maxDecimals={0}
                      className="bg-background"
                    />
                  )}
                />
                {errors.cantidad_maxima && (
                  <p className="text-xs text-destructive">{errors.cantidad_maxima.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Límite de Usos */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">¿Tiene límite de usos?</Label>
              <Controller
                name="tiene_limite_usos"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        setValue('limite_usos', null);
                      }
                    }}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            {watchTieneLimiteUsos && (
              <div className="space-y-1.5">
                <Label htmlFor="limite_usos" className="text-base font-medium">
                  Límite total de usos
                </Label>
                <Controller
                  name="limite_usos"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="limite_usos"
                      value={field.value || 0}
                      onChange={(val) => field.onChange(val)}
                      disabled={isSubmitting}
                      placeholder="0"
                      maxDecimals={0}
                      className="bg-background"
                    />
                  )}
                />
                {errors.limite_usos && (
                  <p className="text-xs text-destructive">{errors.limite_usos.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Límite por Venta */}
          <div className="space-y-1.5">
            <Label htmlFor="limite_usos_por_venta" className="text-base font-medium">
              Límite por venta *
            </Label>
            <Controller
              name="limite_usos_por_venta"
              control={control}
              render={({ field }) => (
                <NumberInput
                  id="limite_usos_por_venta"
                  value={field.value}
                  onChange={(val) => field.onChange(val ?? 1)}
                  disabled={isSubmitting}
                  placeholder="1"
                  maxDecimals={0}
                  className="bg-background"
                />
              )}
            />
            {errors.limite_usos_por_venta && (
              <p className="text-xs text-destructive">{errors.limite_usos_por_venta.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Máximo de promociones por transacción
            </p>
          </div>
        </div>

        {/* Column 3 - Prices */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold border-b pb-1.5">Precios de la Promoción</h3>

          {/* ARS */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <Label className="text-sm font-semibold">Pesos Argentinos (ARS)</Label>

            <div className="space-y-1.5">
              {selectedProducto && selectedProducto.precio_venta_ars > 0 && (
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Precio de venta:</span>
                  <FormattedCurrency
                    value={selectedProducto.precio_venta_ars}
                    currency="ARS"
                    className="font-mono font-semibold text-primary text-xl"
                  />
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <Label htmlFor="precio_promocion_ars" className="text-base font-medium">
                  Precio promoción *
                </Label>
                <Controller
                  name="precio_promocion_ars"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="precio_promocion_ars"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      maxDecimals={2}
                      className="bg-background"
                    />
                  )}
                />
                {errors.precio_promocion_ars && (
                  <p className="text-xs text-destructive">{errors.precio_promocion_ars.message}</p>
                )}
              </div>

              {selectedProducto && watchPrecioPromocionArs > 0 && (
                <div className="pt-1 border-t">
                  <ProfitBadge
                    profit={descuentos.ars}
                    profitPercentage={porcentajesDescuento.ars}
                    currency="ARS"
                    label="Descuento"
                    colorScheme="discount"
                  />
                </div>
              )}
            </div>
          </div>

          {/* USD */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <Label className="text-sm font-semibold">Dólares (USD)</Label>

            <div className="space-y-1.5">
              {selectedProducto && selectedProducto.precio_venta_usd > 0 && (
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Precio de venta:</span>
                  <FormattedCurrency
                    value={selectedProducto.precio_venta_usd}
                    currency="USD"
                    className="font-mono font-semibold text-primary text-xl"
                  />
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <Label htmlFor="precio_promocion_usd" className="text-base font-medium">
                  Precio promoción *
                </Label>
                <Controller
                  name="precio_promocion_usd"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="precio_promocion_usd"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      maxDecimals={2}
                      className="bg-background"
                    />
                  )}
                />
                {errors.precio_promocion_usd && (
                  <p className="text-xs text-destructive">{errors.precio_promocion_usd.message}</p>
                )}
              </div>

              {selectedProducto && watchPrecioPromocionUsd > 0 && (
                <div className="pt-1 border-t">
                  <ProfitBadge
                    profit={descuentos.usd}
                    profitPercentage={porcentajesDescuento.usd}
                    currency="USD"
                    label="Descuento"
                    colorScheme="discount"
                  />
                </div>
              )}
            </div>
          </div>

          {/* BRL */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <Label className="text-sm font-semibold">Reales Brasileños (BRL)</Label>

            <div className="space-y-1.5">
              {selectedProducto && selectedProducto.precio_venta_brl > 0 && (
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Precio de venta:</span>
                  <FormattedCurrency
                    value={selectedProducto.precio_venta_brl}
                    currency="BRL"
                    className="font-mono font-semibold text-primary text-xl"
                  />
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <Label htmlFor="precio_promocion_brl" className="text-base font-medium">
                  Precio promoción *
                </Label>
                <Controller
                  name="precio_promocion_brl"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="precio_promocion_brl"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      maxDecimals={2}
                      className="bg-background"
                    />
                  )}
                />
                {errors.precio_promocion_brl && (
                  <p className="text-xs text-destructive">{errors.precio_promocion_brl.message}</p>
                )}
              </div>

              {selectedProducto && watchPrecioPromocionBrl > 0 && (
                <div className="pt-1 border-t">
                  <ProfitBadge
                    profit={descuentos.brl}
                    profitPercentage={porcentajesDescuento.brl}
                    currency="BRL"
                    label="Descuento"
                    colorScheme="discount"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 4 - Financial Projections */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold border-b pb-1.5">Proyección Financiera</h3>

          {!selectedProducto && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Selecciona un producto para ver las proyecciones
            </p>
          )}

          {selectedProducto && proyeccionMinima && (
            <>
              {/* Proyección Cantidad Mínima */}
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800 pb-1.5">
                  <Label className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Cantidad Mínima ({watchCantidadMinima})
                  </Label>
                </div>

                {/* Render only the default currency */}
                {hasCurrencyValues(selectedProducto, defaultCurrency) ? (
                  <CurrencyProjection
                    currency={defaultCurrency}
                    projection={proyeccionMinima}
                    isFirst={true}
                    isDefault={true}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No hay precios configurados para {defaultCurrency}
                  </p>
                )}
              </div>

              {/* Proyección Cantidad Máxima */}
              {watchTieneCantidadMaxima && proyeccionMaxima && (
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-1.5">
                    <Label className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                      Cantidad Máxima ({watchCantidadMaxima})
                    </Label>
                  </div>

                  {/* Render only the default currency */}
                  {hasCurrencyValues(selectedProducto, defaultCurrency) ? (
                    <CurrencyProjection
                      currency={defaultCurrency}
                      projection={proyeccionMaxima}
                      isFirst={true}
                      isDefault={true}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No hay precios configurados para {defaultCurrency}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
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
            : promocion
            ? 'Actualizar promoción'
            : 'Crear promoción'}
        </Button>
      </div>
    </form>
  );
};
