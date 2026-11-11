import { describe, expect, it } from 'vitest';
import { CAMERA } from '../../src/data/tuning';
import type { InputFrame } from '../../src/core/InputController';
import { IsoCamera } from '../../src/engine/IsoCamera';

const NONE: InputFrame = {
  pan: { x: 0, y: 0 },
  rotate: 0,
  zoomRate: 0,
  zoomSteps: 0,
  panPixels: { x: 0, y: 0 },
  orbitPixels: { x: 0, y: 0 },
  pressed: [],
};
const SENS = { pan: 1, rotate: 1, zoom: 1 };

describe('IsoCamera', () => {
  it('starts at the documented defaults', () => {
    const cam = new IsoCamera();
    expect(cam.getState()).toMatchObject({
      yawDeg: CAMERA.defaultYawDeg,
      pitchDeg: CAMERA.defaultPitchDeg,
      zoom: CAMERA.defaultZoom,
      pivotX: 0,
      pivotZ: 0,
    });
  });

  it('sets the orthographic frustum from zoom and aspect ratio', () => {
    const cam = new IsoCamera();
    cam.setViewport(1600, 800);
    expect(cam.camera.top).toBeCloseTo(CAMERA.defaultZoom, 9);
    expect(cam.camera.right).toBeCloseTo(CAMERA.defaultZoom * 2, 9);
  });

  it('pans with keyboard input scaled by delta time and sensitivity', () => {
    const cam = new IsoCamera();
    const before = cam.getState();
    cam.applyInput({ ...NONE, pan: { x: 1, y: 0 } }, 0.5, { ...SENS, pan: 2 });
    const after = cam.getState();
    expect(after.pivotX).not.toBeCloseTo(before.pivotX, 3);
    expect(Math.hypot(after.pivotX, after.pivotZ)).toBeCloseTo(CAMERA.basePanSpeed * 2 * 0.5, 6);
  });

  it('does not pan the pivot beyond the bounds', () => {
    const cam = new IsoCamera();
    for (let i = 0; i < 1000; i += 1) {
      cam.applyInput({ ...NONE, pan: { x: 1, y: 1 } }, 0.1, SENS);
    }
    const state = cam.getState();
    expect(Math.abs(state.pivotX)).toBeLessThanOrEqual(CAMERA.bounds.maxX + 1e-9);
    expect(Math.abs(state.pivotZ)).toBeLessThanOrEqual(CAMERA.bounds.maxZ + 1e-9);
  });

  it('rotates yaw from input and wraps it', () => {
    const cam = new IsoCamera();
    cam.applyInput({ ...NONE, rotate: 1 }, 1, SENS);
    expect(cam.getState().yawDeg).toBeCloseTo(CAMERA.defaultYawDeg + CAMERA.baseRotateSpeedDeg, 6);
    for (let i = 0; i < 20; i += 1) {
      cam.applyInput({ ...NONE, rotate: 1 }, 1, SENS);
    }
    expect(cam.getState().yawDeg).toBeGreaterThanOrEqual(0);
    expect(cam.getState().yawDeg).toBeLessThan(360);
  });

  it('clamps pitch while orbiting with the mouse', () => {
    const cam = new IsoCamera();
    cam.applyInput({ ...NONE, orbitPixels: { x: 0, y: 100000 } }, 0.016, SENS);
    expect(cam.getState().pitchDeg).toBe(CAMERA.minPitchDeg);
    cam.applyInput({ ...NONE, orbitPixels: { x: 0, y: -100000 } }, 0.016, SENS);
    expect(cam.getState().pitchDeg).toBe(CAMERA.maxPitchDeg);
  });

  it('zooms by wheel steps and clamps to the zoom range', () => {
    const cam = new IsoCamera();
    cam.applyInput({ ...NONE, zoomSteps: -1 }, 0.016, SENS);
    expect(cam.getState().zoom).toBeLessThan(CAMERA.defaultZoom);
    for (let i = 0; i < 200; i += 1) {
      cam.applyInput({ ...NONE, zoomSteps: 1 }, 0.016, SENS);
    }
    expect(cam.getState().zoom).toBe(CAMERA.maxZoom);
    for (let i = 0; i < 400; i += 1) {
      cam.applyInput({ ...NONE, zoomSteps: -1 }, 0.016, SENS);
    }
    expect(cam.getState().zoom).toBe(CAMERA.minZoom);
  });

  it('zooms continuously with the zoom rate', () => {
    const cam = new IsoCamera();
    cam.applyInput({ ...NONE, zoomRate: 1 }, 1, SENS);
    expect(cam.getState().zoom).toBeGreaterThan(CAMERA.defaultZoom);
  });

  it('restores a state and sanitises out-of-range values', () => {
    const cam = new IsoCamera();
    cam.restore({ yawDeg: -90, pitchDeg: 999, zoom: 1000, pivotX: 500, pivotZ: -500 });
    const state = cam.getState();
    expect(state.yawDeg).toBe(270);
    expect(state.pitchDeg).toBe(CAMERA.maxPitchDeg);
    expect(state.zoom).toBe(CAMERA.maxZoom);
    expect(state.pivotX).toBe(CAMERA.bounds.maxX);
    expect(state.pivotZ).toBe(CAMERA.bounds.minZ);
  });

  it('reset returns to defaults', () => {
    const cam = new IsoCamera();
    cam.applyInput({ ...NONE, rotate: 1, zoomSteps: 3 }, 1, SENS);
    cam.reset();
    expect(cam.getState().zoom).toBe(CAMERA.defaultZoom);
    expect(cam.getState().yawDeg).toBe(CAMERA.defaultYawDeg);
  });
});
