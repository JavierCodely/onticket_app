/**
 * FormField Atom Component
 * Reusable form field combining Label, Input, and error message
 *
 * Atomic Design Level: Atom
 * Composed of: shadcn/ui Label + Input primitives
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  /** Unique identifier for the input */
  id: string;

  /** Label text displayed above the input */
  label: string;

  /** Input type (text, email, password, etc.) */
  type?: string;

  /** Placeholder text for the input */
  placeholder?: string;

  /** Error message to display below the input */
  error?: string;

  /** Whether the field is required */
  required?: boolean;

  /** Additional CSS classes for the container */
  className?: string;

  /** React Hook Form register function or other input props */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

/**
 * FormField component that combines label, input, and error display
 * Provides consistent form field styling across the application
 */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  placeholder,
  error,
  required = false,
  className,
  inputProps,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
        {...inputProps}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm font-medium text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
