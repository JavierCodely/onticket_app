/**
 * InicioCierre (Inventory Opening/Closing) Types
 * Inventory tracking for opening and closing stock levels
 */

import { CategoriaProducto } from '../Productos';

/**
 * InicioCierre table interface
 */
export interface InicioCierre {
  id: string;
  club_id: string;
  producto_id: string;
  nombre_producto: string;
  categoria: CategoriaProducto;
  fecha_inicio: string;
  fecha_cierre: string | null;
  stock_inicio: number;
  stock_cierre: number | null;
  total_vendido: number; // Calculated field
  created_at: string;
  updated_at: string;
}

/**
 * InicioCierre insert type for creating new opening records
 */
export interface InicioCierreInsert {
  club_id: string;
  producto_id: string;
  nombre_producto: string;
  categoria: CategoriaProducto;
  fecha_inicio?: string;
  stock_inicio: number;
}

/**
 * InicioCierre update type for closing records
 */
export interface InicioCierreUpdate {
  fecha_cierre?: string;
  stock_cierre?: number;
}

/**
 * Form data for creating a batch of opening records
 */
export interface InicioCierreFormData {
  productos: Array<{
    producto_id: string;
    nombre_producto: string;
    categoria: CategoriaProducto;
    stock_inicio: number;
  }>;
}

/**
 * Filters for querying opening/closing records
 */
export interface InicioCierreFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  categoria?: CategoriaProducto;
  solo_abiertos?: boolean; // Only show records without fecha_cierre
}

/**
 * Extended InicioCierre with producto details
 */
export interface InicioCierreWithProducto extends InicioCierre {
  producto?: {
    id: string;
    nombre: string;
    categoria: CategoriaProducto;
    stock: number;
  };
}
