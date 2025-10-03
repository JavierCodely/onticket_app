/**
 * Bartender Dashboard Page
 * Main dashboard for Bartender role users
 *
 * Features:
 * - View available products
 * - Register sales
 * - View sales history
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  User,
  Shield,
  Building2,
  Package,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';

/**
 * Bartender Dashboard component
 * Provides bartender-specific features and overview
 */
export const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Panel de Bartender</h1>
              <p className="text-sm text-muted-foreground">{user.club.nombre}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {user.personal.rol}
              </Badge>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">
                  ¡Bienvenido, {user.email}!
                </h2>
                <p className="text-purple-100">
                  Panel de ventas de {user.club.nombre}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Products Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Productos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Ver productos disponibles
                </p>
              </CardContent>
            </Card>

            {/* Sales Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Nueva Venta</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+</div>
                <p className="text-xs text-muted-foreground">
                  Registrar venta
                </p>
              </CardContent>
            </Card>

            {/* My Sales Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Mis Ventas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Ventas realizadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Operaciones principales para bartenders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" size="lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Registrar Nueva Venta
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg">
                <Package className="mr-2 h-5 w-5" />
                Ver Inventario
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg">
                <TrendingUp className="mr-2 h-5 w-5" />
                Ver Mis Ventas
              </Button>
            </CardContent>
          </Card>

          {/* Club Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Información del Club
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Nombre</span>
                <span className="font-semibold">{user.club.nombre}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Ubicación</span>
                <span>{user.club.ubicacion || 'No especificada'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-muted-foreground">Estado</span>
                <Badge variant={user.club.activo ? 'default' : 'destructive'}>
                  {user.club.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Tu Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <span className="font-semibold">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Rol</span>
                <Badge variant="secondary">{user.personal.rol}</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-muted-foreground">Estado</span>
                <Badge variant={user.personal.activo ? 'default' : 'destructive'}>
                  {user.personal.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
