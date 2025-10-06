/**
 * Personal (Staff) Types
 * Staff members and their club assignments
 */

import type { RolPersonal } from '../Auth';

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
 * Personal insert type for creating new staff members
 */
export type PersonalInsert = Omit<Personal, 'id' | 'created_at' | 'updated_at'>;

/**
 * Personal update type for updating existing staff members
 */
export type PersonalUpdate = Partial<PersonalInsert>;
