import { describe, expect, it, vi } from 'vitest';
import { SIMULATION } from '../../src/data/tuning';
import { TacticalSimulation, formatSimTime } from '../../src/tactical/TacticalSimulation';

describe('TacticalSimulation', () => {
  it('starts running at 1x with no simulated time', () => {
    const sim = new TacticalSimulation();
    expect(sim.isPaused()).toBe(false);
    expect(sim.getSpeed()).toBe(1);
    expect(sim.getStepCount()).toBe(0);
    expect(sim.getSimTime()).toBe(0);
  });

  it('runs whole fixed steps for real elapsed time', () => {
    const sim = new TacticalSimulation();
    const listener = vi.fn();
    sim.onStep(listener);
    const steps = sim.advance(0.35);
    expect(steps).toBe(3);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith(3, SIMULATION.stepSeconds);
    expect(sim.getSimTime()).toBeCloseTo(0.3, 9);
  });

  it('keeps the sub-step remainder between updates', () => {
    const sim = new TacticalSimulation();
    let total = 0;
    for (let i = 0; i < 10; i += 1) {
      total += sim.advance(0.04);
    }
    expect(total).toBe(4);
    expect(sim.getStepCount()).toBe(4);
  });

  it('does not advance while paused and resumes from the same time', () => {
    const sim = new TacticalSimulation();
    sim.advance(1);
    const before = sim.getStepCount();
    sim.pause();
    expect(sim.advance(5)).toBe(0);
    expect(sim.getStepCount()).toBe(before);
    sim.resume();
    expect(sim.advance(0.1)).toBe(1);
    expect(sim.getStepCount()).toBe(before + 1);
  });

  it('ignores zero, negative, NaN and infinite time', () => {
    const sim = new TacticalSimulation();
    expect(sim.advance(0)).toBe(0);
    expect(sim.advance(-1)).toBe(0);
    expect(sim.advance(Number.NaN)).toBe(0);
    expect(sim.advance(Number.POSITIVE_INFINITY)).toBe(0);
    expect(sim.getStepCount()).toBe(0);
  });

  it('applies discrete speed levels and rejects others', () => {
    const sim = new TacticalSimulation();
    expect(sim.setSpeed(2)).toBe(true);
    expect(sim.getSpeed()).toBe(2);
    expect(sim.setSpeed(3)).toBe(false);
    expect(sim.getSpeed()).toBe(2);
    expect(sim.setSpeedIndex(-1)).toBe(false);
    expect(sim.setSpeedIndex(SIMULATION.speedLevels.length)).toBe(false);
    expect(sim.setSpeedIndex(0.5)).toBe(false);
  });

  it('speeds the clock up and down by level, stopping at the limits', () => {
    const sim = new TacticalSimulation();
    expect(sim.stepSpeed(1)).toBe(true);
    expect(sim.getSpeed()).toBe(2);
    expect(sim.stepSpeed(0)).toBe(false);
    for (let i = 0; i < 10; i += 1) {
      sim.stepSpeed(1);
    }
    expect(sim.getSpeed()).toBe(SIMULATION.speedLevels[SIMULATION.speedLevels.length - 1]);
    for (let i = 0; i < 10; i += 1) {
      sim.stepSpeed(-1);
    }
    expect(sim.getSpeed()).toBe(SIMULATION.speedLevels[0]);
  });

  it('scales simulated time by the speed level', () => {
    const sim = new TacticalSimulation();
    sim.setSpeed(4);
    sim.advance(1);
    expect(sim.getStepCount()).toBe(40);
    expect(sim.getSimTime()).toBeCloseTo(4, 9);
  });

  it('caps the work of one update and drops the excess backlog', () => {
    const sim = new TacticalSimulation();
    sim.setSpeed(4);
    const executed = sim.advance(60);
    expect(executed).toBe(SIMULATION.maxStepsPerUpdate);
    expect(sim.advance(0.0001)).toBe(0);
  });

  it('is reproducible for the same input sequence', () => {
    const run = (): number[] => {
      const sim = new TacticalSimulation();
      const inputs = [0.016, 0.033, 0.1, 0.25, 0.007, 0.5];
      const out: number[] = [];
      inputs.forEach((dt, index) => {
        if (index === 2) {
          sim.setSpeed(2);
        }
        if (index === 4) {
          sim.pause();
        }
        if (index === 5) {
          sim.resume();
        }
        sim.advance(dt);
        out.push(sim.getStepCount());
      });
      return out;
    };
    expect(run()).toEqual(run());
  });

  it('emits state changes only when something actually changed', () => {
    const sim = new TacticalSimulation();
    const listener = vi.fn();
    sim.onStateChange(listener);
    sim.pause();
    sim.pause();
    sim.resume();
    sim.setSpeedIndex(SIMULATION.defaultSpeedIndex);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ paused: true });
  });

  it('unsubscribes listeners', () => {
    const sim = new TacticalSimulation();
    const listener = vi.fn();
    const unsubscribe = sim.onStep(listener);
    unsubscribe();
    sim.advance(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('restores a validated snapshot and rejects invalid ones', () => {
    const sim = new TacticalSimulation();
    expect(sim.restore({ stepCount: 120, speedIndex: 2, paused: true })).toBe(true);
    expect(sim.getStepCount()).toBe(120);
    expect(sim.getSpeed()).toBe(SIMULATION.speedLevels[2]);
    expect(sim.isPaused()).toBe(true);
    expect(sim.restore({ stepCount: -1, speedIndex: 0, paused: false })).toBe(false);
    expect(sim.restore({ stepCount: 1.5, speedIndex: 0, paused: false })).toBe(false);
    expect(sim.restore({ stepCount: 1, speedIndex: 9, paused: false })).toBe(false);
    expect(sim.getStepCount()).toBe(120);
  });
});

describe('formatSimTime', () => {
  it('formats minutes, seconds and tenths', () => {
    expect(formatSimTime(0)).toBe('00:00.0');
    expect(formatSimTime(12.34)).toBe('00:12.3');
    expect(formatSimTime(125.9)).toBe('02:05.9');
  });

  it('treats negative input as zero', () => {
    expect(formatSimTime(-5)).toBe('00:00.0');
  });
});
