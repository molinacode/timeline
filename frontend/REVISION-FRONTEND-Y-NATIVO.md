# Revisión del frontend TimeLine y viabilidad app nativa

## 1. Estado general: ¿está todo afinado?

### Lo que está bien resuelto

- **Sistema de diseño**: Variables CSS coherentes (light/dark), tokens de espaciado, bordes, tipografía. Uso consistente de `.app-page`, `.app-card`, `.app-btn-primary`, `.app-form-message--error`, etc.
- **Rutas y protección**: `RequireAuth` y `RequireRole` protegen correctamente; rutas de listas, perfil, comparador, búsqueda y lector están definidas y enlazadas.
- **Lector**: Tipografía y ancho de línea afinados; respeta tema claro/oscuro; botón "Web original" con estado activo.
- **Búsqueda**: Filtros con categoría (select desde `GET /api/categories`) y sesgo; estados vacío y error unificados.
- **Comparador**: Tabs Todas / Progresista / Centrista / Conservador; filtrado en cliente; empty state consistente.
- **Listas**: CRUD completo, enlace en perfil ("Ver mis listas"), "Volver a Mis listas" en detalle; empty states con `.app-empty-state`.
- **Layout**: Header, drawer móvil, pestañas móviles, `app-main--with-bottom-nav` para no tapar contenido; menú lateral configurable (izq/der).
- **Sesión**: Interceptor de 401 + `SessionExpiredHandler` cierra sesión y redirige a login.
- **ErrorBoundary**: Pantalla de fallback con "Reintentar" e "Ir al inicio".

### Puntos que conviene afinar

| Área | Detalle | Prioridad |
|------|---------|-----------|
| **Lector** | Si el usuario recarga en `/reader`, pierde la noticia (solo existe en `location.state`). No hay URL con id para recuperar. | Media |
| **API** | `api/client.ts` (`fetchApi`, `authHeaders`) no se usa; cada pantalla monta `fetch` + headers a mano. Funciona pero duplica lógica y mensajes de error. | Baja |
| **Código** | No hay `React.lazy` en rutas; todo el bundle se carga al entrar. Admin, demo y listas podrían ser lazy para mejorar tiempo de carga inicial. | Media |
| **Accesibilidad** | Hay algo de `aria-label` y `role` (tabs comparador, drawer, botones); no hay foco visible consistente ni skip-link. | Media |
| **Consistencia** | Algunas páginas usan `app-muted-inline` para loading/empty y otras ya usan `app-empty-state`; unificar en todo el proyecto. | Baja |
| **ListCreatePage** | No tiene enlace "Volver a Mis listas" arriba (sí tiene botón Cancelar que navega); opcional añadir breadcrumb/link igual que en detalle. | Baja |

---

## 2. Sugerencias de mejora

### 2.1 UX y contenido

- **Lector sin estado en URL**: Guardar en la URL un identificador (p. ej. `?url=...` codificado o `?id=...` si el backend devuelve id). Así al recargar se puede volver a cargar el artículo o al menos mostrar "Abre esta noticia desde el timeline".
- **Mensaje al recargar en lector**: Si `!item` (recarga), mostrar un CTA claro: "Esta noticia se perdió al recargar. Vuelve a tu TimeLine y ábrela de nuevo" con botón a `/me/timeline`.
- **Búsqueda**: Si el backend no soporta `category`/`bias` en query params, el filtrado en cliente está bien; cuando el backend los soporte, quitar el filtrado duplicado en cliente.
- **Comparador**: Opcional mostrar un contador por pestaña (ej. "Progresista (5)").

### 2.2 Código y arquitectura

- **Unificar llamadas API**: Usar `api/client.ts` (`fetchApi` + `authHeaders`) en todas las pantallas que piden datos con token. Centralizar mensajes de error (p. ej. "Error de conexión", "No se pudieron cargar los datos") y reducir duplicación.
- **Lazy de rutas**: Cargar bajo demanda con `React.lazy` + `Suspense` las rutas de admin, demo, listas, comparador y lector. Mantener críticas (home, login, timeline principal) en el bundle principal.
- **Manejo de loading global**: Opcional: un estado global o contexto de "loading" para peticiones críticas (por ejemplo barra arriba o spinner en layout), además del loading local por página.

### 2.3 Estilos y responsive

- **Safe area**: Para móviles con notch o barra de gestos, usar `padding: env(safe-area-inset-top)` en header y `env(safe-area-inset-bottom)` en el bloque de pestañas inferiores y en `app-main--with-bottom-nav`. Así se prepara ya para app nativa.
- **Unificar empty/loading**: Donde quede `app-muted-inline` para "no hay datos" o "cargando…", valorar usar `.app-empty-state` y `.app-empty-state-message` para mensajes largos y dejar `app-muted-inline` solo para textos cortos inline.
- **Focus visible**: Añadir `:focus-visible` con outline/ring en botones y enlaces para teclado y accesibilidad.

### 2.4 Accesibilidad

- **Skip link**: Un "Saltar al contenido" al inicio del layout que lleve al `main` y sea visible al recibir foco.
- **Encabezados**: Revisar que las páginas tengan un único `h1` (BasePage ya pone el título como `h1`) y que la jerarquía (h2, h3) sea lógica.
- **Formularios**: Donde falte, asociar bien `label` con `id` en inputs (ListCreatePage y otros ya lo hacen; revisar Login/Register y listas).
- **Mensajes de error**: Asegurar que los errores de formulario estén asociados con `aria-describedby` o que se anuncien con `role="alert"` para lectores de pantalla.

