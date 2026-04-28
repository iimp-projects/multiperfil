# Prompt maestro para OpenCode — Auditoría y continuidad del Panel Administrativo `/acceso` — Sistema Multiperfil V2

## Contexto general

Necesito que analices el proyecto actual y continúes el desarrollo **sin romper lo existente**. Este trabajo corresponde a la **V2 del Sistema Multiperfil**, enfocado en construir un **panel administrativo para el portal de clientes/participantes ya existente**.

El portal de usuario actual vive en la raíz y/o rutas actuales del proyecto. **No debes tocar, romper ni modificar el comportamiento funcional del portal de usuario existente**.

Todo el nuevo desarrollo administrativo debe quedar aislado bajo la ruta:

```txt
/acceso
```

La idea es crear un panel administrativo moderno, intuitivo, bonito, profesional y coherente visualmente con el dashboard actual del usuario, pudiendo reutilizar componentes visuales existentes, pero manteniendo el nuevo alcance dentro de `/acceso`.

---

## Documento base ya analizado

Existe un informe previo titulado:

```txt
Sistema Multiperfil V2: Centro de Mensajes, Alertas y Streaming
```

Ese informe indica que ya se trabajaron o propusieron los siguientes módulos:

1. Centro de Mensajes
2. Alertas y Recordatorios
3. Streaming Vimeo

También indica que el proyecto ya tiene una arquitectura con:

- Next.js App Router
- Route Handlers en `/app/api`
- Axios
- Zustand
- Tipado TypeScript
- Servicios separados por feature
- Fake APIs iniciales para mensajes, alertas y streaming
- Polling para refresco de mensajes/alertas
- Integración visual en dashboard

Necesito que revises TODO lo ya implementado y confirmes si realmente cumple con lo prometido en el informe, pero ahora agregando los nuevos requerimientos de este documento.

---

# Objetivo principal de esta nueva revisión

Debes hacer una auditoría técnica y luego implementar/corregir lo necesario para que el sistema cumpla exactamente con este alcance:

1. Confirmar configuración de secretos y variables QA/PROD.
2. Confirmar cuáles APIs se usan para QA y cuáles para PROD.
3. Corregir el error actual de login: `Unauthorized. Invalid or missing API key.`
4. Definir e implementar correctamente el módulo administrativo `Usuarios`.
5. Crear flujo para buscar usuarios desde API GeneXus por `siecod` o nombre.
6. Permitir seleccionar usuarios individuales para enviar mensajes o notificaciones.
7. Permitir crear grupos de usuarios.
8. Permitir enviar mensajes y alertas/notificaciones a usuarios o grupos.
9. Reflejar mensajes y notificaciones en tiempo real en el dashboard del usuario.
10. Mostrar badges o puntos de novedad en los íconos del dashboard del usuario.
11. Al abrir una notificación o mensaje, el badge/punto debe desaparecer.
12. Todo debe estar dentro de `/acceso` para administración.
13. Todo debe usar tipado estricto y buenas prácticas.
14. Toda API interna nueva debe implementarse usando la carpeta `/api` de Next.js.

---

# Reglas estrictas de trabajo

## 1. No romper el portal actual

El portal de usuario existente no debe verse afectado.

No debes mover rutas actuales del usuario.
No debes cambiar la lógica de login del usuario salvo que sea necesario para corregir el bug de API key.
No debes alterar componentes compartidos de forma riesgosa.
No debes reemplazar funcionalidades existentes por mocks.

El nuevo panel administrativo debe vivir en:

```txt
/acceso
```

Ejemplos esperados:

```txt
/acceso
/acceso/dashboard
/acceso/usuarios
/acceso/mensajes
/acceso/alertas
/acceso/streaming
/acceso/grupos
```

---

## 2. Full TypeScript estricto

No uses `any`.
No uses objetos sin tipar.
No uses respuestas de API sin interfaces.
No uses estados ambiguos.

Debes crear o reutilizar tipos claros para:

