/**
 * Database Types for OnTicket Application
 * Defines TypeScript interfaces for Supabase database schema
 */

/**
 * Role enumeration for personal staff
 */
export type RolPersonal = 'Admin' | 'Bartender' | 'Seguridad' | 'RRPP';

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
  | 'Otros';

/**
 * Club table interface (Tenant)
 */
export interface Club {
  id: string;
  nombre: string;
  activo: boolean;
  ubicacion: string | null;
  cuenta_efectivo: number;
  cuenta_billetera_virtual: number;
  created_at: string;
  updated_at: string;
}

/**
 * Personal table interface
 * Maps staff members to clubs with assigned roles
 */
export interface Personal {
  id: string;
  user_id: string;
  club_id: string;
  rol: RolPersonal;
  activo: boolean;
  nombre?: string | null;
  apellido?: string | null;
  edad?: number | null;
  fecha_cumpleanos?: string | null;
  created_at: string;
  updated_at: string;
}

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
  stock: number;
  created_at: string;
  updated_at: string;
}

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
 * Database schema type for Supabase client
 */
export interface Database {
  public: {
    Tables: {
      club: {
        Row: Club;
        Insert: Omit<Club, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Club, 'id' | 'created_at' | 'updated_at'>>;
      };
      personal: {
        Row: Personal;
        Insert: Omit<Personal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Personal, 'id' | 'created_at' | 'updated_at'>>;
      };
      productos: {
        Row: Producto;
        Insert: Omit<Producto, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Producto, 'id' | 'created_at' | 'updated_at'>>;
      };
      sale: {
        Row: Sale;
        Insert: Omit<Sale, 'id' | 'created_at'>;
        Update: Partial<Omit<Sale, 'id' | 'created_at'>>;
      };
    };
  };
}

/**
 * Extended user interface with role information
 * Combines Supabase auth.users with personal table data
 */
export interface User {
  id: string;
  email: string;
  personal: Personal;
  club: Club;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
}
