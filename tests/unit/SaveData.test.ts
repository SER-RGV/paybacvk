import { describe, expect, it } from 'vitest';
import { SAVE_FORMAT, SAVE_SCHEMA_VERSION, decodeTestRangeSave, encodeTestRangeSave, type TestRangeSave } from '../../src/core/SaveData';

const SAMPLE: TestRangeSave = {
  kind: 'testRange',
  simulation: { stepCount: 250, speedIndex: 2, paused: true },
  camera: { yawDeg: 90, pitchDeg: 35, zoom: 18, pivotX: 4, pivotZ: -6 },
};

describe('save envelope', () => {
  it('round-trips a test range save with format and version', () => {
    const raw = encodeTestRangeSave(SAMPLE, new Date('2026-11-11T10:00:00Z'));
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.format).toBe(SAVE_FORMAT);
    expect(parsed.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    const result = decodeTestRangeSave(raw);
    expect(result).toEqual({ ok: true, save: SAMPLE, savedAt: '2026-11-11T10:00:00.000Z' });
  });

  it('rejects invalid JSON', () => {
    expect(decodeTestRangeSave('{').ok).toBe(false);
  });

  it('rejects data that is not a save of this game', () => {
    expect(decodeTestRangeSave(JSON.stringify({ format: 'other', schemaVersion: 1, payload: SAMPLE })).ok).toBe(false);
  });

  it('rejects a save from a newer schema instead of guessing', () => {
    const raw = JSON.stringify({ format: SAVE_FORMAT, schemaVersion: SAVE_SCHEMA_VERSION + 1, payload: SAMPLE });
    const result = decodeTestRangeSave(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('newer version');
    }
  });

  it('rejects a missing or invalid schema version', () => {
    expect(decodeTestRangeSave(JSON.stringify({ format: SAVE_FORMAT, payload: SAMPLE })).ok).toBe(false);
    expect(decodeTestRangeSave(JSON.stringify({ format: SAVE_FORMAT, schemaVersion: 0, payload: SAMPLE })).ok).toBe(false);
  });

  it('rejects payloads with wrong types or missing fields', () => {
    const bad = [
      { ...SAMPLE, kind: 'battle' },
      { ...SAMPLE, simulation: { ...SAMPLE.simulation, stepCount: -1 } },
      { ...SAMPLE, simulation: { ...SAMPLE.simulation, paused: 'yes' } },
      { ...SAMPLE, camera: { ...SAMPLE.camera, zoom: Number.NaN } },
      { ...SAMPLE, camera: undefined },
    ];
    for (const payload of bad) {
      const raw = JSON.stringify({ format: SAVE_FORMAT, schemaVersion: SAVE_SCHEMA_VERSION, payload });
      expect(decodeTestRangeSave(raw).ok).toBe(false);
    }
  });
});
