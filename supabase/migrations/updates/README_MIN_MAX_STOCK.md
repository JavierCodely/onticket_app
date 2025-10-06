# Migración: Stock Mínimo y Máximo

## Fecha
2025-10-06

## Descripción
Esta migración agrega funcionalidad de gestión de stock mínimo y máximo a la tabla de productos.

## Cambios en la Base de Datos

### Nuevas Columnas
- `min_stock` (INTEGER): Stock mínimo - cuando el stock llegue a este nivel o menos, se mostrará una alerta
- `max_stock` (INTEGER): Stock máximo - capacidad máxima de almacenamiento para planificación

### Constraints Agregados
- `check_min_stock_non_negative`: Asegura que min_stock sea >= 0
- `check_max_stock_non_negative`: Asegura que max_stock sea >= 0
- `check_max_stock_gte_min_stock`: Asegura que max_stock >= min_stock

### Índices
- `idx_productos_low_stock`: Índice parcial para consultas rápidas de productos con stock bajo

### Funciones
- `is_low_stock(p_stock, p_min_stock)`: Función helper para verificar si un producto tiene stock bajo

## Cómo Aplicar la Migración

### Opción 1: Usando Supabase CLI
```bash
cd supabase
supabase db push
```

### Opción 2: Desde el Dashboard de Supabase
1. Ir a SQL Editor en el dashboard de Supabase
2. Copiar el contenido de `add_min_max_stock_to_productos.sql`
3. Ejecutar el script

### Opción 3: Usando psql
```bash
psql postgresql://[CONNECTION_STRING] -f migrations/updates/add_min_max_stock_to_productos.sql
```

## Cambios en el Frontend

### Tipos TypeScript Actualizados
- `Producto`: Añadidos campos `min_stock` y `max_stock`
- `ProductoInsert`: Añadidos campos `min_stock` y `max_stock`
- `ProductoUpdate`: Añadidos campos opcionales `min_stock` y `max_stock`
- `ProductoFormData`: Añadidos campos `min_stock` y `max_stock`

### Componentes Actualizados

#### ProductForm
- ✅ Nuevos campos de entrada para stock mínimo y máximo
- ✅ Validación: max_stock debe ser >= min_stock
- ✅ Tooltips explicativos para los usuarios

#### ProductCard
- ✅ Borde rojo cuando stock <= min_stock
- ✅ Header rojo con badge "¡STOCK BAJO!"
- ✅ Indicador visual prominente

#### ProductTable
- ✅ Borde izquierdo rojo para productos con stock bajo
- ✅ Fondo rojo claro/oscuro según tema
- ✅ Badge "STOCK BAJO" junto al nombre del producto

#### ProductosPage
- ✅ Inclusión de min_stock y max_stock en operaciones de crear
- ✅ Inclusión de min_stock y max_stock en operaciones de actualizar

## Características

### Alertas Visuales
Los productos con stock bajo se destacan con:
- **Cards**: Borde rojo completo + header rojo + badge "¡STOCK BAJO!"
- **Tabla**: Borde izquierdo rojo + fondo rojo suave + badge "STOCK BAJO"

### Lógica de Stock Bajo
Un producto se considera con stock bajo cuando:
- `min_stock > 0` (el valor debe estar configurado)
- `stock <= min_stock` (el stock actual es menor o igual al mínimo)

## Datos Existentes

Los productos existentes tendrán:
- `min_stock = 0` (valor por defecto)
- `max_stock = 0` (valor por defecto)

Esto significa que NO se mostrarán alertas para productos existentes hasta que se configuren los valores de min_stock.

## Ejemplo de Uso

```typescript
// Crear producto con gestión de stock
const nuevoProducto = {
  nombre: "Vodka Absolut 750ml",
  categoria: "Vodka",
  precio_compra: 15.00,
  precio_venta: 25.00,
  stock: 50,
  min_stock: 10,  // Alerta cuando queden 10 o menos
  max_stock: 100  // Capacidad máxima de almacenamiento
}

// El producto mostrará alerta roja cuando stock <= 10
```

## Notas
- La migración es segura y reversible
- No afecta datos existentes
- Los valores por defecto (0) desactivan las alertas
- El sistema es completamente opcional - si no se configuran min/max, todo funciona como antes

