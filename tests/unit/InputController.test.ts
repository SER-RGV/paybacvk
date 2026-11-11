import { describe, expect, it } from 'vitest';
import { applyDeadzone } from '../../src/core/InputController';
import { GAMEPAD } from '../../src/data/tuning';
import { KEY_BINDINGS } from '../../src/data/bindings';

describe('applyDeadzone', () => {
  it('zeroes values inside the deadzone', () => {
    expect(applyDeadzone(0.05)).toBe(0);
    expect(applyDeadzone(-GAMEPAD.deadzone / 2)).toBe(0);
    expect(applyDeadzone(Number.NaN)).toBe(0);
  });

  it('rescales values outside the deadzone to reach full range', () => {
    expect(applyDeadzone(1)).toBeCloseTo(1, 9);
    expect(applyDeadzone(-1)).toBeCloseTo(-1, 9);
    expect(applyDeadzone(GAMEPAD.deadzone + 0.001)).toBeCloseTo(0, 2);
    expect(applyDeadzone(0.5)).toBeGreaterThan(0);
    expect(applyDeadzone(0.5)).toBeLessThan(0.5);
  });
});

describe('key bindings', () => {
  it('maps every movement action to at least one key', () => {
    const actions = new Set(Object.values(KEY_BINDINGS));
    for (const action of ['panUp', 'panDown', 'panLeft', 'panRight', 'rotateLeft', 'rotateRight', 'zoomIn', 'zoomOut', 'togglePause', 'speedUp', 'speedDown', 'back']) {
      expect(actions.has(action as never), action).toBe(true);
    }
  });
});
