/**
 * Database Types - Main Export
 * Re-exports all database types from subdirectories
 */

// Auth types
export type { RolPersonal, User, AuthState } from './Auth';

// Club types
export type { Club, ClubInsert, ClubUpdate } from './Club';

// Personal types
export type { Personal, PersonalInsert, PersonalUpdate } from './Personal';

// Productos types
export type {
  CategoriaProducto,
  Producto,
  ProductoInsert,
  ProductoUpdate,
  ProductoFormData,
  StockRenewalData,
} from './Productos';

// Combos types
export type {
  Combo,
  ComboProducto,
  ComboWithProducts,
  ComboProductoItem,
  ComboFormData,
  ComboInsert,
  ComboUpdate,
} from './Combos';

// Sale types
export type { Sale, SaleInsert, SaleUpdate } from './Sale';

// InicioCierre types
export type {
  InicioCierre,
  InicioCierreInsert,
  InicioCierreUpdate,
  InicioCierreFormData,
  InicioCierreFilters,
  InicioCierreWithProducto,
} from './InicioCierre';

// Promociones types
export type {
  Promocion,
  PromocionWithProducto,
  PromocionInsert,
  PromocionUpdate,
  PromocionFormData,
} from './Promociones';

// Database schema
export type { Database } from './database';
