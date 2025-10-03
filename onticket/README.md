# OnTicket - Sistema de Gestión Multi-Tenant

Sistema de gestión para clubs con arquitectura multi-tenant, autenticación basada en roles y control de acceso granular.

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: React 19 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod

### Patrón de Diseño
**Atomic Design** - Componentes organizados en niveles jerárquicos

## 📁 Estructura del Proyecto

```
onticket/
├── src/
│   ├── components/         # Atomic Design components
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── organisms/
│   │   ├── templates/
│   │   └── ui/            # shadcn/ui
│   │
│   ├── pages/             # Páginas por feature/rol
│   │   ├── auth/         # Login
│   │   ├── admin/        # Dashboard Admin
│   │   ├── bartender/    # Dashboard Bartender
│   │   ├── seguridad/    # Dashboard Seguridad
│   │   └── rrpp/         # Dashboard RRPP
│   │
│   ├── contexts/         # React contexts
│   ├── lib/             # Configuración
│   └── types/           # TypeScript types
│
└── supabase/migrations/  # Database migrations
```

## 🔐 Sistema de Autenticación

### Roles
- **Admin**: Gestión completa del club
- **Bartender**: Registro de ventas
- **Seguridad**: Control de acceso
- **RRPP**: Relaciones públicas

### Seguridad
- ✅ Solo usuarios activos (`activo = true`) pueden iniciar sesión
- ✅ Redirección automática según rol
- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Aislamiento completo entre clubs

## 🚀 Configuración

### 1. Variables de Entorno

Crear `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 2. Instalación

```bash
npm install
```

### 3. Ejecutar Migraciones

En Supabase SQL Editor, ejecutar migraciones en orden:

```
01_schema → 02_tables → 03_functions → 04_triggers → 05_rls_policies
```

### 4. Desarrollo

```bash
npm run dev
```

## 🗄️ Base de Datos

### Tablas Principales
- `club`: Tenant (club/establecimiento)
- `personal`: Staff con roles y estado activo
- `productos`: Inventario por club
- `sale`: Registro de ventas

### RLS Policies
- Cada club solo accede a sus datos
- Admins gestionan personal y productos
- Bartenders solo registran ventas
- Usuarios inactivos no pueden acceder

## 📝 Rutas

```
/ → Redirección según rol
/login → Autenticación
/admin → Dashboard Admin
/bartender → Dashboard Bartender
/seguridad → Dashboard Seguridad
/rrpp → Dashboard RRPP
```

---

**React + TypeScript + Vite + Supabase**
