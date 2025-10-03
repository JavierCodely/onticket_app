/**
 * RoleBasedRedirect Component
 * Redirects authenticated users to their role-specific dashboard
 *
 * Role Routing:
 * - Admin -> /admin/informacion
 * - Bartender -> /bartender
 * - Seguridad -> /seguridad
 * - RRPP -> /rrpp
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Get the dashboard path based on user role
 */
const getRoleDashboard = (rol: string): string => {
  switch (rol) {
    case 'Admin':
      return '/admin/informacion';
    case 'Bartender':
      return '/bartender';
    case 'Seguridad':
      return '/seguridad';
    case 'RRPP':
      return '/rrpp';
    default:
      return '/login';
  }
};

/**
 * RoleBasedRedirect component
 * Automatically redirects users to their role-specific dashboard
 */
export const RoleBasedRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading during auth check
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !user.personal) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  const dashboardPath = getRoleDashboard(user.personal.rol);
  return <Navigate to={dashboardPath} replace />;
};
