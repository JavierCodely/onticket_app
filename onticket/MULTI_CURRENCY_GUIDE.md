# Guía del Sistema Multi-Moneda

## 📋 Descripción

Sistema completo de múltiples monedas que permite configurar precios en Pesos Argentinos (ARS), Dólares (USD) y Reales Brasileños (BRL) para productos, combos, promociones y ventas.

## 💰 Monedas Soportadas

| Moneda | Código | Símbolo | Bandera | Nombre |
|--------|--------|---------|---------|--------|
| Peso Argentino | ARS | $ | 🇦🇷 | Peso Argentino |
| Dólar | USD | US$ | 🇺🇸 | Dólar |
| Real Brasileño | BRL | R$ | 🇧🇷 | Real Brasileño |

## 🗄️ Migración de Base de Datos

### Archivos SQL Creados

1. **`add_multi_currency_to_productos.sql`**
   - Agrega columnas: `precio_compra_ars`, `precio_venta_ars`, `precio_compra_usd`, `precio_venta_usd`, `precio_compra_brl`, `precio_venta_brl`
   - Migra precios existentes a `*_ars`
   - Constraints de validación (no negativos)

2. **`add_multi_currency_to_combos.sql`**
   - Agrega columnas: `precio_ars`, `precio_usd`, `precio_brl`
   - Migra precios existentes a `precio_ars`

3. **`add_multi_currency_to_promociones.sql`**
   - Agrega columnas: `precio_promocional_ars`, `precio_promocional_usd`, `precio_promocional_brl`
   - Migra precios existentes a `precio_promocional_ars`

4. **`add_multi_currency_to_sale.sql`**
   - Agrega columna: `moneda` (ARS | USD | BRL)
   - Agrega columnas de totales por moneda: `subtotal_*`, `descuento_*`, `total_*`
   - Migra ventas existentes a ARS

### Ejecución de Migraciones

```bash
# Ejecutar en orden
psql -U postgres -d onticket < supabase/migrations/updates/add_multi_currency_to_productos.sql
psql -U postgres -d onticket < supabase/migrations/updates/add_multi_currency_to_combos.sql
psql -U postgres -d onticket < supabase/migrations/updates/add_multi_currency_to_promociones.sql
psql -U postgres -d onticket < supabase/migrations/updates/add_multi_currency_to_sale.sql
```

## ⚙️ Configuración

### 1. Moneda Predeterminada

Los usuarios pueden seleccionar su moneda predeterminada en:  
**Configuraciones > Moneda predeterminada**

```tsx
import { useCurrency } from '@/hooks/useCurrency';

const { defaultCurrency, setDefaultCurrency } = useCurrency();
// defaultCurrency: 'ARS' | 'USD' | 'BRL'
```

La moneda predeterminada se usa para:
- Pre-seleccionar la moneda al crear productos
- Pre-seleccionar la moneda al crear ventas
- Display de precios en la aplicación

## 🎨 Componentes UI

### 1. `CurrencyToggle`

Botones de toggle para seleccionar monedas activas:

```tsx
import { CurrencyToggle } from '@/components/atoms/CurrencyToggle';

<CurrencyToggle
  value={['ARS', 'USD']}
  onChange={(currencies) => setActiveCurrencies(currencies)}
/>
```

**Características:**
- Permite seleccionar múltiples monedas
- Siempre debe haber al menos una moneda seleccionada
- Muestra bandera, código y símbolo de cada moneda

### 2. `MultiCurrencyPriceInput`

Inputs de precios para múltiples monedas:

```tsx
import { MultiCurrencyPriceInput } from '@/components/molecules/Productos/MultiCurrencyPriceInput';

<MultiCurrencyPriceInput
  activeCurrencies={['ARS', 'USD']}
  values={{
    ars: { compra: 1500, venta: 3000 },
    usd: { compra: 15, venta: 30 },
    brl: { compra: 0, venta: 0 },
  }}
  onChange={(currency, type, value) => {
    // currency: 'ARS' | 'USD' | 'BRL'
    // type: 'compra' | 'venta'
    // value: number
  }}
/>
```

