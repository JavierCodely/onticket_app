/**
 * Sale (Ventas) Types
 * Sales transactions and related types
 */

import type { CurrencyCode } from '../../currency';

/**
 * Payment method enumeration
 */
export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'billetera_virtual';

/**
 * Sale table interface with multi-currency support
 */
export interface Sale {
  id: string;
  club_id: string;
  producto_id: string;
  personal_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  total: number;
  moneda: CurrencyCode;
  // Multi-currency prices (ARS)
  precio_unitario_ars: number;
  subtotal_ars: number;
  descuento_ars: number;
  total_ars: number;
  // Multi-currency prices (USD)
  precio_unitario_usd: number;
  subtotal_usd: number;
  descuento_usd: number;
  total_usd: number;
  // Multi-currency prices (BRL)
  precio_unitario_brl: number;
  subtotal_brl: number;
  descuento_brl: number;
  total_brl: number;
  metodo_pago: MetodoPago;
  comentarios?: string | null;
  created_at: string;
  // Joined data
  productos?: {
    id: string;
    nombre: string;
    categoria: string;
    imagen_url?: string | null;
  };
  personal?: {
    id: string;
    nombre: string | null;
    apellido: string | null;
    rol: string;
  };
}

/**
 * Sale insert type for creating new sales
 */
export type SaleInsert = Omit<Sale, 'id' | 'created_at' | 'productos' | 'personal'>;

/**
 * Sale update type for updating existing sales
 */
export type SaleUpdate = Partial<SaleInsert>;

/**
 * Sale with full details
 */
export interface SaleWithDetails extends Sale {
  productos: {
    id: string;
    nombre: string;
    categoria: string;
    imagen_url?: string | null;
  };
  personal: {
    id: string;
    nombre: string | null;
    apellido: string | null;
    rol: string;
  };
}

/**
 * Sale filters for querying
 */
export interface SaleFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  personal_id?: string;
  metodo_pago?: MetodoPago;
  categoria?: string;
  moneda?: CurrencyCode;
}
