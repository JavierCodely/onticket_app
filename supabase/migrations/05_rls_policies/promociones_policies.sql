-- =====================================================
-- RLS Policies: Promociones Table
-- Description: Row Level Security policies for promociones table
-- Order: 05.5
-- Dependencies: helper functions (get_user_club_id, is_admin, can_delete_promocion)
-- =====================================================

-- Enable RLS on promociones table
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view promotions from their club
CREATE POLICY "Users can view club promotions"
    ON promociones FOR SELECT
    TO authenticated
    USING (club_id = get_user_club_id());

-- Only admins can create promotions in their club
CREATE POLICY "Admins can create promotions"
    ON promociones FOR INSERT
    TO authenticated
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Only admins can update promotions
CREATE POLICY "Admins can update promotions"
    ON promociones FOR UPDATE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin())
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Only admins can delete promotions (only if they have no uses)
CREATE POLICY "Admins can delete unused promotions"
    ON promociones FOR DELETE
    TO authenticated
    USING (
        club_id = get_user_club_id()
        AND is_admin()
        AND can_delete_promocion(id)
    );
