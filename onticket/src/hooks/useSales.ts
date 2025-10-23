/**
 * useSales Hook
 * Manages sales data with realtime updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SaleWithDetails, SaleFilters, SaleItem } from '@/types/database';
import type { SaleStatistics } from '@/types/ventas';

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
          case 'mixto':
            // For mixed payments, add the specific amounts to each method
            stats.total_efectivo += sale.monto_efectivo || 0;
            stats.total_transferencia += sale.monto_transferencia || 0;
            break;
        }

        // Sum quantities from all sale_items
        const totalCantidad = sale.sale_items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;
        stats.total_productos_vendidos += totalCantidad;
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
          personal:personal(id, nombre, apellido, rol),
          sale_items:sale_items(
            *,
            productos:productos(id, nombre, categoria, imagen_url)
          )
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
        // Support both single and multiple employee IDs
        if (Array.isArray(filters.personal_id)) {
          query = query.in('personal_id', filters.personal_id);
        } else {
          query = query.eq('personal_id', filters.personal_id);
        }
      }
      if (filters?.metodo_pago) {
        // Support both single and multiple payment methods
        if (Array.isArray(filters.metodo_pago)) {
          query = query.in('metodo_pago', filters.metodo_pago);
        } else {
          query = query.eq('metodo_pago', filters.metodo_pago);
        }
      }
      if (filters?.moneda) {
        query = query.eq('moneda', filters.moneda);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      // Filter by category if needed (client-side)
      let filteredData = data || [];
      if (filters?.categoria && filters.categoria !== 'all') {
        filteredData = filteredData.filter((sale) => {
          // Check if any sale_item has a product with the specified category
          return (sale as any).sale_items?.some(
            (item: any) => item.productos?.categoria === filters.categoria
          );
        });
      }

      // Filter by specific product if needed (client-side)
      if (filters?.producto_id && filters.producto_id !== 'all') {
        filteredData = filteredData.filter((sale) => {
          // Check if any sale_item contains the specified product
          return (sale as any).sale_items?.some(
            (item: any) => item.producto_id === filters.producto_id
          );
        });
      }

      // Filter by employee role if needed (client-side)
      if (filters?.rol) {
        const roles = Array.isArray(filters.rol) ? filters.rol : [filters.rol];
        filteredData = filteredData.filter((sale) => {
          const saleRol = (sale as any).personal?.rol;
          return saleRol && roles.includes(saleRol);
        });
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
   * Subscribe to realtime updates for sale and sale_items tables
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
          // Refetch sales when changes occur in sale table
          fetchSales();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sale_items',
        },
        () => {
          // Refetch sales when changes occur in sale_items table
          // Note: We listen to all sale_items changes, but filtering happens
          // on the sale table via RLS policies
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
   * Delete a sale (Admin only)
   * Restores stock for all products sold
   */
  const deleteSale = useCallback(async (saleId: string) => {
    // Step 1: Get all sale items BEFORE deleting them
    const { data: saleItems, error: fetchItemsError } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId) as { data: SaleItem[] | null, error: any };

    if (fetchItemsError) {
      throw fetchItemsError;
    }

    if (!saleItems || saleItems.length === 0) {
      throw new Error('No se encontraron items en la venta');
    }

    // Step 2: Restore stock for each item
    // IMPORTANT: For combos, sale_items.cantidad already includes the multiplication
    // (e.g., 1 combo of 3 beers = sale_item with cantidad=3, not cantidad=1)
    // So we just restore item.cantidad directly for ALL item types
    for (const item of saleItems) {
      const { data: currentProduct } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', item.producto_id)
        .single() as { data: { stock: number } | null; error: any };

      if (currentProduct) {
        const newStock = currentProduct.stock + item.cantidad;
        const { error: updateError } = await (supabase
          .from('productos')
          .update as any)({ stock: newStock })
          .eq('id', item.producto_id);

        if (updateError) {
          console.error('Error restoring stock:', updateError);
        }
      }
    }

    // Step 3: Delete sale_items
    const { error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', saleId);

    if (itemsError) {
      throw itemsError;
    }

    // Step 4: Delete the sale header
    const { error: saleError } = await supabase
      .from('sale')
      .delete()
      .eq('id', saleId);

    if (saleError) {
      throw saleError;
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
    deleteSale,
  };
}
