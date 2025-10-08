/**
 * Productos (Products) Types
 * Product inventory and related types
 */

/**
 * Product category enumeration
 */
export type CategoriaProducto =
  | 'Vodka'
  | 'Vino'
  | 'Champan'
  | 'Tequila'
  | 'Sin Alcohol'
  | 'Cerveza'
  | 'Cocteles'
  | 'Whisky'
  | 'Otros';

/**
 * Producto table interface
 */
export interface Producto {
  id: string;
  club_id: string;
  nombre: string;
  categoria: CategoriaProducto;
  precio_compra: number;
  precio_venta: number;
  // Multi-currency prices
  precio_compra_ars: number;
  precio_venta_ars: number;
  precio_compra_usd: number;
  precio_venta_usd: number;
  precio_compra_brl: number;
  precio_venta_brl: number;
  stock: number;
  min_stock: number;
  max_stock: number;
  imagen_url?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Product insert type for creating new products
 */
export interface ProductoInsert {
  club_id: string;
  nombre: string;
  categoria: CategoriaProducto;
  precio_compra: number;
  precio_venta: number;
  // Multi-currency prices
  precio_compra_ars?: number;
  precio_venta_ars?: number;
  precio_compra_usd?: number;
  precio_venta_usd?: number;
  precio_compra_brl?: number;
  precio_venta_brl?: number;
  stock: number;
  min_stock: number;
  max_stock: number;
  imagen_url?: string | null;
}

/**
 * Product update type for updating existing products
 */
export interface ProductoUpdate {
  nombre?: string;
  categoria?: CategoriaProducto;
  precio_compra?: number;
  precio_venta?: number;
  // Multi-currency prices
  precio_compra_ars?: number;
  precio_venta_ars?: number;
  precio_compra_usd?: number;
  precio_venta_usd?: number;
  precio_compra_brl?: number;
  precio_venta_brl?: number;
  stock?: number;
  min_stock?: number;
  max_stock?: number;
  imagen_url?: string | null;
}

/**
 * Product form data type (used in forms)
 */
export interface ProductoFormData {
  nombre: string;
  categoria: CategoriaProducto;
  precio_compra: number;
  precio_venta: number;
  // Multi-currency prices
  precio_compra_ars: number;
  precio_venta_ars: number;
  precio_compra_usd: number;
  precio_venta_usd: number;
  precio_compra_brl: number;
  precio_venta_brl: number;
  stock: number;
  min_stock: number;
  max_stock: number;
}

/**
 * Stock renewal data type
 */
export interface StockRenewalData {
  tipo: 'add' | 'set';
  cantidad: number;
}
