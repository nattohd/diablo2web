# ⚔️ Diablo II: Lord of Destruction — WebAssembly Port

Portabilidad de **Diablo II: Lord of Destruction** directamente al navegador web mediante **WebAssembly (WASM)**, **Emscripten** y un sistema de archivos virtual (**IndexedDB / IDBFS**).

Inspirado en la visión de proyectos como *DiabloWeb* (DevilutionX para Diablo 1), este cliente web desacopla el motor de los assets propietarios, permitiendo a los usuarios cargar su copia legal de Diablo II en el navegador con persistencia local permanente.

---

## 📁 Estructura del Proyecto

```
diablo2web/
├── original_game/                     # 📂 Coloca aquí tus archivos originales de Diablo II (.mpq, Game.exe)
│   └── README.md                      # Lista detallada de archivos requeridos y opcionales
├── verify_game.py                     # 🔍 Script para verificar tus archivos originales y hashes
├── plan_de_portabilidad_diablo_ii_webassembly.md # Plan técnico de ejecución
├── package.json                       # Configuración del proyecto y scripts npm
├── server.js                          # Servidor local con cabeceras COOP/COEP y Range Requests
├── public/                            # 🌐 Cliente Web (HTML5 / Vanilla CSS / JS)
│   ├── index.html                     # Interfaz de usuario con temática gótica de Diablo II
│   ├── css/
│   │   └── style.css                  # Estilos visuales oscuros, oro antiguo y brasas
│   ├── js/
│   │   ├── app.js                     # Controlador principal de la UI y drag-and-drop
│   │   ├── mpq-inspector.js           # Inspector y validador de cabeceras MPQ en el navegador
│   │   ├── vfs-storage.js             # Gestor de IndexedDB para MPQs y personajes (.d2s)
│   │   └── wasm-loader.js             # Cargador y puente con el módulo WebAssembly
│   └── assets/
│       └── d2_emblem.jpg              # Emblema gótico de Diablo II Web
├── src/                               # ⚙️ Motor C++ (Nativo y WebAssembly)
│   ├── CMakeLists.txt                 # Configuración de compilación para Emscripten y Nativo
│   ├── main.cpp                       # Bucle principal (SDL2 + emscripten_set_main_loop)
│   ├── core/                          # Ciclo de vida y lógica del motor
│   ├── vfs/                           # Virtual File System (IDBFS + montaje MPQ)
│   └── video/                         # Renderizador de frame buffer 800x600 y SDL2
└── scripts/
    ├── setup_emsdk.ps1                # Instalador automatizado de Emscripten SDK
    └── build_wasm.ps1                 # Script de compilación a WebAssembly
```

---

## 🚀 Inicio Rápido

### 1. Colocar tus archivos originales de Diablo II
Copia tus archivos `.mpq` (y opcionalmente `Game.exe`) en la carpeta:
```
c:\desarrollos\diablo2web\original_game\
```

### 2. Verificar la integridad de tus archivos
Ejecuta el verificador en consola:
```powershell
python verify_game.py
```
El script te confirmará si tienes los 7 archivos requeridos (`d2data.mpq`, `d2char.mpq`, `d2exp.mpq`, `d2sfx.mpq`, `d2music.mpq`, `d2speech.mpq`, `patch_d2.mpq`).

### 3. Iniciar el servidor web local
Inicia el servidor de desarrollo (con cabeceras `COOP` y `COEP` para WebAssembly):
```powershell
node server.js
```
O con npm:
```powershell
npm start
```

Abre en tu navegador:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 🎮 Características del Cliente Web

1. **Gestor de MPQ con Drag & Drop**:
   - Arrastra tu carpeta de Diablo II o archivos `.mpq` individuales directamente al navegador.
   - Valida la cabecera mágica `MPQ\x1a`, tamaño de sectores y tablas de bloques en tiempo real.
2. **Persistencia en IndexedDB**:
   - Los archivos se almacenan en el navegador mediante la `StorageManager API` (`navigator.storage.persist()`), evitando tener que subirlos en cada sesión.
3. **Gestión de Personajes (.d2s)**:
   - Exporta e importa personajes guardados directamente para compartirlos entre el navegador y tu Diablo II de escritorio.
4. **Lienzo Adaptativo 800 × 600**:
   - Resolución original de Lord of Destruction con soporte para **Pointer Lock** (captura de ratón) y **Pantalla Completa**.

---

## 🛠️ Compilación WebAssembly (WASM)

Para compilar el código fuente C++ a WebAssembly:

1. **Instalar Emscripten SDK** (si aún no lo tienes):
   ```powershell
   powershell scripts/setup_emsdk.ps1
   ```
2. **Compilar el proyecto**:
   ```powershell
   powershell scripts/build_wasm.ps1
   ```
   Esto generará `d2engine.js` y `d2engine.wasm` directamente en la carpeta `public/`.
# diablo2web
