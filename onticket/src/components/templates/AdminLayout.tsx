/**
 * AdminLayout Template Component
 * Layout template for admin pages with sidebar
 *
 * Atomic Design Level: Template
 * Composed of: AdminSidebar organism + main content area
 */

import React from 'react';
import { AdminSidebar } from '@/components/organisms/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin layout with sidebar navigation
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
