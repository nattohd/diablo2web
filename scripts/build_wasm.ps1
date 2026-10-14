# Diablo2Web - Script de Compilación a WebAssembly con Emscripten
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      Compilación de Diablo II WebAssembly (WASM)         " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Comprobar si emcc está disponible
$emccCmd = Get-Command emcc -ErrorAction SilentlyContinue
if (-not $emccCmd) {
    # Intentar buscar en ./emsdk si existe
    $emsdkEnv = Join-Path $PSScriptRoot "..\emsdk\emsdk_env.ps1"
    if (Test-Path $emsdkEnv) {
        Write-Host "Cargando entorno de Emscripten desde .\emsdk\emsdk_env.ps1..." -ForegroundColor Yellow
        & $emsdkEnv
    } else {
        Write-Host "Error: 'emcc' no está en el PATH ni se encontró la carpeta 'emsdk'." -ForegroundColor Red
        Write-Host "Ejecuta primero: powershell scripts/setup_emsdk.ps1" -ForegroundColor Yellow
        exit 1
    }
}

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SrcDir = Join-Path $RootDir "src"
$BuildDir = Join-Path $RootDir "build_wasm"
$PublicDir = Join-Path $RootDir "public"

Write-Host "[1/3] Limpiando y preparando directorio de compilación: $BuildDir" -ForegroundColor Green
if (-not (Test-Path $BuildDir)) {
    New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
}

Push-Location $BuildDir

Write-Host "[2/3] Generando proyecto CMake con emcmake..." -ForegroundColor Green
emcmake cmake $SrcDir -DCMAKE_BUILD_TYPE=Release

Write-Host "[3/3] Compilando WebAssembly (.wasm) y pegamento JavaScript (.js)..." -ForegroundColor Green
cmake --build . --config Release

Pop-Location

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ¡Compilación WebAssembly Completada!                    " -ForegroundColor Green
Write-Host "  Archivos generados en public/d2engine.js y .wasm        " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
