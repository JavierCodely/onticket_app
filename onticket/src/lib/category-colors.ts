/**
 * Category Color Utilities
 * Provides consistent color palettes for product categories
 */

import type { CategoriaProducto } from '@/types/database/Productos';

export interface CategoryColors {
  bg: string;
  text: string;
  border: string;
}

/**
 * Get Tailwind classes for a specific category
 */
export function getCategoryColors(categoria: CategoriaProducto): CategoryColors {
  const colorMap: Record<CategoriaProducto, CategoryColors> = {
    Vodka: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-900',
    },
    Vino: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-900',
    },
    Champan: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-900',
    },
    Tequila: {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-900',
    },
    'Sin Alcohol': {
      bg: 'bg-green-50 dark:bg-green-950/30',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-200 dark:border-green-900',
    },
    Cerveza: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-900',
    },
    Cocteles: {
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      text: 'text-pink-700 dark:text-pink-400',
      border: 'border-pink-200 dark:border-pink-900',
    },
    Whisky: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
    },
    Otros: {
      bg: 'bg-gray-50 dark:bg-gray-950/30',
      text: 'text-gray-700 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-900',
    },
  };

  return colorMap[categoria];
}

/**
 * Get a combined className string for a category badge
 */
export function getCategoryBadgeClass(categoria: CategoriaProducto): string {
  const colors = getCategoryColors(categoria);
  return `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`;
}
