/**
 * PromocionFilters Molecule
 * Filters for promotions (search, category, creator)
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { CategoriaProducto } from '@/types/database/Productos';
import type { Personal } from '@/types/database/Personal';

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

interface PromocionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedCreator: string;
  onCreatorChange: (value: string) => void;
  creators: Personal[];
  onClearFilters: () => void;
}

export const PromocionFilters: React.FC<PromocionFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCreator,
  onCreatorChange,
  creators,
  onClearFilters,
}) => {
  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedCreator !== 'all';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre de producto..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-[200px]">
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

        {/* Creator Filter */}
        <div className="w-full sm:w-[200px]">
          <Select value={selectedCreator} onValueChange={onCreatorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los creadores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los creadores</SelectItem>
              {creators.map((creator) => {
                const nombreCompleto = [creator.nombre, creator.apellido]
                  .filter(Boolean)
                  .join(' ') || creator.user_id;
                return (
                  <SelectItem key={creator.id} value={creator.id}>
                    {nombreCompleto}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
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
