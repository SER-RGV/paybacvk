import type { Scene } from '../../core/SceneManager';
import type { AppServices } from '../../core/services';
import { SETTINGS } from '../../data/tuning';
import { button, element } from '../dom';
import type { SettingKey } from '../../core/SettingsStore';

const ROWS: ReadonlyArray<{ key: SettingKey; label: string }> = [
  { key: 'cameraPanSpeed', label: 'Camera pan speed' },
  { key: 'cameraRotateSpeed', label: 'Camera rotation speed' },
  { key: 'cameraZoomSpeed', label: 'Camera zoom speed' },
];

/** Settings screen. Changes are saved as soon as they are made. */
export class SettingsScene implements Scene {
  private root: HTMLElement | null = null;

  constructor(private readonly services: AppServices, private readonly host: HTMLElement) {}

  enter(): void {
    const settings = this.services.settings;
    const sliders = ROWS.map(({ key, label }) => {
      const output = element('output', { className: 'settings__value', text: formatPercent(settings.get(key)) });
      const input = element('input', {
        attrs: {
          type: 'range',
          min: String(SETTINGS.min),
          max: String(SETTINGS.max),
          step: String(SETTINGS.step),
          value: String(settings.get(key)),
          id: `setting-${key}`,
          'data-testid': `setting-${key}`,
        },
      });
      input.addEventListener('input', () => {
        const value = Number(input.value);
        if (settings.set(key, value)) {
          output.textContent = formatPercent(settings.get(key));
        }
      });
      return element('div', { className: 'settings__row' }, [
        element('label', { className: 'settings__label', text: label, attrs: { for: `setting-${key}` } }),
        input,
        output,
      ]);
    });

    this.root = element('main', { className: 'screen screen--settings', attrs: { 'data-testid': 'settings' } }, [
      element('h1', { className: 'screen__title', text: 'Settings' }),
      element('section', { className: 'settings', attrs: { 'aria-label': 'Camera settings' } }, sliders),
      element('p', { className: 'screen__footer', text: 'Changes are saved automatically in this browser.' }),
      element('div', { className: 'menu menu--row' }, [
        button('Reset to defaults', () => this.resetAndRefresh(), { attrs: { 'data-testid': 'settings-reset' } }),
        button('Back', () => this.services.navigate('mainMenu'), { attrs: { 'data-testid': 'settings-back' } }),
      ]),
    ]);
    this.host.appendChild(this.root);
  }

  update(): void {
    // Settings have no simulation.
  }

  render(): void {
    this.services.renderer.clear();
  }

  exit(): void {
    this.root?.remove();
    this.root = null;
  }

  private resetAndRefresh(): void {
    const settings = this.services.settings;
    settings.reset();
    for (const { key } of ROWS) {
      const input = this.root?.querySelector<HTMLInputElement>(`#setting-${key}`);
      if (input) {
        input.value = String(settings.get(key));
        input.dispatchEvent(new Event('input'));
      }
    }
  }
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
