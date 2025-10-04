/**
 * Configuraciones Page
 * Placeholder for settings section
 */

import React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

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
            Configuración del sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sección de Configuraciones
            </CardTitle>
            <CardDescription>
              Esta sección permitirá configurar el sistema y preferencias del club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              En desarrollo...
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
