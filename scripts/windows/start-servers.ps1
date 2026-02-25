# Script PowerShell para iniciar backend y frontend (Windows)
# Ejecutar desde la raíz del proyecto: .\scripts\windows\start-servers.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
Set-Location $projectRoot

Write-Host "🚀 Iniciando servidores de TimeLine..." -ForegroundColor Green
Write-Host ""

Write-Host "📁 Directorio del proyecto: $projectRoot" -ForegroundColor Cyan

if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: No se encuentra el directorio 'backend'" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "❌ Error: No se encuentra el directorio 'frontend'" -ForegroundColor Red
    exit 1
}

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js versión: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️ Advertencia: No se encuentra backend\.env" -ForegroundColor Yellow
    if (Test-Path "backend\env.example") {
        Copy-Item "backend\env.example" "backend\.env"
        Write-Host "   ✅ Archivo .env creado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ No se encontró env.example, continuando..." -ForegroundColor Yellow
    }
}

Write-Host "📦 Comprobando base de datos, migraciones y usuario admin..." -ForegroundColor Cyan
Push-Location backend
try {
    node database/scripts/add-bias-column.js 2>&1 | ForEach-Object { Write-Host "   $_" }
} catch {
    Write-Host "⚠️ No se pudo ejecutar migración bias" -ForegroundColor Yellow
}
try {
    node src/database/scripts/createAdmin.js 2>&1 | ForEach-Object { Write-Host "   $_" }
} catch {
    Write-Host "⚠️ No se pudo ejecutar createAdmin" -ForegroundColor Yellow
}
Pop-Location
Write-Host ""

Write-Host "🔄 Iniciando servidores..." -ForegroundColor Cyan
Write-Host ""

$psExe = $null
try { $psExe = (Get-Command pwsh -ErrorAction Stop).Source } catch { }
if (-not $psExe) {
    try { $psExe = (Get-Command powershell -ErrorAction Stop).Source } catch { }
}
if (-not $psExe) {
    Write-Host "❌ Error: No se encontró PowerShell (pwsh ni powershell)" -ForegroundColor Red
    exit 1
}
Write-Host "🪟 Abriendo terminales con: $psExe" -ForegroundColor Gray

Write-Host "📦 Iniciando BACKEND (puerto 3001)..." -ForegroundColor Yellow
Start-Process $psExe -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; Write-Host '🟢 BACKEND iniciando en puerto 3001...' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "🌐 Iniciando FRONTEND (puerto 5173)..." -ForegroundColor Yellow
Start-Process $psExe -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host '🟢 FRONTEND iniciando en puerto 5173...' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Servidores iniciados en ventanas separadas" -ForegroundColor Green
Write-Host "📍 URLs: Backend http://localhost:3001 | Frontend http://localhost:5173" -ForegroundColor Cyan
Write-Host "💡 Cierra las ventanas o Ctrl+C en cada una para detener" -ForegroundColor Yellow
Write-Host ""
