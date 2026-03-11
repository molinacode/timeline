# 🚀 TimeLine Backend API

API REST para el agregador de noticias RSS TimeLine. Proporciona endpoints para autenticación, gestión de noticias, fuentes RSS y usuarios.

## 📋 Características

- **🔐 Autenticación JWT**: Sistema completo de login/registro con tokens
- **📰 Gestión de Noticias**: CRUD completo para noticias RSS
- **📡 Fuentes RSS**: Gestión de fuentes de noticias
- **👥 Gestión de Usuarios**: Perfiles y preferencias
- **🗄️ Base de Datos Supabase (PostgreSQL)**: Esquema y RLS en Supabase
- **🛡️ Seguridad**: Rate limiting, CORS, validación de datos
- **📊 Logging**: Sistema completo de logs y monitoreo
- **👤 Admin**: Script create-admin para usuario admin y fuentes por defecto

## 🛠️ Tecnologías

- **Node.js** + **Express.js**
- **Supabase** (PostgreSQL) con **@supabase/supabase-js**
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **express-validator** para validación
- **helmet** para seguridad
- **cors** para CORS

## 📦 Instalación

1. **Supabase**: Crea un proyecto en [dashboard.supabase.com](https://dashboard.supabase.com). En el SQL Editor ejecuta (en este orden):
   - `database/schema.supabase.sql`
   - `database/rls-policies.supabase.sql`

2. **Variables de entorno**: `cp env.example .env` y configura `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, y opcionalmente `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.

3. **Dependencias y admin**:
```bash
npm install
npm run create-admin   # Crea usuario admin y sincroniza fuentes desde fuentes-base.json
npm run dev
```

## 🔧 Configuración

### Variables de Entorno

Copia `env.example` a `.env` y configura:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Supabase (obligatorio)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# JWT
JWT_SECRET=tu-clave-secreta-super-segura
JWT_REFRESH_SECRET=tu-clave-refresh-super-segura

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 📚 API Endpoints

### 🔐 Autenticación

```http
POST /api/auth/register    # Registro de usuario
POST /api/auth/login       # Inicio de sesión
POST /api/auth/refresh     # Renovar token
POST /api/auth/logout      # Cerrar sesión
GET  /api/auth/verify      # Verificar token
```

### 📰 Noticias

```http
GET  /api/news                    # Obtener noticias (con filtros)
GET  /api/news/featured           # Noticias destacadas
GET  /api/news/latest             # Últimas noticias
GET  /api/news/categories         # Estadísticas por categoría
GET  /api/news/regions            # Estadísticas por región
GET  /api/news/:id                # Noticia por ID
POST /api/news/:id/view           # Incrementar vistas
GET  /api/news/search/suggestions # Sugerencias de búsqueda
```

### 📡 Fuentes

```http
GET  /api/sources           # Obtener fuentes
GET  /api/sources/:id       # Fuente por ID
POST /api/sources           # Crear fuente (admin)
PUT  /api/sources/:id       # Actualizar fuente (admin)
DELETE /api/sources/:id     # Eliminar fuente (admin)
```

### 👥 Usuarios

```http
GET  /api/users/profile     # Perfil del usuario
PUT  /api/users/profile     # Actualizar perfil
GET  /api/users/sources     # Fuentes del usuario
POST /api/users/sources     # Agregar fuente personalizada
DELETE /api/users/sources/:id # Eliminar fuente personalizada
```

## 🗄️ Base de Datos

### Esquema Principal

- **users**: Usuarios del sistema
- **news_sources**: Fuentes RSS configuradas
- **news_items**: Noticias almacenadas
- **user_sources**: Relación usuarios-fuentes
- **user_custom_sources**: Fuentes personalizadas
- **user_preferences**: Preferencias de usuario
- **sessions**: Sesiones de usuario
- **fetch_logs**: Logs de obtención de noticias

### Admin y recuperación (Supabase)

- **Crear admin**: `npm run create-admin` — Crea el usuario administrador usando `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NAME` del `.env`.
- **Resetear contraseña del admin**: `npm run reset-admin-password` — Actualiza la contraseña del usuario con `ADMIN_EMAIL` usando el valor actual de `ADMIN_PASSWORD` en `.env`. Pensado para desarrollo o recuperación puntual. En producción hay que definir además `ALLOW_RESET_ADMIN=true` para poder ejecutarlo.

## 🔒 Seguridad

- **JWT Authentication**: Tokens seguros con refresh
- **Rate Limiting**: Límite de requests por IP/usuario
- **CORS**: Configuración segura de CORS
- **Helmet**: Headers de seguridad
- **Input Validation**: Validación de todos los inputs
- **SQL Injection Protection**: Prepared statements
- **Password Hashing**: bcrypt con salt rounds

## 📊 Monitoreo y Logs

### Logs Disponibles

- **Request/Response**: Todas las peticiones HTTP
- **Error Logs**: Errores en base de datos
- **Authentication**: Intentos de login
- **Database**: Queries y transacciones

## 🚀 Scripts Disponibles

```bash
npm start          # Servidor de producción
npm run dev        # Servidor de desarrollo con nodemon
npm run create-admin        # Crear usuario admin y sincronizar fuentes
npm run reset-admin-password # Resetear contraseña del admin (solo dev/recuperación)
npm run sync-news-sources   # Sincronizar news_sources con data/fuentes-base.json
npm run import-razon-sitemap # Importar noticias de La Razón desde sitemap
npm run check-sources       # Comparar fuentes-base con prensaescrita (y opcionalmente importar)
npm run check-local-sources # Comparar fuentes locales por región e importar nuevas
npm test           # Ejecutar tests
```

### RSS y aviso DEP0169 (url.parse)

En Node.js 22+ puede aparecer el aviso *DEP0169: url.parse() is deprecated*. El backend evita esa ruta usando **axios** para descargar el XML del feed y **rss-parser.parseString()** en lugar de `parseURL()`. La lógica está centralizada en `src/services/rssFetch.js` (`fetchAndParseRss`). Así no se usa el módulo `http` de Node con URL en string y el aviso no sale.

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests de integración
npm run test:integration
```

## 📈 Rendimiento

### Optimizaciones Implementadas

- **Índices de BD**: Optimizados para consultas frecuentes
- **Connection Pooling**: Pool de conexiones eficiente
- **Query Optimization**: Consultas SQL optimizadas
- **Caching**: Cache en memoria para datos frecuentes
- **Rate Limiting**: Prevención de abuso

### Métricas

- **Response Time**: < 100ms para consultas simples
- **Throughput**: 1000+ requests/minuto
- **Memory Usage**: < 50MB en desarrollo
- **Database Size**: Optimizado con limpieza automática

## 🐛 Debugging

### Logs de Desarrollo

```bash
# Habilitar logs detallados
DEBUG=true npm run dev

# Ver queries SQL
SHOW_SQL_QUERIES=true npm run dev
```

### Herramientas de Debug

- **Supabase Dashboard**: Para inspeccionar tablas y datos
- **Postman**: Para probar endpoints
- **VS Code**: Debugging integrado

## 🔧 Desarrollo

### Estructura del Proyecto

```
backend/
├── src/
│   ├── server.js          # Servidor principal
│   ├── config/
│   │   └── supabase.js    # Cliente Supabase
│   └── database/
│       └── scripts/
│           └── createAdmin.js
├── routes/
│   ├── auth.js            # Rutas de autenticación
│   ├── news.js            # Rutas de noticias
│   ├── sources.js         # Rutas de fuentes
│   └── users.js           # Rutas de usuarios
├── middleware/
│   ├── auth.js            # Middleware de autenticación
│   └── errorHandler.js    # Manejo de errores
├── database/
│   └── schema.sql         # Esquema de BD
└── package.json
```

### Agregar Nuevos Endpoints

1. **Crear ruta** en `routes/`
2. **Agregar validación** con express-validator
3. **Implementar middleware** de autenticación si es necesario
4. **Agregar tests** para el endpoint
5. **Documentar** en este README

## 📝 Licencia

MIT License - Ver `LICENSE` para detalles.

## 👥 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

- **Issues**: GitHub Issues
- **Documentación**: Este README
- **Email**: [tu-email@ejemplo.com]

---

⭐ ¡Si te gusta este proyecto, dale una estrella!
