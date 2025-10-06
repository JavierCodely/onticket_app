# 🔧 Utilidades Multi-Moneda

Guía completa para usar las funciones de cálculo multi-moneda en toda la aplicación.

---

## 📍 Ubicación

**Archivo:** `src/lib/currency-utils.ts`

Este módulo centraliza toda la lógica de cálculos con múltiples monedas para mantener consistencia en toda la aplicación.

---

## 🎯 Funciones Disponibles

### 1. `getPriceForCurrency()`

Obtiene el precio de un producto en una moneda específica.

```typescript
import { getPriceForCurrency } from '@/lib/currency-utils';

// Obtener precio de compra en USD
const precioCompra = getPriceForCurrency(producto, 'USD', 'compra');

// Obtener precio de venta en ARS
const precioVenta = getPriceForCurrency(producto, 'ARS', 'venta');
```

**Parámetros:**
- `producto: Producto` - El producto del cual obtener el precio
- `currency: CurrencyCode` - La moneda ('ARS' | 'USD' | 'BRL')
- `type: 'compra' | 'venta'` - Tipo de precio

**Retorna:** `number` - El precio en la moneda especificada

---

### 2. `calculateProfitMargin()`

Calcula el porcentaje de ganancia.

```typescript
import { calculateProfitMargin } from '@/lib/currency-utils';

const margin = calculateProfitMargin(100, 150); // Retorna: 50 (50%)
```

**Parámetros:**
- `precioCompra: number` - Precio de compra
- `precioVenta: number` - Precio de venta

**Retorna:** `number` - Margen de ganancia en porcentaje

---

### 3. `calculateProfit()`

Calcula la ganancia absoluta.

```typescript
import { calculateProfit } from '@/lib/currency-utils';

const ganancia = calculateProfit(100, 150); // Retorna: 50
```

**Parámetros:**
- `precioCompra: number` - Precio de compra
- `precioVenta: number` - Precio de venta

**Retorna:** `number` - Ganancia absoluta

---

### 4. `calculateInventoryValue()`

Calcula el valor total del inventario de un producto en una moneda específica.

```typescript
import { calculateInventoryValue } from '@/lib/currency-utils';

// Producto con stock de 50 unidades, precio compra USD 10
const valor = calculateInventoryValue(producto, 'USD'); // Retorna: 500
```

**Parámetros:**
- `producto: Producto` - El producto
- `currency: CurrencyCode` - La moneda

**Retorna:** `number` - Valor total del inventario

---

### 5. `calculatePotentialProfit()`

Calcula la ganancia potencial si se vende todo el stock.

```typescript
import { calculatePotentialProfit } from '@/lib/currency-utils';

const ganancia = calculatePotentialProfit(producto, 'ARS');
```

**Parámetros:**
- `producto: Producto` - El producto
- `currency: CurrencyCode` - La moneda

**Retorna:** `number` - Ganancia potencial total

---

### 6. `calculateProductStats()`

Calcula estadísticas agregadas de múltiples productos en una moneda específica.

```typescript
import { calculateProductStats } from '@/lib/currency-utils';
import { useCurrency } from '@/hooks/useCurrency';

function ProductDashboard({ productos }) {
  const { defaultCurrency } = useCurrency();
  const stats = calculateProductStats(productos, defaultCurrency);

  return (
    <div>
      <p>Valor Inventario: {stats.totalInventoryValue}</p>
      <p>Ganancia Potencial: {stats.totalPotentialProfit}</p>
      <p>Margen Promedio: {stats.averageProfitMargin}%</p>
      <p>Total Productos: {stats.totalProducts}</p>
      <p>Stock Bajo: {stats.lowStockCount}</p>
    </div>
  );
}
```

**Parámetros:**
- `productos: Producto[]` - Array de productos
- `currency: CurrencyCode` - La moneda para los cálculos

**Retorna:** `ProductStats` objeto con:
```typescript
{
  totalInventoryValue: number;      // Valor total del inventario
  totalPotentialProfit: number;     // Ganancia potencial total
  averageProfitMargin: number;      // Margen de ganancia promedio
  totalProducts: number;            // Cantidad de productos
  lowStockCount: number;            // Productos con stock bajo
}
```

---

### 7. `getAllProductPrices()`

Obtiene todos los precios de un producto en todas las monedas con cálculos de ganancia.

```typescript
import { getAllProductPrices } from '@/lib/currency-utils';

const precios = getAllProductPrices(producto);

console.log(precios.ars); // { compra: 1000, venta: 1500, profit: 500, margin: 50 }
console.log(precios.usd); // { compra: 10, venta: 15, profit: 5, margin: 50 }
console.log(precios.brl); // { compra: 50, venta: 75, profit: 25, margin: 50 }
```

