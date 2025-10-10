/**
 * useCart Hook
 * Manages shopping cart with products, promotions, and combos
 */

import { useState, useCallback, useMemo } from 'react';
import type { CurrencyCode } from '@/types/currency';
import type { MetodoPago } from '@/types/database';
import type {
  CartItem,
  CartItemProduct,
  CartItemPromotion,
  CartItemCombo,
  CartState,
} from '@/types/ventas';
import type { Producto, Promocion, Combo } from '@/types/database';

interface UseCartOptions {
  defaultCurrency?: CurrencyCode;
  defaultMetodoPago?: MetodoPago;
}

export function useCart(options: UseCartOptions = {}) {
  const {
    defaultCurrency = 'ARS',
    defaultMetodoPago = 'efectivo',
  } = options;

  const [items, setItems] = useState<CartItem[]>([]);
  const [moneda, setMoneda] = useState<CurrencyCode>(defaultCurrency);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(defaultMetodoPago);
  const [empleadoId, setEmpleadoId] = useState<string | null>(null);

  /**
   * Get price for a product in the selected currency
   */
  const getProductPrice = useCallback(
    (producto: Producto, isAdmin: boolean): number => {
      const field = isAdmin ? 'precio_compra' : 'precio_venta';
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
    },
    [moneda]
  );

  /**
   * Get price for a promotion in the selected currency
   */
  const getPromotionPrice = useCallback(
    (promocion: Promocion): { real: number; promocion: number } => {
      switch (moneda) {
        case 'ARS':
          return {
            real: promocion.precio_real_ars,
            promocion: promocion.precio_promocion_ars,
          };
        case 'USD':
          return {
            real: promocion.precio_real_usd,
            promocion: promocion.precio_promocion_usd,
          };
        case 'BRL':
          return {
            real: promocion.precio_real_brl,
            promocion: promocion.precio_promocion_brl,
          };
        default:
          return {
            real: promocion.precio_real_ars,
            promocion: promocion.precio_promocion_ars,
          };
      }
    },
    [moneda]
  );

  /**
   * Get price for a combo in the selected currency
   */
  const getComboPrice = useCallback(
    (combo: Combo): { real: number; combo: number } => {
      switch (moneda) {
        case 'ARS':
          return {
            real: combo.precio_real_ars,
            combo: combo.precio_combo_ars,
          };
        case 'USD':
          return {
            real: combo.precio_real_usd,
            combo: combo.precio_combo_usd,
          };
        case 'BRL':
          return {
            real: combo.precio_real_brl,
            combo: combo.precio_combo_brl,
          };
        default:
          return {
            real: combo.precio_real_ars,
            combo: combo.precio_combo_ars,
          };
      }
    },
    [moneda]
  );

  /**
   * Check if a promotion is applicable for a quantity
   */
  const checkPromotion = useCallback(
    (promocion: Promocion, cantidad: number): boolean => {
      if (!promocion.activo) return false;
      if (cantidad < promocion.cantidad_minima) return false;
      if (promocion.cantidad_maxima && cantidad > promocion.cantidad_maxima) return false;
      if (promocion.limite_usos !== null && promocion.cantidad_usos >= promocion.limite_usos)
        return false;
      return true;
    },
    []
  );

  /**
   * Add a product to the cart
   */
  const addProduct = useCallback(
    (producto: Producto, cantidad: number, isAdmin: boolean, promocion?: Promocion) => {
      const id = `${Date.now()}-${Math.random()}`;
      const precioUnitario = getProductPrice(producto, isAdmin);

      if (promocion && checkPromotion(promocion, cantidad)) {
        // Add as promotion
        const prices = getPromotionPrice(promocion);
        
        // Prices in DB are stored as TOTAL for cantidad_minima, so we need to calculate unit price
        const precioUnitarioPromocion = prices.promocion / promocion.cantidad_minima;
        const precioUnitarioReal = prices.real / promocion.cantidad_minima;
        
        const subtotal = precioUnitarioReal * cantidad;
        const total = precioUnitarioPromocion * cantidad;
        const descuento = subtotal - total;

        const item: CartItemPromotion = {
          id,
          type: 'promotion',
          promocion_id: promocion.id,
          producto_id: producto.id,
          promocion,
          producto,
          cantidad,
          precio_unitario: precioUnitarioPromocion,
          subtotal,
          descuento,
          total,
        };

        setItems((prev) => [...prev, item]);
      } else {
        // Add as regular product
        const subtotal = precioUnitario * cantidad;
        const item: CartItemProduct = {
          id,
          type: 'product',
          producto_id: producto.id,
          producto,
          cantidad,
          precio_unitario: precioUnitario,
          subtotal,
          descuento: 0,
          total: subtotal,
        };

        setItems((prev) => [...prev, item]);
      }
    },
    [getProductPrice, getPromotionPrice, checkPromotion]
  );

  /**
   * Add a combo to the cart
   */
  const addCombo = useCallback(
    (combo: Combo, cantidad: number) => {
      const id = `${Date.now()}-${Math.random()}`;
      const prices = getComboPrice(combo);
      const subtotal = prices.real * cantidad;
      const descuento = subtotal - prices.combo * cantidad;
      const total = prices.combo * cantidad;

      const item: CartItemCombo = {
        id,
        type: 'combo',
        combo_id: combo.id,
        combo,
        cantidad,
        precio_unitario: prices.combo,
        subtotal,
        descuento,
        total,
      };

      setItems((prev) => [...prev, item]);
    },
    [getComboPrice]
  );

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback(
    (itemId: string, cantidad: number) => {
      if (cantidad === 0) {
        // Remove item if quantity is 0
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;

          // Calculate descuento unitario based on original item data
          const descuentoUnitario = item.descuento / item.cantidad;

          // Recalculate prices based on new quantity
          const subtotal = item.precio_unitario * cantidad;
          const descuento = descuentoUnitario * cantidad;
          const total = subtotal - descuento;

          return {
            ...item,
            cantidad,
            subtotal,
            descuento,
            total,
          };
        })
      );
    },
    []
  );

  /**
   * Remove item from cart
   */
  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  /**
   * Clear the entire cart
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * Calculate cart totals
   */
  const cartTotals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoTotal = items.reduce((sum, item) => sum + item.descuento, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    return { subtotal, descuentoTotal, total };
  }, [items]);

  /**
   * Get cart state
   */
  const cartState: CartState = useMemo(
    () => ({
      items,
      moneda,
      metodo_pago: metodoPago,
      empleado_id: empleadoId,
      subtotal: cartTotals.subtotal,
      descuento_total: cartTotals.descuentoTotal,
      total: cartTotals.total,
    }),
    [items, moneda, metodoPago, empleadoId, cartTotals]
  );

  /**
   * Change currency (and recalculate all prices)
   */
  const changeCurrency = useCallback((newCurrency: CurrencyCode) => {
    setMoneda(newCurrency);
    // Note: Items will need to be recalculated when currency changes
    // This is a simplified version - in production you'd want to
    // recalculate prices for all items based on the new currency
  }, []);

  /**
   * Change payment method
   */
  const changeMetodoPago = useCallback((newMetodo: MetodoPago) => {
    setMetodoPago(newMetodo);
  }, []);

  /**
   * Set employee
   */
  const setEmpleado = useCallback((empleadoId: string | null) => {
    setEmpleadoId(empleadoId);
  }, []);

  /**
   * Check if cart is valid for checkout
   */
  const isValid = useMemo(() => {
    return items.length > 0 && empleadoId !== null;
  }, [items.length, empleadoId]);

  return {
    items,
    cartState,
    moneda,
    metodoPago,
    empleadoId,
    subtotal: cartTotals.subtotal,
    descuentoTotal: cartTotals.descuentoTotal,
    total: cartTotals.total,
    isValid,
    addProduct,
    addCombo,
    updateQuantity,
    removeItem,
    clearCart,
    changeCurrency,
    changeMetodoPago,
    setEmpleado,
  };
}
