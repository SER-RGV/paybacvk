/**
 * Pure camera geometry. No Three.js import and no DOM, so every function is unit-testable.
 * Angles are degrees. Convention: yaw 0 looks toward -Z; positive yaw orbits clockwise seen from above.
 */

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface GroundRect {
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
}

const DEG = Math.PI / 180;

export function clampZoom(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampPitch(pitchDeg: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, pitchDeg));
}

export function wrapYaw(yawDeg: number): number {
  return ((yawDeg % 360) + 360) % 360;
}

/** steps > 0 zooms out (view grows); steps < 0 zooms in; 0 is a no-op. Fractional steps are allowed. */
export function applyZoomStep(current: number, steps: number, stepRatio: number): number {
  if (steps === 0 || !Number.isFinite(steps)) {
    return current;
  }
  return current * (1 + stepRatio) ** steps;
}

/** Offset from the pivot to the camera. Pitch is the elevation above the ground. */
export function orbitOffset(yawDeg: number, pitchDeg: number, distance: number): Vec3 {
  const yaw = yawDeg * DEG;
  const pitch = pitchDeg * DEG;
  return {
    x: Math.sin(yaw) * Math.cos(pitch) * distance,
    y: Math.sin(pitch) * distance,
    z: Math.cos(yaw) * Math.cos(pitch) * distance,
  };
}

/** Horizontal direction the camera looks along (from camera toward the pivot). */
export function groundForward(yawDeg: number): Vec3 {
  const yaw = yawDeg * DEG;
  return { x: -Math.sin(yaw), y: 0, z: -Math.cos(yaw) };
}

/** Horizontal screen-right direction on the ground plane. */
export function groundRight(yawDeg: number): Vec3 {
  const forward = groundForward(yawDeg);
  return { x: -forward.z, y: 0, z: forward.x };
}

/** input.x: +1 right. input.y: +1 down (screen convention). */
export function panDelta(input: Vec2, yawDeg: number, distance: number): Vec3 {
  const forward = groundForward(yawDeg);
  const right = groundRight(yawDeg);
  return {
    x: (right.x * input.x - forward.x * input.y) * distance,
    y: 0,
    z: (right.z * input.x - forward.z * input.y) * distance,
  };
}

export function clampToBounds(point: Vec3, bounds: GroundRect): Vec3 {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, point.x)),
    y: point.y,
    z: Math.min(bounds.maxZ, Math.max(bounds.minZ, point.z)),
  };
}
