# Wrapper para Windows: redirige a scripts/windows/start-servers.ps1
# Ejecutar desde la raíz del proyecto: .\iniciar-servidores.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetScript = Join-Path $scriptDir "scripts\windows\start-servers.ps1"
if (-not (Test-Path $targetScript)) {
  Write-Host "Error: No se encuentra scripts\windows\start-servers.ps1" -ForegroundColor Red
  exit 1
}
& $targetScript
exit $LASTEXITCODE
