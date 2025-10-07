/**
 * Database Types - Main Export
 * Re-exports all database types for backward compatibility
 *
 * Note: You can also import from specific subdirectories:
 * - '@/types/database/Auth' for authentication types
 * - '@/types/database/Club' for club types
 * - '@/types/database/Personal' for staff types
 * - '@/types/database/Productos' for product types
 * - '@/types/database/Sale' for sales types
 * - '@/types/database/Combos' for combo types
 */

// Export all types explicitly (export * doesn't re-export 'export type')
export type { RolPersonal, User, AuthState } from './database/Auth';
export type { Club, ClubInsert, ClubUpdate } from './database/Club';
export type { Personal, PersonalInsert, PersonalUpdate } from './database/Personal';
export type {
  CategoriaProducto,
  Producto,
  ProductoInsert,
  ProductoUpdate,
  ProductoFormData,
  StockRenewalData,
} from './database/Productos';
export type {
  Combo,
  ComboProducto,
  ComboWithProducts,
  ComboProductoItem,
  ComboFormData,
  ComboInsert,
  ComboUpdate,
} from './database/Combos';
export type { Sale, SaleInsert, SaleUpdate } from './database/Sale';
export type {
  InicioCierre,
  InicioCierreInsert,
  InicioCierreUpdate,
  InicioCierreFormData,
  InicioCierreFilters,
  InicioCierreWithProducto,
} from './database/InicioCierre';
export type { Database } from './database/database';
