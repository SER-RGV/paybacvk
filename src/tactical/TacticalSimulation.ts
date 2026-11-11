import { SIMULATION } from '../data/tuning';

/**
 * Fixed-step tactical clock: pause, discrete speed levels and a deterministic step counter.
 *
 * Owns: simulated time, step count, pause flag, speed level and the sub-step accumulator.
 * It never reads the real clock and has no DOM or rendering dependency. Callers pass real
 * elapsed seconds into advance(), so the same input sequence always yields the same result.
 */

export interface SimulationState {
  readonly paused: boolean;
  readonly speed: number;
  readonly speedIndex: number;
  readonly simTime: number;
  readonly stepCount: number;
}

export type StepListener = (stepIndex: number, stepSeconds: number) => void;
export type SimulationStateListener = (state: SimulationState) => void;

const EPSILON = 1e-9;

export class TacticalSimulation {
  private paused = false;
  private speedIndex: number = SIMULATION.defaultSpeedIndex;
  private accumulator = 0;
  private steps = 0;
  private readonly stepListeners = new Set<StepListener>();
  private readonly stateListeners = new Set<SimulationStateListener>();

  isPaused(): boolean {
    return this.paused;
  }

  getSpeed(): number {
    return SIMULATION.speedLevels[this.speedIndex] ?? 1;
  }

  getSpeedIndex(): number {
    return this.speedIndex;
  }

  getStepCount(): number {
    return this.steps;
  }

  getSimTime(): number {
    return this.steps * SIMULATION.stepSeconds;
  }

  getState(): SimulationState {
    return {
      paused: this.paused,
      speed: this.getSpeed(),
      speedIndex: this.speedIndex,
      simTime: this.getSimTime(),
      stepCount: this.steps,
    };
  }

  /** Returns an unsubscribe function. */
  onStep(listener: StepListener): () => void {
    this.stepListeners.add(listener);
    return () => this.stepListeners.delete(listener);
  }

  /** Returns an unsubscribe function. Fires only when paused, resumed or speed changes. */
  onStateChange(listener: SimulationStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  pause(): void {
    if (!this.paused) {
      this.paused = true;
      this.emitState();
    }
  }

  resume(): void {
    if (this.paused) {
      this.paused = false;
      this.emitState();
    }
  }

  togglePause(): void {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /** Returns false (and changes nothing) for an out-of-range index. */
  setSpeedIndex(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= SIMULATION.speedLevels.length) {
      return false;
    }
    if (index !== this.speedIndex) {
      this.speedIndex = index;
      this.emitState();
    }
    return true;
  }

  /** Moves one level up (direction > 0) or down (direction < 0). False at a limit or when direction is 0. */
  stepSpeed(direction: number): boolean {
    if (direction === 0 || !Number.isFinite(direction)) {
      return false;
    }
    const target = this.speedIndex + Math.sign(direction);
    if (target < 0 || target >= SIMULATION.speedLevels.length) {
      return false;
    }
    return this.setSpeedIndex(target);
  }

  /** Restores a saved clock. Rejects invalid values without changing anything. */
  restore(snapshot: { stepCount: number; speedIndex: number; paused: boolean }): boolean {
    if (!Number.isInteger(snapshot.stepCount) || snapshot.stepCount < 0) {
      return false;
    }
    if (!Number.isInteger(snapshot.speedIndex) || snapshot.speedIndex < 0 || snapshot.speedIndex >= SIMULATION.speedLevels.length) {
      return false;
    }
    this.steps = snapshot.stepCount;
    this.accumulator = 0;
    this.speedIndex = snapshot.speedIndex;
    this.paused = snapshot.paused;
    this.emitState();
    return true;
  }

  /** Accepts only the discrete speed levels. */
  setSpeed(value: number): boolean {
    const index = SIMULATION.speedLevels.findIndex((level) => Math.abs(level - value) < EPSILON);
    return index >= 0 && this.setSpeedIndex(index);
  }

  /**
   * Advances simulated time by realSeconds * speed and runs whole fixed steps.
   * Returns the number of steps executed. Paused, zero, negative, NaN or infinite input does nothing.
   */
  advance(realSeconds: number): number {
    if (this.paused || !(realSeconds > 0) || !Number.isFinite(realSeconds)) {
      return 0;
    }
    const step = SIMULATION.stepSeconds;
    this.accumulator += realSeconds * this.getSpeed();
    let due = Math.floor(this.accumulator / step + EPSILON);
    if (due > SIMULATION.maxStepsPerUpdate) {
      due = SIMULATION.maxStepsPerUpdate;
      this.accumulator = 0;
    } else {
      this.accumulator = Math.max(0, this.accumulator - due * step);
    }
    for (let i = 0; i < due; i += 1) {
      this.steps += 1;
      for (const listener of this.stepListeners) {
        listener(this.steps, step);
      }
    }
    return due;
  }

  private emitState(): void {
    const state = this.getState();
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }
}

/** Formats simulated seconds as MM:SS.t (tenths, floored). */
export function formatSimTime(seconds: number): string {
  const tenths = Math.floor(Math.max(seconds, 0) * 10 + EPSILON);
  const minutes = Math.floor(tenths / 600);
  const secs = Math.floor(tenths / 10) % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths % 10}`;
}
