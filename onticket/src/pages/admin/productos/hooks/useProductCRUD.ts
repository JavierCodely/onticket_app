/**
 * useProductCRUD Hook
 * Manages product CRUD operations (Create, Read, Update, Delete, Stock Renewal)
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImage, updateImage, deleteImage, STORAGE_BUCKETS } from '@/lib/storage';
import { toast } from 'sonner';
import type { Producto, ProductoFormData, StockRenewalData } from '@/types/database/Productos';
import type { User } from '@/types/database/Auth';

interface UseProductCRUDParams {
  user: User | null;
  onSuccess?: () => void;
}

export const useProductCRUD = ({ user, onSuccess }: UseProductCRUDParams) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create product
  const createProduct = async (data: ProductoFormData, imageFile: File | null | undefined) => {
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
      onSuccess?.();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error al crear el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update product
  const updateProduct = async (
    producto: Producto,
    data: ProductoFormData,
    imageFile: File | null | undefined
  ) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      let imagen_url = producto.imagen_url;

      // Handle image changes
      if (imageFile instanceof File) {
        // New image file provided - upload and replace old one
        const { url, error } = await updateImage(
          STORAGE_BUCKETS.PRODUCTOS,
          imageFile,
          user.club.id,
          producto.imagen_url || undefined
        );
        if (error) {
          console.error('Image update error details:', error);
          toast.error(`Error al actualizar la imagen: ${error.message}`);
          return;
        }
        imagen_url = url;
      } else if (imageFile === null) {
        // Image was explicitly removed - delete from storage if exists
        if (producto.imagen_url) {
          await deleteImage(STORAGE_BUCKETS.PRODUCTOS, producto.imagen_url);
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
        .eq('id', producto.id);

      if (error) throw error;

      toast.success('Producto actualizado exitosamente');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const deleteProduct = async (producto: Producto) => {
    try {
      // Delete product first (before image, in case of FK errors)
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', producto.id);

      if (error) {
        // Check if it's a foreign key constraint error
        if (error.code === '23503') {
          // Product is referenced in other tables
          const errorDetails = error.details || '';
          const errorMessage = error.message || '';
          
          if (errorDetails.includes('combo_productos') || errorMessage.includes('combo_productos')) {
            toast.error('No se puede eliminar el producto', {
              description: 'Este producto está siendo usado en uno o más combos. Elimina primero los combos que lo usan.',
              duration: 5000,
            });
          } else if (errorDetails.includes('inicioycierre') || errorMessage.includes('inicioycierre')) {
            toast.error('No se puede eliminar el producto', {
              description: 'Este producto tiene registros de inicio/cierre de caja. No se puede eliminar por razones de auditoría.',
              duration: 5000,
            });
          } else if (errorDetails.includes('sale') || errorMessage.includes('sale')) {
            toast.error('No se puede eliminar el producto', {
              description: 'Este producto tiene ventas registradas. No se puede eliminar por razones de auditoría.',
              duration: 5000,
            });
          } else {
            toast.error('No se puede eliminar el producto', {
              description: 'Este producto está siendo usado en otros registros del sistema.',
              duration: 5000,
            });
          }
          return;
        }
        throw error;
      }

      // Delete image only after successful product deletion
      if (producto.imagen_url) {
        await deleteImage(STORAGE_BUCKETS.PRODUCTOS, producto.imagen_url);
      }

      toast.success('Producto eliminado exitosamente');
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  // Renew stock
  const renewStock = async (producto: Producto, data: StockRenewalData) => {
    try {
      setIsSubmitting(true);

      const newStock =
        data.tipo === 'add'
          ? producto.stock + data.cantidad
          : data.cantidad;

      const { error } = await supabase
        .from('productos')
        // @ts-ignore - Supabase type inference issue
        .update({ stock: newStock })
        .eq('id', producto.id);

      if (error) throw error;

      toast.success('Stock actualizado exitosamente');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar el stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    createProduct,
    updateProduct,
    deleteProduct,
    renewStock,
  };
};

