import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import type { AppEvents } from '../../src/core/events';
import { GameState } from '../../src/core/GameState';
import { SceneManager, type Scene } from '../../src/core/SceneManager';

function fakeScene(log: string[], name: string): Scene {
  return {
    enter: () => log.push(`${name}:enter`),
    update: () => log.push(`${name}:update`),
    render: () => log.push(`${name}:render`),
    exit: () => log.push(`${name}:exit`),
  };
}

function setup(): { manager: SceneManager; log: string[]; events: EventBus<AppEvents>; state: GameState } {
  const state = new GameState();
  const events = new EventBus<AppEvents>();
  const manager = new SceneManager(state, events);
  const log: string[] = [];
  manager.register('mainMenu', () => fakeScene(log, 'menu'));
  manager.register('testRange', () => fakeScene(log, 'range'));
  return { manager, log, events, state };
}

describe('SceneManager', () => {
  it('enters a scene and exits the previous one before entering the next', () => {
    const { manager, log } = setup();
    expect(manager.switchTo('mainMenu')).toBe(true);
    expect(manager.switchTo('testRange')).toBe(true);
    expect(log).toEqual(['menu:enter', 'menu:exit', 'range:enter']);
    expect(manager.current).toBe('testRange');
  });

  it('rejects unknown ids and keeps the current scene active', () => {
    const { manager, log, events } = setup();
    const errors = vi.fn();
    events.on('error', errors);
    manager.switchTo('mainMenu');
    expect(manager.switchTo('nonexistent')).toBe(false);
    expect(manager.current).toBe('mainMenu');
    expect(errors).toHaveBeenCalledTimes(1);
    expect(log).toEqual(['menu:enter']);
  });

  it('creates a new instance on every switch so nothing survives a switch', () => {
    const state = new GameState();
    const events = new EventBus<AppEvents>();
    const manager = new SceneManager(state, events);
    const factory = vi.fn(() => ({ enter: () => undefined, update: () => undefined, render: () => undefined, exit: () => undefined }));
    manager.register('testRange', factory);
    manager.switchTo('testRange');
    manager.switchTo('testRange');
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('applies a requested switch before the next update', () => {
    const { manager, log } = setup();
    manager.switchTo('mainMenu');
    manager.requestSwitch('testRange');
    manager.update(0.016);
    manager.render();
    expect(log).toEqual(['menu:enter', 'menu:exit', 'range:enter', 'range:update', 'range:render']);
  });

  it('reports a failing enter, leaves no active scene and does not throw', () => {
    const state = new GameState();
    const events = new EventBus<AppEvents>();
    const manager = new SceneManager(state, events);
    const errors = vi.fn();
    events.on('error', errors);
    manager.register('testRange', () => ({
      enter: () => {
        throw new Error('no gpu');
      },
      update: () => undefined,
      render: () => undefined,
      exit: () => undefined,
    }));
    expect(manager.switchTo('testRange')).toBe(false);
    expect(manager.current).toBeNull();
    expect(errors).toHaveBeenCalledTimes(1);
  });

  it('keeps going when exit throws', () => {
    const { manager, events } = setup();
    const errors = vi.fn();
    events.on('error', errors);
    manager.register('settings', () => ({
      enter: () => undefined,
      update: () => undefined,
      render: () => undefined,
      exit: () => {
        throw new Error('cleanup');
      },
    }));
    manager.switchTo('settings');
    expect(manager.switchTo('mainMenu')).toBe(true);
    expect(errors).toHaveBeenCalledTimes(1);
  });

  it('refuses duplicate registration', () => {
    const { manager } = setup();
    expect(() => manager.register('mainMenu', () => fakeScene([], 'x'))).toThrow();
  });

  it('shutdown exits the active scene and clears the state', () => {
    const { manager, log, state } = setup();
    manager.switchTo('testRange');
    manager.shutdown();
    expect(log.at(-1)).toBe('range:exit');
    expect(state.current).toBeNull();
  });
});
