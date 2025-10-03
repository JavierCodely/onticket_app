# OnTicket Authentication System

Complete authentication system built with React 19, TypeScript, shadcn/ui, Supabase, and Atomic Design methodology.

## Architecture Overview

This authentication system follows **Atomic Design** principles, ensuring scalability, maintainability, and reusability.

### Technology Stack
- **React 19** with TypeScript
- **shadcn/ui** for UI components
- **Supabase** for authentication and database
- **react-router-dom** for routing
- **react-hook-form** + **zod** for form validation
- **Tailwind CSS** for styling

## Project Structure

```
src/
├── types/
│   └── database.ts                 # TypeScript interfaces for database schema
├── lib/
│   └── supabase.ts                 # Supabase client configuration
├── contexts/
│   └── AuthContext.tsx             # Global authentication state management
├── components/
│   ├── atoms/
│   │   └── FormField.tsx           # Reusable form field component
│   ├── molecules/
│   │   └── LoginForm.tsx           # Login form with validation
│   ├── organisms/
│   │   └── LoginCard.tsx           # Complete login UI
│   ├── templates/
│   │   └── AuthTemplate.tsx        # Authentication page layout
│   └── ProtectedRoute.tsx          # Route guard component
├── pages/
│   ├── LoginPage.tsx               # Login page
│   └── DashboardPage.tsx           # Dashboard page
└── App.tsx                         # Main app with routing
```

## Atomic Design Breakdown

### Atoms (Basic Building Blocks)
- **FormField** (`src/components/atoms/FormField.tsx`)
  - Combines Label + Input + Error message
  - Used by: LoginForm molecule
  - Features: Accessible, error handling, required field indicator

### Molecules (Simple Component Groups)
- **LoginForm** (`src/components/molecules/LoginForm.tsx`)
  - Email + Password form with validation
  - Uses: FormField atoms, Button (shadcn/ui)
  - Features: Form validation (react-hook-form + zod), error display

### Organisms (Complex Components)
- **LoginCard** (`src/components/organisms/LoginCard.tsx`)
  - Complete login experience
  - Uses: Card (shadcn/ui), LoginForm molecule
  - Features: Branding, authentication logic, error handling

### Templates (Page Layouts)
- **AuthTemplate** (`src/components/templates/AuthTemplate.tsx`)
  - Centered layout for auth pages
  - Features: Responsive, gradient background

### Pages (Specific Instances)
- **LoginPage** (`src/pages/LoginPage.tsx`)
  - Login page instance
  - Uses: AuthTemplate + LoginCard

- **DashboardPage** (`src/pages/DashboardPage.tsx`)
  - Main dashboard for authenticated users
  - Features: User info display, role badge, logout

## Setup Instructions

### 1. Environment Configuration

Copy the environment template:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Ensure your Supabase database has the following structure:

#### Tables

**personal** table:
```sql
CREATE TABLE personal (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  club_id UUID NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('Admin', 'Bartender', 'Seguridad', 'RRPP'))
);
```

### 3. Run the Application

```bash
npm install
npm run dev
```

## Features

### Authentication Flow

1. **Initial Load**
   - App checks for existing Supabase session
   - If session exists, fetches user role from `personal` table
   - Redirects based on authentication state

2. **Login Process**
   - User enters email and password
   - Client-side validation (react-hook-form + zod)
   - Supabase authentication
   - Role verification from `personal` table
   - If no role assigned, sign out and show error
   - On success, redirect to dashboard

3. **Protected Routes**
   - ProtectedRoute component guards authenticated routes
   - Checks for valid user and role assignment
   - Shows loading state during auth check
   - Redirects to /login if not authenticated

4. **Logout**
   - Clears Supabase session
   - Clears local auth state
   - Redirects to login page

### Security Features

- Environment variables for sensitive credentials
- Role-based access control (RBAC)
- No protected components load before auth verification
- Automatic session persistence
- Auth state change listeners
- Role verification from database (not just from auth)

### User Experience

- Loading states during async operations
- Comprehensive error messages in Spanish
- Form validation with helpful error messages
- Accessible components (ARIA labels, semantic HTML)
- Responsive design (mobile-friendly)
- Smooth transitions and redirects

## TypeScript Types

### Database Types (`src/types/database.ts`)

