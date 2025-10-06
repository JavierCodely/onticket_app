# 🚀 Guía de Deployment en Vercel

Guía paso a paso para deployar OnTicket en Vercel desde la rama `dev`.

---

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta en [Vercel](https://vercel.com)
- ✅ Cuenta en [GitHub](https://github.com) con el repositorio de OnTicket
- ✅ Proyecto de Supabase configurado
- ✅ Variables de entorno de Supabase (URL y ANON_KEY)

---

## 🔧 Paso 1: Preparación del Proyecto

### 1.1 Verificar Configuración Local

```bash
# Asegúrate de estar en la rama dev
git branch

# Si no estás en dev, cambia a dev
git checkout dev

# Asegúrate de tener los últimos cambios
git pull origin dev
```

### 1.2 Verificar que el Build Funciona

```bash
# En la carpeta onticket/
cd onticket

# Instalar dependencias
npm install

# Hacer build local para verificar
npm run build

# Debería completarse sin errores
# La carpeta dist/ se creará con los archivos compilados
```

### 1.3 Verificar Variables de Entorno

Crea un archivo `.env.local` basado en `.env.example`:

```bash
# Copiar el template
cp .env.example .env.local

# Editar con tus valores reales
nano .env.local  # o usa tu editor preferido
```

Contenido de `.env.local`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🌐 Paso 2: Crear Proyecto en Vercel

### 2.1 Importar desde GitHub

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Add New..."** → **"Project"**
3. Selecciona **"Import Git Repository"**
4. Busca y selecciona tu repositorio de OnTicket
5. Haz clic en **"Import"**

### 2.2 Configurar el Proyecto

En la pantalla de configuración:

#### Framework Preset
- Selecciona: **Vite**

#### Root Directory
- Deja en blanco o configura como: `onticket`
  
  **⚠️ IMPORTANTE:** Si tu estructura es:
  ```
  onticket/
    ├── onticket/      ← Carpeta del proyecto React
    │   ├── src/
    │   ├── package.json
    │   └── vite.config.ts
    └── supabase/
  ```
  
  Entonces necesitas configurar:
  - **Root Directory:** `onticket`

#### Build and Output Settings
```
Build Command:     npm run build
Output Directory:  dist
Install Command:   npm install
```

#### Node.js Version
- Versión recomendada: **18.x** o **20.x**

---

## 🔑 Paso 3: Configurar Variables de Entorno

### 3.1 En la Interfaz de Vercel

Durante la configuración inicial o después en **Settings**:

1. En la sección **"Environment Variables"**
2. Agrega las siguientes variables:

```
VITE_SUPABASE_URL
Value: https://tu-proyecto.supabase.co
```

```
VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 Configurar para Todos los Entornos

Para cada variable, selecciona:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

---

## 🎯 Paso 4: Configurar Rama de Deploy

### 4.1 Cambiar Rama Principal

Por defecto Vercel deploya desde `main`, pero estamos usando `dev`:

1. Ve a **Project Settings** → **Git**
2. En **"Production Branch"** cambia de `main` a `dev`
3. Guarda los cambios

### 4.2 Configurar Preview Deployments

1. En **Project Settings** → **Git**
2. Activa **"Preview Deployments"** para:
   - ✅ Branches
   - ✅ Pull Requests

---

## 🚀 Paso 5: Deploy

### 5.1 Deploy Inicial

1. Haz clic en **"Deploy"**
2. Vercel comenzará el proceso de build
3. Espera a que termine (usualmente 1-3 minutos)

### 5.2 Verificar Build

Durante el build, Vercel ejecutará:

```bash
npm install
npm run build
```

Puedes ver los logs en tiempo real en la interfaz.

### 5.3 Build Exitoso ✅

Si todo está correcto verás:
```
✓ Building...
✓ Deploying...
✓ Ready
```

Tu app estará disponible en:
```
https://tu-proyecto.vercel.app
```

---

## 🔒 Paso 6: Configurar Dominio (Opcional)

### 6.1 Agregar Dominio Personalizado

1. Ve a **Project Settings** → **Domains**
2. Haz clic en **"Add"**
3. Ingresa tu dominio: `tudominio.com`
4. Sigue las instrucciones para configurar DNS

### 6.2 Configurar DNS

Vercel te dará registros DNS para configurar:

**Para dominio raíz (tudominio.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Para subdominio (www.tudominio.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 🔄 Paso 7: Deploy Automático

### 7.1 Configuración Automática

Una vez configurado, cada vez que hagas push a `dev`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin dev
```

Vercel automáticamente:
1. ✅ Detecta el cambio
2. ✅ Ejecuta el build
3. ✅ Deploya si el build es exitoso
4. ✅ Te notifica por email

### 7.2 Preview Deployments

Para otras ramas (ej: `feature/nueva-pagina`):

```bash
git checkout -b feature/nueva-pagina
# ... hacer cambios ...
git push origin feature/nueva-pagina
```

Vercel creará un **Preview Deployment** con URL temporal:
```
https://tu-proyecto-git-feature-nueva-pagina.vercel.app
```

---

## 🛠️ Troubleshooting

### Error: "Build failed"

**Causa común:** Errores de TypeScript o lint

**Solución:**
```bash
# Verificar errores localmente
npm run build

# Ver errores específicos
npm run type-check  # si existe
npm run lint
```

### Error: "Module not found"

**Causa común:** Dependencia faltante

**Solución:**
```bash
# Verificar package.json
npm install

# Hacer commit de package-lock.json
git add package-lock.json
git commit -m "chore: update dependencies"
git push origin dev
```

### Error: "Environment variable not found"

**Causa común:** Variables de entorno no configuradas

**Solución:**
1. Ve a **Project Settings** → **Environment Variables**
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas
3. Haz **Redeploy** del proyecto

### Error: "404 Not Found" en rutas

**Causa común:** Configuración de rewrites

**Solución:** Verifica que `vercel.json` exista en la raíz del proyecto:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### La app carga pero no se conecta a Supabase

**Causa común:** Variables de entorno incorrectas

**Solución:**
1. Verifica las variables en Vercel
2. Compara con tu archivo `.env.local`
3. Asegúrate de que las URLs no tengan espacios o caracteres extra
4. Haz **Redeploy**

---

## 📊 Paso 8: Monitoreo y Analytics

### 8.1 Ver Deployments

1. Ve a la pestaña **"Deployments"**
2. Verás todos los deploys (exitosos y fallidos)
3. Puedes ver logs de cada deploy

### 8.2 Ver Analytics (Opcional)

Vercel ofrece analytics gratuitos:
1. Ve a **Analytics**
2. Activa **Web Analytics**
3. Agrega el script a tu `index.html` (Vercel lo hace automáticamente)

### 8.3 Logs en Tiempo Real

Para ver logs de producción:
1. Ve a **Functions** → **View Logs**
2. Puedes ver errores en tiempo real

---

## 🔐 Paso 9: Seguridad

### 9.1 Configurar CORS en Supabase

1. Ve a tu proyecto en Supabase
2. Settings → API → URL Configuration
3. Agrega tu dominio de Vercel:
   ```
   https://tu-proyecto.vercel.app
   ```

### 9.2 Configurar RLS (Row Level Security)

Asegúrate de que todas las tablas tengan RLS habilitado:

```sql
-- Ver si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Habilitar RLS si no está activo
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
-- etc...
```

### 9.3 Headers de Seguridad

Vercel agrega automáticamente headers de seguridad, pero puedes personalizarlos en `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## ⚡ Paso 10: Optimizaciones

### 10.1 Configurar Cache

Ya configurado en `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 10.2 Optimizar Imágenes

Usa el componente de Next.js Image o:

```bash
npm install @vercel/og
```

### 10.3 Configurar Región

En `vercel.json`, la región está configurada como `gru1` (São Paulo):

```json
{
  "regions": ["gru1"]
}
```

Otras regiones disponibles:
- `gru1` - São Paulo, Brasil
- `iad1` - Washington DC, USA
- `sfo1` - San Francisco, USA

---

## 📱 Paso 11: PWA (Opcional)

### 11.1 Agregar Manifest

Crea `public/manifest.json`:

```json
{
  "name": "OnTicket",
  "short_name": "OnTicket",
  "description": "Sistema de gestión de clubes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 11.2 Agregar a index.html

En `onticket/index.html`:

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#000000">
```

---

## 🎉 ¡Deploy Exitoso!

Tu aplicación OnTicket ahora está en producción en Vercel.

### URLs Importantes:

- **Producción:** `https://tu-proyecto.vercel.app`
- **Dashboard:** `https://vercel.com/tu-usuario/tu-proyecto`
- **Analytics:** `https://vercel.com/tu-usuario/tu-proyecto/analytics`

### Siguientes Pasos:

1. ✅ Configura un dominio personalizado
2. ✅ Activa Vercel Analytics
3. ✅ Configura alertas de errores
4. ✅ Haz pruebas en producción
5. ✅ Comparte con tu equipo

---

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase with Vercel](https://supabase.com/docs/guides/hosting/vercel)
- [Vercel CLI](https://vercel.com/docs/cli)

---

**Última actualización:** 2025-10-06  
**Versión:** 1.0  
**Rama de producción:** `dev`

