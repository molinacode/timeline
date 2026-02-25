#!/usr/bin/env bash
# Iniciar backend y frontend (Linux)
# Ejecutar desde la raíz del proyecto: ./scripts/linux/start-servers.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "🚀 Iniciando servidores de TimeLine..."
echo ""
echo "📁 Directorio del proyecto: $PROJECT_ROOT"

if [ ! -d "backend" ]; then
  echo "❌ Error: No se encuentra el directorio 'backend'"
  exit 1
fi
if [ ! -d "frontend" ]; then
  echo "❌ Error: No se encuentra el directorio 'frontend'"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "❌ Error: Node.js no está instalado o no está en el PATH"
  exit 1
fi
echo "✅ Node.js versión: $(node --version)"

if [ ! -f "backend/.env" ]; then
  echo "⚠️ Advertencia: No se encuentra backend/.env"
  if [ -f "backend/env.example" ]; then
    cp backend/env.example backend/.env
    echo "   ✅ Archivo .env creado"
  else
    echo "   ⚠️ No se encontró env.example, continuando..."
  fi
fi

echo "📦 Comprobando base de datos, migraciones y usuario admin..."
(cd backend && node database/scripts/add-bias-column.js 2>/dev/null) || true
(cd backend && node src/database/scripts/createAdmin.js 2>/dev/null) || true
echo ""

echo "🔄 Iniciando servidores..."
BACKEND_PID=""
cleanup() {
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    echo ""; echo "🛑 Backend detenido (PID $BACKEND_PID)"
  fi
}
trap cleanup EXIT INT TERM

(cd backend && npm run dev) &
BACKEND_PID=$!
sleep 3
echo "📦 Backend en segundo plano (PID $BACKEND_PID)"
echo "🌐 Iniciando frontend en esta terminal (Ctrl+C para detener todo)..."
echo ""
echo "📍 URLs: Backend http://localhost:3001 | Frontend http://localhost:5173"
echo ""

(cd frontend && npm run dev)
