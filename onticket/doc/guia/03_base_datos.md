# 🗄️ Base de Datos

## Tablas Principales

### 1. `club` - Tenants

**Descripción:** Representa cada club (tenant) en el sistema.

```sql
CREATE TABLE club (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  ubicacion TEXT,
  cuenta_efectivo NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cuenta_billetera_virtual NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos:**
- `nombre`: Nombre del club
- `activo`: Si el club está operativo
- `cuenta_efectivo`: Saldo actual en efectivo
- `cuenta_billetera_virtual`: Saldo en billetera virtual

---

### 2. `personal` - Usuarios y Roles

**Descripción:** Relaciona usuarios de Supabase Auth con clubs y roles.

```sql
CREATE TABLE personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  rol rol_personal NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, club_id)
);
```

**Roles disponibles (ENUM `rol_personal`):**
- `Admin`: Acceso completo
- `Bartender`: Ventas y operaciones
- `Seguridad`: Control de acceso
- `RRPP`: Relaciones públicas

**Campos:**
- `user_id`: Referencia a auth.users
- `club_id`: Club al que pertenece
- `rol`: Rol en el club
- `activo`: Si puede iniciar sesión

---

### 3. `productos` - Inventario

**Descripción:** Productos del inventario con soporte multi-moneda.

```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  categoria categoria_producto NOT NULL,

  -- Precios legacy
  precio_compra NUMERIC(10, 2) NOT NULL,
  precio_venta NUMERIC(10, 2) NOT NULL,

  -- Multi-Currency: ARS
  precio_compra_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  precio_venta_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL,

  -- Multi-Currency: USD
  precio_compra_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  precio_venta_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL,

  -- Multi-Currency: BRL
  precio_compra_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  precio_venta_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL,

  -- Stock
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  max_stock INTEGER NOT NULL DEFAULT 0,

  -- Imagen
  imagen_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_stock_non_negative CHECK (stock >= 0),
  CONSTRAINT check_min_stock_non_negative CHECK (min_stock >= 0),
  CONSTRAINT check_max_stock_non_negative CHECK (max_stock >= 0),
  CONSTRAINT check_max_stock_gte_min_stock CHECK (max_stock >= min_stock)
);
```

**Categorías (ENUM `categoria_producto`):**
`Vodka`, `Gin`, `Ron`, `Whisky`, `Cerveza`, `Fernet`, `Energizante`, `Gaseosa`, `Jugo`, `Agua`, `Otro`

**Índices:**
```sql
CREATE INDEX idx_productos_club_id ON productos(club_id);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_low_stock ON productos(club_id, stock)
  WHERE stock <= min_stock AND min_stock > 0;
```

---

### 4. `sale` - Ventas

**Descripción:** Registro de ventas con soporte multi-moneda.

```sql
CREATE TABLE sale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  personal_id UUID NOT NULL REFERENCES personal(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,

  -- Multi-Currency
  moneda TEXT CHECK (moneda IN ('ARS', 'USD', 'BRL')),
  subtotal_ars NUMERIC(12, 2),
  descuento_ars NUMERIC(12, 2),
  total_ars NUMERIC(12, 2),
  subtotal_usd NUMERIC(12, 2),
  descuento_usd NUMERIC(12, 2),
  total_usd NUMERIC(12, 2),
  subtotal_brl NUMERIC(12, 2),
  descuento_brl NUMERIC(12, 2),
  total_brl NUMERIC(12, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT check_cantidad_positive CHECK (cantidad > 0)
);
```

---

### 5. `promociones` - Promociones

**Descripción:** Promociones sobre productos individuales.

```sql
CREATE TABLE promociones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  creado_por UUID NOT NULL REFERENCES personal(id) ON DELETE RESTRICT,

  -- Precios
  precio_real NUMERIC(10, 2) NOT NULL,
  precio_promocion NUMERIC(10, 2) NOT NULL,

  -- Multi-Currency
  precio_promocional_ars DECIMAL(10, 2),
  precio_promocional_usd DECIMAL(10, 2),
  precio_promocional_brl DECIMAL(10, 2),

  -- Límites
  cantidad_usos INTEGER NOT NULL DEFAULT 0,
  limite_usos INTEGER,
  limite_usos_por_venta INTEGER NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT true,

  -- Imagen
  imagen_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT check_precio_promocion_less_than_real
    CHECK (precio_promocion < precio_real)
);
```

**Funciones helper:**
```sql
-- Verificar si se puede eliminar (sin usos)
can_delete_promocion(promocion_id UUID) RETURNS BOOLEAN

-- Verificar disponibilidad (activa y dentro de límites)
is_promocion_available(promocion_id UUID) RETURNS BOOLEAN

