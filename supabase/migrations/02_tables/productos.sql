-- =====================================================
-- Table: Productos
-- Description: Products table for managing inventory per club
-- Order: 02.3
-- Dependencies: club table
-- =====================================================

CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    categoria categoria_producto NOT NULL,
    precio_compra NUMERIC(10, 2) NOT NULL,
    precio_venta NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure valid prices and stock
    CONSTRAINT check_precio_compra_positive CHECK (precio_compra >= 0),
    CONSTRAINT check_precio_venta_positive CHECK (precio_venta >= 0),
    CONSTRAINT check_stock_non_negative CHECK (stock >= 0)
);

-- Create indexes for faster queries
CREATE INDEX idx_productos_club_id ON productos(club_id);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_nombre ON productos(nombre);

-- Comments
COMMENT ON TABLE productos IS 'Products table - manages inventory for each club';
COMMENT ON COLUMN productos.id IS 'Unique identifier for the product';
COMMENT ON COLUMN productos.club_id IS 'Reference to the club that owns this product';
COMMENT ON COLUMN productos.nombre IS 'Name of the product';
COMMENT ON COLUMN productos.categoria IS 'Category of the product';
COMMENT ON COLUMN productos.precio_compra IS 'Purchase price of the product';
COMMENT ON COLUMN productos.precio_venta IS 'Selling price of the product';
COMMENT ON COLUMN productos.stock IS 'Current stock quantity';