**Retorna:** `ProductPrices` objeto con precios en las 3 monedas

---

### 8. `formatPercentage()`

Formatea un número como porcentaje.

```typescript
import { formatPercentage } from '@/lib/currency-utils';

formatPercentage(45.678);     // "45.7%"
formatPercentage(45.678, 2);  // "45.68%"
formatPercentage(45.678, 0);  // "46%"
```

**Parámetros:**
- `value: number` - El valor a formatear
- `decimals: number` - Decimales (default: 1)

**Retorna:** `string` - Valor formateado con símbolo %

---

### 9. `hasPrice()`

Verifica si un producto tiene precio en una moneda específica.

```typescript
import { hasPrice } from '@/lib/currency-utils';

if (hasPrice(producto, 'USD')) {
  console.log('El producto tiene precios en USD');
}
```

**Parámetros:**
- `producto: Producto` - El producto
- `currency: CurrencyCode` - La moneda

**Retorna:** `boolean` - true si tiene precio de compra o venta > 0

---

### 10. `getActiveCurrencies()`

Obtiene las monedas activas (con precio) de un producto.

```typescript
import { getActiveCurrencies } from '@/lib/currency-utils';

const monedas = getActiveCurrencies(producto); // ['ARS', 'USD']
```

**Retorna:** `CurrencyCode[]` - Array de monedas activas

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Estadísticas en Dashboard

```typescript
import { calculateProductStats } from '@/lib/currency-utils';
import { useCurrency } from '@/hooks/useCurrency';

function Dashboard() {
  const { defaultCurrency } = useCurrency();
  const [productos, setProductos] = useState<Producto[]>([]);

  // Los stats se recalculan automáticamente cuando cambia defaultCurrency
  const stats = calculateProductStats(productos, defaultCurrency);

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatsCard
        title="Valor Inventario"
        value={stats.totalInventoryValue}
        currency={defaultCurrency}
      />
      <StatsCard
        title="Ganancia Potencial"
        value={stats.totalPotentialProfit}
        currency={defaultCurrency}
      />
      <StatsCard
        title="Margen Promedio"
        value={`${stats.averageProfitMargin.toFixed(1)}%`}
      />
    </div>
  );
}
```

### Ejemplo 2: Card de Combo con Multi-Moneda

```typescript
import { getPriceForCurrency, calculateProfitMargin } from '@/lib/currency-utils';
import { useCurrency } from '@/hooks/useCurrency';

function ComboCard({ combo }) {
  const { defaultCurrency } = useCurrency();
  
  // Calcular precio real y precio combo en la moneda activa
  const precioReal = getPriceForCurrency(combo, defaultCurrency, 'compra');
  const precioCombo = getPriceForCurrency(combo, defaultCurrency, 'venta');
  const descuento = calculateProfitMargin(precioCombo, precioReal); // Negativo = descuento

  return (
    <Card>
      <h3>{combo.nombre}</h3>
      <p>Precio: {precioCombo}</p>
      <p>Ahorro: {Math.abs(descuento)}%</p>
    </Card>
  );
}
```

### Ejemplo 3: Tabla de Promociones

```typescript
import { getPriceForCurrency, calculateProfit } from '@/lib/currency-utils';
import { useCurrency } from '@/hooks/useCurrency';

function PromocionesTable({ promociones }) {
  const { defaultCurrency } = useCurrency();

  return (
    <Table>
      <TableBody>
        {promociones.map((promo) => {
          const precioOriginal = getPriceForCurrency(promo.producto, defaultCurrency, 'venta');
          const precioPromo = getPriceForCurrency(promo, defaultCurrency, 'venta');
          const ahorro = calculateProfit(precioPromo, precioOriginal);

          return (
            <TableRow key={promo.id}>
              <TableCell>{promo.nombre}</TableCell>
              <TableCell>{precioOriginal}</TableCell>
              <TableCell>{precioPromo}</TableCell>
              <TableCell className="text-green-600">-{ahorro}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

### Ejemplo 4: Reporte de Ventas

```typescript
import { calculateProductStats, formatPercentage } from '@/lib/currency-utils';
import { useCurrency } from '@/hooks/useCurrency';

