-- =====================================================
-- Update: Personal Table
-- Description: Add nombre, apellido, edad, and fecha_cumpleanos columns
-- =====================================================

-- Add nombre column
ALTER TABLE personal
ADD COLUMN nombre TEXT;

-- Add apellido column
ALTER TABLE personal
ADD COLUMN apellido TEXT;

-- Add edad column
ALTER TABLE personal
ADD COLUMN edad INTEGER;

-- Add fecha_cumpleanos column
ALTER TABLE personal
ADD COLUMN fecha_cumpleanos DATE;

-- Add constraints for edad (must be reasonable if provided)
ALTER TABLE personal
ADD CONSTRAINT check_edad_valid CHECK (edad IS NULL OR (edad >= 18 AND edad <= 100));

-- Add comments for new columns
COMMENT ON COLUMN personal.nombre IS 'First name of the staff member';
COMMENT ON COLUMN personal.apellido IS 'Last name of the staff member';
COMMENT ON COLUMN personal.edad IS 'Age of the staff member (update manually as needed)';
COMMENT ON COLUMN personal.fecha_cumpleanos IS 'Birthday of the staff member';

-- Create index for birthday queries
CREATE INDEX idx_personal_fecha_cumpleanos ON personal(fecha_cumpleanos);
