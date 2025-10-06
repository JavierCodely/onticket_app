# 🚀 Documentación de Deployment - Vercel

Guías completas para deployar OnTicket en Vercel.

---

## 📚 Guías Disponibles

### 🎯 [Quick Start](./QUICK_START.md)
**Tiempo:** 5 minutos  
**Para:** Deploy rápido sin detalles

Pasos ultra-rápidos para poner la app en producción.

---

### 📖 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
**Tiempo:** 20-30 minutos  
**Para:** Deploy completo con todos los detalles

Guía paso a paso detallada que cubre:
- Preparación del proyecto
- Configuración en Vercel
- Variables de entorno
- Configuración de rama `dev`
- Deploy automático
- Troubleshooting
- Seguridad
- Optimizaciones
- PWA (opcional)

---

### 🔑 [Environment Variables](./ENV_VARIABLES.md)
**Para:** Configuración de variables de entorno

Guía completa sobre:
- Variables requeridas
- Configuración local vs producción
- Seguridad
- Troubleshooting de variables
- Uso en código

---

### ✅ [Pre-Deploy Checklist](./PRE_DEPLOY_CHECKLIST.md)
**Para:** Verificación antes de deployar

Checklist exhaustivo de:
- Verificación de código
- Base de datos
- Seguridad
- UI/UX
- Multi-moneda
- Storage
- Testing funcional
- Optimización
- Post-deploy

---

### 🔐 [Environment Security](./ENV_SECURITY.md)
**Para:** Entender la seguridad de variables de entorno

Explica en detalle:
- Variables públicas vs privadas
- Por qué `VITE_SUPABASE_ANON_KEY` es segura
- Diferencias entre desarrollo y producción
- Protección con source maps y minificación
- Row Level Security (RLS) como verdadera seguridad
- Checklist de seguridad

---

### 🛡️ [Security Guide](./SECURITY.md)
**Para:** Medidas de seguridad implementadas

Detalla todas las protecciones:
- Rate limiting en login
- Input sanitization
- HTTP security headers
- Lazy loading
- Secure logging
- Bundle optimization

---

## 🎯 Flujo Recomendado

### Primera vez deploying

1. Lee **[Environment Variables](./ENV_VARIABLES.md)** para preparar tus credenciales
2. Completa **[Pre-Deploy Checklist](./PRE_DEPLOY_CHECKLIST.md)**
3. Sigue **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** paso a paso
4. ✅ Deploy exitoso!

### Deploy rápido (ya configurado antes)

1. Verifica [Pre-Deploy Checklist](./PRE_DEPLOY_CHECKLIST.md) (checks principales)
2. Usa [Quick Start](./QUICK_START.md)
3. Push a `dev`
4. ✅ Deploy automático!

---

## 🔧 Configuración del Proyecto

### Estructura

```
onticket/
├── onticket/              ← Root Directory en Vercel
│   ├── src/
│   ├── dist/             ← Output después de build
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json       ← Configuración de Vercel
│   └── .env.local        ← Variables locales (NO subir a git)
└── supabase/
```

### Archivos Importantes

#### `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "regions": ["gru1"]
}
```

#### `.env.local` (local)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

---

## 📊 Información del Proyecto

### Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Región:** São Paulo, Brasil (`gru1`)

### Configuración de Vercel

```
Framework:           Vite
Root Directory:      onticket
Build Command:       npm run build
Output Directory:    dist
Install Command:     npm install
Node.js Version:     18.x
Production Branch:   dev  ⚠️ No main!
```

### Variables de Entorno Requeridas

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

---

## 🚨 Troubleshooting Rápido

### Build falla
```bash
# Ejecutar localmente
npm run build

# Ver errores y arreglar
```

### 404 en rutas
- Verifica que `vercel.json` existe
- Verifica `rewrites` en `vercel.json`

### Variables no funcionan
- Verifica que empiecen con `VITE_`
- Sin espacios ni comillas
- Redeploy desde Vercel

### App no se conecta a Supabase
- Verifica variables en Vercel
- Verifica CORS en Supabase
- Verifica RLS en tablas

---

## 📱 URLs Importantes

### Producción
```
https://tu-proyecto.vercel.app
```

### Preview (rama dev)
```
https://tu-proyecto-git-dev.vercel.app
```

### Dashboard de Vercel
```
https://vercel.com/tu-usuario/tu-proyecto
```

### Supabase
```
https://app.supabase.com/project/tu-proyecto
```

---

## 🎯 Checklist Rápido

Antes de cada deploy:

- [ ] Build local exitoso: `npm run build`
- [ ] Variables de entorno configuradas
- [ ] En rama `dev`: `git branch`
- [ ] Todos los cambios commiteados: `git status`
- [ ] Push: `git push origin dev`
- [ ] Vercel deploya automáticamente ✨

---

## 🔗 Enlaces Útiles

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Supabase with Vercel](https://supabase.com/docs/guides/hosting/vercel)
- [Vercel CLI](https://vercel.com/docs/cli)

---

## 💡 Tips

### Deploy Automático

Cada push a `dev` deploya automáticamente:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin dev
# Vercel deploya automáticamente ✨
```

### Preview Deployments

Cada rama nueva crea un preview:

```bash
git checkout -b feature/nueva-funcionalidad
git push origin feature/nueva-funcionalidad
# Vercel crea preview URL único ✨
```

### Rollback

Si algo falla, rollback fácil:

1. Ve a Vercel Dashboard
2. Deployments
3. Encuentra deployment anterior exitoso
4. Clic en "..." → Promote to Production

---

## 📞 Soporte

### Errores comunes

Consulta [Deployment Guide - Troubleshooting](./DEPLOYMENT_GUIDE.md#troubleshooting)

### Variables de entorno

Consulta [Environment Variables](./ENV_VARIABLES.md)

### Checklist completo

Consulta [Pre-Deploy Checklist](./PRE_DEPLOY_CHECKLIST.md)

---

## 🎉 ¡Listo para Deploy!

Sigue el [Quick Start](./QUICK_START.md) para deployar en 5 minutos.

---

**Última actualización:** 2025-10-06  
**Versión:** 1.0  
**Rama de producción:** `dev`

