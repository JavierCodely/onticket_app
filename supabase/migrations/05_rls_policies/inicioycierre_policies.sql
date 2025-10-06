-- =====================================================
-- RLS Policies: InicioCierre
-- Description: Row Level Security policies for inventory opening/closing
-- Order: 05.8
-- Dependencies: inicioycierre table, helper_functions
-- =====================================================

-- Enable RLS
ALTER TABLE inicioycierre ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SELECT Policies
-- =====================================================

-- All authenticated users can view their club's opening/closing records
CREATE POLICY "inicioycierre_select_policy"
ON inicioycierre FOR SELECT
USING (club_id = get_user_club_id());

-- =====================================================
-- INSERT Policies
-- =====================================================

-- Only Admin can create new opening records
CREATE POLICY "inicioycierre_insert_policy"
ON inicioycierre FOR INSERT
WITH CHECK (
  is_admin() AND
  club_id = get_user_club_id()
);

-- =====================================================
-- UPDATE Policies
-- =====================================================

-- Only Admin can update opening/closing records
-- Typically used to set fecha_cierre and stock_cierre
CREATE POLICY "inicioycierre_update_policy"
ON inicioycierre FOR UPDATE
USING (
  club_id = get_user_club_id() AND
  is_admin()
);

-- =====================================================
-- DELETE Policies
-- =====================================================

-- Only Admin can delete opening/closing records
CREATE POLICY "inicioycierre_delete_policy"
ON inicioycierre FOR DELETE
USING (
  club_id = get_user_club_id() AND
  is_admin()
);

-- Comments
COMMENT ON POLICY "inicioycierre_select_policy" ON inicioycierre IS 'Allow all users to view their club opening/closing records';
COMMENT ON POLICY "inicioycierre_insert_policy" ON inicioycierre IS 'Only Admin can create opening records';
COMMENT ON POLICY "inicioycierre_update_policy" ON inicioycierre IS 'Only Admin can update opening/closing records';
COMMENT ON POLICY "inicioycierre_delete_policy" ON inicioycierre IS 'Only Admin can delete opening/closing records';
