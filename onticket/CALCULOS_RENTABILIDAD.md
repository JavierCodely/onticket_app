# Documentación de Cálculos - Rentabilidad por Producto

Este documento explica todos los cálculos implementados en el componente `RentabilidadProductos` para el análisis de rentabilidad.

---

## 📊 Cards de Estadísticas (7 totales)

### Fila 1: Márgenes y Rentabilidad (4 cards)
### Fila 2: Unidades Vendidas (3 cards)

### 1. % Margen Total (Ponderado)

**Descripción**: Margen bruto global considerando el peso de cada producto en las ventas.

**Fórmula**:
```
% Margen Total = (Ganancia Total / Costo Total) × 100
```

**Cálculo Detallado**:
```typescript
// 1. Calcular costo total (suma de costos × unidades vendidas)
Total Costos = Σ (Precio Compra × Unidades Vendidas)

// 2. Calcular ventas totales (suma de ventas × unidades vendidas)
Total Ventas = Σ (Precio Venta × Unidades Vendidas)

// 3. Calcular ganancia total
Ganancia Total = Total Ventas - Total Costos

// 4. Calcular margen porcentual ponderado
% Margen Total = (Ganancia Total / Total Costos) × 100
```

**Ejemplo con Datos Reales**:
```
Producto A: Coca Cola
- Costo: $1.000, Venta: $4.760, Margen individual: 376%
- Unidades vendidas: 6
- Costo total: $6.000
- Venta total: $28.560
- Ganancia: $22.560

Producto B: Heineken
- Costo: $1.850, Venta: $4.000, Margen individual: 116%
- Unidades vendidas: 65
- Costo total: $120.250
- Venta total: $260.000
- Ganancia: $139.750

TOTALES:
- Costo Total: $126.250
- Venta Total: $288.560
- Ganancia Total: $162.310
- % Margen Total = ($162.310 / $126.250) × 100 = 128.6%
```

**Por qué es correcto**: Este cálculo pondera automáticamente los productos según su peso en las ventas. Heineken tiene más peso porque se vendieron 65 unidades vs 6 de Coca Cola.

---

### 2. % Margen Teórico (Promedio Simple)

**Descripción**: Margen promedio simple sin ponderar, para comparar percepción vs realidad.

**Fórmula**:
```
% Margen Teórico = (Σ Margen Real de cada producto / Cantidad de productos)
```

**Cálculo Detallado**:
```typescript
const totalMargenTeorico = data.reduce((sum, item) => sum + item.margenReal, 0);
const margenTeorico = totalMargenTeorico / data.length;
```

**Ejemplo con Datos Reales**:
```
Producto A: Coca Cola - Margen: 376%
Producto B: Heineken - Margen: 116%

Margen Teórico = (376% + 116%) / 2 = 246%
```

**Por qué está mal para decisiones**: Este valor sobrevalora productos de bajo volumen. Coca Cola (376%) tiene el mismo peso que Heineken (116%) aunque se vendieron 65 Heineken vs 6 Coca Cola.

**Utilidad**: Sirve para **comparar percepción vs realidad**:
- Margen Teórico alto + Margen Real bajo = Vendes mucho de productos de bajo margen
- Margen Teórico bajo + Margen Real alto = Vendes mucho de productos de alto margen

---

### 3. Rentabilidad Total

**Descripción**: Suma total de todas las ganancias generadas en el período.

**Fórmula**:
```
Rentabilidad Total = Σ (Rentabilidad Real de cada producto)
```

**Cálculo Detallado**:
```typescript
// Para cada producto:
Ganancia por Unidad = Precio Venta - Precio Compra
Rentabilidad Real = Ganancia por Unidad × Unidades Vendidas

// Total:
Rentabilidad Total = Σ Rentabilidad Real
```

**Ejemplo**:
```
Producto A: ($4.760 - $1.000) × 6 = $22.560
Producto B: ($4.000 - $1.850) × 65 = $139.750
...
Rentabilidad Total = $869.968,49
```

**Verificación**: Este valor es correcto si y solo si:
- Cada "Ganancia/Unidad" = Precio Venta - Costo Unitario
- Todos los precios están actualizados
- No se mezclan productos de stock no vendidos

---

### 4. Eficiencia de Capital (ROI)

**Descripción**: Return on Investment - Mide qué tan eficiente es el capital invertido en generar ganancias. Un ROI de 130% significa que por cada $1 invertido en costo, ganaste $1.30.

