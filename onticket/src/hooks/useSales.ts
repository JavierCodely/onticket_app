/**
 * useSales Hook
 * Manages sales data with realtime updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SaleWithDetails, SaleFilters, MetodoPago } from '@/types/database';
import type { SaleStatistics } from '@/types/ventas';
import type { CurrencyCode } from '@/types/currency';

interface UseSalesOptions {
  enableRealtime?: boolean;
  filters?: SaleFilters;
}

export function useSales(options: UseSalesOptions = {}) {
  const { enableRealtime = true, filters } = options;
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [statistics, setStatistics] = useState<SaleStatistics>({
    total_efectivo: 0,
    total_transferencia: 0,
    total_tarjeta: 0,
    total_billetera_virtual: 0,
    total_productos_vendidos: 0,
    total_ventas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate statistics from sales data
   */
  const calculateStatistics = useCallback((salesData: SaleWithDetails[]): SaleStatistics => {
    return salesData.reduce(
      (stats, sale) => {
        // Accumulate by payment method
        switch (sale.metodo_pago) {
          case 'efectivo':
            stats.total_efectivo += sale.total;
            break;
          case 'transferencia':
            stats.total_transferencia += sale.total;
            break;
          case 'tarjeta':
            stats.total_tarjeta += sale.total;
            break;
          case 'billetera_virtual':
            stats.total_billetera_virtual += sale.total;
            break;
        }

        stats.total_productos_vendidos += sale.cantidad;
        stats.total_ventas += sale.total;

        return stats;
      },
      {
        total_efectivo: 0,
        total_transferencia: 0,
        total_tarjeta: 0,
        total_billetera_virtual: 0,
        total_productos_vendidos: 0,
        total_ventas: 0,
      }
    );
  }, []);

  /**
   * Fetch sales data with filters
   */
  const fetchSales = useCallback(async () => {
    if (!user?.club?.id) {
      setError('No club ID found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('sale')
        .select(`
          *,
          productos:productos(id, nombre, categoria, imagen_url),
          personal:personal(id, nombre, apellido, rol)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.fecha_desde) {
        query = query.gte('created_at', filters.fecha_desde);
      }
      if (filters?.fecha_hasta) {
        query = query.lte('created_at', filters.fecha_hasta);
      }
      if (filters?.personal_id) {
        query = query.eq('personal_id', filters.personal_id);
      }
      if (filters?.metodo_pago) {
        query = query.eq('metodo_pago', filters.metodo_pago);
      }
      if (filters?.moneda) {
        query = query.eq('moneda', filters.moneda);
      }
      if (filters?.categoria && filters.categoria !== 'all') {
        // This requires a join, so we'll filter after fetching
        // Or we can use a more complex query
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      // Filter by category if needed (client-side)
      let filteredData = data || [];
      if (filters?.categoria && filters.categoria !== 'all') {
        filteredData = filteredData.filter(
          (sale) => (sale as any).productos?.categoria === filters.categoria
        );
      }

      setSales(filteredData as SaleWithDetails[]);
      setStatistics(calculateStatistics(filteredData as SaleWithDetails[]));
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  }, [user?.club?.id, filters, calculateStatistics]);

  /**
   * Subscribe to realtime updates
   */
  useEffect(() => {
    if (!enableRealtime || !user?.club?.id) return;

    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sale',
          filter: `club_id=eq.${user.club.id}`,
        },
        () => {
          // Refetch sales when changes occur
          fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, user?.club?.id, fetchSales]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  /**
   * Create a new sale
   */
  const createSale = useCallback(
    async (saleData: {
      producto_id: string;
      personal_id: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
      descuento: number;
      total: number;
      moneda: CurrencyCode;
      metodo_pago: MetodoPago;
      // Currency-specific amounts
      precio_unitario_ars: number;
      subtotal_ars: number;
      descuento_ars: number;
      total_ars: number;
      precio_unitario_usd: number;
      subtotal_usd: number;
      descuento_usd: number;
      total_usd: number;
      precio_unitario_brl: number;
      subtotal_brl: number;
      descuento_brl: number;
      total_brl: number;
    }) => {
      if (!user?.club?.id) {
        throw new Error('No club ID found');
      }

      const { data, error } = await supabase
        .from('sale')
        .insert({
          club_id: user.club.id,
          ...saleData,
        } as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    [user?.club?.id]
  );

  /**
   * Delete a sale
   */
  const deleteSale = useCallback(async (saleId: string) => {
    const { error } = await supabase.from('sale').delete().eq('id', saleId);

    if (error) {
      throw error;
    }

    // Refetch after deletion
    await fetchSales();
  }, [fetchSales]);

  return {
    sales,
    statistics,
    loading,
    error,
    fetchSales,
    createSale,
    deleteSale,
  };
}
