# Guía para Claude: Desarrollo de Secciones Admin

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Flujo de Desarrollo](#flujo-de-desarrollo)
4. [Problemas Comunes y Soluciones](#problemas-comunes-y-soluciones)
5. [Checklist de Desarrollo](#checklist-de-desarrollo)
6. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 🏗️ Arquitectura General

### Stack Tecnológico

- **Framework:** React 19 + TypeScript + Vite
- **Base de datos:** Supabase (PostgreSQL) con Row Level Security (RLS)
- **UI:** shadcn/ui + Tailwind CSS
- **Validación:** react-hook-form + zod
- **Patrón de diseño:** Atomic Design

### Principios Fundamentales

1. **Multi-Tenancy:** Cada club es un tenant aislado
2. **Type Safety:** Todo debe estar tipado con TypeScript
3. **Atomic Design:** Componentes organizados en Atoms → Molecules → Organisms → Pages
4. **Modularidad:** Cada dominio (Productos, Ventas, etc.) tiene su propio directorio

---

## 📂 Estructura de Archivos

### 1. Types (Tipos de TypeScript)

**Ubicación:** `src/types/database/[NombreEntidad]/`

```
types/database/
└── NombreEntidad/
    └── index.ts
```

**Contenido del archivo:**

```typescript
/**
 * NombreEntidad Types
 * Descripción de la entidad
 */

// Enums (si aplica)
export type TipoEnum = 'Opcion1' | 'Opcion2' | 'Opcion3';

// Interface principal
export interface NombreEntidad {
  id: string;
  club_id: string;
  campo1: string;
  campo2: number;
  // ... otros campos
  created_at: string;
  updated_at: string;
}

// Insert type (para crear)
export interface NombreEntidadInsert {
  club_id: string;
  campo1: string;
  campo2: number;
  // NO incluir: id, created_at, updated_at
}

// Update type (para actualizar)
export interface NombreEntidadUpdate {
  campo1?: string;
  campo2?: number;
  // Todos los campos opcionales excepto id, club_id, created_at, updated_at
}

// Form data (datos del formulario)
export interface NombreEntidadFormData {
  campo1: string;
  campo2: number;
  // Solo campos editables por el usuario
}
```

**Actualizar index principal:**

```typescript
// types/database/index.ts
export type {
  NombreEntidad,
  NombreEntidadInsert,
  NombreEntidadUpdate,
  NombreEntidadFormData,
} from './NombreEntidad';
```

**Actualizar database.ts:**

```typescript
// types/database/database.ts
import type { NombreEntidad, NombreEntidadInsert, NombreEntidadUpdate } from './NombreEntidad';

export interface Database {
  public: {
    Tables: {
      nombre_entidad: {
        Row: NombreEntidad;
        Insert: NombreEntidadInsert;
        Update: NombreEntidadUpdate;
      };
      // ... otras tablas
    };
  };
}
```

### 2. Atoms (Componentes Básicos)

**Ubicación:** `src/components/atoms/`

**Cuándo crear un Atom:**
- Componentes reutilizables pequeños
- No tienen dependencias de otros componentes de negocio
- Ejemplos: ImageUploader, Badge personalizado, Input especializado

**Ejemplo:**

```typescript
// src/components/atoms/CustomBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CustomBadgeProps {
  value: number;
  threshold: number;
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({ value, threshold }) => {
  const variant = value > threshold ? 'default' : 'destructive';

  return (
    <Badge variant={variant}>
      {value}
    </Badge>
  );
};
```

### 3. Molecules (Componentes Compuestos)

**Ubicación:** `src/components/molecules/[NombreEntidad]/`

```
molecules/
└── NombreEntidad/
    ├── NombreEntidadCard.tsx        # Vista de tarjeta
    ├── NombreEntidadFilters.tsx     # Filtros de búsqueda
    ├── NombreEntidadForm.tsx        # Formulario principal
    └── index.ts                      # Re-exportaciones
```

**Cuándo crear un Molecule:**
- Combina varios atoms
- Tiene una función específica del dominio
- Es reutilizable dentro del dominio
- Ejemplos: Card, Form, Filters, Stats panel

**Ejemplo de Card:**

```typescript
// molecules/NombreEntidad/NombreEntidadCard.tsx
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { NombreEntidad } from '@/types/database/NombreEntidad';

interface NombreEntidadCardProps {
  item: NombreEntidad;
  onEdit: (item: NombreEntidad) => void;
  onDelete: (item: NombreEntidad) => void;
}

export const NombreEntidadCard: React.FC<NombreEntidadCardProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">{item.campo1}</h3>
      </CardHeader>
      <CardContent>
        {/* Contenido */}
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(item)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
```

**Ejemplo de Form con react-hook-form + zod:**

```typescript
// molecules/NombreEntidad/NombreEntidadForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NombreEntidad, NombreEntidadFormData } from '@/types/database/NombreEntidad';

// Schema de validación
const formSchema = z.object({
  campo1: z.string().min(1, 'El campo es requerido'),
  campo2: z.number().min(0, 'Debe ser mayor o igual a 0'),
});

type FormData = z.infer<typeof formSchema>;

interface NombreEntidadFormProps {
  item?: NombreEntidad | null;
  onSubmit: (data: NombreEntidadFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const NombreEntidadForm: React.FC<NombreEntidadFormProps> = ({
  item,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campo1: item?.campo1 || '',
      campo2: item?.campo2 || 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="campo1">Campo 1 *</Label>
        <Input
          id="campo1"
          {...register('campo1')}
          disabled={isSubmitting}
        />
        {errors.campo1 && (
          <p className="text-sm text-destructive mt-1">{errors.campo1.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="campo2">Campo 2 *</Label>
        <Input
          id="campo2"
          type="number"
          {...register('campo2', { valueAsNumber: true })}
          disabled={isSubmitting}
        />
        {errors.campo2 && (
          <p className="text-sm text-destructive mt-1">{errors.campo2.message}</p>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : item ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};
```

**Archivo index.ts:**

```typescript
// molecules/NombreEntidad/index.ts
export { NombreEntidadCard } from './NombreEntidadCard';
export { NombreEntidadFilters } from './NombreEntidadFilters';
export { NombreEntidadForm } from './NombreEntidadForm';
```

### 4. Organisms (Componentes Complejos)

**Ubicación:** `src/components/organisms/[NombreEntidad]/`

```
organisms/
└── NombreEntidad/
    ├── NombreEntidadGrid.tsx        # Vista de grilla
    ├── NombreEntidadTable.tsx       # Vista de tabla
    ├── NombreEntidadModal.tsx       # Modal CRUD
    └── index.ts                      # Re-exportaciones
```

**Cuándo crear un Organism:**
- Combina múltiples molecules
- Representa una sección completa de funcionalidad
- Orquesta la lógica de presentación
- Ejemplos: Grid, Table, Modal

**Ejemplo de Grid:**

```typescript
// organisms/NombreEntidad/NombreEntidadGrid.tsx
import React from 'react';
import { NombreEntidadCard } from '@/components/molecules/NombreEntidad';
import type { NombreEntidad } from '@/types/database/NombreEntidad';

interface NombreEntidadGridProps {
  items: NombreEntidad[];
  onEdit: (item: NombreEntidad) => void;
  onDelete: (item: NombreEntidad) => void;
}

export const NombreEntidadGrid: React.FC<NombreEntidadGridProps> = ({
  items,
  onEdit,
  onDelete,
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontraron elementos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <NombreEntidadCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
```

**Ejemplo de Modal:**

```typescript
// organisms/NombreEntidad/NombreEntidadModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NombreEntidadForm } from '@/components/molecules/NombreEntidad';
import type { NombreEntidad, NombreEntidadFormData } from '@/types/database/NombreEntidad';

interface NombreEntidadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: NombreEntidad | null;
  onSubmit: (data: NombreEntidadFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const NombreEntidadModal: React.FC<NombreEntidadModalProps> = ({
  open,
  onOpenChange,
  item,
  onSubmit,
  isSubmitting = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar elemento' : 'Crear nuevo elemento'}
          </DialogTitle>
          <DialogDescription>
            {item
              ? 'Modifica los datos y guarda los cambios'
              : 'Completa el formulario para crear un nuevo elemento'}
          </DialogDescription>
        </DialogHeader>

        <NombreEntidadForm
          item={item}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};
```

### 5. Page (Página Principal)

**Ubicación:** `src/pages/admin/[nombre-entidad]/NombreEntidadPage.tsx`

**Estructura de una Page:**

```typescript
import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NombreEntidadFilters } from '@/components/molecules/NombreEntidad';
import { NombreEntidadGrid, NombreEntidadModal } from '@/components/organisms/NombreEntidad';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { NombreEntidad, NombreEntidadFormData } from '@/types/database/NombreEntidad';

export const NombreEntidadPage: React.FC = () => {
  const { user } = useAuth();

  // State para datos
  const [items, setItems] = useState<NombreEntidad[]>([]);
  const [filteredItems, setFilteredItems] = useState<NombreEntidad[]>([]);
  const [loading, setLoading] = useState(true);

  // State para filtros
  const [searchTerm, setSearchTerm] = useState('');

  // State para modales
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NombreEntidad | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State para eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<NombreEntidad | null>(null);

  // Fetch data
  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nombre_entidad')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filtrado
  useEffect(() => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.campo1.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [items, searchTerm]);

  // Create
  const handleCreate = async (data: NombreEntidadFormData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // @ts-ignore - Supabase type inference issue
      const { error } = await supabase.from('nombre_entidad').insert({
        club_id: user.club.id,
        ...data,
      });

      if (error) throw error;

      toast.success('Elemento creado exitosamente');
      setModalOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Error al crear el elemento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update
  const handleUpdate = async (data: NombreEntidadFormData) => {
    if (!user || !selectedItem) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('nombre_entidad')
        // @ts-ignore - Supabase type inference issue
        .update(data)
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast.success('Elemento actualizado exitosamente');
      setModalOpen(false);
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Error al actualizar el elemento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('nombre_entidad')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast.success('Elemento eliminado exitosamente');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error al eliminar el elemento');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: NombreEntidad) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const openDeleteDialog = (item: NombreEntidad) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nombre Entidad</h1>
            <p className="text-muted-foreground">
              Descripción de la sección
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo elemento
          </Button>
        </div>

        {/* Filters */}
        <NombreEntidadFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Content */}
        {loading ? (
          <div>Cargando...</div>
        ) : (
          <NombreEntidadGrid
            items={filteredItems}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
          />
        )}

        {/* Modal */}
        <NombreEntidadModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          item={selectedItem}
          onSubmit={selectedItem ? handleUpdate : handleCreate}
          isSubmitting={isSubmitting}
        />

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El elemento será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};
```

---

## 🔄 Flujo de Desarrollo

### Orden Recomendado

1. **📊 Base de datos** (SQL en Supabase)
   - Crear tabla con RLS
   - Definir políticas de seguridad
   - Verificar que funciona correctamente

2. **📝 Types** (TypeScript)
   - Crear directorio en `types/database/[NombreEntidad]/`
   - Definir interfaces y tipos
   - Actualizar `database.ts` e `index.ts`

3. **⚛️ Atoms** (si es necesario)
   - Crear componentes reutilizables básicos
   - Solo si no existen en shadcn/ui

4. **🧬 Molecules**
   - Crear directorio en `molecules/[NombreEntidad]/`
   - Implementar Card, Form, Filters
   - Crear `index.ts` para exportaciones

5. **🔬 Organisms**
   - Crear directorio en `organisms/[NombreEntidad]/`
   - Implementar Grid, Table, Modal
   - Crear `index.ts` para exportaciones

6. **📄 Page**
   - Crear archivo en `pages/admin/[nombre-entidad]/`
   - Implementar lógica de negocio (CRUD)
   - Conectar todos los componentes

7. **🧪 Testing**
   - Ejecutar `npm run build`
   - Verificar TypeScript
   - Probar funcionalidad completa

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: Errores de TypeScript con Supabase

**Síntoma:**
```typescript
Argument of type '{ campo: string }' is not assignable to parameter of type 'never'
```

**Causa:** Los tipos generados de Supabase a veces no se infieren correctamente.

**Solución:** Usar `// @ts-ignore` antes de la operación:

```typescript
// @ts-ignore - Supabase type inference issue
const { error } = await supabase.from('tabla').insert({ ... });
```

**Mejor solución:** Definir tipos explícitos en `database.ts`:

```typescript
productos: {
  Row: Producto;
  Insert: {
    club_id: string;
    nombre: string;
    // ... campos específicos
  };
  Update: {
    nombre?: string;
    // ... campos opcionales
  };
}
```

### Problema 2: Imports Circulares

**Síntoma:**
```
Module '"@/types/database/Auth"' has no exported member 'Personal'
```

**Causa:** Dependencias circulares entre módulos de tipos.

**Solución:** Asegurar que las importaciones sean unidireccionales:

```typescript
// ✅ CORRECTO
// Auth/index.ts importa de Personal y Club
import type { Personal } from '../Personal';
import type { Club } from '../Club';

// ❌ INCORRECTO
// Personal/index.ts NO debe importar de Auth
```

### Problema 3: Re-exportaciones no Funcionan

**Síntoma:**
```
Module has no exported member 'ComponentName'
```

**Causa:** Falta el archivo `index.ts` o las exportaciones están incorrectas.

**Solución:**

```typescript
// molecules/NombreEntidad/index.ts
export { Component1 } from './Component1';
export { Component2 } from './Component2';

// NO usar export * from './Component1' si hay conflictos de nombres
```

### Problema 4: Estado No se Actualiza

**Síntoma:** Después de crear/actualizar, la lista no se actualiza.

**Causa:** No se está llamando a `fetchItems()` después de la operación.

**Solución:**

```typescript
const handleCreate = async (data) => {
  // ... lógica de creación
  await supabase.from('tabla').insert(data);

  // ✅ Refrescar datos
  fetchItems();

  // ✅ Cerrar modal
  setModalOpen(false);
};
```

### Problema 5: Multi-tenancy no Funciona

**Síntoma:** Los usuarios ven datos de otros clubs.

**Causa:** No se está pasando el `club_id` o RLS no está habilitado.

**Solución:**

```typescript
// ✅ Siempre incluir club_id al crear
const { error } = await supabase.from('tabla').insert({
  club_id: user.club.id, // ← IMPORTANTE
  ...data,
});

// ✅ Verificar RLS en Supabase
ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their club data"
ON tabla FOR SELECT
USING (club_id = get_user_club_id());
```

### Problema 6: Imágenes no se Suben

**Síntoma:** Error al subir imágenes a Supabase Storage.

**Causa:** Bucket no existe o permisos incorrectos.

**Solución:**

1. **Crear bucket en Supabase:**
   - Storage → New bucket
   - Nombre: `[entidad]-images`
   - Public: true

2. **Usar funciones de storage:**

```typescript
import { uploadImage, STORAGE_BUCKETS } from '@/lib/storage';

const { url, error } = await uploadImage(
  STORAGE_BUCKETS.NOMBRE_BUCKET,
  file,
  user.club.id
);
```

3. **Agregar bucket a constants:**

```typescript
// lib/storage.ts
export const STORAGE_BUCKETS = {
  PRODUCTOS: 'productos-images',
  NUEVA_ENTIDAD: 'nueva-entidad-images', // ← Agregar aquí
} as const;
```

### Problema 7: Form No Valida Correctamente

**Síntoma:** Validación de zod no funciona como se espera.

**Causa:** Schema de zod mal configurado o tipos incorrectos.

**Solución:**

```typescript
// ✅ Schema correcto con mensajes en español
const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  edad: z.number().min(0, 'Debe ser mayor o igual a 0'),
  email: z.string().email('Email inválido'),
});

// ✅ Usar en useForm
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});

// ✅ Para números, usar valueAsNumber
<Input
  type="number"
  {...register('edad', { valueAsNumber: true })}
/>
```

### Problema 8: Build Falla pero Dev Funciona

**Síntoma:** `npm run dev` funciona pero `npm run build` falla.

**Causa:** TypeScript en modo estricto detecta errores que el dev server ignora.

**Solución:**

1. **Revisar errores de TypeScript:**
```bash
npm run build
```

2. **Arreglar tipos faltantes:**
```typescript
// ❌ any implícito
const handleClick = (item) => { ... }

// ✅ Tipo explícito
const handleClick = (item: NombreEntidad) => { ... }
```

3. **Arreglar imports faltantes:**
```typescript
// Verificar que todos los tipos estén importados
import type { Tipo1, Tipo2 } from '@/types/database/...';
```

---

## ✅ Checklist de Desarrollo

### Antes de Empezar

- [ ] Revisar la tabla SQL en Supabase
- [ ] Verificar que RLS esté habilitado
- [ ] Confirmar estructura de datos
- [ ] Verificar permisos (Admin, Bartender, etc.)

### Durante el Desarrollo

**Types:**
- [ ] Crear directorio en `types/database/[NombreEntidad]/`
- [ ] Definir interface principal
- [ ] Definir Insert y Update types
- [ ] Definir FormData type (si aplica)
- [ ] Actualizar `database.ts`
- [ ] Actualizar `index.ts` principal
- [ ] Agregar enums si es necesario

**Atoms (opcional):**
- [ ] Identificar componentes reutilizables únicos
- [ ] Crear en `components/atoms/`
- [ ] Exportar correctamente

**Molecules:**
- [ ] Crear directorio `molecules/[NombreEntidad]/`
- [ ] Implementar Card component
- [ ] Implementar Form component con react-hook-form + zod
- [ ] Implementar Filters component
- [ ] Implementar Stats component (opcional)
- [ ] Crear `index.ts` con exportaciones
- [ ] Actualizar imports en todos los archivos

**Organisms:**
- [ ] Crear directorio `organisms/[NombreEntidad]/`
- [ ] Implementar Grid component
- [ ] Implementar Table component (opcional)
- [ ] Implementar Modal component
- [ ] Crear `index.ts` con exportaciones
- [ ] Actualizar imports en todos los archivos

**Page:**
- [ ] Crear archivo en `pages/admin/[nombre-entidad]/`
- [ ] Implementar estado (items, loading, modals)
- [ ] Implementar fetchItems
- [ ] Implementar handleCreate
- [ ] Implementar handleUpdate
- [ ] Implementar handleDelete
- [ ] Implementar filtrado (si aplica)
- [ ] Conectar todos los componentes
- [ ] Agregar AlertDialog para confirmación de eliminación

**Testing:**
- [ ] Ejecutar `npm run build` sin errores
- [ ] Probar crear elemento
- [ ] Probar editar elemento
- [ ] Probar eliminar elemento
- [ ] Probar filtros (si aplica)
- [ ] Verificar multi-tenancy (no ver datos de otros clubs)
- [ ] Verificar permisos de rol
- [ ] Probar en diferentes resoluciones

---

## 📚 Ejemplos Prácticos

### Ejemplo 1: Entidad Simple (Categorías)

**SQL:**
```sql
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
```

**Types:**
```typescript
// types/database/Categorias/index.ts
export interface Categoria {
  id: string;
  club_id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaInsert {
  club_id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface CategoriaUpdate {
  nombre?: string;
  descripcion?: string | null;
}

export interface CategoriaFormData {
  nombre: string;
  descripcion: string;
}
```

### Ejemplo 2: Entidad con Relaciones (Ventas)

**Types:**
```typescript
// types/database/Ventas/index.ts
export interface Venta {
  id: string;
  club_id: string;
  producto_id: string;
  vendedor_id: string;
  cantidad: number;
  total: number;
  fecha: string;
  created_at: string;
}

// Con relaciones expandidas
export interface VentaConRelaciones extends Venta {
  producto: {
    nombre: string;
    precio: number;
  };
  vendedor: {
    nombre: string;
    apellido: string;
  };
}
```

**Query con relaciones:**
```typescript
const { data } = await supabase
  .from('ventas')
  .select(`
    *,
    producto:productos(nombre, precio),
    vendedor:personal(nombre, apellido)
  `);
```

### Ejemplo 3: Entidad con Imagen

```typescript
// En el Form
const [imageFile, setImageFile] = useState<File | null>(null);

// En handleCreate
const handleCreate = async (data: FormData) => {
  let imagen_url: string | null = null;

  // 1. Upload image
  if (imageFile) {
    const { url, error } = await uploadImage(
      STORAGE_BUCKETS.ENTIDAD,
      imageFile,
      user.club.id
    );
    if (error) {
      toast.error('Error al subir la imagen');
      return;
    }
    imagen_url = url;
  }

  // 2. Create record
  // @ts-ignore
  const { error } = await supabase.from('entidad').insert({
    club_id: user.club.id,
    ...data,
    imagen_url,
  });

  if (error) throw error;

  toast.success('Creado exitosamente');
  fetchItems();
};
```

---

## 🎯 Consejos Finales

1. **Mantén la Consistencia:** Sigue siempre el mismo patrón para todas las secciones
2. **Type Safety:** No uses `any`, define tipos explícitos
3. **Modularidad:** Divide en componentes pequeños y reutilizables
4. **Testing:** Siempre ejecuta `npm run build` antes de considerar terminado
5. **Documentación:** Agrega comentarios JSDoc en funciones complejas
6. **Git:** Commits frecuentes con mensajes descriptivos
7. **Seguridad:** Nunca confíes en datos del cliente, siempre valida en el servidor (RLS)
8. **Optimización:** Usa React.memo para componentes que renderizan listas grandes
9. **Accesibilidad:** Usa labels, aria-labels y manejo de teclado
10. **Responsive:** Prueba en mobile, tablet y desktop

---

## 📖 Referencias

- [Documentación de shadcn/ui](https://ui.shadcn.com/)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Supabase](https://supabase.com/docs)
- [CLAUDE.md](./CLAUDE.md) - Instrucciones del proyecto
- [STRUCTURE.md](./STRUCTURE.md) - Estructura de archivos

---

**Versión:** 1.0
**Última actualización:** 2025-01-06
**Basado en:** Implementación de la sección de Productos
