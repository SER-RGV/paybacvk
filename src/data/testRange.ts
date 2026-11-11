import type { GroundPoint } from '../tactical/patrolPath';
import type { ObstacleSpec } from '../engine/World';

/**
 * Layout of the Test Range sandbox: a flat ground with a few obstacles and one patrol marker.
 * It is a playable in-game sandbox for checking camera, simulation and rendering. It is not a
 * tactical map and holds no unit data.
 */
export const TEST_RANGE = {
  groundSize: 80,
  obstacles: [
    { x: -12, z: -6, width: 6, depth: 3, height: 2.2, color: '#6b7280' },
    { x: 8, z: -10, width: 3, depth: 8, height: 3.4, color: '#4b5563' },
    { x: 2, z: 10, width: 10, depth: 2.5, height: 1.4, color: '#78716c' },
    { x: -20, z: 14, width: 4, depth: 4, height: 4.8, color: '#525252' },
    { x: 22, z: 8, width: 2, depth: 2, height: 1.1, color: '#a8a29e' },
  ] satisfies ObstacleSpec[],
  patrolPath: [
    { x: -24, z: -20 },
    { x: 24, z: -20 },
    { x: 24, z: 20 },
    { x: -24, z: 20 },
  ] satisfies GroundPoint[],
  patrolSpeed: 4,
} as const;
