/**
 * App Component
 * Main application component with routing and authentication
 *
 * Security Features:
 * - Lazy loading of all components except essential auth
 * - ColorThemeProvider loaded globally (lightweight, theme consistency)
 * - Other theme providers only loaded after authentication
 * - Protected routes isolated from public routes
 * - No admin components loaded on login screen
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ColorThemeProvider } from '@/components/ColorThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Minimal loading fallback for login
const MinimalLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
  </div>
);

// Public routes - ONLY login, loaded with minimal dependencies
const LoginPage = lazy(() => import('@/pages/auth/login/LoginPage').then(m => ({ default: m.LoginPage })));

// Protected App Wrapper - loads theme providers and other non-essential features
const ProtectedAppWrapper = lazy(() => import('@/components/ProtectedAppWrapper').then(m => ({ default: m.ProtectedAppWrapper })));

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ColorThemeProvider>
            <Routes>
              {/* Public route - Login ONLY, no extra components */}
              <Route 
                path="/login" 
                element={
                  <Suspense fallback={<MinimalLoadingFallback />}>
                    <LoginPage />
                  </Suspense>
                } 
              />

              {/* All protected routes wrapped in ProtectedAppWrapper */}
              <Route
                path="/*"
                element={
                  <Suspense fallback={<MinimalLoadingFallback />}>
                    <ProtectedAppWrapper />
                  </Suspense>
                }
              />
            </Routes>
          </ColorThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
