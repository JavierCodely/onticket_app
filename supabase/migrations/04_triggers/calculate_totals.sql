-- =====================================================
-- Triggers: Calculate Sale Totals
-- Description: Trigger to automatically calculate sale totals
-- Order: 04.2
-- Dependencies: calculate_sale_total() function
-- =====================================================

-- Trigger to calculate total before insert/update on sale
CREATE TRIGGER calculate_sale_total_trigger
    BEFORE INSERT OR UPDATE ON sale
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sale_total();
