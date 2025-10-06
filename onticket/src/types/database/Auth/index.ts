/**
 * Authentication Types
 * User, roles, and authentication state types
 */

import type { Personal } from '../Personal';
import type { Club } from '../Club';

/**
 * Role enumeration for personal staff
 */
export type RolPersonal = 'Admin' | 'Bartender' | 'Seguridad' | 'RRPP';

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
