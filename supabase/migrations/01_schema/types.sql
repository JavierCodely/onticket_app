-- =====================================================
-- Schema: Custom Types and Enums
-- Description: Define custom types for the application
-- Order: 01
-- =====================================================

-- Enum for Personal roles
CREATE TYPE rol_personal AS ENUM (
    'Admin',
    'Bartender',
    'Seguridad',
    'RRPP'
);

-- Enum for Producto categories
CREATE TYPE categoria_producto AS ENUM (
    'Vodka',
    'Vino',
    'Champan',
    'Tequila',
    'Sin Alcohol',
    'Cerveza',
    'Cocteles',
    'Otros'
);

-- Comments
COMMENT ON TYPE rol_personal IS 'Roles available for staff members';
COMMENT ON TYPE categoria_producto IS 'Product categories available in the system';
