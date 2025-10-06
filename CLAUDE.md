# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OnTicket** is a multi-tenant club management system with role-based access control. Each club is isolated as a separate tenant with complete data isolation through Row Level Security (RLS).

**Stack**: React 19 + TypeScript + Vite + Supabase + shadcn/ui + Tailwind CSS

## Development Commands

```bash
# Frontend (onticket/)
npm run dev      # Start development server (Vite)
npm run build    # Build for production (TypeScript check + Vite build)
npm run lint     # Run ESLint
npm run preview  # Preview production build

# Database (supabase/)
# Migrations must be run manually in Supabase SQL Editor in order:
# 01_schema → 02_tables → 03_functions → 04_triggers → 05_rls_policies
```

## Architecture

### Multi-Tenancy Model

**Shared Database, Shared Schema** with row-level isolation via Supabase RLS policies.

- Each **club** is a tenant with complete data isolation
- Users belong to clubs via the `personal` table (user_id + club_id + rol)
- All tenant tables must include `club_id` column with FK to `club.id`
- RLS policies enforce automatic filtering by club_id

### Frontend Structure

**Atomic Design** methodology:

```
src/
├── components/
│   ├── atoms/          # Basic UI elements (FormField)
│   ├── molecules/      # Simple component groups (LoginForm)
│   ├── organisms/      # Complex components (LoginCard)
│   ├── templates/      # Page layouts (AuthTemplate)
│   └── ui/             # shadcn/ui components
├── pages/              # Page components by role
│   ├── auth/           # Login
│   ├── admin/          # Admin dashboard
│   ├── bartender/      # Bartender dashboard
│   ├── seguridad/      # Security dashboard (placeholder)
│   └── rrpp/           # RRPP dashboard (placeholder)
├── contexts/           # React contexts (AuthContext)
├── lib/                # Configuration (supabase.ts)
└── types/              # TypeScript types (database.ts)
```

### Database Structure

**Core Tables**:
- `club`: Tenant table (nombre, activo, ubicacion, cuenta_efectivo, cuenta_billetera_virtual)
- `personal`: User-to-club mapping (user_id, club_id, rol, activo)
- `productos`: Products inventory (club_id, nombre, precio, categoria)
- `sale`: Sales records (club_id, vendedor_id, total, metodo_pago)

**User Roles** (ENUM `rol_personal`):
- `Admin`: Full club management
- `Bartender`: Sales operations
- `Seguridad`: Access control
- `RRPP`: Public relations

## Authentication Flow

1. User signs up via Supabase Auth (creates `auth.users` record)
2. Admin manually assigns user to club via `personal` table insert
3. User logs in → AuthContext fetches role from `personal` table
4. Only **active** users (`activo = true`) can log in
5. RLS policies automatically filter all queries by user's club_id
6. Role-based redirect: Admin → `/admin`, Bartender → `/bartender`, etc.

**Critical Security Rules**:
- Never trust client-provided `club_id` values
- RLS policies handle tenant isolation automatically
- Users without `personal` record or with `activo = false` are denied access
- All multi-tenant tables MUST have RLS enabled

## Key Implementation Details

### Path Aliases
- `@/*` → `./src/*` (configured in tsconfig.json and vite.config.ts)

### Authentication Context
- Located at: `src/contexts/AuthContext.tsx`
- Provides: `user`, `loading`, `signIn()`, `signOut()`
- User object includes: `{ id, email, personal: Personal, club: Club }`

### Protected Routes
- Component: `src/components/ProtectedRoute.tsx`
- Checks authentication and role assignment
- Shows loading state during auth verification
- Redirects to `/login` if unauthenticated

### Role-Based Redirect
- Component: `src/components/RoleBasedRedirect.tsx`
- Automatically redirects users to their role-specific dashboard
- Called on root path `/`

### Environment Variables
Required in `onticket/.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## Database Development

### Adding New Multi-Tenant Tables

When creating new tables that belong to clubs:

1. Include `club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE`
2. Create composite index with club_id first: `CREATE INDEX idx_table_club ON table_name(club_id, ...)`
3. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`
4. Create RLS policies using helper function `get_user_club_id()`:
   ```sql
   CREATE POLICY "Users can view their club's data"
   ON table_name FOR SELECT
   USING (club_id = get_user_club_id());
   ```

### Helper Functions for RLS

Located in `supabase/migrations/03_functions/`:
- `get_user_club_id()`: Returns current user's club_id
- `is_admin()`: Returns true if current user has Admin role
- `user_has_role(rol_personal)`: Checks if user has specific role

### Migration Organization

Migrations are organized in folders:
- `01_schema/`: ENUM types
- `02_tables/`: Table definitions
- `03_functions/`: Helper functions
- `04_triggers/`: Automated triggers (updated_at)
- `05_rls_policies/`: Row Level Security policies

Run migrations in numerical order via Supabase SQL Editor.

## Important Constraints

### Active User Validation
- Only users with `personal.activo = true` can authenticate
- Check is performed in `AuthContext.fetchUserRole()`
- Inactive users are signed out with error message

### Club Access
- Users can only access data from clubs where they have a `personal` record
- Multi-club access: User can have multiple `personal` records with different roles
- Switching clubs requires application context logic (not currently implemented)

### Form Validation
- Uses `react-hook-form` + `zod` for all forms
- Forms should include Spanish error messages
- Example schema in: `src/components/molecules/LoginForm.tsx`

## Styling Guidelines

- **Tailwind CSS** for all styling (utility-first approach)
- **shadcn/ui** components for consistent UI
- Dark mode support via `next-themes`
- Import new shadcn components to `src/components/ui/`

## Common Patterns

### Fetching User's Club Data
```typescript
const { data } = await supabase
  .from('club')
  .select('*')
  .single(); // RLS automatically filters to user's club
```

### Role-Based Component Rendering
```typescript
const { user } = useAuth();
if (user?.personal.rol === 'Admin') {
  // Admin-only UI
}
```

### Creating Database Records with club_id
```typescript
const { user } = useAuth();
const { data, error } = await supabase
  .from('productos')
  .insert({
    club_id: user.club.id,
    nombre: 'Product Name',
    precio: 10.00
  });
```

## File Naming Conventions

- Components: PascalCase (e.g., `LoginForm.tsx`, `DashboardPage.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Types: PascalCase for interfaces/types (e.g., `Personal`, `RolPersonal`)

## Testing Considerations

Before committing changes:
- Ensure TypeScript compiles: `npm run build`
- Run linter: `npm run lint`
- Test authentication flow (login, logout, protected routes)
- Verify RLS policies prevent cross-tenant access
- Check that inactive users cannot log in

## Documentation References

- Main README: `onticket/README.md`
- Auth System: `onticket/AUTH_SYSTEM.md`
- Database Architecture: `supabase/ARCHITECTURE.md`
- Quick Reference: `supabase/QUICK_REFERENCE.md`
