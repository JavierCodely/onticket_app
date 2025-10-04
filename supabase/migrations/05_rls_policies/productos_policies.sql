-- =====================================================
-- RLS Policies: Productos Table
-- Description: Row Level Security policies for productos table
-- Order: 05.3
-- Dependencies: helper functions (get_user_club_id, is_admin)
-- =====================================================

-- Enable RLS on productos table
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view products from their club
CREATE POLICY "Users can view club products"
    ON productos FOR SELECT
    TO authenticated
    USING (club_id = get_user_club_id());

-- Only admins can create products in their club
CREATE POLICY "Admins can create products"
    ON productos FOR INSERT
    TO authenticated
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Admins can update all product fields
-- Note: Bartenders reduce stock via the sale trigger, not direct updates
CREATE POLICY "Admins can update products"
    ON productos FOR UPDATE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin())
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Only admins can delete products
CREATE POLICY "Admins can delete products"
    ON productos FOR DELETE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin());
