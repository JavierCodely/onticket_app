/**
 * useProductos Hook
 * Manages product fetching and realtime subscriptions
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Producto } from '@/types/database/Productos';
import type { User } from '@/types/database/Auth';

export const useProductos = (user: User | null) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products
  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      setProductos(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProductos();
  }, []);

  // Realtime subscription for productos
  useEffect(() => {
    if (!user) return;

    // Create realtime channel
    const channel = supabase
      .channel('productos-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'productos',
          filter: `club_id=eq.${user.club.id}`, // Only listen to products from user's club
        },
        (payload) => {
          console.log('Producto change detected:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new product to the list
            setProductos((prev) => [...prev, payload.new as Producto]);
            const nombre = (payload.new as Producto).nombre || 'Producto';
            toast.success('Nuevo producto agregado', {
              description: `${nombre} ha sido creado`,
            });
          } else if (payload.eventType === 'UPDATE') {
            // Update existing product
            setProductos((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Producto) : p))
            );
            
            // Show toast only if stock changed
            const oldStock = (payload.old as Producto).stock;
            const newStock = (payload.new as Producto).stock;
            if (oldStock !== undefined && newStock !== undefined && oldStock !== newStock) {
              const nombre = (payload.new as Producto).nombre || 'Producto';
              toast.info('Stock actualizado', {
                description: `${nombre}: ${oldStock} → ${newStock}`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted product
            setProductos((prev) => prev.filter((p) => p.id !== payload.old.id));
            const nombre = (payload.old as Producto).nombre || 'Producto';
            toast.error('Producto eliminado', {
              description: `${nombre} ha sido eliminado`,
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    productos,
    loading,
    refetch: fetchProductos,
  };
};

