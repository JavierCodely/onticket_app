/**
 * ComboForm Molecule
 * Form for creating and editing combos with automatic price calculation
 */

import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/atoms/ImageUploader';
import { NumberInput } from '@/components/atoms/NumberInput';
import { Switch } from '@/components/ui/switch';
import { ProfitBadge } from '@/components/atoms/ProfitBadge';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import { X, Plus } from 'lucide-react';
import type { ComboWithProducts } from '@/types/database/Combos';
import type { Producto } from '@/types/database/Productos';

const comboSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  productos: z.array(
    z.object({
      producto_id: z.string().min(1, 'Debes seleccionar un producto'),
      cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
    })
  ).min(1, 'Debes agregar al menos un producto'),
  precio_combo_ars: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_combo_usd: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_combo_brl: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  limite_usos: z.number().int().min(1, 'El límite debe ser al menos 1').nullable(),
  limite_usos_por_venta: z.number().int().min(1, 'El límite por venta debe ser al menos 1'),
  activo: z.boolean(),
  tiene_limite_usos: z.boolean(),
});

type ComboFormData = z.infer<typeof comboSchema>;

interface ComboFormProps {
  combo?: ComboWithProducts | null;
  productos: Producto[];
  onSubmit: (data: ComboFormData, imageFile: File | null | undefined) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ComboForm: React.FC<ComboFormProps> = ({
  combo,
  productos,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [imageFile, setImageFile] = useState<File | null | undefined>(undefined);
  const [shouldDeleteImage, setShouldDeleteImage] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ComboFormData>({
    resolver: zodResolver(comboSchema),
    defaultValues: {
      nombre: combo?.nombre || '',
      productos: combo?.combo_productos?.map((cp) => ({
        producto_id: cp.producto_id,
        cantidad: cp.cantidad,
      })) || [],
      precio_combo_ars: combo?.precio_combo_ars || 0,
      precio_combo_usd: combo?.precio_combo_usd || 0,
      precio_combo_brl: combo?.precio_combo_brl || 0,
      limite_usos: combo?.limite_usos,
      limite_usos_por_venta: combo?.limite_usos_por_venta || 1,
      activo: combo?.activo ?? true,
      tiene_limite_usos: combo?.limite_usos !== null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'productos',
  });

  const watchProductos = watch('productos');
  const watchPrecioComboArs = watch('precio_combo_ars');
  const watchPrecioComboUsd = watch('precio_combo_usd');
  const watchPrecioComBrl = watch('precio_combo_brl');
  const watchTieneLimiteUsos = watch('tiene_limite_usos');

  // Serialize productos for proper dependency tracking
  // Don't use useMemo here to ensure it updates on every render
  const productosKey = JSON.stringify(watchProductos?.map(p => ({ id: p.producto_id, qty: p.cantidad })));

  // Calculate purchase prices for all currencies
  const preciosCompra = React.useMemo(() => {
    const totales = { ars: 0, usd: 0, brl: 0 };

    if (watchProductos && watchProductos.length > 0) {
      watchProductos.forEach((item) => {
        if (item.producto_id && item.cantidad) {
          const producto = productos.find((p) => p.id === item.producto_id);
          if (producto) {
            totales.ars += producto.precio_compra_ars * item.cantidad;
            totales.usd += producto.precio_compra_usd * item.cantidad;
            totales.brl += producto.precio_compra_brl * item.cantidad;
          }
        }
      });
    }

    return totales;
  }, [productosKey, productos]);

  // Calculate sale prices for all currencies (precio real)
  const preciosVenta = React.useMemo(() => {
    const totales = { ars: 0, usd: 0, brl: 0 };

    if (watchProductos && watchProductos.length > 0) {
      watchProductos.forEach((item) => {
        if (item.producto_id && item.cantidad) {
          const producto = productos.find((p) => p.id === item.producto_id);
          if (producto) {
            totales.ars += producto.precio_venta_ars * item.cantidad;
            totales.usd += producto.precio_venta_usd * item.cantidad;
            totales.brl += producto.precio_venta_brl * item.cantidad;
          }
        }
      });
    }

    return totales;
  }, [productosKey, productos]);

  // Calculate discount for each currency (precio_venta - precio_combo)
  // In combos, the combo price should be LESS than the sale price (it's a discount)
  // So we show it as a positive discount amount
  const descuentos = React.useMemo(() => ({
    ars: preciosVenta.ars - (watchPrecioComboArs || 0),
    usd: preciosVenta.usd - (watchPrecioComboUsd || 0),
    brl: preciosVenta.brl - (watchPrecioComBrl || 0),
  }), [watchPrecioComboArs, watchPrecioComboUsd, watchPrecioComBrl, preciosVenta]);

  const porcentajesDescuento = React.useMemo(() => ({
    ars: preciosVenta.ars > 0 ? ((descuentos.ars / preciosVenta.ars) * 100) : 0,
    usd: preciosVenta.usd > 0 ? ((descuentos.usd / preciosVenta.usd) * 100) : 0,
    brl: preciosVenta.brl > 0 ? ((descuentos.brl / preciosVenta.brl) * 100) : 0,
  }), [descuentos, preciosVenta]);

  // Calculate profit margin for each currency (precio_combo - precio_compra)
  const ganancias = React.useMemo(() => ({
    ars: (watchPrecioComboArs || 0) - preciosCompra.ars,
    usd: (watchPrecioComboUsd || 0) - preciosCompra.usd,
    brl: (watchPrecioComBrl || 0) - preciosCompra.brl,
  }), [watchPrecioComboArs, watchPrecioComboUsd, watchPrecioComBrl, preciosCompra]);

  const porcentajesGanancia = React.useMemo(() => ({
    ars: preciosCompra.ars > 0 ? ((ganancias.ars / preciosCompra.ars) * 100) : 0,
    usd: preciosCompra.usd > 0 ? ((ganancias.usd / preciosCompra.usd) * 100) : 0,
    brl: preciosCompra.brl > 0 ? ((ganancias.brl / preciosCompra.brl) * 100) : 0,
  }), [ganancias, preciosCompra]);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file === null && combo?.imagen_url) {
      setShouldDeleteImage(true);
    } else {
      setShouldDeleteImage(false);
    }
  };

  const handleFormSubmit = async (data: ComboFormData) => {
    const finalImageFile = shouldDeleteImage ? null : imageFile;
    await onSubmit(data, finalImageFile);
  };

  const availableProductos = productos.filter(
    (p) => !watchProductos.some((wp) => wp.producto_id === p.id)
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="h-full flex flex-col">
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto">
        {/* Column 1 - Basic Info & Image */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold border-b pb-1.5">Información Básica</h3>

          <div className="space-y-3.5">
            <Label className="text-xs font-medium">Imagen del combo</Label>
            <div className="p-3 border border-border rounded-lg bg-card">
              <ImageUploader
                value={combo?.imagen_url}
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombre" className="text-xs font-medium">
              Nombre del combo *
            </Label>
            <Input
              id="nombre"
              {...register('nombre')}
              disabled={isSubmitting}
              placeholder="Ej: Combo Fiesta"
              className="bg-background"
            />
            {errors.nombre && (
              <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="activo" className="text-xs font-medium">
                Combo activo
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
              Los combos inactivos no estarán disponibles para la venta
            </p>
          </div>

          {/* Límites */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">¿Tiene límite de usos?</Label>
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
                <Label htmlFor="limite_usos" className="text-xs font-medium">
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
                  <p className="text-xs text-destructive mt-1">{errors.limite_usos.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="limite_usos_por_venta" className="text-xs font-medium">
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
                <p className="text-xs text-destructive mt-1">{errors.limite_usos_por_venta.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Máximo de combos por transacción
              </p>
            </div>
          </div>
        </div>

        {/* Column 2 - Products */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-1.5">
            <h3 className="text-sm font-semibold">Productos del Combo</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => append({ producto_id: '', cantidad: 1 })}
              disabled={isSubmitting || availableProductos.length === 0}
              className="h-7"
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          </div>

          {errors.productos && typeof errors.productos.message === 'string' && (
            <p className="text-sm text-destructive">{errors.productos.message}</p>
          )}

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {fields.map((field, index) => {
              const selectedProducto = productos.find(
                (p) => p.id === watchProductos[index]?.producto_id
              );

              return (
                <div
                  key={field.id}
                  className="p-3 border border-border rounded-lg bg-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Producto {index + 1}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(index)}
                      disabled={isSubmitting}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Producto</Label>
                    <Controller
                      name={`productos.${index}.producto_id`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecciona un producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {productos
                              .filter((p) =>
                                p.id === field.value ||
                                !watchProductos.some((wp) => wp.producto_id === p.id)
                              )
                              .map((producto) => (
                                <SelectItem key={producto.id} value={producto.id}>
                                  {producto.nombre}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.productos?.[index]?.producto_id && (
                      <p className="text-xs text-destructive">
                        {errors.productos[index]?.producto_id?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Cantidad</Label>
                    <Controller
                      name={`productos.${index}.cantidad`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value}
                          onChange={(val) => field.onChange(val ?? 1)}
                          disabled={isSubmitting}
                          placeholder="1"
                          maxDecimals={0}
                          className="bg-background"
                        />
                      )}
                    />
                    {errors.productos?.[index]?.cantidad && (
                      <p className="text-xs text-destructive">
                        {errors.productos[index]?.cantidad?.message}
                      </p>
                    )}
                  </div>

                  {selectedProducto && (
                    <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
                      <div className="flex justify-between">
                        <span>Stock disponible:</span>
                        <span className="font-mono font-semibold">
                          {selectedProducto.stock}
                        </span>
                      </div>

                      {/* ARS Prices */}
                      {(selectedProducto.precio_venta_ars > 0 || selectedProducto.precio_compra_ars > 0) && (
                        <>
                          <div className="flex justify-between">
                            <span>P. Compra (ARS):</span>
                            <FormattedCurrency
                              value={selectedProducto.precio_compra_ars}
                              currency="ARS"
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="flex justify-between">
                            <span>P. Venta (ARS):</span>
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
                            <span>P. Compra (USD):</span>
                            <FormattedCurrency
                              value={selectedProducto.precio_compra_usd}
                              currency="USD"
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="flex justify-between">
                            <span>P. Venta (USD):</span>
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
                            <span>P. Compra (BRL):</span>
                            <FormattedCurrency
                              value={selectedProducto.precio_compra_brl}
                              currency="BRL"
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="flex justify-between">
                            <span>P. Venta (BRL):</span>
                            <FormattedCurrency
                              value={selectedProducto.precio_venta_brl}
                              currency="BRL"
                              className="font-mono font-semibold text-xs"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3 - Prices */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold border-b pb-1.5">Precios del Combo</h3>

          {/* ARS */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Pesos Argentinos (ARS)</Label>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Precio total compra:</span>
                <FormattedCurrency
                  value={preciosCompra.ars}
                  currency="ARS"
                  className="font-mono"
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Precio total venta:</span>
                <FormattedCurrency
                  value={preciosVenta.ars}
                  currency="ARS"
                  className="font-mono font-semibold text-primary"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <Label htmlFor="precio_combo_ars" className="text-xs font-medium">
                  Precio combo *
                </Label>
                <Controller
                  name="precio_combo_ars"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="precio_combo_ars"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      maxDecimals={2}
                      className="bg-background"
                    />
                  )}
                />
                {errors.precio_combo_ars && (
                  <p className="text-xs text-destructive">{errors.precio_combo_ars.message}</p>
                )}
              </div>

              <div className="pt-1 border-t space-y-2">
                <ProfitBadge
                  profit={descuentos.ars}
                  profitPercentage={porcentajesDescuento.ars}
                  currency="ARS"
                  label="Descuento"
                  colorScheme="discount"
                />
                <ProfitBadge
                  profit={ganancias.ars}
                  profitPercentage={porcentajesGanancia.ars}
                  currency="ARS"
                  label="Ganancia"
                />
              </div>
            </div>
          </div>

          {/* USD */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Dólares (USD)</Label>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Precio total compra:</span>
                <FormattedCurrency
                  value={preciosCompra.usd}
                  currency="USD"
                  className="font-mono"
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Precio total venta:</span>
                <FormattedCurrency
                  value={preciosVenta.usd}
                  currency="USD"
                  className="font-mono font-semibold text-primary"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <Label htmlFor="precio_combo_usd" className="text-xs font-medium">
                  Precio combo *
                </Label>
                <Controller
                  name="precio_combo_usd"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="precio_combo_usd"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      maxDecimals={2}
                      className="bg-background"
                    />
                  )}
                />
                {errors.precio_combo_usd && (
                  <p className="text-xs text-destructive">{errors.precio_combo_usd.message}</p>
                )}
              </div>

              <div className="pt-1 border-t space-y-2">
                <ProfitBadge
                  profit={descuentos.usd}
                  profitPercentage={porcentajesDescuento.usd}
                  currency="USD"
                  label="Descuento"
                  colorScheme="discount"
                />
                <ProfitBadge
                  profit={ganancias.usd}
                  profitPercentage={porcentajesGanancia.usd}
                  currency="USD"
                  label="Ganancia"
                />
              </div>
            </div>
          </div>

          {/* BRL */}
          <div className="p-2.5 bg-muted/50 border border-border rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Reales Brasileños (BRL)</Label>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Precio total compra:</span>
                <FormattedCurrency
                  value={preciosCompra.brl}
                  currency="BRL"
                  className="font-mono"
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Precio total venta:</span>
                <FormattedCurrency
                  value={preciosVenta.brl}
                  currency="BRL"
                  className="font-mono font-semibold text-primary"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <Label htmlFor="precio_combo_brl" className="text-xs font-medium">
                  Precio combo *
                </Label>
                <Controller
                  name="precio_combo_brl"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="precio_combo_brl"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      maxDecimals={2}
                      className="bg-background"
                    />
                  )}
                />
                {errors.precio_combo_brl && (
                  <p className="text-xs text-destructive">{errors.precio_combo_brl.message}</p>
                )}
              </div>

              <div className="pt-1 border-t space-y-2">
                <ProfitBadge
                  profit={descuentos.brl}
                  profitPercentage={porcentajesDescuento.brl}
                  currency="BRL"
                  label="Descuento"
                  colorScheme="discount"
                />
                <ProfitBadge
                  profit={ganancias.brl}
                  profitPercentage={porcentajesGanancia.brl}
                  currency="BRL"
                  label="Ganancia"
                />
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
            : combo
            ? 'Actualizar combo'
            : 'Crear combo'}
        </Button>
      </div>
    </form>
  );
};
