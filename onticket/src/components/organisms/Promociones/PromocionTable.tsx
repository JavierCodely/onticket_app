/**
 * PromocionTable Organism
 * Table view for displaying promotions with actions
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2, Power, ImageIcon } from 'lucide-react';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PromocionWithProducto } from '@/types/database/Promociones';
import type { Producto } from '@/types/database/Productos';
import type { Personal } from '@/types/database/Personal';

interface PromocionTableProps {
  promociones: PromocionWithProducto[];
  onEdit: (promocion: PromocionWithProducto) => void;
  onDelete: (promocion: PromocionWithProducto) => void;
  onToggleActivo: (promocion: PromocionWithProducto) => void;
  productosMap: Map<string, Producto>;
  creatorsMap: Map<string, Personal>;
}

export const PromocionTable: React.FC<PromocionTableProps> = ({
  promociones,
  onEdit,
  onDelete,
  onToggleActivo,
  productosMap,
  creatorsMap,
}) => {
  const { defaultCurrency } = useCurrency();

  // Helper to get price for current currency
  const getPriceForCurrency = (promocion: PromocionWithProducto, type: 'real' | 'promocion') => {
    switch (defaultCurrency) {
      case 'ARS':
        return type === 'real' ? promocion.precio_real_ars : promocion.precio_promocion_ars;
      case 'USD':
        return type === 'real' ? promocion.precio_real_usd : promocion.precio_promocion_usd;
      case 'BRL':
        return type === 'real' ? promocion.precio_real_brl : promocion.precio_promocion_brl;
      default:
        return type === 'real' ? promocion.precio_real : promocion.precio_promocion;
    }
  };

  if (promociones.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No hay promociones registradas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Crea tu primera promoción para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Imagen</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Creado por</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Precio Real</TableHead>
            <TableHead className="text-right">Precio Promo</TableHead>
            <TableHead className="text-right">Descuento</TableHead>
            <TableHead className="text-center">Cant. Mín/Máx</TableHead>
            <TableHead className="text-center">Límites</TableHead>
            <TableHead className="text-center">Usos</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promociones.map((promocion) => {
            const producto = productosMap.get(promocion.producto_id);
            // Use personal from the promocion object first, fallback to creatorsMap
            const creator = promocion.personal || creatorsMap.get(promocion.creado_por);
            
            // Get prices for current currency
            const precioReal = getPriceForCurrency(promocion, 'real');
            const precioPromocion = getPriceForCurrency(promocion, 'promocion');
            const descuento = precioReal - precioPromocion;
            const porcentajeDescuento = precioReal > 0 ? (descuento / precioReal) * 100 : 0;
            const usosRestantes = promocion.limite_usos
              ? promocion.limite_usos - promocion.cantidad_usos
              : null;

            return (
              <TableRow key={promocion.id}>
                <TableCell>
                  <Avatar className="h-12 w-12 rounded-md">
                    {promocion.imagen_url ? (
                      <AvatarImage src={promocion.imagen_url} alt="Promoción" className="object-cover" />
                    ) : (
                      <AvatarFallback className="rounded-md bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">
                  {producto?.nombre || 'Producto no encontrado'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{producto?.categoria || 'N/A'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {creator
                      ? [creator.nombre, creator.apellido].filter(Boolean).join(' ') || 
                        `Usuario ${creator.rol}` || 
                        'Sin nombre'
                      : 'Desconocido'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(promocion.created_at), 'dd MMM yyyy', { locale: es })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <FormattedCurrency value={precioReal} currency={defaultCurrency} />
                </TableCell>
                <TableCell className="text-right">
                  <FormattedCurrency
                    value={precioPromocion}
                    currency={defaultCurrency}
                    className="font-semibold text-green-600"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <FormattedCurrency
                      value={descuento}
                      currency={defaultCurrency}
                      className="text-sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      ({porcentajeDescuento.toFixed(1)}%)
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm">
                    {promocion.cantidad_minima}
                    {promocion.cantidad_maxima ? ` - ${promocion.cantidad_maxima}` : '+'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="text-xs space-y-0.5">
                    <div>
                      Total: {promocion.limite_usos ?? '∞'}
                    </div>
                    <div className="text-muted-foreground">
                      Por venta: {promocion.limite_usos_por_venta}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-mono">{promocion.cantidad_usos}</span>
                    {usosRestantes !== null && (
                      <span className="text-xs text-muted-foreground">
                        {usosRestantes} rest.
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={promocion.activo ? 'default' : 'secondary'}>
                    {promocion.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onToggleActivo(promocion)}
                      title={promocion.activo ? 'Desactivar' : 'Activar'}
                    >
                      <Power
                        className={`h-4 w-4 ${
                          promocion.activo ? 'text-green-500' : 'text-gray-400'
                        }`}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(promocion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(promocion)}
                      disabled={promocion.cantidad_usos > 0}
                      title={
                        promocion.cantidad_usos > 0
                          ? 'No se puede eliminar una promoción usada'
                          : 'Eliminar promoción'
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
