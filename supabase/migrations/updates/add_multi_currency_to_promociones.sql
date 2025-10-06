/**
 * Migration: Add Multi-Currency Support to Promociones
 * Description: Adds support for Pesos (ARS), Dólares (USD), and Reales (BRL) pricing
 * Date: 2025-10-06
 */

-- Add currency columns for Pesos Argentinos (ARS)
ALTER TABLE promociones
ADD COLUMN precio_real_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_promocion_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add currency columns for Dólares (USD)
ALTER TABLE promociones
ADD COLUMN precio_real_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_promocion_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add currency columns for Reales Brasileños (BRL)
ALTER TABLE promociones
ADD COLUMN precio_real_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_promocion_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add constraints to ensure prices are non-negative
ALTER TABLE promociones
ADD CONSTRAINT check_precio_real_ars_non_negative CHECK (precio_real_ars >= 0),
ADD CONSTRAINT check_precio_promocion_ars_non_negative CHECK (precio_promocion_ars >= 0),
ADD CONSTRAINT check_precio_real_usd_non_negative CHECK (precio_real_usd >= 0),
ADD CONSTRAINT check_precio_promocion_usd_non_negative CHECK (precio_promocion_usd >= 0),
ADD CONSTRAINT check_precio_real_brl_non_negative CHECK (precio_real_brl >= 0),
ADD CONSTRAINT check_precio_promocion_brl_non_negative CHECK (precio_promocion_brl >= 0);

-- Migrate existing prices to ARS (assuming current prices are in pesos)
UPDATE promociones
SET 
  precio_real_ars = precio_real,
  precio_promocion_ars = precio_promocion
WHERE precio_real > 0 OR precio_promocion > 0;

-- Add comment to table
COMMENT ON TABLE promociones IS 'Promotions table with multi-currency support (ARS, USD, BRL)';

-- Add comments to columns
COMMENT ON COLUMN promociones.precio_real_ars IS 'Real price in Argentine Pesos';
COMMENT ON COLUMN promociones.precio_promocion_ars IS 'Promotional price in Argentine Pesos';
COMMENT ON COLUMN promociones.precio_real_usd IS 'Real price in US Dollars';
COMMENT ON COLUMN promociones.precio_promocion_usd IS 'Promotional price in US Dollars';
COMMENT ON COLUMN promociones.precio_real_brl IS 'Real price in Brazilian Reais';
COMMENT ON COLUMN promociones.precio_promocion_brl IS 'Promotional price in Brazilian Reais';
