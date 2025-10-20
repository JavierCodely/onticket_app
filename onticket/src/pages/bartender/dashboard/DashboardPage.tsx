/**
 * Bartender Dashboard Page
 * Simple placeholder page indicating development in progress
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Construction } from 'lucide-react';

/**
 * Bartender Dashboard component
 * Shows development placeholder
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
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
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <Construction className="h-16 w-16 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">En Desarrollo</h2>
                <p className="text-muted-foreground">
                  Esta sección está siendo desarrollada actualmente.
                </p>
                <p className="text-sm text-muted-foreground">
                  Pronto tendrás acceso a todas las funcionalidades de bartender.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
