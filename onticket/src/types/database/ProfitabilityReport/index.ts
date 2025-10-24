/**
 * Profitability Report Types
 * Types for product profitability analysis
 */

import type { CategoriaProducto } from '../Productos';

/**
 * Basic profitability report result (simple version)
 */
export interface ProfitabilityReport {
  producto_id: string;
  producto_nombre: string;
  categoria: CategoriaProducto;
  precio_compra: number;
  precio_venta: number;
  cantidad_vendida: number;
  ingresos_totales: number;
  costos_totales: number;
  ganancia: number;
  margen_porcentaje: number;
}

/**
 * Multi-currency profitability report result
 */
export interface ProfitabilityReportMulticurrency {
  producto_id: string;
  producto_nombre: string;
  categoria: CategoriaProducto;

  // Purchase prices by currency
  precio_compra_ars: number;
  precio_compra_usd: number;
  precio_compra_brl: number;

  // Sale prices by currency
  precio_venta_ars: number;
  precio_venta_usd: number;
  precio_venta_brl: number;

  // Total quantity sold (same across all currencies)
  cantidad_vendida: number;

  // ARS metrics
  ingresos_totales_ars: number;
  costos_totales_ars: number;
  ganancia_ars: number;
  margen_porcentaje_ars: number;

  // USD metrics
  ingresos_totales_usd: number;
  costos_totales_usd: number;
  ganancia_usd: number;
  margen_porcentaje_usd: number;

  // BRL metrics
  ingresos_totales_brl: number;
  costos_totales_brl: number;
  ganancia_brl: number;
  margen_porcentaje_brl: number;
}

/**
 * Filters for profitability report
 */
export interface ProfitabilityReportFilters {
  /** Start date for the report range */
  start_date?: Date | null;
  /** End date for the report range */
  end_date?: Date | null;
  /** Filter by category */
  categoria?: CategoriaProducto | null;
  /** Filter by minimum quantity sold */
  min_cantidad?: number | null;
  /** Order by field */
  order_by?: 'ganancia' | 'ingresos' | 'margen' | 'cantidad' | 'nombre';
  /** Order direction */
  order_direction?: 'asc' | 'desc';
}

/**
 * Category summary for profitability analysis
 */
export interface ProfitabilityCategorySummary {
  categoria: CategoriaProducto;
  productos_count: number;
  cantidad_total_vendida: number;
  ingresos_totales_ars: number;
  costos_totales_ars: number;
  ganancia_total_ars: number;
  margen_promedio_ars: number;
}

/**
 * Overall profitability summary
 */
export interface ProfitabilitySummary {
  total_productos: number;
  total_productos_vendidos: number;
  cantidad_total_vendida: number;
  ingresos_totales_ars: number;
  costos_totales_ars: number;
  ganancia_total_ars: number;
  margen_promedio_ars: number;
  ingresos_totales_usd: number;
  costos_totales_usd: number;
  ganancia_total_usd: number;
  margen_promedio_usd: number;
  ingresos_totales_brl: number;
  costos_totales_brl: number;
  ganancia_total_brl: number;
  margen_promedio_brl: number;
}
