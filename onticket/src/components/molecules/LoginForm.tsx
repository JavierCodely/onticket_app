/**
 * LoginForm Molecule Component
 * Email + Password login form with validation
 *
 * Atomic Design Level: Molecule
 * Composed of: FormField atoms + Button atom
 * Features: Form validation with react-hook-form and zod
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormField } from '@/components/atoms/FormField';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * Validation schema for login form
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Por favor, ingrese un correo electrónico válido')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(72, 'La contraseña no puede exceder 72 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  /** Callback function when form is submitted with valid data */
  onSubmit: (data: LoginFormData) => Promise<void>;

  /** Whether the form is currently submitting */
  isSubmitting?: boolean;

  /** Error message to display at form level */
  error?: string;
}

/**
 * LoginForm component with email and password fields
 * Implements client-side validation and error handling
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isSubmitting = false,
  error,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Global error message */}
      {error && (
        <div
          className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-md text-sm font-medium"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Email field */}
      <FormField
        id="email"
        label="Correo electrónico"
        type="email"
        placeholder="tu@ejemplo.com"
        error={errors.email?.message}
        required
        inputProps={{
          ...register('email'),
          autoComplete: 'email',
          disabled: isSubmitting,
        }}
      />

      {/* Password field */}
      <FormField
        id="password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        required
        inputProps={{
          ...register('password'),
          autoComplete: 'current-password',
          disabled: isSubmitting,
        }}
      />

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          'Iniciar sesión'
        )}
      </Button>
    </form>
  );
};

export type { LoginFormData };
