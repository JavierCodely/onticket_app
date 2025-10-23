/**
 * Rentabilidad Page
 * Analysis of product profitability with rotation metrics
 */

import React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { RentabilidadProductos } from '@/components/organisms/Dashboard/RentabilidadProductos';
import { TrendingUp } from 'lucide-react';

/**
 * Rentabilidad component
 * Displays profitability analysis for products
 */
export const RentabilidadPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Rentabilidad por Producto
          </h1>
          <p className="text-muted-foreground">
            Análisis de rentabilidad considerando margen y rotación de productos
          </p>
        </div>

        {/* Rentabilidad Component */}
        <RentabilidadProductos />
      </div>
    </AdminLayout>
  );
};
