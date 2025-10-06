# 🏗️ Arquitectura General

## Stack Tecnológico

### Frontend
- **React 19** - Framework de UI
- **TypeScript** - Type safety
- **Vite** - Build tool y dev server
- **shadcn/ui** - Componentes UI
- **Tailwind CSS v3** - Styling utility-first
- **react-hook-form** - Gestión de formularios
- **zod** - Validación de esquemas
- **lucide-react** - Iconos

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL - Base de datos relacional
  - Row Level Security (RLS) - Seguridad a nivel de fila
  - Storage - Almacenamiento de imágenes
  - Auth - Autenticación de usuarios
  - Realtime - Actualizaciones en tiempo real (opcional)

### Patterns & Architecture
- **Atomic Design** - Metodología de componentes
- **Multi-Tenancy** - Aislamiento por club con RLS
- **Type-Driven Development** - Todo tipado con TypeScript

---

## Principios Fundamentales

### 1. Multi-Tenancy con RLS

Cada **club** es un tenant completamente aislado:

```typescript
// ✅ CORRECTO: club_id se agrega automáticamente
const { data } = await supabase
  .from('productos')
  .select('*');
// RLS filtra automáticamente por club_id del usuario

// ✅ Al crear, siempre incluir club_id
const { error } = await supabase.from('productos').insert({
  club_id: user.club.id, // ← CRÍTICO
  nombre: 'Producto',
  // ... otros campos
});
```

**Ventajas:**
- Un solo esquema de base de datos
- Aislamiento automático por RLS
- No hay riesgo de ver datos de otros clubs
- Simplicidad en el código

### 2. Type Safety Total

Todo debe estar tipado explícitamente:

```typescript
// ❌ MAL: any implícito
const handleClick = (item) => { ... }

// ✅ BIEN: Tipo explícito
const handleClick = (item: Producto) => { ... }
```

**Estructura de tipos:**
```
types/database/
├── Auth/ - User, RolPersonal
├── Club/ - Club
├── Personal/ - Personal
├── Productos/ - Producto, ProductoInsert, ProductoUpdate
├── Combos/ - Combo, ComboInsert
├── Promociones/ - Promocion, PromocionInsert
└── Sale/ - Sale, SaleInsert
```

### 3. Atomic Design

Jerarquía clara de componentes:

```
Atoms → Molecules → Organisms → Templates → Pages
```

**Atoms:**
- Componentes básicos reutilizables
- Ej: `Button`, `Input`, `Badge`, `ImageUploader`

**Molecules:**
- Combinación de atoms
- Específicos de dominio
- Ej: `ProductCard`, `ProductForm`, `ProductFilters`

**Organisms:**
- Secciones completas
- Orquestan molecules
- Ej: `ProductGrid`, `ProductModal`

**Pages:**
- Vistas completas
- Lógica de negocio (CRUD)
- Ej: `ProductosPage`, `VentasPage`

### 4. Modularidad por Dominio

Cada dominio tiene su propia estructura:

```
components/
├── molecules/
│   ├── Productos/    # Todo de productos junto
│   ├── Combos/       # Todo de combos junto
│   └── Ventas/       # Todo de ventas junto
└── organisms/
    ├── Productos/
    ├── Combos/
    └── Ventas/
```

### 5. Multi-Moneda

Soporte nativo para 3 monedas:

- **ARS** (Peso Argentino) 🇦🇷
- **USD** (Dólar) 🇺🇸
- **BRL** (Real Brasileño) 🇧🇷

Campos en base de datos:
```sql
precio_compra_ars DECIMAL(10, 2)
precio_venta_ars DECIMAL(10, 2)
precio_compra_usd DECIMAL(10, 2)
precio_venta_usd DECIMAL(10, 2)
precio_compra_brl DECIMAL(10, 2)
precio_venta_brl DECIMAL(10, 2)
```

### 6. Formateo Regional

Los usuarios pueden elegir formato de números:

- **🇦🇷 Argentino**: `1.234,56`
- **🇪🇸 Español**: `1.234,56 US$`
- **🇺🇸 Inglés**: `1,234.56`

Se persiste en localStorage y afecta todos los números.

---

## Capas de la Aplicación

### 1. Capa de Datos (Supabase)
- PostgreSQL con RLS
- Funciones helper para lógica común
- Triggers para auto-cálculos
- Políticas RLS por tabla

### 2. Capa de Tipos (TypeScript)
- Interfaces para cada tabla
- Types para Insert/Update
- Types para FormData
- Enums para opciones

### 3. Capa de Componentes (React)
- Atoms: Componentes básicos
- Molecules: Componentes de dominio
- Organisms: Secciones completas
- Pages: Vistas con lógica

### 4. Capa de Contextos (React Context)
- AuthContext: Usuario y autenticación
- (Futuro) ThemeContext, CurrencyContext, etc.

### 5. Capa de Utilidades (lib/)
- supabase.ts: Cliente de Supabase
- storage.ts: Helpers de Storage
- utils.ts: Funciones genéricas

---

## Flujo de Datos

```
Usuario → Page → Organism → Molecule → Atom
                    ↓
                Supabase Client
                    ↓
                PostgreSQL + RLS
                    ↓
                Data filtrada por club_id
                    ↓
                Estado local (React)
                    ↓
                Re-render de UI
```

---

## Seguridad

### Row Level Security (RLS)

Todas las tablas multi-tenant tienen RLS:

```sql
-- Habilitar RLS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Política de lectura
CREATE POLICY "Users can view their club's data"
ON productos FOR SELECT
USING (club_id = get_user_club_id());

-- Política de escritura (solo Admin)
CREATE POLICY "Only admins can insert"
ON productos FOR INSERT
WITH CHECK (is_admin() AND club_id = get_user_club_id());
```

**Funciones helper:**
- `get_user_club_id()`: Retorna club_id del usuario actual
- `is_admin()`: Verifica si el usuario es Admin
- `user_has_role(rol)`: Verifica rol específico

### Validación

**Cliente (react-hook-form + zod):**
```typescript
const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  precio: z.number().min(0, 'Debe ser positivo'),
});
```

**Servidor (PostgreSQL Constraints):**
```sql
CHECK (precio_venta >= 0)
CHECK (stock >= 0)
CHECK (max_stock >= min_stock)
```

---

## Performance

### Optimizaciones Implementadas

1. **Índices en BD:**
```sql
CREATE INDEX idx_productos_club_id ON productos(club_id);
CREATE INDEX idx_productos_categoria ON productos(categoria);
```

2. **Consultas optimizadas:**
```typescript
// ✅ Select solo campos necesarios
.select('id, nombre, precio_venta')

// ✅ Limit y pagination
.range(0, 49) // Primeras 50 filas
```

3. **React.memo para listas:**
```typescript
export const ProductCard = React.memo(({ producto }) => {
  // ...
});
```

4. **Lazy loading de páginas:**
```typescript
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
```

---

## Próximos Pasos

- [ ] Implementar sistema de permisos granular
- [ ] Agregar más monedas
- [ ] Sistema de tasas de cambio automáticas
- [ ] Reportes y analytics
- [ ] PWA y offline-first
- [ ] Realtime updates con Supabase Realtime

---

[← Volver al Índice](./00_indice.md) | [Siguiente: Estructura de Archivos →](./02_estructura_archivos.md)
