/**
 * Migration: Add Multi-Currency Support to Sale
 * Description: Adds currency tracking for sales, subtotal and discount columns
 * Date: 2025-10-06
 */

-- First, add subtotal and descuento columns to the original table
ALTER TABLE sale
ADD COLUMN subtotal DECIMAL(12, 2) DEFAULT 0 NOT NULL,
ADD COLUMN descuento DECIMAL(12, 2) DEFAULT 0 NOT NULL;

-- Update existing records: subtotal = total, descuento = 0
UPDATE sale
SET 
  subtotal = total,
  descuento = 0
WHERE total > 0;

-- Add constraints for subtotal and descuento
ALTER TABLE sale
ADD CONSTRAINT check_subtotal_non_negative CHECK (subtotal >= 0),
ADD CONSTRAINT check_descuento_non_negative CHECK (descuento >= 0);

-- Add currency column to sale table to track which currency was used
ALTER TABLE sale
ADD COLUMN moneda VARCHAR(3) DEFAULT 'ARS' NOT NULL;

-- Add constraints for valid currencies
ALTER TABLE sale
ADD CONSTRAINT check_moneda_valida CHECK (moneda IN ('ARS', 'USD', 'BRL'));

-- Add currency-specific columns for ARS (Pesos Argentinos)
ALTER TABLE sale
ADD COLUMN precio_unitario_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN subtotal_ars DECIMAL(12, 2) DEFAULT 0 NOT NULL,
ADD COLUMN descuento_ars DECIMAL(12, 2) DEFAULT 0 NOT NULL,
ADD COLUMN total_ars DECIMAL(12, 2) DEFAULT 0 NOT NULL;

-- Add currency-specific columns for USD (Dólares)
ALTER TABLE sale
ADD COLUMN precio_unitario_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN subtotal_usd DECIMAL(12, 2) DEFAULT 0 NOT NULL,
ADD COLUMN descuento_usd DECIMAL(12, 2) DEFAULT 0 NOT NULL,
ADD COLUMN total_usd DECIMAL(12, 2) DEFAULT 0 NOT NULL;

-- Add currency-specific columns for BRL (Reales Brasileños)
ALTER TABLE sale
ADD COLUMN precio_unitario_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN subtotal_brl DECIMAL(12, 2) DEFAULT 0 NOT NULL,
ADD COLUMN descuento_brl DECIMAL(12, 2) DEFAULT 0 NOT NULL,
ADD COLUMN total_brl DECIMAL(12, 2) DEFAULT 0 NOT NULL;

-- Add constraints to ensure non-negative values
ALTER TABLE sale
ADD CONSTRAINT check_precio_unitario_ars_non_negative CHECK (precio_unitario_ars >= 0),
ADD CONSTRAINT check_subtotal_ars_non_negative CHECK (subtotal_ars >= 0),
ADD CONSTRAINT check_descuento_ars_non_negative CHECK (descuento_ars >= 0),
ADD CONSTRAINT check_total_ars_non_negative CHECK (total_ars >= 0),
ADD CONSTRAINT check_precio_unitario_usd_non_negative CHECK (precio_unitario_usd >= 0),
ADD CONSTRAINT check_subtotal_usd_non_negative CHECK (subtotal_usd >= 0),
ADD CONSTRAINT check_descuento_usd_non_negative CHECK (descuento_usd >= 0),
ADD CONSTRAINT check_total_usd_non_negative CHECK (total_usd >= 0),
ADD CONSTRAINT check_precio_unitario_brl_non_negative CHECK (precio_unitario_brl >= 0),
ADD CONSTRAINT check_subtotal_brl_non_negative CHECK (subtotal_brl >= 0),
ADD CONSTRAINT check_descuento_brl_non_negative CHECK (descuento_brl >= 0),
ADD CONSTRAINT check_total_brl_non_negative CHECK (total_brl >= 0);

-- Migrate existing sales to ARS
UPDATE sale
SET 
  moneda = 'ARS',
  precio_unitario_ars = precio_unitario,
  subtotal_ars = subtotal,
  descuento_ars = descuento,
  total_ars = total
WHERE total > 0;

-- Add comment to table
COMMENT ON TABLE sale IS 'Sales table with multi-currency support (ARS, USD, BRL) and discount tracking';

-- Add comments to new columns
COMMENT ON COLUMN sale.subtotal IS 'Subtotal before discount';
COMMENT ON COLUMN sale.descuento IS 'Discount amount applied';
COMMENT ON COLUMN sale.moneda IS 'Currency code used for this sale (ARS, USD, BRL)';

COMMENT ON COLUMN sale.precio_unitario_ars IS 'Unit price in Argentine Pesos';
COMMENT ON COLUMN sale.subtotal_ars IS 'Subtotal in Argentine Pesos';
COMMENT ON COLUMN sale.descuento_ars IS 'Discount in Argentine Pesos';
COMMENT ON COLUMN sale.total_ars IS 'Total in Argentine Pesos';

COMMENT ON COLUMN sale.precio_unitario_usd IS 'Unit price in US Dollars';
COMMENT ON COLUMN sale.subtotal_usd IS 'Subtotal in US Dollars';
COMMENT ON COLUMN sale.descuento_usd IS 'Discount in US Dollars';
COMMENT ON COLUMN sale.total_usd IS 'Total in US Dollars';

COMMENT ON COLUMN sale.precio_unitario_brl IS 'Unit price in Brazilian Reais';
COMMENT ON COLUMN sale.subtotal_brl IS 'Subtotal in Brazilian Reais';
COMMENT ON COLUMN sale.descuento_brl IS 'Discount in Brazilian Reais';
COMMENT ON COLUMN sale.total_brl IS 'Total in Brazilian Reais';
