export interface GroundPoint {
  readonly x: number;
  readonly z: number;
}

/**
 * Position along a closed loop of waypoints after `distance` units of travel.
 * Pure: the result depends only on the inputs, so pausing the simulation freezes the position.
 */
export function pointOnLoop(waypoints: readonly GroundPoint[], distance: number): GroundPoint {
  const count = waypoints.length;
  const first = waypoints[0];
  if (count === 0 || first === undefined) {
    return { x: 0, z: 0 };
  }
  if (count === 1 || !Number.isFinite(distance)) {
    return { x: first.x, z: first.z };
  }
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    total += segmentLength(waypoints[i] ?? first, waypoints[(i + 1) % count] ?? first);
  }
  if (total === 0) {
    return { x: first.x, z: first.z };
  }
  let remaining = ((distance % total) + total) % total;
  for (let i = 0; i < count; i += 1) {
    const a = waypoints[i] ?? first;
    const b = waypoints[(i + 1) % count] ?? first;
    const length = segmentLength(a, b);
    if (remaining <= length) {
      const t = length === 0 ? 0 : remaining / length;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    remaining -= length;
  }
  return { x: first.x, z: first.z };
}

function segmentLength(a: GroundPoint, b: GroundPoint): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}
