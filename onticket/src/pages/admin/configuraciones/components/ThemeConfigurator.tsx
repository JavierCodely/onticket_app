/**
 * ThemeConfigurator Component
 * Complete theme customization with color palette and mode selection
 */

import React from 'react';
import { useTheme } from 'next-themes';
import { useColorTheme, type ColorTheme } from '@/hooks/useColorTheme';
import { Moon, Sun, Check, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Theme color definitions with names and descriptions
const THEME_COLORS: Array<{
  value: ColorTheme;
  label: string;
  description: string;
  color: string;
}> = [
  { value: 'red', label: 'Rojo', description: 'Energético y vibrante', color: 'bg-red-500' },
  { value: 'rose', label: 'Rosa', description: 'Elegante y sofisticado', color: 'bg-rose-500' },
  { value: 'orange', label: 'Naranja', description: 'Cálido y acogedor', color: 'bg-orange-500' },
  { value: 'green', label: 'Verde', description: 'Natural y fresco', color: 'bg-green-500' },
  { value: 'blue', label: 'Azul', description: 'Profesional y confiable', color: 'bg-blue-500' },
  { value: 'yellow', label: 'Amarillo', description: 'Brillante y optimista', color: 'bg-yellow-500' },
  { value: 'violet', label: 'Violeta', description: 'Creativo y único', color: 'bg-violet-500' },
  { value: 'slate', label: 'Pizarra', description: 'Moderno y minimalista', color: 'bg-slate-700' },
  { value: 'stone', label: 'Piedra', description: 'Neutro y equilibrado', color: 'bg-stone-500' },
  { value: 'zinc', label: 'Zinc', description: 'Industrial y elegante', color: 'bg-zinc-600' },
  { value: 'gray', label: 'Gris', description: 'Clásico y atemporal', color: 'bg-gray-600' },
  { value: 'neutral', label: 'Neutral', description: 'Limpio y simple', color: 'bg-neutral-600' },
];

export const ThemeConfigurator: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <div className="space-y-6">
      {/* Color Palette Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Paleta de colores
          </CardTitle>
          <CardDescription>
            Selecciona el color principal para tu sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {THEME_COLORS.map((themeColor) => (
              <button
                key={themeColor.value}
                onClick={() => setColorTheme(themeColor.value)}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-lg border-2 p-3 transition-all hover:bg-accent",
                  colorTheme === themeColor.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                {colorTheme === themeColor.value && (
                  <div className="absolute right-2 top-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
                <div className={cn("h-8 w-8 rounded-md", themeColor.color)} />
                <div className="text-left">
                  <p className="font-medium text-sm">{themeColor.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {themeColor.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme Mode Card */}
      <Card>
        <CardHeader>
          <CardTitle>Modo de apariencia</CardTitle>
          <CardDescription>
            Elige entre modo claro u oscuro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-all hover:bg-accent",
                theme === 'light'
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              {theme === 'light' && (
                <div className="absolute right-2 top-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="rounded-md border bg-background p-3">
                <Sun className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-medium">Claro</p>
                <p className="text-xs text-muted-foreground">Modo día</p>
              </div>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-all hover:bg-accent",
                theme === 'dark'
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              {theme === 'dark' && (
                <div className="absolute right-2 top-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="rounded-md border bg-background p-3">
                <Moon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-medium">Oscuro</p>
                <p className="text-xs text-muted-foreground">Modo noche</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>
            Así se verán los elementos con tu configuración actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Botones</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="secondary">Secondary</Button>
              <Button size="sm" variant="outline">Outline</Button>
              <Button size="sm" variant="ghost">Ghost</Button>
              <Button size="sm" variant="destructive">Destructive</Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Badges</Label>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Inputs</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Email" type="email" />
              <Input placeholder="Password" type="password" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Tarjetas</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tarjeta Normal</CardTitle>
                  <CardDescription className="text-xs">
                    Descripción de la tarjeta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Contenido de ejemplo con estilo por defecto
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-primary text-primary-foreground">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tarjeta Destacada</CardTitle>
                  <CardDescription className="text-xs opacity-90">
                    Con color primario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm opacity-90">
                    Contenido destacado con tu color seleccionado
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Colores del sistema</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-foreground">Primary</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-secondary flex items-center justify-center">
                  <span className="text-xs font-medium text-secondary-foreground">Secondary</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-accent flex items-center justify-center">
                  <span className="text-xs font-medium text-accent-foreground">Accent</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">Muted</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
