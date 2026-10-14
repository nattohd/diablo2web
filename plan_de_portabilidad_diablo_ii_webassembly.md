# Plan de Portabilidad Web: Diablo II vía Recompilación & WebAssembly

## 1. Visión del Proyecto
Replicar la experiencia lograda por proyectos como **DiabloWeb** (basado en DevilutionX para Diablo 1), permitiendo ejecutar **Diablo II + Lord of Destruction** directamente en navegadores web modernos mediante **WebAssembly (WASM)** y **Emscripten**. 

El cliente web no contendrá assets protegidos por derechos de autor. En su lugar, el usuario cargará sus archivos originales legalmente adquiridos (`.MPQ`), los cuales se persistirán localmente en el almacenamiento del navegador (**IndexedDB**).

---

## 2. Comparativa Técnica: Diablo 1 vs Diablo 2

| Característica | Diablo 1 (DevilutionX / DiabloWeb) | Diablo 2 (Recompilación) |
|---|---|---|
| **Arquitectura binaria** | Monolítico (`diablo.exe`) | Modular (`Game.exe` + Múltiples DLLs: `D2Client`, `D2Game`, `D2Common`, etc.) |
| **Tamaño de assets** | ~500 MB (`DIABDAT.MPQ`) | ~1.9 GB - 2.5 GB (múltiples MPQs) |
| **Renderizado original** | DirectDraw 256 colores | DirectDraw / Direct3D / Glide (800x600, sprites 2.5D, efectos de luz) |
| **Reto principal en web** | Portabilidad inicial de C++ a WASM | Gestión estricta de memoria de 32 bits y carga diferida de MPQs |

---

## 3. Reto de Memoria: Manejo de los 1.9 GB

WebAssembly estándar utiliza direccionamiento de **32 bits**, limitando el espacio de memoria contiguo a un máximo teórico de 4 GB (en la práctica, 2 GB a 3 GB utilizables por pestaña de navegador). 

### Estrategia de Carga y Almacenamiento:
1. **Evitar precarga total en RAM (`MEMFS`):** Cargar los ~1.9 GB completos en el heap de WASM causará un error *Out of Memory* (OOM).
2. **Almacenamiento en IndexedDB:**
   * Utilizar la **StorageManager API** de HTML5 (`navigator.storage.persist()`) para garantizar cuota permanente de disco.
   * Almacenar los blobs de los archivos `.mpq` en IndexedDB.
3. **Acceso por demanda / Streaming de bloques:**
   * Modificar el cargador de StormLib en C++ para que lea rangos de bytes (*byte-range requests* o slices del IndexedDB virtual) en lugar de mapear el archivo completo en memoria virtual contigua.

---

## 4. Fases de Ejecución

### Fase 1: Estabilización y Compilación Nativa (PC Local)
* **Objetivo:** Garantizar que el código fuente de la recompilación compile y corra en un entorno de desarrollo local sin depender de binarios propietarios cerrados.
* **Hitos:**
  - [ ] Clonar y auditar dependencias del repositorio.
  - [ ] Configurar toolchain local (Clang / GCC / MSVC).
  - [ ] Validar desacoplamiento de APIs de Windows (`windows.h`, DirectDraw, Win32 threads).
  - [ ] Verificar backend multiplataforma mediante **SDL2** para ventana, audio y control de entrada.
  - [ ] Confirmar lectura correcta de los archivos `.MPQ` locales.

### Fase 2: Configuración del Toolchain Emscripten
* **Objetivo:** Producir un binario `.wasm` y el archivo de pegamento JavaScript `.js`.
* **Configuración del compilador (`emcmake` / `emcc`):**
  - **Soporte multimedia:** `-s USE_SDL=2` (mapea automáticamente eventos, Canvas/WebGL y Web Audio).
  - **Gestión de heap:** `-s ALLOW_MEMORY_GROWTH=1` e inicialización con `-s INITIAL_MEMORY=512MB`.
  - **Bucle principal:** Adaptar el loop infinito del motor mediante `emscripten_set_main_loop` o compilar con `-s ASYNCIFY` para no bloquear el hilo de interfaz de usuario de JavaScript.
  - **Multihilo (opcional):** Evaluar soporte de pthreads vía Web Workers (`-s USE_PTHREADS=1`), requiriendo cabeceras HTTP `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Embedder-Policy: require-corp`.

### Fase 3: Frontend y Virtual File System (VFS)
* **Objetivo:** Proveer la interfaz para que el usuario suministre sus datos y el motor acceda a ellos.
* **Componentes:**
  - **Modal de Importación:** Drag & drop donde el usuario arrastra la carpeta o los archivos:
    - `d2data.mpq` (Datos base)
    - `d2exp.mpq` (Lord of Destruction)
    - `d2char.mpq` (Sprites y animaciones)
    - `d2sfx.mpq` y `d2music.mpq` (Efectos y música)
    - `d2speech.mpq` (Voces)
  - **Integración con Emscripten FS:**
    - Montaje con `FS.mount(IDBFS, {}, '/d2_save')` para archivos de guardado.
    - Sincronización bidireccional (`FS.syncfs`) para guardar automáticamente las partidas (`.d2s`).

### Fase 4: Pruebas, Rendimiento y UX
* **Objetivo:** Experiencia fluida de juego a 25/60 FPS en el navegador.
* **Hitos:**
  - [ ] Exportación / importación manual de archivos de guardado (`.d2s`) desde la interfaz web.
  - [ ] Soporte para pantalla completa y escalado de aspect ratio (4:3 a Canvas adaptativo).
  - [ ] Captura de puntero de ratón (`Pointer Lock API`) para evitar que el cursor salga de la ventana en combate intenso.

---

## 5. Próximos Pasos Inmediatos
1. Clonar el repositorio y verificar la estructura del árbol de código.
2. Identificar el sistema de construcción utilizado (`CMakeLists.txt` o `Makefile`).
3. Realizar una compilación nativa limpia en la máquina de desarrollo con los assets originales presentes.