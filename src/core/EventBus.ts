/**
 * Typed publish/subscribe hub. Instances are owned by Game and passed to modules explicitly;
 * there is no global singleton, so tests can create isolated buses.
 *
 * A listener that throws is reported with console.error and does not stop other listeners.
 */
export class EventBus<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<(payload: never) => void>>();

  /** Returns an unsubscribe function. Call it when the owner is unmounted. */
  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const stored = handler as (payload: never) => void;
    set.add(stored);
    return () => {
      this.listeners.get(event)?.delete(stored);
    };
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    for (const handler of [...set]) {
      try {
        (handler as (payload: Events[K]) => void)(payload);
      } catch (error) {
        console.error(`EventBus: listener for "${String(event)}" failed.`, error);
      }
    }
  }

  listenerCount(event?: keyof Events): number {
    if (event !== undefined) {
      return this.listeners.get(event)?.size ?? 0;
    }
    let total = 0;
    for (const set of this.listeners.values()) {
      total += set.size;
    }
    return total;
  }

  clear(): void {
    this.listeners.clear();
  }
}
