/**
 * AdminSidebar Organism Component
 * Navigation sidebar for admin panel
 *
 * Atomic Design Level: Organism
 * Features: Navigation menu with icons, active state, logout
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Package2,
  Tag,
  DoorOpen,
  ShoppingCart,
  TrendingDown,
  Calendar,
  Users,
  Settings,
  LogOut,
  Info,
  Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Información',
    href: '/admin/informacion',
    icon: Info,
  },
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Productos',
    href: '/admin/productos',
    icon: Package,
  },
  {
    title: 'Combos',
    href: '/admin/combos',
    icon: Package2,
  },
  {
    title: 'Promociones',
    href: '/admin/promociones',
    icon: Tag,
  },
  {
    title: 'Inicio/Cierre',
    href: '/admin/inicio-cierre',
    icon: DoorOpen,
  },
  {
    title: 'Ventas',
    href: '/admin/ventas',
    icon: ShoppingCart,
  },
  {
    title: 'Gastos',
    href: '/admin/gastos',
    icon: TrendingDown,
  },
  {
    title: 'Calendario',
    href: '/admin/calendario',
    icon: Calendar,
  },
  {
    title: 'Empleados',
    href: '/admin/empleados',
    icon: Users,
  },
  {
    title: 'Configuraciones',
    href: '/admin/configuraciones',
    icon: Settings,
  },
];

export const AdminSidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Ticket className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">OnTicket</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Club Info */}
      <div className="px-6 py-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{user.club.nombre}</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {user.personal.rol}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/admin'}
              className={({ isActive }) =>
                cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
              )
              }
            >
              <>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </>
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Info & Logout */}
      <div className="p-4 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-muted">
          <p className="text-xs font-medium text-muted-foreground">Usuario</p>
          <p className="text-sm font-medium truncate">{user.email}</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start"
          size="sm"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};
