# Quick Reference Guide

## Common SQL Queries

### User & Club Management

```sql
-- Get current user's club
SELECT c.*
FROM clubs c
JOIN personal p ON p.club_id = c.id
WHERE p.user_id = auth.uid();

-- Get current user's role
SELECT rol
FROM personal
WHERE user_id = auth.uid();

-- Check if current user is admin
SELECT public.is_admin();

-- Get all staff in user's club (admin only)
SELECT
    p.*,
    au.email,
    au.created_at as user_created_at
FROM personal p
LEFT JOIN auth.users au ON au.id = p.user_id
WHERE p.club_id = public.get_user_club_id()
ORDER BY p.created_at DESC;
```

### Club Operations

```sql
-- Update club balance (admin only)
UPDATE clubs
SET
    cuenta_efectivo = cuenta_efectivo + 100.00,
    cuenta_billetera_virtual = cuenta_billetera_virtual - 50.00
WHERE id = public.get_user_club_id();

-- Get club statistics
SELECT
    nombre,
    cuenta_efectivo + cuenta_billetera_virtual as total_balance,
    (SELECT COUNT(*) FROM personal WHERE club_id = clubs.id) as staff_count
FROM clubs
WHERE id = public.get_user_club_id();
```

### Staff Management (Admin Operations)

```sql
-- Add new staff member
INSERT INTO personal (user_id, club_id, rol)
VALUES (
    'user-uuid-from-auth-signup',
    public.get_user_club_id(),
    'Bartender'
);

-- Update staff role
UPDATE personal
SET rol = 'Admin'
WHERE id = 'personal-record-id'
AND club_id = public.get_user_club_id(); -- RLS ensures same club

-- Remove staff member
DELETE FROM personal
WHERE id = 'personal-record-id'
AND club_id = public.get_user_club_id();

-- Count staff by role
SELECT
    rol,
    COUNT(*) as count
FROM personal
WHERE club_id = public.get_user_club_id()
GROUP BY rol;
```

## JavaScript/TypeScript Examples (Supabase Client)

### Setup

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'your-project-url',
  'your-anon-key'
);
```

### Authentication

```javascript
// Sign up new user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### Get Current User's Club

```javascript
const { data: club, error } = await supabase
  .from('clubs')
  .select('*')
  .single(); // RLS automatically filters to user's club
```

### Check User Role

```javascript
const { data: personal, error } = await supabase
  .from('personal')
  .select('rol')
  .single();

const isAdmin = personal?.rol === 'Admin';
```

### Admin: View All Staff

```javascript
const { data: staff, error } = await supabase
  .from('personal')
  .select(`
    id,
    rol,
    created_at,
    user_id
  `)
  .order('created_at', { ascending: false });
```

### Admin: Add New Staff Member

```javascript
// First, create auth user (or they sign up themselves)
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: 'newstaff@example.com',
  password: 'temp-password',
  email_confirm: true
});

// Then assign to club with role
if (authData.user) {
  const { data, error } = await supabase
    .from('personal')
    .insert({
      user_id: authData.user.id,
      rol: 'Bartender'
      // club_id is automatically set by RLS
    });
}
```

### Update Club Balance

```javascript
// Get current club first
const { data: club } = await supabase
  .from('clubs')
  .select('cuenta_efectivo')
  .single();

// Update balance
const { error } = await supabase
  .from('clubs')
  .update({
    cuenta_efectivo: club.cuenta_efectivo + 500.00
  })
  .eq('id', club.id); // RLS ensures admin can only update their club
```

### Real-time Subscriptions

```javascript
// Subscribe to changes in your club's data
const channel = supabase
  .channel('club-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'clubs',
    },
    (payload) => {
      console.log('Club updated:', payload);
    }
  )
  .subscribe();

// Subscribe to staff changes (admin only)
const staffChannel = supabase
  .channel('staff-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'personal',
    },
    (payload) => {
      console.log('Staff updated:', payload);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

## Database Functions Reference

### Helper Functions

```sql
-- Get user's club ID
SELECT public.get_user_club_id();
-- Returns: UUID or NULL

-- Check if user has specific role
SELECT public.user_has_role('Admin');
-- Returns: BOOLEAN

-- Check if user is admin
SELECT public.is_admin();
-- Returns: BOOLEAN
```

## RLS Policy Testing

### Test as Different Users

```sql
-- Set session to specific user (for testing)
SET request.jwt.claims.sub = 'user-uuid-here';

-- Test queries as that user
SELECT * FROM clubs; -- Should only see their club

-- Reset to no user
RESET request.jwt.claims.sub;
```

### Verify RLS is Enabled

```sql
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### List All Policies

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Common Patterns

### Multi-Club User Handling

If a user belongs to multiple clubs:

```javascript
// Get all clubs user belongs to
const { data: userClubs } = await supabase
  .from('personal')
  .select(`
    club_id,
    rol,
    clubs (
      id,
      nombre,
      ubicacion
    )
  `);

// Switch context to specific club
// Store selected club_id in app state/context
// All subsequent queries will be filtered by RLS
```

### Soft Delete Pattern

Instead of hard deleting clubs, mark as inactive:

```sql
-- Soft delete
UPDATE clubs
SET activo = false
WHERE id = public.get_user_club_id();

-- Queries automatically filter out inactive
SELECT * FROM clubs WHERE activo = true;
```

### Audit Trail

```sql
-- Create audit trigger (example for clubs table)
CREATE OR REPLACE FUNCTION audit_clubs_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        club_id,
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER clubs_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON clubs
FOR EACH ROW EXECUTE FUNCTION audit_clubs_changes();
```

## Performance Tips

1. **Always filter by club_id first** in queries
2. **Use select()** with specific columns instead of `*`
3. **Limit results** with `.limit()` for large datasets
4. **Use indexes** - all multi-tenant tables have club_id indexed
5. **Batch operations** when inserting multiple records

```javascript
// Good: Specific columns, limited results
const { data } = await supabase
  .from('personal')
  .select('id, rol, created_at')
  .limit(50);

// Better: Add ordering for consistent pagination
const { data } = await supabase
  .from('personal')
  .select('id, rol, created_at')
  .order('created_at', { ascending: false })
  .range(0, 49);
```

## Error Handling

```javascript
const { data, error } = await supabase
  .from('clubs')
  .update({ nombre: 'New Name' })
  .eq('id', clubId);

if (error) {
  // Check error codes
  if (error.code === '42501') {
    console.error('Permission denied - RLS policy blocked this');
  } else if (error.code === '23505') {
    console.error('Unique constraint violation');
  } else {
    console.error('Database error:', error.message);
  }
}
```

## Security Checklist

- [ ] Never send service role key to client
- [ ] Always validate club_id server-side
- [ ] Use RLS policies for all multi-tenant tables
- [ ] Test with multiple users from different clubs
- [ ] Verify cross-tenant access is blocked
- [ ] Use prepared statements (Supabase does this automatically)
- [ ] Log and monitor suspicious activity
- [ ] Implement rate limiting on API endpoints

## Resources

- Full documentation: `/supabase/README.md`
- Migration files: `/supabase/migrations/`
- Supabase Docs: https://supabase.com/docs
