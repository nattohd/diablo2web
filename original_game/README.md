# Directorio de Archivos Originales de Diablo II

Coloca en esta carpeta la instalación completa o los archivos `.mpq` y ejecutables de tu copia legal de **Diablo II: Lord of Destruction** (recomendado versión **1.14d** o **1.14b**).

---

## 📁 Archivos requeridos

Para que el port funcione completamente, se necesitan los siguientes archivos principales:

### Archivos de Datos (MPQ)
| Archivo | Descripción | Tamaño aproximado |
|---|---|---|
| `d2data.mpq` | Datos base del juego (tablas, presets, mapas) | ~255 MB |
| `d2char.mpq` | Sprites de personajes, monstruos y animaciones | ~251 MB |
| `d2exp.mpq` | Expansión Lord of Destruction (Acto V, runas, clases) | ~238 MB |
| `d2sfx.mpq` | Efectos de sonido (golpes, habilidades, entorno) | ~46 MB |
| `d2music.mpq` | Música atmosférica de los Actos I al IV | ~332 MB |
| `d2speech.mpq` | Diálogos y voces de los PNJs | ~155 MB |
| `patch_d2.mpq` | Parche acumulativo de datos y balance | ~3.7 MB - 7.7 MB |

### Archivos Opcionales / Multimedia adicional
| Archivo | Descripción |
|---|---|
| `d2video.mpq` | Cinemáticas del juego base |
| `d2xvideo.mpq` | Cinemáticas de Lord of Destruction |
| `d2xmusic.mpq` | Música adicional de Lord of Destruction (Acto V) |
| `d2xtalk.mpq` | Voces adicionales de Lord of Destruction |

### Ejecutables
| Archivo | Descripción |
|---|---|
| `Game.exe` | Binario principal del juego (preferido 1.14d: `631066c1649c4ea9ffe48bf97e24c00bca1f7a6759c21150f1a79982589adaaf`) |
| `Diablo II.exe` | Lanzador del juego |

---

## 🔍 Verificación Rápida
Una vez que hayas copiado los archivos aquí, puedes verificar su integridad ejecutando desde la raíz del proyecto:

```powershell
python verify_game.py
```
El script te indicará si todos los archivos necesarios están presentes y coinciden con las versiones de referencia.
