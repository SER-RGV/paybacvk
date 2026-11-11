import { SETTINGS } from '../data/tuning';
import type { EventBus } from './EventBus';
import type { KeyValueStorage } from './storage';
import type { AppEvents } from './events';

export type SettingKey = keyof typeof SETTINGS.defaults;
export type SettingValues = Record<SettingKey, number>;

export type ParseStatus = 'loaded' | 'empty' | 'corrupt' | 'unsupported-version';

export interface ParseResult {
  readonly status: ParseStatus;
  readonly values: SettingValues;
}

const SETTING_KEYS = Object.keys(SETTINGS.defaults) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return (SETTING_KEYS as string[]).includes(key);
}

export function defaultSettings(): SettingValues {
  return { ...SETTINGS.defaults };
}

export function clampSetting(value: number): number {
  return Math.min(SETTINGS.max, Math.max(SETTINGS.min, value));
}

/**
 * Parses stored settings text. Pure: never throws and never touches storage.
 * - null / blank: defaults, status "empty".
 * - invalid JSON or wrong shape: defaults, status "corrupt".
 * - schema version other than the current one: defaults, status "unsupported-version".
 * - valid: known keys are clamped and merged over defaults; unknown keys are ignored.
 */
export function parseSettings(raw: string | null): ParseResult {
  if (raw === null || raw.trim() === '') {
    return { status: 'empty', values: defaultSettings() };
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { status: 'corrupt', values: defaultSettings() };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { status: 'corrupt', values: defaultSettings() };
  }
  const record = data as { schemaVersion?: unknown; values?: unknown };
  if (record.schemaVersion !== SETTINGS.schemaVersion) {
    return { status: 'unsupported-version', values: defaultSettings() };
  }
  if (typeof record.values !== 'object' || record.values === null) {
    return { status: 'corrupt', values: defaultSettings() };
  }
  const values = defaultSettings();
  const stored = record.values as Record<string, unknown>;
  for (const key of SETTING_KEYS) {
    const candidate = stored[key];
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      values[key] = clampSetting(candidate);
    }
  }
  return { status: 'loaded', values };
}

export function serializeSettings(values: SettingValues): string {
  return JSON.stringify({ schemaVersion: SETTINGS.schemaVersion, values });
}

/**
 * Owns the user's settings and their persistence.
 * Every accepted change is saved immediately. A failed save keeps the new value in memory and
 * reports the problem through the event bus instead of throwing.
 */
export class SettingsStore {
  private values: SettingValues = defaultSettings();

  constructor(
    private readonly storage: KeyValueStorage | null,
    private readonly events: EventBus<AppEvents>,
  ) {}

  /** Loads from storage. Corrupt or incompatible data is discarded and replaced with defaults. */
  load(): ParseStatus {
    if (!this.storage) {
      return 'empty';
    }
    let raw: string | null;
    try {
      raw = this.storage.getItem(SETTINGS.storageKey);
    } catch (error) {
      this.events.emit('error', { message: 'Settings could not be read. Defaults are in use.', cause: error });
      return 'empty';
    }
    const result = parseSettings(raw);
    this.values = result.values;
    if (result.status === 'corrupt' || result.status === 'unsupported-version') {
      this.events.emit('error', { message: 'Stored settings were discarded and defaults restored.', cause: result.status });
      this.safeRemove();
    }
    return result.status;
  }

  get(key: SettingKey): number {
    return this.values[key];
  }

  snapshot(): Readonly<SettingValues> {
    return { ...this.values };
  }

  /** Returns false for unknown keys or non-finite values. Valid values are clamped and saved. */
  set(key: string, value: number): boolean {
    if (!isSettingKey(key) || !Number.isFinite(value)) {
      return false;
    }
    const next = clampSetting(value);
    if (this.values[key] === next) {
      return true;
    }
    this.values[key] = next;
    this.events.emit('settingsChanged', { key, value: next });
    this.save();
    return true;
  }

  reset(): void {
    for (const key of SETTING_KEYS) {
      this.set(key, SETTINGS.defaults[key]);
    }
  }

  /** Returns true when the value reached storage. */
  save(): boolean {
    if (!this.storage) {
      return false;
    }
    try {
      this.storage.setItem(SETTINGS.storageKey, serializeSettings(this.values));
      return true;
    } catch (error) {
      this.events.emit('error', { message: 'Settings could not be saved. They will reset on reload.', cause: error });
      return false;
    }
  }

  private safeRemove(): void {
    try {
      this.storage?.removeItem(SETTINGS.storageKey);
    } catch {
      // Removing corrupt data is best-effort; defaults are already in memory.
    }
  }
}
