# 📚 Guía Completa de OnTicket

## Índice de Documentación

Bienvenido a la guía completa de desarrollo de OnTicket. Esta documentación está organizada en módulos temáticos para facilitar la consulta.

### 🏗️ Arquitectura y Fundamentos
- **[01. Arquitectura General](./01_arquitectura.md)** - Stack tecnológico, principios fundamentales y patrones
- **[02. Estructura de Archivos](./02_estructura_archivos.md)** - Organización de tipos, componentes y convenciones

### 🗄️ Base de Datos
- **[03. Base de Datos](./03_base_datos.md)** - Tablas, RLS, funciones helper y migraciones

### 🔐 Autenticación
- **[04. Sistema de Autenticación](./04_autenticacion.md)** - Flujo completo de autenticación y autorización

### 💰 Características Multi-Moneda
- **[05. Sistema Multi-Moneda](./05_multi_moneda.md)** - Soporte para ARS, USD y BRL
- **[06. Utilidades Multi-Moneda](./06_currency_utils.md)** - Funciones reutilizables para cálculos con múltiples monedas

### 🎨 UI y Formateo
- **[07. Formateo de Números](./07_formateo_numeros.md)** - Sistema de formateo regional
- **[08. Inputs Numéricos](./08_inputs_numericos.md)** - Inputs inteligentes que respetan formato regional

### 🖼️ Storage
- **[09. Storage e Imágenes](./09_storage_imagenes.md)** - Gestión de imágenes con Supabase Storage

### 🔨 Desarrollo
- **[10. Flujo de Desarrollo](./10_flujo_desarrollo.md)** - Guía paso a paso para crear nuevas secciones
- **[11. Problemas Comunes](./11_problemas_soluciones.md)** - Soluciones a errores frecuentes
- **[12. Checklist](./12_checklist.md)** - Lista de verificación completa
- **[13. Testing](./13_testing.md)** - Guía de pruebas y configuración

### 📝 Ejemplos
- **[14. Ejemplos Prácticos](./14_ejemplos.md)** - Casos de uso reales implementados

---

## 📂 Otras Documentaciones

### Autenticación
- [AUTH_SYSTEM.md](../auth/AUTH_SYSTEM.md) - Documentación detallada del sistema de autenticación

### Base de Datos
- [MULTI_CURRENCY_GUIDE.md](../database/MULTI_CURRENCY_GUIDE.md) - Guía del sistema multi-moneda

### UI/UX
- [NUMBER_FORMAT.md](../ui/NUMBER_FORMAT.md) - Sistema de formateo de números
- [NUMBER_INPUT_GUIDE.md](../ui/NUMBER_INPUT_GUIDE.md) - Inputs numéricos inteligentes

### Estructura
- [STRUCTURE.md](../structure/STRUCTURE.md) - Estructura detallada de archivos

### Testing
- [TEST_SETUP.md](../testing/TEST_SETUP.md) - Configuración y pruebas

---

## 🚀 Inicio Rápido

1. Lee **[01. Arquitectura General](./01_arquitectura.md)** para entender los fundamentos
2. Revisa **[03. Base de Datos](./03_base_datos.md)** para conocer las tablas
3. Sigue **[10. Flujo de Desarrollo](./10_flujo_desarrollo.md)** para crear tu primera sección
4. Usa **[06. Utilidades Multi-Moneda](./06_currency_utils.md)** para cálculos con múltiples monedas
5. Consulta **[11. Problemas Comunes](./11_problemas_soluciones.md)** cuando encuentres errores

---

## 📖 Referencias Externas

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Versión:** 2.0
**Última actualización:** 2025-10-06
**Proyecto:** OnTicket - Sistema de gestión de clubes multi-tenant
