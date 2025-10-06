/**
 * LoginCard Organism Component
 * Complete login UI with branding, form, and error handling
 *
 * Atomic Design Level: Organism
 * Composed of: Card atoms + LoginForm molecule
 * Features: Complete login experience with branding
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/molecules/LoginForm';
import type { LoginFormData } from '@/components/molecules/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Ticket, AlertCircle } from 'lucide-react';
import { loginRateLimiter, secureLog, sanitizeInput, isValidEmail } from '@/lib/security';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * LoginCard component providing complete login functionality
 * Handles authentication state and redirects on success
 */
export const LoginCard: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle form submission
   * Attempts authentication and redirects on success
   * Includes security validations and rate limiting
   */
  const handleSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Sanitize input
      const email = sanitizeInput(data.email).toLowerCase();

      // Validate email format
      if (!isValidEmail(email)) {
        setError('Formato de email inválido');
        setIsSubmitting(false);
        return;
      }

      // Check rate limiting
      if (loginRateLimiter.isRateLimited(email)) {
        const timeRemaining = loginRateLimiter.getTimeUntilReset(email);
        setError(
          `Demasiados intentos fallidos. Por favor, intenta de nuevo en ${Math.ceil(timeRemaining / 60)} minutos.`
        );
        setIsSubmitting(false);
        return;
      }

      // Record attempt
      loginRateLimiter.recordAttempt(email);

      secureLog.info('Attempting login');

      const { error: signInError } = await signIn(email, data.password);

      if (signInError) {
        const remaining = loginRateLimiter.getRemainingAttempts(email);
        setError(
          remaining > 1
            ? `${signInError} (${remaining - 1} intentos restantes)`
            : signInError
        );
        setIsSubmitting(false);
      } else {
        // Success - clear rate limit and navigate
        loginRateLimiter.clearAttempts(email);
        secureLog.info('Login successful');
        navigate('/');
        // Keep isSubmitting true to show loading during redirect
      }
    } catch (err) {
      secureLog.error('Unexpected error during login:', err);
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-4">
        {/* Logo and branding */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full">
            <Ticket className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">OnTicket</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <LoginForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error || undefined}
        />
      </CardContent>
    </Card>
  );
};
