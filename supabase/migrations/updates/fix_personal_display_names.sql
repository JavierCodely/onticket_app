-- =====================================================
-- Update: Fix Personal Display Names
-- Description: Update personal records without nombres/apellidos
-- This is optional - run only if you want default values for existing records
-- =====================================================

-- This update is optional and can be customized based on your needs
-- It sets default display names for personal records that don't have nombre/apellido

-- Example: Uncomment and customize as needed
-- UPDATE personal
-- SET 
--   nombre = COALESCE(nombre, 'Usuario'),
--   apellido = COALESCE(apellido, rol::text)
-- WHERE nombre IS NULL OR apellido IS NULL;

-- OR if you prefer to set names based on email from auth.users:
-- UPDATE personal p
-- SET 
--   nombre = COALESCE(p.nombre, SPLIT_PART(u.email, '@', 1)),
--   apellido = COALESCE(p.apellido, p.rol::text)
-- FROM auth.users u
-- WHERE p.user_id = u.id
--   AND (p.nombre IS NULL OR p.apellido IS NULL);

-- Note: This migration is just a template. 
-- You should manually update personal records with actual names through the admin UI.

