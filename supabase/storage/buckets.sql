-- =====================================================
-- Storage: Buckets Configuration
-- Description: Storage buckets configuration reference
-- =====================================================

-- ⚠️ IMPORTANTE: Los buckets NO se pueden crear con SQL
-- Debes crearlos manualmente desde el Supabase Dashboard

-- PASOS PARA CREAR BUCKETS:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Navega a "Storage" en el menú lateral
-- 3. Click en "New bucket"
-- 4. Crea los siguientes buckets:

-- BUCKET 1: productos-images
-- - Name: productos-images
-- - Public: ✅ Habilitado
-- - File size limit: 5MB (opcional)
-- - Allowed MIME types: image/* (opcional)

-- BUCKET 2: promociones-images
-- - Name: promociones-images
-- - Public: ✅ Habilitado
-- - File size limit: 5MB (opcional)
-- - Allowed MIME types: image/* (opcional)

-- BUCKET 3: combos-images
-- - Name: combos-images
-- - Public: ✅ Habilitado
-- - File size limit: 5MB (opcional)
-- - Allowed MIME types: image/* (opcional)

-- Una vez creados los buckets, ejecuta supabase/storage/policies.sql
-- para aplicar las políticas de seguridad
