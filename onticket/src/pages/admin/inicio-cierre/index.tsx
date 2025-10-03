/**
 * Inicio/Cierre Page
 * Placeholder for opening/closing operations section
 */

import React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DoorOpen } from 'lucide-react';

export const InicioCierrePage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inicio/Cierre</h1>
          <p className="text-muted-foreground">
            Operaciones de apertura y cierre de caja
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Futuramente sección de Inicio/Cierre
            </CardTitle>
            <CardDescription>
              Esta sección permitirá realizar operaciones de apertura y cierre de caja
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
