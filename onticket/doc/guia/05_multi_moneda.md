# 💰 Sistema Multi-Moneda

## Descripción

OnTicket soporta operaciones en múltiples monedas simultáneamente, permitiendo configurar precios en Pesos Argentinos (ARS), Dólares (USD) y Reales Brasileños (BRL).

---

## Monedas Soportadas

| Moneda | Código | Símbolo | Bandera | Locale | Nombre Completo |
|--------|--------|---------|---------|--------|-----------------|
| Peso Argentino | `ARS` | `$` | 🇦🇷 | `es-AR` | Peso Argentino |
| Dólar | `USD` | `US$` | 🇺🇸 | `en-US` | Dólar Estadounidense |
| Real Brasileño | `BRL` | `R$` | 🇧🇷 | `pt-BR` | Real Brasileño |

---

## Base de Datos

### Migración Multi-Moneda

**Productos:**
```sql
ALTER TABLE productos
ADD COLUMN precio_compra_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_venta_ars DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_compra_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_venta_usd DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_compra_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN precio_venta_brl DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Migrar precios existentes a ARS
UPDATE productos
SET precio_compra_ars = precio_compra,
    precio_venta_ars = precio_venta
WHERE precio_compra > 0 OR precio_venta > 0;
```

**Combos:**
```sql
ALTER TABLE combos
ADD COLUMN precio_ars DECIMAL(10, 2),
ADD COLUMN precio_usd DECIMAL(10, 2),
ADD COLUMN precio_brl DECIMAL(10, 2);
```

**Promociones:**
```sql
ALTER TABLE promociones
ADD COLUMN precio_promocional_ars DECIMAL(10, 2),
ADD COLUMN precio_promocional_usd DECIMAL(10, 2),
ADD COLUMN precio_promocional_brl DECIMAL(10, 2);
```

**Ventas:**
```sql
ALTER TABLE sale
ADD COLUMN moneda TEXT CHECK (moneda IN ('ARS', 'USD', 'BRL')),
ADD COLUMN subtotal_ars NUMERIC(12, 2),
ADD COLUMN descuento_ars NUMERIC(12, 2),
ADD COLUMN total_ars NUMERIC(12, 2),
ADD COLUMN subtotal_usd NUMERIC(12, 2),
ADD COLUMN descuento_usd NUMERIC(12, 2),
ADD COLUMN total_usd NUMERIC(12, 2),
ADD COLUMN subtotal_brl NUMERIC(12, 2),
ADD COLUMN descuento_brl NUMERIC(12, 2),
ADD COLUMN total_brl NUMERIC(12, 2);
```

---

## TypeScript Types

### Currency Type

```typescript
// types/database/Currency/index.ts
export type CurrencyCode = 'ARS' | 'USD' | 'BRL';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  ARS: {
    code: 'ARS',
    name: 'Peso Argentino',
    symbol: '$',
    flag: '🇦🇷',
    locale: 'es-AR',
  },
  USD: {
    code: 'USD',
    name: 'Dólar',
    symbol: 'US$',
    flag: '🇺🇸',
    locale: 'en-US',
  },
  BRL: {
    code: 'BRL',
    name: 'Real Brasileño',
    symbol: 'R$',
    flag: '🇧🇷',
    locale: 'pt-BR',
  },
};
```

### Producto con Multi-Moneda

```typescript
export interface Producto {
  id: string;
  club_id: string;
  nombre: string;
  categoria: CategoriaProducto;

  // Precios legacy (compatibilidad)
  precio_compra: number;
  precio_venta: number;

  // Multi-Currency: ARS
  precio_compra_ars: number;
  precio_venta_ars: number;

  // Multi-Currency: USD
  precio_compra_usd: number;
  precio_venta_usd: number;

  // Multi-Currency: BRL
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

---

## Hooks y Utilidades

### Hook: `useCurrency`

```typescript
import { useCurrency } from '@/hooks/useCurrency';

function MyComponent() {
  const { defaultCurrency, setDefaultCurrency } = useCurrency();

  // defaultCurrency: 'ARS' | 'USD' | 'BRL'

  return (
    <div>
      <p>Moneda predeterminada: {defaultCurrency}</p>
      <button onClick={() => setDefaultCurrency('USD')}>
        Cambiar a USD
      </button>
    </div>
  );
}
```

**Almacenamiento:**
- Persiste en `localStorage` bajo la clave `default-currency`
- Valor por defecto: `'ARS'`

---

## Componentes UI

### 1. `CurrencyToggle`

Botones para seleccionar monedas activas.

```typescript
import { CurrencyToggle } from '@/components/atoms/CurrencyToggle';

