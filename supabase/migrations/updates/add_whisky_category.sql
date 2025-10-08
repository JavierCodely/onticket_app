-- =====================================================
-- Migration: Add Whisky Category
-- Description: Add 'Whisky' to categoria_producto ENUM
-- Date: 2025-10-08
-- =====================================================

-- Add 'Whisky' to the categoria_producto ENUM
ALTER TYPE categoria_producto ADD VALUE IF NOT EXISTS 'Whisky';

-- Update comment on the type
COMMENT ON TYPE categoria_producto IS 'Product categories available in the system: Vodka, Vino, Champan, Tequila, Sin Alcohol, Cerveza, Cocteles, Whisky, Otros';

