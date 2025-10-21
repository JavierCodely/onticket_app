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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, Check, ChevronsUpDown } from 'lucide-react';
import type { SaleFilters, Personal, MetodoPago, RolPersonal } from '@/types/database';

interface SalesFiltersProps {
  onFiltersChange: (filters: SaleFilters) => void;
  empleados: Personal[];
  initialFilters?: SaleFilters;
}

export function SalesFilters({ onFiltersChange, empleados, initialFilters = {} }: SalesFiltersProps) {
  const [filters, setFilters] = useState<SaleFilters>(initialFilters);
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

  const handleMultiSelectChange = (key: 'personal_id' | 'metodo_pago' | 'rol', value: string, checked: boolean) => {
    const newFilters = { ...filters };
    const currentValues = Array.isArray(newFilters[key]) ? newFilters[key] as string[] : newFilters[key] ? [newFilters[key] as string] : [];

    if (checked) {
      // Add value
      const newValues = [...currentValues, value];
      newFilters[key] = newValues as any;
    } else {
      // Remove value
      const newValues = currentValues.filter((v) => v !== value);
      if (newValues.length === 0) {
        delete newFilters[key];
      } else {
        newFilters[key] = newValues as any;
      }
    }

    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    // Reset to today's date
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const todayFilters: SaleFilters = {
      fecha_desde: startOfDay.toISOString(),
      fecha_hasta: endOfDay.toISOString(),
    };

    setFilters(todayFilters);
    onFiltersChange(todayFilters);
  };

  // Helper to format ISO date to YYYY-MM-DD for date input
  const formatDateForInput = (isoDate?: string) => {
    if (!isoDate) return '';
    return isoDate.split('T')[0];
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Get payment method label
  const getMetodoPagoLabel = (metodo: MetodoPago): string => {
    const labels: Record<MetodoPago, string> = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      tarjeta: 'Tarjeta',
      billetera_virtual: 'Billetera Virtual',
      mixto: 'Mixto',
      tarjeta_vip: 'Tarjeta VIP',
    };
    return labels[metodo] || metodo;
  };

  // Get role label
  const getRolLabel = (rol: RolPersonal): string => {
    const labels: Record<RolPersonal, string> = {
      Admin: 'Administrador',
      Bartender: 'Bartender',
      Seguridad: 'Seguridad',
      RRPP: 'RRPP',
    };
    return labels[rol] || rol;
  };

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
                Restablecer
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
                value={formatDateForInput(filters.fecha_desde)}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  if (dateValue) {
                    const isoDate = new Date(dateValue + 'T00:00:00').toISOString();
                    handleFilterChange('fecha_desde', isoDate);
                  } else {
                    handleFilterChange('fecha_desde', undefined);
                  }
                }}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="fecha_hasta">Fecha hasta</Label>
              <Input
                id="fecha_hasta"
                type="date"
                value={formatDateForInput(filters.fecha_hasta)}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  if (dateValue) {
                    const isoDate = new Date(dateValue + 'T23:59:59').toISOString();
                    handleFilterChange('fecha_hasta', isoDate);
                  } else {
                    handleFilterChange('fecha_hasta', undefined);
                  }
                }}
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

            {/* Employee Role */}
            <div className="space-y-2">
              <Label>Rol de Empleado</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {Array.isArray(filters.rol) && filters.rol.length > 0
                      ? `${filters.rol.length} seleccionado${filters.rol.length > 1 ? 's' : ''}`
                      : filters.rol
                      ? getRolLabel(filters.rol as RolPersonal)
                      : 'Todos'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <div className="p-4 space-y-2">
                    {[
                      { value: 'Admin', label: 'Administrador' },
                      { value: 'Bartender', label: 'Bartender' },
                      { value: 'Seguridad', label: 'Seguridad' },
                      { value: 'RRPP', label: 'RRPP' },
                    ].map((rol) => {
                      const selectedRoles = Array.isArray(filters.rol)
                        ? filters.rol
                        : filters.rol
                        ? [filters.rol]
                        : [];
                      const isChecked = selectedRoles.includes(rol.value);

                      return (
                        <div key={rol.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rol-${rol.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange('rol', rol.value, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`rol-${rol.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {rol.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {Array.isArray(filters.metodo_pago) && filters.metodo_pago.length > 0
                      ? `${filters.metodo_pago.length} seleccionado${filters.metodo_pago.length > 1 ? 's' : ''}`
                      : filters.metodo_pago
                      ? getMetodoPagoLabel(filters.metodo_pago as MetodoPago)
                      : 'Todos'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <div className="p-4 space-y-2">
                    {[
                      { value: 'efectivo', label: 'Efectivo' },
                      { value: 'transferencia', label: 'Transferencia' },
                      { value: 'tarjeta', label: 'Tarjeta' },
                      { value: 'billetera_virtual', label: 'Billetera Virtual' },
                      { value: 'mixto', label: 'Mixto' },
                      { value: 'tarjeta_vip', label: 'Tarjeta VIP' },
                    ].map((metodo) => {
                      const selectedMethods = Array.isArray(filters.metodo_pago)
                        ? filters.metodo_pago
                        : filters.metodo_pago
                        ? [filters.metodo_pago]
                        : [];
                      const isChecked = selectedMethods.includes(metodo.value as MetodoPago);

                      return (
                        <div key={metodo.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`metodo-${metodo.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange('metodo_pago', metodo.value, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`metodo-${metodo.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {metodo.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
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
              <Label>Empleado</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {Array.isArray(filters.personal_id) && filters.personal_id.length > 0
                      ? `${filters.personal_id.length} seleccionado${filters.personal_id.length > 1 ? 's' : ''}`
                      : filters.personal_id
                      ? empleados.find((e) => e.id === filters.personal_id)?.nombre + ' ' + empleados.find((e) => e.id === filters.personal_id)?.apellido
                      : 'Todos'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                    {empleados.map((empleado) => {
                      const selectedEmployees = Array.isArray(filters.personal_id)
                        ? filters.personal_id
                        : filters.personal_id
                        ? [filters.personal_id]
                        : [];
                      const isChecked = selectedEmployees.includes(empleado.id);

                      return (
                        <div key={empleado.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`empleado-${empleado.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange('personal_id', empleado.id, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`empleado-${empleado.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {empleado.nombre} {empleado.apellido} ({empleado.rol})
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
