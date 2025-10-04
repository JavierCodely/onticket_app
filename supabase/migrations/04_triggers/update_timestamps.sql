-- =====================================================
-- Triggers: Update Timestamps
-- Description: Triggers to automatically update updated_at columns
-- Order: 04.1
-- Dependencies: update_updated_at_column() function
-- =====================================================

-- Trigger for club table
CREATE TRIGGER update_club_updated_at
    BEFORE UPDATE ON club
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for personal table
CREATE TRIGGER update_personal_updated_at
    BEFORE UPDATE ON personal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for productos table
CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
