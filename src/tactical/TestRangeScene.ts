import * as THREE from 'three';
import type { Scene } from '../core/SceneManager';
import type { AppServices, NavigationOptions } from '../core/services';
import type { TestRangeSave } from '../core/SaveData';
import { IsoCamera } from '../engine/IsoCamera';
import { World } from '../engine/World';
import { Hud } from '../ui/hud/Hud';
import { TEST_RANGE } from '../data/testRange';
import type { Action } from '../data/bindings';
import { TacticalSimulation } from './TacticalSimulation';
import { pointOnLoop } from './patrolPath';

const STATS_INTERVAL_SECONDS = 0.25;

/**
 * The Test Range: a sandbox that exercises the fixed-step simulation, the isometric camera, the HUD
 * and save/load. Simulation runs only in update() and is frozen while paused. Rendering and the
 * camera keep running while paused so the view stays usable.
 */
export class TestRangeScene implements Scene {
  private sim: TacticalSimulation | null = null;
  private world: World | null = null;
  private camera: IsoCamera | null = null;
  private hud: Hud | null = null;
  private marker: THREE.Mesh | null = null;
  private unsubscribe: (() => void) | null = null;
  private statsTimer = 0;
  private fps = 0;
  private fpsWindow = 0;
  private fpsFrames = 0;

  constructor(
    private readonly services: AppServices,
    private readonly screenHost: HTMLElement,
    private readonly options: NavigationOptions = {},
  ) {}

  enter(): void {
    const sim = new TacticalSimulation();
    const world = new World(TEST_RANGE);
    const marker = createMarker();
    world.add(marker);
    const camera = new IsoCamera();
    const viewport = this.services.renderer.size;
    camera.setViewport(viewport.width, viewport.height);
    const hud = new Hud(this.screenHost, {
      onTogglePause: () => this.togglePause(),
      onSlower: () => this.changeSpeed(-1),
      onFaster: () => this.changeSpeed(1),
      onSave: () => this.save(),
      onLoad: () => this.load(),
      onMenu: () => this.services.navigate('mainMenu'),
    });
    this.sim = sim;
    this.world = world;
    this.marker = marker;
    this.camera = camera;
    this.hud = hud;
    this.unsubscribe = sim.onStateChange((state) => {
      hud.setSimulation(state);
      this.services.events.emit('simulationStateChanged', { paused: state.paused, speed: state.speed });
    });
    hud.setSimulation(sim.getState());
    hud.setCamera(camera.getState());
    this.updateMarker();
    if (this.options.loadSave) {
      this.load();
    }
  }

  update(deltaSeconds: number): void {
    const sim = this.sim;
    const camera = this.camera;
    if (!sim || !camera) {
      return;
    }
    const frame = this.services.input.readFrame();
    for (const action of frame.pressed) {
      this.handleAction(action);
    }
    const settings = this.services.settings;
    camera.applyInput(frame, deltaSeconds, {
      pan: settings.get('cameraPanSpeed'),
      rotate: settings.get('cameraRotateSpeed'),
      zoom: settings.get('cameraZoomSpeed'),
    });
    sim.advance(deltaSeconds);
    this.updateMarker();
    this.hud?.setSimulation(sim.getState());
    this.hud?.setCamera(camera.getState());
    this.updateStats(deltaSeconds);
  }

  render(): void {
    const world = this.world;
    const camera = this.camera;
    if (!world || !camera) {
      this.services.renderer.clear();
      return;
    }
    const viewport = this.services.renderer.size;
    camera.setViewport(viewport.width, viewport.height);
    this.services.renderer.render(world.scene, camera.camera);
  }

  exit(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.hud?.dispose();
    this.hud = null;
    this.world?.dispose();
    this.world = null;
    this.marker = null;
    this.camera = null;
    this.sim = null;
  }

  private handleAction(action: Action): void {
    switch (action) {
      case 'togglePause':
        this.togglePause();
        break;
      case 'speedUp':
        this.changeSpeed(1);
        break;
      case 'speedDown':
        this.changeSpeed(-1);
        break;
      case 'back':
        this.services.navigate('mainMenu');
        break;
      default:
        break;
    }
  }

  private togglePause(): void {
    this.sim?.togglePause();
  }

  private changeSpeed(direction: number): void {
    this.sim?.stepSpeed(direction);
  }

  private save(): void {
    const sim = this.sim;
    const camera = this.camera;
    if (!sim || !camera || !this.hud) {
      return;
    }
    const state = sim.getState();
    const save: TestRangeSave = {
      kind: 'testRange',
      simulation: { stepCount: sim.getStepCount(), speedIndex: state.speedIndex, paused: state.paused },
      camera: camera.getState(),
    };
    const error = this.services.saves.writeTestRange(save);
    if (error) {
      this.hud.showMessage(error, 'error');
      this.services.events.emit('error', { message: error });
    } else {
      this.hud.showMessage('Test range saved.');
    }
  }

  private load(): void {
    const sim = this.sim;
    const camera = this.camera;
    if (!sim || !camera || !this.hud) {
      return;
    }
    const result = this.services.saves.readTestRange();
    if (!result.ok) {
      const text = result.reason === 'missing' ? 'No saved test range yet. Save first.' : result.reason;
      this.hud.showMessage(text, 'error');
      return;
    }
    const restored = sim.restore({ ...result.save.simulation });
    camera.restore(result.save.camera);
    this.updateMarker();
    this.hud.setCamera(camera.getState());
    this.hud.showMessage(restored ? 'Test range loaded.' : 'The save had invalid simulation values.', restored ? 'info' : 'error');
  }

  private updateMarker(): void {
    const sim = this.sim;
    if (!sim || !this.marker) {
      return;
    }
    const distance = sim.getSimTime() * TEST_RANGE.patrolSpeed;
    const point = pointOnLoop(TEST_RANGE.patrolPath, distance);
    this.marker.position.set(point.x, 0.8, point.z);
  }

  private updateStats(deltaSeconds: number): void {
    this.fpsWindow += deltaSeconds;
    this.fpsFrames += 1;
    this.statsTimer += deltaSeconds;
    if (this.fpsWindow >= 0.5) {
      this.fps = this.fpsFrames / this.fpsWindow;
      this.fpsWindow = 0;
      this.fpsFrames = 0;
    }
    if (this.statsTimer < STATS_INTERVAL_SECONDS || !this.hud) {
      return;
    }
    this.statsTimer = 0;
    const stats = this.services.renderer.stats();
    this.hud.setStats({ fps: this.fps, geometries: stats.geometries, textures: stats.textures, drawCalls: stats.drawCalls });
  }

}

function createMarker(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 1.6, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.1 }),
  );
  mesh.castShadow = true;
  mesh.name = 'test-range-marker';
  return mesh;
}
