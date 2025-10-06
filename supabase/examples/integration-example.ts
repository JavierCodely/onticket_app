/**
 * Integration Example: Multi-Tenant Club Management
 *
 * This file demonstrates how to integrate the Supabase multi-tenant
 * database structure into your application.
 *
 * Framework: Can be adapted for Next.js, React, Vue, etc.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// 1. SETUP & CONFIGURATION
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for user operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for operations that bypass RLS (use carefully!)
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ============================================
// 2. TYPE DEFINITIONS
// ============================================

export type PersonalRol = 'Admin' | 'Bartender' | 'Seguridad' | 'RRPP';

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

export interface Personal {
  id: string;
  user_id: string | null;
  club_id: string;
  rol: PersonalRol;
  created_at: string;
  updated_at: string;
}

export interface PersonalWithClub extends Personal {
  clubs: Club;
}

// ============================================
// 3. AUTHENTICATION SERVICES
// ============================================

export class AuthService {
  /**
   * Sign up a new user
   * Note: After signup, you must assign them to a club via PersonalService
   */
  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in existing user
   */
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  }
}

// ============================================
// 4. CLUB SERVICES
// ============================================

export class ClubService {
  /**
   * Get current user's club
   * RLS automatically filters to user's assigned club
   */
  static async getCurrentClub(): Promise<Club | null> {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return data;
  }

