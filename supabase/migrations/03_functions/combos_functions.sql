-- =====================================================
-- Functions: Combos Helper Functions
-- Description: Functions for combos validation and management
-- Order: 03.3
-- Dependencies: combos table
-- =====================================================

-- Function to check if combo can be deleted
CREATE OR REPLACE FUNCTION can_delete_combo(combo_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT cantidad_usos = 0
        FROM combos
        WHERE id = combo_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_delete_combo(UUID) IS 'Checks if a combo can be deleted (only if it has no uses)';


-- Function to check if combo is available for use
CREATE OR REPLACE FUNCTION is_combo_available(combo_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    combo_record RECORD;
BEGIN
    SELECT activo, cantidad_usos, limite_usos
    INTO combo_record
    FROM combos
    WHERE id = combo_id;

    -- Combo must be active
    IF NOT combo_record.activo THEN
        RETURN FALSE;
    END IF;

    -- Check if limit is reached (if limit exists)
    IF combo_record.limite_usos IS NOT NULL AND combo_record.cantidad_usos >= combo_record.limite_usos THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_combo_available(UUID) IS 'Checks if a combo is available for use (active and within limits)';


-- Function to increment combo usage count
CREATE OR REPLACE FUNCTION increment_combo_uso(combo_id UUID, cantidad INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE combos
    SET cantidad_usos = cantidad_usos + cantidad,
        updated_at = NOW()
    WHERE id = combo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_combo_uso(UUID, INTEGER) IS 'Increments the usage count of a combo';


-- Function to get combo products with details
CREATE OR REPLACE FUNCTION get_combo_productos(combo_id UUID)
RETURNS TABLE (
    producto_id UUID,
    producto_nombre TEXT,
    cantidad INTEGER,
    precio_unitario NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS producto_id,
        p.nombre AS producto_nombre,
        cp.cantidad,
        p.precio_venta AS precio_unitario
    FROM combo_productos cp
    JOIN productos p ON cp.producto_id = p.id
    WHERE cp.combo_id = get_combo_productos.combo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_combo_productos(UUID) IS 'Returns all products in a combo with their details';
