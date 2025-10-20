/**
 * Utility function to create a sale with multiple sale_items
 * Handles products, promotions, and combos
 */

import { supabase } from '@/lib/supabase';
import type { CartItem } from '@/types/ventas';
import type { CurrencyCode, MetodoPago } from '@/types/database';

interface CreateSaleParams {
  clubId: string;
  personalId: string;
  items: CartItem[];
  subtotal: number;
  descuentoTotal: number;
  descuentoAdicional: number;
  total: number;
  totalConDescuentoAdicional: number;
  moneda: CurrencyCode;
  metodoPago: MetodoPago;
  montoEfectivo?: number; // Only used when metodoPago = 'mixto'
  montoTransferencia?: number; // Only used when metodoPago = 'mixto'
}

export async function createSaleWithItems(params: CreateSaleParams) {
  const {
    clubId,
    personalId,
    items,
    subtotal,
    descuentoTotal,
    descuentoAdicional,
    totalConDescuentoAdicional,
    moneda,
    metodoPago,
    montoEfectivo = 0,
    montoTransferencia = 0,
  } = params;

  // Exchange rates (would come from API in real implementation)
  const exchangeRates = { ARS: 1, USD: 1, BRL: 1 };

  console.log('🔍 DEBUG createSaleWithItems - Input params:', {
    metodoPago,
    montoEfectivo,
    montoTransferencia,
    totalConDescuentoAdicional,
    suma: montoEfectivo + montoTransferencia,
  });

  // === STEP 1: Create sale header ===
  const saleHeaderData = {
    club_id: clubId,
    personal_id: personalId,
    subtotal,
    descuento: descuentoTotal + descuentoAdicional,
    total: totalConDescuentoAdicional,
    moneda,
    metodo_pago: metodoPago,
    monto_efectivo: montoEfectivo,
    monto_transferencia: montoTransferencia,
    // Multi-currency totals
    subtotal_ars: moneda === 'ARS' ? subtotal : subtotal * exchangeRates.ARS,
    descuento_ars: moneda === 'ARS' ? (descuentoTotal + descuentoAdicional) : (descuentoTotal + descuentoAdicional) * exchangeRates.ARS,
    total_ars: moneda === 'ARS' ? totalConDescuentoAdicional : totalConDescuentoAdicional * exchangeRates.ARS,
    subtotal_usd: moneda === 'USD' ? subtotal : subtotal * exchangeRates.USD,
    descuento_usd: moneda === 'USD' ? (descuentoTotal + descuentoAdicional) : (descuentoTotal + descuentoAdicional) * exchangeRates.USD,
    total_usd: moneda === 'USD' ? totalConDescuentoAdicional : totalConDescuentoAdicional * exchangeRates.USD,
    subtotal_brl: moneda === 'BRL' ? subtotal : subtotal * exchangeRates.BRL,
    descuento_brl: moneda === 'BRL' ? (descuentoTotal + descuentoAdicional) : (descuentoTotal + descuentoAdicional) * exchangeRates.BRL,
    total_brl: moneda === 'BRL' ? totalConDescuentoAdicional : totalConDescuentoAdicional * exchangeRates.BRL,
  };

  console.log('🔍 DEBUG createSaleWithItems - Sale header data:', {
    total: saleHeaderData.total,
    metodo_pago: saleHeaderData.metodo_pago,
    monto_efectivo: saleHeaderData.monto_efectivo,
    monto_transferencia: saleHeaderData.monto_transferencia,
    suma: saleHeaderData.monto_efectivo + saleHeaderData.monto_transferencia,
    diferencia: Math.abs((saleHeaderData.monto_efectivo + saleHeaderData.monto_transferencia) - saleHeaderData.total),
  });

  const { data: saleHeaderResult, error: saleHeaderError } = await supabase
    .from('sale')
    .insert(saleHeaderData as any)
    .select()
    .single();

  if (saleHeaderError || !saleHeaderResult) {
    throw new Error(`Error al crear venta: ${saleHeaderError?.message || 'No se pudo crear la venta'}`);
  }

  const saleHeader = saleHeaderResult as { id: string; [key: string]: any };

  // === STEP 2: Create sale items ===
  const saleItemsToInsert = [];
  const total = params.total; // Total before additional discount

  for (const item of items) {
    // Apply proportional additional discount
    let itemDescuentoAdicional = 0;
    if (descuentoAdicional > 0) {
      const proportion = item.total / total;
      itemDescuentoAdicional = descuentoAdicional * proportion;
    }

    const finalItemDescuento = item.descuento + itemDescuentoAdicional;
    const finalItemTotal = item.total - itemDescuentoAdicional;

    if (item.type === 'product' || item.type === 'promotion') {
      // Single sale_item for products and promotions
      const saleItemData = {
        sale_id: saleHeader.id,
        producto_id: item.producto_id,
        item_type: item.type,
        promocion_id: item.type === 'promotion' ? item.promocion_id : null,
        combo_id: null,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        descuento: finalItemDescuento,
        total: finalItemTotal,
        // Multi-currency fields
        precio_unitario_ars: moneda === 'ARS' ? item.precio_unitario : item.precio_unitario * exchangeRates.ARS,
        subtotal_ars: moneda === 'ARS' ? item.subtotal : item.subtotal * exchangeRates.ARS,
        descuento_ars: moneda === 'ARS' ? finalItemDescuento : finalItemDescuento * exchangeRates.ARS,
        total_ars: moneda === 'ARS' ? finalItemTotal : finalItemTotal * exchangeRates.ARS,
        precio_unitario_usd: moneda === 'USD' ? item.precio_unitario : item.precio_unitario * exchangeRates.USD,
        subtotal_usd: moneda === 'USD' ? item.subtotal : item.subtotal * exchangeRates.USD,
        descuento_usd: moneda === 'USD' ? finalItemDescuento : finalItemDescuento * exchangeRates.USD,
        total_usd: moneda === 'USD' ? finalItemTotal : finalItemTotal * exchangeRates.USD,
        precio_unitario_brl: moneda === 'BRL' ? item.precio_unitario : item.precio_unitario * exchangeRates.BRL,
        subtotal_brl: moneda === 'BRL' ? item.subtotal : item.subtotal * exchangeRates.BRL,
        descuento_brl: moneda === 'BRL' ? finalItemDescuento : finalItemDescuento * exchangeRates.BRL,
        total_brl: moneda === 'BRL' ? finalItemTotal : finalItemTotal * exchangeRates.BRL,
      };

      saleItemsToInsert.push(saleItemData);
    } else if (item.type === 'combo') {
      // For combos, create multiple sale_items (one per product in combo)
      const comboProductos = (item.combo as any).combo_productos as Array<{
        cantidad: number;
        productos: { id: string; nombre: string } | null;
      }> | undefined;

      if (!comboProductos) continue;

      const totalProductosEnCombo = comboProductos.reduce((sum, cp) => sum + (cp.cantidad || 0), 0);

      // Safety check: Skip if combo has no products or total is 0
      if (totalProductosEnCombo === 0) {
        console.error('Combo has no products or total quantity is 0:', item.combo_id);
        continue;
      }

      for (const comboItem of comboProductos) {
        if (!comboItem.productos) continue;
        if (comboItem.cantidad === 0) continue; // Skip items with 0 quantity

        const producto = comboItem.productos; // Type narrowing

        // For combos, item.subtotal is the REAL price, item.total is the PROMOTIONAL price
        // Distribute both proportionally based on product quantities
        const precioRealPorUnidad = item.subtotal / totalProductosEnCombo;
        const precioPromocionPorUnidad = item.total / totalProductosEnCombo;

        // Calculate for this specific product in the combo
        const comboItemSubtotal = precioRealPorUnidad * comboItem.cantidad * item.cantidad;
        const comboItemTotal = precioPromocionPorUnidad * comboItem.cantidad * item.cantidad;
        const comboItemDescuento = comboItemSubtotal - comboItemTotal;

        // Apply proportional additional discount if exists
        const comboItemDescuentoAdicional = itemDescuentoAdicional * (comboItem.cantidad / totalProductosEnCombo);
        const comboItemTotalFinal = comboItemTotal - comboItemDescuentoAdicional;
        const comboItemDescuentoFinal = comboItemDescuento + comboItemDescuentoAdicional;

        const saleItemData = {
          sale_id: saleHeader.id,
          producto_id: producto.id,
          item_type: 'combo',
          promocion_id: null,
          combo_id: item.combo_id,
          cantidad: item.cantidad * comboItem.cantidad,
          precio_unitario: precioPromocionPorUnidad,
          subtotal: comboItemSubtotal,
          descuento: comboItemDescuentoFinal,
          total: comboItemTotalFinal,
          // Multi-currency fields
          precio_unitario_ars: moneda === 'ARS' ? precioPromocionPorUnidad : precioPromocionPorUnidad * exchangeRates.ARS,
          subtotal_ars: moneda === 'ARS' ? comboItemSubtotal : comboItemSubtotal * exchangeRates.ARS,
          descuento_ars: moneda === 'ARS' ? comboItemDescuentoFinal : comboItemDescuentoFinal * exchangeRates.ARS,
          total_ars: moneda === 'ARS' ? comboItemTotalFinal : comboItemTotalFinal * exchangeRates.ARS,
          precio_unitario_usd: moneda === 'USD' ? precioPromocionPorUnidad : precioPromocionPorUnidad * exchangeRates.USD,
          subtotal_usd: moneda === 'USD' ? comboItemSubtotal : comboItemSubtotal * exchangeRates.USD,
          descuento_usd: moneda === 'USD' ? comboItemDescuentoFinal : comboItemDescuentoFinal * exchangeRates.USD,
          total_usd: moneda === 'USD' ? comboItemTotalFinal : comboItemTotalFinal * exchangeRates.USD,
          precio_unitario_brl: moneda === 'BRL' ? precioPromocionPorUnidad : precioPromocionPorUnidad * exchangeRates.BRL,
          subtotal_brl: moneda === 'BRL' ? comboItemSubtotal : comboItemSubtotal * exchangeRates.BRL,
          descuento_brl: moneda === 'BRL' ? comboItemDescuentoFinal : comboItemDescuentoFinal * exchangeRates.BRL,
          total_brl: moneda === 'BRL' ? comboItemTotalFinal : comboItemTotalFinal * exchangeRates.BRL,
        };

        saleItemsToInsert.push(saleItemData);
      }
    }
  }

  // Insert all sale items
  if (saleItemsToInsert.length > 0) {
    const { error: saleItemsError } = await supabase
      .from('sale_items')
      .insert(saleItemsToInsert as any);

    if (saleItemsError) {
      throw new Error(`Error al crear items de venta: ${saleItemsError.message}`);
    }
  }

  // === STEP 3: Update promotion and combo usage counters ===
  for (const item of items) {
    if (item.type === 'promotion') {
      // Update promotion usage (increment by 1 per sale, not by quantity)
      const { data: currentPromo } = await supabase
        .from('promociones')
        .select('cantidad_usos')
        .eq('id', item.promocion_id)
        .single();

      if (currentPromo) {
        const promo = currentPromo as { cantidad_usos: number };
        const newCantidadUsos = promo.cantidad_usos + 1;
        await (supabase.from('promociones') as any)
          .update({ cantidad_usos: newCantidadUsos })
          .eq('id', item.promocion_id);
      }
    } else if (item.type === 'combo' && item.combo.limite_usos !== null) {
      // Update combo usage (increment by 1 per sale, not by quantity)
      const { data: currentCombo } = await supabase
        .from('combos')
        .select('cantidad_usos')
        .eq('id', item.combo_id)
        .single();

      if (currentCombo) {
        const combo = currentCombo as { cantidad_usos: number };
        const newCantidadUsos = combo.cantidad_usos + 1;
        await (supabase.from('combos') as any)
          .update({ cantidad_usos: newCantidadUsos })
          .eq('id', item.combo_id);
      }
    }
  }

  return saleHeader;
}
