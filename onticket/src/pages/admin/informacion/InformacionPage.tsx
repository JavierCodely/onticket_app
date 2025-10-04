/**
 * Información Page
 * Displays club information, welcome message, and financial overview
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp } from 'lucide-react';

export const InformacionPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Get admin name or fallback to email
  const adminName = user.personal.nombre
    ? `${user.personal.nombre}${user.personal.apellido ? ' ' + user.personal.apellido : ''}`
    : user.email;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Info className="h-8 w-8" />
            Información
          </h1>
          <p className="text-muted-foreground">
            Información general del club {user.club.nombre}
          </p>
        </div>

        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                ¡Bienvenido, {adminName}!
              </h2>
              <p className="text-blue-100">
                Panel de administración de {user.club.nombre}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Balance de Cuentas
              </CardTitle>
              <CardDescription>Estado financiero del club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Efectivo</span>
                <span className="text-lg font-bold text-green-600">
                  ${user.club.cuenta_efectivo.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Billetera Virtual</span>
                <span className="text-lg font-bold text-blue-600">
                  ${user.club.cuenta_billetera_virtual.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm font-medium">Total</span>
                <span className="text-xl font-bold">
                  ${(user.club.cuenta_efectivo + user.club.cuenta_billetera_virtual).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Club Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Club</CardTitle>
              <CardDescription>Información general</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Nombre</span>
                <span className="font-semibold">{user.club.nombre}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Estado</span>
                <Badge variant={user.club.activo ? 'default' : 'destructive'}>
                  {user.club.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-muted-foreground">Ubicación</span>
                <span className="font-semibold">{user.club.ubicacion || 'No especificada'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
