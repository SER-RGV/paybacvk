import type { Scene } from '../../core/SceneManager';
import type { AppServices } from '../../core/services';
import { button, element } from '../dom';

/** Main menu. Every button performs an action that exists in this build. */
export class MainMenuScene implements Scene {
  private root: HTMLElement | null = null;

  constructor(private readonly services: AppServices, private readonly host: HTMLElement) {}

  enter(): void {
    const hasSave = this.services.saves.hasTestRangeSave();
    const buttons: HTMLElement[] = [
      button('Test Range', () => this.services.navigate('testRange'), { attrs: { 'data-testid': 'menu-test-range' } }),
    ];
    if (hasSave) {
      buttons.push(
        button('Continue saved Test Range', () => this.services.navigate('testRange', { loadSave: true }), {
          attrs: { 'data-testid': 'menu-continue' },
        }),
      );
    }
    buttons.push(
      button('Settings', () => this.services.navigate('settings'), { attrs: { 'data-testid': 'menu-settings' } }),
    );

    this.root = element('main', { className: 'screen screen--menu', attrs: { 'data-testid': 'main-menu' } }, [
      element('h1', { className: 'screen__title', text: 'UMBRAL DE ACERO' }),
      element('p', { className: 'screen__subtitle', text: 'Tactical squad campaign. Phase 01: technical foundation.' }),
      element('nav', { className: 'menu', attrs: { 'aria-label': 'Main menu' } }, buttons),
      element('p', { className: 'screen__footer', text: 'Keyboard, mouse and gamepad supported. Settings are saved in this browser.' }),
    ]);
    this.host.appendChild(this.root);
    const first = this.root.querySelector('button');
    first?.focus();
  }

  update(): void {
    // The menu has no simulation.
  }

  render(): void {
    this.services.renderer.clear();
  }

  exit(): void {
    this.root?.remove();
    this.root = null;
  }
}
