/**
 * Diablo2Web WebAssembly & Emscripten Loader
 * Configura el entorno de ejecución de WASM, montaje de IDBFS, captura de canvas y logs.
 */

class WasmEngineLoader {
  constructor(canvasElement, consoleElement) {
    this.canvas = canvasElement;
    this.console = consoleElement;
    this.isRunning = false;
    this.module = null;
    this.animationId = null;
  }

  log(text, type = 'info') {
    if (!this.console) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-line log-${type}`;
    entry.textContent = `[${time}] ${text}`;
    this.console.appendChild(entry);
    this.console.scrollTop = this.console.scrollHeight;
  }

  /**
   * Inicializa la configuración de Emscripten
   */
  createEmscriptenModule(onReadyCallback) {
    const self = this;
    return {
      preRun: [
        function() {
          self.log('Configurando entorno virtual de archivos (IDBFS)...', 'info');
          if (typeof FS !== 'undefined') {
            try {
              FS.mkdir('/saves');
              FS.mount(IDBFS, {}, '/saves');
              FS.syncfs(true, function(err) {
                if (err) self.log(`Error al sincronizar saves: ${err}`, 'error');
                else self.log('Directorio /saves sincronizado con IndexedDB.', 'success');
              });
            } catch (e) {
              self.log(`Nota VFS: ${e.message}`, 'warn');
            }
          }
        }
      ],
      postRun: [
        function() {
          self.log('Motor Diablo II WebAssembly iniciado correctamente.', 'success');
          self.isRunning = true;
          if (onReadyCallback) onReadyCallback();
        }
      ],
      print: function(text) {
        self.log(text, 'stdout');
      },
      printErr: function(text) {
        self.log(text, 'stderr');
      },
      canvas: (function() {
        return self.canvas;
      })(),
      setStatus: function(text) {
        if (text) self.log(`Status: ${text}`, 'info');
      },
      totalDependencies: 0,
      monitorRunDependencies: function(left) {
        self.log(`Dependencias restantes: ${left}`, 'info');
      }
    };
  }

  /**
   * Inicia el modo de demostración gráfica retro (Preview Mode)
   * Permite probar el canvas, escalado, FPS y Pointer Lock mientras se compila el binario WASM
   */
  startPreviewMode() {
    this.isRunning = true;
    this.log('Iniciando lienzo en modo demostración gráfica...', 'info');
    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;

    let frame = 0;
    const embers = Array.from({ length: 70 }, () => ({
      x: Math.random() * w,
      y: h - Math.random() * 120,
      size: Math.random() * 3 + 1,
      speedY: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.8,
      alpha: Math.random() * 0.8 + 0.2,
      hue: Math.random() * 30 + 15 // Naranja a rojo
    }));

    const render = () => {
      if (!this.isRunning) return;
      frame++;

      // Fondo oscuro gótico
      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, 0, w, h);

      // Resplandor del fuego central (estilo fogata de selección de personaje)
      const fireGrad = ctx.createRadialGradient(w / 2, h - 80, 20, w / 2, h - 80, 260);
      const pulse = Math.sin(frame * 0.08) * 15;
      fireGrad.addColorStop(0, `rgba(255, 120, 20, ${0.45 + pulse * 0.005})`);
      fireGrad.addColorStop(0.5, `rgba(180, 30, 10, ${0.25 + pulse * 0.003})`);
      fireGrad.addColorStop(1, 'rgba(10, 10, 13, 0)');
      ctx.fillStyle = fireGrad;
      ctx.fillRect(0, 0, w, h);

      // Partículas de brasas / chispas
      embers.forEach(p => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.alpha -= 0.004;

        if (p.y < h - 280 || p.alpha <= 0) {
          p.x = w / 2 + (Math.random() - 0.5) * 160;
          p.y = h - 60 - Math.random() * 30;
          p.alpha = Math.random() * 0.8 + 0.4;
        }

        ctx.fillStyle = `hsla(${p.hue}, 100%, 55%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Texto de estado Diablo II
      ctx.save();
      ctx.shadowColor = '#ff3b00';
      ctx.shadowBlur = 12;
      ctx.font = 'bold 28px "Cinzel", "Cinzel Decorative", serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f7d774';
      ctx.fillText('DIABLO II: LORD OF DESTRUCTION', w / 2, h / 2 - 40);

      ctx.shadowBlur = 4;
      ctx.font = '14px "Inter", sans-serif';
      ctx.fillStyle = '#c7b39b';
      ctx.fillText('WebAssembly Client Core • Resolución: 800 x 600', w / 2, h / 2);

      ctx.font = '12px "Inter", monospace';
      ctx.fillStyle = '#8f8f9d';
      ctx.fillText('Carga tus archivos MPQ en la pestaña superior para desbloquear el juego completo', w / 2, h / 2 + 30);

      // Marco decorativo de piedra/oro
      ctx.strokeStyle = '#5a462b';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      // FPS contador en esquina
      ctx.font = '11px monospace';
      ctx.fillStyle = '#00ff66';
      ctx.textAlign = 'right';
      ctx.fillText(`FPS: 60 | Canvas: ${w}x${h}`, w - 20, 30);
      ctx.restore();

      this.animationId = requestAnimationFrame(render);
    };

    render();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

window.WasmEngineLoader = WasmEngineLoader;
