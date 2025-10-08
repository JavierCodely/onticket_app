/**
 * CombosPage
 * Complete combo management page with CRUD operations
 */

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import { ComboTable, ComboModal } from '@/components/organisms/Combos';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadImage, updateImage, deleteImage, STORAGE_BUCKETS } from '@/lib/storage';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/types/database';
import type { ComboWithProducts, ComboFormData, Combo } from '@/types/database/Combos';
import type { Producto } from '@/types/database/Productos';

// Type aliases from Database schema for type-safe operations
type ComboInsert = Database['public']['Tables']['combos']['Insert'];
type ComboUpdate = Database['public']['Tables']['combos']['Update'];
type ComboProductoInsert = Database['public']['Tables']['combo_productos']['Insert'];

export const CombosPage: React.FC = () => {
  const { user } = useAuth();
  const [combos, setCombos] = useState<ComboWithProducts[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosMap, setProductosMap] = useState<Map<string, Producto>>(new Map());
  const [loading, setLoading] = useState(true);

  // Modal states
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<ComboWithProducts | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [comboToDelete, setComboToDelete] = useState<ComboWithProducts | null>(null);

  // Fetch productos
  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      const productosData = (data || []) as Producto[];
      setProductos(productosData);

      // Create a map for quick lookup
      const map = new Map<string, Producto>();
      productosData.forEach((p) => map.set(p.id, p));
      setProductosMap(map);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar los productos');
    }
  };

  // Fetch combos with products
  const fetchCombos = async () => {
    try {
      setLoading(true);

      // Fetch combos with combo_productos relation
      const { data: combosData, error: combosError } = await supabase
        .from('combos')
        .select(`
          *,
          combo_productos (
            id,
            club_id,
            combo_id,
            producto_id,
            cantidad,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (combosError) throw combosError;

      setCombos((combosData as ComboWithProducts[]) || []);
    } catch (error) {
      console.error('Error fetching combos:', error);
      toast.error('Error al cargar los combos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchCombos();
  }, []);

  // Realtime subscription for productos
  useEffect(() => {
    if (!user) return;

    const productosChannel = supabase
      .channel('combos-productos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productos',
          filter: `club_id=eq.${user.club.id}`,
        },
        (payload) => {
          console.log('Producto change detected in combos page:', payload);

          if (payload.eventType === 'INSERT') {
            const newProducto = payload.new as Producto;
            setProductos((prev) => [...prev, newProducto]);
            setProductosMap((prev) => new Map(prev).set(newProducto.id, newProducto));
          } else if (payload.eventType === 'UPDATE') {
            const updatedProducto = payload.new as Producto;
            setProductos((prev) =>
              prev.map((p) => (p.id === updatedProducto.id ? updatedProducto : p))
            );
            setProductosMap((prev) => new Map(prev).set(updatedProducto.id, updatedProducto));
          } else if (payload.eventType === 'DELETE') {
            const deletedProducto = payload.old as Producto;
            setProductos((prev) => prev.filter((p) => p.id !== deletedProducto.id));
            setProductosMap((prev) => {
              const newMap = new Map(prev);
              newMap.delete(deletedProducto.id);
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productosChannel);
    };
  }, [user]);

  // Realtime subscription for combos
  useEffect(() => {
    if (!user) return;

    const combosChannel = supabase
      .channel('combos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combos',
          filter: `club_id=eq.${user.club.id}`,
        },
        (payload) => {
          console.log('Combo change detected:', payload);
          // Refetch combos to get the complete data with relations
          fetchCombos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(combosChannel);
    };
  }, [user]);

  // Create combo
  const handleCreateCombo = async (data: ComboFormData, imageFile: File | null | undefined) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      let imagen_url: string | null = null;

      // Upload image if provided
      if (imageFile instanceof File) {
        const { url, error } = await uploadImage(
          STORAGE_BUCKETS.COMBOS,
          imageFile,
          user.club.id
        );
        if (error) {
          console.error('Image upload error details:', error);
          toast.error(`Error al subir la imagen: ${error.message}`);
          return;
        }
        imagen_url = url;
      }

      // Calculate real prices based on selected products
      let precio_real_ars = 0;
      let precio_real_usd = 0;
      let precio_real_brl = 0;

      data.productos.forEach((item) => {
        const producto = productos.find((p) => p.id === item.producto_id);
        if (producto) {
          precio_real_ars += producto.precio_venta_ars * item.cantidad;
          precio_real_usd += producto.precio_venta_usd * item.cantidad;
          precio_real_brl += producto.precio_venta_brl * item.cantidad;
        }
      });

      // Use the currency with the highest value for legacy fields
      // This ensures precio_combo < precio_real constraint is satisfied
      let precio_real = 0;
      let precio_combo = 0;

      if (precio_real_ars > 0) {
        precio_real = precio_real_ars;
        precio_combo = data.precio_combo_ars;
      } else if (precio_real_usd > 0) {
        precio_real = precio_real_usd;
        precio_combo = data.precio_combo_usd;
      } else if (precio_real_brl > 0) {
        precio_real = precio_real_brl;
        precio_combo = data.precio_combo_brl;
      }

      // Insert combo
      const insertPayload: ComboInsert = {
        club_id: user.club.id,
        creado_por: user.personal.id,
        nombre: data.nombre,
        precio_real,
        precio_combo, 
        precio_real_ars,
        precio_combo_ars: data.precio_combo_ars,
        precio_real_usd,
        precio_combo_usd: data.precio_combo_usd,
        precio_real_brl,
        precio_combo_brl: data.precio_combo_brl,
        limite_usos: data.tiene_limite_usos ? data.limite_usos : null,
        limite_usos_por_venta: data.limite_usos_por_venta,
        activo: data.activo,
        imagen_url,
      };

      const { data: comboData, error: comboError } = await (supabase
        .from('combos') as any)
        .insert(insertPayload)
        .select()
        .single();

      if (comboError) throw comboError;
      const typedComboData = comboData as Combo;

      // Insert combo products
      const comboProductos: ComboProductoInsert[] = data.productos.map((item) => ({
        club_id: user.club.id,
        combo_id: typedComboData.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
      }));

      const { error: productosError } = await (supabase
        .from('combo_productos') as any)
        .insert(comboProductos);

      if (productosError) throw productosError;

      toast.success('Combo creado exitosamente');
      setComboModalOpen(false);
      fetchCombos();
    } catch (error) {
      console.error('Error creating combo:', error);
      toast.error('Error al crear el combo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update combo
  const handleUpdateCombo = async (data: ComboFormData, imageFile: File | null | undefined) => {
    if (!user || !selectedCombo) return;

    try {
      setIsSubmitting(true);

      let imagen_url = selectedCombo.imagen_url;

      // Handle image changes
      if (imageFile instanceof File) {
        const { url, error } = await updateImage(
          STORAGE_BUCKETS.COMBOS,
          imageFile,
          user.club.id,
          selectedCombo.imagen_url || undefined
        );
        if (error) {
          console.error('Image update error details:', error);
          toast.error(`Error al actualizar la imagen: ${error.message}`);
          return;
        }
        imagen_url = url;
      } else if (imageFile === null) {
        if (selectedCombo.imagen_url) {
          await deleteImage(STORAGE_BUCKETS.COMBOS, selectedCombo.imagen_url);
        }
        imagen_url = null;
      }

      // Calculate real prices based on selected products
      let precio_real_ars = 0;
      let precio_real_usd = 0;
      let precio_real_brl = 0;

      data.productos.forEach((item) => {
        const producto = productos.find((p) => p.id === item.producto_id);
        if (producto) {
          precio_real_ars += producto.precio_venta_ars * item.cantidad;
          precio_real_usd += producto.precio_venta_usd * item.cantidad;
          precio_real_brl += producto.precio_venta_brl * item.cantidad;
        }
      });

      // Use the currency with the highest value for legacy fields
      // This ensures precio_combo < precio_real constraint is satisfied
      let precio_real = 0;
      let precio_combo = 0;

      if (precio_real_ars > 0) {
        precio_real = precio_real_ars;
        precio_combo = data.precio_combo_ars;
      } else if (precio_real_usd > 0) {
        precio_real = precio_real_usd;
        precio_combo = data.precio_combo_usd;
      } else if (precio_real_brl > 0) {
        precio_real = precio_real_brl;
        precio_combo = data.precio_combo_brl;
      }

      // Update combo
      const updatePayload: ComboUpdate = {
        nombre: data.nombre,
        precio_real,
        precio_combo,
        precio_real_ars,
        precio_combo_ars: data.precio_combo_ars,
        precio_real_usd,
        precio_combo_usd: data.precio_combo_usd,
        precio_real_brl,
        precio_combo_brl: data.precio_combo_brl,
        limite_usos: data.tiene_limite_usos ? data.limite_usos : null,
        limite_usos_por_venta: data.limite_usos_por_venta,
        activo: data.activo,
        imagen_url,
      };

      const { error: comboError } = await (supabase
        .from('combos') as any)
        .update(updatePayload as any)
        .eq('id', selectedCombo.id);

      if (comboError) throw comboError;

      // Delete existing combo_productos
      const { error: deleteError } = await (supabase
        .from('combo_productos') as any)
        .delete()
        .eq('combo_id', selectedCombo.id);

      if (deleteError) throw deleteError;

      // Insert new combo products
      const comboProductos: ComboProductoInsert[] = data.productos.map((item) => ({
        club_id: user.club.id,
        combo_id: selectedCombo.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
      }));

      const { error: productosError } = await supabase
        .from('combo_productos')
        .insert(comboProductos as any);

      if (productosError) throw productosError;

      toast.success('Combo actualizado exitosamente');
      setComboModalOpen(false);
      setSelectedCombo(null);
      fetchCombos();
    } catch (error) {
      console.error('Error updating combo:', error);
      toast.error('Error al actualizar el combo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle combo active status
  const handleToggleActivo = async (combo: ComboWithProducts) => {
    try {
      const updatePayload = { 
        activo: !combo.activo 
      };
      
      const { error } = await (supabase
        .from('combos') as any)
        .update(updatePayload)
        .eq('id', combo.id);

      if (error) throw error;

      toast.success(`Combo ${combo.activo ? 'desactivado' : 'activado'} exitosamente`);
      fetchCombos();
    } catch (error) {
      console.error('Error toggling combo status:', error);
      toast.error('Error al cambiar el estado del combo');
    }
  };

  // Delete combo
  const handleDeleteCombo = async () => {
    if (!comboToDelete) return;

    try {
      // Check if combo has been used
      if (comboToDelete.cantidad_usos > 0) {
        toast.error('No se puede eliminar un combo que ya ha sido usado');
        return;
      }

      // Delete image if exists
      if (comboToDelete.imagen_url) {
        await deleteImage(STORAGE_BUCKETS.COMBOS, comboToDelete.imagen_url);
      }

      // Delete combo (cascade will delete combo_productos)
      const { error } = await supabase
        .from('combos')
        .delete()
        .eq('id', comboToDelete.id);

      if (error) throw error;

      toast.success('Combo eliminado exitosamente');
      fetchCombos();
    } catch (error) {
      console.error('Error deleting combo:', error);
      toast.error('Error al eliminar el combo');
    } finally {
      setDeleteDialogOpen(false);
      setComboToDelete(null);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setSelectedCombo(null);
    setComboModalOpen(true);
  };

  const openEditModal = (combo: ComboWithProducts) => {
    setSelectedCombo(combo);
    setComboModalOpen(true);
  };

  const openDeleteDialog = (combo: ComboWithProducts) => {
    setComboToDelete(combo);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Combos</h1>
            <p className="text-muted-foreground">
              Gestión de combos y paquetes de productos
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo combo
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {!loading && combos.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Combos</p>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{combos.length}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Activos</p>
                <Package className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {combos.filter((c) => c.activo).length}
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Inactivos</p>
                <Package className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {combos.filter((c) => !c.activo).length}
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Usos</p>
                <Package className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {combos.reduce((sum, c) => sum + c.cantidad_usos, 0)}
              </p>
            </div>
          </div>
        )}

        {/* Combos Display */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <ComboTable
            combos={combos}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
            onToggleActivo={handleToggleActivo}
            productosMap={productosMap}
          />
        )}

        {/* Modals */}
        <ComboModal
          open={comboModalOpen}
          onOpenChange={setComboModalOpen}
          combo={selectedCombo}
          productos={productos}
          onSubmit={selectedCombo ? handleUpdateCombo : handleCreateCombo}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El combo "{comboToDelete?.nombre}"
                será eliminado permanentemente.
                {comboToDelete && comboToDelete.cantidad_usos > 0 && (
                  <span className="block mt-2 text-destructive font-semibold">
                    Este combo ya ha sido usado {comboToDelete.cantidad_usos} vez(ces) y no puede ser eliminado.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCombo}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={comboToDelete ? comboToDelete.cantidad_usos > 0 : false}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};
