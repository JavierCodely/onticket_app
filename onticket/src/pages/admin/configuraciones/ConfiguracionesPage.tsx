/**
 * Configuraciones Page
 * System settings and theme configuration
 */

import React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Settings } from 'lucide-react';
import { ThemeConfigurator } from './components/ThemeConfigurator';

export const ConfiguracionesPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configuraciones
          </h1>
          <p className="text-muted-foreground">
            Personaliza la apariencia del sistema
          </p>
        </div>

        <ThemeConfigurator />
      </div>
    </AdminLayout>
  );
};
