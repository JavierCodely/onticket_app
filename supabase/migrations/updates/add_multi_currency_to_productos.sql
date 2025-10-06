/**
 * Migration: Add Multi-Currency Support to Productos
 * Description: Adds support for Pesos (ARS), Dólares (USD), and Reales (BRL) pricing
 * Date: 2025-10-06
 */

-- Add currency columns for Pesos Argentinos (ARS)
ALTER TABLE productos
ADD COLUMN precio_compra_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_venta_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add currency columns for Dólares (USD)
ALTER TABLE productos
ADD COLUMN precio_compra_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_venta_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add currency columns for Reales Brasileños (BRL)
ALTER TABLE productos
ADD COLUMN precio_compra_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_venta_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add constraints to ensure prices are non-negative
ALTER TABLE productos
ADD CONSTRAINT check_precio_compra_ars_non_negative CHECK (precio_compra_ars >= 0),
ADD CONSTRAINT check_precio_venta_ars_non_negative CHECK (precio_venta_ars >= 0),
ADD CONSTRAINT check_precio_compra_usd_non_negative CHECK (precio_compra_usd >= 0),
ADD CONSTRAINT check_precio_venta_usd_non_negative CHECK (precio_venta_usd >= 0),
ADD CONSTRAINT check_precio_compra_brl_non_negative CHECK (precio_compra_brl >= 0),
ADD CONSTRAINT check_precio_venta_brl_non_negative CHECK (precio_venta_brl >= 0);

-- Migrate existing prices to ARS (assuming current prices are in pesos)
UPDATE productos
SET 
  precio_compra_ars = precio_compra,
  precio_venta_ars = precio_venta
WHERE precio_compra > 0 OR precio_venta > 0;

-- Add comment to table
COMMENT ON TABLE productos IS 'Products table with multi-currency support (ARS, USD, BRL)';

-- Add comments to columns
COMMENT ON COLUMN productos.precio_compra_ars IS 'Purchase price in Argentine Pesos';
COMMENT ON COLUMN productos.precio_venta_ars IS 'Sale price in Argentine Pesos';
COMMENT ON COLUMN productos.precio_compra_usd IS 'Purchase price in US Dollars';
COMMENT ON COLUMN productos.precio_venta_usd IS 'Sale price in US Dollars';
COMMENT ON COLUMN productos.precio_compra_brl IS 'Purchase price in Brazilian Reais';
COMMENT ON COLUMN productos.precio_venta_brl IS 'Sale price in Brazilian Reais';

