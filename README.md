# 📰 TimeLine - Agregador de Noticias RSS

Una aplicación web completa que agrega noticias RSS de diferentes fuentes españolas, organizadas por categoría política y región geográfica.

## 🎯 Características Principales

### 📱 Frontend (React + TypeScript)
- **Interfaz Dual**: Modo público y privado
- **Timeline de Noticias**: Visualización en tiempo real
- **Geolocalización**: Detección automática de región
- **Gestión de Fuentes**: Fuentes RSS personalizadas
- **Temas**: Modo claro/oscuro
- **Responsive**: Optimizado para todos los dispositivos

### 🚀 Backend (Node.js + Express)
- **API REST Completa**: Endpoints para todas las funcionalidades
- **Autenticación JWT**: Sistema seguro de login/registro
- **Base de Datos SQLite**: Base de datos local para desarrollo
- **Gestión de Noticias**: CRUD completo para noticias RSS
- **Rate Limiting**: Protección contra abuso
- **Logging**: Sistema completo de logs y monitoreo

### 🗄️ Base de Datos
- **Esquema SQL Completo**: Con índices y triggers
- **Migraciones Automáticas**: Scripts de setup
- **Datos de Prueba**: Seed con fuentes españolas
- **Integridad Referencial**: Relaciones bien definidas

## 🏗️ Arquitectura del Proyecto

```
timeline-project/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── services/        # Servicios RSS
│   │   ├── types/           # Tipos TypeScript
│   │   └── App.tsx          # Componente principal
│   ├── package.json
│   └── README.md
├── backend/                  # API REST
│   ├── src/
│   │   ├── server.js        # Servidor principal
│   │   ├── config/          # Configuración
│   │   └── database/        # Scripts de BD
│   ├── routes/              # Rutas de la API
│   ├── middleware/          # Middleware
│   ├── package.json
│   └── README.md
├── database/                 # Scripts SQL
│   └── schema.sql           # Esquema completo
└── README.md                # Este archivo
```

## 🚀 Instalación y Configuración

### 📋 Requisitos Previos

- **Node.js** 18+ 
- **npm** o **yarn**
- **Git**

### 🔧 Instalación Completa

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd timeline-project

# 2. Instalar dependencias del frontend
cd frontend
npm install

# 3. Instalar dependencias del backend
cd ../backend
npm install

# 4. Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones

# 5. Inicializar base de datos
npm run migrate
npm run seed

# 6. Iniciar servidor backend
npm run dev

# 7. En otra terminal, iniciar frontend
cd ../frontend
npm run dev
```

### 🌐 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs
- **Health Check**: http://localhost:3001/health

## 🔄 Configuración Híbrida: Local + Supabase

Este proyecto está diseñado para funcionar de **dos maneras**:

### 🏠 Modo Local (Para Entrega)
- **Base de Datos**: SQLite local
- **API**: Node.js + Express
- **Autenticación**: JWT local
- **Ventajas**: Fácil de ejecutar, sin dependencias externas

### ☁️ Modo Supabase (Para Desarrollo)
- **Base de Datos**: Supabase PostgreSQL
- **API**: Supabase REST API
- **Autenticación**: Supabase Auth
- **Ventajas**: Escalable, funciones serverless, dashboard

### 🔀 Cambiar Entre Modos

#### Para Usar Modo Local:
```bash
# En frontend/src/supabase_client.ts
# Comentar las líneas de Supabase y usar modo demo
```

#### Para Usar Modo Supabase:
```bash
# Configurar variables de entorno
VITE_SUPABASE_URL=tu-url-supabase
VITE_SUPABASE_ANON_KEY=tu-clave-supabase
```

## 📊 Base de Datos

### 🗄️ Esquema SQLite

El archivo `database/schema.sql` contiene:

- **8 tablas principales** con relaciones
- **Índices optimizados** para consultas
- **Triggers** para timestamps automáticos
- **Vistas** para consultas complejas
- **Datos iniciales** con 40+ fuentes RSS

### 📈 Scripts de Base de Datos

```bash
# Migración inicial
npm run migrate

# Poblar con datos de prueba
npm run seed

# Resetear completamente
npm run reset

# Ver estadísticas
npm run stats
```

## 🔐 Autenticación

### 🏠 Modo Local (JWT)
```javascript
// Login
POST /api/auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}

// Respuesta
{
  "token": "jwt-token",
  "refreshToken": "refresh-token",
  "user": { ... }
}
```

### ☁️ Modo Supabase
```javascript
// Usar cliente de Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@ejemplo.com',
  password: 'password123'
})
```

## 📰 Fuentes RSS Incluidas

### 🏛️ Conservadoras
- ABC, La Razón, OK Diario, El Debate, Voz Populi, Libertad Digital, El Independiente, Cadena COPE

### ⚖️ Centristas  
- El Mundo, 20 Minutos, El Confidencial, El Español, Nius Diario, Estrella Digital, Diario Crítico, El Liberal

### 🌅 Progresistas
- El País, El Diario, Infolibre, Cadena SER, RTVE, Público, Nueva Tribuna, CTXT

### 🗺️ Regionales
- **Andalucía**: Diario de Sevilla, Diario de Cádiz, Ideal
- **Madrid**: Madridiario, Telemadrid  
- **Cataluña**: La Vanguardia, El Periódico
- **País Vasco**: El Correo, Deia
- **Valencia**: Levante, Las Provincias

## 🛠️ Scripts Disponibles

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linter ESLint
```

### Backend
```bash
npm start            # Servidor de producción
npm run dev          # Servidor de desarrollo
npm run migrate      # Migración de BD
npm run seed         # Datos de prueba
npm run reset        # Resetear BD
npm run stats        # Estadísticas
```

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run test         # Tests unitarios
npm run test:e2e     # Tests end-to-end
```

### Backend
```bash
cd backend
npm test             # Tests de API
npm run test:integration # Tests de integración
```

## 📦 Deploy

### 🚀 Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Subir carpeta dist/ a Vercel/Netlify
```

### 🖥️ Backend (Railway/Heroku)
```bash
cd backend
# Configurar variables de entorno
# Deploy con Railway/Heroku
```

## 🔧 Desarrollo

### 🏗️ Agregar Nueva Funcionalidad

1. **Backend**: Crear endpoint en `routes/`
2. **Frontend**: Crear componente en `components/`
3. **Base de Datos**: Actualizar esquema si es necesario
4. **Tests**: Agregar tests para la funcionalidad
5. **Documentación**: Actualizar README

### 🐛 Debugging

```bash
# Frontend con debug
cd frontend
DEBUG=true npm run dev

# Backend con logs detallados
cd backend
DEBUG=true npm run dev
```

## 📚 Documentación Adicional

- **Frontend**: [frontend/README.md](frontend/README.md)
- **Backend**: [backend/README.md](backend/README.md)
- **API Docs**: http://localhost:3001/docs (cuando el backend esté corriendo)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **Desarrollador Principal**: [Tu Nombre]
- **Proyecto**: TimeLine RSS Aggregator

## 📞 Contacto

- **Email**: [tu-email@ejemplo.com]
- **GitHub**: [tu-usuario-github]
- **Proyecto**: [URL del repositorio]

## 🎉 Agradecimientos

- **React Team** por el framework
- **Supabase** por la plataforma backend
- **Tailwind CSS** por el sistema de estilos
- **Comunidad Open Source** por las librerías utilizadas

---

⭐ **¡Si te gusta este proyecto, dale una estrella!**

🚀 **¡Happy Coding!**
