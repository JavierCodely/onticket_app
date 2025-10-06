/**
 * Migration: Add Multi-Currency Support to Combos
 * Description: Adds support for Pesos (ARS), Dólares (USD), and Reales (BRL) pricing
 * Date: 2025-10-06
 */

-- Add currency columns for precio_real (Pesos Argentinos - ARS)
ALTER TABLE combos
ADD COLUMN precio_real_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_combo_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add currency columns for precio_real (Dólares - USD)
ALTER TABLE combos
ADD COLUMN precio_real_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_combo_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add currency columns for precio_real (Reales Brasileños - BRL)
ALTER TABLE combos
ADD COLUMN precio_real_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_combo_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add constraints to ensure prices are non-negative
ALTER TABLE combos
ADD CONSTRAINT check_precio_real_ars_non_negative CHECK (precio_real_ars >= 0),
ADD CONSTRAINT check_precio_combo_ars_non_negative CHECK (precio_combo_ars >= 0),
ADD CONSTRAINT check_precio_real_usd_non_negative CHECK (precio_real_usd >= 0),
ADD CONSTRAINT check_precio_combo_usd_non_negative CHECK (precio_combo_usd >= 0),
ADD CONSTRAINT check_precio_real_brl_non_negative CHECK (precio_real_brl >= 0),
ADD CONSTRAINT check_precio_combo_brl_non_negative CHECK (precio_combo_brl >= 0);

-- Migrate existing prices to ARS (assuming current prices are in pesos)
UPDATE combos
SET 
  precio_real_ars = precio_real,
  precio_combo_ars = precio_combo
WHERE precio_real > 0 OR precio_combo > 0;

-- Add comment to table
COMMENT ON TABLE combos IS 'Combos table with multi-currency support (ARS, USD, BRL)';

-- Add comments to columns
COMMENT ON COLUMN combos.precio_real_ars IS 'Real price in Argentine Pesos';
COMMENT ON COLUMN combos.precio_combo_ars IS 'Combo price in Argentine Pesos';
COMMENT ON COLUMN combos.precio_real_usd IS 'Real price in US Dollars';
COMMENT ON COLUMN combos.precio_combo_usd IS 'Combo price in US Dollars';
COMMENT ON COLUMN combos.precio_real_brl IS 'Real price in Brazilian Reais';
COMMENT ON COLUMN combos.precio_combo_brl IS 'Combo price in Brazilian Reais';