- Usuario GeneXus
- Usuario seleccionado
- Grupo de usuarios
- Mensaje administrativo
- Alerta administrativa
- Destinatarios
- Estado de lectura
- Estado de entrega
- Ambiente QA/PROD
- Respuestas de API
- Errores controlados

---

## 3. Usar `/api` de Next.js para integraciones

Las integraciones con GeneXus y futuras APIs deben pasar por Route Handlers de Next.js.

No consumir directamente desde el cliente URLs sensibles de GeneXus.
No exponer API keys en frontend.
No exponer secretos al navegador.

Ejemplo esperado:

```txt
app/api/acceso/users/search/route.ts
app/api/acceso/messages/route.ts
app/api/acceso/alerts/route.ts
app/api/acceso/groups/route.ts
```

El frontend de `/acceso` debe consumir endpoints internos como:

```txt
/api/acceso/users/search
/api/acceso/messages
/api/acceso/alerts
/api/acceso/groups
```

---

# Variables, secretos y ambientes QA/PROD

## Requerimiento

Debes revisar el proyecto y confirmar si actualmente existen variables/secretos separados para QA y PROD, especialmente para las APIs de GeneXus.

Necesito que respondas explícitamente:

1. ¿El proyecto tiene variables para QA?
2. ¿El proyecto tiene variables para PROD?
3. ¿Dónde están definidas?
4. ¿Qué nombres tienen?
5. ¿Cuáles se usan en build time?
6. ¿Cuáles se usan en runtime?
7. ¿Alguna variable sensible está expuesta como `NEXT_PUBLIC_*` cuando no debería?
8. ¿El error `Unauthorized. Invalid or missing API key.` está relacionado con estas variables?

## APIs GeneXus para listado de usuarios

La API para jalar la lista de usuarios por vertical/evento es:

### QA

```txt
https://secure2.iimp.org:8443/KBServiciosPruebaIIMPJavaEnvironment/rest/siecodelist
```

### PROD

```txt
https://secure2.iimp.org:8443/KBServiciosIIMPJavaEnvironment/rest/siecodelist
```

### Body JSON

```json
{
  "event": "PROEXPLO26"
}
```

### Respuesta esperada

```json
{
  "siecodelist": [
    {
      "nombres": "PEDRO JOSUE CHIPANA",
      "tipo_doc": "1",
      "nro_doc": "72130008",
      "siecod": "P0000230649"
    },
    {
      "nombres": "JOSE RONALD RUTTI",
      "tipo_doc": "1",
      "nro_doc": "71305598",
      "siecod": "P0000176444"
    }
  ],
  "success": true,
  "message": "Success"
}
```

## Variables sugeridas

Si no existen variables correctas, propón e implementa una estructura similar a esta:

```env
GENEXUS_ENV=qa
GENEXUS_API_KEY=xxxxx
GENEXUS_EVENT_CODE=PROEXPLO26
GENEXUS_SIECODELIST_QA_URL=https://secure2.iimp.org:8443/KBServiciosPruebaIIMPJavaEnvironment/rest/siecodelist
GENEXUS_SIECODELIST_PROD_URL=https://secure2.iimp.org:8443/KBServiciosIIMPJavaEnvironment/rest/siecodelist
```

Para producción:

```env
GENEXUS_ENV=prod
GENEXUS_API_KEY=xxxxx
GENEXUS_EVENT_CODE=PROEXPLO26
GENEXUS_SIECODELIST_QA_URL=https://secure2.iimp.org:8443/KBServiciosPruebaIIMPJavaEnvironment/rest/siecodelist
GENEXUS_SIECODELIST_PROD_URL=https://secure2.iimp.org:8443/KBServiciosIIMPJavaEnvironment/rest/siecodelist
```

Importante:

- `GENEXUS_API_KEY` no debe exponerse al cliente.
- Las URLs internas de backend tampoco deberían necesitar `NEXT_PUBLIC`.
- Si hay una API key ya existente, no reemplazarla sin entender dónde se usa.
- Debes mantener compatibilidad con lo actual.

---

# Bug crítico actual: login retorna `Unauthorized. Invalid or missing API key.`

