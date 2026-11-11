import { FRAME } from '../data/tuning';

/** Abstraction over requestAnimationFrame so the loop can be driven deterministically in tests. */
export interface FrameSource {
  request(callback: (timeMs: number) => void): number;
  cancel(handle: number): void;
}

export const browserFrameSource: FrameSource = {
  request: (callback) => window.requestAnimationFrame(callback),
  cancel: (handle) => window.cancelAnimationFrame(handle),
};

/**
 * Calls onFrame once per display frame with the real elapsed seconds since the previous frame.
 * The delta is clamped so a long stall (background tab, debugger) cannot cause a burst of simulation.
 * Only timing lives here: no simulation or rendering logic.
 */
export class GameLoop {
  private active = false;
  private handle: number | null = null;
  private lastTimeMs: number | null = null;

  constructor(
    private readonly onFrame: (deltaSeconds: number) => void,
    private readonly frames: FrameSource = browserFrameSource,
  ) {}

  get running(): boolean {
    return this.active;
  }

  start(): void {
    if (this.active) {
      return;
    }
    this.active = true;
    this.lastTimeMs = null;
    this.schedule();
  }

  stop(): void {
    this.active = false;
    if (this.handle !== null) {
      this.frames.cancel(this.handle);
      this.handle = null;
    }
    this.lastTimeMs = null;
  }

  /** Processes one frame at the given timestamp. Public for deterministic tests. */
  tick(timeMs: number): void {
    if (!this.active) {
      return;
    }
    this.handle = null;
    const previous = this.lastTimeMs;
    this.lastTimeMs = timeMs;
    const rawSeconds = previous === null ? 0 : (timeMs - previous) / 1000;
    const delta = Math.min(Math.max(rawSeconds, 0), FRAME.maxDeltaSeconds);
    this.onFrame(delta);
    // onFrame may call stop(); only reschedule while the loop is still active.
    if (this.running) {
      this.schedule();
    }
  }

  private schedule(): void {
    this.handle = this.frames.request((timeMs) => this.tick(timeMs));
  }
}
