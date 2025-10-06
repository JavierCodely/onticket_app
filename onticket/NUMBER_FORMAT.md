# Sistema de Formateo de Números

## 📋 Descripción

Sistema de formateo de números personalizable que permite a los usuarios elegir entre diferentes formatos regionales para la visualización de números, precios y porcentajes en toda la aplicación.

## 🎯 Características

### Formatos Disponibles

1. **🇦🇷 Argentino (AR)** - Formato Local (Por defecto)
   - Decimales: `1.234,56`
   - Precios: `$ 1.234,56`
   - Separador de miles: `.` (punto)
   - Separador decimal: `,` (coma)
   - Símbolo: `$` (peso argentino)

2. **🇪🇸 Español (ES)** - Formato Europeo
   - Decimales: `1.234,56`
   - Precios: `1.234,56 US$`
   - Separador de miles: `.` (punto)
   - Separador decimal: `,` (coma)
   - Símbolo: `US$` (dólar estadounidense)

3. **🇺🇸 Inglés (US)** - Formato Americano
   - Decimales: `1,234.56`
   - Precios: `$1,234.56`
   - Separador de miles: `,` (coma)
   - Separador decimal: `.` (punto)
   - Símbolo: `$` (dólar)

## 🛠️ Implementación Técnica

### Hook Principal: `useNumberFormat`

**Nota**: Este hook usa React hooks nativos (`useState`, `useEffect`) y localStorage. No requiere Zustand ni otras dependencias externas.

```typescript
import { useNumberFormat } from '@/hooks/useNumberFormat';

const { format, setFormat } = useNumberFormat();
// format puede ser: 'es-AR' | 'es-ES' | 'en-US'
```

#### Funciones de Formateo

```typescript
// Formatear números decimales
formatNumber(value: number, format: NumberFormat, decimals: number)

// Formatear moneda
formatCurrency(value: number, format: NumberFormat, currency: string)

// Formatear porcentajes
formatPercentage(value: number, format: NumberFormat, decimals: number)

// Formatear enteros
formatInteger(value: number, format: NumberFormat)
```

### Componentes Auxiliares

#### `FormattedCurrency`
Muestra valores monetarios formateados:

```tsx
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';

<FormattedCurrency value={1234.56} className="font-bold" />
// Output (AR): $ 1.234,56
// Output (ES): 1.234,56 US$
// Output (US): $1,234.56
```

#### `FormattedNumber`
Muestra números formateados (números, enteros, porcentajes):

```tsx
import { FormattedNumber } from '@/components/atoms/FormattedNumber';

<FormattedNumber value={1234.56} decimals={2} type="number" />
<FormattedNumber value={42} type="integer" />
<FormattedNumber value={75.5} type="percentage" />
```

## 📍 Configuración

Los usuarios pueden cambiar el formato en **Configuraciones > Formato de números**:

1. Navegar a la página de configuraciones
2. Encontrar la sección "Formato de números"
3. Seleccionar entre:
   - 🇦🇷 **Argentino (AR)** - Por defecto
   - 🇪🇸 **Español (ES)** - Europeo
   - 🇺🇸 **Inglés (US)** - Americano
4. Los cambios se aplican inmediatamente en toda la aplicación

## 💾 Persistencia

La preferencia de formato se guarda automáticamente en `localStorage` usando React hooks nativos:

- **Clave de almacenamiento**: `number-format-preference`
- **Valor por defecto**: `es-AR` (Argentino)
- **Sincronización**: Automática mediante `useEffect`
- **Sin dependencias**: No requiere Zustand ni otras librerías

## 🎨 Componentes Actualizados

Los siguientes componentes ya usan el sistema de formateo:

### Productos
- ✅ `ProductCard` - Precios de compra, venta y ganancia
- ✅ `ProductTable` - Precios en tabla
- ✅ `ProductStats` - Estadísticas de inventario, ganancia potencial y márgenes
- ✅ `ProfitBadge` - Margen de ganancia

