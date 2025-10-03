/**
 * Authentication Context
 * Manages global authentication state and provides auth methods
 *
 * Features:
 * - Fetches user + role from personal table after login
 * - Only allows authenticated users with role assignment
 * - Provides signIn, signOut methods
 * - Automatic session persistence
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Personal, Club } from '@/types/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use authentication context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication Provider Component
 * Wraps the application to provide authentication state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches user personal data and club assignment from database
   * Validates that user is active
   */
  const fetchUserRole = async (userId: string): Promise<User | null> => {
    try {
      console.log('🔍 Fetching user role for:', userId);

      // Add timeout to prevent hanging
      const timeout = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.error('⏱️ fetchUserRole timeout after 10 seconds');
          resolve(null);
        }, 10000);
      });

      const fetchData = async (): Promise<User | null> => {
        // Fetch personal data
        console.log('📋 Querying personal table...');
        const { data: personalData, error: personalError } = await supabase
          .from('personal')
          .select('*')
          .eq('user_id', userId)
          .single<Personal>();

        if (personalError) {
          console.error('❌ Error fetching personal data:', personalError.message, personalError.code);
          return null;
        }

        if (!personalData) {
          console.log('⚠️ No personal data found for user');
          return null;
        }

        console.log('✅ Personal data fetched:', personalData);

        // Check if user is active
        if (!personalData.activo) {
          console.warn('🚫 User is inactive:', userId);
          return null;
        }

        // Fetch club data
        console.log('🏢 Querying club table...');
        const { data: clubData, error: clubError } = await supabase
          .from('club')
          .select('*')
          .eq('id', personalData.club_id)
          .single<Club>();

        if (clubError) {
          console.error('❌ Error fetching club data:', clubError.message, clubError.code);
          return null;
        }

        if (!clubData) {
          console.log('⚠️ No club data found');
          return null;
        }

        console.log('✅ Club data fetched:', clubData);

        // Get user email from auth
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          console.log('⚠️ No auth user found');
          return null;
        }

        const userData: User = {
          id: authUser.id,
          email: authUser.email || '',
          personal: personalData,
          club: clubData,
        };

        console.log('✅ User data assembled successfully');
        return userData;
      };

      // Race between fetch and timeout
      const result = await Promise.race([fetchData(), timeout]);
      return result;
    } catch (error) {
      console.error('💥 Error in fetchUserRole:', error);
      return null;
    }
  };

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('Initializing authentication...');

        // Check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) setLoading(false);
          return;
        }

        console.log('Session:', session);

        if (session?.user) {
          console.log('User session found, fetching role...');
          const userWithRole = await fetchUserRole(session.user.id);
          if (mounted) {
            setUser(userWithRole);
          }
        } else {
          console.log('No active session');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          console.log('Setting loading to false');
          setLoading(false);
        }
      }
    };

    // Set a safety timeout to ensure loading always completes
    const safetyTimeout = setTimeout(() => {
      console.warn('Auth initialization timeout - forcing loading to false');
      if (mounted) {
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    initAuth().then(() => {
      clearTimeout(safetyTimeout);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          const userWithRole = await fetchUserRole(session.user.id);
          if (mounted) {
            setUser(userWithRole);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
          }
        }
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   * Validates that user has a role assignment in personal table
   */
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    try {
      console.log('🔐 Starting sign in process...');
      setLoading(true);

      // Attempt sign in with timeout
      console.log('🔑 Authenticating with Supabase...');
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const authTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), 15000);
      });

      const { data, error } = await Promise.race([authPromise, authTimeout]);

      if (error) {
        console.error('❌ Authentication failed:', error.message);
        return { error: error.message };
      }

      if (!data.user) {
        console.error('❌ No user returned from sign in');
        return { error: 'No user returned from sign in' };
      }

      console.log('✅ Authentication successful, fetching role...');

      // Fetch user data and validate
      const userWithRole = await fetchUserRole(data.user.id);

      if (!userWithRole) {
        // User exists but has no role assignment or is inactive - sign them out
        console.warn('⚠️ User has no role or is inactive, signing out...');
        await supabase.auth.signOut();
        return {
          error: 'Tu cuenta está inactiva o no tienes un rol asignado. Contacta al administrador.'
        };
      }

      console.log('✅ Sign in complete');
      setUser(userWithRole);
      return { error: null };
    } catch (error) {
      console.error('💥 Error in signIn:', error);
      // Clean up auth state on error
      await supabase.auth.signOut();

      if (error instanceof Error && error.message === 'Authentication timeout') {
        return { error: 'El servidor tardó demasiado en responder. Verifica tu conexión.' };
      }

      return { error: 'Ocurrió un error durante el inicio de sesión' };
    } finally {
      console.log('🏁 Sign in process finished');
      setLoading(false);
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error in signOut:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
