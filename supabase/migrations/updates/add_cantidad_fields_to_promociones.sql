-- =====================================================
-- Update: Add cantidad_minima and cantidad_maxima to promociones
-- Description: Adds quantity range fields to promotions
-- Date: 2025-10-07
-- =====================================================

-- Add cantidad_minima and cantidad_maxima columns
ALTER TABLE promociones
ADD COLUMN cantidad_minima INTEGER NOT NULL DEFAULT 1,
ADD COLUMN cantidad_maxima INTEGER;

-- Add constraints
ALTER TABLE promociones
ADD CONSTRAINT check_cantidad_minima_positive CHECK (cantidad_minima > 0),
ADD CONSTRAINT check_cantidad_maxima_positive CHECK (cantidad_maxima IS NULL OR cantidad_maxima > 0),
ADD CONSTRAINT check_cantidad_maxima_greater_than_minima CHECK (cantidad_maxima IS NULL OR cantidad_maxima >= cantidad_minima);

-- Add comments
COMMENT ON COLUMN promociones.cantidad_minima IS 'Minimum quantity required to activate the promotion';
COMMENT ON COLUMN promociones.cantidad_maxima IS 'Maximum quantity allowed for the promotion (NULL = unlimited)';
