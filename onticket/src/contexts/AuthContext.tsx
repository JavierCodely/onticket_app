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

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Personal, Club } from '@/types/database';

// Conditional logging - only in development
const isDev = import.meta.env.DEV;
const log = {
  info: (...args: any[]) => isDev && console.log(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
  error: (...args: any[]) => console.error(...args), // Always show errors
};

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
  const fetchingRef = useRef(false); // Prevent duplicate fetches
  const userCacheRef = useRef<Map<string, User | null>>(new Map()); // Cache user data

  /**
   * Fetches user personal data and club assignment from database
   * Validates that user is active
   * Implements caching to avoid redundant queries
   */
  const fetchUserRole = async (userId: string): Promise<User | null> => {
    try {
      // Check cache first
      if (userCacheRef.current.has(userId)) {
        log.info('📦 Using cached user data for:', userId);
        return userCacheRef.current.get(userId) || null;
      }

      // Prevent duplicate fetches
      if (fetchingRef.current) {
        log.info('⏸️ Fetch already in progress, skipping duplicate');
        return null;
      }

      fetchingRef.current = true;
      log.info('🔍 Fetching user role for:', userId);

      // Add timeout to prevent hanging
      const timeout = new Promise<null>((resolve) => {
        setTimeout(() => {
          log.error('⏱️ fetchUserRole timeout after 8 seconds');
          resolve(null);
        }, 8000); // Reduced from 10s to 8s
      });

      const fetchData = async (): Promise<User | null> => {
        // Fetch personal data
        log.info('📋 Querying personal table...');
        const { data: personalData, error: personalError } = await supabase
          .from('personal')
          .select('*')
          .eq('user_id', userId)
          .single<Personal>();

        if (personalError) {
          log.error('❌ Error fetching personal data:', personalError.message, personalError.code);
          return null;
        }

        if (!personalData) {
          log.warn('⚠️ No personal data found for user');
          return null;
        }

        log.info('✅ Personal data fetched');

        // Check if user is active
        if (!personalData.activo) {
          log.warn('🚫 User is inactive:', userId);
          return null;
        }

        // Fetch club data
        log.info('🏢 Querying club table...');
        const { data: clubData, error: clubError } = await supabase
          .from('club')
          .select('*')
          .eq('id', personalData.club_id)
          .single<Club>();

        if (clubError) {
          log.error('❌ Error fetching club data:', clubError.message, clubError.code);
          return null;
        }

        if (!clubData) {
          log.warn('⚠️ No club data found');
          return null;
        }

        log.info('✅ Club data fetched');

        // Get user email from auth
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          log.warn('⚠️ No auth user found');
          return null;
        }

        const userData: User = {
          id: authUser.id,
          email: authUser.email || '',
          personal: personalData,
          club: clubData,
        };

        log.info('✅ User data assembled successfully');
        
        // Cache the result
        userCacheRef.current.set(userId, userData);
        
        return userData;
      };

      // Race between fetch and timeout
      const result = await Promise.race([fetchData(), timeout]);
      return result;
    } catch (error) {
      log.error('💥 Error in fetchUserRole:', error);
      return null;
    } finally {
      fetchingRef.current = false;
    }
  };

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        log.info('🚀 Initializing authentication...');

        // Check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          log.error('❌ Error getting session:', sessionError);
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user) {
          log.info('👤 User session found, fetching role...');
          const userWithRole = await fetchUserRole(session.user.id);
          if (mounted) {
            setUser(userWithRole);
          }
        } else {
          log.info('🔓 No active session');
        }
      } catch (error) {
        log.error('❌ Error initializing auth:', error);
      } finally {
        if (mounted) {
          log.info('✅ Auth initialization complete');
          setLoading(false);
        }
      }
    };

    // Set a safety timeout to ensure loading always completes
    const safetyTimeout = setTimeout(() => {
      log.warn('⏱️ Auth initialization timeout - forcing loading to false');
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
        log.info('🔄 Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userWithRole = await fetchUserRole(session.user.id);
          if (mounted) {
            setUser(userWithRole);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            // Clear cache on sign out
            userCacheRef.current.clear();
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
      log.info('🔐 Starting sign in process...');
      setLoading(true);

      // Attempt sign in with timeout
      log.info('🔑 Authenticating with Supabase...');
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const authTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), 15000);
      });

      const { data, error } = await Promise.race([authPromise, authTimeout]);

      if (error) {
        log.error('❌ Authentication failed:', error.message);
        return { error: error.message };
      }

      if (!data.user) {
        log.error('❌ No user returned from sign in');
        return { error: 'No user returned from sign in' };
      }

      log.info('✅ Authentication successful, fetching role...');

      // Fetch user data and validate
      const userWithRole = await fetchUserRole(data.user.id);

      if (!userWithRole) {
        // User exists but has no role assignment or is inactive - sign them out
        log.warn('⚠️ User has no role or is inactive, signing out...');
        await supabase.auth.signOut();
        return {
          error: 'Tu cuenta está inactiva o no tienes un rol asignado. Contacta al administrador.'
        };
      }

      log.info('✅ Sign in complete');
      setUser(userWithRole);
      return { error: null };
    } catch (error) {
      log.error('💥 Error in signIn:', error);
      // Clean up auth state on error
      await supabase.auth.signOut();

      if (error instanceof Error && error.message === 'Authentication timeout') {
        return { error: 'El servidor tardó demasiado en responder. Verifica tu conexión.' };
      }

      return { error: 'Ocurrió un error durante el inicio de sesión' };
    } finally {
      log.info('🏁 Sign in process finished');
      setLoading(false);
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      log.info('👋 Signing out...');
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      // Clear cache on sign out
      userCacheRef.current.clear();
      log.info('✅ Sign out complete');
    } catch (error) {
      log.error('❌ Error in signOut:', error);
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
