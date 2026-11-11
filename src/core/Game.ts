import { Renderer, WebGLUnavailableError } from '../engine/Renderer';
import { describeError } from '../utils/errors';
import { element, button } from '../ui/dom';
import { Notices } from '../ui/Notices';
import { MainMenuScene } from '../ui/screens/MainMenuScene';
import { SettingsScene } from '../ui/screens/SettingsScene';
import { TestRangeScene } from '../tactical/TestRangeScene';
import { EventBus } from './EventBus';
import type { AppEvents } from './events';
import { GameLoop } from './GameLoop';
import { GameState, type ScreenId } from './GameState';
import { InputController } from './InputController';
import { SaveRepository } from './SaveRepository';
import { SceneManager } from './SceneManager';
import type { AppServices, NavigationOptions } from './services';
import { SettingsStore } from './SettingsStore';
import { getBrowserStorage } from './storage';

/**
 * Composition root. Creates the long-lived services, registers the scenes and runs the loop.
 * Any unhandled error stops the loop, releases the renderer and shows an error panel with a reload action.
 */
export class Game {
  private readonly events = new EventBus<AppEvents>();
  private readonly state = new GameState();
  private readonly settings: SettingsStore;
  private readonly saves: SaveRepository;
  private renderer: Renderer | null = null;
  private input: InputController | null = null;
  private sceneManager: SceneManager | null = null;
  private loop: GameLoop | null = null;
  private notices: Notices | null = null;
  private navigationOptions: NavigationOptions = {};
  private failed = false;
  private disposed = false;

  constructor(private readonly root: HTMLElement) {
    const storage = getBrowserStorage();
    this.settings = new SettingsStore(storage, this.events);
    this.saves = new SaveRepository(storage);
  }

  /** Builds the application and enters the main menu. Errors are shown in the page, not thrown. */
  async start(): Promise<void> {
    this.root.replaceChildren(element('div', { className: 'status', text: 'Loading…', attrs: { role: 'status' } }));
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    try {
      this.build();
      this.loop?.start();
    } catch (error) {
      this.fail(error);
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.teardown();
    this.root.replaceChildren();
  }

  private build(): void {
    const stage = element('div', { className: 'stage' });
    const screens = element('div', { className: 'screens' });
    this.root.replaceChildren(stage, screens);
    this.renderer = new Renderer(stage);
    this.renderer.onContextLoss(() => this.fail(new Error('The graphics context was lost. Reload the page to continue.')));
    this.notices = new Notices(this.root);
    this.events.on('error', (payload) => this.notices?.show(payload.message, 'error'));
    this.settings.load();
    this.input = new InputController(this.renderer.canvas);
    this.sceneManager = new SceneManager(this.state, this.events);

    const services: AppServices = {
      events: this.events,
      settings: this.settings,
      saves: this.saves,
      renderer: this.renderer,
      input: this.input,
      navigate: (screen: ScreenId, options?: NavigationOptions) => {
        this.navigationOptions = options ?? {};
        this.sceneManager?.requestSwitch(screen);
      },
      takeNavigationOptions: () => {
        const options = this.navigationOptions;
        this.navigationOptions = {};
        return options;
      },
    };
    const host = screens;
    this.sceneManager.register('mainMenu', () => new MainMenuScene(services, host));
    this.sceneManager.register('settings', () => new SettingsScene(services, host));
    this.sceneManager.register('testRange', () => new TestRangeScene(services, host, services.takeNavigationOptions()));
    this.loop = new GameLoop((delta) => this.frame(delta));
    if (!this.sceneManager.switchTo('mainMenu')) {
      throw new Error('The main menu could not be opened.');
    }
  }

  private frame(deltaSeconds: number): void {
    try {
      this.sceneManager?.update(deltaSeconds);
      this.sceneManager?.render();
    } catch (error) {
      this.fail(error);
    }
  }

  private fail(error: unknown): void {
    if (this.failed || this.disposed) {
      return;
    }
    this.failed = true;
    console.error(error);
    this.teardown();
    const message = error instanceof WebGLUnavailableError ? error.message : describeError(error);
    this.root.replaceChildren(
      element('section', { className: 'status status--error', attrs: { role: 'alert', 'data-testid': 'fatal-error' } }, [
        element('h1', { className: 'status__title', text: 'The game stopped' }),
        element('p', { className: 'status__text', text: message }),
        button('Reload', () => window.location.reload(), { attrs: { 'data-testid': 'btn-reload' } }),
      ]),
    );
  }

  private teardown(): void {
    this.loop?.stop();
    this.loop = null;
    this.sceneManager?.shutdown();
    this.sceneManager = null;
    this.input?.dispose();
    this.input = null;
    this.notices?.dispose();
    this.notices = null;
    this.renderer?.dispose();
    this.renderer = null;
  }
}
