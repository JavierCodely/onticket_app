-- =====================================================
-- Table: Sale
-- Description: Sales/transactions table for tracking product sales
-- Order: 02.4
-- Dependencies: club, productos, personal tables
-- =====================================================

CREATE TABLE sale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    personal_id UUID NOT NULL REFERENCES personal(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure valid quantities and prices
    CONSTRAINT check_cantidad_positive CHECK (cantidad > 0),
    CONSTRAINT check_precio_unitario_positive CHECK (precio_unitario >= 0),
    CONSTRAINT check_total_positive CHECK (total >= 0)
);

-- Create indexes for faster queries
CREATE INDEX idx_sale_club_id ON sale(club_id);
CREATE INDEX idx_sale_producto_id ON sale(producto_id);
CREATE INDEX idx_sale_personal_id ON sale(personal_id);
CREATE INDEX idx_sale_created_at ON sale(created_at DESC);

-- Comments
COMMENT ON TABLE sale IS 'Sales table - tracks all product sales transactions';
COMMENT ON COLUMN sale.id IS 'Unique identifier for the sale';
COMMENT ON COLUMN sale.club_id IS 'Reference to the club where the sale occurred';
COMMENT ON COLUMN sale.producto_id IS 'Reference to the product sold';
COMMENT ON COLUMN sale.personal_id IS 'Reference to the staff member who made the sale';
COMMENT ON COLUMN sale.cantidad IS 'Quantity of product sold';
COMMENT ON COLUMN sale.precio_unitario IS 'Unit price at the time of sale';
COMMENT ON COLUMN sale.total IS 'Total amount of the sale (auto-calculated)';
