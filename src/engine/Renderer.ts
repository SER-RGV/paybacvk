import * as THREE from 'three';

export class WebGLUnavailableError extends Error {
  constructor(cause: unknown) {
    super('WebGL is not available in this browser or is disabled. Enable hardware acceleration and reload.');
    this.name = 'WebGLUnavailableError';
    this.cause = cause;
  }
}

export interface Viewport {
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
}

export interface RenderStats {
  readonly geometries: number;
  readonly textures: number;
  readonly drawCalls: number;
}

const CLEAR_COLOR = 0x0b0f14;
const MAX_PIXEL_RATIO = 2;

/**
 * Owns the WebGL context and the canvas. Knows nothing about scenes or game rules.
 * The canvas always fills its host element; a ResizeObserver keeps the drawing buffer in sync.
 */
export class Renderer {
  readonly canvas: HTMLCanvasElement;
  private readonly gl: THREE.WebGLRenderer;
  private readonly resizeObserver: ResizeObserver | null = null;
  private viewport: Viewport = { width: 1, height: 1, pixelRatio: 1 };
  private readonly listeners = new Set<(viewport: Viewport) => void>();
  private readonly onWindowResize = (): void => this.measure();
  private readonly onContextLost: (event: Event) => void;
  private contextLostHandler: (() => void) | null = null;
  private disposed = false;

  constructor(private readonly host: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.setAttribute('data-testid', 'game-canvas');
    host.appendChild(this.canvas);
    try {
      this.gl = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (error) {
      this.canvas.remove();
      throw new WebGLUnavailableError(error);
    }
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.PCFShadowMap;
    this.gl.setClearColor(CLEAR_COLOR, 1);
    this.onContextLost = (event: Event): void => {
      event.preventDefault();
      this.contextLostHandler?.();
    };
    this.canvas.addEventListener('webglcontextlost', this.onContextLost);
    this.measure();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(host);
    }
    window.addEventListener('resize', this.onWindowResize);
  }

  get size(): Viewport {
    return this.viewport;
  }

  /** Called when the WebGL context is lost. The game reports the error instead of freezing silently. */
  onContextLoss(handler: () => void): void {
    this.contextLostHandler = handler;
  }

  /** Returns an unsubscribe function. */
  onResize(listener: (viewport: Viewport) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.gl.render(scene, camera);
  }

  clear(): void {
    this.gl.clear(true, true, true);
  }

  stats(): RenderStats {
    const info = this.gl.info;
    return {
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      drawCalls: info.render.calls,
    };
  }

  /** Releases the context. Safe to call more than once. */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.onWindowResize);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.listeners.clear();
    this.gl.dispose();
    this.gl.forceContextLoss();
    this.canvas.remove();
  }

  private measure(): void {
    if (this.disposed) {
      return;
    }
    const width = Math.max(1, Math.floor(this.host.clientWidth));
    const height = Math.max(1, Math.floor(this.host.clientHeight));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    if (width === this.viewport.width && height === this.viewport.height && pixelRatio === this.viewport.pixelRatio) {
      return;
    }
    this.viewport = { width, height, pixelRatio };
    this.gl.setPixelRatio(pixelRatio);
    this.gl.setSize(width, height, false);
    for (const listener of this.listeners) {
      listener(this.viewport);
    }
  }
}
