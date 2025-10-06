/**
 * Gastos Page
 * Placeholder for expenses management section
 */

import React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

export const GastosPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground">
            Control y registro de gastos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Futuramente sección de Gastos
            </CardTitle>
            <CardDescription>
              Esta sección permitirá registrar y analizar los gastos del club
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