---

## 3. ¿Podemos hacer la app nativa para Android e iOS?

### 3.1 Respuesta corta

**Sí.** La app está hecha con React + Vite, sin dependencias que impidan empaquetar en un WebView. La vía más directa es usar **Capacitor** (recomendado) o **Cordova** para generar proyectos nativos Android e iOS que carguen la URL del frontend (o el build estático).

### 3.2 Qué ya favorece que sea nativa

- **Una sola SPA**: Rutas con React Router; no dependes de múltiples dominios ni de lógica específica de escritorio.
- **Viewport y responsive**: `meta viewport` y estilos que se adaptan a pantalla pequeña; pestañas inferiores y drawer ya pensados para móvil.
- **Tema y colores**: `theme-color` en el HTML; tema claro/oscuro con variables CSS (útil en modo sistema en móvil).
- **Auth con token**: El backend usa Bearer token; en nativo puedes guardar el token de forma segura (Capacitor Preferences o similar) y enviarlo en las peticiones igual que en web.
- **API por configuración**: `VITE_API_URL` permite apuntar al mismo backend desde la app nativa (misma URL que en producción web).

### 3.3 Qué hay que hacer o revisar para nativo

| Tarea | Descripción |
|------|-------------|
| **1. Build estático** | `npm run build` en frontend; Capacitor servirá los ficheros de `dist/` desde el WebView. Ya deberías poder hacer build sin cambios. |
| **2. URL del API** | En la app nativa, `VITE_API_URL` debe ser la URL pública del backend (ej. `https://api.timelinenews.es`). Sin proxy; las peticiones van directas desde el dispositivo. |
| **3. CORS** | El backend debe permitir el origen de la app. En nativo el origen puede ser `capacitor://localhost` o `file://`; hay que permitir ese origen (o todos en dev) en CORS. |
| **4. Almacenamiento del token** | Hoy el token seguramente está en memoria o en algo como `localStorage`. En Capacitor se puede seguir usando `localStorage` dentro del WebView, o usar `@capacitor/preferences` para persistencia más segura. Revisar que el token sobreviva al cerrar la app (Preferences o persist en AuthProvider). |
| **5. Safe areas** | Añadir `env(safe-area-inset-*)` en header, main y barra inferior para que no queden contenidos bajo notch o barra de gestos en iOS. |
| **6. Deep links / URL abierta en el lector** | Si abres la app desde un enlace (ej. `timelinenews://reader?url=...`), hace falta configurar esquema en Capacitor y que la app lea la URL y navegue a `/reader` con estado. Opcional para una primera versión. |
| **7. PWA (opcional)** | No hay `manifest.json` ni service worker. Para "instalar" en móvil como PWA no es obligatorio para Capacitor; si más adelante quieres PWA además de app nativa, añadir manifest y, si quieres offline básico, un service worker. |
| **8. Certificados y permisos** | iOS: cuenta de Apple Developer, certificados y provisioning. Android: keystore para firmar. Nada de esto cambia el código del frontend. |
| **9. Gestos del sistema** | En iOS, el gesto de "atrás" puede cerrar la app o el WebView; React Router ya maneja el historial. Comportamiento por defecto suele ser aceptable. |
| **10. Actualizaciones** | La app nativa carga el JS/CSS del build; para actualizar contenido y lógica basta con desplegar el frontend y que la app cargue esa URL (o empaquetar de nuevo si sirves desde `dist` embebido). |

### 3.4 Pasos mínimos recomendados (Capacitor)

1. En el proyecto frontend: `npm run build`.
2. Instalar Capacitor: `npm install @capacitor/core @capacitor/cli`, `npx cap init` (nombre, id de app, carpeta web `dist`).
3. Añadir plataformas: `npm install @capacitor/android @capacitor/ios`, `npx cap add android`, `npx cap add ios`.
4. Configurar en `capacitor.config.ts`: `server.url` (opcional, para dev con live reload) o servir desde `dist`; `server.allowNavigation` si usas rutas del backend.
5. En el backend: permitir CORS para `capacitor://localhost` (y tu dominio si la app carga desde URL).
6. Definir `VITE_API_URL` en el build que use la app nativa (mismo backend que la web).
7. Añadir safe area en CSS (header y `app-main--with-bottom-nav`).
8. Abrir en IDE: `npx cap open android` / `npx cap open ios`, compilar y probar en dispositivo o emulador.

### 3.5 Conclusión

- **¿Está todo afinado?** En general sí: diseño coherente, rutas, listas, búsqueda, comparador, lector y perfil están bien integrados. Los flecos son sobre todo: lector sin estado en URL, no uso del cliente API centralizado, falta de lazy loading y de safe areas.
- **Sugerencias**: Priorizar safe areas y mensaje claro al recargar en lector; luego unificar API y empty states; después lazy de rutas y mejoras de a11y.
- **App nativa**: Es viable con la base actual. Con Capacitor, build del frontend, CORS, `VITE_API_URL` y safe areas, puedes tener una versión Android e iOS funcional; el resto (token persistente, deep links, PWA) son mejoras opcionales.
