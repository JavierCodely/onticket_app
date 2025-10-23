/**
 * RentabilidadProductos Component
 * Displays product profitability analysis with rotation metrics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { HelpCircle, TrendingUp, DollarSign, Percent, Package, BarChart3 } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/lib/currency-utils';
import type { Producto, CategoriaProducto } from '@/types/database/Productos';

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

interface ProductProfitability {
  producto: Producto;
  unidadesVendidas: number;
  margenReal: number; // (venta - compra) / compra * 100
  gananciaPorUnidad: number; // venta - compra
  rentabilidadReal: number; // ganancia por unidad * unidades vendidas
}

interface ProfitabilityStats {
  unidadesPromedioVendidas: number; // promedio de unidades vendidas por producto
  medianaUnidadesVendidas: number; // mediana de unidades vendidas (refleja mejor la tendencia)
  rentabilidadTotalReal: number; // suma total de rentabilidad real
  margenTotalPorcentaje: number; // % margen total global ponderado: (ganancia total / costo total) × 100
  margenTeoricoPorcentaje: number; // % margen teórico promedio simple (para comparar)
  eficienciaCapital: number; // rentabilidad / stock invertido (ROI)
  totalUnidadesVendidas: number; // suma total de unidades vendidas
}

export const RentabilidadProductos: React.FC = () => {
  const { user } = useAuth();
  const { defaultCurrency } = useCurrency();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [selectedProducto, setSelectedProducto] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [allProfitabilityData, setAllProfitabilityData] = useState<ProductProfitability[]>([]);
  const [stats, setStats] = useState<ProfitabilityStats>({
    unidadesPromedioVendidas: 0,
    medianaUnidadesVendidas: 0,
    rentabilidadTotalReal: 0,
    margenTotalPorcentaje: 0,
    margenTeoricoPorcentaje: 0,
    eficienciaCapital: 0,
    totalUnidadesVendidas: 0,
  });

  useEffect(() => {
    if (user?.club.id) {
      fetchProfitabilityData();
    }
  }, [user?.club.id, period, defaultCurrency]);

  const getDateRange = (): { startDate: Date; endDate: Date } => {
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
        startDate = new Date(0); // Unix epoch
        break;
    }

    return { startDate, endDate };
  };

  const fetchProfitabilityData = async () => {
    if (!user?.club.id) return;

    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // 1. Fetch all products
      const { data: productos, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('club_id', user.club.id);

      if (productosError) throw productosError;
      if (!productos) {
        setAllProfitabilityData([]);
        setLoading(false);
        return;
      }

      // 2. Fetch sale items for the period
      // Join with sale table to filter by club_id and date
      const { data: saleItems, error: salesError } = await supabase
        .from('sale_items')
        .select(`
          producto_id,
          cantidad,
          sale:sale_id (
            club_id,
            created_at
          )
        `)
        .gte('sale.created_at', startDate.toISOString())
        .lte('sale.created_at', endDate.toISOString());

      if (salesError) throw salesError;

      // 3. Calculate units sold per product (filter by club_id)
      const unidadesPorProducto: Record<string, number> = {};
      saleItems?.forEach((item: any) => {
        // Filter by club_id
        if (item.sale?.club_id !== user.club.id) return;

        if (!unidadesPorProducto[item.producto_id]) {
          unidadesPorProducto[item.producto_id] = 0;
        }
        unidadesPorProducto[item.producto_id] += item.cantidad;
      });

      // 4. Calculate profitability metrics
      const currencyCode = defaultCurrency.toLowerCase() as 'ars' | 'usd' | 'brl';
      const profitability: ProductProfitability[] = (productos as Producto[])
        .map((producto: Producto) => {
          const precioCompra = producto[`precio_compra_${currencyCode}`] || 0;
          const precioVenta = producto[`precio_venta_${currencyCode}`] || 0;
          const unidadesVendidas = unidadesPorProducto[producto.id] || 0;

          // Margen real (%) = ((Venta - Compra) / Compra) * 100
          const margenReal = precioCompra > 0
            ? ((precioVenta - precioCompra) / precioCompra) * 100
            : 0;

          // Ganancia por unidad = Venta - Compra
          const gananciaPorUnidad = precioVenta - precioCompra;

          // Rentabilidad real = Ganancia por unidad × Unidades vendidas
          const rentabilidadReal = gananciaPorUnidad * unidadesVendidas;

          return {
            producto,
            unidadesVendidas,
            margenReal,
            gananciaPorUnidad,
            rentabilidadReal,
          };
        })
        // Filter out products with no sales or no price data
        .filter((item) => item.unidadesVendidas > 0 && item.gananciaPorUnidad !== 0)
        // Sort by rentabilidadReal descending
        .sort((a, b) => b.rentabilidadReal - a.rentabilidadReal);

      setAllProfitabilityData(profitability);
    } catch (error) {
      console.error('Error fetching profitability data:', error);
      setAllProfitabilityData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and calculate stats when filters change
  useEffect(() => {
    const filteredData = applyFilters(allProfitabilityData);
    calculateStats(filteredData);
  }, [allProfitabilityData, selectedCategoria, selectedProducto]);

  const applyFilters = (data: ProductProfitability[]): ProductProfitability[] => {
    let filtered = [...data];

    // Filter by category
    if (selectedCategoria !== 'all') {
      filtered = filtered.filter(item => item.producto.categoria === selectedCategoria);
    }

    // Filter by product
    if (selectedProducto !== 'all') {
      filtered = filtered.filter(item => item.producto.id === selectedProducto);
    }

    return filtered;
  };

  const calculateStats = (data: ProductProfitability[]) => {
    if (data.length === 0) {
      setStats({
        unidadesPromedioVendidas: 0,
        medianaUnidadesVendidas: 0,
        rentabilidadTotalReal: 0,
        margenTotalPorcentaje: 0,
        margenTeoricoPorcentaje: 0,
        eficienciaCapital: 0,
        totalUnidadesVendidas: 0,
      });
      return;
    }

    const currencyCode = defaultCurrency.toLowerCase() as 'ars' | 'usd' | 'brl';

    // Calcular totales
    const totalUnidades = data.reduce((sum, item) => sum + item.unidadesVendidas, 0);
    const totalRentabilidad = data.reduce((sum, item) => sum + item.rentabilidadReal, 0);

    // Calcular margen total global ponderado: (Ganancia total / Costo total) × 100
    const totalCostos = data.reduce((sum, item) => {
      const precioCompra = item.producto[`precio_compra_${currencyCode}`] || 0;
      return sum + (precioCompra * item.unidadesVendidas);
    }, 0);

    const totalVentas = data.reduce((sum, item) => {
      const precioVenta = item.producto[`precio_venta_${currencyCode}`] || 0;
      return sum + (precioVenta * item.unidadesVendidas);
    }, 0);

    const gananciTotal = totalVentas - totalCostos;
    const margenTotalGlobal = totalCostos > 0
      ? (gananciTotal / totalCostos) * 100
      : 0;

    // Calcular margen teórico promedio (simple, sin ponderar)
    const totalMargenTeorico = data.reduce((sum, item) => sum + item.margenReal, 0);
    const margenTeorico = totalMargenTeorico / data.length;

    // Calcular mediana de unidades vendidas
    const unidadesArray = data.map(item => item.unidadesVendidas).sort((a, b) => a - b);
    const middleIndex = Math.floor(unidadesArray.length / 2);
    const mediana = unidadesArray.length % 2 === 0
      ? (unidadesArray[middleIndex - 1] + unidadesArray[middleIndex]) / 2
      : unidadesArray[middleIndex];

    // Calcular eficiencia de capital (ROI): Rentabilidad / Stock invertido
    const eficiencia = totalCostos > 0
      ? (totalRentabilidad / totalCostos) * 100
      : 0;

    setStats({
      unidadesPromedioVendidas: totalUnidades / data.length,
      medianaUnidadesVendidas: mediana,
      rentabilidadTotalReal: totalRentabilidad,
      margenTotalPorcentaje: margenTotalGlobal, // Ponderado por volumen
      margenTeoricoPorcentaje: margenTeorico, // Promedio simple (para comparar)
      eficienciaCapital: eficiencia, // ROI: Rentabilidad / Capital invertido
      totalUnidadesVendidas: totalUnidades,
    });
  };

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

  // Get filtered data for display
  const filteredProfitabilityData = applyFilters(allProfitabilityData);

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
                          <strong>Qué significa:</strong> Es el margen real considerando el peso de cada producto según sus ventas.
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
                {stats.margenTotalPorcentaje.toFixed(1)}%
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
                          <strong>Qué significa:</strong> Promedio sin ponderar. Todos los productos tienen el mismo peso sin importar cuánto vendiste.
                        </p>
                        <p className="text-xs text-yellow-500">
                          ⚠️ Útil solo para comparar percepción vs realidad. No usar para decisiones.
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
                {stats.margenTeoricoPorcentaje.toFixed(1)}%
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
                          <strong>Fórmula:</strong> Σ (Precio Venta - Precio Compra) × Unidades Vendidas
                        </p>
                        <p className="text-xs mb-2">
                          <strong>Qué significa:</strong> Suma de todas las ganancias generadas por todos los productos vendidos.
                        </p>
                        <p className="text-xs text-green-500">
                          ✓ Este es el dinero real que ganaste en el período seleccionado.
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
                {formatCurrency(stats.rentabilidadTotalReal, defaultCurrency)}
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
                          <strong>Fórmula:</strong> (Rentabilidad Total / Costo Total Invertido) × 100
                        </p>
                        <p className="text-xs mb-2">
                          <strong>Qué significa:</strong> Por cada $1 invertido en costos, cuánto ganaste.
                        </p>
                        <p className="text-xs">
                          <strong>Ejemplo:</strong> 130% = por cada $1 invertido recuperaste $1 + ganaste $0.30
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
                {stats.eficienciaCapital.toFixed(1)}%
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Suma Total de Unidades</p>
                        <p className="text-xs mb-2">
                          <strong>Fórmula:</strong> Σ Unidades Vendidas de todos los productos
                        </p>
                        <p className="text-xs mb-2">
                          <strong>Qué significa:</strong> Total de productos vendidos en el período.
                        </p>
                        <p className="text-xs text-blue-500">
                          ℹ️ Mide el volumen de ventas, no la rentabilidad.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalUnidadesVendidas.toLocaleString()}
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Media Aritmética</p>
                        <p className="text-xs mb-2">
                          <strong>Fórmula:</strong> Total Unidades / Cantidad de Productos
                        </p>
                        <p className="text-xs mb-2">
                          <strong>Qué significa:</strong> Promedio simple de unidades vendidas por producto.
                        </p>
                        <p className="text-xs text-yellow-500">
                          ⚠️ Puede ser engañoso si hay productos con ventas muy dispares. Compara con la mediana.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {stats.unidadesPromedioVendidas.toFixed(0)} uds
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Valor Central</p>
                        <p className="text-xs mb-2">
                          <strong>Cómo se calcula:</strong> Se ordenan todas las ventas y se toma el valor del medio.
                        </p>
                        <p className="text-xs mb-2">
                          <strong>Qué significa:</strong> Representa mejor el "producto típico" porque no se ve afectado por valores extremos.
                        </p>
                        <p className="text-xs text-green-500">
                          ✓ Útil cuando hay productos con ventas muy altas o muy bajas.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {Math.ceil(stats.medianaUnidadesVendidas)} uds
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tendencia real (mayoría)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      {!loading && filteredProfitabilityData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Most Profitable Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <CardTitle>Top 5 Productos Más Rentables</CardTitle>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Productos con Mayor Ganancia</p>
                      <p className="text-xs mb-2">
                        <strong>Qué muestra:</strong> Los 5 productos que generaron más ganancia total considerando rotación.
                      </p>
                      <p className="text-xs mb-2">
                        <strong>Cómo interpretarlo:</strong> Un producto puede tener bajo margen pero alta rotación y aun así ser muy rentable.
                      </p>
                      <p className="text-xs text-green-500">
                        ✓ Estos son tus "productos estrella" que más dinero te generan.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                Productos con mayor ganancia total en {getPeriodLabel().toLowerCase()}
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredProfitabilityData.slice(0, 5).map((item) => ({
                    nombre: item.producto.nombre.length > 15
                      ? item.producto.nombre.substring(0, 15) + '...'
                      : item.producto.nombre,
                    rentabilidad: item.rentabilidadReal,
                    unidades: item.unidadesVendidas,
                    margen: item.margenReal.toFixed(1) + '%',
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

          {/* Distribution by Units Sold */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <CardTitle>Distribución de Ventas</CardTitle>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Volumen de Ventas</p>
                      <p className="text-xs mb-2">
                        <strong>Qué muestra:</strong> Los 10 productos más vendidos por cantidad de unidades.
                      </p>
                      <p className="text-xs mb-2">
                        <strong>Cómo interpretarlo:</strong> Identifica cuáles productos tienen mayor rotación, independientemente de su rentabilidad.
                      </p>
                      <p className="text-xs text-blue-500">
                        ℹ️ Alto volumen no siempre significa alta rentabilidad. Compara con el gráfico de rentabilidad.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                Top 10 productos por unidades vendidas
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[...filteredProfitabilityData]
                    .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)
                    .slice(0, 10)
                    .map((item) => ({
                      nombre: item.producto.nombre.length > 12
                        ? item.producto.nombre.substring(0, 12) + '...'
                        : item.producto.nombre,
                      unidades: item.unidadesVendidas,
                    }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="nombre"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) => [value, 'Unidades']}
                  />
                  <Bar dataKey="unidades" name="Unidades Vendidas">
                    {[...filteredProfitabilityData]
                      .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)
                      .slice(0, 10)
                      .map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${220 + index * 15}, 70%, 50%)`} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Margin Comparison Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  <CardTitle>Análisis de Márgenes</CardTitle>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Percepción vs Realidad</p>
                      <p className="text-xs mb-2">
                        <strong>Qué muestra:</strong> Compara el margen teórico (promedio simple) con el margen real (ponderado por ventas).
                      </p>
                      <p className="text-xs mb-2">
                        <strong>Cómo interpretarlo:</strong> Si el teórico es mayor que el real, vendes más productos de bajo margen. Si es menor, vendes más de alto margen.
                      </p>
                      <p className="text-xs text-yellow-500">
                        ⚠️ Una diferencia grande indica desbalance entre productos de alto y bajo margen.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                Comparación entre margen teórico y real
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div>
                  <p className="text-sm text-muted-foreground">Margen Teórico (Percepción)</p>
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                    {stats.margenTeoricoPorcentaje.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Promedio simple sin ponderar</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Margen Real (Realidad)</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.margenTotalPorcentaje.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ponderado por volumen</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Diferencia:</span>
                  <span className={`font-bold ${
                    stats.margenTeoricoPorcentaje > stats.margenTotalPorcentaje
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {Math.abs(stats.margenTeoricoPorcentaje - stats.margenTotalPorcentaje).toFixed(1)}%
                  </span>
                </div>

                {stats.margenTeoricoPorcentaje > stats.margenTotalPorcentaje ? (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                    ⚠️ Tu margen teórico es mayor que el real. Estás vendiendo más productos de bajo margen en alto volumen.
                  </p>
                ) : (
                  <p className="text-xs text-green-600 dark:text-green-400 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                    ✓ Tu margen real es mayor o igual al teórico. Vendes productos de alto margen en buen volumen.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profitability by Category */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <CardTitle>Rentabilidad por Categoría</CardTitle>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Ganancia por Tipo de Producto</p>
                      <p className="text-xs mb-2">
                        <strong>Qué muestra:</strong> Suma de ganancias agrupadas por categoría (Vodka, Cerveza, Vino, etc.).
                      </p>
                      <p className="text-xs mb-2">
                        <strong>Cómo interpretarlo:</strong> Identifica qué categorías generan más dinero en total. Útil para decisiones de stock y promociones.
                      </p>
                      <p className="text-xs text-green-500">
                        ✓ Enfócate en las categorías que más aportan a tu negocio.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                Ganancia total por categoría de producto
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={(() => {
                    const categoryData = new Map<string, number>();
                    filteredProfitabilityData.forEach((item) => {
                      const current = categoryData.get(item.producto.categoria) || 0;
                      categoryData.set(item.producto.categoria, current + item.rentabilidadReal);
                    });
                    return Array.from(categoryData.entries())
                      .map(([categoria, rentabilidad]) => ({ categoria, rentabilidad }))
                      .sort((a, b) => b.rentabilidad - a.rentabilidad)
                      .slice(0, 8);
                  })()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="categoria"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value, defaultCurrency), 'Rentabilidad']}
                  />
                  <Bar dataKey="rentabilidad" name="Rentabilidad Total">
                    {(() => {
                      const categoryData = new Map<string, number>();
                      filteredProfitabilityData.forEach((item) => {
                        const current = categoryData.get(item.producto.categoria) || 0;
                        categoryData.set(item.producto.categoria, current + item.rentabilidadReal);
                      });
                      return Array.from(categoryData.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${140 + index * 20}, 60%, 50%)`} />
                        ));
                    })()}
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
          </div>
          <p className="text-sm text-muted-foreground">
            Análisis de rentabilidad considerando margen y rotación · {getPeriodLabel()}
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
                  {allProfitabilityData.map((item) => (
                    <SelectItem key={item.producto.id} value={item.producto.id}>
                      {item.producto.nombre}
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
            <div className="text-muted-foreground">Cargando datos...</div>
          </div>
        ) : filteredProfitabilityData.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              {allProfitabilityData.length === 0
                ? 'No hay datos de ventas para el período seleccionado'
                : 'No hay productos que coincidan con los filtros seleccionados'}
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center gap-1 cursor-help">
                            <span>Margen Real (%)</span>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold mb-1">Margen Bruto Teórico</p>
                          <p className="text-xs">
                            Fórmula: ((Precio Venta - Costo) ÷ Costo) × 100
                          </p>
                          <p className="text-xs mt-2">
                            <strong>Ejemplo:</strong> Si comprás un vodka a $10.000 y lo vendés a $25.000,
                            el margen es 150%.
                          </p>
                          <p className="text-xs mt-2 text-yellow-500">
                            ⚠️ Este es el margen en papel, no mide rentabilidad real.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-center">Unidades Vendidas</TableHead>
                  <TableHead className="text-right">Ganancia/Unidad</TableHead>
                  <TableHead className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-end gap-1 cursor-help">
                            <span>Rentabilidad Real</span>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold mb-1">Rentabilidad Real con Rotación</p>
                          <p className="text-xs">
                            Fórmula: (Precio Venta - Costo) × Unidades Vendidas
                          </p>
                          <p className="text-xs mt-2">
                            <strong>Ejemplo:</strong>
                          </p>
                          <ul className="text-xs mt-1 space-y-1">
                            <li>• Vodka: margen 150%, 40 unidades → <strong>$600.000</strong></li>
                            <li>• Whisky: margen 100%, 4 unidades → <strong>$200.000</strong></li>
                          </ul>
                          <p className="text-xs mt-2 text-green-500">
                            ✓ Mide ganancia real considerando velocidad de venta
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfitabilityData.map((item) => (
                  <TableRow key={item.producto.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{item.producto.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.producto.categoria}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${
                        item.margenReal >= 100
                          ? 'text-green-600 dark:text-green-400'
                          : item.margenReal >= 50
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {item.margenReal.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">
                        {item.unidadesVendidas}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.gananciaPorUnidad, defaultCurrency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(item.rentabilidadReal, defaultCurrency)}
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
