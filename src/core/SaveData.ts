import type { CameraState } from '../engine/IsoCamera';

/**
 * Versioned save envelope. Pure functions only: encoding, decoding and migration.
 * Storage access is handled by SaveRepository.
 */
export const SAVE_FORMAT = 'umbral-de-acero/save';
export const SAVE_SCHEMA_VERSION = 1;

export interface TestRangeSave {
  readonly kind: 'testRange';
  readonly simulation: {
    readonly stepCount: number;
    readonly speedIndex: number;
    readonly paused: boolean;
  };
  readonly camera: CameraState;
}

export type DecodeResult =
  | { readonly ok: true; readonly save: TestRangeSave; readonly savedAt: string }
  | { readonly ok: false; readonly reason: string };

/** Migrations from version N to N+1, keyed by N. Empty until a second schema version exists. */
const MIGRATIONS: Readonly<Record<number, (payload: unknown) => unknown>> = {};

export function encodeTestRangeSave(save: TestRangeSave, savedAt: Date = new Date()): string {
  return JSON.stringify({
    format: SAVE_FORMAT,
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: savedAt.toISOString(),
    payload: save,
  });
}

export function decodeTestRangeSave(raw: string): DecodeResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'The save file is not valid JSON.' };
  }
  if (!isRecord(data) || data.format !== SAVE_FORMAT) {
    return { ok: false, reason: 'The data is not an UMBRAL DE ACERO save.' };
  }
  if (typeof data.schemaVersion !== 'number' || !Number.isInteger(data.schemaVersion) || data.schemaVersion < 1) {
    return { ok: false, reason: 'The save has no valid schema version.' };
  }
  if (data.schemaVersion > SAVE_SCHEMA_VERSION) {
    return { ok: false, reason: `The save was made by a newer version (schema ${String(data.schemaVersion)}).` };
  }
  let payload: unknown = data.payload;
  for (let version = data.schemaVersion; version < SAVE_SCHEMA_VERSION; version += 1) {
    const migrate = MIGRATIONS[version];
    if (!migrate) {
      return { ok: false, reason: `No migration exists from schema ${String(version)}.` };
    }
    payload = migrate(payload);
  }
  const save = validateTestRangeSave(payload);
  if (!save) {
    return { ok: false, reason: 'The save contents are invalid.' };
  }
  return { ok: true, save, savedAt: typeof data.savedAt === 'string' ? data.savedAt : '' };
}

function validateTestRangeSave(value: unknown): TestRangeSave | null {
  if (!isRecord(value) || value.kind !== 'testRange') {
    return null;
  }
  const sim = value.simulation;
  const cam = value.camera;
  if (!isRecord(sim) || !isRecord(cam)) {
    return null;
  }
  if (!isNonNegativeInteger(sim.stepCount) || !isNonNegativeInteger(sim.speedIndex) || typeof sim.paused !== 'boolean') {
    return null;
  }
  const numbers = [cam.yawDeg, cam.pitchDeg, cam.zoom, cam.pivotX, cam.pivotZ];
  if (!numbers.every((n) => typeof n === 'number' && Number.isFinite(n))) {
    return null;
  }
  return {
    kind: 'testRange',
    simulation: { stepCount: sim.stepCount, speedIndex: sim.speedIndex, paused: sim.paused },
    camera: {
      yawDeg: cam.yawDeg as number,
      pitchDeg: cam.pitchDeg as number,
      zoom: cam.zoom as number,
      pivotX: cam.pivotX as number,
      pivotZ: cam.pivotZ as number,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
