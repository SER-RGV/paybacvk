/** Identifiers of every screen the application can show. */
export type ScreenId = 'mainMenu' | 'settings' | 'testRange';

/**
 * Application-level state: which screen is active and which one came before.
 * Written only by SceneManager. Tactical simulation state belongs to TacticalSimulation.
 */
export class GameState {
  private currentScreen: ScreenId | null = null;
  private previousScreen: ScreenId | null = null;

  get current(): ScreenId | null {
    return this.currentScreen;
  }

  get previous(): ScreenId | null {
    return this.previousScreen;
  }

  setScreen(screen: ScreenId | null): void {
    if (screen === this.currentScreen) {
      return;
    }
    this.previousScreen = this.currentScreen;
    this.currentScreen = screen;
  }
}
