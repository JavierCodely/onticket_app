/**
 * useProductFilters Hook
 * Manages product filtering and sorting logic
 */

import { useState, useMemo } from 'react';
import { getPriceForCurrency } from '@/lib/currency-utils';
import type { Producto } from '@/types/database/Productos';
import type { CurrencyCode } from '@/types/currency';

interface UseProductFiltersParams {
  productos: Producto[];
  defaultCurrency: CurrencyCode;
}

export const useProductFilters = ({ productos, defaultCurrency }: UseProductFiltersParams) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);

  // Calculate low stock count
  const lowStockCount = useMemo(() => {
    return productos.filter((p) => p.min_stock > 0 && p.stock <= p.min_stock).length;
  }, [productos]);

  // Filter and sort products
  const filteredProductos = useMemo(() => {
    let filtered = productos;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.categoria === selectedCategory);
    }

    // Filter by low stock
    if (showLowStock) {
      filtered = filtered.filter((p) => p.min_stock > 0 && p.stock <= p.min_stock);
    }

    // Sort by sale price (highest to lowest) based on default currency
    filtered = filtered.sort((a, b) => {
      const precioA = getPriceForCurrency(a, defaultCurrency, 'venta');
      const precioB = getPriceForCurrency(b, defaultCurrency, 'venta');
      return precioB - precioA; // Descendente (mayor a menor)
    });

    return filtered;
  }, [productos, searchTerm, selectedCategory, showLowStock, defaultCurrency]);

  return {
    // State
    searchTerm,
    selectedCategory,
    showLowStock,
    lowStockCount,
    
    // Filtered data
    filteredProductos,
    
    // Actions
    setSearchTerm,
    setSelectedCategory,
    setShowLowStock,
  };
};

