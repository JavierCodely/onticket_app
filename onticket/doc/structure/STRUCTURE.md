# Estructura de Archivos - OnTicket

## 📁 Tipos de Base de Datos (types/database/)

La estructura de tipos ha sido refactorizada para mayor legibilidad y mantenibilidad:

```
types/
└── database/
    ├── Auth/
    │   └── index.ts          # User, RolPersonal, AuthState
    ├── Club/
    │   └── index.ts          # Club, ClubInsert, ClubUpdate
    ├── Personal/
    │   └── index.ts          # Personal, PersonalInsert, PersonalUpdate
    ├── Productos/
    │   └── index.ts          # Producto, CategoriaProducto, ProductoFormData, StockRenewalData
    ├── Sale/
    │   └── index.ts          # Sale, SaleInsert, SaleUpdate
    ├── database.ts           # Database schema type para Supabase
    └── index.ts              # Re-exporta todos los tipos
```

### Uso de Tipos

**Opción 1: Importar desde el índice principal (recomendado para compatibilidad)**
```typescript
import type { Producto, User, Club } from '@/types/database';
```

**Opción 2: Importar desde subdirectorios específicos (más explícito)**
```typescript
import type { Producto, ProductoFormData } from '@/types/database/Productos';
import type { User } from '@/types/database/Auth';
import type { Club } from '@/types/database/Club';
```

## 🧩 Componentes de Productos

### Molecules (components/molecules/Productos/)

```
molecules/
└── Productos/
    ├── ProductCard.tsx           # Tarjeta de producto para vista grid
    ├── ProductFilters.tsx        # Filtros de búsqueda y categoría
    ├── ProductForm.tsx           # Formulario de creación/edición
    ├── ProductStats.tsx          # Panel de estadísticas del inventario
    ├── StockRenewalForm.tsx      # Formulario de renovación de stock
    └── index.ts                  # Re-exporta todos los molecules
```

**Importación:**
```typescript
// Importar todo desde el índice
import {
  ProductCard,
  ProductFilters,
  ProductForm,
  ProductStats,
  StockRenewalForm
} from '@/components/molecules/Productos';

// O importar individualmente
import { ProductCard } from '@/components/molecules/Productos';
```

### Organisms (components/organisms/Productos/)

```
organisms/
└── Productos/
    ├── ProductGrid.tsx           # Vista de tarjetas (grid)
    ├── ProductTable.tsx          # Vista de tabla con imágenes
    ├── ProductModal.tsx          # Modal de creación/edición
    ├── StockRenewalModal.tsx     # Modal de renovación de stock
    └── index.ts                  # Re-exporta todos los organisms
```

**Importación:**
```typescript
// Importar todo desde el índice
import {
  ProductGrid,
  ProductTable,
  ProductModal,
  StockRenewalModal
} from '@/components/organisms/Productos';

// O importar individualmente
import { ProductGrid } from '@/components/organisms/Productos';
```

## 🎯 Beneficios de la Nueva Estructura

### 1. **Separación por Dominio**
- Cada entidad tiene su propio directorio
- Tipos relacionados están agrupados juntos
- Fácil de encontrar y mantener

### 2. **Escalabilidad**
- Agregar nuevas entidades es simple: crear nuevo directorio
- No hay un archivo gigante difícil de mantener
- Cada módulo puede crecer independientemente

### 3. **Imports Claros**
- Se puede importar desde el índice general o subdirectorios específicos
- Imports más explícitos y fáciles de entender
- Mejor para tree-shaking

### 4. **Mantenibilidad**
- Archivos más pequeños y enfocados
- Fácil de navegar en el IDE
- Cambios aislados por dominio

## 📝 Convenciones de Nombres

### Tipos
- **Interfaces principales:** `Producto`, `Club`, `Personal`, etc.
- **Insert types:** `ProductoInsert`, `ClubInsert`
- **Update types:** `ProductoUpdate`, `ClubUpdate`
- **Form data:** `ProductoFormData`, `StockRenewalData`
- **Enums:** `CategoriaProducto`, `RolPersonal`

### Componentes
- **Atoms:** PascalCase simple (`ImageUploader`, `ProfitBadge`)
- **Molecules:** Prefijo con dominio (`ProductCard`, `ProductForm`)
- **Organisms:** Prefijo con dominio (`ProductGrid`, `ProductModal`)
- **Pages:** Sufijo con Page (`ProductosPage`)

## 🔄 Migración

Si tienes imports antiguos como:
```typescript
import type { Producto } from '@/types/database';
```

**No necesitas cambiar nada** - seguirá funcionando gracias al archivo de compatibilidad `types/database.ts`.

Sin embargo, para nuevos imports, se recomienda usar las rutas específicas:
```typescript
import type { Producto, ProductoFormData } from '@/types/database/Productos';
```

## 📦 Agregar Nuevas Entidades

Para agregar una nueva entidad al proyecto:

1. **Crear directorio de tipos:**
```
types/database/NuevaEntidad/
└── index.ts
```

2. **Definir tipos:**
```typescript
// types/database/NuevaEntidad/index.ts
export interface NuevaEntidad {
  id: string;
  club_id: string;
  // ... campos
}

export type NuevaEntidadInsert = Omit<NuevaEntidad, 'id' | 'created_at'>;
export type NuevaEntidadUpdate = Partial<NuevaEntidadInsert>;
```

3. **Actualizar database.ts:**
```typescript
import type { NuevaEntidad, NuevaEntidadInsert, NuevaEntidadUpdate } from './NuevaEntidad';

export interface Database {
  public: {
    Tables: {
      // ... otras tablas
      nueva_entidad: {
        Row: NuevaEntidad;
        Insert: NuevaEntidadInsert;
        Update: NuevaEntidadUpdate;
      };
    };
  };
}
```

4. **Actualizar index.ts principal:**
```typescript
export type { NuevaEntidad, NuevaEntidadInsert, NuevaEntidadUpdate } from './NuevaEntidad';
```

5. **Crear componentes (si es necesario):**
```
molecules/NuevaEntidad/
organisms/NuevaEntidad/
```
