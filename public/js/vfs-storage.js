/**
 * Diablo2Web VFS Storage (IndexedDB)
 * Persiste los archivos originales MPQ y partidas guardadas (.d2s) en el almacenamiento local del navegador.
 */

class VFSStorage {
  static DB_NAME = 'Diablo2Web_VFS';
  static DB_VERSION = 1;
  static MPQ_STORE = 'mpq_files';
  static SAVE_STORE = 'save_games';

  constructor() {
    this.db = null;
    this.isPersistent = false;
  }

  /**
   * Inicializa la base de datos IndexedDB y solicita persistencia
   */
  async init() {
    if (this.db) return this.db;

    // Solicitar almacenamiento persistente para evitar borrado accidental por el navegador
    if (navigator.storage && navigator.storage.persist) {
      try {
        this.isPersistent = await navigator.storage.persist();
        console.log(`[VFS] Almacenamiento persistente garantizado: ${this.isPersistent}`);
      } catch (e) {
        console.warn('[VFS] No se pudo solicitar persistencia:', e);
      }
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(VFSStorage.DB_NAME, VFSStorage.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(VFSStorage.MPQ_STORE)) {
          db.createObjectStore(VFSStorage.MPQ_STORE, { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains(VFSStorage.SAVE_STORE)) {
          db.createObjectStore(VFSStorage.SAVE_STORE, { keyPath: 'name' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[VFS] Error al abrir IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Guarda un archivo MPQ en IndexedDB
   * @param {string} name - Nombre del archivo (ej: 'd2data.mpq')
   * @param {Blob|File} blob - Archivo binario
   * @param {object} metadata - Info de cabecera y estado
   */
  async saveMpq(name, blob, metadata = {}) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([VFSStorage.MPQ_STORE], 'readwrite');
      const store = tx.objectStore(VFSStorage.MPQ_STORE);

      const record = {
        name: name.toLowerCase(),
        originalName: name,
        size: blob.size,
        lastModified: blob.lastModified || Date.now(),
        data: blob,
        metadata: metadata
      };

      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Obtiene un archivo MPQ por su nombre
   */
  async getMpq(name) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([VFSStorage.MPQ_STORE], 'readonly');
      const store = tx.objectStore(VFSStorage.MPQ_STORE);
      const request = store.get(name.toLowerCase());
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Lista todos los archivos MPQ guardados
   */
  async listMpqs() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([VFSStorage.MPQ_STORE], 'readonly');
      const store = tx.objectStore(VFSStorage.MPQ_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Elimina un archivo MPQ
   */
  async deleteMpq(name) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([VFSStorage.MPQ_STORE], 'readwrite');
      const store = tx.objectStore(VFSStorage.MPQ_STORE);
      const request = store.delete(name.toLowerCase());
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Guarda una partida (.d2s)
   */
  async saveCharacter(name, blob) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([VFSStorage.SAVE_STORE], 'readwrite');
      const store = tx.objectStore(VFSStorage.SAVE_STORE);
      const record = {
        name: name,
        size: blob.size,
        savedAt: Date.now(),
        data: blob
      };
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Lista partidas guardadas
   */
  async listCharacters() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([VFSStorage.SAVE_STORE], 'readonly');
      const store = tx.objectStore(VFSStorage.SAVE_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Obtiene la estimación de cuota de disco
   */
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
          usagePercentage: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(1) : 0
        };
      } catch (e) {
        console.warn('[VFS] Error al obtener estimación de cuota:', e);
      }
    }
    return { usage: 0, quota: 0, usagePercentage: 0 };
  }

  /**
   * Borra toda la base de datos (Reset total)
   */
  async clearAll() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(VFSStorage.DB_NAME);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }
}

window.VFSStorage = VFSStorage;
