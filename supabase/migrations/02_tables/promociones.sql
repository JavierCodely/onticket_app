-- =====================================================
-- Table: Promociones
-- Description: Promotions table for managing discounted products
-- Order: 02.5
-- Dependencies: club, productos, personal tables
-- =====================================================

CREATE TABLE promociones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    creado_por UUID NOT NULL REFERENCES personal(id) ON DELETE RESTRICT,
    precio_real NUMERIC(10, 2) NOT NULL,
    precio_promocion NUMERIC(10, 2) NOT NULL,
    cantidad_usos INTEGER NOT NULL DEFAULT 0,
    limite_usos INTEGER,
    limite_usos_por_venta INTEGER NOT NULL DEFAULT 1,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure valid prices and limits
    CONSTRAINT check_precio_real_positive CHECK (precio_real >= 0),
    CONSTRAINT check_precio_promocion_positive CHECK (precio_promocion >= 0),
    CONSTRAINT check_precio_promocion_less_than_real CHECK (precio_promocion < precio_real),
    CONSTRAINT check_cantidad_usos_non_negative CHECK (cantidad_usos >= 0),
    CONSTRAINT check_limite_usos_positive CHECK (limite_usos IS NULL OR limite_usos > 0),
    CONSTRAINT check_limite_usos_por_venta_positive CHECK (limite_usos_por_venta > 0),
    CONSTRAINT check_cantidad_usos_within_limit CHECK (limite_usos IS NULL OR cantidad_usos <= limite_usos)
);

-- Create indexes for faster queries
CREATE INDEX idx_promociones_club_id ON promociones(club_id);
CREATE INDEX idx_promociones_producto_id ON promociones(producto_id);
CREATE INDEX idx_promociones_creado_por ON promociones(creado_por);
CREATE INDEX idx_promociones_activo ON promociones(activo);
CREATE INDEX idx_promociones_created_at ON promociones(created_at DESC);

-- Comments
COMMENT ON TABLE promociones IS 'Promotions table - manages product discounts and special offers';
COMMENT ON COLUMN promociones.id IS 'Unique identifier for the promotion';
COMMENT ON COLUMN promociones.club_id IS 'Reference to the club that owns this promotion';
COMMENT ON COLUMN promociones.producto_id IS 'Reference to the product being promoted';
COMMENT ON COLUMN promociones.creado_por IS 'Reference to the admin who created the promotion';
COMMENT ON COLUMN promociones.precio_real IS 'Original price of the product';
COMMENT ON COLUMN promociones.precio_promocion IS 'Discounted price for the promotion';
COMMENT ON COLUMN promociones.cantidad_usos IS 'Number of times this promotion has been used';
COMMENT ON COLUMN promociones.limite_usos IS 'Maximum total uses allowed (NULL = unlimited)';
COMMENT ON COLUMN promociones.limite_usos_por_venta IS 'Maximum uses per single sale transaction';
COMMENT ON COLUMN promociones.activo IS 'Whether the promotion is currently active';