```typescript
// Role enumeration
type RolPersonal = 'Admin' | 'Bartender' | 'Seguridad' | 'RRPP';

// Personal table interface
interface Personal {
  user_id: string;
  club_id: string;
  rol: RolPersonal;
}

// Extended user with role information
interface User {
  id: string;
  email: string;
  role?: RolPersonal;
  club_id?: string;
}
```

## Authentication Context API

### Hooks

```typescript
const { user, loading, signIn, signOut } = useAuth();
```

### Properties

- `user: User | null` - Current authenticated user with role info
- `loading: boolean` - Authentication state loading indicator
- `signIn: (email, password) => Promise<{error: string | null}>` - Sign in method
- `signOut: () => Promise<void>` - Sign out method

### Usage Example

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <p>Role: {user.role}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

## Routing Configuration

- `/` - Dashboard (Protected)
- `/login` - Login page (Public)
- `*` - Redirects to `/`

## Form Validation

### Login Form Schema

```typescript
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingrese un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
```

## Styling

- **Tailwind CSS** for utility-first styling
- **shadcn/ui** theme system for consistent design
- Dark mode support (via next-themes)
- Responsive breakpoints
- Gradient backgrounds
- Accessible color contrast

## Best Practices Implemented

1. **TypeScript Strict Mode**
   - All components fully typed
   - No implicit any
   - Proper prop interfaces

2. **Accessibility**
   - Semantic HTML
   - ARIA labels and descriptions
   - Keyboard navigation support
   - Error announcements for screen readers

3. **Security**
   - Environment variable validation
   - Role verification before rendering protected content
   - Secure session management via Supabase
   - No credentials in code

4. **Code Organization**
   - Clear separation of concerns
   - Atomic Design hierarchy
   - Reusable components
   - Single responsibility principle

5. **Error Handling**
   - User-friendly error messages in Spanish
   - Form validation errors
   - Network error handling
   - Loading states

## Future Enhancements

Possible improvements:
- Password reset functionality
- Remember me option
- Two-factor authentication
- Session timeout warnings
- Role-based component rendering
- Audit logging
- User profile management

## Troubleshooting

### Common Issues

**"Missing Supabase environment variables"**
- Ensure `.env.local` exists with correct values
- Restart dev server after creating `.env.local`

**"No tienes un rol asignado"**
- User exists in auth.users but not in personal table
- Add entry to personal table with user_id, club_id, and rol

**TypeScript errors**
- Run `npm install` to ensure all dependencies are installed
- Check that path aliases are configured in tsconfig.json

## Testing Checklist

- [ ] User can log in with valid credentials
- [ ] Invalid email shows validation error
- [ ] Short password shows validation error
- [ ] Wrong credentials show error message
- [ ] User without role assignment is denied access
- [ ] Protected route redirects to login when not authenticated
- [ ] Dashboard displays correct user information
- [ ] Logout works and redirects to login
- [ ] Page refresh maintains authentication state
- [ ] Loading states display during async operations

## File Reference

### Key Files Created

1. **C:/Users/Agus/Desktop/onticket/onticket/src/types/database.ts** - TypeScript types
2. **C:/Users/Agus/Desktop/onticket/onticket/src/lib/supabase.ts** - Supabase client
3. **C:/Users/Agus/Desktop/onticket/onticket/src/contexts/AuthContext.tsx** - Auth state management
4. **C:/Users/Agus/Desktop/onticket/onticket/src/components/atoms/FormField.tsx** - Form field atom
5. **C:/Users/Agus/Desktop/onticket/onticket/src/components/molecules/LoginForm.tsx** - Login form
6. **C:/Users/Agus/Desktop/onticket/onticket/src/components/organisms/LoginCard.tsx** - Login card
7. **C:/Users/Agus/Desktop/onticket/onticket/src/components/templates/AuthTemplate.tsx** - Auth layout
8. **C:/Users/Agus/Desktop/onticket/onticket/src/components/ProtectedRoute.tsx** - Route guard
9. **C:/Users/Agus/Desktop/onticket/onticket/src/pages/LoginPage.tsx** - Login page
10. **C:/Users/Agus/Desktop/onticket/onticket/src/pages/DashboardPage.tsx** - Dashboard
11. **C:/Users/Agus/Desktop/onticket/onticket/src/App.tsx** - Main app with routing
12. **C:/Users/Agus/Desktop/onticket/onticket/.env.local.example** - Environment template

---

Built with Atomic Design methodology for OnTicket project.
