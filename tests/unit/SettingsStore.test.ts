import { describe, expect, it, vi } from 'vitest';
import { SETTINGS } from '../../src/data/tuning';
import { EventBus } from '../../src/core/EventBus';
import type { AppEvents } from '../../src/core/events';
import { SettingsStore, clampSetting, defaultSettings, parseSettings, serializeSettings } from '../../src/core/SettingsStore';
import type { KeyValueStorage } from '../../src/core/storage';

class MemoryStorage implements KeyValueStorage {
  readonly data = new Map<string, string>();
  failWrites = false;
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) {
      throw new Error('quota exceeded');
    }
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

describe('parseSettings', () => {
  it('returns defaults for empty input', () => {
    expect(parseSettings(null)).toEqual({ status: 'empty', values: defaultSettings() });
    expect(parseSettings('   ')).toEqual({ status: 'empty', values: defaultSettings() });
  });

  it('returns defaults for corrupt JSON or the wrong shape', () => {
    expect(parseSettings('{not json').status).toBe('corrupt');
    expect(parseSettings('[1,2]').status).toBe('corrupt');
    expect(parseSettings('"text"').status).toBe('corrupt');
    expect(parseSettings(JSON.stringify({ schemaVersion: SETTINGS.schemaVersion, values: null })).status).toBe('corrupt');
  });

  it('rejects another schema version and falls back to defaults', () => {
    const result = parseSettings(JSON.stringify({ schemaVersion: 99, values: { cameraPanSpeed: 2 } }));
    expect(result.status).toBe('unsupported-version');
    expect(result.values).toEqual(defaultSettings());
  });

  it('loads known keys, clamps them, ignores unknown keys and non-numbers', () => {
    const raw = serializeSettings({ ...defaultSettings(), cameraPanSpeed: 99 });
    const parsed = JSON.parse(raw) as { values: Record<string, unknown> };
    parsed.values.cameraZoomSpeed = 'fast';
    parsed.values.unknownKey = 5;
    const result = parseSettings(JSON.stringify(parsed));
    expect(result.status).toBe('loaded');
    expect(result.values.cameraPanSpeed).toBe(SETTINGS.max);
    expect(result.values.cameraZoomSpeed).toBe(SETTINGS.defaults.cameraZoomSpeed);
    expect(result.values).not.toHaveProperty('unknownKey');
  });

  it('clamps arbitrary numbers into the allowed range', () => {
    expect(clampSetting(-5)).toBe(SETTINGS.min);
    expect(clampSetting(0.5)).toBe(0.5);
    expect(clampSetting(10)).toBe(SETTINGS.max);
  });
});

describe('SettingsStore', () => {
  it('saves every accepted change and reloads it in a new instance', () => {
    const storage = new MemoryStorage();
    const events = new EventBus<AppEvents>();
    const first = new SettingsStore(storage, events);
    first.load();
    expect(first.set('cameraRotateSpeed', 1.5)).toBe(true);

    const second = new SettingsStore(storage, new EventBus<AppEvents>());
    expect(second.load()).toBe('loaded');
    expect(second.get('cameraRotateSpeed')).toBe(1.5);
  });

  it('rejects unknown keys and non-finite values without changing anything', () => {
    const store = new SettingsStore(new MemoryStorage(), new EventBus<AppEvents>());
    expect(store.set('masterVolume', 1)).toBe(false);
    expect(store.set('cameraPanSpeed', Number.NaN)).toBe(false);
    expect(store.get('cameraPanSpeed')).toBe(SETTINGS.defaults.cameraPanSpeed);
  });

  it('emits settingsChanged only when the value differs', () => {
    const events = new EventBus<AppEvents>();
    const listener = vi.fn();
    events.on('settingsChanged', listener);
    const store = new SettingsStore(new MemoryStorage(), events);
    store.set('cameraZoomSpeed', 2);
    store.set('cameraZoomSpeed', 2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('discards corrupt stored data, restores defaults and reports the problem', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS.storageKey, '{broken');
    const events = new EventBus<AppEvents>();
    const errors = vi.fn();
    events.on('error', errors);
    const store = new SettingsStore(storage, events);
    expect(store.load()).toBe('corrupt');
    expect(store.snapshot()).toEqual(defaultSettings());
    expect(errors).toHaveBeenCalledTimes(1);
    expect(storage.getItem(SETTINGS.storageKey)).toBeNull();
  });

  it('keeps the value in memory and reports an error when saving fails', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const events = new EventBus<AppEvents>();
    const errors = vi.fn();
    events.on('error', errors);
    const store = new SettingsStore(storage, events);
    expect(store.set('cameraPanSpeed', 2)).toBe(true);
    expect(store.get('cameraPanSpeed')).toBe(2);
    expect(errors).toHaveBeenCalledTimes(1);
  });

  it('works without storage (memory only)', () => {
    const store = new SettingsStore(null, new EventBus<AppEvents>());
    expect(store.load()).toBe('empty');
    expect(store.set('cameraPanSpeed', 0.5)).toBe(true);
    expect(store.save()).toBe(false);
  });

  it('reset restores every default', () => {
    const store = new SettingsStore(new MemoryStorage(), new EventBus<AppEvents>());
    store.set('cameraPanSpeed', 3);
    store.set('cameraRotateSpeed', 0.25);
    store.reset();
    expect(store.snapshot()).toEqual(defaultSettings());
  });
});