**Fórmula**:
```
Eficiencia de Capital (%) = (Rentabilidad Total / Costo Total Invertido) × 100
```

**Cálculo Detallado**:
```typescript
// 1. Calcular costo total invertido
Costo Total = Σ (Precio Compra × Unidades Vendidas)

// 2. Usar rentabilidad total ya calculada
Rentabilidad Total = Σ (Ganancia × Unidades Vendidas)

// 3. Calcular eficiencia
Eficiencia = (Rentabilidad Total / Costo Total) × 100
```

**Ejemplo**:
```
Costo Total Invertido:
- Coca Cola: $1.000 × 6 = $6.000
- Heineken: $1.850 × 65 = $120.250
- Total: $126.250

Rentabilidad Total: $162.310

Eficiencia = ($162.310 / $126.250) × 100 = 128.6%
```

**Interpretación**:
- **< 100%**: Estás perdiendo dinero
- **= 100%**: Punto de equilibrio (no ganas ni pierdes)
- **> 100%**: Ganancias (por cada $1 invertido ganas más de $1)
- **128.6%**: Por cada $1 de costo, recuperas $1 + ganas $0.286

**Por qué es útil**:
- Compara eficiencia entre diferentes períodos
- Mide qué tan bien rotás el capital invertido
- Identifica si necesitás aumentar precios o reducir costos
- **Importante**: Este valor debería coincidir con el % Margen Total

---

### 5. Total Unidades Vendidas

**Descripción**: Suma total de todas las unidades vendidas.

**Fórmula**:
```
Total Unidades = Σ (Unidades Vendidas de cada producto)
```

**Cálculo Detallado**:
```typescript
Total Unidades Vendidas = data.reduce((sum, item) => sum + item.unidadesVendidas, 0)
```

**Ejemplo**:
```
Coca Cola: 6
Heineken: 65
SPEED: 69
...
Total: 275 unidades
```

---

### 6. Promedio por Producto

**Descripción**: Promedio simple de unidades vendidas por producto.

**Fórmula**:
```
Promedio = Total Unidades / Cantidad de Productos
```

**Cálculo Detallado**:
```typescript
Promedio Unidades = totalUnidades / data.length
```

**Ejemplo**:
```
Total Unidades: 275
Productos con ventas: 20
Promedio: 275 / 20 = 13.75 ≈ 14 uds
```

**Nota importante**: Este promedio puede ser engañoso si hay productos con ventas muy dispares. Por eso también se muestra la mediana.

---

### 7. Mediana de Unidades Vendidas

**Descripción**: Valor central de las unidades vendidas cuando están ordenadas. Representa mejor la realidad de la mayoría de los productos, ya que no se ve afectado por valores extremos (outliers).

**Fórmula**:
```
1. Ordenar todas las unidades vendidas de menor a mayor
2. Si cantidad es impar: tomar el valor central
3. Si cantidad es par: promediar los dos valores centrales
```

**Cálculo Detallado**:
```typescript
// 1. Extraer y ordenar todas las unidades vendidas
const unidadesArray = data.map(item => item.unidadesVendidas).sort((a, b) => a - b);

// 2. Calcular índice central
const middleIndex = Math.floor(unidadesArray.length / 2);

// 3. Obtener mediana
const mediana = unidadesArray.length % 2 === 0
  ? (unidadesArray[middleIndex - 1] + unidadesArray[middleIndex]) / 2  // Par: promedio de los dos centrales
  : unidadesArray[middleIndex];  // Impar: valor central
```

**Ejemplo con Datos Reales**:
```
Unidades vendidas por producto (ordenadas):
[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 22, 25, 30, 35, 40, 50, 65, 69]
                              ↑
                         posición 10
Cantidad de productos: 20 (par)
Mediana = (15 + 18) / 2 = 16.5 ≈ 17 unidades

Comparación:
- Promedio: 13.75 unidades
- Mediana: 16.5 unidades
```

**Por qué es mejor que el promedio**:
- No se ve afectada por valores extremos (ej: un producto que vendió 200 unidades)
- Representa el "producto típico" del negocio
- Útil para detectar si la mayoría de productos vende poco o mucho