## Problema reportado

Después de los cambios realizados, al iniciar sesión en el login de usuarios desde la ruta principal, aparece un toast con el error:

```txt
Unauthorized. Invalid or missing API key.
```

Esto NO ocurre en producción ni en la rama estable/local en nube. Solo ocurre en esta rama actual.

## Tarea obligatoria

Debes investigar qué cambio provocó este error.

Revisa especialmente:

- `services/api.ts`
- `next.config.ts`
- `app/api/proxy/*`
- Route Handlers modificados
- Middleware si existe
- Headers enviados a GeneXus
- API key esperada
- Variables de entorno actuales
- Diferencias entre cliente, server y proxy
- Si se eliminó o cambió algún header obligatorio
- Si se está usando la API de QA/PROD incorrecta
- Si se está llamando desde frontend directo en vez del proxy
- Si se expuso o se perdió una variable `NEXT_PUBLIC_*`

## Resultado esperado

Debes devolver:

1. Causa exacta del error.
2. Archivo exacto donde se originó.
3. Código que lo corrige.
4. Confirmación de que el login de usuario raíz queda intacto.
5. Confirmación de que el panel `/acceso` no interfiere con ese login.

No implementes nada nuevo antes de corregir este bug.

---

# Nuevo módulo administrativo: Usuarios

## Pregunta funcional

He visto que se creó un módulo llamado `Usuarios`. Necesito que definas claramente cuál será la idea y propósito de ese módulo.

## Objetivo esperado del módulo Usuarios

El módulo `Usuarios` dentro de `/acceso` debe servir para:

1. Buscar participantes/usuarios desde GeneXus usando la API `siecodelist`.
2. Permitir buscar por nombre o por `siecod`.
3. Mostrar sugerencias a partir del tercer carácter escrito.
4. Permitir seleccionar usuarios y agregarlos a una lista temporal.
5. Permitir crear grupos con usuarios seleccionados.
6. Permitir usar esos usuarios o grupos como destinatarios para mensajes.
7. Permitir usar esos usuarios o grupos como destinatarios para alertas/notificaciones.
8. Evitar sobrecargar navegador y API cuando haya muchos usuarios.

---

# Búsqueda de usuarios GeneXus

## Comportamiento esperado

En `/acceso/usuarios`, el administrador debe tener una experiencia tipo buscador/autocomplete:

1. Escribe nombre o `siecod`.
2. La búsqueda empieza desde el tercer carácter.
3. Se muestran sugerencias relevantes.
4. Puede seleccionar uno o varios usuarios.
5. Los usuarios seleccionados se agregan a una lista visible.
6. Puede quitar usuarios seleccionados.
7. Puede guardar esa selección como grupo.
8. Puede enviar mensaje o alerta directamente a esa selección.

## Datos de usuario mínimos

Cada usuario debe mapearse a una estructura tipada:

```ts
export interface GenexusSiecodeUser {
  nombres: string;
  tipo_doc: string;
  nro_doc: string;
  siecod: string;
}
```

Luego se puede normalizar internamente:

```ts
export interface PortalRecipientUser {
  id: string;
  siecod: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  source: 'genexus';
}
```

---

# Rendimiento y técnica para no sobrecargar navegador/API

La API puede traer muchos usuarios, por lo que debes implementar una estrategia robusta.

## Obligatorio

- No buscar antes de 3 caracteres.
- Usar debounce de 300 a 500 ms.
- Cancelar request anterior con `AbortController` o mecanismo equivalente.
- Limitar resultados visibles.
- No renderizar miles de usuarios al mismo tiempo.
- Usar paginación, virtualización o filtrado eficiente si el dataset es grande.
- Cachear resultados por evento y query cuando aplique.
- Mostrar loading state.
- Mostrar empty state.
- Mostrar error state.

## Estrategia recomendada

Como la API `siecodelist` recibe solo `event` y probablemente devuelve toda la lista, implementar uno de estos enfoques:

### Opción A — Cache server-side por evento

Crear endpoint interno:

