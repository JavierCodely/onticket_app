# 🔨 Flujo de Desarrollo

## Orden Recomendado para Crear Nueva Sección

### 1. 📊 Base de Datos (SQL en Supabase)

**Crear tabla con RLS:**

```sql
-- Ejemplo: tabla "eventos"
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL,
  descripcion TEXT,
  precio_entrada NUMERIC(10, 2) NOT NULL DEFAULT 0,
  imagen_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_precio_entrada_non_negative CHECK (precio_entrada >= 0)
);

-- Índices
CREATE INDEX idx_eventos_club_id ON eventos(club_id);
CREATE INDEX idx_eventos_fecha ON eventos(fecha DESC);

-- Habilitar RLS
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
```

**Definir políticas RLS:**

```sql
-- SELECT: Todos pueden ver eventos de su club
CREATE POLICY "eventos_select_policy"
ON eventos FOR SELECT
USING (club_id = get_user_club_id());

-- INSERT: Solo Admin
CREATE POLICY "eventos_insert_policy"
ON eventos FOR INSERT
WITH CHECK (is_admin() AND club_id = get_user_club_id());

-- UPDATE: Solo Admin
CREATE POLICY "eventos_update_policy"
ON eventos FOR UPDATE
USING (club_id = get_user_club_id() AND is_admin());

-- DELETE: Solo Admin
CREATE POLICY "eventos_delete_policy"
ON eventos FOR DELETE
USING (club_id = get_user_club_id() AND is_admin());
```

**Verificar:**
```sql
-- Insertar datos de prueba
INSERT INTO eventos (club_id, nombre, fecha, precio_entrada)
VALUES (
  (SELECT id FROM club LIMIT 1),
  'Evento Test',
  NOW() + INTERVAL '7 days',
  1000.00
);

-- Verificar RLS funciona
SELECT * FROM eventos; -- Debe retornar solo eventos del club del usuario
```

---

### 2. 📝 Types (TypeScript)

**Crear directorio:** `src/types/database/Eventos/`

**Archivo `index.ts`:**

```typescript
/**
 * Eventos Types
 * Gestión de eventos del club
 */

export interface Evento {
  id: string;
  club_id: string;
  nombre: string;
  fecha: string;
  descripcion: string | null;
  precio_entrada: number;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventoInsert {
  club_id: string;
  nombre: string;
  fecha: string;
  descripcion?: string | null;
  precio_entrada: number;
  imagen_url?: string | null;
}

export interface EventoUpdate {
  nombre?: string;
  fecha?: string;
  descripcion?: string | null;
  precio_entrada?: number;
  imagen_url?: string | null;
}

export interface EventoFormData {
  nombre: string;
  fecha: string;
  descripcion: string;
  precio_entrada: number;
}
```

**Actualizar `database.ts`:**

```typescript
import type { Evento, EventoInsert, EventoUpdate } from './Eventos';

export interface Database {
  public: {
    Tables: {
      // ... otras tablas
      eventos: {
        Row: Evento;
        Insert: EventoInsert;
        Update: EventoUpdate;
      };
    };
  };
}
```

**Actualizar `index.ts` principal:**

```typescript
// types/database/index.ts
export type {
  Evento,
  EventoInsert,
  EventoUpdate,
  EventoFormData,
} from './Eventos';
```

---

### 3. ⚛️ Atoms (si es necesario)

Solo crear si necesitas un componente muy específico que no existe en shadcn/ui.

**Ejemplo: EventoBadge**

```typescript
// src/components/atoms/EventoBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { differenceInDays } from 'date-fns';

interface EventoBadgeProps {
  fecha: string;
}

export const EventoBadge: React.FC<EventoBadgeProps> = ({ fecha }) => {
  const days = differenceInDays(new Date(fecha), new Date());

  if (days < 0) {
    return <Badge variant="secondary">Finalizado</Badge>;
  }

  if (days === 0) {
    return <Badge variant="default">Hoy</Badge>;
  }

  if (days <= 7) {
    return <Badge variant="destructive">En {days} días</Badge>;
  }

  return <Badge variant="outline">Próximamente</Badge>;
};
```

---

### 4. 🧬 Molecules

**Crear directorio:** `src/components/molecules/Eventos/`

#### EventoCard.tsx

