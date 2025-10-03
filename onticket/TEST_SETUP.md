# Guía de Pruebas - OnTicket

## Problema: "Queda en Iniciando sesión..."

Esto ocurre cuando:
1. Las tablas de la base de datos no existen
2. El usuario no tiene un registro en la tabla `personal`
3. El usuario está inactivo (`activo = false`)
4. Las credenciales de Supabase son incorrectas

## Verificación Rápida

### 1. Abrir la consola del navegador (F12)

Verás mensajes de debug que indican el problema:
- `"Initializing authentication..."` - Comenzando verificación
- `"Session: null"` - No hay sesión activa
- `"Error fetching personal data"` - La tabla no existe o el usuario no está en personal

### 2. Verificar Variables de Entorno

Archivo: `.env.local`

```env
VITE_SUPABASE_URL=https://tvcpbeqwitxdomngvxuz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ Las variables están configuradas correctamente

### 3. Ejecutar Migraciones en Supabase

**IMPORTANTE**: Las migraciones DEBEN ejecutarse en orden

#### Paso 1: Ir a Supabase SQL Editor
1. Abrir https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a "SQL Editor" en el menú lateral

#### Paso 2: Ejecutar migraciones EN ORDEN

**Orden 1: Schema (Tipos)**
```sql
-- Copiar y ejecutar: supabase/migrations/01_schema/types.sql
```

**Orden 2: Tablas**
```sql
-- Ejecutar EN ORDEN:
-- 1. supabase/migrations/02_tables/club/club.sql
-- 2. supabase/migrations/02_tables/personal/personal.sql
-- 3. supabase/migrations/02_tables/productos/productos.sql
-- 4. supabase/migrations/02_tables/sales/sale.sql
```

**Orden 3: Funciones**
```sql
-- Ejecutar EN ORDEN:
-- 1. supabase/migrations/03_functions/helper_functions.sql
-- 2. supabase/migrations/03_functions/trigger_functions.sql
```

**Orden 4: Triggers**
```sql
-- Ejecutar EN ORDEN:
-- 1. supabase/migrations/04_triggers/update_timestamps.sql
-- 2. supabase/migrations/04_triggers/calculate_totals.sql
-- 3. supabase/migrations/04_triggers/stock_management.sql
```

**Orden 5: RLS Policies**
```sql
-- Ejecutar EN ORDEN:
-- 1. supabase/migrations/05_rls_policies/club_policies.sql
-- 2. supabase/migrations/05_rls_policies/personal_policies.sql
-- 3. supabase/migrations/05_rls_policies/productos_policies.sql
-- 4. supabase/migrations/05_rls_policies/sale_policies.sql
```

### 4. Crear Usuario de Prueba

#### Paso 1: Crear usuario en Authentication
En Supabase Dashboard → Authentication → Users → Add User

```
Email: admin@test.com
Password: 123456
```

Copia el UUID del usuario creado (ejemplo: `a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6`)

#### Paso 2: Crear un Club

En SQL Editor:

```sql
INSERT INTO club (nombre, activo, ubicacion, cuenta_efectivo, cuenta_billetera_virtual)
VALUES ('Club Demo', true, 'Buenos Aires', 0.00, 0.00)
RETURNING id;
```

Copia el ID del club creado (ejemplo: `b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7`)

#### Paso 3: Asignar usuario a Personal

```sql
INSERT INTO personal (user_id, club_id, rol, activo)
VALUES (
  'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', -- UUID del usuario de Auth
  'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7', -- UUID del club
  'Admin',
  true
);
```

## 5. Probar Login

1. Recargar la aplicación (F5)
2. Usar credenciales:
   - Email: `admin@test.com`
   - Password: `123456`

3. Si todo está bien, deberías ver en la consola:
   ```
   Initializing authentication...
   Session: null
   No active session
   Setting loading to false
   Attempting login with: admin@test.com
   Fetching user role for: a1b2c3d4-...
   Personal data fetched: {id: "...", user_id: "...", rol: "Admin", activo: true}
   Club data fetched: {id: "...", nombre: "Club Demo", activo: true}
   User data assembled: {...}
   Login result: Success
   ```

4. Serás redirigido a `/admin` (Dashboard de Admin)

## Solución de Problemas Comunes

### Error: "Code 42P01: relation 'personal' does not exist"
**Causa**: Las tablas no fueron creadas
**Solución**: Ejecutar migraciones en orden (ver paso 3)

### Error: "No personal data found for user"
**Causa**: El usuario no está en la tabla `personal`
**Solución**: Ejecutar el INSERT de personal (paso 4.3)

### Error: "User is inactive"
**Causa**: El campo `activo` es `false`
**Solución**: Actualizar:
```sql
UPDATE personal SET activo = true WHERE user_id = 'tu-user-id';
```

### Queda cargando infinitamente
**Causa**: Las variables de entorno no están cargadas o son incorrectas
**Solución**:
1. Verificar `.env.local` existe
2. Reiniciar el servidor de desarrollo (`npm run dev`)
3. Verificar que las variables empiecen con `VITE_`

## Verificar que Todo Funciona

Ejecuta esta query en SQL Editor:

```sql
-- Verificar tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('club', 'personal', 'productos', 'sale');

-- Debe retornar 4 filas

-- Verificar usuario de prueba
SELECT
  p.*,
  c.nombre as club_nombre,
  au.email
FROM personal p
JOIN club c ON c.id = p.club_id
JOIN auth.users au ON au.id = p.user_id;

-- Debe mostrar tu usuario de prueba con su club
```

Si ambas queries funcionan, ¡estás listo para usar la aplicación! 🎉
