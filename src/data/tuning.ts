/**
 * Central tuning values. Data only: no behaviour lives here.
 * Engine, simulation and settings modules read these constants; tests may assert against them.
 */

export const SIMULATION = {
  /** Simulated seconds per fixed step. */
  stepSeconds: 0.1,
  /** Discrete speed multipliers. Arbitrary values are rejected. */
  speedLevels: [0.5, 1, 2, 4] as const,
  defaultSpeedIndex: 1,
  /** Upper bound on steps executed by one update. Excess backlog is dropped (no catch-up spiral). */
  maxStepsPerUpdate: 40,
} as const;

export const CAMERA = {
  defaultZoom: 22,
  minZoom: 8,
  maxZoom: 40,
  /** True isometric elevation (about 35.264 degrees). */
  defaultPitchDeg: 35.264,
  minPitchDeg: 20,
  maxPitchDeg: 70,
  defaultYawDeg: 45,
  /** Distance from the pivot to the camera. Orthographic, so it only affects clipping. */
  distance: 100,
  near: 1,
  far: 400,
  basePanSpeed: 12,
  baseRotateSpeedDeg: 90,
  zoomStepRatio: 0.12,
  /** Continuous zoom rate for held keys and triggers, in steps per second. */
  zoomRatePerSecond: 1.5,
  dragYawDegPerPixel: 0.3,
  dragPitchDegPerPixel: 0.2,
  bounds: { minX: -40, minZ: -40, maxX: 40, maxZ: 40 },
} as const;

export const SETTINGS = {
  storageKey: 'umbral.settings',
  /** Increment when the stored shape changes, and add a migration in SettingsStore. */
  schemaVersion: 1,
  min: 0.25,
  max: 3,
  step: 0.05,
  defaults: {
    cameraPanSpeed: 1,
    cameraRotateSpeed: 1,
    cameraZoomSpeed: 1,
  },
} as const;

export const FRAME = {
  /** Longest frame delta accepted, in seconds. Longer gaps (tab switch, debugger) are clamped. */
  maxDeltaSeconds: 0.25,
} as const;

export const GAMEPAD = {
  /** Stick values below this magnitude are treated as zero. */
  deadzone: 0.15,
} as const;
