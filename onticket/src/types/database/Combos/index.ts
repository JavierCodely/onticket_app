/**
 * Combos Types
 * Product combo bundles and related types
 */

import type { Producto } from '../Productos';

/**
 * Combo table interface
 */
export interface Combo {
  id: string;
  club_id: string;
  creado_por: string;
  nombre: string;
  precio_real: number;
  precio_combo: number;
  // Multi-currency prices
  precio_real_ars: number;
  precio_combo_ars: number;
  precio_real_usd: number;
  precio_combo_usd: number;
  precio_real_brl: number;
  precio_combo_brl: number;
  cantidad_usos: number;
  limite_usos: number | null;
  limite_usos_por_venta: number;
  activo: boolean;
  imagen_url?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  personal?: {
    user_id: string;
  };
}

/**
 * ComboProducto (junction table) interface
 */
export interface ComboProducto {
  id: string;
  club_id: string;
  combo_id: string;
  producto_id: string;
  cantidad: number;
  created_at: string;
  // Joined product data
  productos?: Producto;
}

/**
 * Combo with products expanded
 */
export interface ComboWithProducts extends Combo {
  combo_productos: ComboProducto[];
}

/**
 * Product item for combo form
 */
export interface ComboProductoItem {
  producto_id: string;
  cantidad: number;
  producto?: Producto;
}

/**
 * Combo form data type (used in forms)
 */
export interface ComboFormData {
  nombre: string;
  productos: ComboProductoItem[];
  precio_combo_ars: number;
  precio_combo_usd: number;
  precio_combo_brl: number;
  limite_usos: number | null;
  limite_usos_por_venta: number;
  activo: boolean;
  tiene_limite_usos: boolean;
}

/**
 * Combo insert type for creating new combos
 */
export interface ComboInsert {
  club_id: string;
  creado_por: string;
  nombre: string;
  precio_real: number;
  precio_combo: number;
  precio_real_ars: number;
  precio_combo_ars: number;
  precio_real_usd: number;
  precio_combo_usd: number;
  precio_real_brl: number;
  precio_combo_brl: number;
  limite_usos?: number | null;
  limite_usos_por_venta: number;
  activo: boolean;
  imagen_url?: string | null;
}

/**
 * Combo update type for updating existing combos
 */
export interface ComboUpdate {
  nombre?: string;
  precio_real?: number;
  precio_combo?: number;
  precio_real_ars?: number;
  precio_combo_ars?: number;
  precio_real_usd?: number;
  precio_combo_usd?: number;
  precio_real_brl?: number;
  precio_combo_brl?: number;
  limite_usos?: number | null;
  limite_usos_por_venta?: number;
  activo?: boolean;
  imagen_url?: string | null;
}