**Características:**
- Muestra inputs solo para monedas activas
- Calcula ganancia automáticamente por cada moneda
- Usa `CurrencyInput` para formateo regional
- Muestra bandera y símbolo de cada moneda

## 📝 Formularios

### ProductForm

El formulario de productos ahora incluye:

1. **Toggle de Monedas**
   - Seleccionar monedas activas
   - Default: moneda configurada en configuraciones

2. **Inputs Multi-Moneda**
   - Precio de compra y venta por cada moneda activa
   - Cálculo de ganancia por moneda
   - Validación automática

**Ejemplo de uso:**

```tsx
// Al crear producto
const formData = {
  nombre: "Vodka Absolut",
  categoria: "Vodka",
  precio_compra_ars: 1500,
  precio_venta_ars: 3000,
  precio_compra_usd: 15,
  precio_venta_usd: 30,
  precio_compra_brl: 0,
  precio_venta_brl: 0,
  stock: 10,
  min_stock: 2,
  max_stock: 50,
};
```

## 🔄 Flujo de Trabajo

### Crear Producto

1. Usuario abre modal de crear producto
2. Por defecto se activa la moneda configurada en configuraciones
3. Usuario puede activar más monedas con `CurrencyToggle`
4. Para cada moneda activa, ingresa precio de compra y venta
5. Al guardar, se almacenan todos los precios en BD

### Editar Producto

1. Usuario abre modal de editar producto
2. Se activan automáticamente las monedas que tengan precios > 0
3. Usuario puede agregar o quitar monedas
4. Modifica precios según necesidad
5. Al guardar, se actualizan todos los precios

### Visualización

Los precios se muestran según la moneda predeterminada o se puede implementar un selector de moneda para cambiar entre ellas.

## 💾 Tipos TypeScript

### Producto Actualizado

```typescript
interface Producto {
  id: string;
  club_id: string;
  nombre: string;
  categoria: CategoriaProducto;
  // Precios legacy (mantener compatibilidad)
  precio_compra: number;
  precio_venta: number;
  // Multi-currency prices
  precio_compra_ars: number;
  precio_venta_ars: number;
  precio_compra_usd: number;
  precio_venta_usd: number;
  precio_compra_brl: number;
  precio_venta_brl: number;
  stock: number;
  min_stock: number;
  max_stock: number;
  imagen_url?: string | null;
  created_at: string;
  updated_at: string;
}
```

### Currency Types

```typescript
type CurrencyCode = 'ARS' | 'USD' | 'BRL';

interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  locale: string;
}
```

## 🎯 Mejores Prácticas

1. **Siempre configurar al menos una moneda**
   - Los precios deben estar en al menos una moneda

2. **Mantener consistencia**
   - Si un producto tiene precio en USD, asegurarse que todos los precios USD sean coherentes

3. **Migración gradual**
   - Los precios legacy (`precio_compra`, `precio_venta`) se mantienen por compatibilidad
   - Migrar gradualmente a usar solo precios multi-moneda

4. **Ventas**
   - Cada venta se registra con la moneda usada
   - Los totales se guardan en la moneda correspondiente

## 📊 Reportes y Estadísticas

Para reportes que involucren múltiples monedas:

1. **Filtrar por moneda**
   - Mostrar estadísticas separadas por moneda

2. **Conversión**
   - Implementar tasas de cambio para consolidar reportes
   - Almacenar tasas históricas para precisión

3. **Display**
   - Mostrar valores en moneda predeterminada
   - Permitir cambiar moneda de visualización

## 🚀 Próximos Pasos

- [ ] Implementar multi-moneda en ventas
- [ ] Implementar multi-moneda en combos
- [ ] Implementar multi-moneda en promociones
- [ ] Sistema de tasas de cambio
- [ ] Conversión automática de precios
- [ ] Reportes consolidados multi-moneda
- [ ] Historial de tasas de cambio

