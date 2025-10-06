/**
 * MultiCurrencyPriceInput Component
 * Input fields for prices in multiple currencies
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/atoms/CurrencyInput';
import { CURRENCIES, type CurrencyCode } from '@/types/currency';
import { calculateProfitMargin, formatPercentage } from '@/lib/currency-utils';
import { cn } from '@/lib/utils';

interface MultiCurrencyPriceInputProps {
  activeCurrencies: CurrencyCode[];
  values: {
    ars: { compra: number; venta: number };
    usd: { compra: number; venta: number };
    brl: { compra: number; venta: number };
  };
  onChange: (currency: CurrencyCode, type: 'compra' | 'venta', value: number) => void;
  disabled?: boolean;
  errors?: {
    [key: string]: string;
  };
}

export const MultiCurrencyPriceInput: React.FC<MultiCurrencyPriceInputProps> = ({
  activeCurrencies,
  values,
  onChange,
  disabled = false,
  errors = {},
}) => {
  return (
    <div className="space-y-2.5">
      {activeCurrencies.map((currencyCode) => {
        const currency = CURRENCIES[currencyCode];
        const lowerCode = currencyCode.toLowerCase() as 'ars' | 'usd' | 'brl';
        
        return (
          <div
            key={currencyCode}
            className={cn(
              "p-2.5 rounded-lg border-2 transition-all",
              "bg-card border-primary/20"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{currency.flag}</span>
              <div>
                <h4 className="font-semibold text-xs">{currency.name}</h4>
                <p className="text-xs text-muted-foreground">{currency.symbol}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor={`precio_compra_${lowerCode}`} className="text-xs font-medium">
                  Precio de compra {currency.symbol}
                </Label>
                <CurrencyInput
                  id={`precio_compra_${lowerCode}`}
                  value={values[lowerCode].compra}
                  onChange={(val) => onChange(currencyCode, 'compra', val ?? 0)}
                  disabled={disabled}
                  placeholder="0,00"
                  className="bg-background"
                />
                {errors[`precio_compra_${lowerCode}`] && (
                  <p className="text-xs text-destructive">{errors[`precio_compra_${lowerCode}`]}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`precio_venta_${lowerCode}`} className="text-xs font-medium">
                  Precio de venta {currency.symbol}
                </Label>
                <CurrencyInput
                  id={`precio_venta_${lowerCode}`}
                  value={values[lowerCode].venta}
                  onChange={(val) => onChange(currencyCode, 'venta', val ?? 0)}
                  disabled={disabled}
                  placeholder="0,00"
                  className="bg-background"
                />
                {errors[`precio_venta_${lowerCode}`] && (
                  <p className="text-xs text-destructive">{errors[`precio_venta_${lowerCode}`]}</p>
                )}
              </div>
            </div>

            {/* Profit calculation for this currency */}
            {values[lowerCode].compra > 0 && values[lowerCode].venta > 0 && (
              <div className="mt-2 pt-2 border-t border-border space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ganancia:</span>
                  <span className="font-semibold text-green-600 dark:text-green-500">
                    {currency.symbol} {(values[lowerCode].venta - values[lowerCode].compra).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Margen:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {formatPercentage(calculateProfitMargin(values[lowerCode].compra, values[lowerCode].venta))}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