function ProductForm() {
  const [activeCurrencies, setActiveCurrencies] = useState<CurrencyCode[]>(['ARS']);

  return (
    <CurrencyToggle
      value={activeCurrencies}
      onChange={setActiveCurrencies}
    />
  );
}
```

**Características:**
- Permite selección múltiple
- Siempre debe haber al menos una moneda seleccionada
- Muestra bandera, código y símbolo de cada moneda
- Desactiva botón si es la última moneda seleccionada

**Ejemplo visual:**
```
🇦🇷 ARS ($)    🇺🇸 USD (US$)    🇧🇷 BRL (R$)
  [✓]             [✓]              [ ]
```

### 2. `MultiCurrencyPriceInput`

Inputs de precios para múltiples monedas.

```typescript
import { MultiCurrencyPriceInput } from '@/components/molecules/Productos/MultiCurrencyPriceInput';

function ProductForm() {
  const [activeCurrencies, setActiveCurrencies] = useState(['ARS', 'USD']);
  const [prices, setPrices] = useState({
    ars: { compra: 0, venta: 0 },
    usd: { compra: 0, venta: 0 },
    brl: { compra: 0, venta: 0 },
  });

  const handlePriceChange = (
    currency: string,
    type: 'compra' | 'venta',
    value: number
  ) => {
    setPrices(prev => ({
      ...prev,
      [currency.toLowerCase()]: {
        ...prev[currency.toLowerCase()],
        [type]: value
      }
    }));
  };

  return (
    <MultiCurrencyPriceInput
      activeCurrencies={activeCurrencies}
      values={prices}
      onChange={handlePriceChange}
    />
  );
}
```

**Características:**
- Muestra inputs solo para monedas activas
- Calcula ganancia automáticamente: `venta - compra`
- Usa `CurrencyInput` para cada campo
- Muestra bandera y símbolo de moneda
- Valida que precio de venta > precio de compra

**Ejemplo visual:**
```
🇦🇷 Peso Argentino ($)
  Precio de Compra:  $ 1.500,00
  Precio de Venta:   $ 3.000,00
  Ganancia:          $ 1.500,00 (100%)

🇺🇸 Dólar (US$)
  Precio de Compra:  US$ 15.00
  Precio de Venta:   US$ 30.00
  Ganancia:          US$ 15.00 (100%)