```txt
GET /api/acceso/users/search?q=ped&event=PROEXPLO26
```

Internamente:

1. El Route Handler consulta GeneXus por `event`.
2. Cachea la lista completa por evento durante un TTL razonable.
3. Filtra server-side por `nombres` y `siecod`.
4. Devuelve solo los primeros N resultados.

Respuesta sugerida:

```json
{
  "items": [],
  "total": 100,
  "limit": 20,
  "query": "ped",
  "success": true
}
```

### Opción B — Precarga controlada

Solo si el tamaño es razonable:

1. Cargar lista una vez al entrar al módulo.
2. Filtrar localmente con debounce.
3. Virtualizar resultados.

Preferencia: usar Opción A para no saturar navegador.

---

# Grupos de usuarios

## Requerimiento

El administrador debe poder crear grupos de usuarios.

Ejemplos:

- Grupo VIP
- Grupo Conferencistas
- Grupo Expositores
- Grupo Participantes PROEXPLO26
- Grupo Usuarios con acceso a streaming

## Funciones esperadas

En `/acceso/grupos` o dentro del módulo Usuarios:

- Crear grupo
- Editar grupo
- Eliminar grupo
- Ver detalle de grupo
- Agregar usuarios al grupo
- Quitar usuarios del grupo
- Buscar usuarios por nombre/siecod para agregarlos
- Usar grupo como destinatario para mensajes
- Usar grupo como destinatario para alertas

## Tipo sugerido

```ts
export interface RecipientGroup {
  id: string;
  name: string;
  description?: string;
  eventCode: string;
  users: PortalRecipientUser[];
  createdAt: string;
  updatedAt: string;
}
```

---

# Centro de Mensajes administrativo

## Ruta esperada

```txt
/acceso/mensajes
```

## Funciones esperadas

El administrador debe poder:

- Crear mensaje
- Definir título
- Definir contenido
- Definir extracto
- Definir categoría
- Definir prioridad
- Definir fecha de publicación
- Definir vigencia
- Elegir destinatarios individuales
- Elegir grupos
- Programar envío
- Publicar inmediatamente
- Ver estado del mensaje
- Ver trazabilidad básica
- Ver cuántos usuarios lo leyeron
- Ver cuántos usuarios lo tienen pendiente

## Destinatarios

Debe soportar:

1. Usuarios individuales seleccionados por `siecod`.
2. Grupos creados en `/acceso/grupos`.
3. Eventualmente segmentación por vertical/evento/categoría.

## Relación con dashboard de usuario

Cuando se cree un mensaje para un usuario, debe aparecer en tiempo real o casi tiempo real en el dashboard del usuario.

Debe activar badge/punto visual en el ícono de mensajes.

Cuando el usuario abra el mensaje:

- Se marca como leído.
- Desaparece el badge/punto si ya no hay mensajes pendientes.
- Se actualiza contador.

---

# Alertas y notificaciones administrativas

## Ruta esperada

```txt
/acceso/alertas
```

## Funciones esperadas

El administrador debe poder:

- Crear alerta/notificación
- Definir título corto
- Definir mensaje breve
- Definir tipo
- Definir prioridad
- Definir vigencia
- Definir fecha de inicio
- Definir fecha de expiración
- Elegir destinatarios individuales
- Elegir grupos
- Asociar link o acción
- Publicar inmediatamente
- Programar publicación

## Tipos sugeridos

```ts
export type AlertPriority = 'info' | 'important' | 'urgent';

export interface AdminAlertPayload {
  title: string;
  message: string;
  priority: AlertPriority;
  startsAt: string;
  expiresAt: string;
  actionUrl?: string;
  recipients: RecipientTarget[];
}
```

## Relación con dashboard de usuario

Las alertas deben verse en tiempo real o casi tiempo real dentro del dashboard del usuario.

Debe existir badge/punto en el ícono de notificaciones.

Cuando el usuario abre o marca la alerta como leída:

- Desaparece el badge/punto correspondiente.
- Se actualiza contador.
- No debe seguir apareciendo como pendiente.

