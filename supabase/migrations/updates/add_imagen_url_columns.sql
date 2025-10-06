-- =====================================================
-- Update: Add imagen_url columns
-- Description: Add image URL columns to productos, promociones, and combos tables
-- =====================================================

-- Add imagen_url column to productos table
ALTER TABLE productos
ADD COLUMN imagen_url TEXT;

COMMENT ON COLUMN productos.imagen_url IS 'URL of the product image stored in Supabase Storage';

-- Add imagen_url column to promociones table
ALTER TABLE promociones
ADD COLUMN imagen_url TEXT;

COMMENT ON COLUMN promociones.imagen_url IS 'URL of the promotion image stored in Supabase Storage';

-- Add imagen_url column to combos table
ALTER TABLE combos
ADD COLUMN imagen_url TEXT;

COMMENT ON COLUMN combos.imagen_url IS 'URL of the combo image stored in Supabase Storage';
