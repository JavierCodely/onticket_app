/**
 * NewSaleDialog V2 Component
 * Complete rewrite to avoid Radix UI portal conflicts
 * Uses native HTML elements and simpler structure
 */

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency-utils';
import { ProductCard } from '@/components/molecules/ventas/ProductCard';
import { ComboCard } from '@/components/molecules/ventas/ComboCard';
import { supabase } from '@/lib/supabase';
import { 
  UserCircle, 
  CreditCard, 
  Coins, 
  Package, 
  Tag, 
  TrendingUp, 
  Search,
  ShoppingCart as CartIcon,
  Minus,
  Plus,
  Trash2
} from 'lucide-react';
import type { Producto, Promocion, Combo, Personal, MetodoPago, CategoriaProducto } from '@/types/database';
import type { CurrencyCode } from '@/types/currency';
import type { CartItem } from '@/types/ventas';
import { CURRENCIES } from '@/types/currency';

interface NewSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  promociones: Promocion[];
  combos: Combo[];
  empleados: Personal[];
  onSaleCreated: () => void;
}

type ViewMode = 'products' | 'promotions' | 'combos';

const CATEGORIES: CategoriaProducto[] = [
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

export function NewSaleDialog({
  open,
  onOpenChange,
  productos,
  promociones,
  combos,
  empleados,
  onSaleCreated,
}: NewSaleDialogProps) {
  const { user } = useAuth();
  const { defaultCurrency } = useCurrency();

  const {
    items,
    moneda,
    metodoPago,
    empleadoId,
    subtotal,
    descuentoTotal,
    total,
    isValid,
    addProduct,
    addCombo,
    updateQuantity,
    removeItem,
    clearCart,
    changeCurrency,
    changeMetodoPago,
    setEmpleado,
  } = useCart({
    defaultCurrency,
    defaultMetodoPago: 'efectivo',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [selectedCategory, setSelectedCategory] = useState<CategoriaProducto | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [descuentoAdicional, setDescuentoAdicional] = useState<number>(0);
  const [descuentoInput, setDescuentoInput] = useState<string>('');
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'monto'>('porcentaje');
  const [realtimeStock, setRealtimeStock] = useState<Map<string, number>>(new Map());

  // Get the selected employee's role to determine pricing
  const selectedEmpleado = empleados.find(emp => emp.id === empleadoId);
  const isSelectedEmpleadoAdmin = selectedEmpleado?.rol === 'Admin';

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      clearCart();
      setEmpleado(null);
      setSearchQuery('');
      setSelectedCategory('all');
      setViewMode('products');
      setDescuentoAdicional(0);
      setDescuentoInput('');
      setTipoDescuento('porcentaje');

      // Initialize realtime stock
      const stockMap = new Map<string, number>();
      productos.forEach(p => stockMap.set(p.id, p.stock));
      setRealtimeStock(stockMap);
    }
  }, [open, clearCart, setEmpleado, productos]);

  // Clear cart when employee changes (to recalculate prices based on new employee's role)
  useEffect(() => {
    // Only clear cart if there are items AND an employee was previously selected
    // This prevents clearing on initial selection
    if (items.length > 0 && empleadoId) {
      clearCart();
      toast.info('Carrito vaciado. Los precios dependen del rol del empleado seleccionado.');
    }
  }, [empleadoId]);

  // Subscribe to realtime stock updates
  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel('productos_stock_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productos',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updated = payload.new as Producto;
            setRealtimeStock((prev) => {
              const newMap = new Map(prev);
              newMap.set(updated.id, updated.stock);
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  // Filter bartenders
  const currentUser = empleados.find((emp) => emp.user_id === user?.id);
  const bartenders = empleados.filter(
    (emp) => emp.rol === 'Bartender' || emp.rol === 'Admin'
  );

  // Check if currency can be changed (based on selected employee's role)
  const canChangeCurrency = productos.every(
    (p) =>
      p.precio_venta_ars > 0 &&
      p.precio_venta_usd > 0 &&
      p.precio_venta_brl > 0 &&
      (isSelectedEmpleadoAdmin
        ? p.precio_compra_ars > 0 && p.precio_compra_usd > 0 && p.precio_compra_brl > 0
        : true)
  );

  // Calculate total with additional discount
  const totalConDescuentoAdicional = useMemo(() => {
    return Math.max(0, total - descuentoAdicional);
  }, [total, descuentoAdicional]);

  // Apply additional discount
  const handleAplicarDescuento = () => {
    const inputValue = parseFloat(descuentoInput);
    
    if (isNaN(inputValue) || inputValue < 0) {
      toast.error('Ingresa un descuento válido');
      return;
    }

    if (tipoDescuento === 'porcentaje') {
      if (inputValue > 100) {
        toast.error('El porcentaje no puede ser mayor a 100%');
        return;
      }
      const descuento = (total * inputValue) / 100;
      setDescuentoAdicional(descuento);
      toast.success(`Descuento del ${inputValue}% aplicado`);
    } else {
      if (inputValue > total) {
        toast.error('El descuento no puede ser mayor al total');
        return;
      }
      setDescuentoAdicional(inputValue);
      toast.success(`Descuento de ${formatCurrency(inputValue, moneda)} aplicado`);
    }
  };

  // Remove additional discount
  const handleRemoverDescuento = () => {
    setDescuentoAdicional(0);
    setDescuentoInput('');
    toast.success('Descuento removido');
  };

  // Get prices (based on selected employee's role)
  const getProductPrice = (producto: Producto): number => {
    const field = isSelectedEmpleadoAdmin ? 'precio_compra' : 'precio_venta';
    switch (moneda) {
      case 'ARS':
        return producto[`${field}_ars`];
      case 'USD':
        return producto[`${field}_usd`];
      case 'BRL':
        return producto[`${field}_brl`];
      default:
        return producto[`${field}_ars`];
    }
  };

  const getPromotionPrice = (promocion: Promocion): { real: number; promo: number } => {
    switch (moneda) {
      case 'ARS':
        return { real: promocion.precio_real_ars, promo: promocion.precio_promocion_ars };
      case 'USD':
        return { real: promocion.precio_real_usd, promo: promocion.precio_promocion_usd };
      case 'BRL':
        return { real: promocion.precio_real_brl, promo: promocion.precio_promocion_brl };
      default:
        return { real: promocion.precio_real_ars, promo: promocion.precio_promocion_ars };
    }
  };

  const getComboPrice = (combo: Combo): number => {
    switch (moneda) {
      case 'ARS':
        return combo.precio_combo_ars;
      case 'USD':
        return combo.precio_combo_usd;
      case 'BRL':
        return combo.precio_combo_brl;
      default:
        return combo.precio_combo_ars;
    }
  };

  // Filter products (with sorting by price)
  const filteredProductos = useMemo(() => {
    return productos
      .filter((p) => {
        if (selectedCategory !== 'all' && p.categoria !== selectedCategory) return false;
        if (searchQuery && !p.nombre.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const precioA = getProductPrice(a);
        const precioB = getProductPrice(b);
        return precioB - precioA; // Mayor a menor
      });
  }, [productos, selectedCategory, searchQuery, moneda, isSelectedEmpleadoAdmin]);

  // Filter promotions (with sorting by price)
  const filteredPromociones = useMemo(() => {
    return promociones
      .filter((promo) => {
        if (!promo.activo) return false;
        // Exclude promotions that reached their global usage limit
        if (promo.limite_usos !== null && promo.cantidad_usos >= promo.limite_usos) return false;
        const producto = productos.find((p) => p.id === promo.producto_id);
        if (!producto) return false;
        if (selectedCategory !== 'all' && producto.categoria !== selectedCategory) return false;
        if (searchQuery && !producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const precioA = getPromotionPrice(a).promo;
        const precioB = getPromotionPrice(b).promo;
        return precioB - precioA; // Mayor a menor
      });
  }, [promociones, productos, selectedCategory, searchQuery, moneda]);

  // Filter combos (with sorting by price)
  const filteredCombos = useMemo(() => {
    return combos
      .filter((combo) => {
        if (!combo.activo) return false;
        // Exclude combos that reached their global usage limit
        if (combo.limite_usos !== null && combo.cantidad_usos >= combo.limite_usos) return false;
        if (searchQuery && !combo.nombre.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const precioA = getComboPrice(a);
        const precioB = getComboPrice(b);
        return precioB - precioA; // Mayor a menor
      });
  }, [combos, searchQuery, moneda]);

  // Get current stock (realtime or fallback)
  const getCurrentStock = (productoId: string): number => {
    return realtimeStock.get(productoId) ?? productos.find(p => p.id === productoId)?.stock ?? 0;
  };

  /**
   * Calculate how much stock of a product is being used in the cart
   * Considers: individual products, promotions, and products inside combos
   */
  const getProductQuantityInCart = (productoId: string): number => {
    let totalEnCarrito = 0;

    for (const item of items) {
      if (item.type === 'product' || item.type === 'promotion') {
        // Count individual products and promotions
        if (item.producto_id === productoId) {
          totalEnCarrito += item.cantidad;
        }
      } else if (item.type === 'combo') {
        // Count products inside combos
        const comboProductos = (item.combo as any).combo_productos as Array<{
          cantidad: number;
          productos: { id: string; nombre: string } | null;
        }> | undefined;

        if (comboProductos) {
          for (const comboItem of comboProductos) {
            if (comboItem.productos?.id === productoId) {
              // Each combo contains comboItem.cantidad of this product
              // And we have item.cantidad combos in the cart
              totalEnCarrito += comboItem.cantidad * item.cantidad;
            }
          }
        }
      }
    }

    return totalEnCarrito;
  };

  // Helper function to validate combo quantity limits
  const handleComboQuantityChange = (itemId: string, newQuantity: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.type !== 'combo') {
      updateQuantity(itemId, newQuantity);
      return;
    }

    const combo = item.combo;
    const limiteUsos = combo.limite_usos_por_venta || 999;

    // If quantity is 0, remove the item
    if (newQuantity === 0) {
      updateQuantity(itemId, newQuantity);
      return;
    }

    if (newQuantity > limiteUsos) {
      toast.error(`Este combo tiene un límite de ${limiteUsos} unidad(es) por venta`);
      return;
    }

    // Validate stock for all products in the combo
    const comboProductos = (combo as any).combo_productos as Array<{
      cantidad: number;
      productos: { id: string; nombre: string } | null;
    }> | undefined;

    if (comboProductos) {
      for (const comboItem of comboProductos) {
        if (!comboItem.productos) continue;

        const productoId = comboItem.productos.id;
        const cantidadRequeridaPorCombo = comboItem.cantidad;
        const currentStock = getCurrentStock(productoId);
        // Subtract current combo's usage, then add the new quantity's usage
        const cantidadEnCarrito = getProductQuantityInCart(productoId) - (item.cantidad * cantidadRequeridaPorCombo);
        const nuevaCantidadRequerida = newQuantity * cantidadRequeridaPorCombo;

        if (cantidadEnCarrito + nuevaCantidadRequerida > currentStock) {
          toast.error(
            `Stock insuficiente de "${comboItem.productos.nombre}". ` +
            `Requiere ${nuevaCantidadRequerida}, disponible: ${currentStock - cantidadEnCarrito}`
          );
          return;
        }
      }
    }

    updateQuantity(itemId, newQuantity);
  };

  // Helper function to validate product quantity limits
  const handleProductQuantityChange = (itemId: string, newQuantity: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.type !== 'product') {
      updateQuantity(itemId, newQuantity);
      return;
    }

    const producto = item.producto;

    // If quantity is 0, remove the item
    if (newQuantity === 0) {
      updateQuantity(itemId, newQuantity);
      return;
    }

    // Check stock availability (considering all cart items including combos)
    const currentStock = getCurrentStock(producto.id);
    const cantidadEnCarrito = getProductQuantityInCart(producto.id) - item.cantidad; // Exclude current item's quantity

    if (cantidadEnCarrito + newQuantity > currentStock) {
      toast.error(`Stock insuficiente. Solo quedan ${currentStock} unidades disponibles (${cantidadEnCarrito} ya en carrito)`);
      return;
    }

    updateQuantity(itemId, newQuantity);
  };

  // Helper function to validate promotion quantity limits
  const handlePromocionQuantityChange = (itemId: string, newQuantity: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.type !== 'promotion') {
      updateQuantity(itemId, newQuantity);
      return;
    }

    const promocion = item.promocion;
    const producto = item.producto;
    const limiteUsos = promocion.limite_usos_por_venta || 999;

    // If quantity is 0, remove the item
    if (newQuantity === 0) {
      updateQuantity(itemId, newQuantity);
      return;
    }

    // Check stock availability (considering all cart items including combos)
    const currentStock = getCurrentStock(producto.id);
    const cantidadEnCarrito = getProductQuantityInCart(producto.id) - item.cantidad; // Exclude current item's quantity

    if (cantidadEnCarrito + newQuantity > currentStock) {
      toast.error(`Stock insuficiente. Solo quedan ${currentStock} unidades disponibles (${cantidadEnCarrito} ya en carrito)`);
      return;
    }

    // Check cantidad_minima - promotion only active from cantidad_minima onwards
    if (newQuantity < promocion.cantidad_minima) {
      toast.error(`Esta promoción requiere mínimo ${promocion.cantidad_minima} unidades. Se eliminará del carrito si reduces más.`);
      return;
    }

    // Check cantidad_maxima if exists
    if (promocion.cantidad_maxima && newQuantity > promocion.cantidad_maxima) {
      toast.error(`Esta promoción permite máximo ${promocion.cantidad_maxima} unidades`);
      return;
    }

    // Check limite_usos_por_venta
    if (newQuantity > limiteUsos) {
      toast.error(`Esta promoción tiene un límite de ${limiteUsos} unidad(es) por venta`);
      return;
    }

    updateQuantity(itemId, newQuantity);
  };

  // Handlers
  const handleProductClick = (producto: Producto, promocion?: Promocion) => {
    if (!empleadoId) {
      toast.error('Por favor selecciona un empleado primero');
      return;
    }

    const currentStock = getCurrentStock(producto.id);

    if (currentStock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    // Check if product is already in cart (same product and same promotion status)
    const existingItem = items.find(item => {
      if (promocion) {
        return item.type === 'promotion' &&
               item.producto_id === producto.id &&
               item.promocion_id === promocion.id;
      } else {
        return item.type === 'product' && item.producto_id === producto.id;
      }
    });

    // Get current quantity
    const currentQuantity = existingItem ? existingItem.cantidad : 0;

    // Check total quantity in cart (including products inside combos)
    const cantidadEnCarrito = getProductQuantityInCart(producto.id);

    // Check promotion limits if it's a promotion
    if (promocion) {
      // Check global usage limit (total uses across all sales)
      if (promocion.limite_usos !== null && promocion.cantidad_usos >= promocion.limite_usos) {
        toast.error('Esta promoción ha alcanzado su límite de usos global');
        return;
      }

      const limiteUsos = promocion.limite_usos_por_venta || 999;

      if (currentQuantity >= limiteUsos) {
        toast.error(`Esta promoción tiene un límite de ${limiteUsos} unidad(es) por venta`);
        return;
      }

      // Check if we can add more within cantidad_maxima
      if (promocion.cantidad_maxima) {
        const newQuantity = currentQuantity + 1;
        if (newQuantity > promocion.cantidad_maxima) {
          toast.error(`Esta promoción permite máximo ${promocion.cantidad_maxima} unidades`);
          return;
        }
      }
    }

    // Check stock availability
    if (cantidadEnCarrito >= currentStock) {
      toast.error(`Stock insuficiente. Solo quedan ${currentStock} unidades (${cantidadEnCarrito} ya en carrito)`);
      return;
    }

    // If item exists, increase quantity instead of adding duplicate
    if (existingItem) {
      if (promocion) {
        handlePromocionQuantityChange(existingItem.id, existingItem.cantidad + 1);
      } else {
        handleProductQuantityChange(existingItem.id, existingItem.cantidad + 1);
      }
      toast.success(`Cantidad aumentada: ${producto.nombre}`);
    } else {
      // For promotions, add cantidad_minima units to activate the promotion
      const initialQuantity = promocion ? promocion.cantidad_minima : 1;

      // Check if we have enough stock for the initial quantity
      if (cantidadEnCarrito + initialQuantity > currentStock) {
        toast.error(`Stock insuficiente. Solo quedan ${currentStock} unidades (${cantidadEnCarrito} ya en carrito)`);
        return;
      }

      addProduct(producto, initialQuantity, isSelectedEmpleadoAdmin, promocion);
    if (promocion) {
        toast.success(`Promoción agregada: ${producto.nombre} (${initialQuantity} unidades)`);
    } else {
      toast.success(`Producto agregado: ${producto.nombre}`);
      }
    }
  };

  const handleComboClick = (combo: Combo) => {
    if (!empleadoId) {
      toast.error('Por favor selecciona un empleado primero');
      return;
    }

    // Check global usage limit (total uses across all sales)
    if (combo.limite_usos !== null && combo.cantidad_usos >= combo.limite_usos) {
      toast.error('Este combo ha alcanzado su límite de usos global');
      return;
    }

    // Validate stock for all products in the combo
    const comboProductos = (combo as any).combo_productos as Array<{
      cantidad: number;
      productos: { id: string; nombre: string } | null;
    }> | undefined;

    if (comboProductos) {
      for (const comboItem of comboProductos) {
        if (!comboItem.productos) continue;

        const productoId = comboItem.productos.id;
        const cantidadRequerida = comboItem.cantidad; // Quantity needed per combo
        const currentStock = getCurrentStock(productoId);
        const cantidadEnCarrito = getProductQuantityInCart(productoId);

        // Check if we have enough stock
        if (cantidadEnCarrito + cantidadRequerida > currentStock) {
          toast.error(
            `Stock insuficiente de "${comboItem.productos.nombre}". ` +
            `Requiere ${cantidadRequerida}, disponible: ${currentStock - cantidadEnCarrito}`
          );
          return;
        }
      }
    }

    // Check if combo is already in cart
    const existingItem = items.find(item =>
      item.type === 'combo' && item.combo_id === combo.id
    );

    // Get current quantity in cart
    const currentQuantity = existingItem ? existingItem.cantidad : 0;

    // Check limite_usos_por_venta
    const limiteUsos = combo.limite_usos_por_venta || 999;

    if (currentQuantity >= limiteUsos) {
      toast.error(`Este combo tiene un límite de ${limiteUsos} unidad(es) por venta`);
      return;
    }

    // If item exists, increase quantity instead of adding duplicate
    if (existingItem) {
      handleComboQuantityChange(existingItem.id, existingItem.cantidad + 1);
      toast.success(`Cantidad aumentada: ${combo.nombre}`);
    } else {
    addCombo(combo, 1);
    toast.success(`Combo agregado: ${combo.nombre}`);
    }
  };

  const handleConfirmSale = async () => {
    if (!isValid || !empleadoId || !user?.club?.id) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate exchange rates for multi-currency storage
      const exchangeRates = {
        ARS: 1,
        USD: 1, // These would come from a real exchange rate API
        BRL: 1,
      };

      // Process each cart item
      for (const item of items) {
        // Get the producto_id
        let producto_id: string;

        if (item.type === 'product' || item.type === 'promotion') {
          producto_id = item.producto_id;
        } else if (item.type === 'combo') {
          // For combos, we need to create a sale entry for each product in the combo
          // This is a simplified approach - you may want to handle this differently
          const comboProductos = (item.combo as any).combo_productos as Array<{
            cantidad: number;
            productos: { id: string; nombre: string } | null;
          }>;

          // Calculate total quantity of products in the combo
          const totalProductosEnCombo = comboProductos.reduce((sum, cp) => sum + (cp.cantidad || 0), 0);

          for (const comboItem of comboProductos) {
            if (!comboItem.productos) continue;

            // Calculate prices for combo products
            // Distribute the combo price proportionally based on product quantities
            const precioUnitarioPorProducto = item.precio_unitario / totalProductosEnCombo; // Price per unit product
            const comboItemSubtotal = precioUnitarioPorProducto * comboItem.cantidad * item.cantidad; // Subtotal for all combos
            const descuentoUnitarioPorProducto = item.descuento / totalProductosEnCombo; // Discount per unit product
            const comboItemDescuento = descuentoUnitarioPorProducto * comboItem.cantidad * item.cantidad; // Discount for all combos
            const comboItemTotal = comboItemSubtotal - comboItemDescuento; // Total for all combos

            // Calculate all currency values
            const precioUnitarioARS = moneda === 'ARS' ? precioUnitarioPorProducto : precioUnitarioPorProducto * exchangeRates.ARS;
            const subtotalARS = moneda === 'ARS' ? comboItemSubtotal : comboItemSubtotal * exchangeRates.ARS;
            const descuentoARS = moneda === 'ARS' ? comboItemDescuento : comboItemDescuento * exchangeRates.ARS;
            const totalARS = moneda === 'ARS' ? comboItemTotal : comboItemTotal * exchangeRates.ARS;

            const precioUnitarioUSD = moneda === 'USD' ? precioUnitarioPorProducto : precioUnitarioPorProducto * exchangeRates.USD;
            const subtotalUSD = moneda === 'USD' ? comboItemSubtotal : comboItemSubtotal * exchangeRates.USD;
            const descuentoUSD = moneda === 'USD' ? comboItemDescuento : comboItemDescuento * exchangeRates.USD;
            const totalUSD = moneda === 'USD' ? comboItemTotal : comboItemTotal * exchangeRates.USD;

            const precioUnitarioBRL = moneda === 'BRL' ? precioUnitarioPorProducto : precioUnitarioPorProducto * exchangeRates.BRL;
            const subtotalBRL = moneda === 'BRL' ? comboItemSubtotal : comboItemSubtotal * exchangeRates.BRL;
            const descuentoBRL = moneda === 'BRL' ? comboItemDescuento : comboItemDescuento * exchangeRates.BRL;
            const totalBRL = moneda === 'BRL' ? comboItemTotal : comboItemTotal * exchangeRates.BRL;

            const saleData = {
              club_id: user.club.id,
              producto_id: comboItem.productos.id,
              personal_id: empleadoId,
              cantidad: item.cantidad * comboItem.cantidad,
              precio_unitario: precioUnitarioPorProducto,
              subtotal: comboItemSubtotal,
              descuento: comboItemDescuento,
              total: comboItemTotal,
              moneda,
              precio_unitario_ars: precioUnitarioARS,
              subtotal_ars: subtotalARS,
              descuento_ars: descuentoARS,
              total_ars: totalARS,
              precio_unitario_usd: precioUnitarioUSD,
              subtotal_usd: subtotalUSD,
              descuento_usd: descuentoUSD,
              total_usd: totalUSD,
              precio_unitario_brl: precioUnitarioBRL,
              subtotal_brl: subtotalBRL,
              descuento_brl: descuentoBRL,
              total_brl: totalBRL,
              metodo_pago: metodoPago,
            };

            const { error: insertError } = await supabase.from('sale').insert(saleData as any);

            if (insertError) {
              throw new Error(`Error al guardar venta de combo: ${insertError.message}`);
            }

            // Stock is automatically decremented by the reduce_stock_after_sale trigger
          }

          // Update combo usage count if applicable
          if (item.combo.limite_usos !== null) {
            // First, get the current cantidad_usos from the database
            const { data: currentCombo, error: selectError } = await supabase
              .from('combos')
              .select('cantidad_usos')
              .eq('id', item.combo_id)
              .single();

            if (selectError) {
              console.error('Error fetching current combo usage:', selectError);
            } else if (currentCombo) {
              // Increment cantidad_usos by 1 (one sale), not by item.cantidad
              // cantidad_usos tracks number of sales, not number of units sold
              const { error: comboError } = await (supabase
                .from('combos') as any)
                .update({ cantidad_usos: (currentCombo as any).cantidad_usos + 1 })
                .eq('id', item.combo_id);

              if (comboError) {
                console.error('Error updating combo usage:', comboError);
              }
            }
          }

          continue; // Skip to next item
        } else {
          throw new Error('Tipo de item desconocido');
        }

        // Calculate all currency values (for products and promotions)
        const precioUnitarioARS = moneda === 'ARS' ? item.precio_unitario : item.precio_unitario * exchangeRates.ARS;
        const subtotalARS = moneda === 'ARS' ? item.subtotal : item.subtotal * exchangeRates.ARS;
        const precioUnitarioUSD = moneda === 'USD' ? item.precio_unitario : item.precio_unitario * exchangeRates.USD;
        const subtotalUSD = moneda === 'USD' ? item.subtotal : item.subtotal * exchangeRates.USD;
        const precioUnitarioBRL = moneda === 'BRL' ? item.precio_unitario : item.precio_unitario * exchangeRates.BRL;
        const subtotalBRL = moneda === 'BRL' ? item.subtotal : item.subtotal * exchangeRates.BRL;

        // Apply additional discount proportionally if exists
        let finalTotal = item.total;
        let finalDescuento = item.descuento;

        if (descuentoAdicional > 0) {
          const proportion = item.total / total;
          const itemDescuentoAdicional = descuentoAdicional * proportion;
          finalTotal = item.total - itemDescuentoAdicional;
          finalDescuento = item.descuento + itemDescuentoAdicional;
        }

        // Recalculate currency values with additional discount
        const finalTotalARS = moneda === 'ARS' ? finalTotal : finalTotal * exchangeRates.ARS;
        const finalDescuentoARS = moneda === 'ARS' ? finalDescuento : finalDescuento * exchangeRates.ARS;

        const finalTotalUSD = moneda === 'USD' ? finalTotal : finalTotal * exchangeRates.USD;
        const finalDescuentoUSD = moneda === 'USD' ? finalDescuento : finalDescuento * exchangeRates.USD;

        const finalTotalBRL = moneda === 'BRL' ? finalTotal : finalTotal * exchangeRates.BRL;
        const finalDescuentoBRL = moneda === 'BRL' ? finalDescuento : finalDescuento * exchangeRates.BRL;

        const saleData = {
          club_id: user.club.id,
          producto_id,
          personal_id: empleadoId,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
          descuento: finalDescuento,
          total: finalTotal,
          moneda,
          precio_unitario_ars: precioUnitarioARS,
          subtotal_ars: subtotalARS,
          descuento_ars: finalDescuentoARS,
          total_ars: finalTotalARS,
          precio_unitario_usd: precioUnitarioUSD,
          subtotal_usd: subtotalUSD,
          descuento_usd: finalDescuentoUSD,
          total_usd: finalTotalUSD,
          precio_unitario_brl: precioUnitarioBRL,
          subtotal_brl: subtotalBRL,
          descuento_brl: finalDescuentoBRL,
          total_brl: finalTotalBRL,
          metodo_pago: metodoPago,
        };

        const { error: insertError } = await supabase.from('sale').insert(saleData as any);

        if (insertError) {
          throw new Error(`Error al guardar venta: ${insertError.message}`);
        }

        // Stock is automatically decremented by the reduce_stock_after_sale trigger

        // Update promotion usage (always, for statistics tracking)
        if (item.type === 'promotion') {
          console.log('🔵 Updating promotion usage for:', item.promocion_id);

          // First, get the current cantidad_usos and limite_usos from the database
          const { data: currentPromo, error: selectError } = await supabase
            .from('promociones')
            .select('cantidad_usos, limite_usos')
            .eq('id', item.promocion_id)
            .single();

          if (selectError) {
            console.error('❌ Error fetching current promotion usage:', selectError);
          } else if (currentPromo) {
            // Increment cantidad_usos by 1 (one sale), not by item.cantidad
            // cantidad_usos tracks number of sales, not number of units sold
            const newCantidadUsos = (currentPromo as any).cantidad_usos + 1;
            console.log('📊 Promotion stats:');
            console.log('  - Current cantidad_usos:', (currentPromo as any).cantidad_usos);
            console.log('  - limite_usos:', (currentPromo as any).limite_usos);
            console.log('  - Adding: 1 (one sale)');
            console.log('  - New cantidad_usos:', newCantidadUsos);

            // Check if update will violate constraint
            if ((currentPromo as any).limite_usos !== null && newCantidadUsos > (currentPromo as any).limite_usos) {
              console.error('❌ UPDATE WILL VIOLATE CONSTRAINT: new cantidad_usos (' + newCantidadUsos + ') > limite_usos (' + (currentPromo as any).limite_usos + ')');
            }

            // Now update with the current value from database
            const { data: updateData, error: promoError } = await (supabase
              .from('promociones') as any)
              .update({ cantidad_usos: newCantidadUsos })
              .eq('id', item.promocion_id)
              .select();

            if (promoError) {
              console.error('❌ Error updating promotion usage:');
              console.error('  - Code:', promoError.code);
              console.error('  - Message:', promoError.message);
              console.error('  - Details:', promoError.details);
              console.error('  - Hint:', promoError.hint);
              console.error('  - Full error:', promoError);
            } else {
              console.log('✅ Promotion usage updated successfully:', updateData);
            }
          } else {
            console.error('❌ No promotion data returned');
          }
        }
      }

      toast.success('Venta realizada con éxito');
      clearCart();
      onSaleCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error(error instanceof Error ? error.message : 'Error al realizar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemName = (item: CartItem): string => {
    switch (item.type) {
      case 'product':
      case 'promotion':
        return item.producto.nombre;
      case 'combo':
        return item.combo.nombre;
    }
  };

  const getItemImage = (item: CartItem): string | null | undefined => {
    switch (item.type) {
      case 'product':
        return item.producto.imagen_url;
      case 'promotion':
        return item.promocion.imagen_url || item.producto.imagen_url;
      case 'combo':
        return item.combo.imagen_url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] !h-[95vh] !min-h-[95vh] p-0 flex flex-col sm:!max-w-[95vw] md:!max-w-[95vw] lg:!max-w-[95vw]">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle>Nueva Venta</DialogTitle>
          <DialogDescription>
            Selecciona el empleado, método de pago y agrega productos al carrito
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-4 p-4 pt-3 overflow-hidden min-h-0">
          {/* Left side - Employee, Payment, and Products */}
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* Employee, Payment Method and Currency - ALL IN ONE ROW */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {/* Employee Selector */}
              <div className="space-y-2">
                <Label htmlFor="empleado-select" className="flex items-center gap-2 text-base font-semibold">
                  <UserCircle className="h-5 w-5" />
                  Empleado
                </Label>
                <select
                  id="empleado-select"
                  value={empleadoId || ''}
                  onChange={(e) => setEmpleado(e.target.value || null)}
                disabled={isSubmitting}
                  className="flex h-11 w-full items-center justify-between rounded-md border-2 border-input bg-background px-3 py-2 text-base font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                >
                  <option value="">Seleccionar</option>
                  {currentUser && (
                    <option value={currentUser.id}>
                      {currentUser.nombre} {currentUser.apellido} (Yo)
                    </option>
                  )}
                  {bartenders
                    .filter((emp) => emp.user_id !== user?.id)
                    .map((empleado) => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.nombre} {empleado.apellido}
                      </option>
                    ))}
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="metodo-pago-select" className="flex items-center gap-2 text-base font-semibold">
                  <CreditCard className="h-5 w-5" />
                  Método de pago
                </Label>
                <select
                  id="metodo-pago-select"
                  value={metodoPago}
                  onChange={(e) => changeMetodoPago(e.target.value as MetodoPago)}
                disabled={isSubmitting || !empleadoId}
                  className="flex h-11 w-full items-center justify-between rounded-md border-2 border-input bg-background px-3 py-2 text-base font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                  <option value="billetera_virtual">📱 Billetera</option>
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="moneda-select" className="flex items-center gap-2 text-base font-semibold">
                  <Coins className="h-5 w-5" />
                  Moneda
                </Label>
                <select
                  id="moneda-select"
                  value={moneda}
                  onChange={(e) => changeCurrency(e.target.value as CurrencyCode)}
                  disabled={isSubmitting || !empleadoId || !canChangeCurrency}
                  className="flex h-11 w-full items-center justify-between rounded-md border-2 border-input bg-background px-3 py-2 text-base font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                >
                  {Object.values(CURRENCIES).map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-hidden">
              {empleadoId ? (
                <div className="h-full flex flex-col gap-2">
                  {/* View Mode Selector and Search in one row */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                      <TabsList className="h-12 p-1">
                        <TabsTrigger value="products" className="text-base font-semibold px-5 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          <Package className="h-5 w-5 mr-2" />
                          Productos
                        </TabsTrigger>
                        <TabsTrigger value="promotions" className="text-base font-semibold px-5 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          <Tag className="h-5 w-5 mr-2" />
                          Promociones
                        </TabsTrigger>
                        <TabsTrigger value="combos" className="text-base font-semibold px-5 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          <TrendingUp className="h-5 w-5 mr-2" />
                          Combos
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 text-base font-medium border-2"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  {(viewMode === 'products' || viewMode === 'promotions') && (
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="h-9 text-base font-semibold px-3"
                        onClick={() => setSelectedCategory('all')}
                      >
                        Todas
                      </Button>
                      {CATEGORIES.map((category) => (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? 'default' : 'outline'}
                          size="sm"
                          className="h-9 text-base font-semibold px-3"
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Products/Promotions/Combos Grid */}
                  <ScrollArea className="flex-1">
                    {viewMode === 'products' && (
                      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 p-1">
                        {filteredProductos.map((producto) => {
                          const precio = getProductPrice(producto);
                          const precioCompra = isSelectedEmpleadoAdmin
                            ? moneda === 'ARS'
                              ? producto.precio_compra_ars
                              : moneda === 'USD'
                              ? producto.precio_compra_usd
                              : producto.precio_compra_brl
                            : undefined;

                          // Calculate stock considering items in cart (including combos)
                          const currentStock = getCurrentStock(producto.id);
                          const cantidadEnCarrito = getProductQuantityInCart(producto.id);
                          const stockDisponible = currentStock - cantidadEnCarrito;

                          return (
                            <ProductCard
                              key={producto.id}
                              nombre={producto.nombre}
                              categoria={producto.categoria}
                              precio={precio}
                              precioCompra={precioCompra}
                              stock={stockDisponible}
                              imagen_url={producto.imagen_url}
                              moneda={moneda}
                              onClick={() => handleProductClick(producto)}
                            />
                          );
                        })}
                      </div>
                    )}

                    {viewMode === 'promotions' && (
                      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 p-1">
                        {filteredPromociones.map((promocion) => {
                          const producto = productos.find((p) => p.id === promocion.producto_id);
                          if (!producto) return null;

                          const prices = getPromotionPrice(promocion);

                          // Calculate stock considering items in cart (including combos)
                          const currentStock = getCurrentStock(producto.id);
                          const cantidadEnCarrito = getProductQuantityInCart(producto.id);
                          const stockDisponible = currentStock - cantidadEnCarrito;

                          return (
                            <ProductCard
                              key={promocion.id}
                              nombre={producto.nombre}
                              categoria={producto.categoria}
                              precio={prices.promo}
                              precioAnterior={prices.real}
                              stock={stockDisponible}
                              imagen_url={promocion.imagen_url || producto.imagen_url}
                              moneda={moneda}
                              type="promotion"
                              isPromotion
                              limiteUsosPorVenta={promocion.limite_usos_por_venta}
                              cantidadMinima={promocion.cantidad_minima}
                              cantidadMaxima={promocion.cantidad_maxima}
                              onClick={() => handleProductClick(producto, promocion)}
                            />
                          );
                        })}
                      </div>
                    )}

                    {viewMode === 'combos' && (
                      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 p-1">
                        {filteredCombos.map((combo) => {
                          const precio = getComboPrice(combo);
                          const precioARS = combo.precio_combo_ars || combo.precio_combo;

                          return (
                            <ComboCard
                              key={combo.id}
                              nombre={combo.nombre}
                              precio={precio}
                              precioARS={precioARS}
                              imagen_url={combo.imagen_url}
                  moneda={moneda}
                              productos={(combo as any).combo_productos || []}
                              limiteUsosPorVenta={combo.limite_usos_por_venta}
                              onClick={() => handleComboClick(combo)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Selecciona un empleado para habilitar los productos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Shopping Cart */}
          <div className="w-[350px] flex flex-col overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CartIcon className="h-4 w-4" />
                  Carrito ({items.length})
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-3 pt-0">
                {items.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <CartIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Carrito vacío</p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-2">
                      {items.map((item) => {
                        const imagenUrl = getItemImage(item);
                        return (
                        <div key={item.id} className="border rounded-md p-3 bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex gap-3">
                            {/* Product Image */}
                            <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                              {imagenUrl ? (
                                <img
                                  src={imagenUrl}
                                  alt={getItemName(item)}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              {/* Header: name + badge */}
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <p className="font-bold text-base truncate flex-1">{getItemName(item)}</p>
                                <div className="flex items-center gap-1">
                              {item.type === 'promotion' && (
                                <>
                                  <Badge variant="destructive" className="text-[10px] h-5 px-2">Promo</Badge>
                                  {(() => {
                                    const promocion = item.promocion;
                                    const maxPermitido = Math.min(
                                      promocion.cantidad_maxima || 999,
                                      promocion.limite_usos_por_venta || 999
                                    );
                                    const restantes = maxPermitido - item.cantidad;
                                    
                                    // Show range badge
                                    if (promocion.cantidad_minima > 1 || promocion.cantidad_maxima) {
                                      return (
                                        <Badge variant="outline" className="text-[9px] h-5 px-1.5">
                                          {promocion.cantidad_minima}-{promocion.cantidad_maxima || maxPermitido}
                                        </Badge>
                                      );
                                    }
                                    
                                    // Show remaining badge if close to limit
                                    if (maxPermitido < 999 && restantes <= 2) {
                                      return (
                                        <Badge 
                                          variant={restantes === 0 ? "destructive" : "outline"} 
                                          className="text-[9px] h-5 px-1.5"
                                        >
                                          {restantes === 0 ? "Límite" : `+${restantes} máx`}
                                        </Badge>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              )}
                              {item.type === 'combo' && (
                                <>
                                  <Badge variant="secondary" className="text-[10px] h-5 px-2">Combo</Badge>
                                  {(() => {
                                    const limite = item.combo.limite_usos_por_venta || 999;
                                    const restantes = limite - item.cantidad;
                                    if (limite < 999 && restantes <= 2) {
                                      return (
                                        <Badge 
                                          variant={restantes === 0 ? "destructive" : "outline"} 
                                          className="text-[9px] h-5 px-1.5"
                                        >
                                          {restantes === 0 ? "Límite" : `+${restantes} máx`}
                                        </Badge>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Combo Products List */}
                          {item.type === 'combo' && (item.combo as any).combo_productos && (
                            <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-800">
                              <p className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold mb-1.5 flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Incluye:
                              </p>
                              <div className="space-y-1">
                                {((item.combo as any).combo_productos as Array<{
                                  cantidad: number;
                                  productos: { nombre: string; categoria: string } | null;
                                }>).map((comboItem, idx) => (
                                  comboItem.productos && (
                                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                      <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded text-[10px]">
                                        {comboItem.cantidad}x
                                      </span>
                                      <span className="text-foreground font-medium truncate">
                                        {comboItem.productos.nombre}
                                      </span>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Prices */}
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Precio Unit:</span>
                            <span className="font-semibold">{formatCurrency(item.precio_unitario, moneda)}</span>
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  if (item.type === 'combo') {
                                    handleComboQuantityChange(item.id, item.cantidad - 1);
                                  } else if (item.type === 'promotion') {
                                    handlePromocionQuantityChange(item.id, item.cantidad - 1);
                                  } else if (item.type === 'product') {
                                    handleProductQuantityChange(item.id, item.cantidad - 1);
                                  }
                                }}
                              >
                                <Minus className="h-5 w-5" />
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                value={item.cantidad}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  if (item.type === 'combo') {
                                    handleComboQuantityChange(item.id, value);
                                  } else if (item.type === 'promotion') {
                                    handlePromocionQuantityChange(item.id, value);
                                  } else if (item.type === 'product') {
                                    handleProductQuantityChange(item.id, value);
                                  }
                                }}
                                className="h-10 w-16 text-center text-lg p-1 font-bold"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  if (item.type === 'combo') {
                                    handleComboQuantityChange(item.id, item.cantidad + 1);
                                  } else if (item.type === 'promotion') {
                                    handlePromocionQuantityChange(item.id, item.cantidad + 1);
                                  } else if (item.type === 'product') {
                                    handleProductQuantityChange(item.id, item.cantidad + 1);
                                  }
                                }}
                              >
                                <Plus className="h-5 w-5" />
                              </Button>
                            </div>

                            {/* Total + Delete */}
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground font-medium">Total</p>
                                <p className="text-xl font-bold text-[#00ff41]">
                                  {formatCurrency(item.total, moneda)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-destructive hover:bg-destructive/10"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>

              {items.length > 0 && (
                <CardFooter className="flex-col gap-3 border-t p-3">
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground font-semibold">Subtotal:</span>
                      <span className="font-bold">{formatCurrency(subtotal, moneda)}</span>
                    </div>
                    
                    {/* Descuento Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="descuento-adicional" className="text-sm font-medium">
                          Descuento adicional
                        </Label>
                        {descuentoAdicional > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={handleRemoverDescuento}
                          >
                            Quitar
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex gap-1 flex-1">
                          <Input
                            id="descuento-adicional"
                            type="number"
                            min="0"
                            step="0.01"
                            value={descuentoInput}
                            onChange={(e) => setDescuentoInput(e.target.value)}
                            placeholder={tipoDescuento === 'porcentaje' ? '%' : 'Monto'}
                            className="h-9 text-sm flex-1"
                            disabled={isSubmitting}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAplicarDescuento();
                              }
                            }}
                          />
                          <select
                            value={tipoDescuento}
                            onChange={(e) => setTipoDescuento(e.target.value as 'porcentaje' | 'monto')}
                            className="h-9 text-sm border rounded-md px-2"
                            disabled={isSubmitting}
                          >
                            <option value="porcentaje">%</option>
                            <option value="monto">{moneda}</option>
                          </select>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 text-sm"
                          onClick={handleAplicarDescuento}
                          disabled={isSubmitting || !descuentoInput}
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>

                    {descuentoTotal > 0 && (
                      <div className="flex justify-between text-base text-green-600">
                        <span className="font-semibold">Desc. promos:</span>
                        <span className="font-bold">-{formatCurrency(descuentoTotal, moneda)}</span>
                      </div>
                    )}

                    {descuentoAdicional > 0 && (
                      <div className="flex justify-between text-base text-green-600">
                        <span className="font-semibold">Desc. adicional:</span>
                        <span className="font-bold">-{formatCurrency(descuentoAdicional, moneda)}</span>
                      </div>
                    )}
                    
                    <Separator />

                    <div className="flex justify-between text-3xl font-bold">
                      <span>Total:</span>
                      <span className="text-[#00ff41]">{formatCurrency(totalConDescuentoAdicional, moneda)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-10 text-base"
                    onClick={handleConfirmSale}
                    disabled={!isValid || isSubmitting}
                  >
                    {isSubmitting ? 'Procesando...' : 'Confirmar Venta'}
                  </Button>
                  {!isValid && (
                    <p className="text-sm text-muted-foreground text-center">
                      Selecciona un empleado para continuar
                    </p>
                  )}
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


