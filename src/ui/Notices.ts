import { element } from './dom';

/** Transient messages for errors and confirmations. Messages are text-only and expire automatically. */
export class Notices {
  private readonly container: HTMLElement;
  private readonly timers = new Set<number>();

  constructor(host: HTMLElement) {
    this.container = element('div', { className: 'notices', attrs: { role: 'region', 'aria-label': 'Notifications', 'aria-live': 'polite' } });
    host.appendChild(this.container);
  }

  show(message: string, tone: 'info' | 'error' = 'info', durationMs = 6000): void {
    const item = element('div', { className: `notice notice--${tone}`, text: message, attrs: { role: tone === 'error' ? 'alert' : 'status' } });
    this.container.appendChild(item);
    const timer = window.setTimeout(() => {
      item.remove();
      this.timers.delete(timer);
    }, durationMs);
    this.timers.add(timer);
  }

  dispose(): void {
    for (const timer of this.timers) {
      window.clearTimeout(timer);
    }
    this.timers.clear();
    this.container.remove();
  }
}
