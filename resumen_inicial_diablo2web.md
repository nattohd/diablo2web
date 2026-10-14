# ⚔️ Diablo II WebAssembly — Infraestructura Inicial & Cliente Web

Se ha preparado toda la base del proyecto según lo estipulado en el [Plan de Portabilidad Web](file:///c:/desarrollos/diablo2web/plan_de_portabilidad_diablo_ii_webassembly.md). A continuación se resumen los componentes creados, la ubicación de los archivos originales y los siguientes pasos.

---

## 📂 1. Directorio para tus archivos de Diablo II Original

Se ha creado la carpeta dedicada:
👉 **[original_game](file:///c:/desarrollos/diablo2web/original_game/)**

Copia en esta carpeta los archivos de tu instalación de **Diablo II: Lord of Destruction** (versión recomendada **1.14d** o **1.14b**).

### Archivos Principales Requeridos:
| Archivo | Función | Tamaño Aprox. |
|---|---|---|
| `d2data.mpq` | Datos base del juego, tablas de balance y mapas | ~255 MB |
| `d2char.mpq` | Sprites, animaciones y modelos 2.5D | ~251 MB |
| `d2exp.mpq` | Expansión Lord of Destruction (Acto V, runas, clases) | ~238 MB |
| `d2sfx.mpq` | Efectos sonoros de combate y ambiente | ~46 MB |
| `d2music.mpq` | Música atmosférica (Actos I al IV) | ~332 MB |
| `d2speech.mpq` | Diálogos y voces de PNJs | ~155 MB |
| `patch_d2.mpq` | Parche acumulativo de balance | ~3.9 MB |

> [!TIP]
> **Verificación automática:** Puedes verificar en cualquier momento el estado de tus archivos ejecutando:
> ```powershell
> python verify_game.py
> ```
> El verificador calculará los hashes SHA-256 de cada archivo y confirmará si coinciden con los binarios oficiales de Blizzard.

---

## 🌐 2. Cliente Web Interactivo (Listo para Pruebas)

El servidor de desarrollo ya está ejecutándose en segundo plano en:
👉 **[http://localhost:8080](http://localhost:8080)**

### Captura del Cliente en Ejecución:
![Cliente Diablo II Web](/Users/tubep/.gemini/antigravity-ide/brain/756e2fa0-f19a-41b7-8955-5c406e0f77c1/diablo2_main_page_1792005035249.png)

![Gestor de MPQ y Almacenamiento](/Users/tubep/.gemini/antigravity-ide/brain/756e2fa0-f19a-41b7-8955-5c406e0f77c1/diablo2_mpq_tab_1792005062842.png)

### Características Implementadas en el Frontend:
1. **Estética Gótica Oscura:** Inspirada en la interfaz clásica de Lord of Destruction (oro antiguo, tonos obsidiana y resplandor de fuego).
2. **Carga Drag & Drop & Validación:**
   - Soporta arrastrar la carpeta completa de Diablo II o archivos `.mpq` individuales.
   - [mpq-inspector.js](file:///c:/desarrollos/diablo2web/public/js/mpq-inspector.js) valida la cabecera mágica `MPQ\x1a`, tamaño de sector y tablas en el navegador sin bloquear el hilo principal.
3. **Persistencia en IndexedDB:**
   - Almacena los MPQs mediante la `StorageManager API` (`navigator.storage.persist()`), para no tener que cargarlos en cada sesión.
4. **Gestión de Personajes (`.d2s`):**
   - Importación y exportación de partidas para compartirlas con el juego de PC.
5. **Lienzo Adaptativo (800 × 600):**
   - Control de ratio 4:3, modo Pantalla Completa y **Pointer Lock API** (captura de ratón).

---

## ⚙️ 3. Código Fuente del Motor (C++ / WASM)

Se ha creado la estructura del motor en [src/](file:///c:/desarrollos/diablo2web/src/):

- [src/CMakeLists.txt](file:///c:/desarrollos/diablo2web/src/CMakeLists.txt): Configuración tanto para Emscripten (`emcmake`) como compilación nativa en PC con SDL2.
- [src/main.cpp](file:///c:/desarrollos/diablo2web/src/main.cpp): Punto de entrada y loop con `emscripten_set_main_loop_arg` a 60 FPS.
- [src/core/engine.cpp](file:///c:/desarrollos/diablo2web/src/core/engine.cpp): Ciclo de vida y eventos SDL2.
- [src/video/renderer.cpp](file:///c:/desarrollos/diablo2web/src/video/renderer.cpp): Frame buffer por software a 800x600 y texturizado.
- [src/vfs/vfs.cpp](file:///c:/desarrollos/diablo2web/src/vfs/vfs.cpp): Virtual File System con punto de montaje `/saves` sincronizado vía `IDBFS`.

---

## 🧭 Próximos Pasos

1. Copia tus archivos `.mpq` en la carpeta `original_game/` (o arrástralos directamente a la interfaz en `http://localhost:8080`).
2. Corre `python verify_game.py` para asegurar que las versiones sean óptimas.
3. Avanzaremos con la integración del parser de MPQ y extracción de tablas de datos (`data/global/excel/`) para renderizar el menú principal y selección de héroes.