### Configuraciones
- ✅ `ThemeConfigurator` - Selector de formato con previews

## 🔄 API de Intl.NumberFormat

El sistema utiliza la API nativa `Intl.NumberFormat` de JavaScript:

```typescript
new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(1234.56);
```

### Ventajas

- ✅ **Nativo del navegador**: Sin dependencias externas
- ✅ **Soporte completo**: Funciona en todos los navegadores modernos
- ✅ **Configurable**: Soporta múltiples locales y monedas
- ✅ **Performante**: Optimizado por el motor de JavaScript

## 🚀 Uso en Nuevos Componentes

Para usar el formateo en nuevos componentes:

### Opción 1: Componentes Auxiliares (Recomendado)

```tsx
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';

export const MyComponent = ({ price }) => (
  <div>
    Precio: <FormattedCurrency value={price} />
  </div>
);
```

### Opción 2: Hook Directo

```tsx
import { useNumberFormat, formatCurrency } from '@/hooks/useNumberFormat';

export const MyComponent = ({ price }) => {
  const { format } = useNumberFormat();
  
  return (
    <div>
      Precio: {formatCurrency(price, format)}
    </div>
  );
};
```

### Opción 3: Funciones Puras (Para cálculos)

```tsx
import { formatCurrency } from '@/hooks/useNumberFormat';

// En componentes que no pueden usar hooks
const formattedPrice = formatCurrency(price, 'es-ES');
```

## 📝 Notas

- El formato se aplica solo a la visualización, no afecta los valores almacenados en la base de datos
- Los valores siempre se almacenan como números en formato estándar
- El formateo es reactivo y se actualiza automáticamente cuando el usuario cambia su preferencia

## 📝 Inputs Numéricos Inteligentes

### Problema y Solución

**Antes:**
```
Usuario argentino escribe: 1.500
JavaScript interpreta: 1.5 ❌
```

**Ahora:**
```
Usuario argentino escribe: 1.500
Sistema interpreta correctamente: 1500 ✅
```

### Componentes de Input

#### `NumberInput`
Input genérico para números que respeta el formato seleccionado:

```tsx
import { NumberInput } from '@/components/atoms/NumberInput';
import { Controller } from 'react-hook-form';

<Controller
  name="stock"
  control={control}
  render={({ field }) => (
    <NumberInput
      value={field.value}
      onChange={(val) => field.onChange(val ?? 0)}
      maxDecimals={0}  // Para enteros
    />
  )}
/>
```

#### `CurrencyInput`
Input especializado para precios (2 decimales, sin negativos):

```tsx
import { CurrencyInput } from '@/components/atoms/CurrencyInput';
import { Controller } from 'react-hook-form';

<Controller
  name="precio_venta"
  control={control}
  render={({ field }) => (
    <CurrencyInput
      value={field.value}
      onChange={(val) => field.onChange(val ?? 0)}
    />
  )}
/>
```

### Comportamiento Según Formato

| Formato | Usuario escribe | Interpretación | Display |
|---------|----------------|----------------|---------|
| 🇦🇷 AR | `1.500` | `1500` | `1.500` |
| 🇦🇷 AR | `1.500,50` | `1500.5` | `1.500,50` |
| 🇺🇸 US | `1,500` | `1500` | `1,500` |
| 🇺🇸 US | `1,500.50` | `1500.5` | `1,500.50` |

### Documentación Completa

Para más detalles sobre los inputs numéricos, consulta: `NUMBER_INPUT_GUIDE.md`

## 🎯 Próximas Mejoras

- [x] Inputs numéricos inteligentes
- [x] Soporte formato argentino
- [ ] Soporte para más locales (pt-BR, en-GB, etc.)
- [ ] Configuración de moneda personalizada
- [ ] Formateo de fechas y horas con el mismo sistema
- [ ] Sincronización con preferencias del navegador

