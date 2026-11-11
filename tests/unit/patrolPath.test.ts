import { describe, expect, it } from 'vitest';
import { pointOnLoop } from '../../src/tactical/patrolPath';
import { TEST_RANGE } from '../../src/data/testRange';

const square = [
  { x: 0, z: 0 },
  { x: 10, z: 0 },
  { x: 10, z: 10 },
  { x: 0, z: 10 },
];

describe('pointOnLoop', () => {
  it('starts at the first waypoint and walks each edge in order', () => {
    expect(pointOnLoop(square, 0)).toEqual({ x: 0, z: 0 });
    expect(pointOnLoop(square, 5)).toEqual({ x: 5, z: 0 });
    expect(pointOnLoop(square, 15)).toEqual({ x: 10, z: 5 });
  });

  it('wraps around the loop', () => {
    const a = pointOnLoop(square, 3);
    const b = pointOnLoop(square, 3 + 40);
    expect(b.x).toBeCloseTo(a.x, 9);
    expect(b.z).toBeCloseTo(a.z, 9);
  });

  it('is a pure function of distance', () => {
    expect(pointOnLoop(square, 12.5)).toEqual(pointOnLoop(square, 12.5));
  });

  it('handles degenerate input', () => {
    expect(pointOnLoop([], 3)).toEqual({ x: 0, z: 0 });
    expect(pointOnLoop([{ x: 2, z: 3 }], 9)).toEqual({ x: 2, z: 3 });
    expect(pointOnLoop(square, Number.NaN)).toEqual({ x: 0, z: 0 });
  });

  it('keeps the test range patrol inside the camera bounds', () => {
    for (let d = 0; d < 300; d += 1) {
      const p = pointOnLoop(TEST_RANGE.patrolPath, d);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(40);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(40);
    }
  });
});
