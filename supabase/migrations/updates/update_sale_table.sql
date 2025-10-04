-- =====================================================
-- Update: Sale Table
-- Description: Add comentarios, fecha_venta, and nombre_vendedor columns
-- =====================================================

-- Add comentarios column
ALTER TABLE sale
ADD COLUMN comentarios TEXT;

-- Add fecha_venta column (defaults to created_at for existing records)
ALTER TABLE sale
ADD COLUMN fecha_venta TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add nombre_vendedor column (stores seller name at time of sale)
ALTER TABLE sale
ADD COLUMN nombre_vendedor TEXT;

-- Add comments for new columns
COMMENT ON COLUMN sale.comentarios IS 'Optional comments or notes about the sale';
COMMENT ON COLUMN sale.fecha_venta IS 'Date and time when the sale was made';
COMMENT ON COLUMN sale.nombre_vendedor IS 'Name of the staff member who made the sale (snapshot at time of sale)';

-- Create index for fecha_venta for faster date-based queries
CREATE INDEX idx_sale_fecha_venta ON sale(fecha_venta DESC);
