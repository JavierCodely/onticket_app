/**
 * Sale (Ventas) Types
 * Sales transactions and related types
 */

/**
 * Sale table interface
 */
export interface Sale {
  id: string;
  club_id: string;
  producto_id: string;
  personal_id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  comentarios?: string | null;
  fecha_venta: string;
  nombre_vendedor?: string | null;
  created_at: string;
}

/**
 * Sale insert type for creating new sales
 */
export type SaleInsert = Omit<Sale, 'id' | 'created_at'>;

/**
 * Sale update type for updating existing sales
 */
export type SaleUpdate = Partial<SaleInsert>;
