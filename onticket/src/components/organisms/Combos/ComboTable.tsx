/**
 * ComboTable Organism
 * Table layout for displaying combos with products and usage stats
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
import { Pencil, Trash2, Package, Power, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import { ProfitBadge } from '@/components/atoms/ProfitBadge';
import { useCurrency } from '@/hooks/useCurrency';
import type { ComboWithProducts } from '@/types/database/Combos';

interface ComboTableProps {
  combos: ComboWithProducts[];
  onEdit: (combo: ComboWithProducts) => void;
  onDelete: (combo: ComboWithProducts) => void;
  onToggleActivo: (combo: ComboWithProducts) => void;
  productosMap: Map<string, any>;
}

export const ComboTable: React.FC<ComboTableProps> = ({
  combos,
  onEdit,
  onDelete,
  onToggleActivo,
  productosMap,
}) => {
  const { defaultCurrency } = useCurrency();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPriceForCurrency = (combo: ComboWithProducts, type: 'real' | 'combo') => {
    const currencyLower = defaultCurrency.toLowerCase() as 'ars' | 'usd' | 'brl';
    return type === 'real'
      ? combo[`precio_real_${currencyLower}`]
      : combo[`precio_combo_${currencyLower}`];
  };

  if (combos.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">No se encontraron combos</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Crea un nuevo combo para comenzar</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[80px] font-semibold">Imagen</TableHead>
            <TableHead className="font-semibold">Nombre</TableHead>
            <TableHead className="font-semibold">Productos</TableHead>
            <TableHead className="text-right font-semibold">P. Real</TableHead>
            <TableHead className="text-right font-semibold">P. Combo</TableHead>
            <TableHead className="font-semibold">Descuento</TableHead>
            <TableHead className="text-center font-semibold">Usos</TableHead>
            <TableHead className="font-semibold">Creado</TableHead>
            <TableHead className="text-center font-semibold">Estado</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {combos.map((combo) => {
            const precioReal = getPriceForCurrency(combo, 'real');
            const precioCombo = getPriceForCurrency(combo, 'combo');
            const descuento = precioReal - precioCombo;
            const porcentajeDescuento = precioReal > 0 ? ((descuento / precioReal) * 100) : 0;

            const usosLimitados = combo.limite_usos !== null;
            const usosAgotados = usosLimitados && combo.cantidad_usos >= combo.limite_usos!;

            return (
              <TableRow
                key={combo.id}
                className={`hover:bg-muted/30 transition-colors ${
                  !combo.activo
                    ? 'opacity-60 bg-muted/20'
                    : usosAgotados
                    ? 'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    : ''
                }`}
              >
                {/* Imagen */}
                <TableCell>
                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900 flex items-center justify-center border-2 border-purple-200 dark:border-purple-800 shadow-sm">
                    {combo.imagen_url ? (
                      <img
                        src={combo.imagen_url}
                        alt={combo.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-purple-400 dark:text-purple-600" />
                    )}
                  </div>
                </TableCell>

                {/* Nombre */}
                <TableCell className="font-semibold text-foreground">
                  {combo.nombre}
                  {!combo.activo && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-500 text-white text-xs font-bold rounded">
                      INACTIVO
                    </span>
                  )}
                  {usosAgotados && (
                    <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                      AGOTADO
                    </span>
                  )}
                </TableCell>

                {/* Productos */}
                <TableCell>
                  <div className="space-y-1 max-w-xs">
                    {combo.combo_productos.map((cp) => {
                      const producto = productosMap.get(cp.producto_id);
                      if (!producto) return null;

                      const stockDisponible = producto.stock;
                      const stockNecesario = cp.cantidad;
                      const stockSuficiente = stockDisponible >= stockNecesario;

                      return (
                        <div key={cp.id} className="text-xs flex items-center justify-between gap-2">
                          <span className="truncate">
                            {producto.nombre}
                          </span>
                          <span className={`font-mono whitespace-nowrap ${
                            stockSuficiente
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400 font-semibold'
                          }`}>
                            {stockNecesario}/{stockDisponible}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </TableCell>

                {/* Precio Real */}
                <TableCell className="text-right">
                  <FormattedCurrency
                    value={precioReal}
                    currency={defaultCurrency}
                    className="font-mono text-sm"
                  />
                </TableCell>

                {/* Precio Combo */}
                <TableCell className="text-right">
                  <FormattedCurrency
                    value={precioCombo}
                    currency={defaultCurrency}
                    className="font-mono text-sm font-semibold"
                  />
                </TableCell>

                {/* Descuento */}
                <TableCell>
                  <ProfitBadge
                    profit={descuento}
                    profitPercentage={porcentajeDescuento}
                    currency={defaultCurrency}
                    label="Descuento"
                    colorScheme="discount"
                  />
                </TableCell>

                {/* Usos */}
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-mono font-semibold text-sm">
                      {combo.cantidad_usos}
                      {usosLimitados && ` / ${combo.limite_usos}`}
                    </span>
                    {usosLimitados && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-[60px]">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            usosAgotados
                              ? 'bg-orange-500'
                              : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${Math.min((combo.cantidad_usos / combo.limite_usos!) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                    {!usosLimitados && (
                      <span className="text-xs text-muted-foreground">ilimitado</span>
                    )}
                  </div>
                </TableCell>

                {/* Fecha de Creación */}
                <TableCell>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(combo.created_at)}
                  </div>
                </TableCell>

                {/* Estado */}
                <TableCell className="text-center">
                  <Badge
                    variant={combo.activo ? 'default' : 'secondary'}
                    className={combo.activo ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    {combo.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>

                {/* Acciones */}
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleActivo(combo)}
                      title={combo.activo ? 'Desactivar combo' : 'Activar combo'}
                      className="h-8 w-8"
                    >
                      {combo.activo ? (
                        <PowerOff className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Power className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(combo)}
                      title="Editar combo"
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(combo)}
                      title="Eliminar combo"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      disabled={combo.cantidad_usos > 0}
                    >
                      <Trash2 className="h-4 w-4" />
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
