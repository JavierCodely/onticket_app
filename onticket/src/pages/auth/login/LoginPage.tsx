/**
 * LoginPage Page Component
 * Login page using AuthTemplate and LoginCard
 *
 * Atomic Design Level: Page
 * Composed of: AuthTemplate + LoginCard organism
 */

import React from 'react';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { LoginCard } from '@/components/organisms/LoginCard';

/**
 * LoginPage component
 * Entry point for user authentication
 */
export const LoginPage: React.FC = () => {
  return (
    <AuthTemplate>
      <LoginCard />
    </AuthTemplate>
  );
};
