/**
 * Promociones Types
 * Type definitions for promotions system
 */

export interface Promocion {
  id: string;
  club_id: string;
  producto_id: string;
  creado_por: string;
  precio_real: number;
  precio_promocion: number;
  precio_real_ars: number;
  precio_promocion_ars: number;
  precio_real_usd: number;
  precio_promocion_usd: number;
  precio_real_brl: number;
  precio_promocion_brl: number;
  cantidad_minima: number;
  cantidad_maxima: number | null;
  cantidad_usos: number;
  limite_usos: number | null;
  limite_usos_por_venta: number;
  activo: boolean;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromocionWithProducto extends Promocion {
  productos?: {
    id: string;
    nombre: string;
    categoria: string;
    precio_venta: number;
    stock: number;
  };
  personal?: {
    id: string;
    nombre: string | null;
    apellido: string | null;
    rol: string;
    user_id: string;
  } | null;
}

export type PromocionInsert = Omit<Promocion, 'id' | 'cantidad_usos' | 'created_at' | 'updated_at'>;

export type PromocionUpdate = Partial<PromocionInsert>;

export interface PromocionFormData {
  producto_id: string;
  precio_promocion_ars: number;
  precio_promocion_usd: number;
  precio_promocion_brl: number;
  cantidad_minima: number;
  cantidad_maxima: number | null;
  limite_usos: number | null;
  limite_usos_por_venta: number;
  activo: boolean;
  tiene_limite_usos: boolean;
  tiene_cantidad_maxima: boolean;
}
