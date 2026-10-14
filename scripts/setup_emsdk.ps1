# Diablo2Web - Instalador y configurador de Emscripten SDK (emsdk)
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Instalación de Emscripten SDK (WASM) para Diablo2Web   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$EmsdkDir = Join-Path $PSScriptRoot "..\emsdk"

if (-not (Test-Path $EmsdkDir)) {
    Write-Host "[1/3] Clonando repositorio oficial de emsdk..." -ForegroundColor Green
    git clone https://github.com/emscripten-core/emsdk.git $EmsdkDir
} else {
    Write-Host "[1/3] Carpeta emsdk ya existe. Actualizando..." -ForegroundColor Yellow
    Push-Location $EmsdkDir
    git pull
    Pop-Location
}

Push-Location $EmsdkDir

Write-Host "[2/3] Descargando e instalando última versión de emsdk..." -ForegroundColor Green
.\emsdk.bat install latest

Write-Host "[3/3] Activando versión latest..." -ForegroundColor Green
.\emsdk.bat activate latest

Pop-Location

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ¡Emscripten SDK instalado con éxito!                    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Para habilitar emcc en tu terminal actual ejecuta:" -ForegroundColor Yellow
Write-Host "  .\emsdk\emsdk_env.ps1" -ForegroundColor Cyan
Write-Host ""
