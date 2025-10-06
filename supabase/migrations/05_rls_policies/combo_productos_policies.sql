-- =====================================================
-- RLS Policies: Combo_Productos Table
-- Description: Row Level Security policies for combo_productos table
-- Order: 05.7
-- Dependencies: helper functions (get_user_club_id, is_admin)
-- =====================================================

-- Enable RLS on combo_productos table
ALTER TABLE combo_productos ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view combo products from their club
CREATE POLICY "Users can view club combo products"
    ON combo_productos FOR SELECT
    TO authenticated
    USING (club_id = get_user_club_id());

-- Only admins can add products to combos in their club
CREATE POLICY "Admins can add products to combos"
    ON combo_productos FOR INSERT
    TO authenticated
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Only admins can update combo products
CREATE POLICY "Admins can update combo products"
    ON combo_productos FOR UPDATE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin())
    WITH CHECK (club_id = get_user_club_id() AND is_admin());

-- Only admins can delete combo products
CREATE POLICY "Admins can delete combo products"
    ON combo_productos FOR DELETE
    TO authenticated
    USING (club_id = get_user_club_id() AND is_admin());
