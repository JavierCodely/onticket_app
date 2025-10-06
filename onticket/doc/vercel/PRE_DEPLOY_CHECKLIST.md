# ✅ Checklist Pre-Deploy

Lista de verificación antes de deployar OnTicket a producción en Vercel.

---

## 🔍 Verificación de Código

### Build Local

- [ ] El proyecto compila sin errores
  ```bash
  cd onticket
  npm install
  npm run build
  ```

- [ ] No hay errores de TypeScript
  ```bash
  npx tsc --noEmit
  ```

- [ ] No hay errores de ESLint
  ```bash
  npm run lint
  ```

- [ ] Todas las dependencias están instaladas
  ```bash
  npm audit
  ```

---

## 🗄️ Base de Datos (Supabase)

### Migraciones

- [ ] Todas las migraciones están aplicadas
- [ ] Tablas creadas: `club`, `personal`, `productos`, `combos`, `promociones`, `sale`
- [ ] RLS (Row Level Security) habilitado en todas las tablas
- [ ] Policies creadas y funcionando
- [ ] Functions y Triggers creados

### Verificar en Supabase:

```sql
-- Verificar que existan las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Storage

- [ ] Bucket `productos-images` creado
- [ ] Bucket `combos-images` creado
- [ ] Bucket `promociones-images` creado
- [ ] Políticas de storage configuradas

---

## 🔑 Variables de Entorno

### Local (.env.local)

- [ ] Archivo `.env.local` existe
- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_ANON_KEY` configurada
- [ ] Variables funcionan localmente

### Vercel

- [ ] `VITE_SUPABASE_URL` agregada en Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` agregada en Vercel
- [ ] Variables marcadas para Production, Preview y Development
- [ ] No hay espacios ni comillas extra en los valores

---

## 🔐 Seguridad

### Autenticación

- [ ] Login funciona correctamente
- [ ] Logout funciona correctamente
- [ ] Redirecciones por rol funcionan
- [ ] Rutas protegidas funcionan
- [ ] No se puede acceder sin autenticación

### Permisos (RLS)

- [ ] Admin puede ver/editar todo
- [ ] Bartender solo ve su scope
- [ ] Seguridad solo ve su scope
- [ ] RRPP solo ve su scope
- [ ] Multi-tenant funciona (cada club ve solo sus datos)

### Headers de Seguridad

- [ ] CORS configurado en Supabase
- [ ] Headers de seguridad en `vercel.json`

---

## 🎨 UI/UX

### Tema

- [ ] Modo claro funciona
- [ ] Modo oscuro funciona
- [ ] Cambio de color theme funciona
- [ ] Configuraciones se guardan en localStorage

### Responsive

- [ ] Se ve bien en móvil (< 768px)
- [ ] Se ve bien en tablet (768px - 1024px)
- [ ] Se ve bien en desktop (> 1024px)

### Componentes

- [ ] Todos los formularios funcionan
- [ ] Validaciones funcionan
- [ ] Mensajes de error se muestran
- [ ] Mensajes de éxito se muestran (toast)
- [ ] Modales abren y cierran correctamente

---

## 💰 Multi-Moneda

### Funcionalidad

- [ ] Se puede cambiar moneda predeterminada
- [ ] Precios se actualizan al cambiar moneda
- [ ] Cards muestran precios correctos
- [ ] Table muestra precios correctos
- [ ] Stats se recalculan con nueva moneda
- [ ] Modal de producto muestra ganancia y margen %

### Cálculos

- [ ] `getPriceForCurrency()` funciona
- [ ] `calculateProfitMargin()` funciona
- [ ] `calculateProductStats()` funciona
- [ ] Todos los componentes usan las utilidades centralizadas

---

## 📸 Storage e Imágenes

### Funcionalidad

- [ ] Upload de imágenes funciona
- [ ] Imágenes se muestran correctamente
- [ ] Eliminar imágenes funciona
- [ ] Imágenes se optimizan/redimensionan

### Buckets en Supabase

```bash
# Verificar que existan
productos-images/
combos-images/
promociones-images/
```

---

## 🧪 Testing Funcional

### CRUD Productos

- [ ] Crear producto funciona
- [ ] Editar producto funciona
- [ ] Eliminar producto funciona
- [ ] Renovar stock funciona
- [ ] Filtros funcionan
- [ ] Búsqueda funciona

### CRUD Combos

- [ ] Crear combo funciona
- [ ] Editar combo funciona
- [ ] Eliminar combo funciona
- [ ] Agregar productos a combo funciona

### CRUD Promociones

- [ ] Crear promoción funciona
- [ ] Editar promoción funciona
- [ ] Eliminar promoción funciona
- [ ] Fechas de vigencia funcionan

### Dashboard

- [ ] Estadísticas cargan correctamente
- [ ] Números son precisos
- [ ] Gráficos (si los hay) funcionan
- [ ] Se actualiza en tiempo real (si aplica)

---

## 📦 Optimización

### Performance

- [ ] Lazy loading implementado en rutas
- [ ] Imágenes optimizadas
- [ ] Bundle size es razonable (< 1MB inicial)
- [ ] Tiempo de carga < 3 segundos

### Code Splitting

- [ ] LoginPage es lazy
- [ ] Rutas de admin son lazy
- [ ] Componentes grandes son lazy

### Verificar Bundle

```bash
npm run build

