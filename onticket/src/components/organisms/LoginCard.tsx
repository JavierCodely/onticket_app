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
import { Ticket } from 'lucide-react';

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
   */
  const handleSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      console.log('Attempting login with:', data.email);

      const { error: signInError } = await signIn(data.email, data.password);

      console.log('Login result:', signInError ? `Error: ${signInError}` : 'Success');

      if (signInError) {
        setError(signInError);
        setIsSubmitting(false);
      } else {
        // Success - navigate to home (will be redirected by RoleBasedRedirect)
        navigate('/');
        // Keep isSubmitting true to show loading during redirect
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
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

      <CardContent>
        <LoginForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error || undefined}
        />
      </CardContent>
    </Card>
  );
};