---

# Tiempo real / casi tiempo real

## Requerimiento

Los mensajes y notificaciones deben visualizarse en tiempo real desde el dashboard del usuario.

## Implementación permitida

Si no existe WebSocket/SSE backend real todavía, implementar una solución de polling controlado:

- Polling cada 20 a 30 segundos.
- Solo mientras el usuario está autenticado.
- Detener polling al desmontar layout o cerrar sesión.
- Evitar duplicados.
- Evitar llamadas innecesarias si la pestaña está oculta usando Page Visibility API si es viable.

## Implementación ideal futura

Dejar la arquitectura preparada para migrar luego a:

- WebSocket
- Server-Sent Events
- Servicio push

Pero por ahora, si no hay backend realtime, polling bien hecho es aceptable.

---

# Badges y puntos visuales en dashboard del usuario

## Requerimiento

Dentro del dashboard del usuario existente, los íconos de mensajes y notificaciones deben mostrar:

- Badge numérico o punto visual cuando existan pendientes.
- El badge de mensajes depende de mensajes no leídos.
- El badge de notificaciones depende de alertas/notificaciones no leídas o vigentes pendientes.
- Al abrir mensajes/notificaciones, deben marcarse como leídos y desaparecer del badge cuando corresponda.

## Reglas

- No mostrar badge si el contador es 0.
- Si hay más de 99, mostrar `99+` si se usa badge numérico.
- Mantener estilo visual coherente con el dashboard.
- Debe ser responsive.

---

# Streaming administrativo

## Ruta esperada

```txt
/acceso/streaming
```

## Funciones esperadas

El administrador debe poder:

- Crear o registrar contenido de streaming/video.
- Definir título.
- Definir descripción.
- Definir Vimeo ID o URL válida.
- Asociar a evento.
- Asociar a grupos o usuarios.
- Definir ventana de disponibilidad.
- Definir estado.
- Guardar configuración.

## Dashboard usuario

El usuario solo debe ver contenido que le corresponda según:

- Usuario individual
- Grupo
- Evento
- Horario
- Permiso

---

# Arquitectura sugerida de carpetas

Implementa de forma ordenada. Puedes adaptar según la estructura real, pero mantén separación clara.

```txt
app/
  acceso/
    layout.tsx
    page.tsx
    dashboard/
      page.tsx
    usuarios/
      page.tsx
    grupos/
      page.tsx
    mensajes/
      page.tsx
    alertas/
      page.tsx
    streaming/
      page.tsx

  api/
    acceso/
      users/
        search/
          route.ts
      groups/
        route.ts
        [id]/
          route.ts
      messages/
        route.ts
        [id]/
          route.ts
      alerts/
        route.ts
        [id]/
          route.ts
      streaming/
        route.ts
        [id]/
          route.ts

components/
  acceso/
    layout/
    users/
    groups/
    messages/
    alerts/
    streaming/

services/
  acceso/
    accesoApi.ts
    users.service.ts
    groups.service.ts
    messages.service.ts
    alerts.service.ts
    streaming.service.ts

store/
  acceso/
    useUsersAdminStore.ts
    useGroupsAdminStore.ts
    useMessagesAdminStore.ts
    useAlertsAdminStore.ts
    useStreamingAdminStore.ts

types/
  acceso/
    users.ts
    groups.ts
    recipients.ts
    messages.ts
    alerts.ts
    streaming.ts
    api.ts
```

---

# UX/UI esperada para `/acceso`

El panel administrativo debe sentirse profesional, moderno y simple.

## Debe incluir

- Layout administrativo claro.
- Sidebar o navegación superior.
- Cards/resumen en dashboard.
- Tablas limpias.
- Buscadores con autocomplete.
- Badges de estado.
- Modales o drawers para crear/editar.
- Estados loading/empty/error.
- Confirmaciones antes de eliminar.
- Feedback visual con toast.
- Responsive.

## Importante

Puede reutilizar la estética del dashboard actual del usuario, pero sin mezclar lógica sensible.

---

# Persistencia temporal o backend real

