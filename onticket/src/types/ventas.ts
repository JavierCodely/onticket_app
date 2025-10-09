/**
 * Ventas (Sales) Types
 * Types for the sales system including cart, items, and promotions
 */

import type { CurrencyCode } from './currency';
import type { MetodoPago } from './database';
import type { Producto, Promocion, Combo } from './database';

/**
 * Cart item type - can be a product, promotion, or combo
 */
export type CartItemType = 'product' | 'promotion' | 'combo';

/**
 * Cart item base interface
 */
export interface CartItemBase {
  id: string; // unique identifier for the cart item
  type: CartItemType;
  cantidad: number;
  precio_unitario: number; // price in selected currency
  subtotal: number; // cantidad * precio_unitario
  descuento: number; // discount amount
  total: number; // subtotal - descuento
}

/**
 * Product cart item
 */
export interface CartItemProduct extends CartItemBase {
  type: 'product';
  producto_id: string;
  producto: Producto;
}

/**
 * Promotion cart item
 */
export interface CartItemPromotion extends CartItemBase {
  type: 'promotion';
  promocion_id: string;
  producto_id: string;
  promocion: Promocion;
  producto: Producto;
}

/**
 * Combo cart item
 */
export interface CartItemCombo extends CartItemBase {
  type: 'combo';
  combo_id: string;
  combo: Combo;
}

/**
 * Union type for all cart items
 */
export type CartItem = CartItemProduct | CartItemPromotion | CartItemCombo;

/**
 * Cart state
 */
export interface CartState {
  items: CartItem[];
  moneda: CurrencyCode;
  metodo_pago: MetodoPago;
  empleado_id: string | null;
  subtotal: number;
  descuento_total: number;
  total: number;
}

/**
 * Sale statistics
 */
export interface SaleStatistics {
  total_efectivo: number;
  total_transferencia: number;
  total_tarjeta: number;
  total_billetera_virtual: number;
  total_productos_vendidos: number;
  total_ventas: number;
}

/**
 * Product display item (for grid display)
 */
export interface ProductDisplayItem {
  id: string;
  nombre: string;
  categoria: string;
  imagen_url?: string | null;
  precio_compra: number; // for admin view
  precio_venta: number; // for bartender view
  stock: number;
  tipo: 'product' | 'promotion' | 'combo';
  // For promotions
  promocion_id?: string;
  cantidad_minima?: number;
  cantidad_maxima?: number | null;
  precio_real?: number;
  // For combos
  combo_id?: string;
  productos_combo?: Array<{
    producto_id: string;
    cantidad: number;
  }>;
}

/**
 * Sale creation data
 */
export interface SaleCreationData {
  empleado_id: string;
  moneda: CurrencyCode;
  metodo_pago: MetodoPago;
  items: Array<{
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    descuento: number;
    total: number;
    tipo: CartItemType;
    promocion_id?: string;
    combo_id?: string;
  }>;
  subtotal: number;
  descuento_total: number;
  total: number;
}

/**
 * Promotion validation result
 */
export interface PromotionValidation {
  isValid: boolean;
  promocion?: Promocion;
  message?: string;
}

/**
 * Combo validation result
 */
export interface ComboValidation {
  isValid: boolean;
  combo?: Combo;
  message?: string;
}
