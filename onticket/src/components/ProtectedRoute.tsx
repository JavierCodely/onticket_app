/**
 * ProtectedRoute Component
 * Guards routes requiring authentication and role assignment
 *
 * Security Features:
 * - Checks if user is authenticated
 * - Verifies user has role assignment in personal table
 * - Redirects to /login if not authenticated
 * - Shows loading state during auth check
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export interface ProtectedRouteProps {
  /** Component to render if authenticated and authorized */
  children: React.ReactNode;
}

/**
 * ProtectedRoute wrapper component
 * Ensures only authenticated users with role assignments can access protected pages
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner during authentication check
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated, no role assigned, or inactive
  if (!user || !user.personal || !user.personal.activo) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
};
