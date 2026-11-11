import type { EventBus } from './EventBus';
import type { AppEvents } from './events';
import type { InputController } from './InputController';
import type { SaveRepository } from './SaveRepository';
import type { SettingsStore } from './SettingsStore';
import type { ScreenId } from './GameState';
import type { Renderer } from '../engine/Renderer';

/** Options for the next screen. Consumed once by the scene that starts. */
export interface NavigationOptions {
  readonly loadSave?: boolean;
}

/** Shared, long-lived services handed to every scene. Scenes must not keep references after exit(). */
export interface AppServices {
  readonly events: EventBus<AppEvents>;
  readonly settings: SettingsStore;
  readonly saves: SaveRepository;
  readonly renderer: Renderer;
  readonly input: InputController;
  /** Requests a screen change. It takes effect before the next update. */
  navigate(screen: ScreenId, options?: NavigationOptions): void;
  /** Returns the options passed to the latest navigate() call and clears them. */
  takeNavigationOptions(): NavigationOptions;
}