function SalesReport({ ventas }) {
  const { defaultCurrency } = useCurrency();
  
  // Agrupar productos vendidos
  const productosVendidos = ventas.flatMap(v => v.productos);
  const stats = calculateProductStats(productosVendidos, defaultCurrency);

  return (
    <div>
      <h2>Reporte de Ventas - {CURRENCIES[defaultCurrency].name}</h2>
      <p>Total Vendido: {stats.totalInventoryValue}</p>
      <p>Ganancia: {stats.totalPotentialProfit}</p>
      <p>Margen: {formatPercentage(stats.averageProfitMargin)}</p>
    </div>
  );
}
```

---

## 🔄 Sincronización con Moneda Predeterminada

Todos los componentes que usan estas utilidades se actualizarán automáticamente cuando el usuario cambie la moneda predeterminada en Configuraciones, gracias al hook `useCurrency()`.

```typescript
import { useCurrency } from '@/hooks/useCurrency';
import { calculateProductStats } from '@/lib/currency-utils';

function MyComponent({ productos }) {
  const { defaultCurrency } = useCurrency(); // ← Se actualiza reactivamente
  
  // Los stats se recalculan automáticamente cuando cambia defaultCurrency
  const stats = calculateProductStats(productos, defaultCurrency);
  
  return <div>{stats.totalInventoryValue}</div>;
}
```

---

## ✅ Beneficios

1. **Código Centralizado:** Una sola fuente de verdad para cálculos
2. **Consistencia:** Mismos cálculos en toda la app
3. **Fácil Mantenimiento:** Cambios en un solo lugar
4. **Reutilizable:** Funciona con productos, combos, promociones, etc.
5. **Tipado Fuerte:** TypeScript valida todos los tipos
6. **Reactivo:** Se actualiza automáticamente con cambios de moneda

---

## 🎨 Componentes que ya lo usan

- ✅ `ProductCard` - Muestra precios según moneda predeterminada
- ✅ `ProductTable` - Tabla de productos reactiva a moneda
- ✅ `ProductStats` - Estadísticas que cambian con moneda
- ✅ `MultiCurrencyPriceInput` - Calcula margen de ganancia

---

## 📝 Próximos pasos

Implementa estas utilidades en:

1. **Combos:** Calcular precio real vs precio combo
2. **Promociones:** Calcular descuentos y ahorros
3. **Dashboard:** Estadísticas generales del negocio
4. **Reportes:** Análisis de ventas y ganancias
5. **Gráficos:** Visualización de datos multi-moneda

---

## 🚀 Ejemplo Completo: Dashboard de Ventas

```typescript
import { useCurrency } from '@/hooks/useCurrency';
import {
  calculateProductStats,
  formatPercentage,
  getPriceForCurrency
} from '@/lib/currency-utils';

function SalesDashboard() {
  const { defaultCurrency, setDefaultCurrency } = useCurrency();
  const [productos, setProductos] = useState<Producto[]>([]);
  
  const stats = calculateProductStats(productos, defaultCurrency);

  return (
    <div className="space-y-6">
      {/* Selector de Moneda */}
      <div className="flex gap-2">
        <Button 
          onClick={() => setDefaultCurrency('ARS')}
          variant={defaultCurrency === 'ARS' ? 'default' : 'outline'}
        >
          🇦🇷 ARS
        </Button>
        <Button 
          onClick={() => setDefaultCurrency('USD')}
          variant={defaultCurrency === 'USD' ? 'default' : 'outline'}
        >
          🇺🇸 USD
        </Button>
        <Button 
          onClick={() => setDefaultCurrency('BRL')}
          variant={defaultCurrency === 'BRL' ? 'default' : 'outline'}
        >
          🇧🇷 BRL
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Valor Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <FormattedCurrency value={stats.totalInventoryValue} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ganancia Potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <FormattedCurrency value={stats.totalPotentialProfit} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Margen Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercentage(stats.averageProfitMargin)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.lowStockCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos - {CURRENCIES[defaultCurrency].name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Precio Compra</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead>Margen</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Valor Inv.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((producto) => {
                const compra = getPriceForCurrency(producto, defaultCurrency, 'compra');
                const venta = getPriceForCurrency(producto, defaultCurrency, 'venta');
                const margin = calculateProfitMargin(compra, venta);
                const invValue = calculateInventoryValue(producto, defaultCurrency);

                return (
                  <TableRow key={producto.id}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell><FormattedCurrency value={compra} /></TableCell>
                    <TableCell><FormattedCurrency value={venta} /></TableCell>
                    <TableCell>{formatPercentage(margin)}</TableCell>
                    <TableCell>{producto.stock}</TableCell>
                    <TableCell><FormattedCurrency value={invValue} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

**Última actualización:** 2025-10-06

