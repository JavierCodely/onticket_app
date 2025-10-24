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

  // === STEP 0: Validate stock availability ===
  // Get all product IDs from cart items
  const productIdsNeeded = new Map<string, number>();

  for (const item of items) {
    if (item.type === 'product' || item.type === 'promotion') {
      const current = productIdsNeeded.get(item.producto_id) || 0;
      productIdsNeeded.set(item.producto_id, current + item.cantidad);
    } else if (item.type === 'combo') {
      // For combos, get products from combo_productos
      const comboProductos = (item.combo as any).combo_productos as Array<{
        cantidad: number;
        productos: { id: string; nombre: string } | null;
      }> | undefined;

      if (comboProductos) {
        for (const cp of comboProductos) {
          if (cp.productos) {
            const totalCantidad = cp.cantidad * item.cantidad;
            const current = productIdsNeeded.get(cp.productos.id) || 0;
            productIdsNeeded.set(cp.productos.id, current + totalCantidad);
          }
        }
      }
    }
  }

  // Fetch current stock for all needed products
  const productIds = Array.from(productIdsNeeded.keys());
  const { data: currentProducts, error: stockError } = await supabase
    .from('productos')
    .select('id, nombre, stock')
    .in('id', productIds);

  if (stockError) {
    throw new Error(`Error al verificar stock: ${stockError.message}`);
  }

  // Check if all products have sufficient stock
  const insufficientStock: string[] = [];
  for (const product of (currentProducts || []) as Array<{ id: string; nombre: string; stock: number }>) {
    const neededQty = productIdsNeeded.get(product.id) || 0;
    if (product.stock < neededQty) {
      insufficientStock.push(`${product.nombre} (disponible: ${product.stock}, necesario: ${neededQty})`);
    }
  }

  if (insufficientStock.length > 0) {
    throw new Error(`Stock insuficiente: ${insufficientStock.join(', ')}`);
  }

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

      // Fetch complete combo data with all currency prices
      type ComboDataType = {
        precio_real_ars: number | null;
        precio_real_usd: number | null;
        precio_real_brl: number | null;
        precio_combo_ars: number | null;
        precio_combo_usd: number | null;
        precio_combo_brl: number | null;
      };

      const { data: comboData } = await supabase
        .from('combos')
        .select('precio_real_ars, precio_real_usd, precio_real_brl, precio_combo_ars, precio_combo_usd, precio_combo_brl')
        .eq('id', item.combo_id)
        .single();

      if (!comboData) {
        console.error('Combo not found:', item.combo_id);
        continue;
      }

      // Type assertion for comboData
      const typedComboData = comboData as ComboDataType;

      // Fetch product prices for proportional distribution
      const productIds = comboProductos.map(cp => cp.productos?.id).filter(Boolean) as string[];
      const { data: productsWithPrices } = await supabase
        .from('productos')
        .select('id, precio_venta_ars, precio_venta_usd, precio_venta_brl')
        .in('id', productIds);

      type ProductPrices = {
        id: string;
        precio_venta_ars: number | null;
        precio_venta_usd: number | null;
        precio_venta_brl: number | null;
      };

      // Create a price map for easy lookup
      const priceMap = new Map((productsWithPrices as ProductPrices[] | null)?.map(p => [p.id, p]) || []);

      // Calculate total value of all products in combo (proportional distribution base)
      let totalValueARS = 0;
      let totalValueUSD = 0;
      let totalValueBRL = 0;

      for (const comboItem of comboProductos) {
        if (!comboItem.productos) continue;
        const prices = priceMap.get(comboItem.productos.id);
        if (!prices) continue;

        totalValueARS += (prices.precio_venta_ars || 0) * comboItem.cantidad;
        totalValueUSD += (prices.precio_venta_usd || 0) * comboItem.cantidad;
        totalValueBRL += (prices.precio_venta_brl || 0) * comboItem.cantidad;
      }

      // Safety check: Skip if combo has no value
      if (totalValueARS === 0 && totalValueUSD === 0 && totalValueBRL === 0) {
        console.error('Combo has no product value:', item.combo_id);
        continue;
      }

      for (const comboItem of comboProductos) {
        if (!comboItem.productos) continue;
        if (comboItem.cantidad === 0) continue; // Skip items with 0 quantity

        const producto = comboItem.productos;
        const prices = priceMap.get(producto.id);
        if (!prices) continue;

        // Calculate this product's proportion of the combo value
        const productValueARS = (prices.precio_venta_ars || 0) * comboItem.cantidad;
        const productValueUSD = (prices.precio_venta_usd || 0) * comboItem.cantidad;
        const productValueBRL = (prices.precio_venta_brl || 0) * comboItem.cantidad;

        const proportionARS = totalValueARS > 0 ? productValueARS / totalValueARS : 0;
        const proportionUSD = totalValueUSD > 0 ? productValueUSD / totalValueUSD : 0;
        const proportionBRL = totalValueBRL > 0 ? productValueBRL / totalValueBRL : 0;

        // Distribute combo price proportionally - use combo prices from database
        const comboItemSubtotalARS = (typedComboData.precio_real_ars || 0) * proportionARS * item.cantidad;
        const comboItemTotalARS = (typedComboData.precio_combo_ars || 0) * proportionARS * item.cantidad;
        const comboItemSubtotalUSD = (typedComboData.precio_real_usd || 0) * proportionUSD * item.cantidad;
        const comboItemTotalUSD = (typedComboData.precio_combo_usd || 0) * proportionUSD * item.cantidad;
        const comboItemSubtotalBRL = (typedComboData.precio_real_brl || 0) * proportionBRL * item.cantidad;
        const comboItemTotalBRL = (typedComboData.precio_combo_brl || 0) * proportionBRL * item.cantidad;

        // For the main fields, use the currency of the sale
        let comboItemSubtotal, comboItemTotal;
        if (moneda === 'ARS') {
          comboItemSubtotal = comboItemSubtotalARS;
          comboItemTotal = comboItemTotalARS;
        } else if (moneda === 'USD') {
          comboItemSubtotal = comboItemSubtotalUSD;
          comboItemTotal = comboItemTotalUSD;
        } else {
          comboItemSubtotal = comboItemSubtotalBRL;
          comboItemTotal = comboItemTotalBRL;
        }
        const comboItemDescuentoARS = comboItemSubtotalARS - comboItemTotalARS;
        const comboItemDescuentoUSD = comboItemSubtotalUSD - comboItemTotalUSD;
        const comboItemDescuentoBRL = comboItemSubtotalBRL - comboItemTotalBRL;

        // Apply proportional additional discount if exists (based on sale currency)
        let comboItemDescuentoAdicional;
        if (moneda === 'ARS') {
          comboItemDescuentoAdicional = itemDescuentoAdicional * proportionARS;
        } else if (moneda === 'USD') {
          comboItemDescuentoAdicional = itemDescuentoAdicional * proportionUSD;
        } else {
          comboItemDescuentoAdicional = itemDescuentoAdicional * proportionBRL;
        }

        const comboItemTotalFinal = comboItemTotal - comboItemDescuentoAdicional;
        const comboItemDescuento = comboItemSubtotal - comboItemTotal;
        const comboItemDescuentoFinal = comboItemDescuento + comboItemDescuentoAdicional;

        // Final totals with additional discount for each currency
        const comboItemDescuentoAdicionalARS = itemDescuentoAdicional * proportionARS;
        const comboItemDescuentoAdicionalUSD = itemDescuentoAdicional * proportionUSD;
        const comboItemDescuentoAdicionalBRL = itemDescuentoAdicional * proportionBRL;

        // Calculate precio_unitario for each currency (total / cantidad)
        const cantidadTotal = item.cantidad * comboItem.cantidad;
        const precioUnitarioARS = comboItemTotalARS / cantidadTotal;
        const precioUnitarioUSD = comboItemTotalUSD / cantidadTotal;
        const precioUnitarioBRL = comboItemTotalBRL / cantidadTotal;

        const saleItemData = {
          sale_id: saleHeader.id,
          producto_id: producto.id,
          item_type: 'combo',
          promocion_id: null,
          combo_id: item.combo_id,
          cantidad: cantidadTotal,
          precio_unitario: moneda === 'ARS' ? precioUnitarioARS : moneda === 'USD' ? precioUnitarioUSD : precioUnitarioBRL,
          subtotal: comboItemSubtotal,
          descuento: comboItemDescuentoFinal,
          total: comboItemTotalFinal,
          // Multi-currency fields - store actual distributed values
          precio_unitario_ars: precioUnitarioARS,
          subtotal_ars: comboItemSubtotalARS,
          descuento_ars: comboItemDescuentoARS + comboItemDescuentoAdicionalARS,
          total_ars: comboItemTotalARS - comboItemDescuentoAdicionalARS,
          precio_unitario_usd: precioUnitarioUSD,
          subtotal_usd: comboItemSubtotalUSD,
          descuento_usd: comboItemDescuentoUSD + comboItemDescuentoAdicionalUSD,
          total_usd: comboItemTotalUSD - comboItemDescuentoAdicionalUSD,
          precio_unitario_brl: precioUnitarioBRL,
          subtotal_brl: comboItemSubtotalBRL,
          descuento_brl: comboItemDescuentoBRL + comboItemDescuentoAdicionalBRL,
          total_brl: comboItemTotalBRL - comboItemDescuentoAdicionalBRL,
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
