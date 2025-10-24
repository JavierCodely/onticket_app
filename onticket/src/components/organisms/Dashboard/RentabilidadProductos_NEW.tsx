/**
 * RentabilidadProductos Component (NEW VERSION)
 * Displays product profitability analysis with rotation metrics
 * Uses SQL function to accurately capture real sale prices (including promotions and combos)
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, TrendingUp, DollarSign, Percent, Package, BarChart3, Download, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/lib/currency-utils';
import { useProfitabilityReport } from '@/hooks/useProfitabilityReport';
import type { CategoriaProducto } from '@/types/database/Productos';
import type { ProfitabilityReportFilters } from '@/types/database/ProfitabilityReport';

type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'all';

const CATEGORIAS: CategoriaProducto[] = [
  'Vodka',
  'Vino',
  'Champan',
  'Tequila',
  'Sin Alcohol',
  'Cerveza',
  'Cocteles',
  'Whisky',
  'Otros',
];

export const RentabilidadProductos: React.FC = () => {
  const { defaultCurrency } = useCurrency();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [selectedProducto, setSelectedProducto] = useState<string>('all');

  const getDateRange = (): { startDate: Date; endDate: Date } | { startDate: null; endDate: null } => {
    const now = new Date();
    const endDate = now;
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        return { startDate: null, endDate: null };
    }

    return { startDate, endDate };
  };

  // Build filters
  const filters: ProfitabilityReportFilters = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    return {
      start_date: startDate,
      end_date: endDate,
      categoria: selectedCategoria !== 'all' ? (selectedCategoria as CategoriaProducto) : null,
      min_cantidad: 1, // Only show products with sales
      order_by: 'ganancia',
      order_direction: 'desc',
    };
  }, [period, selectedCategoria]);

  // Use the hook
  const { report, summary, categorySummaries, loading, error, fetchReport: _fetchReport, exportToCSV } =
    useProfitabilityReport({ filters });

  const getPeriodLabel = (): string => {
    switch (period) {
      case 'week':
        return 'Última semana';
      case 'month':
        return 'Último mes';
      case 'quarter':
        return 'Último trimestre';
      case 'year':
        return 'Último año';
      case 'all':
        return 'Todo el tiempo';
      default:
        return '';
    }
  };

  // Get currency code for display
  const currencyCode = defaultCurrency.toLowerCase() as 'ars' | 'usd' | 'brl';

  // Filter by specific product (client-side)
  const filteredReport = useMemo(() => {
    if (selectedProducto === 'all') return report;
    return report.filter((item) => item.producto_id === selectedProducto);
  }, [report, selectedProducto]);

  // Calculate median units sold
  const medianaUnidadesVendidas = useMemo(() => {
    if (filteredReport.length === 0) return 0;
    const sorted = [...filteredReport].map(r => r.cantidad_vendida).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }, [filteredReport]);

  // Calculate theoretical margin (simple average)
  const margenTeorico = useMemo(() => {
    if (filteredReport.length === 0) return 0;
    const totalMargen = filteredReport.reduce((sum, item) => {
      return sum + item[`margen_porcentaje_${currencyCode}`];
    }, 0);
    return totalMargen / filteredReport.length;
  }, [filteredReport, currencyCode]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="space-y-4">
        {/* Row 1: Márgenes (Comparación Real vs Teórico) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">% Margen Total (Real)</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Margen Global Ponderado</p>
                        <p className="text-xs mb-2">
                          <strong>Fórmula:</strong> (Ganancia Total / Costo Total) × 100
                        </p>
                        <p className="text-xs mb-2">
                          <strong>Qué significa:</strong> Margen real considerando el peso de cada producto y precios aplicados (con promociones y combos).
                        </p>
                        <p className="text-xs text-green-500">
                          ✓ Esta es la métrica correcta para evaluar rentabilidad global.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary?.[`margen_promedio_${currencyCode}`].toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ponderado por volumen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">% Margen Teórico</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Margen Promedio Simple</p>
                        <p className="text-xs mb-2">
                          <strong>Fórmula:</strong> (Σ Margen de cada producto) / Cantidad de productos
                        </p>
                        <p className="text-xs mb-2">
                          <strong>Qué significa:</strong> Promedio sin ponderar. Todos los productos tienen el mismo peso.
                        </p>
                        <p className="text-xs text-yellow-500">
                          ⚠️ Útil solo para comparar percepción vs realidad.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {margenTeorico.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Promedio simple (percepción)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Rentabilidad Total</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Ganancia Total del Período</p>
                        <p className="text-xs mb-2">
                          <strong>Incluye:</strong> Precios reales aplicados en ventas (con promociones y combos).
                        </p>
                        <p className="text-xs text-green-500">
                          ✓ Este es el dinero real que ganaste.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary?.[`ganancia_total_${currencyCode}`] || 0, defaultCurrency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ganancia total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Eficiencia de Capital</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Return on Investment (ROI)</p>
                        <p className="text-xs mb-2">
                          <strong>Fórmula:</strong> (Ganancia / Costo Invertido) × 100
                        </p>
                        <p className="text-xs">
                          <strong>Ejemplo:</strong> 130% = por cada $1 invertido ganaste $1.30
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {summary
                  ? (
                      (summary[`ganancia_total_${currencyCode}`] /
                        (summary[`costos_totales_${currencyCode}`] || 1)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ROI sobre inversión
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Unidades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Total Unidades Vendidas</p>
                </div>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {summary?.cantidad_total_vendida.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total vendido en {getPeriodLabel().toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Promedio por Producto</p>
                </div>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {summary && summary.total_productos_vendidos > 0
                  ? (summary.cantidad_total_vendida / summary.total_productos_vendidos).toFixed(0)
                  : 0}{' '}
                uds
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Promedio matemático
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Mediana de Unidades</p>
                </div>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {Math.ceil(medianaUnidadesVendidas)} uds
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tendencia real (mayoría)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      {!loading && filteredReport.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Most Profitable Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <CardTitle>Top 5 Productos Más Rentables</CardTitle>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Productos con mayor ganancia total en {getPeriodLabel().toLowerCase()}
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredReport.slice(0, 5).map((item) => ({
                    nombre:
                      item.producto_nombre.length > 15
                        ? item.producto_nombre.substring(0, 15) + '...'
                        : item.producto_nombre,
                    rentabilidad: item[`ganancia_${currencyCode}`],
                    unidades: item.cantidad_vendida,
                    margen: item[`margen_porcentaje_${currencyCode}`].toFixed(1) + '%',
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={100} />
                  <RechartsTooltip
                    formatter={(value: number | string, name: string) => {
                      if (name === 'Rentabilidad') {
                        return [formatCurrency(value as number, defaultCurrency), 'Ganancia Total'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Producto: ${label}`}
                  />
                  <Bar dataKey="rentabilidad" fill="#10b981" name="Rentabilidad" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <CardTitle>Rentabilidad por Categoría</CardTitle>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ganancia total por categoría de producto
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={categorySummaries.slice(0, 8)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value, defaultCurrency), 'Rentabilidad']}
                  />
                  <Bar dataKey="ganancia_total_ars" name="Rentabilidad Total">
                    {categorySummaries.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${140 + index * 20}, 60%, 50%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Rentabilidad por Producto</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={loading || filteredReport.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Análisis con precios reales aplicados (incluye promociones y combos) · {getPeriodLabel()}
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {/* Period Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Período</label>
              <Select value={period} onValueChange={(val) => setPeriod(val as PeriodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Último año</SelectItem>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoría</label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Producto</label>
              <Select value={selectedProducto} onValueChange={setSelectedProducto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {report.map((item) => (
                    <SelectItem key={item.producto_id} value={item.producto_id}>
                      {item.producto_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          ) : filteredReport.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                No hay datos de ventas para el período seleccionado
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Margen %</TableHead>
                    <TableHead className="text-center">Unidades Vendidas</TableHead>
                    <TableHead className="text-right">Ganancia/Unidad</TableHead>
                    <TableHead className="text-right">Rentabilidad Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReport.map((item) => (
                    <TableRow key={item.producto_id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{item.producto_nombre}</div>
                          <div className="text-xs text-muted-foreground">{item.categoria}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold ${
                            item[`margen_porcentaje_${currencyCode}`] >= 100
                              ? 'text-green-600 dark:text-green-400'
                              : item[`margen_porcentaje_${currencyCode}`] >= 50
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          {item[`margen_porcentaje_${currencyCode}`].toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{item.cantidad_vendida}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          (item[`ingresos_totales_${currencyCode}`] / item.cantidad_vendida) -
                            item[`precio_compra_${currencyCode}`],
                          defaultCurrency
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(item[`ganancia_${currencyCode}`], defaultCurrency)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
