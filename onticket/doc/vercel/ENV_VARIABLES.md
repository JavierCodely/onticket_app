# 🔑 Variables de Entorno - OnTicket

Guía completa de configuración de variables de entorno para desarrollo y producción.

---

## 📋 Variables Requeridas

### Supabase

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Dónde obtenerlas:**
1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Settings → API
3. Copia **Project URL** y **anon public** key

---

## 🖥️ Desarrollo Local

### Crear archivo .env.local

```bash
cd onticket
touch .env.local
```

### Contenido de .env.local

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx

# Opcional - Para debugging
VITE_DEBUG=true
```

### Verificar que funciona

```bash
npm run dev

# La app debería conectarse a Supabase
# Prueba haciendo login
```

---

## ☁️ Producción (Vercel)

### Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable:

| Key | Value | Environments |
|-----|-------|--------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJ...` | Production, Preview, Development |

### ⚠️ Importante

- ✅ Las variables DEBEN empezar con `VITE_` para que Vite las exponga
- ✅ NO uses comillas en los valores
- ✅ NO dejes espacios al inicio o final
- ✅ Marca TODOS los entornos (Production, Preview, Development)

---

## 🔒 Seguridad

### ✅ Variables Seguras (pueden ser públicas)

Estas variables son seguras porque Supabase tiene RLS (Row Level Security):

```env
VITE_SUPABASE_URL          # URL pública del proyecto
VITE_SUPABASE_ANON_KEY     # Key anónima con permisos limitados
```

### ❌ Variables que NUNCA deben exponerse

```env
SUPABASE_SERVICE_ROLE_KEY  # ❌ NUNCA en frontend
SUPABASE_JWT_SECRET        # ❌ NUNCA en frontend
DATABASE_PASSWORD          # ❌ NUNCA en frontend
```

---

## 📝 Archivo .env.example

Este archivo está en el repositorio como template:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Example:
# VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
```

### Uso

```bash
# Copiar template
cp .env.example .env.local

# Editar con tus valores
nano .env.local
```

---

## 🔄 Diferentes Entornos

### Development (local)

```env
# .env.local
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Preview (Vercel)

```env
# Configurado en Vercel → Preview environment
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Production (Vercel)

```env
# Configurado en Vercel → Production environment
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

---

## 🛠️ Troubleshooting

### Error: "Cannot read VITE_SUPABASE_URL"

**Causa:** Variable no configurada

**Solución:**
```bash
# Verifica que existe .env.local
ls -la | grep .env

# Verifica el contenido
cat .env.local

# Reinicia el servidor de desarrollo
npm run dev
```

### Error: "Invalid API key"

**Causa:** Anon key incorrecta

**Solución:**
1. Ve a Supabase → Settings → API
2. Copia nuevamente la **anon public** key
3. Reemplaza en `.env.local`
4. Reinicia el servidor

### Variables no actualizan en Vercel

**Solución:**
1. Actualiza las variables en Vercel
2. Ve a Deployments
3. Haz clic en el deployment más reciente
4. Clic en los 3 puntos → **Redeploy**
5. Marca **Use existing Build Cache: No**

### TypeScript no reconoce las variables

**Solución:** Crea/actualiza `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## 📚 Uso en el Código

### Leer variables de entorno

```typescript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Validar en runtime

```typescript
// src/lib/env.ts
export function validateEnv() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]

  const missing = required.filter(
    key => !import.meta.env[key]
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}`
    )
  }
}
```

---

## ✅ Checklist de Configuración

### Local

- [ ] Archivo `.env.local` creado
- [ ] Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configuradas
- [ ] `.env.local` está en `.gitignore`
- [ ] App conecta a Supabase correctamente

### Vercel

- [ ] Variables configuradas en Project Settings
- [ ] Marcados todos los entornos (Production, Preview, Development)
- [ ] Deployment exitoso
- [ ] App en producción conecta a Supabase
- [ ] Login funciona en producción

---

## 🔗 Enlaces Útiles

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Keys & API](https://supabase.com/docs/guides/api/api-keys)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Última actualización:** 2025-10-06

