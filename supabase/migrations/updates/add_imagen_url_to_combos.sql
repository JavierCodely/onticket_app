/**
 * Migration: Add imagen_url to Combos
 * Description: Adds image URL support to combos table
 * Date: 2025-10-06
 */

-- Add imagen_url column to combos table
ALTER TABLE combos
ADD COLUMN imagen_url TEXT;

-- Add comment
COMMENT ON COLUMN combos.imagen_url IS 'URL of the combo image in storage';
