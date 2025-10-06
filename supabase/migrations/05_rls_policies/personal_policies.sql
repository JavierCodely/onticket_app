-- =====================================================
-- RLS Policies: Personal Table
-- Description: Row Level Security policies for personal table
-- Order: 05.2
-- Dependencies: helper functions (get_user_club_id, is_admin)
-- =====================================================

-- Enable RLS on personal table
ALTER TABLE personal ENABLE ROW LEVEL SECURITY;

-- Users can view their own personal record
CREATE POLICY "Users can view their own record"
    ON personal FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all personnel in their club
CREATE POLICY "Admins can view club personnel"
    ON personal FOR SELECT
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin());

-- Admins can insert new personnel in their club
CREATE POLICY "Admins can insert club personnel"
    ON personal FOR INSERT
    TO authenticated
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Admins can update personnel in their club
CREATE POLICY "Admins can update club personnel"
    ON personal FOR UPDATE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin())
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Admins can delete personnel in their club
CREATE POLICY "Admins can delete club personnel"
    ON personal FOR DELETE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin());
