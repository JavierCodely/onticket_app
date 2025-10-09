/**
 * SalesFilters Component
 * Filters for sales list (date range, category, payment method, employee)
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import type { SaleFilters, Personal } from '@/types/database';

interface SalesFiltersProps {
  onFiltersChange: (filters: SaleFilters) => void;
  empleados: Personal[];
}

export function SalesFilters({ onFiltersChange, empleados }: SalesFiltersProps) {
  const [filters, setFilters] = useState<SaleFilters>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof SaleFilters, value: string | undefined) => {
    const newFilters = { ...filters };

    if (value === undefined || value === '' || value === 'all') {
      delete newFilters[key];
    } else {
      newFilters[key] = value as any;
    }

    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="fecha_desde">Fecha desde</Label>
              <Input
                id="fecha_desde"
                type="date"
                value={filters.fecha_desde || ''}
                onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="fecha_hasta">Fecha hasta</Label>
              <Input
                id="fecha_hasta"
                type="date"
                value={filters.fecha_hasta || ''}
                onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={filters.categoria || 'all'}
                onValueChange={(value) => handleFilterChange('categoria', value)}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Vodka">Vodka</SelectItem>
                  <SelectItem value="Vino">Vino</SelectItem>
                  <SelectItem value="Champan">Champán</SelectItem>
                  <SelectItem value="Tequila">Tequila</SelectItem>
                  <SelectItem value="Sin Alcohol">Sin Alcohol</SelectItem>
                  <SelectItem value="Cerveza">Cerveza</SelectItem>
                  <SelectItem value="Cocteles">Cocteles</SelectItem>
                  <SelectItem value="Whisky">Whisky</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="metodo_pago">Método de pago</Label>
              <Select
                value={filters.metodo_pago || 'all'}
                onValueChange={(value) => handleFilterChange('metodo_pago', value)}
              >
                <SelectTrigger id="metodo_pago">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="billetera_virtual">Billetera Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={filters.moneda || 'all'}
                onValueChange={(value) => handleFilterChange('moneda', value)}
              >
                <SelectTrigger id="moneda">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="ARS">🇦🇷 Peso Argentino</SelectItem>
                  <SelectItem value="USD">🇺🇸 Dólar</SelectItem>
                  <SelectItem value="BRL">🇧🇷 Real Brasileño</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee */}
            <div className="space-y-2">
              <Label htmlFor="personal_id">Empleado</Label>
              <Select
                value={filters.personal_id || 'all'}
                onValueChange={(value) => handleFilterChange('personal_id', value)}
              >
                <SelectTrigger id="personal_id">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id}>
                      {empleado.nombre} {empleado.apellido} ({empleado.rol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
