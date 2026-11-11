import { describe, expect, it } from 'vitest';
import {
  applyZoomStep,
  clampPitch,
  clampToBounds,
  clampZoom,
  groundForward,
  groundRight,
  orbitOffset,
  panDelta,
  wrapYaw,
} from '../../src/engine/cameraMath';

const close = (actual: number, expected: number): void => {
  expect(actual).toBeCloseTo(expected, 9);
};

describe('cameraMath', () => {
  it('clamps zoom and pitch to their ranges', () => {
    expect(clampZoom(1, 8, 40)).toBe(8);
    expect(clampZoom(100, 8, 40)).toBe(40);
    expect(clampZoom(20, 8, 40)).toBe(20);
    expect(clampPitch(10, 20, 70)).toBe(20);
    expect(clampPitch(90, 20, 70)).toBe(70);
  });

  it('wraps yaw into the range [0, 360)', () => {
    expect(wrapYaw(370)).toBe(10);
    expect(wrapYaw(-10)).toBe(350);
    expect(wrapYaw(0)).toBe(0);
    expect(wrapYaw(360)).toBe(0);
  });

  it('zooms by compound steps: out for positive, in for negative, none for zero', () => {
    close(applyZoomStep(10, 1, 0.1), 11);
    close(applyZoomStep(10, -1, 0.1), 10 / 1.1);
    expect(applyZoomStep(10, 0, 0.1)).toBe(10);
    expect(applyZoomStep(10, Number.NaN, 0.1)).toBe(10);
    close(applyZoomStep(applyZoomStep(10, 0.5, 0.1), -0.5, 0.1), 10);
  });

  it('places the camera on the isometric elevation at the given distance', () => {
    const offset = orbitOffset(45, 35.264, 100);
    const length = Math.hypot(offset.x, offset.y, offset.z);
    close(length, 100);
    close(Math.asin(offset.y / length) * (180 / Math.PI), 35.264);
  });

  it('keeps the view direction horizontal and perpendicular to right', () => {
    for (const yaw of [0, 45, 90, 200]) {
      const forward = groundForward(yaw);
      const right = groundRight(yaw);
      close(forward.y, 0);
      close(forward.x * right.x + forward.z * right.z, 0);
      close(Math.hypot(forward.x, forward.z), 1);
    }
  });

  it('pans up along the view direction and right along the screen right', () => {
    const forward = groundForward(0);
    const up = panDelta({ x: 0, y: -1 }, 0, 1);
    close(up.x * forward.x + up.z * forward.z, 1);
    const right = panDelta({ x: 1, y: 0 }, 0, 1);
    close(right.x, 1);
    close(right.z, 0);
  });

  it('clamps the pivot to the ground bounds', () => {
    const bounds = { minX: -10, minZ: -10, maxX: 10, maxZ: 10 };
    expect(clampToBounds({ x: 50, y: 0, z: -50 }, bounds)).toEqual({ x: 10, y: 0, z: -10 });
    expect(clampToBounds({ x: 1, y: 2, z: 3 }, bounds)).toEqual({ x: 1, y: 2, z: 3 });
  });
});
