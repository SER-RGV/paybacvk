import * as THREE from 'three';

export interface ObstacleSpec {
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  readonly color: string;
}

export interface WorldLayout {
  /** Side length of the square ground in world units, centred on the origin. */
  readonly groundSize: number;
  readonly obstacles: readonly ObstacleSpec[];
}

/**
 * A 3D world: ground, obstacles, lights. Owns every object it creates and releases all of their
 * geometry, materials, textures and shadow maps in dispose(). Contains no game rules.
 */
export class World {
  readonly scene = new THREE.Scene();
  private readonly root = new THREE.Group();
  private readonly sun: THREE.DirectionalLight;
  private disposed = false;

  constructor(layout: WorldLayout) {
    this.scene.add(this.root);
    this.root.add(new THREE.AmbientLight(0x8fa3b8, 0.55));
    this.sun = new THREE.DirectionalLight(0xfff4e0, 1.9);
    this.sun.position.set(30, 50, 20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -layout.groundSize * 0.7;
    this.sun.shadow.camera.right = layout.groundSize * 0.7;
    this.sun.shadow.camera.top = layout.groundSize * 0.7;
    this.sun.shadow.camera.bottom = -layout.groundSize * 0.7;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 150;
    this.root.add(this.sun);
    this.root.add(this.sun.target);

    this.root.add(createGround(layout.groundSize));
    for (const spec of layout.obstacles) {
      this.root.add(createObstacle(spec));
    }
  }

  add(object: THREE.Object3D): void {
    this.assertLive();
    this.root.add(object);
  }

  remove(object: THREE.Object3D): void {
    this.root.remove(object);
  }

  /** Number of mesh objects currently in the world. Used by tests and the HUD. */
  meshCount(): number {
    let count = 0;
    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        count += 1;
      }
    });
    return count;
  }

  /** Disposes everything owned by this world. Safe to call more than once. */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.scene.remove(this.root);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        const drawable: THREE.Mesh | THREE.LineSegments = object;
        geometries.add(drawable.geometry);
        for (const material of toArray(drawable.material)) {
          collectMaterial(material, materials, textures);
        }
      }
    });
    for (const geometry of geometries) {
      geometry.dispose();
    }
    for (const material of materials) {
      material.dispose();
    }
    for (const texture of textures) {
      texture.dispose();
    }
    this.sun.shadow.map?.dispose();
    this.root.clear();
    this.scene.clear();
  }

  private assertLive(): void {
    if (this.disposed) {
      throw new Error('Cannot add objects to a disposed world.');
    }
  }
}

function createGround(size: number): THREE.Group {
  const group = new THREE.Group();
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color: 0x3b4a3c, roughness: 0.95, metalness: 0 }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  group.add(plane);
  const grid = new THREE.GridHelper(size, size, 0x5d6f5e, 0x4a5b4b);
  grid.position.y = 0.01;
  group.add(grid);
  return group;
}

function createObstacle(spec: ObstacleSpec): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width, spec.height, spec.depth),
    new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.8, metalness: 0.05 }),
  );
  mesh.position.set(spec.x, spec.height / 2, spec.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function toArray<T>(value: T | readonly T[]): readonly T[] {
  return Array.isArray(value) ? (value as readonly T[]) : [value as T];
}

function collectMaterial(material: THREE.Material, materials: Set<THREE.Material>, textures: Set<THREE.Texture>): void {
  materials.add(material);
  const fields: unknown[] = Object.values(material);
  for (const value of fields) {
    if (value instanceof THREE.Texture) {
      textures.add(value as THREE.Texture);
    }
  }
}
