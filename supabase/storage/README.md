# Supabase Storage Configuration

Este directorio contiene la configuración para Supabase Storage, permitiendo almacenar y gestionar imágenes de productos, promociones y combos.

## Estructura de Buckets

### 1. **productos-images**
- Almacena imágenes de productos
- Estructura: `{club_id}/{timestamp}.{ext}`
- Público: ✅ Sí

### 2. **promociones-images**
- Almacena imágenes de promociones
- Estructura: `{club_id}/{timestamp}.{ext}`
- Público: ✅ Sí

### 3. **combos-images**
- Almacena imágenes de combos
- Estructura: `{club_id}/{timestamp}.{ext}`
- Público: ✅ Sí

## Orden de Configuración en Supabase

### Paso 1: Agregar columnas imagen_url (SQL Editor)
```sql
-- Ejecutar en SQL Editor:
supabase/migrations/updates/add_imagen_url_columns.sql
```

### Paso 2: Crear Buckets (Dashboard UI)

**⚠️ Los buckets NO se pueden crear con SQL, debes crearlos desde el Dashboard:**

1. Ve a **Storage** en el menú lateral de Supabase Dashboard
2. Click en **"New bucket"**
3. Crea estos 3 buckets con la siguiente configuración EXACTA:

   **Bucket 1: productos-images**
   - Name: `productos-images`
   - Public: ✅ Activado (CRÍTICO)
   - File size limit: Dejar vacío o 5242880 (5MB)
   - Allowed MIME types: **Dejar VACÍO** (NO poner `image/*` - debe estar completamente vacío)

   **Bucket 2: promociones-images**
   - Name: `promociones-images`
   - Public: ✅ Activado (CRÍTICO)
   - File size limit: Dejar vacío
   - Allowed MIME types: **Dejar VACÍO**

   **Bucket 3: combos-images**
   - Name: `combos-images`
   - Public: ✅ Activado (CRÍTICO)
   - File size limit: Dejar vacío
   - Allowed MIME types: **Dejar VACÍO**

**🔴 IMPORTANTE:** Si pones restricciones de MIME types en el bucket, obtendrás errores de "mime type not supported". Las validaciones de tipo se manejan en el código (src/lib/storage.ts)

### Paso 3: Aplicar políticas de seguridad (SQL Editor)
```sql
-- Ejecutar DESPUÉS de crear los buckets:
supabase/storage/policies.sql
```

## Políticas de Seguridad (RLS)

### Productos Images
- **SELECT**: Todos los usuarios autenticados pueden ver imágenes de su club
- **INSERT**: Solo Admin puede subir imágenes a su club
- **UPDATE**: Solo Admin puede actualizar imágenes de su club
- **DELETE**: Solo Admin puede eliminar imágenes de su club

### Promociones Images
- **SELECT**: Todos los usuarios autenticados pueden ver imágenes de su club
- **INSERT**: Solo Admin puede subir imágenes a su club
- **UPDATE**: Solo Admin puede actualizar imágenes de su club
- **DELETE**: Solo Admin puede eliminar imágenes de su club

### Combos Images
- **SELECT**: Todos los usuarios autenticados pueden ver imágenes de su club
- **INSERT**: Solo Admin puede subir imágenes a su club
- **UPDATE**: Solo Admin puede actualizar imágenes de su club
- **DELETE**: Solo Admin puede eliminar imágenes de su club

## Uso en el Frontend

### Importar funciones de storage

```typescript
import {
  uploadImage,
  deleteImage,
  updateImage,
  STORAGE_BUCKETS
} from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'
```

### Ejemplo: Subir imagen de producto

```typescript
const { user } = useAuth()

const handleImageUpload = async (file: File) => {
  const { url, error } = await uploadImage(
    STORAGE_BUCKETS.PRODUCTOS,
    file,
    user.club.id
  )

  if (error) {
    console.error('Error al subir imagen:', error)
    return
  }

  // Guardar URL en la base de datos
  const { error: dbError } = await supabase
    .from('productos')
    .insert({
      club_id: user.club.id,
      nombre: 'Producto',
      imagen_url: url, // ← URL de la imagen
      // ... otros campos
    })
}
```

### Ejemplo: Actualizar imagen de producto

```typescript
const handleImageUpdate = async (file: File, productoId: string) => {
  // Obtener URL actual de la imagen
  const { data: producto } = await supabase
    .from('productos')
    .select('imagen_url')
    .eq('id', productoId)
    .single()

  // Actualizar imagen (elimina la vieja y sube la nueva)
  const { url, error } = await updateImage(
    STORAGE_BUCKETS.PRODUCTOS,
    file,
    user.club.id,
    producto?.imagen_url
  )

  if (error) {
    console.error('Error al actualizar imagen:', error)
    return
  }

  // Actualizar URL en la base de datos
  await supabase
    .from('productos')
    .update({ imagen_url: url })
    .eq('id', productoId)
}
```

