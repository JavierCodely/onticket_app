/**
 * Database Schema Type for Supabase Client
 * Main database interface that combines all table types
 */

import type { Club, ClubInsert, ClubUpdate } from './Club';
import type { Personal, PersonalInsert, PersonalUpdate } from './Personal';
import type { Producto, ProductoInsert, ProductoUpdate } from './Productos';
import type { Sale, SaleInsert, SaleUpdate } from './Sale';
import type { InicioCierre, InicioCierreInsert, InicioCierreUpdate } from './InicioCierre';

/**
 * Database schema type for Supabase client
 * Used for type-safe database operations
 */
export interface Database {
  public: {
    Tables: {
      club: {
        Row: Club;
        Insert: ClubInsert;
        Update: ClubUpdate;
      };
      personal: {
        Row: Personal;
        Insert: PersonalInsert;
        Update: PersonalUpdate;
      };
      productos: {
        Row: Producto;
        Insert: ProductoInsert;
        Update: ProductoUpdate;
      };
      sale: {
        Row: Sale;
        Insert: SaleInsert;
        Update: SaleUpdate;
      };
      inicioycierre: {
        Row: InicioCierre;
        Insert: InicioCierreInsert;
        Update: InicioCierreUpdate;
      };
    };
  };
}
