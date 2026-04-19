# IIMP - Plataforma Multiperfil V2

Bienvenido al repositorio central de la **Plataforma Multiperfil del IIMP** (Instituto de Ingenieros de Minas del Perú). Esta aplicación centraliza la experiencia de usuario para asociados de diversas verticales corporativas (GESS, PROEXPLO, WMC).

## 🚀 Tecnologías Core

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Lenguaje**: TypeScript
- **Base de Datos**: MongoDB (Local/Atlas)
- **ORM**: Prisma 6
- **Estilos**: Tailwind CSS 4
- **UI Components**: `@nrivera-iimp/ui-kit-iimp` (Basado en Shadcn)
- **Estado**: Zustand
- **Animaciones**: Framer Motion

## 🏗️ Arquitectura y Características

### 1. Sistema de Sesión Única (One Active Session)
La plataforma implementa un bloqueo de sesión por cuenta para garantizar la seguridad y el control de accesos:
- **Session Locking**: Se utiliza una tabla `UserSessionLock` en MongoDB que mapea cada usuario a su sesión activa.
- **Auto-Logout**: Si se detecta un inicio de sesión en un nuevo dispositivo, la sesión anterior es invalidada automáticamente y el frontend expulsa al usuario tras una validación periódica.

### 2. Base de Datos Resiliente
Uso de **MongoDB con Prisma**:
- El proyecto requiere que MongoDB esté configurado como un **Replica Set** para soportar transacciones atómicas.
- Implementación de lógica de fallback para entornos de desarrollo "Standalone".

### 3. Soporte Multi-Lenguaje (i18n)
Integración con el widget de Google Translate con mejoras de estabilidad:
- **DOM Stability Patch**: Se incluye un parche global en `layout.tsx` que previene los errores de `removeChild` comunes en React cuando se usa traducción automática.

## 🛠️ Configuración y Desarrollo

### Requisitos Previos
- Node.js 18+
- MongoDB 6.0+ configurado como **Replica Set** (Ej: `rs.initiate()`).

### Instalación
1. Clonar el repositorio.
2. Crear un archivo `.env` basado en `.env.template`:
   ```env
   DATABASE_URL="mongodb://localhost:27017/multiperfil?replicaSet=rs0"
   NEXT_PUBLIC_API_DOMAIN="https://tu-api-genexus.com"
   ```
3. Instalar dependencias:
   ```bash
   npm install
   ```

### Ejecución Local
El comando `dev` automatiza la generación de Prisma y la sincronización del esquema:
```bash
npm run dev
```

## 📂 Estructura del Proyecto
- `app/`: Rutas de la aplicación y layouts.
- `components/`: Componentes de UI y de negocio.
- `lib/`: Configuraciones de bases de datos y utilidades compartidas.
- `prisma/`: Definición de modelos de datos.
- `services/`: Lógica de integración con APIs externas (Genexus).

---
Desarrollado con ❤️ para el IIMP.