### Ejemplo: Eliminar imagen

```typescript
const handleImageDelete = async (imageUrl: string) => {
  const { success, error } = await deleteImage(
    STORAGE_BUCKETS.PRODUCTOS,
    imageUrl
  )

  if (error) {
    console.error('Error al eliminar imagen:', error)
    return
  }

  // Actualizar base de datos para remover la URL
  await supabase
    .from('productos')
    .update({ imagen_url: null })
    .eq('imagen_url', imageUrl)
}
```

### Ejemplo: Componente de carga de imagen

```typescript
import { useState } from 'react'
import { uploadImage, STORAGE_BUCKETS } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'

function ImageUploader({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Mostrar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Subir imagen
    setUploading(true)
    const { url, error } = await uploadImage(
      STORAGE_BUCKETS.PRODUCTOS,
      file,
      user.club.id
    )
    setUploading(false)

    if (error) {
      alert('Error al subir imagen')
      return
    }

    if (url) {
      onUploadComplete(url)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {preview && (
        <img src={preview} alt="Preview" className="w-32 h-32 object-cover" />
      )}
      {uploading && <p>Subiendo imagen...</p>}
    </div>
  )
}
```

## Validaciones Recomendadas

### Tamaño de archivo
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

if (file.size > MAX_FILE_SIZE) {
  alert('La imagen no debe superar 5MB')
  return
}
```

### Tipo de archivo
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

if (!ALLOWED_TYPES.includes(file.type)) {
  alert('Solo se permiten imágenes JPG, PNG, WebP o GIF')
  return
}
```

## Notas Importantes

1. **Seguridad**: Las políticas RLS aseguran que cada club solo puede acceder a sus propias imágenes
2. **Organización**: Las imágenes se organizan por carpetas según `club_id`
3. **Nombres únicos**: Se usa timestamp para evitar colisiones de nombres
4. **Cache**: Las imágenes tienen cache de 1 hora (3600s)
5. **Cleanup**: Siempre eliminar la imagen antigua al actualizar o borrar un registro

## Buckets en Supabase Dashboard

Para verificar que los buckets se crearon correctamente:

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Storage** en el menú lateral
3. Deberías ver:
   - `productos-images`
   - `promociones-images`
   - `combos-images`

Cada bucket debería tener:
- **Public**: ✅ Habilitado (verde)
- **Allowed MIME types**: VACÍO (sin restricciones)
- **Policies**: Ver las políticas creadas en la pestaña "Policies"

## Solución de Problemas (Troubleshooting)

### Error: "mime type image/png is not supported" (Status 400)

**Causa:** El bucket tiene restricciones de MIME types configuradas incorrectamente.

**Solución:**
1. Ve a Storage en Supabase Dashboard
2. Click en el bucket `productos-images`
3. Click en el icono de engranaje (⚙️) o "Configuration"
4. En "Allowed MIME types" debe estar **COMPLETAMENTE VACÍO**
5. Si tiene algún valor (como `image/*`), bórralo
6. Click en "Save"
7. Prueba subir la imagen nuevamente

### Error: "new row violates row-level security policy"

**Causa:** Las políticas RLS no están creadas o el usuario no tiene rol Admin.

**Solución:**
1. Verifica que ejecutaste `supabase/storage/policies.sql`
2. Verifica que tu usuario tiene rol 'Admin' en la tabla `personal`
3. Verifica que `club_id` coincide con el club del usuario

### La imagen no se visualiza después de subirla

**Causa:** El bucket no es público.

**Solución:**
1. Ve a Storage → Click en el bucket
2. Click en Configuration
3. Asegúrate que "Public bucket" esté en ON (verde)
4. Click en Save

### Error: "Bucket not found"

**Causa:** El bucket no existe en Supabase.

**Solución:**
1. Ve a Storage en Supabase Dashboard
2. Verifica que existe un bucket llamado exactamente `productos-images`
3. Si no existe, créalo siguiendo el Paso 2 de esta guía

### Las validaciones de archivo no funcionan

**Causa:** El código de validación en `storage.ts` puede tener problemas.

**Solución:**
1. Abre la consola del navegador (F12)
2. Mira los logs que empiezan con `[Storage]`
3. Verifica el tipo de archivo y tamaño que se está intentando subir
4. Asegúrate que el archivo es realmente una imagen válida (JPG, PNG, GIF, WebP)

### Verificar si el problema está en el código o en Supabase

```javascript
// Ejecuta esto en la consola del navegador después de seleccionar una imagen
// Esto mostrará detalles del archivo que se está intentando subir
console.log('[Debug] File details:', {
  name: file.name,
  type: file.type,
  size: `${(file.size / 1024).toFixed(2)} KB`
})
```
