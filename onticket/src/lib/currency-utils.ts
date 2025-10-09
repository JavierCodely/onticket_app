/**
 * Currency Utilities
 * Reusable functions for multi-currency calculations across the application
 */

import type { CurrencyCode } from '@/types/currency';
import type { Producto } from '@/types/database/Productos';

/**
 * Get price for a specific currency from a product
 */
export function getPriceForCurrency(
  producto: Producto,
  currency: CurrencyCode,
  type: 'compra' | 'venta'
): number {
  const lowerCode = currency.toLowerCase() as 'ars' | 'usd' | 'brl';
  if (type === 'compra') {
    return (producto[`precio_compra_${lowerCode}` as keyof Producto] as number) || 0;
  }
  return (producto[`precio_venta_${lowerCode}` as keyof Producto] as number) || 0;
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(precioCompra: number, precioVenta: number): number {
  if (precioCompra <= 0) return 0;
  return ((precioVenta - precioCompra) / precioCompra) * 100;
}

/**
 * Calculate profit amount
 */
export function calculateProfit(precioCompra: number, precioVenta: number): number {
  return precioVenta - precioCompra;
}

/**
 * Calculate total inventory value for a product in a specific currency
 */
export function calculateInventoryValue(
  producto: Producto,
  currency: CurrencyCode
): number {
  const precioCompra = getPriceForCurrency(producto, currency, 'compra');
  return precioCompra * producto.stock;
}

/**
 * Calculate potential profit for a product in a specific currency
 */
export function calculatePotentialProfit(
  producto: Producto,
  currency: CurrencyCode
): number {
  const precioCompra = getPriceForCurrency(producto, currency, 'compra');
  const precioVenta = getPriceForCurrency(producto, currency, 'venta');
  const profit = calculateProfit(precioCompra, precioVenta);
  return profit * producto.stock;
}

/**
 * Calculate product statistics in a specific currency
 */
export interface ProductStats {
  totalInventoryValue: number;
  totalPotentialProfit: number;
  averageProfitMargin: number;
  totalProducts: number;
  lowStockCount: number;
}

export function calculateProductStats(
  productos: Producto[],
  currency: CurrencyCode
): ProductStats {
  let totalInventoryValue = 0;
  let totalPotentialProfit = 0;
  let totalMargin = 0;
  let productsWithMargin = 0;
  let lowStockCount = 0;

  productos.forEach((producto) => {
    // Inventory value
    totalInventoryValue += calculateInventoryValue(producto, currency);

    // Potential profit
    totalPotentialProfit += calculatePotentialProfit(producto, currency);

    // Average margin
    const precioCompra = getPriceForCurrency(producto, currency, 'compra');
    const precioVenta = getPriceForCurrency(producto, currency, 'venta');
    if (precioCompra > 0) {
      totalMargin += calculateProfitMargin(precioCompra, precioVenta);
      productsWithMargin++;
    }

    // Low stock count
    if (producto.min_stock > 0 && producto.stock <= producto.min_stock) {
      lowStockCount++;
    }
  });

  return {
    totalInventoryValue,
    totalPotentialProfit,
    averageProfitMargin: productsWithMargin > 0 ? totalMargin / productsWithMargin : 0,
    totalProducts: productos.length,
    lowStockCount,
  };
}

/**
 * Get all prices for a product in all currencies
 */
export interface ProductPrices {
  ars: { compra: number; venta: number; profit: number; margin: number };
  usd: { compra: number; venta: number; profit: number; margin: number };
  brl: { compra: number; venta: number; profit: number; margin: number };
}

export function getAllProductPrices(producto: Producto): ProductPrices {
  const currencies: CurrencyCode[] = ['ARS', 'USD', 'BRL'];
  const prices: any = {};

  currencies.forEach((currency) => {
    const lowerCode = currency.toLowerCase() as 'ars' | 'usd' | 'brl';
    const compra = getPriceForCurrency(producto, currency, 'compra');
    const venta = getPriceForCurrency(producto, currency, 'venta');

    prices[lowerCode] = {
      compra,
      venta,
      profit: calculateProfit(compra, venta),
      margin: calculateProfitMargin(compra, venta),
    };
  });

  return prices as ProductPrices;
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Check if product has price in specific currency
 */
export function hasPrice(producto: Producto, currency: CurrencyCode): boolean {
  const compra = getPriceForCurrency(producto, currency, 'compra');
  const venta = getPriceForCurrency(producto, currency, 'venta');
  return compra > 0 || venta > 0;
}

/**
 * Get active currencies for a product
 */
export function getActiveCurrencies(producto: Producto): CurrencyCode[] {
  const currencies: CurrencyCode[] = [];
  
  if (hasPrice(producto, 'ARS')) currencies.push('ARS');
  if (hasPrice(producto, 'USD')) currencies.push('USD');
  if (hasPrice(producto, 'BRL')) currencies.push('BRL');

  return currencies;
}

/**
 * Format currency value with proper symbol and locale
 */
export function formatCurrency(value: number, currency: CurrencyCode = 'ARS'): string {
  const currencySymbols: Record<CurrencyCode, string> = {
    ARS: '$',
    USD: 'US$',
    BRL: 'R$',
  };

  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `${currencySymbols[currency]} ${formatted}`;
}

