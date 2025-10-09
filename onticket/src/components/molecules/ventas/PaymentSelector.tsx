/**
 * PaymentSelector Component
 * Selector for payment method and currency
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MetodoPago } from '@/types/database';
import type { CurrencyCode } from '@/types/currency';
import { CURRENCIES } from '@/types/currency';
import { CreditCard, Coins } from 'lucide-react';

interface PaymentSelectorProps {
  metodoPago: MetodoPago;
  onMetodoPagoChange: (metodo: MetodoPago) => void;
  moneda: CurrencyCode;
  onMonedaChange: (moneda: CurrencyCode) => void;
  canChangeCurrency?: boolean;
  disabled?: boolean;
}

export function PaymentSelector({
  metodoPago,
  onMetodoPagoChange,
  moneda,
  onMonedaChange,
  canChangeCurrency = true,
  disabled,
}: PaymentSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Payment Method */}
      <div className="space-y-2">
        <Label htmlFor="metodo_pago" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Método de pago
        </Label>
        <Select
          value={metodoPago}
          onValueChange={(value) => onMetodoPagoChange(value as MetodoPago)}
          disabled={disabled}
        >
          <SelectTrigger id="metodo_pago">
            <SelectValue />
          </SelectTrigger>
          <SelectContent forceNonPortal>
            <SelectItem value="efectivo">💵 Efectivo</SelectItem>
            <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
            <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
            <SelectItem value="billetera_virtual">📱 Billetera Virtual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label htmlFor="moneda" className="flex items-center gap-2">
          <Coins className="h-4 w-4" />
          Moneda
        </Label>
        <Select
          value={moneda}
          onValueChange={(value) => onMonedaChange(value as CurrencyCode)}
          disabled={disabled || !canChangeCurrency}
        >
          <SelectTrigger id="moneda">
            <SelectValue />
          </SelectTrigger>
          <SelectContent forceNonPortal>
            {Object.values(CURRENCIES).map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.flag} {currency.name} ({currency.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!canChangeCurrency && (
          <p className="text-xs text-muted-foreground">
            Algunos productos no tienen precio en otras monedas
          </p>
        )}
      </div>
    </div>
  );
}
