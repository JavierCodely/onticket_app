/**
 * Promociones Page
 * Placeholder for promotions management section
 */

import React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';

export const PromocionesPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promociones</h1>
          <p className="text-muted-foreground">
            Gestión de promociones y descuentos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Futuramente sección de Promociones
            </CardTitle>
            <CardDescription>
              Esta sección permitirá crear y gestionar promociones especiales
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
