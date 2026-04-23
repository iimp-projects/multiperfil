# 🐞 Reporte de Issues – Aplicativo (Portal / WebView)

## 📌 Contexto

Se realizó una revisión funcional del aplicativo (probablemente ejecutado dentro de WebView en Android).  
Se detectaron problemas críticos en:

- Internacionalización (i18n)
- Navegación
- Scroll (UX crítico)
- Comportamiento inconsistente

---

# 🚨 1. PROBLEMAS DE INTERNACIONALIZACIÓN (CRÍTICO)

## 🔴 Issue: Traducciones incorrectas en Login

### Descripción:

En la pantalla de login, al cambiar el idioma a inglés, los tipos de documento no se traducen correctamente.
ten en cuenta que actualmente utilizamos un componente el cual tiene dentro un plugin de google translate, entonces la cosa es asegurarnos que cambvie correctamente el select en caso sea posible, caso contrario aplicar alguna otra estrategia cuando se detecte que se cambio el lenguaje q, quizás x el store del google-translate.

### Comportamiento actual:

| Opción seleccionada | Texto mostrado                |
| ------------------- | ----------------------------- |
| Foreigner Card      | carnet de extranjería         |
| Passport            | pasaporte                     |
| ID Card             | DNI                           |
| (General)           | DNI aparece incluso en inglés |

### Comportamiento esperado:

- Todo el contenido debe respetar el idioma seleccionado
- Traducciones correctas:

| Español               | Inglés esperado       |
| --------------------- | --------------------- |
| DNI                   | National ID / ID Card |
| Carnet de extranjería | Foreigner ID          |
| Pasaporte             | Passport              |

### Impacto:

- Mala experiencia de usuario internacional
- Inconsistencia en UI
- Baja calidad percibida

---

# 🚨 2. PROBLEMA CRÍTICO DE SCROLL

## 🔴 Issue: Scroll no funciona correctamente

### Descripción:

En múltiples pantallas, el scroll:

- no funciona
- funciona de manera intermitente
- es inconsistente (a veces sí, a veces no)

### Pantallas afectadas:

- Configuración
- Login post-ingreso
- Cupones
- Comprobantes
- Vista en inglés
- Generalmente en varias secciones

### Comportamiento actual:

- No se puede hacer scroll vertical
- En algunos casos funciona parcialmente
- En otros casos no responde

### Impacto:

- Usuario no puede acceder a contenido inferior
- Funcionalidades críticas quedan bloqueadas (ej: cambiar contraseña)
- UX completamente rota

### Severidad:

🔥 CRÍTICO

---

# 🚨 3. PROBLEMA DE NAVEGACIÓN (BACK BUTTON)

## 🔴 Issue: Botón "atrás" cierra la aplicación

### Descripción:

Al intentar regresar a la pantalla anterior:

- la app se cierra en lugar de navegar hacia atrás

### Pantallas afectadas:

- Principal
- Configuración
- Cupones
- Comprobantes
- General (comportamiento global)

### Comportamiento actual:

- Back = cerrar app

### Comportamiento esperado:

- Back = navegar a la pantalla anterior

### Posible causa:

- WebView no está manejando historial (`canGoBack`)
- No se intercepta correctamente el botón físico de Android

### Impacto:

- UX extremadamente mala
- Usuario pierde contexto
- Navegación inutilizable

### Severidad:

🔥 CRÍTICO

---

# ⚠️ 4. COMPORTAMIENTO INCONSISTENTE

## 🔴 Issue: Scroll intermitente

### Descripción:

El scroll no es completamente roto, pero:

- a veces funciona
- a veces no

### Interpretación técnica:

Esto suele indicar:

- conflicto entre WebView y layout web
- doble scroll (body + div interno)
- problemas con `overflow`
- uso incorrecto de `100vh`
- o interceptación de eventos touch

---

# 🧠 DIAGNÓSTICO TÉCNICO (HIPÓTESIS)

### Problemas más probables:

## 1. WebView mal configurado

- No maneja correctamente navegación (`goBack`)
- Tiene conflictos de scroll (overscroll / nested scroll)

## 2. Problema en frontend (React / Next)

- uso de `overflow: hidden`
- contenedores con `overflow-y: auto`
- layouts con `100vh`
- scroll interno en lugar de scroll del body

## 3. Problema combinado (más probable)

👉 WebView + estructura web están chocando

---

# 🎯 PRIORIDAD DE CORRECCIÓN

## 🔥 Prioridad 1 (bloqueantes)

- Fix scroll
- Fix navegación back

## ⚠️ Prioridad 2

- Fix traducciones

---

# ✅ CRITERIO DE ÉXITO

El sistema estará correcto cuando:

- el scroll funcione 100% fluido
- todas las pantallas sean navegables
- el botón atrás funcione correctamente
- no haya cierres inesperados
- el idioma sea consistente en toda la UI

---

# 🚀 SIGUIENTE PASO

Se requiere:

1. Diagnóstico técnico en:
   - WebView (APK)
   - Frontend (React / Next.js)

2. Corrección estructural del scroll

3. Corrección de navegación

4. Implementación correcta de i18n
