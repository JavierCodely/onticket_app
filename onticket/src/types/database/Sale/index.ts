/**
 * Sale (Ventas) Types
 * Sales transactions and related types
 */

import type { CurrencyCode } from '../../currency';
import type { SaleItem } from '../SaleItem';

/**
 * Payment method enumeration
 */
export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'billetera_virtual' | 'mixto' | 'tarjeta_vip';

/**
 * Sale table interface (header only) with multi-currency support
 * Individual items are stored in sale_items table
 */
export interface Sale {
  id: string;
  club_id: string;
  personal_id: string;
  subtotal: number;
  descuento: number;
  total: number;
  moneda: CurrencyCode;
  // Multi-currency totals (ARS)
  subtotal_ars: number;
  descuento_ars: number;
  total_ars: number;
  // Multi-currency totals (USD)
  subtotal_usd: number;
  descuento_usd: number;
  total_usd: number;
  // Multi-currency totals (BRL)
  subtotal_brl: number;
  descuento_brl: number;
  total_brl: number;
  metodo_pago: MetodoPago;
  monto_efectivo: number; // Amount paid in cash (used when metodo_pago = 'mixto')
  monto_transferencia: number; // Amount paid by transfer (used when metodo_pago = 'mixto')
  comentarios?: string | null;
  created_at: string;
  // Joined data
  personal?: {
    id: string;
    nombre: string | null;
    apellido: string | null;
    rol: string;
  };
  sale_items?: SaleItem[];
}

/**
 * Sale insert type for creating new sales
 */
export type SaleInsert = Omit<Sale, 'id' | 'created_at' | 'personal' | 'sale_items'>;

/**
 * Sale update type for updating existing sales
 */
export type SaleUpdate = Partial<SaleInsert>;

/**
 * Sale with full details including items and employee
 */
export interface SaleWithDetails extends Sale {
  personal: {
    id: string;
    nombre: string | null;
    apellido: string | null;
    rol: string;
  };
  sale_items: SaleItem[];
}

/**
 * Sale filters for querying
 */
export interface SaleFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  personal_id?: string | string[]; // Support single or multiple employees
  rol?: string | string[]; // Support single or multiple employee roles
  metodo_pago?: MetodoPago | MetodoPago[]; // Support single or multiple payment methods
  categoria?: string;
  producto_id?: string; // Filter by specific product
  moneda?: CurrencyCode;
}
