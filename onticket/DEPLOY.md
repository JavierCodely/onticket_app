# 🚀 Deploy OnTicket a Vercel

Guía rápida de referencia para deployment.

---

## ⚡ Deploy Rápido (5 minutos)

```bash
# 1. Verifica que compila
npm run build

# 2. Push a dev
git add .
git commit -m "chore: ready for deploy"
git push origin dev

# 3. Vercel deploya automáticamente ✨
```

---

## 📚 Documentación Completa

Toda la documentación de deployment está en:

```
doc/vercel/
├── README.md                    ← Índice de toda la documentación
├── QUICK_START.md              ← Deploy en 5 minutos
├── DEPLOYMENT_GUIDE.md         ← Guía completa paso a paso
├── ENV_VARIABLES.md            ← Variables de entorno
└── PRE_DEPLOY_CHECKLIST.md    ← Checklist pre-deploy
```

### Enlaces Directos

- 📖 [Ver Documentación Completa](./doc/vercel/README.md)
- ⚡ [Quick Start](./doc/vercel/QUICK_START.md)
- 🔑 [Variables de Entorno](./doc/vercel/ENV_VARIABLES.md)
- ✅ [Checklist Pre-Deploy](./doc/vercel/PRE_DEPLOY_CHECKLIST.md)

---

## 🔑 Variables de Entorno Requeridas

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**Configurar en:**
1. **Local:** Archivo `.env.local`
2. **Vercel:** Project Settings → Environment Variables

---

## ⚙️ Configuración de Vercel

```
Framework Preset:    Vite
Root Directory:      onticket
Build Command:       npm run build
Output Directory:    dist
Production Branch:   dev  ⚠️ Importante!
```

---

## 🎯 Primera Vez

1. Lee [Environment Variables](./doc/vercel/ENV_VARIABLES.md)
2. Completa [Pre-Deploy Checklist](./doc/vercel/PRE_DEPLOY_CHECKLIST.md)
3. Sigue [Deployment Guide](./doc/vercel/DEPLOYMENT_GUIDE.md)

---

## 🚨 Problemas Comunes

### Build falla
```bash
npm run build  # Ver errores localmente
```

### 404 en rutas
Verifica que `vercel.json` existe

### Variables no funcionan
- Deben empezar con `VITE_`
- Sin espacios ni comillas
- Redeploy en Vercel

---

## 📱 URLs

- **Producción:** https://tu-proyecto.vercel.app
- **Docs:** [doc/vercel/](./doc/vercel/)

---

**Rama de producción:** `dev`

