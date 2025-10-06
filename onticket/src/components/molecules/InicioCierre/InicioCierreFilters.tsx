/**
 * InicioCierreFilters Molecule
 * Filters for inventory opening/closing records (date range and category)
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, X } from 'lucide-react';
import type { CategoriaProducto } from '@/types/database/Productos';

const CATEGORIAS: CategoriaProducto[] = [
  'Vodka',
  'Vino',
  'Champan',
  'Tequila',
  'Sin Alcohol',
  'Cerveza',
  'Cocteles',
  'Otros',
];

interface InicioCierreFiltersProps {
  fechaDesde: string;
  fechaHasta: string;
  onFechaDesdeChange: (value: string) => void;
  onFechaHastaChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
}

export const InicioCierreFilters: React.FC<InicioCierreFiltersProps> = ({
  fechaDesde,
  fechaHasta,
  onFechaDesdeChange,
  onFechaHastaChange,
  selectedCategory,
  onCategoryChange,
  onClearFilters,
}) => {
  const hasActiveFilters = fechaDesde || fechaHasta || selectedCategory !== 'all';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Fecha Desde */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5">Fecha Desde</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => onFechaDesdeChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Fecha Hasta */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5">Fecha Hasta</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => onFechaHastaChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Categoría */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5">Categoría</label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORIAS.map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Limpiar Filtros */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
