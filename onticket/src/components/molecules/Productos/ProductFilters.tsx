/**
 * ProductFilters Molecule
 * Filters for product list (search and category)
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, AlertTriangle } from 'lucide-react';
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

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  showLowStock: boolean;
  onLowStockToggle: () => void;
  lowStockCount?: number;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  showLowStock,
  onLowStockToggle,
  lowStockCount = 0,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos por nombre..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Button
        variant={showLowStock ? "destructive" : "outline"}
        onClick={onLowStockToggle}
        className={`w-full sm:w-auto ${
          showLowStock 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400'
        }`}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Stock Bajo
        {lowStockCount > 0 && (
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
            showLowStock 
              ? 'bg-white/20 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {lowStockCount}
          </span>
        )}
      </Button>

      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
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
  );
};
