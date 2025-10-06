# 📦 Inicio/Cierre - Configuración

Sistema de seguimiento de inventario para registrar stock inicial y final de productos.

## 🗄️ Migraciones de Base de Datos

Ejecutar en **Supabase SQL Editor** en el siguiente orden:

### 1. Crear Tabla `inicioycierre`

```sql
-- Archivo: 02_tables/inicioycierre.sql
```

Esta tabla almacena:
- **producto_id**: Referencia al producto
- **nombre_producto**: Snapshot del nombre (para historial)
- **categoria**: Snapshot de categoría
- **fecha_inicio**: Fecha/hora de inicio
- **fecha_cierre**: Fecha/hora de cierre (NULL si aún está abierto)
- **stock_inicio**: Stock al momento de inicio
- **stock_cierre**: Stock al momento de cierre (NULL si no cerrado)
- **total_vendido**: Campo calculado automáticamente (stock_inicio - stock_cierre)

### 2. Crear Políticas RLS

```sql
-- Archivo: 05_rls_policies/inicioycierre_policies.sql
```

Políticas implementadas:
- **SELECT**: Todos los usuarios pueden ver registros de su club
- **INSERT**: Solo Admin puede crear registros de inicio
- **UPDATE**: Solo Admin puede registrar cierres
- **DELETE**: Solo Admin puede eliminar registros

## ✅ Verificación de Instalación

Ejecutar en Supabase SQL Editor:

```sql
-- Verificar que la tabla existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'inicioycierre';

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'inicioycierre';

-- Verificar políticas RLS
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'inicioycierre'
ORDER BY policyname;
```

Deberías ver:
- ✅ Tabla `inicioycierre` existe
- ✅ RLS habilitado (`rowsecurity = true`)
- ✅ 4 políticas: select, insert, update, delete

## 📱 Funcionalidad Frontend

### Características Implementadas

1. **Registrar Inicio**
   - Crea un registro para TODOS los productos
   - Captura el stock actual como `stock_inicio`
   - Fecha/hora automática

2. **Registrar Cierre**
   - Actualiza un registro existente
   - Captura el stock actual como `stock_cierre`
   - Calcula automáticamente `total_vendido`

3. **Filtros**
   - Por rango de fechas (desde/hasta)
   - Por categoría de producto
   - Botón limpiar filtros

4. **Exportación CSV**
   - Exporta registros filtrados
   - Formato: Producto, Categoría, Fechas, Stocks, Total Vendido

### Flujo de Uso

1. **Inicio de Turno/Día**
   - Admin presiona "Registrar Inicio"
   - Sistema crea registros para todos los productos con stock actual
   - Estado: **Abierto** (fecha_cierre = NULL)

2. **Operaciones del Día**
   - Se realizan ventas normalmente
   - Stock de productos disminuye

3. **Cierre de Turno/Día**
   - Admin presiona "Cerrar" en cada registro abierto
   - Sistema actualiza stock_cierre con stock actual
   - Calcula total_vendido = stock_inicio - stock_cierre
   - Estado: **Cerrado**

4. **Consulta y Análisis**
   - Filtrar por fecha para ver ventas de período específico
   - Filtrar por categoría para análisis por tipo de producto
   - Exportar a CSV para análisis externo

## 🎯 Casos de Uso

### Ejemplo 1: Control Diario

```
09:00 AM - Registrar Inicio
  - Vodka: stock_inicio = 50
  - Cerveza: stock_inicio = 100

23:00 PM - Registrar Cierre
  - Vodka: stock_cierre = 35 → total_vendido = 15
  - Cerveza: stock_cierre = 80 → total_vendido = 20
```

### Ejemplo 2: Sin Ventas

```
Producto: Champan
  - stock_inicio = 10
  - stock_cierre = 10
  - total_vendido = 0 ✅
```

### Ejemplo 3: Aumento de Stock (Reposición)

```
Producto: Fernet
  - stock_inicio = 5
  - (Reposición de 20 unidades)
  - stock_cierre = 15
  - total_vendido = 0 (no se vendió, aumentó stock)
```

> **Nota**: El campo `total_vendido` usa `GREATEST(stock_inicio - stock_cierre, 0)` para evitar valores negativos.

## 🔐 Seguridad Multi-Tenant

✅ Todas las operaciones están protegidas por RLS
✅ Los usuarios solo ven registros de su club
✅ Solo Admin puede crear/actualizar/eliminar registros
✅ El campo `club_id` se valida automáticamente

## 📊 Reportes Disponibles

### 1. Registros Abiertos

```sql
SELECT
  nombre_producto,
  categoria,
  stock_inicio,
  fecha_inicio
FROM inicioycierre
WHERE fecha_cierre IS NULL
ORDER BY fecha_inicio DESC;
```

### 2. Ventas por Categoría (Último Mes)

```sql
SELECT
  categoria,
  COUNT(*) as total_registros,
  SUM(total_vendido) as total_vendido
FROM inicioycierre
WHERE fecha_inicio >= NOW() - INTERVAL '30 days'
  AND fecha_cierre IS NOT NULL
GROUP BY categoria
ORDER BY total_vendido DESC;
```

### 3. Top 10 Productos Más Vendidos

```sql
SELECT
  nombre_producto,
  categoria,
  SUM(total_vendido) as total_vendido
FROM inicioycierre
WHERE fecha_cierre IS NOT NULL
GROUP BY nombre_producto, categoria
ORDER BY total_vendido DESC
LIMIT 10;
```

## 🚀 Próximas Mejoras

- [ ] Dashboard con gráficos de ventas
- [ ] Alertas de productos sin movimiento
- [ ] Comparación período actual vs anterior
- [ ] Proyección de ventas
- [ ] Integración con sistema de compras

---

**Desarrollado para OnTicket - Sistema de Gestión de Clubes**
