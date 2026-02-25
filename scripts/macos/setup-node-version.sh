#!/usr/bin/env bash
# Configurar Node.js 20.18.0 con nvm (macOS)
# Ejecutar: ./scripts/macos/setup-node-version.sh
# Requiere: nvm (brew install nvm o https://github.com/nvm-sh/nvm)

set -e
echo ""
echo "Configurando Node.js 20.18.0 para TimeLine Project"
echo "===================================================="
echo ""

# Cargar nvm (rutas típicas en macOS: Homebrew o instalación manual)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
  . "/usr/local/opt/nvm/nvm.sh"
elif [ -s "$(brew --prefix nvm 2>/dev/null)/nvm.sh" ]; then
  . "$(brew --prefix nvm)/nvm.sh"
else
  echo "❌ Error: nvm no encontrado."
  echo "   Instálalo con Homebrew: brew install nvm"
  echo "   O con el script: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
  echo "   Luego reinicia la terminal y ejecuta este script de nuevo."
  exit 1
fi
echo "✅ nvm cargado"

if ! nvm list 2>/dev/null | grep -q '20\.18\.0'; then
  echo "📥 Node.js 20.18.0 no está instalado. Instalando..."
  nvm install 20.18.0
  echo "✅ Node.js 20.18.0 instalado"
else
  echo "✅ Node.js 20.18.0 ya está instalado"
fi

echo ""
echo "Cambiando a Node.js 20.18.0..."
nvm use 20.18.0
echo ""

NODE_VER="$(node --version)"
if [ "$NODE_VER" != "v20.18.0" ]; then
  echo "❌ Error: La versión de Node.js no es 20.18.0 (actual: $NODE_VER)"
  exit 1
fi
echo "✅ Node.js $NODE_VER activo"
echo "✅ npm $(npm --version)"
echo ""
echo "Próximos pasos:"
echo "  cd backend && npm install && npm run dev"
echo ""
echo "✅ Configuración completada!"
echo ""
