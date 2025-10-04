# Migraciones de Base de Datos - OnTicket

Este directorio contiene las migraciones de base de datos organizadas por categoría y orden de ejecución.

## Estructura de Directorios

```
migrations/
├── 01_schema/          # Tipos y enums personalizados
├── 02_tables/          # Definiciones de tablas
├── 03_functions/       # Funciones de PostgreSQL
├── 04_triggers/        # Triggers de base de datos
└── 05_rls_policies/    # Políticas de Row Level Security
```

## Orden de Ejecución

Las migraciones deben ejecutarse en el siguiente orden:

### 1. Schema (01_schema/)
- `types.sql` - Define tipos personalizados (rol_personal, categoria_producto)

### 2. Tables (02_tables/)
- `club.sql` - Tabla Club (tenant principal)
- `personal.sql` - Tabla Personal (staff vinculado a usuarios)
- `productos.sql` - Tabla Productos (inventario por club)
- `sale.sql` - Tabla Sale (registro de ventas)

### 3. Functions (03_functions/)
- `helper_functions.sql` - Funciones auxiliares para RLS
- `trigger_functions.sql` - Funciones utilizadas por triggers

### 4. Triggers (04_triggers/)
- `update_timestamps.sql` - Actualización automática de timestamps
- `calculate_totals.sql` - Cálculo automático de totales de venta
- `stock_management.sql` - Gestión automática de stock

### 5. RLS Policies (05_rls_policies/)
- `club_policies.sql` - Políticas de seguridad para tabla club
- `personal_policies.sql` - Políticas de seguridad para tabla personal
- `productos_policies.sql` - Políticas de seguridad para tabla productos
- `sale_policies.sql` - Políticas de seguridad para tabla sale

## Descripción del Sistema

### Arquitectura Multi-Tenant
El sistema utiliza la tabla `club` como tenant principal. Cada club está completamente aislado de otros clubs mediante Row Level Security (RLS).

### Roles de Usuario
- **Admin**: Acceso completo a todos los datos y operaciones de su club
- **Bartender**: Puede crear ventas y ver productos (el stock se descuenta automáticamente)
- **Seguridad**: Acceso limitado (a definir)
- **RRPP**: Acceso limitado (a definir)

### Características Principales
- **Aislamiento de datos**: RLS garantiza que cada club solo acceda a sus propios datos
- **Gestión automática de stock**: Los bartenders crean ventas y el stock se reduce automáticamente
- **Auditoría**: Timestamps automáticos en todas las tablas
- **Integridad**: Foreign keys y constraints para mantener consistencia

## Notas de Seguridad
- Todas las tablas tienen RLS habilitado
- Las funciones helper usan `SECURITY DEFINER` para acceso controlado
- Los usuarios solo pueden acceder a datos del club al que están asignados
- La asignación de usuarios a personal se hace manualmente vía código
