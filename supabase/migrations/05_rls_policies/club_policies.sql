-- =====================================================
-- RLS Policies: Club Table
-- Description: Row Level Security policies for club table
-- Order: 05.1
-- Dependencies: helper functions (get_user_club_id, is_admin)
-- =====================================================

-- Enable RLS on club table
ALTER TABLE club ENABLE ROW LEVEL SECURITY;

-- Users can only view their assigned club
CREATE POLICY "Users can view their own club"
    ON club FOR SELECT
    TO authenticated
    USING (id = get_user_club_id());

-- Only admins can update their club
CREATE POLICY "Admins can update their club"
    ON club FOR UPDATE
    TO authenticated
    USING (id = get_user_club_id() AND is_admin())
    WITH CHECK (id = get_user_club_id() AND is_admin());
