import type { SimulationState } from '../../tactical/TacticalSimulation';
import { formatSimTime } from '../../tactical/TacticalSimulation';
import type { CameraState } from '../../engine/IsoCamera';
import { SIMULATION } from '../../data/tuning';
import { button, element } from '../dom';

export interface HudHandlers {
  onTogglePause(): void;
  onSlower(): void;
  onFaster(): void;
  onSave(): void;
  onLoad(): void;
  onMenu(): void;
}

export interface HudStats {
  readonly fps: number;
  readonly geometries: number;
  readonly textures: number;
  readonly drawCalls: number;
}

/**
 * DOM overlay for the test range. Presentation only: it displays values it is given and forwards
 * clicks to handlers. It never reads or changes simulation state directly.
 */
export class Hud {
  private readonly root: HTMLElement;
  private readonly simTime: HTMLElement;
  private readonly simStatus: HTMLElement;
  private readonly simSpeed: HTMLElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly camera: HTMLElement;
  private readonly stats: HTMLElement;
  private readonly message: HTMLElement;

  constructor(host: HTMLElement, handlers: HudHandlers) {
    this.simTime = element('span', { className: 'hud__value', attrs: { 'data-testid': 'sim-time' }, text: '00:00.0' });
    this.simStatus = element('span', { className: 'hud__status', attrs: { 'data-testid': 'sim-status' }, text: 'RUNNING' });
    this.simSpeed = element('span', { className: 'hud__value', attrs: { 'data-testid': 'sim-speed' }, text: '1x' });
    this.pauseButton = button('Pause', () => handlers.onTogglePause(), { attrs: { 'data-testid': 'btn-pause' } });
    this.camera = element('div', { className: 'hud__camera', attrs: { 'data-testid': 'camera-readout' } });
    this.stats = element('div', { className: 'hud__stats', attrs: { 'data-testid': 'stats-readout' } });
    this.message = element('div', { className: 'hud__message', attrs: { role: 'status', 'data-testid': 'hud-message' } });

    const panel = element('section', { className: 'hud__panel', attrs: { 'aria-label': 'Simulation controls' } }, [
      element('h1', { className: 'hud__title', text: 'Test Range' }),
      element('div', { className: 'hud__row' }, [element('span', { text: 'Sim time' }), this.simTime]),
      element('div', { className: 'hud__row' }, [element('span', { text: 'State' }), this.simStatus]),
      element('div', { className: 'hud__row' }, [element('span', { text: 'Speed' }), this.simSpeed]),
      element('div', { className: 'hud__buttons' }, [
        this.pauseButton,
        button('Slower', () => handlers.onSlower(), { attrs: { 'data-testid': 'btn-slower' } }),
        button('Faster', () => handlers.onFaster(), { attrs: { 'data-testid': 'btn-faster' } }),
      ]),
      element('div', { className: 'hud__buttons' }, [
        button('Save', () => handlers.onSave(), { attrs: { 'data-testid': 'btn-save' } }),
        button('Load', () => handlers.onLoad(), { attrs: { 'data-testid': 'btn-load' } }),
        button('Main menu', () => handlers.onMenu(), { attrs: { 'data-testid': 'btn-menu' } }),
      ]),
      this.message,
    ]);

    const help = element('p', {
      className: 'hud__help',
      text: 'WASD / arrows: pan   Q E: rotate   +/-, wheel: zoom   Space: pause   [ ]: speed   Right-drag: orbit   Middle-drag: pan   Esc: menu',
    });

    this.root = element('div', { className: 'hud', attrs: { 'data-testid': 'hud' } }, [
      panel,
      element('div', { className: 'hud__side' }, [this.camera, this.stats]),
      help,
    ]);
    host.appendChild(this.root);
  }

  /** Called every frame. Writes to the DOM only when the displayed text changes. */
  setSimulation(state: SimulationState): void {
    setText(this.simTime, formatSimTime(state.simTime));
    setText(this.simStatus, state.paused ? 'PAUSED' : 'RUNNING');
    this.simStatus.classList.toggle('hud__status--paused', state.paused);
    setText(this.simSpeed, `${state.speed}x (level ${state.speedIndex + 1}/${SIMULATION.speedLevels.length})`);
    setText(this.pauseButton, state.paused ? 'Resume' : 'Pause');
    this.pauseButton.setAttribute('aria-pressed', String(state.paused));
  }

  setCamera(state: CameraState): void {
    setText(this.camera, `Zoom ${state.zoom.toFixed(1)}  Yaw ${state.yawDeg.toFixed(0)}°  Pitch ${state.pitchDeg.toFixed(1)}°`);
  }

  setStats(stats: HudStats): void {
    setText(this.stats, `${stats.fps.toFixed(0)} fps  |  geometries ${stats.geometries}  textures ${stats.textures}  draw calls ${stats.drawCalls}`);
  }

  showMessage(text: string, tone: 'info' | 'error' = 'info'): void {
    this.message.textContent = text;
    this.message.dataset.tone = tone;
  }

  dispose(): void {
    this.root.remove();
  }
}

function setText(node: HTMLElement, text: string): void {
  if (node.textContent !== text) {
    node.textContent = text;
  }
}
