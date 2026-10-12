import * as THREE from 'three';
import { LANE_WIDTH } from '../entities/LunaCharacter';

export enum ObstacleType {
  BROKEN_BRIDGE = 'BROKEN_BRIDGE',
  RUINED_PILLAR = 'RUINED_PILLAR',
  LOW_ARCH = 'LOW_ARCH',
  CRUMBLING_PLATFORM = 'CRUMBLING_PLATFORM',
  MOVING_OBSTACLE = 'MOVING_OBSTACLE'
}

export interface ObstacleInstance {
  type: ObstacleType;
  mesh: THREE.Group;
  lane: number;           // -1, 0, 1
  zPos: number;
  width: number;
  height: number;
  depth: number;
  cleared: boolean;
  active: boolean;

  // Behaviors
  crumbleProgress: number; // 0 to 1
  isCrumbling: boolean;
  oscillationTime: number;
  baseLaneX: number;
}

export class ObstaclePool {
  private scene: THREE.Scene;
  private pools: Map<ObstacleType, ObstacleInstance[]> = new Map();

  // Shared Materials
  private pillarMat: THREE.MeshStandardMaterial;
  private archMat: THREE.MeshStandardMaterial;
  private platformMat: THREE.MeshStandardMaterial;
  private movingMat: THREE.MeshStandardMaterial;
  private runeMat: THREE.MeshBasicMaterial;
  private chasmVoidMat: THREE.MeshBasicMaterial;
  private chasmBorderMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, metalness: 0.1 });
    this.archMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.2 });
    this.platformMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    this.movingMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.35, metalness: 0.7 });
    this.runeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.chasmVoidMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    this.chasmBorderMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    Object.values(ObstacleType).forEach(t => this.pools.set(t as ObstacleType, []));
  }

  public obtain(type: ObstacleType, lane: number, zPos: number): ObstacleInstance {
    const list = this.pools.get(type)!;
    let obs = list.find(o => !o.active);

    if (!obs) {
      obs = this.createInstance(type);
      list.push(obs);
      this.scene.add(obs.mesh);
    }

    obs.active = true;
    obs.cleared = false;
    obs.lane = lane;
    obs.zPos = zPos;
    obs.crumbleProgress = 0;
    obs.isCrumbling = false;
    obs.oscillationTime = Math.random() * Math.PI * 2;
    obs.baseLaneX = lane * LANE_WIDTH;

    obs.mesh.visible = true;
    obs.mesh.position.set(type === ObstacleType.BROKEN_BRIDGE || type === ObstacleType.LOW_ARCH ? 0 : lane * LANE_WIDTH, 0, zPos);
    obs.mesh.rotation.set(0, 0, 0);

    return obs;
  }

  public recycle(obs: ObstacleInstance): void {
    obs.active = false;
    obs.cleared = true;
    obs.mesh.visible = false;
  }

  public clearAll(): void {
    this.pools.forEach(list => {
      list.forEach(obs => {
        obs.active = false;
        obs.cleared = true;
        obs.mesh.visible = false;
      });
    });
  }

  private createInstance(type: ObstacleType): ObstacleInstance {
    switch (type) {
      case ObstacleType.RUINED_PILLAR:
        return this.buildPillar();
      case ObstacleType.LOW_ARCH:
        return this.buildLowArch();
      case ObstacleType.BROKEN_BRIDGE:
        return this.buildBrokenBridge();
      case ObstacleType.CRUMBLING_PLATFORM:
        return this.buildCrumblingPlatform();
      case ObstacleType.MOVING_OBSTACLE:
        return this.buildMovingObstacle();
    }
  }

  private buildPillar(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.6;
    const height = 3.6;
    const depth = 1.2;

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, this.pillarMat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    group.add(mesh);

    // Glowing ancient rune carving
    const runeGeo = new THREE.PlaneGeometry(0.8, 1.4);
    const runeMesh = new THREE.Mesh(runeGeo, this.runeMat);
    runeMesh.position.set(0, height * 0.55, depth / 2 + 0.02);
    group.add(runeMesh);

    return {
      type: ObstacleType.RUINED_PILLAR,
      mesh: group,
      lane: 0,
      zPos: 0,
      width,
      height,
      depth,
      cleared: false,
      active: false,
      crumbleProgress: 0,
      isCrumbling: false,
      oscillationTime: 0,
      baseLaneX: 0
    };
  }

  private buildLowArch(): ObstacleInstance {
    const group = new THREE.Group();
    const width = LANE_WIDTH * 2.8;
    const height = 2.4;
    const depth = 1.0;

    // Top beam (clearance underneath is 1.1m)
    const beamGeo = new THREE.BoxGeometry(width, 1.2, depth);
    const beamMesh = new THREE.Mesh(beamGeo, this.archMat);
    beamMesh.position.y = 1.1 + 0.6;
    beamMesh.castShadow = true;
    group.add(beamMesh);

    // Side pillars
    const sidePillarGeo = new THREE.BoxGeometry(0.5, 2.4, depth);
    const leftPillar = new THREE.Mesh(sidePillarGeo, this.archMat);
    leftPillar.position.set(-width / 2 + 0.25, 1.2, 0);
    group.add(leftPillar);

    const rightPillar = new THREE.Mesh(sidePillarGeo, this.archMat);
    rightPillar.position.set(width / 2 - 0.25, 1.2, 0);
    group.add(rightPillar);

    // Arch glowing runic warning header
    const bannerGeo = new THREE.PlaneGeometry(width * 0.7, 0.4);
    const banner = new THREE.Mesh(bannerGeo, this.runeMat);
    banner.position.set(0, 1.3, depth / 2 + 0.02);
    group.add(banner);

    return {
      type: ObstacleType.LOW_ARCH,
      mesh: group,
      lane: 0,
      zPos: 0,
      width,
      height: 1.2,
      depth,
      cleared: false,
      active: false,
      crumbleProgress: 0,
      isCrumbling: false,
      oscillationTime: 0,
      baseLaneX: 0
    };
  }

  private buildBrokenBridge(): ObstacleInstance {
    const group = new THREE.Group();
    const gapLength = 6.2; // Requires jump
    const trackWidth = LANE_WIDTH * 3.4;

    // 1. Deep Abyss Void Cutout Box covering the gap area
    const abyssGeo = new THREE.BoxGeometry(trackWidth, 4.0, gapLength);
    const abyssMesh = new THREE.Mesh(abyssGeo, this.chasmVoidMat);
    abyssMesh.position.y = -2.01;
    group.add(abyssMesh);

    // 2. Chasm Warning Barrier Runes on both edges
    [-gapLength / 2, gapLength / 2].forEach(edgeZ => {
      const edgeGeo = new THREE.BoxGeometry(trackWidth, 0.25, 0.35);
      const edgeMesh = new THREE.Mesh(edgeGeo, this.chasmBorderMat);
      edgeMesh.position.set(0, 0.12, edgeZ);
      group.add(edgeMesh);
    });

    // 3. Floating jagged stone remnants on sides of pit
    [-trackWidth / 2, trackWidth / 2].forEach(sideX => {
      const rockGeo = new THREE.ConeGeometry(0.6, 1.6, 6);
      const rockMesh = new THREE.Mesh(rockGeo, this.pillarMat);
      rockMesh.position.set(sideX, 0.5, 0);
      group.add(rockMesh);
    });

    return {
      type: ObstacleType.BROKEN_BRIDGE,
      mesh: group,
      lane: 0,
      zPos: 0,
      width: trackWidth,
      height: 8.0,
      depth: gapLength,
      cleared: false,
      active: false,
      crumbleProgress: 0,
      isCrumbling: false,
      oscillationTime: 0,
      baseLaneX: 0
    };
  }

  private buildCrumblingPlatform(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.95;
    const height = 0.45;
    const depth = 3.6;

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, this.platformMat);
    mesh.position.y = 0.22;
    mesh.castShadow = true;
    group.add(mesh);

    // Warning fissure cracks
    const crackGeo = new THREE.PlaneGeometry(width * 0.85, depth * 0.85);
    crackGeo.rotateX(-Math.PI / 2);
    const crackMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
    const crackMesh = new THREE.Mesh(crackGeo, crackMat);
    crackMesh.position.y = 0.46;
    group.add(crackMesh);

    return {
      type: ObstacleType.CRUMBLING_PLATFORM,
      mesh: group,
      lane: 0,
      zPos: 0,
      width,
      height,
      depth,
      cleared: false,
      active: false,
      crumbleProgress: 0,
      isCrumbling: false,
      oscillationTime: 0,
      baseLaneX: 0
    };
  }

  private buildMovingObstacle(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.6;
    const height = 2.8;
    const depth = 1.2;

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, this.movingMat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    group.add(mesh);

    // Glowing core crystal
    const coreGeo = new THREE.OctahedronGeometry(0.5);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = height / 2;
    group.add(core);

    return {
      type: ObstacleType.MOVING_OBSTACLE,
      mesh: group,
      lane: 0,
      zPos: 0,
      width,
      height,
      depth,
      cleared: false,
      active: false,
      crumbleProgress: 0,
      isCrumbling: false,
      oscillationTime: 0,
      baseLaneX: 0
    };
  }
}

export class ObstacleFactory {
  private static scene = new THREE.Scene();
  private static pool = new ObstaclePool(ObstacleFactory.scene);

  public static createLowArch(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.LOW_ARCH, lane, zPos);
  }

  public static createBrokenBridge(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.BROKEN_BRIDGE, lane, zPos);
  }

  public static createPillar(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.RUINED_PILLAR, lane, zPos);
  }

  public static createCrumblingPlatform(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.CRUMBLING_PLATFORM, lane, zPos);
  }

  public static createMovingObstacle(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.MOVING_OBSTACLE, lane, zPos);
  }
}
