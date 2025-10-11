/**
 * SaleItem (Items de Venta) Types
 * Individual items within a sale transaction
 */

import type { CategoriaProducto } from '../Productos';

/**
 * Item type enumeration
 */
export type ItemType = 'product' | 'promotion' | 'combo';

/**
 * SaleItem table interface with multi-currency support
 */
export interface SaleItem {
  id: string;
  sale_id: string;
  producto_id: string;
  item_type: ItemType;
  promocion_id: string | null;
  combo_id: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  total: number;
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
  created_at: string;
  // Joined data
  productos?: {
    id: string;
    nombre: string;
    categoria: CategoriaProducto;
    imagen_url?: string | null;
  };
  promociones?: {
    id: string;
    nombre: string;
    imagen_url?: string | null;
  };
  combos?: {
    id: string;
    nombre: string;
    imagen_url?: string | null;
  };
}

/**
 * SaleItem insert type for creating new sale items
 */
export type SaleItemInsert = Omit<SaleItem, 'id' | 'created_at' | 'productos' | 'promociones' | 'combos'>;

/**
 * SaleItem update type for updating existing sale items
 */
export type SaleItemUpdate = Partial<SaleItemInsert>;

/**
 * SaleItem with full details
 */
export interface SaleItemWithDetails extends SaleItem {
  productos: {
    id: string;
    nombre: string;
    categoria: CategoriaProducto;
    imagen_url?: string | null;
  };
}
