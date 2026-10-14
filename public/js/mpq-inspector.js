/**
 * MPQ Header Inspector (JavaScript)
 * Lee los primeros bytes de un archivo para validar si es un contenedor MPQ legítimo de Blizzard
 * y extrae metadatos (tamaño de archivo, número de entradas en la tabla de hash/bloques).
 */

class MpqInspector {
  /**
   * Magic bytes esperados: 'MPQ\x1a' (0x1A51504D en little-endian)
   */
  static MPQ_MAGIC = 0x1A51504D;
  static MPQ_USER_DATA_MAGIC = 0x1B51504D; // 'MPQ\x1b'

  /**
   * Lee la cabecera de un Blob/File en el navegador
   * @param {File|Blob} file 
   * @returns {Promise<{isValid: boolean, error?: string, header?: object}>}
   */
  static async inspect(file) {
    if (!file || file.size < 32) {
      return { isValid: false, error: 'El archivo es demasiado pequeño para ser un archivo MPQ.' };
    }

    try {
      // Leemos los primeros 512 bytes para buscar la cabecera MPQ
      // (En algunos archivos la cabecera puede estar desplazada en múltiplos de 512)
      const sliceSize = Math.min(file.size, 1024);
      const buffer = await file.slice(0, sliceSize).arrayBuffer();
      const view = new DataView(buffer);

      let headerOffset = -1;
      let isUserData = false;

      // Buscar firma en múltiplos de 512 bytes
      for (let offset = 0; offset <= sliceSize - 32; offset += 512) {
        const magic = view.getUint32(offset, true);
        if (magic === this.MPQ_MAGIC) {
          headerOffset = offset;
          break;
        } else if (magic === this.MPQ_USER_DATA_MAGIC) {
          headerOffset = offset;
          isUserData = true;
          break;
        }
      }

      if (headerOffset === -1) {
        return {
          isValid: false,
          error: 'Firma MPQ no encontrada (no contiene los magic bytes "MPQ\\x1a").'
        };
      }

      const header = {
        magic: isUserData ? 'MPQ\\x1b (User Data)' : 'MPQ\\x1a',
        headerOffset,
        headerSize: view.getUint32(headerOffset + 4, true),
        archiveSize: view.getUint32(headerOffset + 8, true),
        formatVersion: view.getUint16(headerOffset + 12, true),
        sectorSizeShift: view.getUint16(headerOffset + 14, true),
        hashTablePos: view.getUint32(headerOffset + 16, true),
        blockTablePos: view.getUint32(headerOffset + 20, true),
        hashTableSize: view.getUint32(headerOffset + 24, true),
        blockTableSize: view.getUint32(headerOffset + 28, true),
        sectorSize: 512 * (1 << view.getUint16(headerOffset + 14, true))
      };

      return {
        isValid: true,
        header
      };
    } catch (err) {
      return {
        isValid: false,
        error: `Error al inspeccionar archivo: ${err.message}`
      };
    }
  }

  /**
   * Formatea un tamaño en bytes a representación legible
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Exportar globalmente para el navegador
window.MpqInspector = MpqInspector;
