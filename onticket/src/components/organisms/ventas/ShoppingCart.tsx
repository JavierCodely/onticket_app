/**
 * ShoppingCart Component
 * Displays cart items with quantity controls and totals
 */

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart as CartIcon, Minus, Plus, Trash2, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/currency-utils';
import type { CartItem } from '@/types/ventas';
import type { CurrencyCode } from '@/types/currency';

interface ShoppingCartProps {
  items: CartItem[];
  moneda: CurrencyCode;
  subtotal: number;
  descuentoTotal: number;
  total: number;
  onUpdateQuantity: (itemId: string, cantidad: number) => void;
  onRemoveItem: (itemId: string) => void;
  onConfirm: () => void;
  isValid: boolean;
}

export function ShoppingCart({
  items,
  moneda,
  subtotal,
  descuentoTotal,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onConfirm,
  isValid,
}: ShoppingCartProps) {
  const getItemName = (item: CartItem): string => {
    switch (item.type) {
      case 'product':
        return item.producto.nombre;
      case 'promotion':
        return item.producto.nombre;
      case 'combo':
        return item.combo.nombre;
    }
  };

  const getItemCategory = (item: CartItem): string => {
    switch (item.type) {
      case 'product':
        return item.producto.categoria;
      case 'promotion':
        return item.producto.categoria;
      case 'combo':
        return 'Combo';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CartIcon className="h-5 w-5" />
          Carrito ({items.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <CartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>El carrito está vacío</p>
              <p className="text-sm">Selecciona productos para agregar</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{getItemName(item)}</p>
                            <p className="text-xs text-muted-foreground">{getItemCategory(item)}</p>
                          </div>
                          {item.type === 'promotion' && (
                            <Badge variant="destructive" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              Promo
                            </Badge>
                          )}
                          {item.type === 'combo' && (
                            <Badge variant="secondary" className="text-xs">
                              Combo
                            </Badge>
                          )}
                        </div>

                        {/* Price info */}
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Precio unitario:</span>
                            <span>{formatCurrency(item.precio_unitario, moneda)}</span>
                          </div>
                          {item.descuento > 0 && (
                            <div className="flex justify-between text-xs text-green-600">
                              <span>Descuento:</span>
                              <span>-{formatCurrency(item.descuento, moneda)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Total:</span>
                            <span>{formatCurrency(item.total, moneda)}</span>
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={item.cantidad}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              onUpdateQuantity(item.id, value);
                            }}
                            className="h-8 w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {items.length > 0 && (
        <CardFooter className="flex-col gap-4 border-t pt-4">
          {/* Totals */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(subtotal, moneda)}</span>
            </div>
            {descuentoTotal > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento total:</span>
                <span>-{formatCurrency(descuentoTotal, moneda)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total, moneda)}</span>
            </div>
          </div>

          {/* Confirm button */}
          <Button
            className="w-full"
            size="lg"
            onClick={onConfirm}
            disabled={!isValid}
          >
            Confirmar Venta
          </Button>
          {!isValid && (
            <p className="text-xs text-muted-foreground text-center">
              Selecciona un empleado para continuar
            </p>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
