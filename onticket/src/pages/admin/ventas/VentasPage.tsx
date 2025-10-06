/**
 * Ventas Page
 * Placeholder for sales management section
 */

import React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export const VentasPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">
            Registro y análisis de ventas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Futuramente sección de Ventas
            </CardTitle>
            <CardDescription>
              Esta sección mostrará el historial y análisis de ventas
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
