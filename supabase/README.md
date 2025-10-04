# Supabase Multi-Tenant Database Architecture

## Overview

This is a **multi-tenant database structure** for a club management system using Supabase. Each **club** is a separate tenant, with complete data isolation and security through Row Level Security (RLS) policies.

## Multi-Tenancy Model

**Model Used**: Shared Database, Shared Schema (Row-based isolation)

### Why This Approach?

- **Cost Effective**: Single database serves multiple clubs
- **Scalable**: Can support hundreds of clubs efficiently
- **Maintainable**: Single schema to manage and update
- **Secure**: RLS policies ensure complete tenant isolation
- **Performance**: Optimized with tenant_id indexes

### Trade-offs

- **Pros**: Lower cost, easier maintenance, faster feature deployment
- **Cons**: Requires careful RLS policy design, shared resource pool

## Database Schema

### Tables

#### 1. `clubs` (Tenant Table)

The primary tenant table. Each club is completely isolated from others.

```sql
- id (UUID, PK) - Tenant identifier
- nombre (TEXT) - Club name
- activo (BOOLEAN) - Active status
- ubicacion (TEXT) - Physical location
- cuenta_efectivo (NUMERIC) - Cash account balance
- cuenta_billetera_virtual (NUMERIC) - Virtual wallet balance
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Indexes**:
- `idx_clubs_activo` - Filter active clubs
- `idx_clubs_nombre` - Search by name

#### 2. `personal` (Staff/Employees)

Links authenticated users to clubs with specific roles.

```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users) - Manually assigned via code
- club_id (UUID, FK to clubs) - Tenant reference
- rol (ENUM) - 'Admin', 'Bartender', 'Seguridad', 'RRPP'
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Indexes**:
- `idx_personal_club_id` - Tenant isolation
- `idx_personal_user_id` - User lookup
- `idx_personal_club_user` - Composite for queries
- `idx_personal_rol` - Role-based filtering

**Unique Constraint**: `(user_id, club_id)` - One role per user per club

## Authentication Flow

### User Registration & Assignment

1. User signs up via Supabase Auth (creates record in `auth.users`)
2. Application code manually creates a `personal` record:
   ```sql
   INSERT INTO public.personal (user_id, club_id, rol)
   VALUES ('user-uuid-from-auth', 'club-uuid', 'Bartender');
   ```
3. User can now access only their assigned club's data

### Multi-Club Access

A user can belong to multiple clubs with different roles:
```sql
-- User works at two clubs
INSERT INTO public.personal (user_id, club_id, rol) VALUES
('user-uuid', 'club-a-uuid', 'Admin'),
('user-uuid', 'club-b-uuid', 'Bartender');
```

## Row Level Security (RLS)

### Security Principles

1. **Tenant Isolation**: Users can only access data from their assigned club
2. **Role-Based Access**: Admins have elevated privileges within their club
3. **Zero Cross-Tenant Access**: No data leakage between clubs
4. **Server-Side Validation**: Never trust client-provided club_id

### Helper Functions

```sql
-- Get current user's club_id
public.get_user_club_id() → UUID

-- Check if user has specific role
public.user_has_role(rol) → BOOLEAN

-- Check if user is admin
public.is_admin() → BOOLEAN
```

### RLS Policies Summary

#### Clubs Table

| Operation | Who | Policy |
|-----------|-----|--------|
| SELECT | All authenticated users | Can view their own club |
| UPDATE | Admins only | Can update their own club |
| INSERT | Service role only | Super admin operation |
| DELETE | Service role only | Super admin operation |

#### Personal Table

| Operation | Who | Policy |
|-----------|-----|--------|
| SELECT | Users | Can view own record |
| SELECT | Admins | Can view all in their club |
| INSERT | Admins | Can add staff to their club |
| UPDATE | Users | Can update own record |
| UPDATE | Admins | Can update any in their club |
| DELETE | Admins | Can remove staff from their club |

## Migration Files

Migrations are numbered sequentially and should be run in order:

1. **20250101000001_create_clubs_table.sql**
   - Creates clubs (tenant) table
   - Adds indexes and constraints
   - Creates reusable trigger function for updated_at
   - Enables RLS

2. **20250101000002_create_personal_table.sql**
   - Creates role enum type
   - Creates personal table with foreign keys
   - Adds performance indexes
   - Enables RLS with basic policies

3. **20250101000003_create_rls_policies.sql**
   - Creates helper functions for RLS
   - Implements comprehensive tenant isolation policies
   - Adds role-based access control

4. **20250101000004_create_seed_data.sql** (Optional)
   - Sample club data for testing
   - Can be removed for production

## Usage Examples

### Creating a New Club

```sql
-- Using service role or super admin
INSERT INTO public.clubs (nombre, activo, ubicacion)
VALUES ('New Club', true, 'Downtown Ave 100')
RETURNING id;
```

