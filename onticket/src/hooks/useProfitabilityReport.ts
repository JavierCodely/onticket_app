/**
 * useProfitabilityReport Hook
 * Manages product profitability report data
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type {
  ProfitabilityReportMulticurrency,
  ProfitabilityReportFilters,
  ProfitabilityCategorySummary,
  ProfitabilitySummary,
} from '@/types/database/ProfitabilityReport';

interface UseProfitabilityReportOptions {
  filters?: ProfitabilityReportFilters;
  autoFetch?: boolean;
}

export function useProfitabilityReport(options: UseProfitabilityReportOptions = {}) {
  const { filters, autoFetch = true } = options;
  const { user } = useAuth();

  const [report, setReport] = useState<ProfitabilityReportMulticurrency[]>([]);
  const [summary, setSummary] = useState<ProfitabilitySummary | null>(null);
  const [categorySummaries, setCategorySummaries] = useState<ProfitabilityCategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate overall summary from report data
   */
  const calculateSummary = useCallback(
    (reportData: ProfitabilityReportMulticurrency[]): ProfitabilitySummary => {
      const total = reportData.reduce(
        (acc, item) => {
          // Count products with sales
          if (item.cantidad_vendida > 0) {
            acc.total_productos_vendidos += 1;
          }

          acc.cantidad_total_vendida += item.cantidad_vendida;

          // ARS
          acc.ingresos_totales_ars += item.ingresos_totales_ars;
          acc.costos_totales_ars += item.costos_totales_ars;
          acc.ganancia_total_ars += item.ganancia_ars;

          // USD
          acc.ingresos_totales_usd += item.ingresos_totales_usd;
          acc.costos_totales_usd += item.costos_totales_usd;
          acc.ganancia_total_usd += item.ganancia_usd;

          // BRL
          acc.ingresos_totales_brl += item.ingresos_totales_brl;
          acc.costos_totales_brl += item.costos_totales_brl;
          acc.ganancia_total_brl += item.ganancia_brl;

          return acc;
        },
        {
          total_productos: reportData.length,
          total_productos_vendidos: 0,
          cantidad_total_vendida: 0,
          ingresos_totales_ars: 0,
          costos_totales_ars: 0,
          ganancia_total_ars: 0,
          margen_promedio_ars: 0,
          ingresos_totales_usd: 0,
          costos_totales_usd: 0,
          ganancia_total_usd: 0,
          margen_promedio_usd: 0,
          ingresos_totales_brl: 0,
          costos_totales_brl: 0,
          ganancia_total_brl: 0,
          margen_promedio_brl: 0,
        }
      );

      // Calculate average margins
      total.margen_promedio_ars =
        total.ingresos_totales_ars > 0
          ? (total.ganancia_total_ars / total.ingresos_totales_ars) * 100
          : 0;

      total.margen_promedio_usd =
        total.ingresos_totales_usd > 0
          ? (total.ganancia_total_usd / total.ingresos_totales_usd) * 100
          : 0;

      total.margen_promedio_brl =
        total.ingresos_totales_brl > 0
          ? (total.ganancia_total_brl / total.ingresos_totales_brl) * 100
          : 0;

      return total;
    },
    []
  );

  /**
   * Calculate category summaries from report data
   */
  const calculateCategorySummaries = useCallback(
    (reportData: ProfitabilityReportMulticurrency[]): ProfitabilityCategorySummary[] => {
      const categoryMap = new Map<string, ProfitabilityCategorySummary>();

      reportData.forEach((item) => {
        if (item.cantidad_vendida === 0) return; // Skip products with no sales

        const existing = categoryMap.get(item.categoria);

        if (existing) {
          existing.productos_count += 1;
          existing.cantidad_total_vendida += item.cantidad_vendida;
          existing.ingresos_totales_ars += item.ingresos_totales_ars;
          existing.costos_totales_ars += item.costos_totales_ars;
          existing.ganancia_total_ars += item.ganancia_ars;
        } else {
          categoryMap.set(item.categoria, {
            categoria: item.categoria,
            productos_count: 1,
            cantidad_total_vendida: item.cantidad_vendida,
            ingresos_totales_ars: item.ingresos_totales_ars,
            costos_totales_ars: item.costos_totales_ars,
            ganancia_total_ars: item.ganancia_ars,
            margen_promedio_ars: 0, // Calculated below
          });
        }
      });

      // Calculate average margin for each category
      const summaries = Array.from(categoryMap.values()).map((summary) => ({
        ...summary,
        margen_promedio_ars:
          summary.ingresos_totales_ars > 0
            ? (summary.ganancia_total_ars / summary.ingresos_totales_ars) * 100
            : 0,
      }));

      // Sort by total profit descending
      return summaries.sort((a, b) => b.ganancia_total_ars - a.ganancia_total_ars);
    },
    []
  );

  /**
   * Fetch profitability report data
   */
  const fetchReport = useCallback(async () => {
    if (!user?.club?.id) {
      setError('No club ID found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the SQL function
      const { data, error: queryError } = await supabase.rpc(
        'get_product_profitability_report_multicurrency',
        {
          p_club_id: user.club.id,
          p_start_date: filters?.start_date?.toISOString() || null,
          p_end_date: filters?.end_date?.toISOString() || null,
        } as any
      );

      if (queryError) {
        throw queryError;
      }

      let reportData = (data || []) as ProfitabilityReportMulticurrency[];

      // Apply client-side filters
      if (filters?.categoria) {
        reportData = reportData.filter((item) => item.categoria === filters.categoria);
      }

      if (filters?.min_cantidad && filters.min_cantidad > 0) {
        reportData = reportData.filter((item) => item.cantidad_vendida >= filters.min_cantidad!);
      }

      // Apply sorting
      if (filters?.order_by) {
        reportData = reportData.sort((a, b) => {
          let aValue: number = 0;
          let bValue: number = 0;

          switch (filters.order_by) {
            case 'ganancia':
              aValue = a.ganancia_ars;
              bValue = b.ganancia_ars;
              break;
            case 'ingresos':
              aValue = a.ingresos_totales_ars;
              bValue = b.ingresos_totales_ars;
              break;
            case 'margen':
              aValue = a.margen_porcentaje_ars;
              bValue = b.margen_porcentaje_ars;
              break;
            case 'cantidad':
              aValue = a.cantidad_vendida;
              bValue = b.cantidad_vendida;
              break;
            case 'nombre':
              return filters.order_direction === 'asc'
                ? a.producto_nombre.localeCompare(b.producto_nombre)
                : b.producto_nombre.localeCompare(a.producto_nombre);
            default:
              return 0;
          }

          return filters.order_direction === 'asc' ? aValue - bValue : bValue - aValue;
        });
      }

      setReport(reportData);
      setSummary(calculateSummary(reportData));
      setCategorySummaries(calculateCategorySummaries(reportData));
    } catch (err) {
      console.error('Error fetching profitability report:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, [user?.club?.id, filters, calculateSummary, calculateCategorySummaries]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    if (autoFetch) {
      fetchReport();
    }
  }, [autoFetch, fetchReport]);

  /**
   * Export report to CSV
   */
  const exportToCSV = useCallback(() => {
    if (report.length === 0) return;

    const headers = [
      'Producto',
      'Categoría',
      'Cantidad Vendida',
      'Precio Compra ARS',
      'Precio Venta ARS',
      'Ingresos ARS',
      'Costos ARS',
      'Ganancia ARS',
      'Margen %',
    ];

    const rows = report.map((item) => [
      item.producto_nombre,
      item.categoria,
      item.cantidad_vendida,
      item.precio_compra_ars.toFixed(2),
      item.precio_venta_ars.toFixed(2),
      item.ingresos_totales_ars.toFixed(2),
      item.costos_totales_ars.toFixed(2),
      item.ganancia_ars.toFixed(2),
      item.margen_porcentaje_ars.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `rentabilidad_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [report]);

  return {
    report,
    summary,
    categorySummaries,
    loading,
    error,
    fetchReport,
    exportToCSV,
  };
}
