/**
 * AuthTemplate Template Component
 * Centered layout for authentication pages
 *
 * Atomic Design Level: Template
 * Features: Responsive centered layout with gradient background
 */

import React from 'react';

export interface AuthTemplateProps {
  /** Content to display in the center (typically LoginCard) */
  children: React.ReactNode;
}

/**
 * AuthTemplate provides a consistent layout for authentication pages
 * Centers content vertically and horizontally with attractive background
 */
export const AuthTemplate: React.FC<AuthTemplateProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {children}
    </div>
  );
};
