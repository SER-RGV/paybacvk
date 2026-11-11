import * as THREE from 'three';
import { CAMERA } from '../data/tuning';
import type { InputFrame } from '../core/InputController';
import {
  applyZoomStep,
  clampPitch,
  clampToBounds,
  clampZoom,
  orbitOffset,
  panDelta,
  wrapYaw,
} from './cameraMath';

export interface CameraState {
  readonly yawDeg: number;
  readonly pitchDeg: number;
  readonly zoom: number;
  readonly pivotX: number;
  readonly pivotZ: number;
}

/** Scale factors from the settings screen. 1 means the default speed. */
export interface CameraSensitivity {
  readonly pan: number;
  readonly rotate: number;
  readonly zoom: number;
}

const DEFAULT_STATE: CameraState = {
  yawDeg: CAMERA.defaultYawDeg,
  pitchDeg: CAMERA.defaultPitchDeg,
  zoom: CAMERA.defaultZoom,
  pivotX: 0,
  pivotZ: 0,
};

/**
 * Isometric orthographic camera. The zoom value is the half height of the visible area in world units.
 * Input is applied per frame with real delta time, so it stays responsive while the simulation is paused.
 */
export class IsoCamera {
  readonly camera: THREE.OrthographicCamera;
  private state: CameraState = { ...DEFAULT_STATE };
  private viewWidth = 1;
  private viewHeight = 1;

  constructor() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, CAMERA.near, CAMERA.far);
    this.apply();
  }

  getState(): CameraState {
    return { ...this.state };
  }

  restore(state: CameraState): void {
    this.state = {
      yawDeg: wrapYaw(state.yawDeg),
      pitchDeg: clampPitch(state.pitchDeg, CAMERA.minPitchDeg, CAMERA.maxPitchDeg),
      zoom: clampZoom(state.zoom, CAMERA.minZoom, CAMERA.maxZoom),
      pivotX: clampToBounds({ x: state.pivotX, y: 0, z: 0 }, CAMERA.bounds).x,
      pivotZ: clampToBounds({ x: 0, y: 0, z: state.pivotZ }, CAMERA.bounds).z,
    };
    this.apply();
  }

  reset(): void {
    this.restore(DEFAULT_STATE);
  }

  setViewport(width: number, height: number): void {
    if (width === this.viewWidth && height === this.viewHeight) {
      return;
    }
    this.viewWidth = Math.max(1, width);
    this.viewHeight = Math.max(1, height);
    this.apply();
  }

  /** Applies one frame of input. Pan and rotation scale with delta time; drag and wheel are per-event. */
  applyInput(input: InputFrame, deltaSeconds: number, sensitivity: CameraSensitivity): void {
    const dt = Math.max(0, deltaSeconds);
    const zoomScale = this.state.zoom / CAMERA.defaultZoom;

    // Keyboard and stick pan: world units per second, scaled so the apparent speed stays constant on zoom.
    const panSpeed = CAMERA.basePanSpeed * zoomScale * sensitivity.pan * dt;
    let pivotX = this.state.pivotX;
    let pivotZ = this.state.pivotZ;
    if (input.pan.x !== 0 || input.pan.y !== 0) {
      const delta = panDelta(input.pan, this.state.yawDeg, panSpeed);
      pivotX += delta.x;
      pivotZ += delta.z;
    }
    // Middle-drag pan: convert pixels to world units using the visible height.
    if (input.panPixels.x !== 0 || input.panPixels.y !== 0) {
      const worldPerPixel = (this.state.zoom * 2) / this.viewHeight;
      const delta = panDelta(
        { x: -input.panPixels.x, y: -input.panPixels.y },
        this.state.yawDeg,
        worldPerPixel,
      );
      pivotX += delta.x;
      pivotZ += delta.z;
    }
    const bounded = clampToBounds({ x: pivotX, y: 0, z: pivotZ }, CAMERA.bounds);

    // Yaw from keys, stick and right-drag.
    let yaw = this.state.yawDeg;
    yaw += input.rotate * CAMERA.baseRotateSpeedDeg * sensitivity.rotate * dt;
    yaw += input.orbitPixels.x * CAMERA.dragYawDegPerPixel * sensitivity.rotate;
    let pitch = this.state.pitchDeg - input.orbitPixels.y * CAMERA.dragPitchDegPerPixel * sensitivity.rotate;
    pitch = clampPitch(pitch, CAMERA.minPitchDeg, CAMERA.maxPitchDeg);

    // Zoom from wheel steps (discrete) and held keys or triggers (continuous).
    const ratio = CAMERA.zoomStepRatio * sensitivity.zoom;
    let zoom = applyZoomStep(this.state.zoom, input.zoomSteps, ratio);
    zoom = applyZoomStep(zoom, input.zoomRate * CAMERA.zoomRatePerSecond * dt, ratio);

    this.state = {
      yawDeg: wrapYaw(yaw),
      pitchDeg: pitch,
      zoom: clampZoom(zoom, CAMERA.minZoom, CAMERA.maxZoom),
      pivotX: bounded.x,
      pivotZ: bounded.z,
    };
    this.apply();
  }

  private apply(): void {
    const aspect = this.viewWidth / this.viewHeight;
    const halfHeight = this.state.zoom;
    const halfWidth = halfHeight * aspect;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();

    const offset = orbitOffset(this.state.yawDeg, this.state.pitchDeg, CAMERA.distance);
    this.camera.position.set(this.state.pivotX + offset.x, offset.y, this.state.pivotZ + offset.z);
    this.camera.lookAt(this.state.pivotX, 0, this.state.pivotZ);
    this.camera.updateMatrixWorld();
  }
}
