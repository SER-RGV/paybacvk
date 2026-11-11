import { describe, expect, it, vi } from 'vitest';
import { GameLoop, type FrameSource } from '../../src/core/GameLoop';
import { FRAME } from '../../src/data/tuning';

function manualFrames(): FrameSource & { pending: ((t: number) => void) | null; cancelled: number[]; requests: number } {
  const source = {
    pending: null as ((t: number) => void) | null,
    cancelled: [] as number[],
    requests: 0,
    request(callback: (t: number) => void): number {
      source.requests += 1;
      source.pending = callback;
      return 7;
    },
    cancel(handle: number): void {
      source.cancelled.push(handle);
      source.pending = null;
    },
  };
  return source;
}

describe('GameLoop', () => {
  it('passes real elapsed seconds and clamps long stalls', () => {
    const frames = manualFrames();
    const onFrame = vi.fn();
    const loop = new GameLoop(onFrame, frames);
    loop.start();
    frames.pending?.(1000);
    frames.pending?.(1016);
    frames.pending?.(1016 + 60_000);
    expect(onFrame).toHaveBeenNthCalledWith(1, 0);
    expect(onFrame.mock.calls[1]?.[0]).toBeCloseTo(0.016, 9);
    expect(onFrame.mock.calls[2]?.[0]).toBe(FRAME.maxDeltaSeconds);
  });

  it('does not schedule another frame when stopped inside onFrame', () => {
    const frames = manualFrames();
    const loop = new GameLoop(() => loop.stop(), frames);
    loop.start();
    frames.pending?.(0);
    expect(loop.running).toBe(false);
    expect(frames.requests).toBe(1);
  });

  it('cancels the pending frame on stop and can restart cleanly', () => {
    const frames = manualFrames();
    const onFrame = vi.fn();
    const loop = new GameLoop(onFrame, frames);
    loop.start();
    loop.stop();
    expect(frames.cancelled).toEqual([7]);
    loop.start();
    expect(loop.running).toBe(true);
    frames.pending?.(0);
    expect(onFrame).toHaveBeenCalledTimes(1);
  });

  it('ignores ticks while stopped', () => {
    const onFrame = vi.fn();
    const loop = new GameLoop(onFrame, manualFrames());
    loop.tick(100);
    expect(onFrame).not.toHaveBeenCalled();
  });
});
