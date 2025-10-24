/**
 * ProtectedAppWrapper Component
 * Wraps protected routes with theme providers and other non-essential features
 * Only loaded AFTER successful authentication
 * 
 * Security: Prevents loading admin components on public login page
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleBasedRedirect } from '@/components/RoleBasedRedirect';
import { Toaster } from '@/components/ui/sonner';

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Protected routes - lazy loaded only when authenticated
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const RentabilidadPage = lazy(() => import('@/pages/admin/rentabilidad/RentabilidadPage').then(m => ({ default: m.RentabilidadPage })));
const InformacionPage = lazy(() => import('@/pages/admin/informacion/InformacionPage').then(m => ({ default: m.InformacionPage })));
const ProductosPage = lazy(() => import('@/pages/admin/productos/ProductosPage').then(m => ({ default: m.ProductosPage })));
const InicioCierrePage = lazy(() => import('@/pages/admin/inicio-cierre/InicioCierrePage').then(m => ({ default: m.InicioCierrePage })));
const VentasPage = lazy(() => import('@/pages/admin/ventas/VentasPage').then(m => ({ default: m.VentasPage })));
const GastosPage = lazy(() => import('@/pages/admin/gastos/GastosPage').then(m => ({ default: m.GastosPage })));
const CalendarioPage = lazy(() => import('@/pages/admin/calendario/CalendarioPage').then(m => ({ default: m.CalendarioPage })));
const EmpleadosPage = lazy(() => import('@/pages/admin/empleados/EmpleadosPage').then(m => ({ default: m.EmpleadosPage })));
const ConfiguracionesPage = lazy(() => import('@/pages/admin/configuraciones/ConfiguracionesPage').then(m => ({ default: m.ConfiguracionesPage })));
const CombosPage = lazy(() => import('@/pages/admin/combos/CombosPage').then(m => ({ default: m.CombosPage })));
const PromocionesPage = lazy(() => import('@/pages/admin/promociones/PromocionesPage').then(m => ({ default: m.PromocionesPage })));
const BartenderVentasPage = lazy(() => import('@/pages/bartender/ventas/VentasPage').then(m => ({ default: m.VentasPage })));

export const ProtectedAppWrapper: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster />
      <Routes>
          {/* Root - Redirect based on role */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="rentabilidad" element={<RentabilidadPage />} />
                    <Route path="informacion" element={<InformacionPage />} />
                    <Route path="productos" element={<ProductosPage />} />
                    <Route path="combos" element={<CombosPage />} />
                    <Route path="promociones" element={<PromocionesPage />} />
                    <Route path="inicio-cierre" element={<InicioCierrePage />} />
                    <Route path="ventas" element={<VentasPage />} />
                    <Route path="gastos" element={<GastosPage />} />
                    <Route path="calendario" element={<CalendarioPage />} />
                    <Route path="empleados" element={<EmpleadosPage />} />
                    <Route path="configuraciones" element={<ConfiguracionesPage />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Bartender Routes */}
          <Route
            path="/bartender/*"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<BartenderVentasPage />} />
                    <Route path="ventas" element={<BartenderVentasPage />} />
                    <Route path="*" element={<Navigate to="/bartender" replace />} />
                  </Routes>
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Seguridad Routes (placeholder) */}
          <Route
            path="/seguridad/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-bold">Dashboard de Seguridad (En desarrollo)</h1>
                </div>
              </ProtectedRoute>
            }
          />

          {/* RRPP Routes (placeholder) */}
          <Route
            path="/rrpp/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-bold">Dashboard de RRPP (En desarrollo)</h1>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </ThemeProvider>
  );
};