  /**
   * Update club information (Admin only)
   */
  static async updateClub(
    clubId: string,
    updates: Partial<Omit<Club, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Club> {
    const { data, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', clubId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update club cash account (Admin only)
   */
  static async updateCashAccount(
    clubId: string,
    amount: number,
    operation: 'add' | 'subtract'
  ): Promise<Club> {
    // First get current balance
    const club = await this.getCurrentClub();
    if (!club) throw new Error('Club not found');

    const newBalance = operation === 'add'
      ? club.cuenta_efectivo + amount
      : club.cuenta_efectivo - amount;

    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    return this.updateClub(clubId, { cuenta_efectivo: newBalance });
  }

  /**
   * Update virtual wallet account (Admin only)
   */
  static async updateVirtualWallet(
    clubId: string,
    amount: number,
    operation: 'add' | 'subtract'
  ): Promise<Club> {
    const club = await this.getCurrentClub();
    if (!club) throw new Error('Club not found');

    const newBalance = operation === 'add'
      ? club.cuenta_billetera_virtual + amount
      : club.cuenta_billetera_virtual - amount;

    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    return this.updateClub(clubId, { cuenta_billetera_virtual: newBalance });
  }

  /**
   * Get club statistics
   */
  static async getClubStats(clubId: string) {
    const club = await this.getCurrentClub();
    if (!club) throw new Error('Club not found');

    // Get staff count
    const { count: staffCount } = await supabase
      .from('personal')
      .select('*', { count: 'exact', head: true });

    return {
      totalBalance: club.cuenta_efectivo + club.cuenta_billetera_virtual,
      cashBalance: club.cuenta_efectivo,
      virtualBalance: club.cuenta_billetera_virtual,
      staffCount: staffCount || 0,
      isActive: club.activo,
    };
  }
}

// ============================================
// 5. PERSONAL (STAFF) SERVICES
// ============================================

export class PersonalService {
  /**
   * Get current user's personal record
   */
  static async getCurrentPersonal(): Promise<Personal | null> {
    const { data, error } = await supabase
      .from('personal')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * Check if current user is admin
   */
  static async isAdmin(): Promise<boolean> {
    const personal = await this.getCurrentPersonal();
    return personal?.rol === 'Admin';
  }

  /**
   * Get current user's role
   */
  static async getCurrentRole(): Promise<PersonalRol | null> {
    const personal = await this.getCurrentPersonal();
    return personal?.rol || null;
  }

  /**
   * Get all staff in current user's club (Admin only)
   */
  static async getAllStaff(): Promise<Personal[]> {
    const { data, error } = await supabase
      .from('personal')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get staff count by role (Admin only)
   */
  static async getStaffCountByRole() {
    const staff = await this.getAllStaff();

    const counts = staff.reduce((acc, person) => {
      acc[person.rol] = (acc[person.rol] || 0) + 1;
      return acc;
    }, {} as Record<PersonalRol, number>);

    return counts;
  }

  /**
   * Add new staff member (Admin only)
   * First create user via Auth, then assign to club
   */
  static async addStaffMember(
    email: string,
    password: string,
    rol: PersonalRol
  ): Promise<Personal> {
    if (!supabaseServiceRole) {
      throw new Error('Service role not configured');
    }

    // Step 1: Create auth user (using service role)
    const { data: authData, error: authError } =
      await supabaseServiceRole.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Step 2: Assign to club (using regular client with RLS)
    const { data, error } = await supabase
      .from('personal')
      .insert({
        user_id: authData.user.id,
        rol,
      })
      .select()
      .single();

    if (error) {
      // Rollback: delete the auth user if personal creation fails
      await supabaseServiceRole.auth.admin.deleteUser(authData.user.id);
      throw error;
    }

    return data;
  }

  /**
   * Update staff member's role (Admin only)
   */
  static async updateStaffRole(
    personalId: string,
    newRole: PersonalRol
  ): Promise<Personal> {
    const { data, error } = await supabase
      .from('personal')
      .update({ rol: newRole })
      .eq('id', personalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove staff member (Admin only)
   */
  static async removeStaffMember(personalId: string): Promise<void> {
    const { error } = await supabase
      .from('personal')
      .delete()
      .eq('id', personalId);

    if (error) throw error;
  }

  /**
   * Invite user to club (creates personal record without user_id)
   * User_id will be assigned later when they sign up
   */
  static async inviteToClub(rol: PersonalRol): Promise<Personal> {
    const { data, error } = await supabase
      .from('personal')
      .insert({
        user_id: null, // Will be assigned later
        rol,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Assign user to existing invitation
   */
  static async assignUserToInvitation(
    personalId: string,
    userId: string
  ): Promise<Personal> {
    const { data, error } = await supabase
      .from('personal')
      .update({ user_id: userId })
      .eq('id', personalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ============================================
// 6. REAL-TIME SUBSCRIPTIONS
// ============================================

export class RealtimeService {
  /**
   * Subscribe to club changes
   */
  static subscribeToClubChanges(
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('club-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clubs',
        },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to staff changes (Admin only)
   */
  static subscribeToStaffChanges(
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('staff-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'personal',
        },
        callback
      )
      .subscribe();
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll() {
    return supabase.removeAllChannels();
  }
}

// ============================================
// 7. USAGE EXAMPLES
// ============================================

/**
 * Example 1: User Registration Flow
 */
export async function exampleUserRegistration() {
  try {
    // Step 1: User signs up
    const { user } = await AuthService.signUp(
      'newuser@example.com',
      'securePassword123'
    );

    // Step 2: Admin assigns user to club
    // (This would be done by an admin user in a separate session)
    const personal = await PersonalService.addStaffMember(
      'newuser@example.com',
      'securePassword123',
      'Bartender'
    );

    console.log('User registered and assigned:', personal);
  } catch (error) {
    console.error('Registration failed:', error);
  }
}

/**
 * Example 2: Admin Dashboard Data
 */
export async function exampleAdminDashboard() {
  try {
    // Check if user is admin
    const isAdmin = await PersonalService.isAdmin();
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get club info
    const club = await ClubService.getCurrentClub();

    // Get club statistics
    const stats = await ClubService.getClubStats(club!.id);

    // Get all staff
    const staff = await PersonalService.getAllStaff();

    // Get staff count by role
    const staffCounts = await PersonalService.getStaffCountByRole();

    return {
      club,
      stats,
      staff,
      staffCounts,
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    throw error;
  }
}

/**
 * Example 3: Real-time Updates
 */
export function exampleRealtimeUpdates() {
  // Subscribe to club changes
  const clubChannel = RealtimeService.subscribeToClubChanges((payload) => {
    console.log('Club updated:', payload);
    // Update UI with new data
  });

  // Subscribe to staff changes
  const staffChannel = RealtimeService.subscribeToStaffChanges((payload) => {
    console.log('Staff updated:', payload);
    // Update UI with new data
  });

  // Cleanup on unmount
  return () => {
    clubChannel.unsubscribe();
    staffChannel.unsubscribe();
  };
}

/**
 * Example 4: Transaction Handling
 */
export async function exampleTransaction(amount: number) {
  try {
    const club = await ClubService.getCurrentClub();
    if (!club) throw new Error('Club not found');

    // Add money to cash account
    await ClubService.updateCashAccount(club.id, amount, 'add');

    // Deduct from virtual wallet
    await ClubService.updateVirtualWallet(club.id, amount, 'subtract');

    console.log('Transaction completed');
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

// ============================================
// 8. REACT HOOKS (BONUS)
// ============================================

/**
 * Hook: useCurrentClub
 */
export function useCurrentClub() {
  const [club, setClub] = React.useState<Club | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    ClubService.getCurrentClub()
      .then(setClub)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { club, loading, error };
}

/**
 * Hook: useCurrentRole
 */
export function useCurrentRole() {
  const [rol, setRol] = React.useState<PersonalRol | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    PersonalService.getCurrentRole()
      .then(setRol)
      .finally(() => setLoading(false));
  }, []);

  return { rol, isAdmin: rol === 'Admin', loading };
}

/**
 * Hook: useAuth
 */
export function useAuth() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Get initial user
    AuthService.getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));

    // Listen for changes
    const { data: { subscription } } = AuthService.onAuthStateChange(setUser);

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

// ============================================
// 9. UTILITY FUNCTIONS
// ============================================

/**
 * Check if user has permission for an action
 */
export async function hasPermission(
  requiredRole: PersonalRol | PersonalRol[]
): Promise<boolean> {
  const role = await PersonalService.getCurrentRole();
  if (!role) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(role);
  }

  return role === requiredRole;
}

/**
 * Require admin permission (throws if not admin)
 */
export async function requireAdmin() {
  const isAdmin = await PersonalService.isAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
}

// React is used in hooks example
import * as React from 'react';
