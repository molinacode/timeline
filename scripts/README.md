# Scripts de TimeLine

Scripts organizados por sistema operativo para configurar Node.js e iniciar los servidores (backend y frontend).

## Estructura

```
scripts/
├── README.md           (este archivo)
├── windows/
│   ├── start-servers.ps1      Iniciar backend + frontend
│   └── setup-node-version.ps1 Configurar Node.js 20.18.0 con nvm-windows
├── linux/
│   ├── start-servers.sh       Iniciar backend + frontend
│   └── setup-node-version.sh  Configurar Node.js 20.18.0 con nvm
└── macos/
    ├── start-servers.sh       Iniciar backend + frontend
    └── setup-node-version.sh  Configurar Node.js 20.18.0 con nvm
```

## Uso

**Ejecutar siempre desde la raíz del proyecto** (donde están las carpetas `backend` y `frontend`).

En la raíz del proyecto hay wrappers para Windows: `iniciar-servidores.ps1` y `setup-node-version.ps1` llaman a los scripts de `scripts/windows/`.

### Windows (PowerShell)

```powershell
# Configurar Node.js 20.18.0 (solo la primera vez o si cambias de versión)
.\scripts\windows\setup-node-version.ps1

# Iniciar backend y frontend (abre dos ventanas)
.\scripts\windows\start-servers.ps1
```

### Linux (bash)

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x scripts/linux/*.sh

# Configurar Node.js 20.18.0 (solo la primera vez)
./scripts/linux/setup-node-version.sh

# Iniciar backend y frontend (backend en segundo plano, frontend en esta terminal)
./scripts/linux/start-servers.sh
```

### macOS (bash)

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x scripts/macos/*.sh

# Configurar Node.js 20.18.0 (solo la primera vez)
./scripts/macos/setup-node-version.sh

# Iniciar backend y frontend (backend en segundo plano, frontend en esta terminal)
./scripts/macos/start-servers.sh
```

## Requisitos por plataforma

| Plataforma | start-servers | setup-node-version |
|------------|----------------|--------------------|
| **Windows** | PowerShell (pwsh o powershell.exe), Node.js en PATH | nvm-windows ([releases](https://github.com/coreybutler/nvm-windows/releases)) |
| **Linux**  | bash, Node.js en PATH | nvm ([install](https://github.com/nvm-sh/nvm#installing-and-updating)) |
| **macOS**  | bash, Node.js en PATH | nvm (Homebrew: `brew install nvm` o [install script](https://github.com/nvm-sh/nvm#installing-and-updating)) |

## Paquete de producción

Para generar un paquete listo para desplegar (sin scripts de desarrollo):

```bash
node scripts/build-production.mjs
```

Crea la carpeta `timeline-production/` con los archivos necesarios para instalación y ejecución. Esta opción está documentada en el **manual de instalación de desarrollo** (`docs/INSTALLATION_MANUAL.md`, sección 2.1). El paquete de producción incluye su propio manual sin la sección de build-production.

## Comportamiento

- **start-servers**: Comprueba que existan `backend` y `frontend`, que Node.js esté disponible, crea `.env` desde `env.example` si falta, ejecuta `createAdmin.js` (base de datos y usuario admin) y luego inicia backend y frontend.
  - En **Windows** se abren dos ventanas de PowerShell (una por servidor).
  - En **Linux/macOS** el backend se lanza en segundo plano y el frontend en la terminal actual; al pulsar Ctrl+C se detienen ambos.
- **setup-node-version**: Instala y activa Node.js 20.18.0 usando nvm (o nvm-windows en Windows). Recomendado antes de la primera ejecución del proyecto.
