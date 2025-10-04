-- =====================================================
-- Table: Personal (Staff)
-- Description: Personal/staff table linking auth.users to clubs with roles
-- Order: 02.2
-- Dependencies: club table
-- =====================================================

CREATE TABLE personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    rol rol_personal NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure a user can only be assigned once per club
    CONSTRAINT unique_user_per_club UNIQUE(user_id, club_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_personal_user_id ON personal(user_id);
CREATE INDEX idx_personal_club_id ON personal(club_id);
CREATE INDEX idx_personal_rol ON personal(rol);
CREATE INDEX idx_personal_activo ON personal(activo);

-- Comments
COMMENT ON TABLE personal IS 'Staff/personnel table linking authenticated users to clubs with specific roles';
COMMENT ON COLUMN personal.id IS 'Unique identifier for the personnel record';
COMMENT ON COLUMN personal.user_id IS 'Reference to auth.users - assigned manually via code';
COMMENT ON COLUMN personal.club_id IS 'Reference to the club this staff member belongs to';
COMMENT ON COLUMN personal.rol IS 'Role of the staff member (Admin, Bartender, Seguridad, RRPP)';
COMMENT ON COLUMN personal.activo IS 'Whether the staff member is active - inactive users cannot login';
COMMENT ON CONSTRAINT unique_user_per_club ON personal IS 'Ensures a user can only have one role per club';
