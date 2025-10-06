# 🔐 Seguridad de Variables de Entorno

## Variables Públicas vs Privadas

### ✅ Variables PÚBLICAS (Seguras para el Cliente)

Las variables con prefijo `VITE_` son **públicas** y se incluyen en el bundle del cliente:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

#### ¿Por qué es seguro exponer `VITE_SUPABASE_ANON_KEY`?

1. **Diseñada para ser pública**: La "ANON KEY" (Anonymous Key) está diseñada por Supabase para ser expuesta en el navegador.

2. **Protección por RLS**: La seguridad real viene de las **Row Level Security (RLS) policies** en la base de datos:
   - La ANON KEY solo puede ejecutar operaciones permitidas por RLS
   - Sin políticas RLS, no puede acceder a ningún dato
   - Cada tabla tiene políticas específicas por rol

3. **No puede hacer nada malicioso**:
   - ❌ No puede leer datos sin políticas RLS
   - ❌ No puede modificar datos sin permiso
   - ❌ No puede acceder a funciones admin
   - ✅ Solo puede hacer lo que las políticas permiten

### ❌ Variables PRIVADAS (Nunca Exponer)

Estas variables **NUNCA** deben estar en el cliente:

```env
# ❌ NUNCA uses esto en el frontend
SUPABASE_SERVICE_KEY=xxx  # PELIGRO: Acceso total a la DB
DATABASE_PASSWORD=xxx      # PELIGRO: Credenciales directas
ADMIN_SECRET=xxx          # PELIGRO: Bypass de seguridad
```

## 🛡️ Protección en Desarrollo vs Producción

### Modo Desarrollo (`npm run dev`)

En desarrollo, verás el código fuente transformado:
- ✅ Source maps habilitados para debugging
- ✅ Variables de entorno visibles en el código
- ✅ Console.logs activos
- ✅ **Esto es NORMAL y necesario para desarrollo**

Ejemplo de lo que ves en DevTools:
```javascript
const supabaseUrl = "https://xxxx.supabase.co";
const supabaseAnonKey = "eyJhbGci...";
```

### Modo Producción (`npm run build`)

Con la configuración de `vite.config.ts`, en producción:
- ✅ Sin source maps públicos (`sourcemap: false`)
- ✅ Código minificado y ofuscado
- ✅ Console.logs eliminados
- ✅ Variables inlineadas y ofuscadas

El código compilado se verá así:
```javascript
const e="https://xxxx.supabase.co",t="eyJ...";
```

## 📋 Checklist de Seguridad

### ✅ Variables de Entorno Correctas

- [x] `VITE_SUPABASE_URL` - Pública, segura
- [x] `VITE_SUPABASE_ANON_KEY` - Pública, segura
- [ ] Nunca incluir `SERVICE_KEY` en variables `VITE_`
- [ ] Nunca incluir credenciales de admin

### ✅ Configuración de Build

- [x] `sourcemap: false` en producción
- [x] `drop_console: true` para eliminar logs
- [x] Minificación con terser
- [x] Chunks optimizados

### ✅ Seguridad en Supabase

- [x] Row Level Security (RLS) habilitado en todas las tablas
- [x] Políticas específicas por rol (admin, bartender, etc.)
- [x] Realtime solo en canales permitidos
- [x] Storage con políticas de acceso

## 🔍 Verificar Seguridad

### 1. Verificar RLS en Supabase Dashboard

```sql
-- Verificar que RLS esté habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Debe mostrar rowsecurity = true para todas las tablas
```

### 2. Probar Build de Producción

```bash
# Construir para producción
npm run build

# Ver el código compilado
cat dist/assets/index-*.js | head -n 50
```

El código debe estar minificado y ofuscado.

### 3. Verificar Headers de Seguridad

En `vercel.json` están configurados:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` restrictivo

## 📚 Recursos Adicionales

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Vite Env Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## ⚠️ Resumen

1. **La ANON KEY es pública y segura** - Es como una llave que solo abre puertas específicas
2. **RLS es tu verdadera seguridad** - Las políticas de base de datos son la muralla
3. **En desarrollo verás el código** - Es normal, usa DevTools
4. **En producción está protegido** - Minificado, sin source maps, ofuscado
5. **Nunca expongas SERVICE_KEY** - Esa sí es la llave maestra

## 🎯 Conclusión

Lo que ves en el login durante desarrollo es **completamente normal y seguro**. La configuración actual protege correctamente tu aplicación en producción.

