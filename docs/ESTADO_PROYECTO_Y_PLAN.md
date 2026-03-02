# Estado del proyecto TimeLine y plan de desarrollo

Resumen de dónde está el proyecto y qué queda por hacer según la documentación y el código.

---

## Resumen de commits (git)

Historial reciente (de más reciente a más antiguo):

| Commit | Descripción |
|--------|-------------|
| Filtros fuentes, categorías especiales y acuerdo de uso admin | Admin: filtros y acuerdo de uso |
| Merge feature/frontend-ux-redesign | UX del frontend |
| Acuerdo de uso, bloqueo acceso y pulido comparador | Términos, bloqueo de acceso, comparador |
| Snapshot comparador sesgo + mejora recarga login | Cache comparador por sesgo, login |
| Cache para comparador de sesgo (by-bias-matched) | API by-bias-matched cacheada |
| Mejorar rendimiento API noticias y admin | Optimización rutas |
| ESLint, tsconfig, imports y nota RLS create-admin | Lint y documentación RLS |
| Mejoras despliegue, RLS, logs y sesión expirada | Despliegue, RLS, SessionExpiredHandler |
| features: analytics | Vercel Analytics, admin, verify email |
| fix: api auth | Corrección auth API |
| Convert frontend from submodule to regular folder | Frontend como carpeta normal |
| Initial Commit: backend + frontend (Supabase) | Esquema Supabase, rutas, create-admin |

**Conclusión:** El proyecto está en Supabase desde el inicio; no hay migración SQLite en uso. Lo pendiente según la memoria (búsqueda, listas, noticias guardadas) no estaba en los commits hasta ahora; **noticias guardadas** se ha implementado en esta tanda (API + pantalla Guardadas + botón Guardar en timeline).

---

## 1. Estado actual del código

### Base de datos y backend
- **Backend en uso:** Supabase (PostgreSQL). Todo el backend usa `getSupabase()` y las rutas leen/escriben en Supabase.
- **Esquemas:**
  - `backend/database/schema.supabase.sql` — esquema para Supabase (ejecutar en SQL Editor).
  - `backend/database/rls-policies.supabase.sql` — políticas RLS.
  - `backend/database/schema.sql` — esquema SQLite (legacy; no se usa en el flujo actual).
- **Scripts:** Solo `npm run create-admin` y `npm run reset-admin-password` (los de migrate/seed/stats se han eliminado; la instalación usa Supabase + create-admin).
- **Documentación:** README raíz y `backend/docs/README.md` actualizados para Supabase + create-admin.

### Frontend
- **Implementado:** Home, registro/login, verificación email, Mi TimeLine (tabs: Última hora, Categorías, Fuentes locales, Mis fuentes RSS), Noticias guardadas (`/me/saved`), Comparador de sesgos, panel admin (fuentes, categorías, bias, métricas, logs, usuarios), perfil, fuentes regionales, modo claro/oscuro, aviso cookies. En el timeline (Última hora) hay botón "Guardar" por noticia cuando la API devuelve id.
- **Rutas:** Definidas en `App.tsx`; incluye `/me/saved` para guardadas.

### Arreglos ya hechos (esta tanda)
- install.js: ya no llama a migrate/seed/stats; indica Supabase + create-admin.
- backend/package.json: eliminados scripts que apuntaban a archivos inexistentes.
- backend/docs/README.md: instalación actualizada a Supabase + create-admin.

### Antes (inconsistencias ya corregidas)
| Qué | Dónde | Detalle |
|-----|--------|---------|
| Scripts migrate/seed | `backend/package.json` | Llaman a `migrate.js`, que no existe. |
| Instalación automática | `install.js` | Ejecuta `npm run migrate` y `npm run seed` en backend; fallarán. |
| README backend | `backend/docs/README.md` | Describe SQLite, migrate, seed, stats como si fueran el flujo principal; el flujo real es Supabase + create-admin. |
| switch-mode.js | Raíz | Dice "modo LOCAL + SQLite", pero el backend actual es 100 % Supabase. |

---

## 2. Plan según el documento DAW (memoria del proyecto)

En la memoria del proyecto (documento DAW) se menciona, en **Conclusiones / vías futuras**, dejar para más adelante:

- **Búsqueda avanzada**
- **Listas personalizadas** (el modelo de datos ya tiene `source_lists` y `source_list_items`)
- **Noticias guardadas** (el modelo tiene `user_saved_news`)

Es decir: el plan era tener primero lo esencial (registro, login, agregación RSS, panel admin) y en una siguiente fase añadir búsqueda, listas y guardados.

---

## 3. Dónde os habéis quedado (resumen)

- **Hecho:** App funcional con Supabase: auth, timeline, comparador, admin, fuentes por sesgo, métricas, logs, usuarios. Documentación de los puntos 7 y 8 (diseño del proyecto y despliegue/pruebas) en `docs/` (PUNTO_7_DISENO_PROYECTO.md y PUNTO_8_DESPLIEGUE_PRUEBAS.md, si los tienes en tu copia). Wireframes en `docs/wireframes-timeline.drawio`.
- **Pendiente / siguiente fase (según memoria):**
  1. Búsqueda avanzada de noticias.
  2. Listas personalizadas de fuentes (CRUD de listas y asignación de fuentes).
  3. ~~Noticias guardadas~~ **Hecho:** pantalla `/me/saved`, API GET/POST/DELETE `/api/me/saved`, botón Guardar en timeline (Última hora).
- **Arreglos recomendados (ya aplicados o opcionales):** Migrate/seed y README backend ya actualizados; opcional: ajustar `switch-mode.js` si se deja de usar SQLite.

---

## 4. Próximos pasos sugeridos (orden)

1. **Opcional:** Ajustar `switch-mode.js` para que no hable de SQLite si ya no se usa ese modo.
2. **Siguiente fase de producto:** Listas personalizadas → búsqueda avanzada.

(Los pasos de decidir flujo Supabase y arreglar instalación ya están hechos.)
