#!/usr/bin/env python3
"""
Diablo II WebAssembly - Verificador de Archivos Originales del Juego
Comprueba la presencia, tamaño y hash de los archivos en ./original_game/
"""

import os
import sys
import hashlib
from pathlib import Path

# Configurar salida UTF-8 para consola de Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Directorio de búsqueda
GAME_DIR = Path(__file__).resolve().parent / "original_game"

# Archivos esperados y sus hashes de referencia (1.14d / 1.14b)
KNOWN_FILES = {
    # Archivos críticos
    "d2data.mpq": {
        "required": True,
        "desc": "Datos base del juego",
        "expected_hashes": [
            "99e53768ddb87ca70b54529ff15043aaa71353cc250e757ae20e9c3d002ca431",
            "c3bfd687ca0263f350c33fb3a4d0ec50b863777d1a5509772bf22bc5b4a926ba"
        ],
        "approx_size": 267642202
    },
    "d2char.mpq": {
        "required": True,
        "desc": "Sprites de personajes y animaciones",
        "expected_hashes": [
            "8b6a08d39f7262912f1e96e21417bc352c684ba4f6f3f4537e290da7f3b5a37d"
        ],
        "approx_size": 263369609
    },
    "d2exp.mpq": {
        "required": True,
        "desc": "Lord of Destruction (Expansión)",
        "expected_hashes": [
            "04e35bffeae8d9959042832055702f8b5b4567ca5505ff1df0cf3fd6d5beb6c2"
        ],
        "approx_size": 250156780
    },
    "d2sfx.mpq": {
        "required": True,
        "desc": "Efectos de sonido",
        "expected_hashes": [
            "737d128b3e81526c630503a435b56c70bbdaee2e76d39df4efb025e721432aba"
        ],
        "approx_size": 48927126
    },
    "d2music.mpq": {
        "required": True,
        "desc": "Música del juego base",
        "expected_hashes": [
            "5c367f95694cd45a60dc0c02ed9d7c349c05b0f701be787c172087544ddd2e65"
        ],
        "approx_size": 348433635
    },
    "d2speech.mpq": {
        "required": True,
        "desc": "Voces y diálogos",
        "expected_hashes": [
            "7a238f808be9fbc74da55c98dc629ab7fac9a4f40c537cec3c1b042fa45d211a"
        ],
        "approx_size": 163021838
    },
    "patch_d2.mpq": {
        "required": True,
        "desc": "Parche del juego (1.14d)",
        "expected_hashes": [
            "81470b762c497a8fcaf9a09990c0e869a4175395ef1fae13bd85cfec7b688ddc", # 1.14b/d LoD
            "67572c2d9a6ea5844fb66f48a1dd017505615600087fe9192b60b23fb9f7e8f1"  # classic
        ],
        "approx_size": 3915305
    },
    # Archivos adicionales
    "d2video.mpq": {
        "required": False,
        "desc": "Cinemáticas de Diablo II",
        "expected_hashes": [
            "7bf1bbcd6e73a415775444ff78e1bfcce83ca1af75c52b1f33998526e6e186b6"
        ],
        "approx_size": 441697807
    },
    "d2xvideo.mpq": {
        "required": False,
        "desc": "Cinemáticas de Expansión",
        "expected_hashes": [
            "209c7a250e2117bac2720e40f0c3687549678cf5e993e5f74a6dbb2914c97591"
        ],
        "approx_size": 110685575
    },
    "d2xmusic.mpq": {
        "required": False,
        "desc": "Música adicional de Expansión",
        "expected_hashes": [
            "4aae5a0c456236693226380d062daa3f5cd36a90a9010d036a7da0ba132f71a1"
        ],
        "approx_size": 54691647
    },
    "d2xtalk.mpq": {
        "required": False,
        "desc": "Voces de Expansión",
        "expected_hashes": [
            "305a35331629e7054c34682774e18398f5cbcbed293ddf0ce3c16e25c3f0463c"
        ],
        "approx_size": 60278192
    },
    "Game.exe": {
        "required": False,
        "desc": "Ejecutable original (1.14d)",
        "expected_hashes": [
            "631066c1649c4ea9ffe48bf97e24c00bca1f7a6759c21150f1a79982589adaaf"
        ],
        "approx_size": 3618792
    }
}


def compute_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()


def format_size(bytes_val: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_val < 1024.0:
            return f"{bytes_val:3.1f} {unit}"
        bytes_val /= 1024.0
    return f"{bytes_val:.1f} TB"


def main():
    print("=" * 65)
    print("  ⚔️  DIABLO II: LORD OF DESTRUCTION - VERIFICADOR DE ARCHIVOS ⚔️")
    print("=" * 65)
    print(f"Carpeta examinada: {GAME_DIR}\n")

    if not GAME_DIR.exists():
        print(f"[!] Error: El directorio {GAME_DIR} no existe.")
        sys.exit(1)

    # Buscar archivos de manera insensible a mayúsculas
    existing_files = {p.name.lower(): p for p in GAME_DIR.iterdir() if p.is_file()}

    required_missing = 0
    total_bytes = 0

    print(f"{'Archivo':<18} | {'Estado':<10} | {'Tamaño':<10} | {'Coincidencia'}")
    print("-" * 65)

    for filename, info in KNOWN_FILES.items():
        fname_lower = filename.lower()
        if fname_lower in existing_files:
            file_path = existing_files[fname_lower]
            size = file_path.stat().st_size
            total_bytes += size

            # Calcular hash
            file_hash = compute_sha256(file_path)
            hash_match = file_hash in [h.lower() for h in info["expected_hashes"]]
            status_match = "Hash 1.14 Exacto" if hash_match else "OK (Custom/Mod)"

            status_str = "✔ PRESENTE"
            print(f"{filename:<18} | {status_str:<10} | {format_size(size):<10} | {status_match}")
        else:
            if info["required"]:
                required_missing += 1
                status_str = "✘ FALTA (Requerido)"
            else:
                status_str = "○ Opcional"
            print(f"{filename:<18} | {status_str:<10} | {'-':<10} | -")

    print("-" * 65)
    print(f"Total datos encontrados: {format_size(total_bytes)}")
    print("=" * 65)

    if required_missing > 0:
        print(f"\n⚠️  Faltan {required_missing} archivo(s) requeridos en '{GAME_DIR.name}/'.")
        print("Copia tus archivos originales (.mpq) a esa carpeta para continuar.\n")
    else:
        print("\n✨ ¡Excelente! Todos los archivos esenciales de Diablo II están listos.")
        print("Puedes usarlos para la compilación nativa o cargarlos en el cliente Web.\n")


if __name__ == "__main__":
    main()
