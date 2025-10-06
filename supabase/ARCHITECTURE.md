# Database Architecture Diagram

## Multi-Tenant Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE PLATFORM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌──────────────────┐             │
│  │   auth.users    │         │  JWT Tokens      │             │
│  │  (Built-in)     │◄────────│  (auth.uid())    │             │
│  └────────┬────────┘         └──────────────────┘             │
│           │                                                     │
│           │ user_id (FK)                                        │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐         ┌──────────────────┐             │
│  │   personal      │         │  Helper          │             │
│  │                 │────────►│  Functions       │             │
│  │ - user_id (FK)  │         │                  │             │
│  │ - club_id (FK)  │         │ get_user_club_id()│            │
│  │ - rol (ENUM)    │         │ is_admin()       │             │
│  └────────┬────────┘         │ user_has_role()  │             │
│           │                  └──────────────────┘             │
│           │ club_id (FK)                                        │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │     clubs       │         TENANT TABLE                      │
│  │  (TENANTS)      │                                           │
│  │                 │         Each club is isolated             │
│  │ - id (PK)       │         via Row Level Security            │
│  │ - nombre        │                                           │
│  │ - activo        │                                           │
│  │ - ubicacion     │                                           │
│  │ - cuenta_*      │                                           │
│  └─────────────────┘                                           │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐        │
│  │         Row Level Security (RLS) Layer              │        │
│  │                                                     │        │
│  │  • All tables have RLS enabled                     │        │
│  │  • Policies enforce club_id filtering              │        │
│  │  • No cross-tenant data access possible            │        │
│  │  • Role-based permissions within club              │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: User Authentication to Data Access

```
1. USER SIGNS UP
   ┌─────────────┐
   │  User Sign  │
   │     Up      │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ auth.users  │  ◄─── Supabase Auth creates record
   │   created   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Application │  ◄─── Manual assignment via code
   │   assigns   │
   │  to club    │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  personal   │  ◄─── Insert record with club_id & rol
   │   created   │
   └─────────────┘


2. USER QUERIES DATA
   ┌─────────────┐
   │ User makes  │
   │   query     │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ JWT token   │  ◄─── auth.uid() extracted
   │  validated  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ RLS policy  │  ◄─── Check via personal table
   │  evaluates  │       WHERE user_id = auth.uid()
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  club_id    │  ◄─── Get user's club_id
   │  retrieved  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Data query  │  ◄─── Automatically filtered
   │  filtered   │       WHERE club_id = user's club
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │   Return    │  ◄─── Only tenant's data
   │    data     │
   └─────────────┘
```

## Role-Based Access Control (RBAC)

```
┌──────────────────────────────────────────────────────────┐
│                      CLUB (TENANT)                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Admin     │  │  Bartender   │  │  Seguridad   │  │
│  │              │  │              │  │              │  │
│  │ PERMISSIONS: │  │ PERMISSIONS: │  │ PERMISSIONS: │  │
│  │ • All READ   │  │ • READ club  │  │ • READ club  │  │
│  │ • UPDATE club│  │ • READ self  │  │ • READ self  │  │
│  │ • Manage     │  │ • UPDATE self│  │ • UPDATE self│  │
│  │   staff      │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐                                        │
│  │     RRPP     │                                        │
│  │              │                                        │
│  │ PERMISSIONS: │                                        │
│  │ • READ club  │                                        │
│  │ • READ self  │                                        │
│  │ • UPDATE self│                                        │
│  └──────────────┘                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘

        ▲                    ▲                    ▲
        │                    │                    │
        └────────────────────┴────────────────────┘
                     RLS POLICIES
           Enforce permissions automatically
```

## Multi-Club User Scenario

