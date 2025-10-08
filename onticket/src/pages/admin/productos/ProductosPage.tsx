/**
 * ProductosPage
 * Complete product management page with CRUD operations
 * Features: Card/Table view, Filters, Stock renewal, Image upload
 */

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, Table as TableIcon, RefreshCw, Download } from 'lucide-react';
import { exportProductsToCSV } from '@/lib/export';
import {
  ProductFilters,
  ProductStats,
} from '@/components/molecules/Productos';
import {
  ProductGrid,
  ProductTable,
  ProductModal,
  StockRenewalModal,
} from '@/components/organisms/Productos';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { getPriceForCurrency } from '@/lib/currency-utils';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Producto, ProductoFormData, StockRenewalData } from '@/types/database/Productos';

type ViewMode = 'grid' | 'table';

export const ProductosPage: React.FC = () => {
  const { user } = useAuth();
  const { defaultCurrency } = useCurrency();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);

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
            toast.success('Nuevo producto agregado', {
              description: `${(payload.new as Producto).nombre} ha sido creado`,
            });
          } else if (payload.eventType === 'UPDATE') {
            // Update existing product
            setProductos((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Producto) : p))
            );
            
            // Show toast only if stock changed
            const oldStock = (payload.old as Producto).stock;
            const newStock = (payload.new as Producto).stock;
            if (oldStock !== newStock) {
              toast.info('Stock actualizado', {
                description: `${(payload.new as Producto).nombre}: ${oldStock} → ${newStock}`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted product
            setProductos((prev) => prev.filter((p) => p.id !== payload.old.id));
            toast.error('Producto eliminado', {
              description: `${(payload.old as Producto).nombre} ha sido eliminado`,
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

  // Filter products
  useEffect(() => {
    let filtered = productos;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.categoria === selectedCategory);
    }

    // Filter by low stock
    if (showLowStock) {
      filtered = filtered.filter((p) => p.min_stock > 0 && p.stock <= p.min_stock);
    }

    // Sort by sale price (highest to lowest) based on default currency
    filtered = filtered.sort((a, b) => {
      const precioA = getPriceForCurrency(a, defaultCurrency, 'venta');
      const precioB = getPriceForCurrency(b, defaultCurrency, 'venta');
      return precioB - precioA; // Descendente (mayor a menor)
    });

    setFilteredProductos(filtered);
  }, [productos, searchTerm, selectedCategory, showLowStock, defaultCurrency]);

  // Create product
  const handleCreateProduct = async (data: ProductoFormData, imageFile: File | null | undefined) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      let imagen_url: string | null = null;

      // Upload image if provided
      if (imageFile) {
        const { url, error } = await uploadImage(
          STORAGE_BUCKETS.PRODUCTOS,
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

      // Insert product
      // @ts-ignore - Supabase type inference issue
      const { error } = await supabase.from('productos').insert({
        club_id: user.club.id,
        nombre: data.nombre,
        categoria: data.categoria,
        precio_compra: data.precio_compra,
        precio_venta: data.precio_venta,
        // Multi-currency prices
        precio_compra_ars: data.precio_compra_ars,
        precio_venta_ars: data.precio_venta_ars,
        precio_compra_usd: data.precio_compra_usd,
        precio_venta_usd: data.precio_venta_usd,
        precio_compra_brl: data.precio_compra_brl,
        precio_venta_brl: data.precio_venta_brl,
        stock: data.stock,
        min_stock: data.min_stock,
        max_stock: data.max_stock,
        imagen_url,
      });

      if (error) throw error;

      toast.success('Producto creado exitosamente');
      setProductModalOpen(false);
      fetchProductos();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error al crear el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update product
  const handleUpdateProduct = async (data: ProductoFormData, imageFile: File | null | undefined) => {
    if (!user || !selectedProducto) return;

    try {
      setIsSubmitting(true);

      let imagen_url = selectedProducto.imagen_url;

      // Handle image changes
      if (imageFile instanceof File) {
        // New image file provided - upload and replace old one
        const { url, error } = await updateImage(
          STORAGE_BUCKETS.PRODUCTOS,
          imageFile,
          user.club.id,
          selectedProducto.imagen_url || undefined
        );
        if (error) {
          console.error('Image update error details:', error);
          toast.error(`Error al actualizar la imagen: ${error.message}`);
          return;
        }
        imagen_url = url;
      } else if (imageFile === null) {
        // Image was explicitly removed - delete from storage if exists
        if (selectedProducto.imagen_url) {
          await deleteImage(STORAGE_BUCKETS.PRODUCTOS, selectedProducto.imagen_url);
        }
        imagen_url = null;
      }
      // If imageFile === undefined, keep the existing imagen_url unchanged

      // Update product
      const { error } = await supabase
        .from('productos')
        // @ts-ignore - Supabase type inference issue
        .update({
          nombre: data.nombre,
          categoria: data.categoria,
          precio_compra: data.precio_compra,
          precio_venta: data.precio_venta,
          // Multi-currency prices
          precio_compra_ars: data.precio_compra_ars,
          precio_venta_ars: data.precio_venta_ars,
          precio_compra_usd: data.precio_compra_usd,
          precio_venta_usd: data.precio_venta_usd,
          precio_compra_brl: data.precio_compra_brl,
          precio_venta_brl: data.precio_venta_brl,
          stock: data.stock,
          min_stock: data.min_stock,
          max_stock: data.max_stock,
          imagen_url,
        })
        .eq('id', selectedProducto.id);

      if (error) throw error;

      toast.success('Producto actualizado exitosamente');
      setProductModalOpen(false);
      setSelectedProducto(null);
      fetchProductos();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!productoToDelete) return;

    try {
      // Delete image if exists
      if (productoToDelete.imagen_url) {
        await deleteImage(STORAGE_BUCKETS.PRODUCTOS, productoToDelete.imagen_url);
      }

      // Delete product
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productoToDelete.id);

      if (error) throw error;

      toast.success('Producto eliminado exitosamente');
      fetchProductos();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    } finally {
      setDeleteDialogOpen(false);
      setProductoToDelete(null);
    }
  };

  // Renew stock
  const handleRenewStock = async (data: StockRenewalData) => {
    if (!selectedProducto) return;

    try {
      setIsSubmitting(true);

      const newStock =
        data.tipo === 'add'
          ? selectedProducto.stock + data.cantidad
          : data.cantidad;

      const { error } = await supabase
        .from('productos')
        // @ts-ignore - Supabase type inference issue
        .update({ stock: newStock })
        .eq('id', selectedProducto.id);

      if (error) throw error;

      toast.success('Stock actualizado exitosamente');
      setStockModalOpen(false);
      setSelectedProducto(null);
      fetchProductos();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar el stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setSelectedProducto(null);
    setProductModalOpen(true);
  };

  const openEditModal = (producto: Producto) => {
    setSelectedProducto(producto);
    setProductModalOpen(true);
  };

  const openStockModal = (producto: Producto) => {
    setSelectedProducto(producto);
    setStockModalOpen(true);
  };

  const openDeleteDialog = (producto: Producto) => {
    setProductoToDelete(producto);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
            <p className="text-muted-foreground">
              Gestión de productos e inventario
            </p>
          </div>
          <div className="flex gap-2">
            {productos.length > 0 && (
              <Button
                variant="outline"
                onClick={() => exportProductsToCSV(productos, `productos-${new Date().toISOString().split('T')[0]}.csv`)}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            )}
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo producto
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {!loading && productos.length > 0 && (
          <ProductStats productos={productos} />
        )}

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex-1">
            <ProductFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              showLowStock={showLowStock}
              onLowStockToggle={() => setShowLowStock(!showLowStock)}
              lowStockCount={productos.filter((p) => p.min_stock > 0 && p.stock <= p.min_stock).length}
            />
          </div>

          <div className="flex gap-2">
            {/* Stock renewal button */}
            {filteredProductos.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  // Show first product for stock renewal, or allow selecting from list
                  if (filteredProductos.length === 1) {
                    openStockModal(filteredProductos[0]);
                  } else {
                    toast.info('Selecciona un producto desde la vista para renovar su stock');
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Renovar Stock
              </Button>
            )}

            {/* View mode toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
            >
              <ToggleGroupItem value="grid" aria-label="Vista de tarjetas">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Vista de tabla">
                <TableIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <ProductGrid
            productos={filteredProductos}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
            onRenewStock={openStockModal}
          />
        ) : (
          <ProductTable
            productos={filteredProductos}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
            onRenewStock={openStockModal}
          />
        )}

        {/* Modals */}
        <ProductModal
          open={productModalOpen}
          onOpenChange={setProductModalOpen}
          producto={selectedProducto}
          onSubmit={selectedProducto ? handleUpdateProduct : handleCreateProduct}
          isSubmitting={isSubmitting}
        />

        <StockRenewalModal
          open={stockModalOpen}
          onOpenChange={setStockModalOpen}
          producto={selectedProducto}
          onSubmit={handleRenewStock}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El producto "{productoToDelete?.nombre}"
                será eliminado permanentemente del inventario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProduct}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
