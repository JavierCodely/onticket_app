/**
 * SalesStatsCards Component
 * Displays top selling and least selling products during active shift
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductStat {
  nombre_producto: string;
  categoria: string;
  cantidad_vendida: number;
  stock_inicio: number;
  stock_actual: number;
}

interface SalesStatsCardsProps {
  topSelling: ProductStat[];
  leastSelling: ProductStat[];
}

export const SalesStatsCards: React.FC<SalesStatsCardsProps> = ({
  topSelling,
  leastSelling,
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Top Selling Products */}
      <Card className="border-green-200 dark:border-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <TrendingUp className="h-5 w-5" />
            Lo Más Vendido
          </CardTitle>
          <CardDescription>
            Productos con mayor cantidad vendida en el turno actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topSelling.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay ventas registradas aún
            </p>
          ) : (
            <div className="space-y-3">
              {topSelling.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        #{index + 1}
                      </Badge>
                      <p className="font-medium">{product.nombre_producto}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.categoria}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {product.cantidad_vendida}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      vendidas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Least Selling Products */}
      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <TrendingDown className="h-5 w-5" />
            Lo Menos Vendido
          </CardTitle>
          <CardDescription>
            Productos con menor cantidad vendida en el turno actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leastSelling.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay datos disponibles
            </p>
          ) : (
            <div className="space-y-3">
              {leastSelling.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        #{index + 1}
                      </Badge>
                      <p className="font-medium">{product.nombre_producto}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.categoria}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {product.cantidad_vendida}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      vendidas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
