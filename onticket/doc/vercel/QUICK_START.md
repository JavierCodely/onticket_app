# ⚡ Quick Start - Deploy a Vercel

Guía ultra-rápida para deployar OnTicket en Vercel (5 minutos).

---

## 🚀 Pasos Rápidos

### 1. Pre-Deploy Checklist

```bash
# Asegúrate de estar en dev
git checkout dev
git pull origin dev

# Verifica que compile localmente
cd onticket
npm install
npm run build
```

✅ Si el build funciona localmente, funcionará en Vercel.

---

### 2. Variables de Entorno Necesarias

Antes de deployar, ten a mano:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Puedes obtenerlas de:
- Supabase → Project Settings → API

---

### 3. Deploy en 3 Pasos

#### Paso 1: Crear Proyecto en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio de GitHub
3. Selecciona la carpeta `onticket` como **Root Directory**

#### Paso 2: Configurar

```
Framework Preset:    Vite
Root Directory:      onticket
Build Command:       npm run build
Output Directory:    dist
Install Command:     npm install
Node.js Version:     18.x
```

#### Paso 3: Variables de Entorno

Agrega estas 2 variables:

```
VITE_SUPABASE_URL        → tu_url_de_supabase
VITE_SUPABASE_ANON_KEY   → tu_anon_key
```

Marca todas las opciones:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

### 4. Cambiar Rama Principal

**⚠️ IMPORTANTE:** Estamos en `dev`, no en `main`

1. Deploy inicial (fallará si usas main)
2. Ve a **Settings** → **Git**
3. Cambia **Production Branch** de `main` a `dev`
4. Haz **Redeploy**

---

### 5. Deploy Automático

```bash
# Ahora cada vez que hagas push a dev
git add .
git commit -m "feat: cambios"
git push origin dev

# Vercel deployará automáticamente ✨
```

---

## 🎯 URLs Resultantes

Después del deploy tendrás:

```
Production:  https://tu-proyecto.vercel.app
Preview:     https://tu-proyecto-git-dev.vercel.app
Dashboard:   https://vercel.com/dashboard
```

---

## ❌ Problemas Comunes

### Build falla

```bash
# Ejecuta localmente
npm run build

# Si hay errores, arregla y push
git add .
git commit -m "fix: build errors"
git push origin dev
```

### Variables de entorno no funcionan

1. Ve a **Settings** → **Environment Variables**
2. Verifica que empiecen con `VITE_`
3. Sin espacios ni comillas extra
4. Haz **Redeploy**

### 404 en rutas

Verifica que exista `vercel.json` en la raíz de `onticket/`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## ✅ Checklist Final

Antes de compartir la URL:

- [ ] La app carga sin errores
- [ ] Login funciona
- [ ] Rutas funcionan (prueba navegar)
- [ ] Se conecta a Supabase
- [ ] Imágenes cargan
- [ ] No hay errores en consola

---

## 📱 Próximos Pasos

1. [Configurar Dominio Personalizado](./DEPLOYMENT_GUIDE.md#paso-6-configurar-dominio-opcional)
2. [Activar Analytics](./DEPLOYMENT_GUIDE.md#paso-8-monitoreo-y-analytics)
3. [Optimizar Performance](./DEPLOYMENT_GUIDE.md#paso-10-optimizaciones)

---

¡Listo! Tu app está en producción 🎉

**URL de ayuda:** [Guía Completa](./DEPLOYMENT_GUIDE.md)

