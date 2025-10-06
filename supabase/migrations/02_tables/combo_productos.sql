-- =====================================================
-- Table: Combo_Productos
-- Description: Junction table for many-to-many relationship between combos and productos
-- Order: 02.7
-- Dependencies: club, combos, productos tables
-- =====================================================

CREATE TABLE combo_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure valid quantity
    CONSTRAINT check_combo_producto_cantidad_positive CHECK (cantidad > 0),

    -- Prevent duplicate products in same combo
    CONSTRAINT unique_combo_producto UNIQUE (combo_id, producto_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_combo_productos_club_id ON combo_productos(club_id);
CREATE INDEX idx_combo_productos_combo_id ON combo_productos(combo_id);
CREATE INDEX idx_combo_productos_producto_id ON combo_productos(producto_id);

-- Comments
COMMENT ON TABLE combo_productos IS 'Junction table linking combos with their products';
COMMENT ON COLUMN combo_productos.id IS 'Unique identifier for the combo-product relationship';
COMMENT ON COLUMN combo_productos.club_id IS 'Reference to the club (for RLS)';
COMMENT ON COLUMN combo_productos.combo_id IS 'Reference to the combo';
COMMENT ON COLUMN combo_productos.producto_id IS 'Reference to the product in the combo';
COMMENT ON COLUMN combo_productos.cantidad IS 'Quantity of this product included in the combo';
