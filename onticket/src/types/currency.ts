/**
 * Currency Types
 * Multi-currency support types and utilities
 */

export type CurrencyCode = 'ARS' | 'USD' | 'BRL';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  ARS: {
    code: 'ARS',
    name: 'Peso Argentino',
    symbol: '$',
    flag: '🇦🇷',
    locale: 'es-AR',
  },
  USD: {
    code: 'USD',
    name: 'Dólar',
    symbol: 'US$',
    flag: '🇺🇸',
    locale: 'en-US',
  },
  BRL: {
    code: 'BRL',
    name: 'Real Brasileño',
    symbol: 'R$',
    flag: '🇧🇷',
    locale: 'pt-BR',
  },
};

export interface MultiCurrencyPrice {
  ars: number;
  usd: number;
  brl: number;
}

export interface ProductPrices {
  compra: MultiCurrencyPrice;
  venta: MultiCurrencyPrice;
}