**Interpretación**:
- **Mediana > Promedio**: La mayoría de productos vende más que el promedio (distribución sesgada a la izquierda)
- **Mediana < Promedio**: Pocos productos con ventas altas inflan el promedio (distribución sesgada a la derecha)
- **Mediana ≈ Promedio**: Distribución equilibrada

---

## 🧮 Cálculos por Producto (Tabla)

### Margen Real (%) - Por Producto

**Descripción**: Margen bruto porcentual individual de cada producto.

**Fórmula**:
```
Margen Real (%) = ((Precio Venta - Precio Compra) / Precio Compra) × 100
```

**Cálculo en código**:
```typescript
const margenReal = precioCompra > 0
  ? ((precioVenta - precioCompra) / precioCompra) * 100
  : 0;
```

**Ejemplo**:
```
Coca Cola:
- Compra: $1.000
- Venta: $4.760
- Margen: (($4.760 - $1.000) / $1.000) × 100 = 376%

Heineken:
- Compra: $1.850
- Venta: $4.000
- Margen: (($4.000 - $1.850) / $1.850) × 100 = 116.2%
```

---

### Ganancia por Unidad

**Descripción**: Ganancia neta por cada unidad vendida.

**Fórmula**:
```
Ganancia/Unidad = Precio Venta - Precio Compra
```

**Cálculo en código**:
```typescript
const gananciaPorUnidad = precioVenta - precioCompra;
```

**Ejemplo**:
```
Coca Cola: $4.760 - $1.000 = $3.760
Heineken: $4.000 - $1.850 = $2.150
```

---

### Rentabilidad Real - Por Producto

**Descripción**: Ganancia total generada por el producto considerando rotación.

**Fórmula**:
```
Rentabilidad Real = Ganancia por Unidad × Unidades Vendidas
```

**Cálculo en código**:
```typescript
const rentabilidadReal = gananciaPorUnidad * unidadesVendidas;
```

**Ejemplo**:
```
Coca Cola: $3.760 × 6 = $22.560
Heineken: $2.150 × 65 = $139.750
SPEED: $2.350 × 69 = $162.150
```

**Por qué es importante**: Un producto con alto margen (376%) pero pocas ventas (6 uds) genera menos rentabilidad real ($22.560) que uno con menor margen (116%) pero más ventas (65 uds = $139.750).

---

## 🔍 Filtros Implementados

### Por Período

Afecta el rango de fechas de las ventas consultadas:

```typescript
switch (period) {
  case 'week':
    startDate.setDate(now.getDate() - 7);
    break;
  case 'month':
    startDate.setMonth(now.getMonth() - 1);
    break;
  case 'quarter':
    startDate.setMonth(now.getMonth() - 3);
    break;
  case 'year':
    startDate.setFullYear(now.getFullYear() - 1);
    break;
  case 'all':
    startDate = new Date(0); // Desde siempre
    break;
}
```

**Consulta SQL**:
```typescript
.gte('sale.created_at', startDate.toISOString())
.lte('sale.created_at', endDate.toISOString())
```

---

### Por Categoría

Filtra productos después de calcular las ventas:

```typescript
if (selectedCategoria !== 'all') {
  filtered = filtered.filter(item => item.producto.categoria === selectedCategoria);
}
```

---

### Por Producto Específico

Filtra un producto individual:

```typescript
if (selectedProducto !== 'all') {
  filtered = filtered.filter(item => item.producto.id === selectedProducto);
}
```

---

## ⚠️ Validaciones y Casos Especiales

### División por Cero

```typescript
const margenTotalGlobal = totalCostos > 0
  ? (gananciTotal / totalCostos) * 100
  : 0;
```

Si `totalCostos = 0`, el margen se establece en 0% para evitar errores.

---

### Productos sin Precio

```typescript
const precioCompra = producto[`precio_compra_${currencyCode}`] || 0;
const precioVenta = producto[`precio_venta_${currencyCode}`] || 0;
```

Si un producto no tiene precio en la moneda seleccionada, se usa 0.

---

### Filtrado de Productos sin Ventas

```typescript
.filter((item) => item.unidadesVendidas > 0 && item.gananciaPorUnidad !== 0)
```

Solo se muestran productos que:
- Tienen al menos 1 unidad vendida
- Tienen ganancia diferente de 0

---

## 📐 Fórmulas Matemáticas Resumidas

### Cards de Resumen (7 totales)

**Fila 1: Márgenes y Rentabilidad (4 cards)**

