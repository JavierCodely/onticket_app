-- =====================================================
-- RLS Policies: Combos Table
-- Description: Row Level Security policies for combos table
-- Order: 05.6
-- Dependencies: helper functions (get_user_club_id, is_admin, can_delete_combo)
-- =====================================================

-- Enable RLS on combos table
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view combos from their club
CREATE POLICY "Users can view club combos"
    ON combos FOR SELECT
    TO authenticated
    USING (club_id = get_user_club_id());

-- Only admins can create combos in their club
CREATE POLICY "Admins can create combos"
    ON combos FOR INSERT
    TO authenticated
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Only admins can update combos
CREATE POLICY "Admins can update combos"
    ON combos FOR UPDATE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin())
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Only admins can delete combos (only if they have no uses)
CREATE POLICY "Admins can delete unused combos"
    ON combos FOR DELETE
    TO authenticated
    USING (
        club_id = get_user_club_id()
        AND is_admin()
        AND can_delete_combo(id)
    );
