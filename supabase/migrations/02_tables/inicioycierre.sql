-- =====================================================
-- Table: InicioCierre
-- Description: Inventory opening/closing tracking per product
-- Order: 02.8
-- Dependencies: club, productos tables
-- =====================================================

CREATE TABLE inicioycierre (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,

    -- Snapshot del producto al momento de inicio
    nombre_producto TEXT NOT NULL,
    categoria categoria_producto NOT NULL,

    -- Fechas
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,

    -- Stock tracking
    stock_inicio INTEGER NOT NULL,
    stock_cierre INTEGER,
    total_vendido INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN stock_cierre IS NULL THEN 0
            ELSE GREATEST(stock_inicio - stock_cierre, 0)
        END
    ) STORED,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_stock_inicio_non_negative CHECK (stock_inicio >= 0),
    CONSTRAINT check_stock_cierre_non_negative CHECK (stock_cierre IS NULL OR stock_cierre >= 0),
    CONSTRAINT check_fecha_cierre_after_inicio CHECK (fecha_cierre IS NULL OR fecha_cierre >= fecha_inicio)
);

-- Create indexes for faster queries
CREATE INDEX idx_inicioycierre_club_id ON inicioycierre(club_id);
CREATE INDEX idx_inicioycierre_producto_id ON inicioycierre(producto_id);
CREATE INDEX idx_inicioycierre_fecha_inicio ON inicioycierre(fecha_inicio DESC);
CREATE INDEX idx_inicioycierre_categoria ON inicioycierre(categoria);
CREATE INDEX idx_inicioycierre_club_fecha ON inicioycierre(club_id, fecha_inicio DESC);

-- Comments
COMMENT ON TABLE inicioycierre IS 'Inventory opening/closing tracking - records stock levels at start and end of periods';
COMMENT ON COLUMN inicioycierre.id IS 'Unique identifier for the opening/closing record';
COMMENT ON COLUMN inicioycierre.club_id IS 'Reference to the club that owns this record';
COMMENT ON COLUMN inicioycierre.producto_id IS 'Reference to the product being tracked';
COMMENT ON COLUMN inicioycierre.nombre_producto IS 'Snapshot of product name at time of opening (for historical tracking)';
COMMENT ON COLUMN inicioycierre.categoria IS 'Snapshot of product category at time of opening';
COMMENT ON COLUMN inicioycierre.fecha_inicio IS 'Timestamp when the opening was recorded';
COMMENT ON COLUMN inicioycierre.fecha_cierre IS 'Timestamp when the closing was recorded (NULL if not yet closed)';
COMMENT ON COLUMN inicioycierre.stock_inicio IS 'Stock quantity at opening time';
COMMENT ON COLUMN inicioycierre.stock_cierre IS 'Stock quantity at closing time (NULL if not yet closed)';
COMMENT ON COLUMN inicioycierre.total_vendido IS 'Calculated field: stock_inicio - stock_cierre (0 if not closed)';
