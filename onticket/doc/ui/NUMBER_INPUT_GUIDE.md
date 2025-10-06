# Guía de Inputs Numéricos Inteligentes

## 📋 Descripción

Sistema de inputs numéricos que respetan el formato de números seleccionado por el usuario (Argentino, Español o Inglés). Estos componentes interpretan correctamente la entrada según la configuración regional.

## 🎯 Problema Resuelto

**Antes:**
- Usuario argentino escribe `1.500` → JavaScript lo interpreta como `1.5`
- Usuario americano escribe `1,500` → JavaScript lo rechaza o malinterpreta

**Ahora:**
- Usuario argentino escribe `1.500` → Se interpreta correctamente como `1500` (mil quinientos)
- Usuario americano escribe `1,500` → Se interpreta correctamente como `1500` (mil quinientos)
- Los separadores decimales y de miles se adaptan automáticamente

## 🛠️ Componentes Disponibles

### 1. `NumberInput`

Input genérico para números con formato regional.

```tsx
import { NumberInput } from '@/components/atoms/NumberInput';

<NumberInput
  value={1500}
  onChange={(value) => console.log(value)} // 1500
  maxDecimals={2}
  allowNegative={false}
  placeholder="0"
/>
```

**Props:**
- `value?: number | string` - Valor numérico actual
- `onChange?: (value: number | null) => void` - Callback cuando cambia el valor
- `allowNegative?: boolean` - Permitir números negativos (default: false)
- `maxDecimals?: number` - Máximo de decimales permitidos (default: 2)
- Todos los props de `Input` de Shadcn

**Comportamiento según formato:**

| Formato | Usuario escribe | Interpretación | Display (enfocado) | Display (blur) |
|---------|----------------|----------------|-------------------|----------------|
| 🇦🇷 Argentino | `1.500` | `1500` | `1500` | `1.500` |
| 🇦🇷 Argentino | `1.500,50` | `1500.5` | `1500,5` | `1.500,50` |
| 🇺🇸 Inglés | `1,500` | `1500` | `1500` | `1,500` |
| 🇺🇸 Inglés | `1,500.50` | `1500.5` | `1500.5` | `1,500.50` |

### 2. `CurrencyInput`

Input especializado para valores monetarios (siempre 2 decimales, sin negativos).

```tsx
import { CurrencyInput } from '@/components/atoms/CurrencyInput';

<CurrencyInput
  value={1500.50}
  onChange={(value) => console.log(value)} // 1500.5
  placeholder="0,00"
/>
```

**Props:**
- Hereda todas las props de `NumberInput`
- `maxDecimals` está fijado en `2`
- `allowNegative` está fijado en `false`

## 🔄 Integración con React Hook Form

Usa `Controller` para integrar con formularios:

```tsx
import { Controller, useForm } from 'react-hook-form';
import { CurrencyInput } from '@/components/atoms/CurrencyInput';
import { NumberInput } from '@/components/atoms/NumberInput';

const MyForm = () => {
  const { control } = useForm();
  
  return (
    <>
      {/* Precio */}
      <Controller
        name="precio"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            value={field.value}
            onChange={(val) => field.onChange(val ?? 0)}
          />
        )}
      />
      
      {/* Stock (enteros) */}
      <Controller
        name="stock"
        control={control}
        render={({ field }) => (
          <NumberInput
            value={field.value}
            onChange={(val) => field.onChange(val ?? 0)}
            maxDecimals={0}
          />
        )}
      />
    </>
  );
};
```

## 📱 Características Técnicas

### Estados del Input

1. **Enfocado (Focus):**
   - Formato mínimo para facilitar la edición
   - Solo muestra separador decimal
   - No muestra separadores de miles
   - Ejemplo AR: `1500,5`
   - Ejemplo US: `1500.5`

2. **Desenfocado (Blur):**
   - Formato completo con todos los separadores
   - Redondea a los decimales especificados
   - Ejemplo AR: `1.500,50`
   - Ejemplo US: `1,500.50`

### Validación en Tiempo Real

- ✅ Solo permite caracteres válidos según el formato
- ✅ Rechaza múltiples separadores decimales
- ✅ Respeta el límite de decimales
- ✅ Valida números negativos según configuración
- ✅ Previene entrada de caracteres inválidos

### Separadores por Formato

| Formato | Separador de Miles | Separador Decimal |
|---------|-------------------|-------------------|
| 🇦🇷 Argentino | `.` (punto) | `,` (coma) |
| 🇪🇸 Español | `.` (punto) | `,` (coma) |
| 🇺🇸 Inglés | `,` (coma) | `.` (punto) |

## 💡 Ejemplos de Uso

### Precio de Producto

```tsx
<Controller
  name="precio_venta"
  control={control}
  render={({ field }) => (
    <CurrencyInput
      id="precio_venta"
      value={field.value}
      onChange={(val) => field.onChange(val ?? 0)}
      placeholder="0,00"
      disabled={isSubmitting}
    />
  )}
/>
```

### Stock (Solo Enteros)

```tsx
<Controller
  name="stock"
  control={control}
  render={({ field }) => (
    <NumberInput
      id="stock"
      value={field.value}
      onChange={(val) => field.onChange(val ?? 0)}
      maxDecimals={0}  // Sin decimales
      placeholder="0"
    />
  )}
/>
```

### Porcentaje con 1 Decimal

```tsx
<NumberInput
  value={percentage}
  onChange={setPercentage}
  maxDecimals={1}
  placeholder="0,0"
/>
```

### Número con Negativos

```tsx
<NumberInput
  value={balance}
  onChange={setBalance}
  allowNegative={true}
  maxDecimals={2}
/>
```

## 🎨 Componentes Actualizados

Los siguientes formularios ya usan estos inputs:

- ✅ `ProductForm` - Precio de compra, precio de venta, stock, min_stock, max_stock
- ✅ `StockRenewalForm` - Cantidad de stock

## 🔍 Flujo de Datos

```
Usuario escribe → Input captura → Parsea según formato → onChange(número) → React Hook Form
                                                                            ↓
Display muestra ← Formatea según foco ← Lee formato actual ← Estado actualizado
```

## ⚠️ Notas Importantes

1. **Siempre usa `Controller`**: No uses `{...register()}` directamente con estos inputs
2. **Maneja `null`**: El input puede devolver `null` si está vacío, usa `?? 0` si necesitas un número
3. **Formato dinámico**: Los inputs responden automáticamente al cambio de formato en configuraciones
4. **No uses `type="number"`**: Estos son inputs de texto con validación inteligente

## 🚀 Ventajas

- ✅ **UX Regional**: Los usuarios pueden escribir números como están acostumbrados
- ✅ **Sin confusión**: No más malinterpretaciones de `1.500` vs `1,500`
- ✅ **Validación automática**: Solo acepta caracteres válidos
- ✅ **Formato automático**: Formatea al perder el foco
- ✅ **Accesibilidad**: `inputMode="decimal"` para teclados móviles
- ✅ **Type-safe**: Completamente tipado con TypeScript

