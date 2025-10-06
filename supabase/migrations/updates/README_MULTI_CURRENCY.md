# Multi-Currency System Migration

## Overview

This migration adds support for multiple currencies (Pesos Argentinos, Dólares USD, Reales Brasileños) across the platform.

## Affected Tables

### 1. `productos`
**New Columns:**
- `precio_compra_ars` - Purchase price in Argentine Pesos
- `precio_venta_ars` - Sale price in Argentine Pesos
- `precio_compra_usd` - Purchase price in US Dollars
- `precio_venta_usd` - Sale price in US Dollars
- `precio_compra_brl` - Purchase price in Brazilian Reais
- `precio_venta_brl` - Sale price in Brazilian Reais

**Migration:**
- Existing `precio_compra` and `precio_venta` values are copied to `*_ars` columns
- All new columns default to 0
- Non-negative constraints added

### 2. `combos`
**New Columns:**
- `precio_real_ars`, `precio_combo_ars` - Prices in Argentine Pesos
- `precio_real_usd`, `precio_combo_usd` - Prices in US Dollars
- `precio_real_brl`, `precio_combo_brl` - Prices in Brazilian Reais

**Migration:**
- Existing `precio_real` and `precio_combo` values are copied to `*_ars` columns
- All new columns default to 0

### 3. `promociones`
**New Columns:**
- `precio_real_ars`, `precio_promocion_ars` - Prices in Argentine Pesos
- `precio_real_usd`, `precio_promocion_usd` - Prices in US Dollars
- `precio_real_brl`, `precio_promocion_brl` - Prices in Brazilian Reais

**Migration:**
- Existing `precio_real` and `precio_promocion` values are copied to `*_ars` columns
- All new columns default to 0

### 4. `sale`
**New Columns (Base):**
- `subtotal` - Subtotal before discount
- `descuento` - Discount amount applied
- `moneda` - Currency code for the sale (ARS, USD, BRL)

**New Columns (Multi-Currency):**
- `precio_unitario_ars`, `subtotal_ars`, `descuento_ars`, `total_ars` - Argentine Pesos
- `precio_unitario_usd`, `subtotal_usd`, `descuento_usd`, `total_usd` - US Dollars
- `precio_unitario_brl`, `subtotal_brl`, `descuento_brl`, `total_brl` - Brazilian Reais

**Migration:**
- Adds `subtotal` and `descuento` columns to base table
- Existing records: `subtotal` = `total`, `descuento` = 0
- Existing sales are marked as ARS currency
- Existing values are copied to `*_ars` columns

## Currency Codes

- **ARS** - Peso Argentino (🇦🇷)
- **USD** - Dólar Estadounidense (🇺🇸)
- **BRL** - Real Brasileño (🇧🇷)

## Execution Order

1. `add_multi_currency_to_productos.sql`
2. `add_multi_currency_to_combos.sql`
3. `add_multi_currency_to_promociones.sql`
4. `add_multi_currency_to_sale.sql`

## Rollback

To rollback these changes:

```sql
-- Productos
ALTER TABLE productos
DROP COLUMN precio_compra_ars,
DROP COLUMN precio_venta_ars,
DROP COLUMN precio_compra_usd,
DROP COLUMN precio_venta_usd,
DROP COLUMN precio_compra_brl,
DROP COLUMN precio_venta_brl;

-- Combos
ALTER TABLE combos
DROP COLUMN precio_real_ars,
DROP COLUMN precio_combo_ars,
DROP COLUMN precio_real_usd,
DROP COLUMN precio_combo_usd,
DROP COLUMN precio_real_brl,
DROP COLUMN precio_combo_brl;

-- Promociones
ALTER TABLE promociones
DROP COLUMN precio_real_ars,
DROP COLUMN precio_promocion_ars,
DROP COLUMN precio_real_usd,
DROP COLUMN precio_promocion_usd,
DROP COLUMN precio_real_brl,
DROP COLUMN precio_promocion_brl;

-- Sale
ALTER TABLE sale
DROP COLUMN subtotal,
DROP COLUMN descuento,
DROP COLUMN moneda,
DROP COLUMN precio_unitario_ars,
DROP COLUMN subtotal_ars,
DROP COLUMN descuento_ars,
DROP COLUMN total_ars,
DROP COLUMN precio_unitario_usd,
DROP COLUMN subtotal_usd,
DROP COLUMN descuento_usd,
DROP COLUMN total_usd,
DROP COLUMN precio_unitario_brl,
DROP COLUMN subtotal_brl,
DROP COLUMN descuento_brl,
DROP COLUMN total_brl;
```

## Frontend Integration

The frontend will need:
1. Currency selector in product/combo/promotion forms
2. Default currency from configuration
3. Ability to enable/disable specific currencies
4. Price inputs for each enabled currency
5. Display prices in the selected currency

