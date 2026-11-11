import type { ScreenId } from './GameState';
import type { SettingKey } from './SettingsStore';

/** Every event the application publishes. Payloads are plain data. */
export interface AppEvents {
  screenChanged: { readonly screenId: ScreenId; readonly previous: ScreenId | null };
  settingsChanged: { readonly key: SettingKey; readonly value: number };
  simulationStateChanged: { readonly paused: boolean; readonly speed: number };
  error: { readonly message: string; readonly cause?: unknown };
}