### Assigning a User to a Club

```javascript
// After user signs up via Supabase Auth
const { data: { user } } = await supabase.auth.signUp({
  email: 'staff@example.com',
  password: 'secure-password'
});

// Assign to club (using service role or admin privileges)
const { data, error } = await supabase
  .from('personal')
  .insert({
    user_id: user.id,
    club_id: 'club-uuid-here',
    rol: 'Bartender'
  });
```

### Querying Club Data

```javascript
// User is automatically restricted to their club via RLS
const { data: club } = await supabase
  .from('clubs')
  .select('*')
  .single(); // Returns only their club

// Update club balance (Admin only)
const { error } = await supabase
  .from('clubs')
  .update({ cuenta_efectivo: 6000.00 })
  .eq('id', clubId); // RLS ensures they can only update their club
```

### Managing Staff (Admin Only)

```javascript
// View all staff in the club
const { data: staff } = await supabase
  .from('personal')
  .select('*, auth.users(email)'); // Join with auth.users if needed

// Add new staff member
const { error } = await supabase
  .from('personal')
  .insert({
    user_id: newUserId,
    club_id: currentClubId, // RLS ensures admin can only add to their club
    rol: 'RRPP'
  });
```

## Security Best Practices

### 1. Never Trust Client-Side club_id

```javascript
// BAD: Trusting client-provided club_id
const { data } = await supabase
  .from('clubs')
  .select('*')
  .eq('id', userProvidedClubId); // Vulnerable!

// GOOD: RLS handles filtering automatically
const { data } = await supabase
  .from('clubs')
  .select('*'); // RLS ensures user sees only their club
```

### 2. Use Service Role Carefully

```javascript
// Only use service role for operations that bypass RLS
const supabaseAdmin = createClient(url, serviceRoleKey);

// Regular client for user operations
const supabase = createClient(url, anonKey);
```

### 3. Validate Tenant Access Server-Side

```sql
-- In database functions, always validate club_id
CREATE FUNCTION some_operation(p_club_id UUID)
RETURNS void AS $$
BEGIN
    -- Validate user belongs to this club
    IF NOT EXISTS (
        SELECT 1 FROM personal
        WHERE user_id = auth.uid()
        AND club_id = p_club_id
    ) THEN
        RAISE EXCEPTION 'Access denied to this club';
    END IF;

    -- Proceed with operation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Performance Optimization

### 1. Indexes Include tenant_id (club_id)

All indexes on multi-tenant tables include `club_id` as the first column:
```sql
CREATE INDEX idx_some_table ON some_table(club_id, other_column);
```

### 2. Monitor Query Performance

```sql
-- Check query plans to ensure index usage
EXPLAIN ANALYZE
SELECT * FROM personal WHERE club_id = 'some-uuid';
```

### 3. Connection Pooling

Use Supabase's built-in connection pooling (Supavisor) for production environments.

## Maintenance

### Adding New Tables

When adding new multi-tenant tables:

1. Include `club_id UUID NOT NULL` column
2. Add foreign key: `REFERENCES public.clubs(id) ON DELETE CASCADE`
3. Create composite index: `(club_id, frequently_queried_column)`
4. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`
5. Create policies that check club_id via `personal` table

Example:
```sql
CREATE TABLE new_tenant_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    -- other columns
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_new_table_club ON new_tenant_table(club_id);

ALTER TABLE new_tenant_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their club's data"
    ON new_tenant_table FOR SELECT
    USING (club_id = public.get_user_club_id());
```

### Auditing

Consider adding audit trails for sensitive operations:
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id),
    user_id UUID REFERENCES auth.users(id),
    action TEXT,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### User Can't See Data

1. Check if user has a `personal` record:
   ```sql
   SELECT * FROM personal WHERE user_id = auth.uid();
   ```

2. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public';
   ```

3. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'clubs';
   ```

### Performance Issues

1. Verify indexes exist and include `club_id`
2. Check query execution plans with `EXPLAIN ANALYZE`
3. Monitor database metrics in Supabase dashboard
4. Consider upgrading Supabase plan for larger datasets

## Production Deployment

### Pre-Deployment Checklist

- [ ] Remove seed data migration (20250101000004) or update with production data
- [ ] Review and test all RLS policies thoroughly
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Set up monitoring and alerts
- [ ] Document super admin procedures
- [ ] Test tenant isolation with multiple test users
- [ ] Load test with expected data volumes

### Running Migrations

```bash
# Using Supabase CLI
supabase db push

# Or apply migrations manually via Supabase dashboard
# SQL Editor → Run each migration file in order
```

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Architecture**: Multi-tenant with row-level isolation
**Database**: PostgreSQL via Supabase
**Security**: Row Level Security (RLS) with JWT-based authentication
**Scalability**: Designed for 100+ clubs with proper indexing
