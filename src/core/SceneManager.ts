import type { EventBus } from './EventBus';
import type { AppEvents } from './events';
import type { GameState, ScreenId } from './GameState';
import { describeError } from '../utils/errors';

/**
 * A screen of the application. Scenes own their DOM and GPU resources and must release all of them
 * in exit(). Each switch creates a fresh instance through its factory, so nothing survives a switch.
 */
export interface Scene {
  enter(): void;
  /** Real seconds since the previous frame. Simulation advances here. */
  update(deltaSeconds: number): void;
  /** Draws the current state. Must not change simulation state. */
  render(): void;
  exit(): void;
}

export type SceneFactory = () => Scene;

/**
 * Registry plus lifecycle for scenes. Unknown ids are rejected without changing the active scene.
 * Switches requested from inside a scene (requestSwitch) take effect before the next update.
 */
export class SceneManager {
  private readonly factories = new Map<ScreenId, SceneFactory>();
  private active: Scene | null = null;
  private pending: ScreenId | null = null;

  constructor(
    private readonly state: GameState,
    private readonly events: EventBus<AppEvents>,
  ) {}

  register(id: ScreenId, factory: SceneFactory): void {
    if (this.factories.has(id)) {
      throw new Error(`Scene "${id}" is already registered.`);
    }
    this.factories.set(id, factory);
  }

  hasScene(id: string): id is ScreenId {
    return this.factories.has(id as ScreenId);
  }

  /** Synchronously switches to the scene. Returns false and keeps the current scene for unknown ids or failures. */
  switchTo(id: string): boolean {
    if (!this.hasScene(id)) {
      this.events.emit('error', { message: `Unknown screen "${id}". Staying on the current screen.` });
      return false;
    }
    const factory = this.factories.get(id);
    if (!factory) {
      return false;
    }
    this.exitActive();
    try {
      const next = factory();
      this.active = next;
      next.enter();
    } catch (error) {
      this.active = null;
      this.state.setScreen(null);
      this.events.emit('error', { message: `Screen "${id}" failed to start: ${describeError(error)}`, cause: error });
      return false;
    }
    const previous = this.state.current;
    this.state.setScreen(id);
    this.events.emit('screenChanged', { screenId: id, previous });
    return true;
  }

  /** Queues a switch for the start of the next update. Safe to call from inside a scene. */
  requestSwitch(id: ScreenId): void {
    this.pending = id;
  }

  /** Applies a queued switch, if any, then updates the active scene. */
  update(deltaSeconds: number): void {
    this.applyPending();
    this.active?.update(deltaSeconds);
  }

  render(): void {
    this.active?.render();
  }

  get current(): ScreenId | null {
    return this.state.current;
  }

  /** Exits the active scene and clears the registry of instances. Call once on shutdown. */
  shutdown(): void {
    this.exitActive();
    this.state.setScreen(null);
  }

  private applyPending(): void {
    const target = this.pending;
    this.pending = null;
    if (target !== null) {
      this.switchTo(target);
    }
  }

  private exitActive(): void {
    const scene = this.active;
    this.active = null;
    if (!scene) {
      return;
    }
    try {
      scene.exit();
    } catch (error) {
      this.events.emit('error', { message: `Screen cleanup failed: ${describeError(error)}`, cause: error });
    }
  }
}
