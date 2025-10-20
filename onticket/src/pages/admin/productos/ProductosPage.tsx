/**
 * ProductosPage
 * Complete product management page with CRUD operations
 * Features: Card/Table view, Filters, Stock renewal, Image upload
 */

import React, { useState } from 'react';
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

// Import custom hooks
import { useProductos, useProductFilters, useProductCRUD } from './hooks';

type ViewMode = 'grid' | 'table';

export const ProductosPage: React.FC = () => {
  const { user } = useAuth();
  const { defaultCurrency } = useCurrency();
  
  // Custom hooks
  const { productos, loading, refetch } = useProductos(user);
  const {
    searchTerm,
    selectedCategory,
    showLowStock,
    lowStockCount,
    filteredProductos,
    setSearchTerm,
    setSelectedCategory,
    setShowLowStock,
  } = useProductFilters({ productos, defaultCurrency });

  const {
    isSubmitting,
    createProduct,
    updateProduct,
    deleteProduct,
    renewStock,
  } = useProductCRUD({
    user,
    onSuccess: () => {
      setProductModalOpen(false);
      setStockModalOpen(false);
      setDeleteDialogOpen(false);
      setSelectedProducto(null);
      setProductoToDelete(null);
      refetch();
    },
  });

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);

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

  // Submit handlers
  const handleSubmitProduct = async (data: ProductoFormData, imageFile: File | null | undefined) => {
    if (selectedProducto) {
      await updateProduct(selectedProducto, data, imageFile);
    } else {
      await createProduct(data, imageFile);
    }
  };

  const handleSubmitStock = async (data: StockRenewalData) => {
    if (selectedProducto) {
      await renewStock(selectedProducto, data);
    }
  };

  const handleConfirmDelete = async () => {
    if (productoToDelete) {
      await deleteProduct(productoToDelete);
    }
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
                onClick={() => exportProductsToCSV(
                  productos,
                  `productos-${new Date().toISOString().split('T')[0]}.csv`,
                  defaultCurrency
                )}
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
              lowStockCount={lowStockCount}
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
          onSubmit={handleSubmitProduct}
          isSubmitting={isSubmitting}
        />

        <StockRenewalModal
          open={stockModalOpen}
          onOpenChange={setStockModalOpen}
          producto={selectedProducto}
          onSubmit={handleSubmitStock}
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
                onClick={handleConfirmDelete}
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
