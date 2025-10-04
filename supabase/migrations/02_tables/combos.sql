-- =====================================================
-- Table: Combos
-- Description: Product combos table for managing bundled product discounts
-- Order: 02.6
-- Dependencies: club, personal tables
-- =====================================================

CREATE TABLE combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    creado_por UUID NOT NULL REFERENCES personal(id) ON DELETE RESTRICT,
    nombre TEXT NOT NULL,
    precio_real NUMERIC(10, 2) NOT NULL,
    precio_combo NUMERIC(10, 2) NOT NULL,
    cantidad_usos INTEGER NOT NULL DEFAULT 0,
    limite_usos INTEGER,
    limite_usos_por_venta INTEGER NOT NULL DEFAULT 1,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure valid prices and limits
    CONSTRAINT check_combo_precio_real_positive CHECK (precio_real >= 0),
    CONSTRAINT check_combo_precio_combo_positive CHECK (precio_combo >= 0),
    CONSTRAINT check_combo_precio_combo_less_than_real CHECK (precio_combo < precio_real),
    CONSTRAINT check_combo_cantidad_usos_non_negative CHECK (cantidad_usos >= 0),
    CONSTRAINT check_combo_limite_usos_positive CHECK (limite_usos IS NULL OR limite_usos > 0),
    CONSTRAINT check_combo_limite_usos_por_venta_positive CHECK (limite_usos_por_venta > 0),
    CONSTRAINT check_combo_cantidad_usos_within_limit CHECK (limite_usos IS NULL OR cantidad_usos <= limite_usos)
);

-- Create indexes for faster queries
CREATE INDEX idx_combos_club_id ON combos(club_id);
CREATE INDEX idx_combos_creado_por ON combos(creado_por);
CREATE INDEX idx_combos_activo ON combos(activo);
CREATE INDEX idx_combos_created_at ON combos(created_at DESC);

-- Comments
COMMENT ON TABLE combos IS 'Combos table - manages product bundles with discounted prices';
COMMENT ON COLUMN combos.id IS 'Unique identifier for the combo';
COMMENT ON COLUMN combos.club_id IS 'Reference to the club that owns this combo';
COMMENT ON COLUMN combos.creado_por IS 'Reference to the admin who created the combo';
COMMENT ON COLUMN combos.nombre IS 'Name/description of the combo';
COMMENT ON COLUMN combos.precio_real IS 'Sum of regular prices of all products in the combo';
COMMENT ON COLUMN combos.precio_combo IS 'Discounted bundle price';
COMMENT ON COLUMN combos.cantidad_usos IS 'Number of times this combo has been used';
COMMENT ON COLUMN combos.limite_usos IS 'Maximum total uses allowed (NULL = unlimited)';
COMMENT ON COLUMN combos.limite_usos_por_venta IS 'Maximum uses per single sale transaction';
COMMENT ON COLUMN combos.activo IS 'Whether the combo is currently active';
