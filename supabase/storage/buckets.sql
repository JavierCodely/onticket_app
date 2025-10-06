-- =====================================================
-- Storage: Buckets Configuration
-- Description: Storage buckets configuration reference
-- =====================================================

-- ⚠️ IMPORTANTE: Los buckets NO se pueden crear con SQL
-- Debes crearlos manualmente desde el Supabase Dashboard

-- =====================================================
-- PASO A PASO PARA CREAR BUCKETS EN SUPABASE
-- =====================================================

-- 1. Ve a https://supabase.com y abre tu proyecto
-- 2. En el menú lateral izquierdo, click en "Storage"
-- 3. Click en el botón verde "New bucket"

-- =====================================================
-- BUCKET 1: productos-images
-- =====================================================
-- Configuración EXACTA (copiar estos valores):

-- Name: productos-images
-- Public bucket: ✅ ACTIVAR (muy importante - debe estar en ON)
-- File size limit: Dejar vacío o 5242880 (5MB en bytes)
-- Allowed MIME types: Dejar VACÍO (esto es CRÍTICO para evitar errores)

-- ⚠️ CRITICAL: NO pongas restricciones de MIME types en la configuración del bucket
-- Las validaciones de tipo de archivo se manejan en el código (storage.ts)

-- =====================================================
-- BUCKET 2: promociones-images
-- =====================================================
-- Name: promociones-images
-- Public bucket: ✅ ACTIVAR
-- File size limit: Dejar vacío
-- Allowed MIME types: Dejar VACÍO

-- =====================================================
-- BUCKET 3: combos-images
-- =====================================================
-- Name: combos-images
-- Public bucket: ✅ ACTIVAR
-- File size limit: Dejar vacío
-- Allowed MIME types: Dejar VACÍO

-- =====================================================
-- VERIFICAR CONFIGURACIÓN
-- =====================================================
-- Después de crear cada bucket:
-- 1. Click en el bucket recién creado
-- 2. Click en "Configuration" (icono de engranaje)
-- 3. Verificar que:
--    - Public bucket: ON (verde)
--    - Allowed MIME types: VACÍO (sin restricciones)

-- =====================================================
-- APLICAR POLÍTICAS DE SEGURIDAD
-- =====================================================
-- Una vez creados y verificados los 3 buckets:
-- 1. Ve a SQL Editor en Supabase
-- 2. Abre y ejecuta: supabase/storage/policies.sql
-- 3. Esto creará las políticas RLS para control de acceso

-- =====================================================
-- SOLUCIÓN DE PROBLEMAS
-- =====================================================
-- Si obtienes error "mime type image/png is not supported":
-- - Verifica que el bucket existe
-- - Verifica que "Public bucket" está en ON
-- - Verifica que "Allowed MIME types" está VACÍO
-- - Verifica que las políticas RLS están aplicadas
-- - Prueba subiendo una imagen diferente