Si todavía no existe backend real para guardar mensajes, alertas, grupos y streaming, implementar Route Handlers fake o persistencia temporal controlada, pero dejar contratos listos para backend real.

Importante:

- No dejar mocks embebidos dentro de componentes.
- Los componentes deben consumir servicios.
- Los servicios deben consumir `/api`.
- El día que exista backend real, solo se reemplazan Route Handlers o servicios.

---

# Auditoría obligatoria del informe previo

Antes de implementar, revisa si realmente se cumplió el informe anterior.

Valida:

## Centro de Mensajes

- ¿Existe store real?
- ¿Existe API route?
- ¿Se eliminaron mocks embebidos?
- ¿Hay filtros todos/no leídos/importantes/históricos?
- ¿Hay contador de no leídos?
- ¿Hay polling?
- ¿Hay deep links?
- ¿Se marca como leído correctamente?

## Alertas

- ¿Existe store real?
- ¿Existe API route?
- ¿Hay prioridad?
- ¿Hay expiración?
- ¿Hay vigencia?
- ¿Hay polling?
- ¿Hay toast enriquecido?
- ¿Hay deep links?
- ¿Se marca como leído correctamente?

## Streaming

- ¿Existe vista real?
- ¿Hay tarjetas?
- ¿Hay estados disponible/próximo/finalizado/restringido?
- ¿Hay integración Vimeo?
- ¿Hay reglas por horario?
- ¿Hay reglas por categoría/grupo/usuario?

Si algo dice `[x]` en el informe pero no existe en código real, debes marcarlo como incumplido y corregirlo.

---

# Entregables esperados de OpenCode

Al finalizar, debes devolver un informe técnico con:

1. Diagnóstico del estado actual.
2. Causa exacta del bug `Unauthorized. Invalid or missing API key.`.
3. Confirmación de variables QA/PROD encontradas.
4. APIs QA/PROD confirmadas.
5. Archivos modificados.
6. Rutas nuevas creadas bajo `/acceso`.
7. Route Handlers creados bajo `/api/acceso`.
8. Tipos creados.
9. Stores creados.
10. Servicios creados.
11. Cómo probar búsqueda de usuarios.
12. Cómo probar creación de grupos.
13. Cómo probar envío de mensajes.
14. Cómo probar envío de alertas.
15. Cómo probar badges en dashboard de usuario.
16. Cómo probar comportamiento tiempo real/polling.
17. Pendientes si algo requiere backend real.
18. Riesgos detectados.
19. Recomendaciones para producción.

---

# Criterio final de aceptación

El trabajo solo se considera correcto si:

- El login principal del usuario vuelve a funcionar.
- El error de API key desaparece.
- El panel administrativo vive en `/acceso`.
- El portal de usuario actual no se rompe.
- Se puede buscar usuarios GeneXus por nombre o `siecod`.
- La búsqueda inicia desde 3 caracteres.
- La búsqueda no sobrecarga navegador ni API.
- Se pueden seleccionar usuarios.
- Se pueden crear grupos.
- Se pueden enviar mensajes a usuarios/grupos.
- Se pueden enviar alertas a usuarios/grupos.
- El usuario ve mensajes/notificaciones en dashboard.
- Los íconos muestran badge/punto cuando hay pendientes.
- Al abrir mensaje/notificación, el badge desaparece cuando corresponde.
- Todo está tipado estrictamente.
- No hay `any` injustificado.
- No hay mocks embebidos en componentes.
- Las APIs internas se hacen con Route Handlers de Next.js.
- Los secretos no se exponen al frontend.
- QA y PROD están correctamente separados.

---

# Modo de trabajo solicitado

Trabaja como:

- Arquitecto senior
- Tech lead
- QA lead
- Especialista en Next.js App Router
- Especialista en TypeScript estricto

No suavices errores.
No asumas que algo está bien si no hay evidencia en el código.
No marques como cumplido algo que solo existe visualmente.
No rompas lo existente.
Prioriza primero corregir login/API key y luego continuar con `/acceso`.
