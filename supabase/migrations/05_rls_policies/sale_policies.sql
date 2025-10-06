-- =====================================================
-- RLS Policies: Sale Table
-- Description: Row Level Security policies for sale table
-- Order: 05.4
-- Dependencies: helper functions (get_user_club_id, is_admin, is_bartender)
-- =====================================================

-- Enable RLS on sale table
ALTER TABLE sale ENABLE ROW LEVEL SECURITY;

-- Users can view sales from their club
CREATE POLICY "Users can view club sales"
    ON sale FOR SELECT
    TO authenticated
    USING (club_id = get_user_club_id());

-- Bartenders and Admins can create sales in their club
CREATE POLICY "Bartenders and Admins can create sales"
    ON sale FOR INSERT
    TO authenticated
    WITH CHECK (
        club_id = get_user_club_id() AND
        (is_admin() OR is_bartender())
    );

-- Only admins can update sales
CREATE POLICY "Admins can update sales"
    ON sale FOR UPDATE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin())
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Only admins can delete sales
CREATE POLICY "Admins can delete sales"
    ON sale FOR DELETE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin());
