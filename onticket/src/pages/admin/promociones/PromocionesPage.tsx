/**
 * PromocionesPage
 * Complete promotion management page with CRUD operations
 */

import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Button } from '@/components/ui/button';
import { Plus, Tag, TrendingDown, ShoppingCart } from 'lucide-react';
import { PromocionTable, PromocionModal } from '@/components/organisms/Promociones';
import { PromocionFilters } from '@/components/molecules/Promociones';
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
import type { PromocionWithProducto, PromocionFormData } from '@/types/database/Promociones';
import type { Producto } from '@/types/database/Productos';
import type { Personal } from '@/types/database/Personal';

// Type aliases from Database schema for type-safe operations
type PromocionInsert = Database['public']['Tables']['promociones']['Insert'];
type PromocionUpdate = Database['public']['Tables']['promociones']['Update'];

export const PromocionesPage: React.FC = () => {
  const { user } = useAuth();
  const [promociones, setPromociones] = useState<PromocionWithProducto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosMap, setProductosMap] = useState<Map<string, Producto>>(new Map());
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [creatorsMap, setCreatorsMap] = useState<Map<string, Personal>>(new Map());
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState('all');

  // Modal states
  const [promocionModalOpen, setPromocionModalOpen] = useState(false);
  const [selectedPromocion, setSelectedPromocion] = useState<PromocionWithProducto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promocionToDelete, setPromocionToDelete] = useState<PromocionWithProducto | null>(null);

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

  // Fetch personal (creators)
  const fetchPersonal = async () => {
    try {
      const { data, error } = await supabase
        .from('personal')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (error) throw error;

      const personalData = (data || []) as Personal[];
      setPersonal(personalData);

      // Create a map for quick lookup
      const map = new Map<string, Personal>();
      personalData.forEach((p) => map.set(p.id, p));
      setCreatorsMap(map);
    } catch (error) {
      console.error('Error fetching personal:', error);
      toast.error('Error al cargar el personal');
    }
  };

  // Fetch promociones
  const fetchPromociones = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('promociones')
        .select(`
          *,
          productos!inner(
            id,
            nombre,
            categoria,
            precio_venta,
            precio_compra,
            stock
          ),
          personal:creado_por(
            id,
            nombre,
            apellido,
            rol,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPromociones((data as PromocionWithProducto[]) || []);
    } catch (error) {
      console.error('Error fetching promociones:', error);
      toast.error('Error al cargar las promociones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchPersonal();
    fetchPromociones();
  }, []);

  // Realtime subscription for productos
  useEffect(() => {
    if (!user) return;

    const productosChannel = supabase
      .channel('promociones-productos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productos',
          filter: `club_id=eq.${user.club.id}`,
        },
        (payload) => {
          console.log('Producto change detected in promociones page:', payload);

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

  // Realtime subscription for promociones
  useEffect(() => {
    if (!user) return;

    const promocionesChannel = supabase
      .channel('promociones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promociones',
          filter: `club_id=eq.${user.club.id}`,
        },
        (payload) => {
          console.log('Promocion change detected:', payload);
          // Refetch promociones to get the complete data with producto relation
          fetchPromociones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(promocionesChannel);
    };
  }, [user]);

  // Filter and search logic
  const filteredPromociones = useMemo(() => {
    return promociones.filter((promocion) => {
      const producto = productosMap.get(promocion.producto_id);

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = producto?.nombre.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (producto?.categoria !== selectedCategory) return false;
      }

      // Creator filter
      if (selectedCreator !== 'all') {
        if (promocion.creado_por !== selectedCreator) return false;
      }

      return true;
    });
  }, [promociones, productosMap, searchTerm, selectedCategory, selectedCreator]);

  // Clear filters handler
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedCreator('all');
  };

  // Create promocion
  const handleCreatePromocion = async (data: PromocionFormData, imageFile: File | null | undefined) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      const producto = productos.find((p) => p.id === data.producto_id);
      if (!producto) {
        toast.error('Producto no encontrado');
        return;
      }

      let imagen_url: string | null = null;

      // Upload image if provided
      if (imageFile instanceof File) {
        const { url, error } = await uploadImage(
          STORAGE_BUCKETS.PROMOCIONES,
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

      // Use the currency with the highest value for legacy fields
      let precio_real = 0;
      let precio_promocion = 0;

      if (producto.precio_venta_ars > 0) {
        precio_real = producto.precio_venta_ars;
        precio_promocion = data.precio_promocion_ars;
      } else if (producto.precio_venta_usd > 0) {
        precio_real = producto.precio_venta_usd;
        precio_promocion = data.precio_promocion_usd;
      } else if (producto.precio_venta_brl > 0) {
        precio_real = producto.precio_venta_brl;
        precio_promocion = data.precio_promocion_brl;
      }

      const insertPayload: PromocionInsert = {
        club_id: user.club.id,
        producto_id: data.producto_id,
        creado_por: user.personal.id,
        precio_real,
        precio_promocion,
        precio_real_ars: producto.precio_venta_ars,
        precio_promocion_ars: data.precio_promocion_ars,
        precio_real_usd: producto.precio_venta_usd,
        precio_promocion_usd: data.precio_promocion_usd,
        precio_real_brl: producto.precio_venta_brl,
        precio_promocion_brl: data.precio_promocion_brl,
        cantidad_minima: data.cantidad_minima,
        cantidad_maxima: data.tiene_cantidad_maxima ? data.cantidad_maxima : null,
        limite_usos: data.tiene_limite_usos ? data.limite_usos : null,
        limite_usos_por_venta: data.limite_usos_por_venta,
        activo: data.activo,
        imagen_url,
      };

      const { error } = await (supabase
        .from('promociones') as any)
        .insert(insertPayload);

      if (error) throw error;

      toast.success('Promoción creada exitosamente');
      setPromocionModalOpen(false);
      fetchPromociones();
    } catch (error) {
      console.error('Error creating promocion:', error);
      toast.error('Error al crear la promoción');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update promocion
  const handleUpdatePromocion = async (data: PromocionFormData, imageFile: File | null | undefined) => {
    if (!user || !selectedPromocion) return;

    try {
      setIsSubmitting(true);

      let imagen_url = selectedPromocion.imagen_url;

      // Handle image changes
      if (imageFile instanceof File) {
        const { url, error } = await updateImage(
          STORAGE_BUCKETS.PROMOCIONES,
          imageFile,
          user.club.id,
          selectedPromocion.imagen_url || undefined
        );
        if (error) {
          console.error('Image update error details:', error);
          toast.error(`Error al actualizar la imagen: ${error.message}`);
          return;
        }
        imagen_url = url;
      } else if (imageFile === null) {
        if (selectedPromocion.imagen_url) {
          await deleteImage(STORAGE_BUCKETS.PROMOCIONES, selectedPromocion.imagen_url);
        }
        imagen_url = null;
      }

      // Use the currency with the highest value for legacy fields
      let precio_promocion = 0;

      if (data.precio_promocion_ars > 0) {
        precio_promocion = data.precio_promocion_ars;
      } else if (data.precio_promocion_usd > 0) {
        precio_promocion = data.precio_promocion_usd;
      } else if (data.precio_promocion_brl > 0) {
        precio_promocion = data.precio_promocion_brl;
      }

      const updatePayload: PromocionUpdate = {
        precio_promocion,
        precio_promocion_ars: data.precio_promocion_ars,
        precio_promocion_usd: data.precio_promocion_usd,
        precio_promocion_brl: data.precio_promocion_brl,
        cantidad_minima: data.cantidad_minima,
        cantidad_maxima: data.tiene_cantidad_maxima ? data.cantidad_maxima : null,
        limite_usos: data.tiene_limite_usos ? data.limite_usos : null,
        limite_usos_por_venta: data.limite_usos_por_venta,
        activo: data.activo,
        imagen_url,
      };

      const { error } = await (supabase
        .from('promociones') as any)
        .update(updatePayload)
        .eq('id', selectedPromocion.id);

      if (error) throw error;

      toast.success('Promoción actualizada exitosamente');
      setPromocionModalOpen(false);
      setSelectedPromocion(null);
      fetchPromociones();
    } catch (error) {
      console.error('Error updating promocion:', error);
      toast.error('Error al actualizar la promoción');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle promocion active status
  const handleToggleActivo = async (promocion: PromocionWithProducto) => {
    try {
      const updatePayload = {
        activo: !promocion.activo
      };

      const { error } = await (supabase
        .from('promociones') as any)
        .update(updatePayload)
        .eq('id', promocion.id);

      if (error) throw error;

      toast.success(`Promoción ${promocion.activo ? 'desactivada' : 'activada'} exitosamente`);
      fetchPromociones();
    } catch (error) {
      console.error('Error toggling promocion status:', error);
      toast.error('Error al cambiar el estado de la promoción');
    }
  };

  // Delete promocion
  const handleDeletePromocion = async () => {
    if (!promocionToDelete) return;

    try {
      // Check if promocion has been used
      if (promocionToDelete.cantidad_usos > 0) {
        toast.error('No se puede eliminar una promoción que ya ha sido usada');
        return;
      }

      // Delete image if exists
      if (promocionToDelete.imagen_url) {
        await deleteImage(STORAGE_BUCKETS.PROMOCIONES, promocionToDelete.imagen_url);
      }

      const { error } = await supabase
        .from('promociones')
        .delete()
        .eq('id', promocionToDelete.id);

      if (error) throw error;

      toast.success('Promoción eliminada exitosamente');
      fetchPromociones();
    } catch (error) {
      console.error('Error deleting promocion:', error);
      toast.error('Error al eliminar la promoción');
    } finally {
      setDeleteDialogOpen(false);
      setPromocionToDelete(null);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setSelectedPromocion(null);
    setPromocionModalOpen(true);
  };

  const openEditModal = (promocion: PromocionWithProducto) => {
    setSelectedPromocion(promocion);
    setPromocionModalOpen(true);
  };

  const openDeleteDialog = (promocion: PromocionWithProducto) => {
    setPromocionToDelete(promocion);
    setDeleteDialogOpen(true);
  };

  // Calculate statistics
  const totalDescuento = filteredPromociones.reduce((sum, p) => {
    return sum + (p.precio_real - p.precio_promocion) * p.cantidad_usos;
  }, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Promociones</h1>
            <p className="text-muted-foreground">
              Gestión de promociones y descuentos especiales
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva promoción
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {!loading && promociones.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Promociones</p>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{filteredPromociones.length}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Activas</p>
                <Tag className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {filteredPromociones.filter((p) => p.activo).length}
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Usos</p>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {filteredPromociones.reduce((sum, p) => sum + p.cantidad_usos, 0)}
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Descuento Total</p>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                ${totalDescuento.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && promociones.length > 0 && (
          <PromocionFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedCreator={selectedCreator}
            onCreatorChange={setSelectedCreator}
            creators={personal}
            onClearFilters={handleClearFilters}
          />
        )}

        {/* Promociones Display */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <PromocionTable
            promociones={filteredPromociones}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
            onToggleActivo={handleToggleActivo}
            productosMap={productosMap}
            creatorsMap={creatorsMap}
          />
        )}

        {/* Modals */}
        <PromocionModal
          open={promocionModalOpen}
          onOpenChange={setPromocionModalOpen}
          promocion={selectedPromocion}
          productos={productos}
          onSubmit={selectedPromocion ? handleUpdatePromocion : handleCreatePromocion}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La promoción será eliminada permanentemente.
                {promocionToDelete && promocionToDelete.cantidad_usos > 0 && (
                  <span className="block mt-2 text-destructive font-semibold">
                    Esta promoción ya ha sido usada {promocionToDelete.cantidad_usos} vez(ces) y no puede ser eliminada.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePromocion}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={promocionToDelete ? promocionToDelete.cantidad_usos > 0 : false}
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