```typescript
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { FormattedCurrency } from '@/components/atoms/FormattedCurrency';
import { EventoBadge } from '@/components/atoms/EventoBadge';
import type { Evento } from '@/types/database/Eventos';

interface EventoCardProps {
  evento: Evento;
  onEdit: (evento: Evento) => void;
  onDelete: (evento: Evento) => void;
}

export const EventoCard: React.FC<EventoCardProps> = ({
  evento,
  onEdit,
  onDelete,
}) => {
  return (
    <Card>
      {evento.imagen_url && (
        <img
          src={evento.imagen_url}
          alt={evento.nombre}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{evento.nombre}</h3>
          <EventoBadge fecha={evento.fecha} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date(evento.fecha).toLocaleDateString()}</span>
        </div>
        {evento.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {evento.descripcion}
          </p>
        )}
        <div className="pt-2 border-t">
          <p className="text-sm">Entrada:</p>
          <p className="text-xl font-bold">
            <FormattedCurrency value={evento.precio_entrada} />
          </p>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(evento)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(evento)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
```

#### EventoForm.tsx

```typescript
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/atoms/CurrencyInput';
import { ImageUploader } from '@/components/atoms/ImageUploader';
import type { Evento, EventoFormData } from '@/types/database/Eventos';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  descripcion: z.string(),
  precio_entrada: z.number().min(0, 'Debe ser mayor o igual a 0'),
});

interface EventoFormProps {
  evento?: Evento | null;
  onSubmit: (data: EventoFormData, imageFile: File | null) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const EventoForm: React.FC<EventoFormProps> = ({
  evento,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EventoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: evento?.nombre || '',
      fecha: evento?.fecha?.split('T')[0] || '',
      descripcion: evento?.descripcion || '',
      precio_entrada: evento?.precio_entrada || 0,
    },
  });

  const onSubmitHandler = async (data: EventoFormData) => {
    await onSubmit(data, imageFile);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre del Evento *</Label>
        <Input
          id="nombre"
          {...register('nombre')}
          disabled={isSubmitting}
        />
        {errors.nombre && (
          <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="fecha">Fecha *</Label>
        <Input
          id="fecha"
          type="date"
          {...register('fecha')}
          disabled={isSubmitting}
        />
        {errors.fecha && (
          <p className="text-sm text-destructive mt-1">{errors.fecha.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          {...register('descripcion')}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="precio_entrada">Precio de Entrada *</Label>
        <Controller
          name="precio_entrada"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              id="precio_entrada"
              value={field.value}
              onChange={(val) => field.onChange(val ?? 0)}
              disabled={isSubmitting}
            />
          )}
        />
        {errors.precio_entrada && (
          <p className="text-sm text-destructive mt-1">
            {errors.precio_entrada.message}
          </p>
        )}
      </div>

      <div>
        <Label>Imagen del Evento</Label>
        <ImageUploader
          currentImageUrl={evento?.imagen_url}
          onImageSelect={setImageFile}
          onImageRemove={() => setImageFile(null)}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : evento ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};
```

#### EventoFilters.tsx

```typescript
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface EventoFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const EventoFilters: React.FC<EventoFiltersProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
};
```

#### index.ts

```typescript
export { EventoCard } from './EventoCard';
export { EventoForm } from './EventoForm';
export { EventoFilters } from './EventoFilters';
```

---

### 5. 🔬 Organisms

**Crear directorio:** `src/components/organisms/Eventos/`

#### EventoGrid.tsx

```typescript
import React from 'react';
import { EventoCard } from '@/components/molecules/Eventos';
import type { Evento } from '@/types/database/Eventos';

interface EventoGridProps {
  eventos: Evento[];
  onEdit: (evento: Evento) => void;
  onDelete: (evento: Evento) => void;
}

export const EventoGrid: React.FC<EventoGridProps> = ({
  eventos,
  onEdit,
  onDelete,
}) => {
  if (eventos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontraron eventos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {eventos.map((evento) => (
        <EventoCard
          key={evento.id}
          evento={evento}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
```

#### EventoModal.tsx

```typescript
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EventoForm } from '@/components/molecules/Eventos';
import type { Evento, EventoFormData } from '@/types/database/Eventos';

interface EventoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento?: Evento | null;
  onSubmit: (data: EventoFormData, imageFile: File | null) => Promise<void>;
  isSubmitting?: boolean;
}

export const EventoModal: React.FC<EventoModalProps> = ({
  open,
  onOpenChange,
  evento,
  onSubmit,
  isSubmitting = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {evento ? 'Editar Evento' : 'Crear Nuevo Evento'}
          </DialogTitle>
          <DialogDescription>
            {evento
              ? 'Modifica los datos del evento y guarda los cambios'
              : 'Completa el formulario para crear un nuevo evento'}
          </DialogDescription>
        </DialogHeader>

        <EventoForm
          evento={evento}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};
```

#### index.ts

```typescript
export { EventoGrid } from './EventoGrid';
export { EventoModal } from './EventoModal';
```

---

### 6. 📄 Page