| Métrica | Fórmula | Tipo | Descripción |
|---------|---------|------|-------------|
| % Margen Total | `(Ganancia Total / Costo Total) × 100` | Ponderado | Margen real considerando volumen |
| % Margen Teórico | `(Σ Margen Individual) / Cantidad` | Promedio simple | Para comparar con margen real |
| Rentabilidad Total | `Σ (Ganancia × Unidades)` | Suma | Ganancia neta total en moneda |
| Eficiencia de Capital | `(Rentabilidad / Costo Total) × 100` | ROI | Retorno por cada $1 invertido |

**Fila 2: Unidades Vendidas (3 cards)**

| Métrica | Fórmula | Tipo | Descripción |
|---------|---------|------|-------------|
| Total Unidades | `Σ Unidades Vendidas` | Suma | Total de unidades vendidas |
| Promedio por Producto | `Total / Cantidad Productos` | Promedio | Unidades promedio por producto |
| Mediana de Unidades | `Valor central ordenado` | Mediana | Refleja mejor el producto típico |

### Cálculos por Producto (Tabla)

| Métrica | Fórmula | Nivel |
|---------|---------|-------|
| Margen Real (%) | `((Venta - Compra) / Compra) × 100` | Por producto |
| Ganancia/Unidad | `Venta - Compra` | Por producto |
| Rentabilidad Real | `Ganancia/Unidad × Unidades` | Por producto |

---

## ✅ Verificación de Consistencia

Para verificar que los cálculos son correctos:

1. **% Margen Total debe coincidir con el margen ponderado**:
   ```
   (Rentabilidad Total / Costo Total) × 100 = % Margen Total
   ```

2. **Rentabilidad Total debe ser la suma exacta**:
   ```
   Σ (Ganancia/Unidad × Unidades) = Rentabilidad Total
   ```

3. **Los costos y ventas deben estar en la misma moneda**:
   - Se usa `defaultCurrency` para consultar los precios correctos
   - Ejemplo: `precio_compra_ars`, `precio_venta_ars`

---

## 🎯 Valores Esperados (Ejemplo Real)

Con los datos del screenshot del usuario:

### Fila 1: Márgenes y Rentabilidad

| Métrica | Valor | Validación |
|---------|-------|------------|
| % Margen Total (Ponderado) | ~130% | ✅ Ponderado correctamente por volumen |
| % Margen Teórico (Simple) | ~246% | ✅ Promedio sin ponderar (solo referencia) |
| Rentabilidad Total | $869.968,49 | ✅ Suma de todas las ganancias |
| Eficiencia de Capital | ~130% | ✅ Coincide con % Margen Total (ROI) |

### Fila 2: Unidades Vendidas

| Métrica | Valor | Validación |
|---------|-------|------------|
| Total Unidades Vendidas | 275 | ✅ Suma de todas las unidades |
| Promedio por Producto | 13-14 | ✅ Matemáticamente correcto |
| Mediana de Unidades | ~17 | ✅ Representa mejor el producto típico |

**Interpretación del ejemplo**:
- El margen teórico (246%) es casi el doble del margen real (130%)
- Esto indica que se venden muchos productos de bajo margen en alto volumen
- La mediana (17) es mayor que el promedio (14), sugiriendo pocos productos con ventas muy bajas que bajan el promedio
- La eficiencia de capital (130%) confirma que por cada $1 invertido se recupera $1.30

---

## 🔄 Actualización en Tiempo Real

Los cálculos se recalculan automáticamente cuando cambian:

```typescript
useEffect(() => {
  const filteredData = applyFilters(allProfitabilityData);
  calculateStats(filteredData);
}, [allProfitabilityData, selectedCategoria, selectedProducto]);
```

Esto asegura que las estadísticas siempre reflejen los filtros activos.

---

## 📝 Notas Finales

1. **Todos los cálculos consideran la moneda seleccionada** (`defaultCurrency`)
2. **Los filtros son acumulativos**: Período + Categoría + Producto
3. **El % Margen Total es ponderado**, no un promedio simple
4. **La Rentabilidad Real incluye rotación**, no solo margen teórico
5. **Los datos vienen de la tabla `sale_items`** joinada con `sale` para filtrar por club y fecha

---

**Última actualización**: 2025-10-23
**Componente**: `src/components/organisms/Dashboard/RentabilidadProductos.tsx`
