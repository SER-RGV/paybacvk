import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';

type Events = { ping: { n: number }; pong: string };

describe('EventBus', () => {
  it('delivers typed payloads to subscribers', () => {
    const bus = new EventBus<Events>();
    const ping = vi.fn();
    bus.on('ping', ping);
    bus.emit('ping', { n: 3 });
    expect(ping).toHaveBeenCalledWith({ n: 3 });
  });

  it('unsubscribes with the returned function', () => {
    const bus = new EventBus<Events>();
    const handler = vi.fn();
    const off = bus.on('pong', handler);
    off();
    bus.emit('pong', 'x');
    expect(handler).not.toHaveBeenCalled();
    expect(bus.listenerCount('pong')).toBe(0);
  });

  it('keeps delivering to other listeners when one throws', () => {
    const bus = new EventBus<Events>();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const good = vi.fn();
    bus.on('pong', () => {
      throw new Error('boom');
    });
    bus.on('pong', good);
    bus.emit('pong', 'x');
    expect(good).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('allows a listener to unsubscribe during emit', () => {
    const bus = new EventBus<Events>();
    const second = vi.fn();
    let off: () => void = () => undefined;
    off = bus.on('pong', () => off());
    bus.on('pong', second);
    bus.emit('pong', 'a');
    bus.emit('pong', 'b');
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('clears all listeners', () => {
    const bus = new EventBus<Events>();
    bus.on('ping', () => undefined);
    bus.on('pong', () => undefined);
    expect(bus.listenerCount()).toBe(2);
    bus.clear();
    expect(bus.listenerCount()).toBe(0);
  });
});
