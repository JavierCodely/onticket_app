-- =====================================================
-- Functions: Promociones Helper Functions
-- Description: Functions for promotions validation and management
-- Order: 03.2
-- Dependencies: promociones table
-- =====================================================

-- Function to check if promotion can be deleted
CREATE OR REPLACE FUNCTION can_delete_promocion(promocion_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT cantidad_usos = 0
        FROM promociones
        WHERE id = promocion_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_delete_promocion(UUID) IS 'Checks if a promotion can be deleted (only if it has no uses)';


-- Function to check if promotion is available for use
CREATE OR REPLACE FUNCTION is_promocion_available(promocion_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    promo RECORD;
BEGIN
    SELECT activo, cantidad_usos, limite_usos
    INTO promo
    FROM promociones
    WHERE id = promocion_id;

    -- Promotion must be active
    IF NOT promo.activo THEN
        RETURN FALSE;
    END IF;

    -- Check if limit is reached (if limit exists)
    IF promo.limite_usos IS NOT NULL AND promo.cantidad_usos >= promo.limite_usos THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_promocion_available(UUID) IS 'Checks if a promotion is available for use (active and within limits)';


-- Function to increment promotion usage count
CREATE OR REPLACE FUNCTION increment_promocion_uso(promocion_id UUID, cantidad INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE promociones
    SET cantidad_usos = cantidad_usos + cantidad,
        updated_at = NOW()
    WHERE id = promocion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_promocion_uso(UUID, INTEGER) IS 'Increments the usage count of a promotion';
