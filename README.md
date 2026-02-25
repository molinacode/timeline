# TimeLine – Agregador de noticias RSS

Proyecto fullstack: frontend (React + Vite) y backend (Express) con base de datos en **Supabase (PostgreSQL)**. Incluye registro/login con JWT, fuentes RSS, noticias por categoría/región/sesgo y panel de administración.

---

## Requisitos

- **Node.js** 20.17 o superior
- **Cuenta en [Supabase](https://supabase.com)** (gratuita)
- (Opcional) Cliente Git

---

## Instalación en local

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd timeline-project
npm install
```

Si usas el script de instalación automática (recomendado en Windows):

```bash
node install.js
```

Ese script comprueba Node, copia `backend/env.example` → `backend/.env`, e instala dependencias de `backend` y `frontend`.

### 2. Configurar Supabase

1. Crea un proyecto en [dashboard.supabase.com](https://dashboard.supabase.com).
2. En **Project Settings** → **API** copia:
   - **Project URL** → lo usarás en `SUPABASE_URL`
   - **service_role** (clave secreta) → lo usarás en `SUPABASE_SERVICE_ROLE_KEY`
3. En el **SQL Editor** de Supabase, ejecuta en este orden:
   - Todo el contenido de `backend/database/schema.supabase.sql` (crea las tablas).
   - Todo el contenido de `backend/database/rls-policies.supabase.sql` (activa RLS y políticas para el backend).

### 3. Configurar variables de entorno

Edita **`backend/.env`** (si no existe, cópialo desde `backend/env.example`):

- **Obligatorias para el backend:**
  - `SUPABASE_URL` = URL de tu proyecto (ej. `https://xxxxx.supabase.co`)
  - `SUPABASE_SERVICE_ROLE_KEY` = clave **service_role** de la pestaña API (no la anon/public)
- **JWT:** deja `JWT_SECRET` y `JWT_REFRESH_SECRET` o genera otros seguros (ver comentarios en `env.example`).
- **Opcional:** `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` para el usuario admin que creará el script.

No hace falta poner la contraseña de la base de datos en `.env`; el backend usa la API de Supabase con la service role key.

### 4. Crear usuario admin y fuentes por defecto

Desde la raíz del proyecto (o desde `backend`):

```bash
cd backend
npm run create-admin
```

Crea el usuario admin y, si la tabla de fuentes está vacía, inserta fuentes RSS por defecto. Puedes iniciar sesión en el frontend con el email y contraseña configurados (por defecto `admin@timeline.es` / `admin` si no los cambiaste).

### 5. Arrancar backend y frontend

**Opción A – Dos terminales**

```bash
# Terminal 1 – Backend
cd backend
npm run dev

# Terminal 2 – Frontend
cd frontend
npm run dev
```

**Opción B – Windows (script)**

Desde la raíz del proyecto:

```powershell
.\iniciar-servidores.ps1
```

(Requiere que exista `scripts/windows/start-servers.ps1`.)

- **Backend:** [http://localhost:3001](http://localhost:3001)  
- **Frontend:** [http://localhost:5173](http://localhost:5173)

---

## Estructura del proyecto

| Carpeta / archivo        | Descripción |
|--------------------------|------------|
| `backend/`               | API Express, auth JWT, rutas de noticias/fuentes/admin, cron RSS |
| `backend/database/`      | `schema.supabase.sql` (esquema Postgres) y `rls-policies.supabase.sql` |
| `backend/env.example`    | Plantilla de variables de entorno (copiar a `backend/.env`) |
| `frontend/`              | App React + Vite |
| `install.js`             | Script de instalación automática |
| `iniciar-servidores.ps1` | Iniciar backend y frontend (Windows) |

---

## Endpoints principales

- `GET /health` – Estado del backend  
- `POST /api/auth/register` – Registro  
- `POST /api/auth/login` – Login  
- `GET /api/auth/verify-email?token=...` – Verificación de email  
- `GET /api/news` – Noticias del timeline (desde `news_items` en Supabase)  
- `GET /api/sources` – Fuentes (requiere auth)  
- Rutas bajo `/api/admin/*` – Panel admin (requiere rol admin)

---

## Notas

- **Noticias vacías:** Si `GET /api/news` devuelve `[]`, es normal hasta que el cron de RSS (o una ejecución al arrancar) rellene la tabla `news_items` desde las fuentes de `news_sources`. Crear admin con `npm run create-admin` inserta fuentes por defecto.
- **Verificación de email:** Para que se envíe el correo al registrarse, configura Nodemailer en `backend/.env` (SMTP_HOST, SMTP_USER, SMTP_PASS, etc.). **Guía paso a paso:** [backend/docs/EMAIL_SETUP.md](backend/docs/EMAIL_SETUP.md). Sin SMTP, en desarrollo el enlace de verificación se muestra en la consola del backend.
- **Producción:** Usa `JWT_SECRET` y `JWT_REFRESH_SECRET` generados de forma segura; no subas `.env` al repositorio.

### Despliegue (Vercel + Render)

- **Backend (Render):** Define `FRONTEND_URL=https://timelinenews.es` para CORS y enlaces de verificación de email. Las demás variables como en `backend/env.example`.
- **Frontend (Vercel):** Define `VITE_API_URL` con la URL del backend (ej. `https://tu-backend.onrender.com`) para que las peticiones `/api/*` vayan al backend. Sin esta variable, en producción el login y el resto del API darían 404.
- **SPA y recargas:** El `frontend/vercel.json` redirige todas las rutas a `index.html` para evitar 404 al recargar en `/login`, `/admin`, etc.

---

## Licencia

MIT.
