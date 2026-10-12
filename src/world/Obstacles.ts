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
  lane: number;           // -1, 0, 1 (or -0.5, 0.5 for two-lane blockers)
  zPos: number;
  width: number;
  height: number;
  depth: number;
  cleared: boolean;
  active: boolean;

  // Specific behaviors
  crumbleTimer?: number;
  isCrumbling?: boolean;
  oscillationTime?: number;
  oscillationSpeed?: number;
  baseLaneX?: number;
}

export class ObstacleFactory {
  private static pillarMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.8,
    metalness: 0.1
  });

  private static archMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.2
  });

  private static runeGlowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8
  });

  private static dangerGlowMat = new THREE.MeshBasicMaterial({
    color: 0xf87171
  });

  public static createPillar(lane: number, zPos: number): ObstacleInstance {
    const group = new THREE.Group();
    const height = 3.6;
    const width = 1.6;
    const depth = 1.2;

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, this.pillarMat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    group.add(mesh);

    // Glowing ancient rune carving on front
    const runeGeo = new THREE.PlaneGeometry(0.8, 1.4);
    const runeMesh = new THREE.Mesh(runeGeo, this.runeGlowMat);
    runeMesh.position.set(0, height * 0.55, depth / 2 + 0.02);
    group.add(runeMesh);

    group.position.set(lane * LANE_WIDTH, 0, zPos);

    return {
      type: ObstacleType.RUINED_PILLAR,
      mesh: group,
      lane,
      zPos,
      width,
      height,
      depth,
      cleared: false,
      active: true
    };
  }

  public static createLowArch(lane: number, zPos: number): ObstacleInstance {
    const group = new THREE.Group();
    // Low arch spans the lane or all 3 lanes, but clearance underneath is 1.05m
    // Sliding player is 0.8m height, standing player is 1.6m
    const width = LANE_WIDTH * 2.8;
    const height = 2.4;
    const depth = 1.0;

    // Top beam (player must slide under it)
    const beamGeo = new THREE.BoxGeometry(width, 1.2, depth);
    const beamMesh = new THREE.Mesh(beamGeo, this.archMat);
    beamMesh.position.y = 1.1 + 0.6; // starts at y=1.1m up to y=2.3m
    beamMesh.castShadow = true;
    group.add(beamMesh);

    // Left and right pillars
    const sidePillarGeo = new THREE.BoxGeometry(0.5, 2.4, depth);
    const leftPillar = new THREE.Mesh(sidePillarGeo, this.archMat);
    leftPillar.position.set(-width / 2 + 0.25, 1.2, 0);
    group.add(leftPillar);

    const rightPillar = new THREE.Mesh(sidePillarGeo, this.archMat);
    rightPillar.position.set(width / 2 - 0.25, 1.2, 0);
    group.add(rightPillar);

    group.position.set(0, 0, zPos);

    return {
      type: ObstacleType.LOW_ARCH,
      mesh: group,
      lane: 0, // spans lanes
      zPos,
      width,
      height: 1.2, // height of blocking beam
      depth,
      cleared: false,
      active: true
    };
  }

  public static createBrokenBridge(lane: number, zPos: number): ObstacleInstance {
    const group = new THREE.Group();
    const gapLength = 6.0; // Needs jump to clear

    // Visual warning markers on the edge of the pit
    const markerGeo = new THREE.BoxGeometry(LANE_WIDTH * 3.2, 0.2, 0.4);
    const markerMesh = new THREE.Mesh(markerGeo, this.dangerGlowMat);
    markerMesh.position.set(0, 0.1, -gapLength / 2);
    group.add(markerMesh);

    group.position.set(0, 0, zPos);

    return {
      type: ObstacleType.BROKEN_BRIDGE,
      mesh: group,
      lane: 0,
      zPos,
      width: LANE_WIDTH * 3.2,
      height: 10.0, // pit depth
      depth: gapLength,
      cleared: false,
      active: true
    };
  }

  public static createCrumblingPlatform(lane: number, zPos: number): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.9;
    const height = 0.4;
    const depth = 3.5;

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.9
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.2;
    group.add(mesh);

    // Warning cracks
    const crackGeo = new THREE.PlaneGeometry(width * 0.8, depth * 0.8);
    crackGeo.rotateX(-Math.PI / 2);
    const crackMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
    const crackMesh = new THREE.Mesh(crackGeo, crackMat);
    crackMesh.position.y = 0.41;
    group.add(crackMesh);

    group.position.set(lane * LANE_WIDTH, 0, zPos);

    return {
      type: ObstacleType.CRUMBLING_PLATFORM,
      mesh: group,
      lane,
      zPos,
      width,
      height,
      depth,
      cleared: false,
      active: true,
      crumbleTimer: 0.55,
      isCrumbling: false
    };
  }

  public static createMovingObstacle(zPos: number): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.6;
    const height = 2.8;
    const depth = 1.2;

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.4,
      metalness: 0.6
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    group.add(mesh);

    // Glowing core
    const coreGeo = new THREE.OctahedronGeometry(0.5);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = height / 2;
    group.add(core);

    group.position.set(0, 0, zPos);

    return {
      type: ObstacleType.MOVING_OBSTACLE,
      mesh: group,
      lane: 0,
      zPos,
      width,
      height,
      depth,
      cleared: false,
      active: true,
      oscillationTime: Math.random() * Math.PI,
      oscillationSpeed: 2.5,
      baseLaneX: 0
    };
  }
}
