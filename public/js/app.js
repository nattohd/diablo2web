/**
 * Diablo2Web Main Application Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas');
  const consoleBox = document.getElementById('console-output');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const folderInput = document.getElementById('folder-input');
  const mpqList = document.getElementById('mpq-list');
  const storageUsageText = document.getElementById('storage-usage');
  const storageProgressBar = document.getElementById('storage-bar');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnPointerLock = document.getElementById('btn-pointerlock');
  const btnClearStorage = document.getElementById('btn-clear-storage');
  const btnExportSaves = document.getElementById('btn-export-saves');
  const characterFileInput = document.getElementById('character-file-input');
  const characterList = document.getElementById('character-list');

  // Inicializar subsistemas
  const storage = new VFSStorage();
  await storage.init();

  const wasmLoader = new WasmEngineLoader(canvas, consoleBox);
  wasmLoader.log('Inicializando cliente Diablo II WebAssembly...', 'info');

  // Arrancar visualización en el Canvas
  wasmLoader.startPreviewMode();

  // Lista de MPQs esenciales esperados
  const REQUIRED_MPQS = [
    { name: 'd2data.mpq', desc: 'Datos base del juego', req: true },
    { name: 'd2char.mpq', desc: 'Sprites y animaciones', req: true },
    { name: 'd2exp.mpq', desc: 'Lord of Destruction', req: true },
    { name: 'd2sfx.mpq', desc: 'Efectos de sonido', req: true },
    { name: 'd2music.mpq', desc: 'Música ambiental', req: true },
    { name: 'd2speech.mpq', desc: 'Diálogos y voces', req: true },
    { name: 'patch_d2.mpq', desc: 'Parche acumulativo', req: true },
    { name: 'd2video.mpq', desc: 'Cinemáticas base', req: false },
    { name: 'd2xvideo.mpq', desc: 'Cinemáticas Expansión', req: false }
  ];

  // Actualizar estadísticas de almacenamiento
  async function refreshStorageStats() {
    const stats = await storage.getStorageEstimate();
    const storedMpqs = await storage.listMpqs();
    const storedChars = await storage.listCharacters();

    if (storageUsageText) {
      const usedMb = (stats.usage / (1024 * 1024)).toFixed(1);
      const quotaGb = (stats.quota / (1024 * 1024 * 1024)).toFixed(1);
      storageUsageText.textContent = `${usedMb} MB usados de ${quotaGb} GB disponibles (${stats.usagePercentage}%)`;
    }

    if (storageProgressBar) {
      storageProgressBar.style.width = `${Math.min(stats.usagePercentage, 100)}%`;
    }

    renderMpqList(storedMpqs);
    renderCharacterList(storedChars);
  }

  // Renderizar la lista de MPQs
  function renderMpqList(storedMpqs) {
    if (!mpqList) return;
    mpqList.innerHTML = '';

    const storedMap = new Map();
    storedMpqs.forEach(m => storedMap.set(m.name.toLowerCase(), m));

    let readyCount = 0;

    REQUIRED_MPQS.forEach(item => {
      const stored = storedMap.get(item.name.toLowerCase());
      const row = document.createElement('div');
      row.className = `mpq-item ${stored ? 'status-ready' : item.req ? 'status-missing' : 'status-optional'}`;

      const icon = stored ? '✔' : item.req ? '✘' : '○';
      const sizeText = stored ? MpqInspector.formatBytes(stored.size) : 'No cargado';
      const badgeClass = stored ? 'badge-success' : item.req ? 'badge-danger' : 'badge-neutral';
      const badgeText = stored ? 'Listo en IndexedDB' : item.req ? 'Falta (Requerido)' : 'Opcional';

      if (stored && item.req) readyCount++;

      row.innerHTML = `
        <div class="mpq-info">
          <span class="mpq-icon">${icon}</span>
          <div>
            <strong>${item.name}</strong>
            <div class="mpq-desc">${item.desc} &bull; ${sizeText}</div>
          </div>
        </div>
        <div class="mpq-actions">
          <span class="badge ${badgeClass}">${badgeText}</span>
          ${stored ? `<button class="btn-sm btn-delete" data-file="${item.name}">Eliminar</button>` : ''}
        </div>
      `;

      mpqList.appendChild(row);
    });

    // Añadir eventos a botones de eliminar
    mpqList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const file = e.target.getAttribute('data-file');
        if (confirm(`¿Eliminar ${file} de la memoria del navegador?`)) {
          await storage.deleteMpq(file);
          wasmLoader.log(`Archivo eliminado de almacenamiento: ${file}`, 'warn');
          await refreshStorageStats();
        }
      });
    });

    const statusBadge = document.getElementById('game-status-badge');
    if (statusBadge) {
      if (readyCount >= 7) {
        statusBadge.textContent = 'Archivos Completos (Listo para jugar)';
        statusBadge.className = 'badge badge-success';
      } else {
        statusBadge.textContent = `${readyCount}/7 Archivos Esenciales`;
        statusBadge.className = 'badge badge-danger';
      }
    }
  }

  // Renderizar la lista de personajes (.d2s)
  function renderCharacterList(chars) {
    if (!characterList) return;
    characterList.innerHTML = '';

    if (chars.length === 0) {
      characterList.innerHTML = '<div class="empty-state">No hay partidas guardadas (.d2s) en la memoria. Puedes importar un personaje existente.</div>';
      return;
    }

    chars.forEach(ch => {
      const row = document.createElement('div');
      row.className = 'char-item';
      const dateStr = new Date(ch.savedAt).toLocaleString();
      row.innerHTML = `
        <div>
          <strong>${ch.name}</strong>
          <div class="mpq-desc">${MpqInspector.formatBytes(ch.size)} &bull; Guardado: ${dateStr}</div>
        </div>
        <div>
          <button class="btn-sm btn-export-char" data-name="${ch.name}">Descargar .d2s</button>
        </div>
      `;
      characterList.appendChild(row);
    });

    characterList.querySelectorAll('.btn-export-char').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const name = e.target.getAttribute('data-name');
        const charData = chars.find(c => c.name === name);
        if (charData) {
          downloadBlob(charData.data, name);
        }
      });
    });
  }

  // Procesar archivos subidos
  async function handleFiles(files) {
    if (!files || files.length === 0) return;

    wasmLoader.log(`Analizando ${files.length} archivo(s)...`, 'info');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lowerName = file.name.toLowerCase();

      // Es un archivo MPQ
      if (lowerName.endsWith('.mpq')) {
        wasmLoader.log(`Inspeccionando cabecera de ${file.name} (${MpqInspector.formatBytes(file.size)})...`, 'info');
        const inspection = await MpqInspector.inspect(file);

        if (inspection.isValid) {
          wasmLoader.log(`Cabecera MPQ válida: ${file.name}. Formato: ${inspection.header.formatVersion}, Sector: ${inspection.header.sectorSize} bytes. Guardando en IndexedDB...`, 'success');
          await storage.saveMpq(file.name, file, inspection.header);
        } else {
          wasmLoader.log(`Advertencia en ${file.name}: ${inspection.error}. Se guardará de todas formas.`, 'warn');
          await storage.saveMpq(file.name, file, {});
        }
      } 
      // Es un archivo de guardado (.d2s)
      else if (lowerName.endsWith('.d2s')) {
        wasmLoader.log(`Importando archivo de personaje: ${file.name}`, 'info');
        await storage.saveCharacter(file.name, file);
      } 
      // Ejecutable
      else if (lowerName === 'game.exe') {
        wasmLoader.log(`Guardando Game.exe original en VFS...`, 'info');
        await storage.saveMpq('game.exe', file, {});
      }
    }

    await refreshStorageStats();
  }

  // Helper de descarga
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Drag and Drop
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length > 0) {
        handleFiles(dt.files);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });
  }

  if (folderInput) {
    folderInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });
  }

  if (characterFileInput) {
    characterFileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });
  }

  // Pestañas de navegación
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPanel = document.getElementById(`tab-${target}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Pantalla Completa
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      const container = document.getElementById('canvas-container');
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) container.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });
  }

  // Pointer Lock (Captura del mouse para combate estilo ARPG)
  if (btnPointerLock) {
    btnPointerLock.addEventListener('click', () => {
      canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
      if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
        wasmLoader.log('Captura de ratón (Pointer Lock) activada. Presiona ESC para salir.', 'info');
      }
    });
  }

  // Reset de almacenamiento
  if (btnClearStorage) {
    btnClearStorage.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas borrar todos los archivos MPQ de la memoria del navegador?')) {
        await storage.clearAll();
        wasmLoader.log('Base de datos IndexedDB limpiada por completo.', 'warn');
        await refreshStorageStats();
      }
    });
  }

  // Carga inicial de datos
  await refreshStorageStats();
});
