-- =====================================================
-- Triggers: Stock Management
-- Description: Trigger to automatically reduce stock on sales
-- Order: 04.3
-- Dependencies: reduce_stock_on_sale() function
-- =====================================================

-- Trigger to reduce stock after sale insert
CREATE TRIGGER reduce_stock_after_sale
    AFTER INSERT ON sale
    FOR EACH ROW
    EXECUTE FUNCTION reduce_stock_on_sale();
