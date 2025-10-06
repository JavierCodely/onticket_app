-- =====================================================
-- Update: Add min_stock and max_stock to productos
-- Description: Add minimum and maximum stock columns to productos table
-- Date: 2025-10-06
-- =====================================================

-- Add min_stock and max_stock columns to productos table
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS min_stock INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stock INTEGER NOT NULL DEFAULT 0;

-- Add check constraints to ensure valid values
ALTER TABLE productos
ADD CONSTRAINT check_min_stock_non_negative CHECK (min_stock >= 0),
ADD CONSTRAINT check_max_stock_non_negative CHECK (max_stock >= 0),
ADD CONSTRAINT check_max_stock_gte_min_stock CHECK (max_stock >= min_stock);

-- Add comments
COMMENT ON COLUMN productos.min_stock IS 'Minimum stock threshold - alert when stock reaches this level';
COMMENT ON COLUMN productos.max_stock IS 'Maximum stock capacity - used for stock planning';

-- Create index for low stock queries
CREATE INDEX IF NOT EXISTS idx_productos_low_stock ON productos(club_id, stock) WHERE stock <= min_stock AND min_stock > 0;

-- Optional: Add a function to check if product is low on stock
CREATE OR REPLACE FUNCTION is_low_stock(p_stock INTEGER, p_min_stock INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_min_stock > 0 AND p_stock <= p_min_stock;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_low_stock IS 'Helper function to check if a product is low on stock';