-- Incrementar uso
increment_promocion_uso(promocion_id UUID, cantidad INTEGER)
```

---

### 6. `combos` - Combos de Productos

**Descripción:** Paquetes de múltiples productos con descuento.

```sql
CREATE TABLE combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  creado_por UUID NOT NULL REFERENCES personal(id) ON DELETE RESTRICT,
  nombre TEXT NOT NULL,

  -- Precios
  precio_real NUMERIC(10, 2) NOT NULL,
  precio_combo NUMERIC(10, 2) NOT NULL,

  -- Multi-Currency
  precio_ars DECIMAL(10, 2),
  precio_usd DECIMAL(10, 2),
  precio_brl DECIMAL(10, 2),

  -- Límites
  cantidad_usos INTEGER NOT NULL DEFAULT 0,
  limite_usos INTEGER,
  limite_usos_por_venta INTEGER NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT true,

  -- Imagen
  imagen_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT check_combo_precio_combo_less_than_real
    CHECK (precio_combo < precio_real)
);
```

---

### 7. `combo_productos` - Productos en Combos

**Descripción:** Tabla intermedia (many-to-many) entre combos y productos.

```sql
CREATE TABLE combo_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT check_combo_producto_cantidad_positive CHECK (cantidad > 0),
  CONSTRAINT unique_combo_producto UNIQUE (combo_id, producto_id)
);
```

**Función helper:**
```sql
-- Obtener productos de un combo con detalles
get_combo_productos(combo_id UUID)
RETURNS TABLE (
  producto_id UUID,
  producto_nombre TEXT,
  cantidad INTEGER,
  precio_unitario NUMERIC
)
```

---

## Funciones Helper para RLS

### `get_user_club_id()`

Retorna el `club_id` del usuario actual autenticado.

```sql
CREATE FUNCTION get_user_club_id() RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT club_id
    FROM personal
    WHERE user_id = auth.uid()
    AND activo = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `is_admin()`

Verifica si el usuario actual es Admin.

```sql
CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) > 0
    FROM personal
    WHERE user_id = auth.uid()
    AND rol = 'Admin'
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `user_has_role(rol_personal)`

Verifica si el usuario tiene un rol específico.

```sql
CREATE FUNCTION user_has_role(required_rol rol_personal)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) > 0
    FROM personal
    WHERE user_id = auth.uid()
    AND rol = required_rol
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `is_low_stock(p_stock INTEGER, p_min_stock INTEGER)`

Verifica si un producto tiene stock bajo.

```sql
CREATE FUNCTION is_low_stock(p_stock INTEGER, p_min_stock INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_min_stock > 0 AND p_stock <= p_min_stock;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Row Level Security (RLS)

### Patrón General

**Todas las tablas multi-tenant deben seguir este patrón:**

```sql
-- 1. Habilitar RLS
ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;

-- 2. Política de SELECT (todos los usuarios pueden ver su club)
CREATE POLICY "[tabla]_select_policy"
ON [tabla] FOR SELECT
USING (club_id = get_user_club_id());

-- 3. Política de INSERT (solo Admin)
CREATE POLICY "[tabla]_insert_policy"
ON [tabla] FOR INSERT
WITH CHECK (
  is_admin() AND
  club_id = get_user_club_id()
);

-- 4. Política de UPDATE (solo Admin)
CREATE POLICY "[tabla]_update_policy"
ON [tabla] FOR UPDATE
USING (club_id = get_user_club_id() AND is_admin());

-- 5. Política de DELETE (solo Admin)
CREATE POLICY "[tabla]_delete_policy"
ON [tabla] FOR DELETE
USING (club_id = get_user_club_id() AND is_admin());
```

### Ejemplo Completo: Productos

```sql
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos pueden ver productos de su club
CREATE POLICY "productos_select_policy"
ON productos FOR SELECT
USING (club_id = get_user_club_id());

-- INSERT: Solo Admin puede crear productos
CREATE POLICY "productos_insert_policy"
ON productos FOR INSERT
WITH CHECK (is_admin() AND club_id = get_user_club_id());

-- UPDATE: Solo Admin puede actualizar productos
CREATE POLICY "productos_update_policy"
ON productos FOR UPDATE
USING (club_id = get_user_club_id() AND is_admin());

-- DELETE: Solo Admin puede eliminar productos
CREATE POLICY "productos_delete_policy"
ON productos FOR DELETE
USING (club_id = get_user_club_id() AND is_admin());
```

---

## Orden de Ejecución de Migraciones

**Ejecutar en Supabase SQL Editor en este orden:**

```bash
# 1. Schema (Tipos)
01_schema/types.sql

# 2. Tablas
02_tables/club.sql
02_tables/personal.sql
02_tables/productos.sql
02_tables/sale.sql
02_tables/promociones.sql
02_tables/combos.sql
02_tables/combo_productos.sql

# 3. Funciones
03_functions/helper_functions.sql
03_functions/trigger_functions.sql
03_functions/promociones_functions.sql
03_functions/combos_functions.sql

# 4. Triggers
04_triggers/update_timestamps.sql
04_triggers/calculate_totals.sql
04_triggers/stock_management.sql

# 5. RLS Policies
05_rls_policies/club_policies.sql
05_rls_policies/personal_policies.sql
05_rls_policies/productos_policies.sql
05_rls_policies/sale_policies.sql
05_rls_policies/promociones_policies.sql
05_rls_policies/combos_policies.sql
05_rls_policies/combo_productos_policies.sql

# 6. Updates (Multi-moneda, Stock, Imágenes)
updates/add_multi_currency_to_productos.sql
updates/add_multi_currency_to_combos.sql
updates/add_multi_currency_to_promociones.sql
updates/add_multi_currency_to_sale.sql
updates/add_min_max_stock_to_productos.sql
updates/add_imagen_url_columns.sql

# 7. Storage Policies
../storage/policies.sql
```

---

## Verificación de Base de Datos

```sql
-- Verificar todas las tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'club', 'personal', 'productos', 'sale',
  'promociones', 'combos', 'combo_productos'
);

-- Verificar RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'club', 'personal', 'productos', 'sale',
  'promociones', 'combos', 'combo_productos'
);

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

[← Volver al Índice](./00_indice.md) | [Siguiente: Autenticación →](./04_autenticacion.md)
