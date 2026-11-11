import { decodeTestRangeSave, encodeTestRangeSave, type DecodeResult, type TestRangeSave } from './SaveData';
import type { KeyValueStorage } from './storage';

export const TEST_RANGE_SAVE_KEY = 'umbral.save.testRange';

export type ReadResult = DecodeResult | { readonly ok: false; readonly reason: 'missing' | 'unavailable' };

/** Reads and writes the test range save slot. Failures are returned as values, never thrown. */
export class SaveRepository {
  constructor(private readonly storage: KeyValueStorage | null) {}

  hasTestRangeSave(): boolean {
    return this.readTestRange().ok;
  }

  readTestRange(): ReadResult {
    if (!this.storage) {
      return { ok: false, reason: 'unavailable' };
    }
    let raw: string | null;
    try {
      raw = this.storage.getItem(TEST_RANGE_SAVE_KEY);
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
    if (raw === null) {
      return { ok: false, reason: 'missing' };
    }
    return decodeTestRangeSave(raw);
  }

  /** Returns an error message on failure, or null on success. */
  writeTestRange(save: TestRangeSave): string | null {
    if (!this.storage) {
      return 'Browser storage is unavailable, so the save was not written.';
    }
    try {
      this.storage.setItem(TEST_RANGE_SAVE_KEY, encodeTestRangeSave(save));
      return null;
    } catch {
      return 'The save could not be written. Storage may be full.';
    }
  }
}