```
┌─────────────────────────────────────────────────────────┐
│                   USER: Juan Perez                      │
│                   (auth.users.id = uuid-123)            │
└───────────────┬─────────────────────┬───────────────────┘
                │                     │
                │                     │
       ┌────────▼─────────┐  ┌───────▼──────────┐
       │  Personal #1     │  │  Personal #2     │
       │                  │  │                  │
       │ club_id: Club A  │  │ club_id: Club B  │
       │ rol: Admin       │  │ rol: Bartender   │
       └────────┬─────────┘  └───────┬──────────┘
                │                     │
                │                     │
       ┌────────▼─────────┐  ┌───────▼──────────┐
       │    CLUB A        │  │    CLUB B        │
       │                  │  │                  │
       │ Full Access      │  │ Limited Access   │
       │ (Admin rights)   │  │ (Bartender only) │
       └──────────────────┘  └──────────────────┘

NOTE: User switches between clubs via application context
      Each query is automatically filtered by RLS to active club
```

## Database Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Supabase Authentication                        │
│ • JWT token validation                                  │
│ • User identity verification (auth.uid())               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Club Assignment Validation                     │
│ • Check personal table for user_id                      │
│ • Retrieve club_id for current user                     │
│ • Verify user belongs to a club                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Row Level Security (RLS) Policies              │
│ • Filter all queries by club_id                         │
│ • Enforce role-based permissions                        │
│ • Block cross-tenant access                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Database Constraints                           │
│ • Foreign key constraints                               │
│ • Check constraints (non-negative balances)             │
│ • Unique constraints (one role per user per club)       │
└─────────────────────────────────────────────────────────┘
```

## Index Strategy for Performance

```
┌────────────────────────────────────────────────────┐
│              CLUBS TABLE                           │
│                                                    │
│  Index 1: PRIMARY KEY (id)                         │
│  Index 2: idx_clubs_activo (activo)               │
│  Index 3: idx_clubs_nombre (nombre)               │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│            PERSONAL TABLE                          │
│                                                    │
│  Index 1: PRIMARY KEY (id)                         │
│  Index 2: idx_personal_club_id (club_id)          │
│           ◄─── Most important for tenant isolation │
│  Index 3: idx_personal_user_id (user_id)          │
│  Index 4: idx_personal_club_user (club_id, user_id)│
│           ◄─── Composite for common queries        │
│  Index 5: idx_personal_rol (club_id, rol)         │
└────────────────────────────────────────────────────┘

RULE: All multi-tenant table indexes should include
      club_id as the first column for optimal filtering
```

## Scaling Considerations

```
┌───────────────────────────────────────────────────────┐
│            Current Architecture Limits                │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ✓ 1-500 clubs      ► Excellent performance          │
│  ✓ 500-2000 clubs   ► Good performance               │
│  ⚠ 2000-5000 clubs  ► Monitor query performance      │
│  ⚠ 5000+ clubs      ► Consider schema per tenant     │
│                                                       │
│  If you reach 5000+ clubs, consider:                 │
│  • Schema-based multi-tenancy (one schema per club)  │
│  • Database-based multi-tenancy (separate databases) │
│  • Horizontal sharding by club_id                    │
│  • Read replicas for analytics                       │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## Future Extensibility

When adding new features, follow this pattern:

```sql
-- Template for new multi-tenant table
CREATE TABLE new_feature_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    -- ^ Always include club_id

    -- Your feature columns here
    feature_name TEXT,
    feature_value NUMERIC,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical index for tenant isolation
CREATE INDEX idx_new_feature_club ON new_feature_table(club_id);

-- Additional indexes as needed
CREATE INDEX idx_new_feature_name ON new_feature_table(club_id, feature_name);

-- Enable RLS
ALTER TABLE new_feature_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can access their club's features"
    ON new_feature_table FOR SELECT
    USING (club_id = public.get_user_club_id());

-- Add more policies for INSERT/UPDATE/DELETE as needed
```

## Summary

**Architecture Type**: Shared Database, Shared Schema (Row-based isolation)

**Key Components**:
1. `clubs` - Tenant table
2. `personal` - User-to-tenant mapping with roles
3. `auth.users` - Supabase built-in authentication
4. RLS policies - Automatic tenant isolation
5. Helper functions - Simplify policy creation

**Security**: Multi-layered with authentication, authorization, and RLS

**Scalability**: Supports 500+ clubs efficiently, can scale to thousands

**Maintainability**: Single schema, centralized policies, reusable patterns