**Crear archivo:** `src/pages/admin/eventos/EventosPage.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EventoFilters } from '@/components/molecules/Eventos';
import { EventoGrid, EventoModal } from '@/components/organisms/Eventos';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadImage, STORAGE_BUCKETS } from '@/lib/storage';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Evento, EventoFormData } from '@/types/database/Eventos';

export const EventosPage: React.FC = () => {
  const { user } = useAuth();

  // State para datos
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filteredEventos, setFilteredEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  // State para filtros
  const [searchTerm, setSearchTerm] = useState('');

  // State para modales
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State para eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);

  // Fetch eventos
  const fetchEventos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: true });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error('Error fetching eventos:', error);
      toast.error('Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  // Filtrado
  useEffect(() => {
    let filtered = eventos;

    if (searchTerm) {
      filtered = filtered.filter((evento) =>
        evento.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEventos(filtered);
  }, [eventos, searchTerm]);

  // Create
  const handleCreate = async (data: EventoFormData, imageFile: File | null) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      let imagen_url: string | null = null;

      // Upload image
      if (imageFile) {
        const { url, error } = await uploadImage(
          STORAGE_BUCKETS.EVENTOS, // Agregar este bucket
          imageFile,
          user.club.id
        );
        if (error) {
          toast.error('Error al subir la imagen');
          return;
        }
        imagen_url = url;
      }

      // @ts-ignore
      const { error } = await supabase.from('eventos').insert({
        club_id: user.club.id,
        ...data,
        imagen_url,
      });

      if (error) throw error;

      toast.success('Evento creado exitosamente');
      setModalOpen(false);
      fetchEventos();
    } catch (error) {
      console.error('Error creating evento:', error);
      toast.error('Error al crear el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update
  const handleUpdate = async (data: EventoFormData, imageFile: File | null) => {
    if (!user || !selectedEvento) return;

    try {
      setIsSubmitting(true);

      let imagen_url: string | undefined = selectedEvento.imagen_url || undefined;

      // Upload new image if selected
      if (imageFile) {
        const { url, error } = await uploadImage(
          STORAGE_BUCKETS.EVENTOS,
          imageFile,
          user.club.id
        );
        if (error) {
          toast.error('Error al subir la imagen');
          return;
        }
        imagen_url = url;
      }

      const { error } = await supabase
        .from('eventos')
        // @ts-ignore
        .update({
          ...data,
          imagen_url,
        })
        .eq('id', selectedEvento.id);

      if (error) throw error;

      toast.success('Evento actualizado exitosamente');
      setModalOpen(false);
      setSelectedEvento(null);
      fetchEventos();
    } catch (error) {
      console.error('Error updating evento:', error);
      toast.error('Error al actualizar el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!eventoToDelete) return;

    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventoToDelete.id);

      if (error) throw error;

      toast.success('Evento eliminado exitosamente');
      fetchEventos();
    } catch (error) {
      console.error('Error deleting evento:', error);
      toast.error('Error al eliminar el evento');
    } finally {
      setDeleteDialogOpen(false);
      setEventoToDelete(null);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setSelectedEvento(null);
    setModalOpen(true);
  };

  const openEditModal = (evento: Evento) => {
    setSelectedEvento(evento);
    setModalOpen(true);
  };

  const openDeleteDialog = (evento: Evento) => {
    setEventoToDelete(evento);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
            <p className="text-muted-foreground">
              Gestiona los eventos de tu club
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>

        {/* Filters */}
        <EventoFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">Cargando eventos...</div>
        ) : (
          <EventoGrid
            eventos={filteredEventos}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
          />
        )}

        {/* Modal */}
        <EventoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          evento={selectedEvento}
          onSubmit={selectedEvento ? handleUpdate : handleCreate}
          isSubmitting={isSubmitting}
        />

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El evento será eliminado permanentemente.
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

### 7. 🧪 Testing

```bash
# 1. Build
npm run build

# 2. Verificar errores TypeScript

# 3. Probar funcionalidad
# - Crear evento
# - Editar evento
# - Eliminar evento
# - Buscar eventos
# - Subir imagen
# - Verificar multi-tenancy (no ver eventos de otros clubs)
```

---

## Resumen del Flujo

1. **Base de Datos:** Tabla + RLS + Verificación ✅
2. **Types:** Interfaces + Database + Index ✅
3. **Atoms:** Solo si es necesario ✅
4. **Molecules:** Card + Form + Filters + Index ✅
5. **Organisms:** Grid + Modal + Index ✅
6. **Page:** CRUD completo con lógica ✅
7. **Testing:** Build + Pruebas manuales ✅

---

[← Volver al Índice](./00_indice.md) | [Siguiente: Problemas Comunes →](./10_problemas_soluciones.md)
