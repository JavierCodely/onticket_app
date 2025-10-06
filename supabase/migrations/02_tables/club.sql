-- =====================================================
-- Table: Club (Tenant)
-- Description: Club table representing each tenant in the system
-- Order: 02.1
-- =====================================================

CREATE TABLE club (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    ubicacion TEXT,
    cuenta_efectivo NUMERIC(12, 2) DEFAULT 0.00,
    cuenta_billetera_virtual NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on activo for faster queries
CREATE INDEX idx_club_activo ON club(activo);

-- Comments
COMMENT ON TABLE club IS 'Club/Venue table - represents each tenant in the multi-tenant system';
COMMENT ON COLUMN club.id IS 'Unique identifier for the club';
COMMENT ON COLUMN club.nombre IS 'Name of the club';
COMMENT ON COLUMN club.activo IS 'Whether the club is currently active';
COMMENT ON COLUMN club.ubicacion IS 'Physical location/address of the club';
COMMENT ON COLUMN club.cuenta_efectivo IS 'Cash account balance';
COMMENT ON COLUMN club.cuenta_billetera_virtual IS 'Virtual wallet account balance';
