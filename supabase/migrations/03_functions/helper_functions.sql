-- =====================================================
-- Functions: Helper Functions for RLS
-- Description: Functions to get user context for RLS policies
-- Order: 03.1
-- =====================================================

-- Get the club_id for the current authenticated user
CREATE OR REPLACE FUNCTION get_user_club_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT club_id
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_club_id() IS 'Returns the club_id of the authenticated user';


-- Get the role of the current authenticated user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS rol_personal AS $$
BEGIN
    RETURN (
        SELECT rol
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the authenticated user';


-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS 'Checks if the authenticated user is an Admin';


-- Check if user is bartender
CREATE OR REPLACE FUNCTION is_bartender()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'Bartender';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_bartender() IS 'Checks if the authenticated user is a Bartender';
