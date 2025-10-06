# Realtime Configuration

Este directorio contiene las configuraciones para habilitar actualizaciones en tiempo real en Supabase.

## Tablas con Realtime Habilitado

### 1. **sale** (Ventas)
- **Eventos**: INSERT, UPDATE, DELETE
- **Uso**: Permite ver ventas nuevas en tiempo real sin refrescar la página
- **Filtros RLS**: Se aplican automáticamente según el club del usuario

### 2. **productos** (Stock)
- **Eventos**: INSERT, UPDATE, DELETE
- **Uso**: Actualiza el stock en tiempo real cuando se realizan ventas
- **Filtros RLS**: Se aplican automáticamente según el club del usuario

### 3. **promociones** (Promociones)
- **Eventos**: INSERT, UPDATE, DELETE
- **Uso**: Sincroniza cambios en promociones activas
- **Filtros RLS**: Se aplican automáticamente según el club del usuario

### 4. **combos** (Combos)
- **Eventos**: INSERT, UPDATE, DELETE
- **Uso**: Sincroniza cambios en combos activos
- **Filtros RLS**: Se aplican automáticamente según el club del usuario

### 5. **combo_productos** (Productos de Combos)
- **Eventos**: INSERT, UPDATE, DELETE
- **Uso**: Sincroniza cambios en la configuración de productos en combos
- **Filtros RLS**: Se aplican automáticamente según el club del usuario

## Orden de Ejecución

```sql
-- Ejecutar en Supabase SQL Editor:
supabase/migrations/06_realtime/enable_realtime.sql
```

## Implementación en el Frontend

### Ejemplo: Suscripción a Ventas

```typescript
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// En tu componente de ventas
const { user } = useAuth()

useEffect(() => {
  const channel = supabase
    .channel('sales-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'sale',
        filter: `club_id=eq.${user.club.id}`
      },
      (payload) => {
        console.log('Nueva venta:', payload)
        // Actualizar estado local o refetch data
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user.club.id])
```

### Ejemplo: Suscripción a Cambios de Stock

```typescript
useEffect(() => {
  const channel = supabase
    .channel('stock-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'productos',
        filter: `club_id=eq.${user.club.id}`
      },
      (payload) => {
        console.log('Stock actualizado:', payload)
        // Actualizar estado local
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user.club.id])
```

## Seguridad

- **RLS se aplica automáticamente**: Supabase respeta las políticas RLS en las suscripciones realtime
- **Aislamiento por club**: Los usuarios solo reciben eventos de su propio club
- **Autenticación requerida**: Solo usuarios autenticados pueden suscribirse

## Notas Importantes

1. **Filtros obligatorios**: Siempre incluye `filter: club_id=eq.${user.club.id}` para asegurar aislamiento
2. **Cleanup**: Siempre limpia las suscripciones en el return del useEffect
3. **Canal único por tabla**: No reutilices canales entre diferentes tablas
4. **Performance**: Limita el número de suscripciones activas simultáneas
