-- =====================================================
-- Realtime: Enable Real-time Updates
-- Description: Enable real-time subscriptions for sale and productos tables
-- Order: 06.1
-- Dependencies: sale, productos tables
-- =====================================================

-- Enable realtime for sale table (ventas)
ALTER PUBLICATION supabase_realtime ADD TABLE sale;

-- Enable realtime for productos table (stock updates)
ALTER PUBLICATION supabase_realtime ADD TABLE productos;

-- Enable realtime for promociones table
ALTER PUBLICATION supabase_realtime ADD TABLE promociones;

-- Enable realtime for combos table
ALTER PUBLICATION supabase_realtime ADD TABLE combos;

-- Enable realtime for combo_productos table
ALTER PUBLICATION supabase_realtime ADD TABLE combo_productos;

-- Comments
COMMENT ON PUBLICATION supabase_realtime IS 'Real-time publication for sales, stock, promotions and combos updates';
