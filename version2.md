# 🧠 INSTRUCCIONES PARA OPENCODE – INTEGRACIÓN DE MÓDULOS MULTIPERFIL V2

## 📌 CONTEXTO GENERAL

Actualmente existe un proyecto (Next.js / React) donde:

- Ya existen vistas o estructuras parciales de módulos
- Algunas funcionalidades están ocultas, incompletas o no conectadas
- Se requiere integrar correctamente nuevos módulos definidos funcionalmente

El objetivo NO es rehacer el proyecto, sino:
👉 ANALIZAR lo existente
👉 REUTILIZAR lo ya construido
👉 COMPLETAR e INTEGRAR de forma profesional

---

## 📚 MÓDULOS A IMPLEMENTAR (SEGÚN REQUERIMIENTO)

Basado en el documento funcional:

:contentReference[oaicite:0]{index=0}

Se deben integrar 3 módulos principales:

### 1. Centro de Mensajes

- Bandeja de comunicaciones oficiales
- Historial consultable
- Mensajes leídos / no leídos
- Acceso a detalle
- Redirección a acciones dentro del sistema

### 2. Alertas y Recordatorios

- Avisos breves, visibles y contextuales
- No es histórico (NO reemplaza mensajes)
- Alta prioridad visual
- Puede redirigir a módulos

### 3. Streaming

- Acceso a contenido audiovisual
- Integración con Vimeo
- Control por:
  - categoría de usuario
  - horario
- Estados:
  - Disponible
  - Próximamente
  - Finalizado
  - Restringido

---

## 🎯 OBJETIVO DE ESTA TAREA

Quiero que analices el proyecto completo y hagas lo siguiente:

### 1. 🔍 ANÁLISIS DEL PROYECTO

Identifica:

- Estructura de carpetas (`app/`, `pages/`, `features/`, etc.)
- Componentes reutilizables existentes
- Stores (Zustand u otros)
- Hooks existentes
- Layouts actuales
- Rutas existentes

### Detecta especialmente:

- vistas ocultas
- módulos parcialmente implementados
- componentes sin uso
- lógica incompleta

---

### 2. 🧩 MAPEO DE MÓDULOS

Relaciona lo existente con lo requerido:

| Módulo requerido | ¿Existe algo similar? | Estado |
| ---------------- | --------------------- | ------ |
| Mensajes         | ?                     | ?      |
| Alertas          | ?                     | ?      |
| Streaming        | ?                     | ?      |

---

### 3. 🏗️ INTEGRACIÓN (NO REESCRITURA)

Debes:

- reutilizar componentes existentes
- completar lógica faltante
- conectar vistas ocultas
- evitar duplicación de código
- respetar arquitectura actual

---

## 🧱 IMPLEMENTACIÓN POR MÓDULO

---

# 📩 1. CENTRO DE MENSAJES

## Requisitos funcionales:

- listado de mensajes
- estado: leído / no leído
- fecha / hora
- título + extracto
- vista detalle
- filtros:
  - todos
  - no leídos
  - importantes
  - históricos

## UI esperada:

- tipo inbox (NO chat)
- limpio y jerárquico
- contador de no leídos

## Tareas:

- detectar si ya existe lista de notificaciones
- separar “mensaje formal” vs “alerta”
- crear vista `/messages`
- integrar con store global

---

# 🚨 2. ALERTAS Y RECORDATORIOS

## Requisitos funcionales:

- avisos cortos
- alta visibilidad
- contextuales
- NO persistentes como historial

## UI:

- banners
- badges
- snackbars
- indicadores en dashboard

## Tareas:

- reutilizar sistema de notificaciones existente (Zustand)
- crear tipo: `ALERT`
- agregar prioridad:
  - info
  - importante
  - urgente
- lógica de expiración automática

---

# 🎥 3. STREAMING

## Requisitos:

- lista de contenidos
- estados:
  - disponible
  - próximo
  - finalizado
  - restringido
- validación por:
  - horario
  - perfil

## UI:

- tarjetas
- botón de acceso
- estados visuales claros

## Integración:

- usar iframe Vimeo
- NO manejar video directamente

## Tareas:

- crear módulo `/streaming`
- lógica de visibilidad por usuario
- mensajes tipo:
  - “No disponible para su categoría”

---

## 🔗 RELACIÓN ENTRE MÓDULOS

IMPORTANTE:

- Alertas → pueden redirigir a:
  - mensajes
  - streaming
  - otras secciones

- Mensajes → pueden contener enlaces a acciones

- Streaming → puede generar alertas (ej: “inicia en 5 min”)

---

## 🧠 ARQUITECTURA ESPERADA

Debes trabajar con:

- Zustand (estado global)
- separación por features
- tipado estricto (TypeScript)
- evitar `any`

---

## 🧪 VALIDACIONES

El sistema debe:

- no duplicar información
- mantener consistencia entre módulos
- ser escalable
- ser reutilizable

---

## 📦 ENTREGABLE

Quiero que me entregues:

### 1. Diagnóstico

- qué ya existía
- qué estaba incompleto
- qué faltaba

### 2. Cambios realizados

- archivos modificados
- nuevos módulos creados

### 3. Código final

- listo para usar

### 4. Explicación técnica

- por qué tomaste cada decisión

---

## 🚫 REGLAS

- NO rehacer todo desde cero
- NO duplicar componentes
- NO romper lo existente
- NO crear lógica innecesaria

---

## 🎯 CRITERIO DE ÉXITO

El sistema está correcto si:

✔ los 3 módulos funcionan de forma independiente  
✔ están conectados entre sí  
✔ reutilizan lógica existente  
✔ la UX es clara y consistente  
✔ el código es limpio y escalable

---

## 🚀 INICIO

Empieza por:

1. Analizar estructura del proyecto
2. Detectar módulos ocultos
3. Mapear funcionalidades existentes
4. Proponer plan de integración
5. Ejecutar implementación