```

---

## Flujo de Trabajo

### Crear Producto Multi-Moneda

```typescript
const handleCreateProducto = async (formData: ProductoFormData) => {
  const { user } = useAuth();

  const productoData = {
    club_id: user.club.id,
    nombre: formData.nombre,
    categoria: formData.categoria,

    // Multi-moneda
    precio_compra_ars: formData.precio_compra_ars || 0,
    precio_venta_ars: formData.precio_venta_ars || 0,
    precio_compra_usd: formData.precio_compra_usd || 0,
    precio_venta_usd: formData.precio_venta_usd || 0,
    precio_compra_brl: formData.precio_compra_brl || 0,
    precio_venta_brl: formData.precio_venta_brl || 0,

    // Legacy (usar ARS por defecto)
    precio_compra: formData.precio_compra_ars || 0,
    precio_venta: formData.precio_venta_ars || 0,

    stock: formData.stock,
    min_stock: formData.min_stock,
    max_stock: formData.max_stock,
  };

  const { error } = await supabase
    .from('productos')
    .insert(productoData);

  if (error) throw error;
  toast.success('Producto creado exitosamente');
};
```

### Editar Producto Multi-Moneda

```typescript
const handleEditProducto = async (producto: Producto) => {
  // 1. Determinar monedas activas (las que tienen precios > 0)
  const activeCurrencies: CurrencyCode[] = [];
  if (producto.precio_venta_ars > 0) activeCurrencies.push('ARS');
  if (producto.precio_venta_usd > 0) activeCurrencies.push('USD');
  if (producto.precio_venta_brl > 0) activeCurrencies.push('BRL');

  // 2. Si no hay monedas activas, usar moneda predeterminada
  if (activeCurrencies.length === 0) {
    activeCurrencies.push(defaultCurrency);
  }

  // 3. Cargar valores en formulario
  setSelectedItem(producto);
  setActiveCurrencies(activeCurrencies);
  setModalOpen(true);
};
```

### Crear Venta con Moneda Específica

```typescript
const handleCreateVenta = async (venta: VentaFormData) => {
  const { user } = useAuth();

  const ventaData = {
    club_id: user.club.id,
    producto_id: venta.producto_id,
    personal_id: user.personal.id,
    cantidad: venta.cantidad,
    precio_unitario: venta.precio_unitario,
    total: venta.cantidad * venta.precio_unitario,

    // Moneda de la venta
    moneda: venta.moneda, // 'ARS' | 'USD' | 'BRL'

    // Guardar en columna de moneda específica
    [`subtotal_${venta.moneda.toLowerCase()}`]: venta.subtotal,
    [`descuento_${venta.moneda.toLowerCase()}`]: venta.descuento || 0,
    [`total_${venta.moneda.toLowerCase()}`]: venta.total,
  };

  const { error } = await supabase
    .from('sale')
    .insert(ventaData);

  if (error) throw error;
  toast.success(`Venta registrada en ${venta.moneda}`);
};
```

---

## Reportes y Estadísticas

### Totales por Moneda

```typescript
const getVentasPorMoneda = async (club_id: string) => {
  const { data, error } = await supabase
    .from('sale')
    .select('moneda, total_ars, total_usd, total_brl')
    .eq('club_id', club_id);

  if (error) throw error;

  // Agrupar por moneda
  const totales = {
    ARS: data
      .filter(v => v.moneda === 'ARS')
      .reduce((sum, v) => sum + (v.total_ars || 0), 0),
    USD: data
      .filter(v => v.moneda === 'USD')
      .reduce((sum, v) => sum + (v.total_usd || 0), 0),
    BRL: data
      .filter(v => v.moneda === 'BRL')
      .reduce((sum, v) => sum + (v.total_brl || 0), 0),
  };

  return totales;
};
```

### Conversión (Futuro)

```typescript
// Sistema de tasas de cambio (a implementar)
interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: string;
}

const convertCurrency = (
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRate[]
): number => {
  if (from === to) return amount;

  const rate = rates.find(r => r.from === from && r.to === to);
  if (!rate) throw new Error('Exchange rate not found');

  return amount * rate.rate;
};
```

---

## Mejores Prácticas

### 1. Siempre Configurar al Menos Una Moneda

```typescript
// ❌ MAL: Todas las monedas en 0
const producto = {
  precio_compra_ars: 0,
  precio_venta_ars: 0,
  precio_compra_usd: 0,
  precio_venta_usd: 0,
  precio_compra_brl: 0,
  precio_venta_brl: 0,
};

// ✅ BIEN: Al menos una moneda configurada
const producto = {
  precio_compra_ars: 1500,
  precio_venta_ars: 3000,
  precio_compra_usd: 0,
  precio_venta_usd: 0,
  precio_compra_brl: 0,
  precio_venta_brl: 0,
};
```

### 2. Mantener Compatibilidad con Precios Legacy

```typescript
// Siempre guardar en campos legacy también
const productoData = {
  ...formData,
  precio_compra: formData.precio_compra_ars, // ← Compatibilidad
  precio_venta: formData.precio_venta_ars,   // ← Compatibilidad
};
```

### 3. Validar Moneda al Crear Ventas

```typescript
// Verificar que el producto tenga precios en la moneda seleccionada
if (monedaSeleccionada === 'USD' && producto.precio_venta_usd === 0) {
  toast.error('Este producto no tiene precio configurado en USD');
  return;
}
```

### 4. Filtrar Productos por Moneda Disponible

```typescript
const productosConPrecioEnUSD = productos.filter(
  p => p.precio_venta_usd > 0
);
```

---

## Próximas Mejoras

- [ ] Sistema de tasas de cambio automáticas (API externa)
- [ ] Conversión automática de precios
- [ ] Historial de tasas de cambio
- [ ] Reportes consolidados multi-moneda
- [ ] Soporte para más monedas (EUR, MXN, CLP, etc.)
- [ ] Redondeo inteligente por moneda

---

[← Volver al Índice](./00_indice.md) | [Siguiente: Formateo de Números →](./06_formateo_numeros.md)
