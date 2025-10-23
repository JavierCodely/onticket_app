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
import { createSaleWithItems } from '@/utils/createSaleWithItems';
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
import type { Producto, Promocion, ComboWithProducts, Personal, MetodoPago, CategoriaProducto } from '@/types/database';
import type { CurrencyCode } from '@/types/currency';
import type { CartItem } from '@/types/ventas';
import { CURRENCIES } from '@/types/currency';

interface NewSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  promociones: Promocion[];
  combos: ComboWithProducts[];
  empleados: Personal[];
  onSaleCreated: () => void;
  editingSale?: any | null;
  onDeleteSale?: (saleId: string) => Promise<void>;
  autoSelectCurrentUser?: boolean;
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
  editingSale = null,
  onDeleteSale,
  autoSelectCurrentUser = false,
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
  const [montoTransferencia, setMontoTransferencia] = useState<number>(0);
  const [montoTransferenciaInput, setMontoTransferenciaInput] = useState<string>('');
  const [montoTransferenciaError, setMontoTransferenciaError] = useState<string>('');
  const [realtimeStock, setRealtimeStock] = useState<Map<string, number>>(new Map());

  // Get the selected employee's role to determine pricing
  const selectedEmpleado = empleados.find(emp => emp.id === empleadoId);
  const isSelectedEmpleadoAdmin = selectedEmpleado?.rol === 'Admin';

  // Reset when dialog opens OR load editing sale
  useEffect(() => {
    if (open) {
      // Initialize realtime stock
      const stockMap = new Map<string, number>();
      productos.forEach(p => stockMap.set(p.id, p.stock));
      setRealtimeStock(stockMap);

      if (editingSale && editingSale.sale_items) {
        // EDITING MODE: Pre-load the sale data
        setEmpleado(editingSale.personal_id || null);
        changeMetodoPago(editingSale.metodo_pago || 'efectivo');
        changeCurrency(editingSale.moneda || 'ARS');

        // Load mixed payment amounts if método is 'mixto'
        if (editingSale.metodo_pago === 'mixto') {
          const montoTransf = editingSale.monto_transferencia || 0;
          setMontoTransferencia(montoTransf);
          setMontoTransferenciaInput(montoTransf.toString());
          setMontoTransferenciaError('');
        }

        // Pre-load cart items from the sale FIRST
        clearCart();

        // Calculate the total discount from items BEFORE adding them to cart
        // This includes discounts from combos and promotions
        let descuentoTotalFromItems = 0;
        const combosContados = new Set<string>();

        for (const saleItem of editingSale.sale_items) {
          if (saleItem.item_type === 'combo' && saleItem.combo_id) {
            if (!combosContados.has(saleItem.combo_id)) {
              // For combos, sum all sale_items with the same combo_id
              const comboItems = editingSale.sale_items.filter(
                (si: any) => si.item_type === 'combo' && si.combo_id === saleItem.combo_id
              );
              const descuentoCombo = comboItems.reduce((sum: number, ci: any) => sum + (ci.descuento || 0), 0);
              descuentoTotalFromItems += descuentoCombo;
              combosContados.add(saleItem.combo_id);
            }
          } else {
            descuentoTotalFromItems += saleItem.descuento || 0;
          }
        }

        // Calculate additional discount
        const descuentoTotalEnVenta = editingSale.descuento || 0;
        const descuentoAdicionalCalculado = Math.max(0, descuentoTotalEnVenta - descuentoTotalFromItems);
        setDescuentoAdicional(descuentoAdicionalCalculado);

        // Track which combos we've already added (to avoid duplicates)
        const combosAgregados = new Set<string>();

        for (const saleItem of editingSale.sale_items) {
          if (saleItem.item_type === 'product') {
            const producto = productos.find(p => p.id === saleItem.producto_id);
            if (producto) {
              addProduct(producto, saleItem.cantidad, false);
            }
          } else if (saleItem.item_type === 'promotion' && saleItem.promocion_id) {
            // Find the promotion and product
            const promocion = promociones.find(p => p.id === saleItem.promocion_id);
            const producto = productos.find(p => p.id === saleItem.producto_id);

            if (promocion && producto) {
              // Add as promotion (not regular product)
              addProduct(producto, saleItem.cantidad, false, promocion);
            } else if (!promocion && producto) {
              // If promotion no longer exists, add as regular product
              console.warn('Promotion not found, adding as regular product:', saleItem.promocion_id);
              addProduct(producto, saleItem.cantidad, false);
            }
          } else if (saleItem.item_type === 'combo' && saleItem.combo_id) {
            // For combos, each combo creates MULTIPLE sale_items (one per product)
            // So we need to only add each combo ONCE
            if (combosAgregados.has(saleItem.combo_id)) {
              continue; // Skip if we already added this combo
            }

            const combo = combos.find(c => c.id === saleItem.combo_id);
            if (combo) {
              // Find all sale_items for this combo to calculate how many combos were sold
              const comboItems = editingSale.sale_items.filter(
                (si: any) => si.item_type === 'combo' && si.combo_id === saleItem.combo_id
              );

              // Get the combo structure to know how many products per combo
              const comboProductos = (combo as any).combo_productos as Array<{
                cantidad: number;
                productos: { id: string } | null;
              }> | undefined;

              if (comboProductos && comboProductos.length > 0) {
                // Find the first product in the combo to calculate combo quantity
                const firstComboProduct = comboProductos.find(cp => cp.productos);
                if (firstComboProduct && firstComboProduct.productos) {
                  const firstProductSaleItem = comboItems.find(
                    (ci: any) => ci.producto_id === firstComboProduct.productos!.id
                  );

                  if (firstProductSaleItem) {
                    // Calculate how many combos: total cantidad / cantidad per combo
                    const cantidadCombos = Math.round(
                      firstProductSaleItem.cantidad / firstComboProduct.cantidad
                    );

                    addCombo(combo, cantidadCombos);
                    combosAgregados.add(saleItem.combo_id);
                  }
                }
              }
            }
          }
        }
      } else {
        // NEW SALE MODE: Reset everything
        clearCart();

        // Auto-select current user if autoSelectCurrentUser is true
        if (autoSelectCurrentUser && user?.id) {
          const currentEmpleado = empleados.find(emp => emp.user_id === user.id);
          if (currentEmpleado) {
            setEmpleado(currentEmpleado.id);
          } else {
            setEmpleado(null);
          }
        } else {
          setEmpleado(null);
        }

        setSearchQuery('');
        setSelectedCategory('all');
        setViewMode('products');
        setDescuentoAdicional(0);
        setDescuentoInput('');
        setTipoDescuento('porcentaje');
        setMontoTransferencia(0);
        setMontoTransferenciaInput('');
        setMontoTransferenciaError('');
      }
    }
  }, [open, clearCart, setEmpleado, productos, promociones, combos, editingSale, addProduct, addCombo, changeMetodoPago, changeCurrency, autoSelectCurrentUser, user, empleados]);

  // Clear cart when employee changes (to recalculate prices based on new employee's role)
  // Skip this behavior when editing a sale
  useEffect(() => {
    // Don't clear cart when in editing mode
    if (editingSale) return;

    // Only clear cart if there are items AND an employee was previously selected
    // This prevents clearing on initial selection
    if (items.length > 0 && empleadoId) {
      clearCart();
      toast.info('Carrito vaciado. Los precios dependen del rol del empleado seleccionado.');
    }
  }, [empleadoId, editingSale]);

  // Reset monto transferencia when payment method changes away from 'mixto'
  useEffect(() => {
    if (metodoPago !== 'mixto') {
      setMontoTransferencia(0);
      setMontoTransferenciaInput('');
      setMontoTransferenciaError('');
    }
  }, [metodoPago]);

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

  // Calculate monto efectivo for mixed payment
  const montoEfectivo = useMemo(() => {
    if (metodoPago !== 'mixto') return 0;
    return Math.max(0, totalConDescuentoAdicional - montoTransferencia);
  }, [metodoPago, totalConDescuentoAdicional, montoTransferencia]);

  // When total changes, validate if montoTransferencia exceeds new total
  useEffect(() => {
    if (metodoPago === 'mixto' && montoTransferencia > 0) {
      if (montoTransferencia > totalConDescuentoAdicional) {
        // Adjust to new total automatically
        setMontoTransferencia(totalConDescuentoAdicional);
        setMontoTransferenciaInput(totalConDescuentoAdicional.toFixed(2));
        toast.info(`El monto de transferencia fue ajustado al nuevo total: ${formatCurrency(totalConDescuentoAdicional, moneda)}`);
      }
    }
  }, [totalConDescuentoAdicional, metodoPago, montoTransferencia, moneda]);

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

  const getComboPrice = (combo: ComboWithProducts): number => {
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

    // Note: limite_usos_por_venta limits how many LINES/ENTRIES of this promotion
    // can be added to a sale, NOT the quantity within each line. That validation
    // is done in handleProductClick when adding new lines.

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

    // Check total quantity in cart (including products inside combos)
    const cantidadEnCarrito = getProductQuantityInCart(producto.id);

    // Check promotion limits if it's a promotion
    if (promocion) {
      // Check global usage limit (total uses across all sales)
      if (promocion.limite_usos !== null && promocion.cantidad_usos >= promocion.limite_usos) {
        toast.error('Esta promoción ha alcanzado su límite de usos global');
        return;
      }

      // COUNT HOW MANY LINES of this promotion are in the cart
      const lineasDePromocion = items.filter(item =>
        item.type === 'promotion' &&
        item.producto_id === producto.id &&
        item.promocion_id === promocion.id
      ).length;

      const limiteLineas = promocion.limite_usos_por_venta || 999;

      if (lineasDePromocion >= limiteLineas) {
        toast.error(`Esta promoción tiene un límite de ${limiteLineas} entrada(s) por venta. Ya has agregado ${lineasDePromocion}.`);
        return;
      }

      // Calculate initial quantity for this NEW line
      const stockDisponible = currentStock - cantidadEnCarrito;

      // ALWAYS start with cantidad_minima (user can increase manually to cantidad_maxima)
      let initialQuantity = promocion.cantidad_minima;

      // Final validation: cannot exceed stock
      if (initialQuantity > stockDisponible) {
        initialQuantity = stockDisponible;
      }

      // Cannot be less than cantidad_minima
      if (initialQuantity < promocion.cantidad_minima) {
        toast.error(`Stock insuficiente. Esta promoción requiere mínimo ${promocion.cantidad_minima} unidades`);
        return;
      }

      // Check if we have enough stock for the initial quantity
      if (cantidadEnCarrito + initialQuantity > currentStock) {
        toast.error(`Stock insuficiente. Solo quedan ${currentStock} unidades (${cantidadEnCarrito} ya en carrito)`);
        return;
      }

      addProduct(producto, initialQuantity, isSelectedEmpleadoAdmin, promocion);
      toast.success(`Promoción agregada: ${producto.nombre} (${initialQuantity} unidades) - Línea ${lineasDePromocion + 1} de ${limiteLineas}`);
    } else {
      // For regular products, check if already exists and increase quantity
      const existingItem = items.find(item =>
        item.type === 'product' && item.producto_id === producto.id
      );

      // Check stock availability
      if (cantidadEnCarrito >= currentStock) {
        toast.error(`Stock insuficiente. Solo quedan ${currentStock} unidades (${cantidadEnCarrito} ya en carrito)`);
        return;
      }

      if (existingItem) {
        handleProductQuantityChange(existingItem.id, existingItem.cantidad + 1);
        toast.success(`Cantidad aumentada: ${producto.nombre}`);
      } else {
        addProduct(producto, 1, isSelectedEmpleadoAdmin);
        toast.success(`Producto agregado: ${producto.nombre}`);
      }
    }
  };

  const handleComboClick = (combo: ComboWithProducts) => {
    if (!empleadoId) {
      toast.error('Por favor selecciona un empleado primero');
      return;
    }

    // Check global usage limit (total uses across all sales)
    if (combo.limite_usos !== null && combo.cantidad_usos >= combo.limite_usos) {
      toast.error('Este combo ha alcanzado su límite de usos global');
      return;
    }

    // COUNT HOW MANY LINES of this combo are in the cart
    const lineasDeCombo = items.filter(item =>
      item.type === 'combo' && item.combo_id === combo.id
    ).length;

    const limiteLineas = combo.limite_usos_por_venta || 999;

    if (lineasDeCombo >= limiteLineas) {
      toast.error(`Este combo tiene un límite de ${limiteLineas} entrada(s) por venta. Ya has agregado ${lineasDeCombo}.`);
      return;
    }

    // Validate stock for all products in the combo
    const comboProductos = combo.combo_productos;

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

    // Always add as NEW line (don't merge with existing)
    addCombo(combo, 1);
    toast.success(`Combo agregado: ${combo.nombre} - Línea ${lineasDeCombo + 1} de ${limiteLineas}`);
  };

  const handleConfirmSale = async () => {
    if (!isValid || !empleadoId || !user?.club?.id) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Validate mixed payment
    if (metodoPago === 'mixto') {
      if (montoTransferenciaError) {
        toast.error('Corrige el error en el monto de transferencia antes de continuar');
        return;
      }

      if (montoTransferencia === 0) {
        toast.error('Debes ingresar un monto de transferencia mayor a 0 para el método de pago mixto');
        return;
      }

      const suma = montoEfectivo + montoTransferencia;
      const diferencia = Math.abs(suma - totalConDescuentoAdicional);

      console.log('🔍 DEBUG Mixed Payment:', {
        montoEfectivo,
        montoTransferencia,
        suma,
        totalConDescuentoAdicional,
        diferencia,
      });

      // Allow small rounding differences (0.01)
      if (diferencia > 0.01) {
        toast.error(
          `La suma de efectivo (${formatCurrency(montoEfectivo, moneda)}) + transferencia (${formatCurrency(montoTransferencia, moneda)}) debe ser igual al total (${formatCurrency(totalConDescuentoAdicional, moneda)})`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // If editing, delete the old sale first (this will restore stock)
      if (editingSale && onDeleteSale) {
        await onDeleteSale(editingSale.id);
      }

      // Create the new/updated sale
      console.log('🔍 DEBUG Before calling createSaleWithItems:', {
        metodoPago,
        montoEfectivo: metodoPago === 'mixto' ? montoEfectivo : 0,
        montoTransferencia: metodoPago === 'mixto' ? montoTransferencia : 0,
        totalConDescuentoAdicional,
      });

      await createSaleWithItems({
        clubId: user.club.id,
        personalId: empleadoId,
        items,
        subtotal,
        descuentoTotal,
        descuentoAdicional,
        total,
        totalConDescuentoAdicional,
        moneda,
        metodoPago,
        montoEfectivo: metodoPago === 'mixto' ? montoEfectivo : 0,
        montoTransferencia: metodoPago === 'mixto' ? montoTransferencia : 0,
      });

      toast.success(editingSale ? 'Venta actualizada con éxito' : 'Venta realizada con éxito');
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
      <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[98vh] !min-h-[98vh] p-0 flex flex-col">
        <DialogHeader className="p-4 md:p-6 pb-0 shrink-0">
          <DialogTitle className="text-2xl md:text-3xl">{editingSale ? 'Editar Venta' : 'Nueva Venta'}</DialogTitle>
          <DialogDescription className="text-base md:text-lg">
            {editingSale
              ? 'Modifica los productos, cantidades o detalles de la venta'
              : 'Selecciona el empleado, método de pago y agrega productos al carrito'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-3 md:gap-4 p-3 md:p-4 pt-2 md:pt-3 overflow-hidden min-h-0">
          {/* Left side - Employee, Payment, and Products */}
          <div className="flex-1 flex flex-col gap-2 md:gap-3 overflow-hidden">
            {/* Employee, Payment Method and Currency - ALL IN ONE ROW */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 shrink-0">
              {/* Employee Selector */}
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="empleado-select" className="flex items-center gap-1.5 md:gap-2 text-lg md:text-xl font-semibold">
                  <UserCircle className="h-5 w-5 md:h-6 md:w-6" />
                  Empleado
                </Label>
                <select
                  id="empleado-select"
                  value={empleadoId || ''}
                  onChange={(e) => setEmpleado(e.target.value || null)}
                disabled={isSubmitting}
                  className="flex h-12 md:h-14 w-full items-center justify-between rounded-md border-2 border-input bg-background px-3 py-2 text-lg md:text-xl font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
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
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="metodo-pago-select" className="flex items-center gap-1.5 md:gap-2 text-lg md:text-xl font-semibold">
                  <CreditCard className="h-5 w-5 md:h-6 md:w-6" />
                  Método de pago
                </Label>
                <select
                  id="metodo-pago-select"
                  value={metodoPago}
                  onChange={(e) => changeMetodoPago(e.target.value as MetodoPago)}
                disabled={isSubmitting || !empleadoId}
                  className="flex h-12 md:h-14 w-full items-center justify-between rounded-md border-2 border-input bg-background px-3 py-2 text-lg md:text-xl font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                  <option value="billetera_virtual">📱 Billetera</option>
                  <option value="mixto">💵🏦 Mixto</option>
                  <option value="tarjeta_vip">💎 Tarjeta VIP</option>
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="moneda-select" className="flex items-center gap-1.5 md:gap-2 text-lg md:text-xl font-semibold">
                  <Coins className="h-5 w-5 md:h-6 md:w-6" />
                  Moneda
                </Label>
                <select
                  id="moneda-select"
                  value={moneda}
                  onChange={(e) => changeCurrency(e.target.value as CurrencyCode)}
                  disabled={isSubmitting || !empleadoId || !canChangeCurrency}
                  className="flex h-12 md:h-14 w-full items-center justify-between rounded-md border-2 border-input bg-background px-3 py-2 text-lg md:text-xl font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
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
                <div className="h-full flex flex-col gap-1.5 md:gap-2">
                  {/* View Mode Selector and Search in one row */}
                  <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                      <TabsList className="h-14 md:h-16 p-1">
                        <TabsTrigger value="products" className="text-lg md:text-xl font-semibold px-4 md:px-6 h-12 md:h-14 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          <Package className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                          Productos
                        </TabsTrigger>
                        <TabsTrigger value="promotions" className="text-lg md:text-xl font-semibold px-4 md:px-6 h-12 md:h-14 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          <Tag className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                          Promociones
                        </TabsTrigger>
                        <TabsTrigger value="combos" className="text-lg md:text-xl font-semibold px-4 md:px-6 h-12 md:h-14 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          <TrendingUp className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                          Combos
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 md:pl-12 h-14 md:h-16 text-lg md:text-xl font-medium border-2"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  {(viewMode === 'products' || viewMode === 'promotions') && (
                    <div className="flex flex-wrap gap-1.5 md:gap-2 shrink-0">
                      <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="h-10 md:h-12 text-base md:text-lg font-semibold px-3 md:px-4"
                        onClick={() => setSelectedCategory('all')}
                      >
                        Todas
                      </Button>
                      {CATEGORIES.map((category) => (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? 'default' : 'outline'}
                          size="sm"
                          className="h-10 md:h-12 text-base md:text-lg font-semibold px-3 md:px-4"
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Products/Promotions/Combos Grid */}
                  <ScrollArea className="flex-1 w-full min-h-0 h-full">
                    {viewMode === 'products' && (
                      <div className="grid grid-cols-6 gap-2 p-1 pr-3">
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
                      <div className="grid grid-cols-6 gap-2 p-1 pr-3">
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
                      <div className="grid grid-cols-6 gap-2 p-1 pr-3">
                        {filteredCombos.map((combo) => {
                          const precio = getComboPrice(combo);
                          const precioARS = combo.precio_combo_ars || combo.precio_combo;

                          // Get precio_real for discount calculation
                          const precioReal = moneda === 'ARS'
                            ? combo.precio_real_ars
                            : moneda === 'USD'
                            ? combo.precio_real_usd
                            : combo.precio_real_brl;

                          return (
                            <ComboCard
                              key={combo.id}
                              nombre={combo.nombre}
                              precio={precio}
                              precioReal={precioReal}
                              precioARS={precioARS}
                              imagen_url={combo.imagen_url}
                  moneda={moneda}
                              productos={combo.combo_productos || []}
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
          <div className="w-[320px] md:w-[440px] lg:w-[480px] flex flex-col overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="p-3 md:p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <CartIcon className="h-5 w-5 md:h-6 md:w-6" />
                  Carrito ({items.length})
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-3 md:p-4 pt-0">
                {items.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <CartIcon className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-base md:text-lg">Carrito vacío</p>
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
                                  productos: { id?: string; nombre: string; categoria: string } | null;
                                }>).map((comboItem, idx) =>
                                  comboItem.productos ? (
                                    <div key={comboItem.productos.id || `combo-item-${idx}`} className="flex items-center gap-1.5 text-[11px]">
                                      <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded text-[10px]">
                                        {comboItem.cantidad}x
                                      </span>
                                      <span className="text-foreground font-medium truncate">
                                        {comboItem.productos.nombre}
                                      </span>
                                    </div>
                                  ) : null
                                )}
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
                <CardFooter className="flex-col gap-3 md:gap-4 border-t p-3 md:p-4">
                  <div className="w-full space-y-2 md:space-y-3">
                    <div className="flex justify-between text-lg md:text-xl">
                      <span className="text-muted-foreground font-semibold">Subtotal:</span>
                      <span className="font-bold">{formatCurrency(subtotal, moneda)}</span>
                    </div>
                    
                    {/* Descuento Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="descuento-adicional" className="text-base md:text-lg font-semibold">
                          Descuento adicional
                        </Label>
                        {descuentoAdicional > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-sm"
                            onClick={handleRemoverDescuento}
                          >
                            Quitar
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex gap-1.5 flex-1">
                          <Input
                            id="descuento-adicional"
                            type="number"
                            min="0"
                            step="0.01"
                            value={descuentoInput}
                            onChange={(e) => setDescuentoInput(e.target.value)}
                            placeholder={tipoDescuento === 'porcentaje' ? '%' : 'Monto'}
                            className="h-11 text-base flex-1"
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
                            className="h-11 text-base border rounded-md px-3"
                            disabled={isSubmitting}
                          >
                            <option value="porcentaje">%</option>
                            <option value="monto">{moneda}</option>
                          </select>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 px-4 text-base font-semibold"
                          onClick={handleAplicarDescuento}
                          disabled={isSubmitting || !descuentoInput}
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>

                    {/* Monto Transferencia Input - Solo visible cuando metodo_pago = 'mixto' */}
                    {metodoPago === 'mixto' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="monto-transferencia" className="text-base md:text-lg font-semibold">
                          Monto Transferencia
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="monto-transferencia"
                            type="number"
                            min="0"
                            max={totalConDescuentoAdicional}
                            step="0.01"
                            value={montoTransferenciaInput}
                            onChange={(e) => {
                              const inputValue = e.target.value;

                              // Si está vacío, permitir borrar
                              if (inputValue === '') {
                                setMontoTransferenciaInput('');
                                setMontoTransferencia(0);
                                setMontoTransferenciaError('');
                                return;
                              }

                              const numValue = parseFloat(inputValue);

                              // Si no es un número válido, no hacer nada
                              if (isNaN(numValue)) {
                                return;
                              }

                              // Validar que no exceda el total
                              if (numValue > totalConDescuentoAdicional) {
                                // Mostrar error temporalmente
                                setMontoTransferenciaError(`No puedes superar el total de ${formatCurrency(totalConDescuentoAdicional, moneda)}`);

                                // Ocultar el error después de 2 segundos
                                setTimeout(() => {
                                  setMontoTransferenciaError('');
                                }, 2000);

                                // NO actualizar el valor del input (mantener el anterior)
                                return;
                              }

                              // Si el valor es válido, actualizar
                              setMontoTransferenciaInput(inputValue);
                              setMontoTransferencia(numValue);
                              setMontoTransferenciaError('');
                            }}
                            placeholder="0.00"
                            className={`h-16 !text-4xl font-bold flex-1 ${montoTransferenciaError ? 'border-red-500 border-2' : ''}`}
                            disabled={isSubmitting}
                          />
                          <div className="flex items-center px-4 bg-muted rounded-md border-2 border-input">
                            <span className="text-2xl font-bold">{moneda}</span>
                          </div>
                        </div>

                        {/* Error message in red */}
                        {montoTransferenciaError && (
                          <div className="flex items-center gap-2 text-red-600 text-sm font-semibold bg-red-50 dark:bg-red-950/20 p-2 rounded-md border border-red-200 dark:border-red-800">
                            <span className="text-red-600">⚠</span>
                            <span>{montoTransferenciaError}</span>
                          </div>
                        )}

                        {/* Show effective amount when transfer amount is valid */}
                        {montoTransferencia > 0 && !montoTransferenciaError && (
                          <div className="flex justify-between text-sm text-muted-foreground mt-1 px-1">
                            <span>Efectivo a pagar:</span>
                            <span className="font-bold text-xl text-foreground">{formatCurrency(montoEfectivo, moneda)}</span>
                          </div>
                        )}
                      </div>
                    )}

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

                    <div className="flex justify-between text-3xl md:text-4xl font-bold">
                      <span>Total:</span>
                      <span className="text-[#00ff41]">{formatCurrency(totalConDescuentoAdicional, moneda)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 md:h-16 text-xl md:text-2xl font-bold"
                    onClick={handleConfirmSale}
                    disabled={!isValid || isSubmitting}
                  >
                    {isSubmitting ? 'Procesando...' : (editingSale ? 'Guardar Cambios' : 'Confirmar Venta')}
                  </Button>
                  {!isValid && (
                    <p className="text-base md:text-lg text-muted-foreground text-center">
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


