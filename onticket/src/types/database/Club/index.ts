/**
 * Club (Tenant) Types
 * Club entity and related types
 */

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
 * Club insert type for creating new clubs
 */
export type ClubInsert = Omit<Club, 'id' | 'created_at' | 'updated_at'>;

/**
 * Club update type for updating existing clubs
 */
export type ClubUpdate = Partial<ClubInsert>;