# Ver tamaño de archivos
ls -lh dist/assets/
```

---

## 🔄 Git y Deploy

### Git

- [ ] Estás en la rama `dev`
- [ ] Todos los cambios están commiteados
- [ ] No hay archivos sin trackear importantes
- [ ] `.gitignore` incluye `.env.local`

```bash
git status
git branch
```

### Vercel

- [ ] `vercel.json` existe en raíz de `onticket/`
- [ ] Root Directory configurado: `onticket`
- [ ] Production Branch configurada: `dev`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

---

## 🌐 Post-Deploy

### Verificar en Producción

- [ ] URL de producción carga
- [ ] Login funciona
- [ ] Navegar entre páginas funciona
- [ ] No hay errores en consola del browser
- [ ] Imágenes cargan correctamente
- [ ] Supabase se conecta correctamente

### Pruebas E2E

- [ ] Crear un producto en producción
- [ ] Editar el producto
- [ ] Subir una imagen
- [ ] Cambiar moneda predeterminada
- [ ] Verificar que stats se actualizan
- [ ] Cerrar sesión
- [ ] Volver a entrar

### Monitoreo

- [ ] Configurar alertas en Vercel (opcional)
- [ ] Configurar Analytics (opcional)
- [ ] Revisar logs de errores

---

## 📱 Dominio Personalizado (Opcional)

- [ ] Dominio comprado
- [ ] DNS configurado
- [ ] SSL/TLS activo (Vercel lo hace automático)
- [ ] Dominio apunta a Vercel
- [ ] Redirección de www funciona

---

## 🚨 Plan de Rollback

### Si algo falla:

1. **Ver logs en Vercel**
   ```
   Vercel Dashboard → Deployments → Ver logs del deployment fallido
   ```

2. **Rollback a deployment anterior**
   ```
   Vercel Dashboard → Deployments → Deployment anterior → Promote to Production
   ```

3. **Fix local y re-deploy**
   ```bash
   # Arreglar el problema
   git add .
   git commit -m "fix: corregir error de deployment"
   git push origin dev
   ```

---

## ✅ Checklist Final

Antes de hacer clic en **Deploy**:

- [ ] ✅ Todos los checks anteriores pasados
- [ ] ✅ Build local exitoso
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Supabase funcionando
- [ ] ✅ Equipo notificado del deploy
- [ ] ✅ Respaldo de base de datos hecho (opcional)

---

## 🎉 Deploy

```bash
# Push final
git add .
git commit -m "chore: ready for production deploy"
git push origin dev

# Vercel deployará automáticamente
```

---

**Tiempo estimado para completar checklist:** 30-45 minutos

**Última actualización:** 2025-10-06

