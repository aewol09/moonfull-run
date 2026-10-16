import * as THREE from 'three';
import { LANE_WIDTH } from '../entities/LunaCharacter';
import { TextureGenerator } from '../render/TextureGenerator';
import { AssetLoader } from '../render/AssetLoader';

export enum ObstacleType {
  BROKEN_BRIDGE = 'BROKEN_BRIDGE',
  RUINED_PILLAR = 'RUINED_PILLAR',
  LOW_ARCH = 'LOW_ARCH',
  CRUMBLING_PLATFORM = 'CRUMBLING_PLATFORM',
  MOVING_OBSTACLE = 'MOVING_OBSTACLE',
  CRYSTAL_SPIKE = 'CRYSTAL_SPIKE',
  SOLAR_MONOLITH = 'SOLAR_MONOLITH',
  CHEST = 'CHEST',
  // Stage-specific obstacles & Skill Barrier
  VINE_BRIER = 'VINE_BRIER',               // Stage 2 (Starlight Misty Forest): Mystical thorned vine barrier
  MAGMA_PILLAR = 'MAGMA_PILLAR',           // Stage 3 (Twilight Citadel / Magma): Roaring molten magma basalt pillar
  VOID_OBELISK = 'VOID_OBELISK',           // Stage 4+ (Void Abyss & Bloodmoon): Dark void crystal monolith
  SKILL_BARRIER = 'SKILL_BARRIER',         // Massive 3-lane dimensional seal wall (CANNOT pass without skill!)
  SKILL_CHARGE_RUNE = 'SKILL_CHARGE_RUNE'   // Floating aether rune pickup that instantly recharges active skill
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
  evaded?: boolean;
  warned?: boolean;
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

  // 2.5D High-Res Illustration Sprite Materials
  private pillarSpriteMat: THREE.MeshBasicMaterial;
  private archSpriteMat: THREE.MeshBasicMaterial;
  private sentinelSpriteMat: THREE.MeshBasicMaterial;
  private crystalSpikeSpriteMat: THREE.MeshBasicMaterial;
  private solarMonolithSpriteMat: THREE.MeshBasicMaterial;
  private vineSpriteMat: THREE.MeshBasicMaterial;
  private magmaSpriteMat: THREE.MeshBasicMaterial;
  private voidSpriteMat: THREE.MeshBasicMaterial;
  private skillBarrierSpriteMat: THREE.MeshBasicMaterial;
  private skillChargeMat: THREE.MeshBasicMaterial;
  private chestSpriteMat: THREE.MeshBasicMaterial;
  private shadowMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    const stoneTex = TextureGenerator.createRuinsStoneTexture();
    const crackedTex = TextureGenerator.createCrackedPlatformTexture();
    const pillarTex = AssetLoader.loadTexture('/assets/obs_pillar.png');
    const archTex = AssetLoader.loadTexture('/assets/obs_low_arch.png');
    const sentinelTex = AssetLoader.loadTexture('/assets/obs_sentinel.png');
    const crystalTex = AssetLoader.loadTexture('/assets/obs_crystal_spike.png');
    const monolithTex = AssetLoader.loadTexture('/assets/obs_solar_monolith.png');
    const vineTex = AssetLoader.loadTexture('/assets/obs_vine_barrier.png');
    const magmaTex = AssetLoader.loadTexture('/assets/obs_magma_pillar.png');
    const voidTex = AssetLoader.loadTexture('/assets/obs_void_obelisk.png');
    const skillBarrierTex = AssetLoader.loadTexture('/assets/obs_skill_barrier.png');
    const chestTex = AssetLoader.loadTexture('/assets/chest_mystery.png');

    this.pillarMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.65,
      metalness: 0.2
    });
    this.archMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.65,
      metalness: 0.25
    });
    this.platformMat = new THREE.MeshStandardMaterial({
      map: crackedTex,
      roughness: 0.7,
      emissive: 0x881337,
      emissiveIntensity: 0.4
    });
    this.movingMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.25,
      metalness: 0.8,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.5
    });
    this.runeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.chasmVoidMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    this.chasmBorderMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    this.pillarSpriteMat = new THREE.MeshBasicMaterial({
      map: pillarTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.archSpriteMat = new THREE.MeshBasicMaterial({
      map: archTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.sentinelSpriteMat = new THREE.MeshBasicMaterial({
      map: sentinelTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.crystalSpikeSpriteMat = new THREE.MeshBasicMaterial({
      map: crystalTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.solarMonolithSpriteMat = new THREE.MeshBasicMaterial({
      map: monolithTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.vineSpriteMat = new THREE.MeshBasicMaterial({
      map: vineTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.magmaSpriteMat = new THREE.MeshBasicMaterial({
      map: magmaTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.voidSpriteMat = new THREE.MeshBasicMaterial({
      map: voidTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.skillBarrierSpriteMat = new THREE.MeshBasicMaterial({
      map: skillBarrierTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.skillChargeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    this.chestSpriteMat = new THREE.MeshBasicMaterial({
      map: chestTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.52
    });

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
    obs.evaded = false;
    obs.warned = false;
    obs.lane = lane;
    obs.zPos = zPos;
    obs.crumbleProgress = 0;
    obs.isCrumbling = false;
    obs.oscillationTime = Math.random() * Math.PI * 2;
    obs.baseLaneX = lane * LANE_WIDTH;

    obs.mesh.visible = true;
    obs.mesh.position.set(
      type === ObstacleType.BROKEN_BRIDGE || type === ObstacleType.LOW_ARCH || type === ObstacleType.SKILL_BARRIER
        ? 0
        : lane * LANE_WIDTH,
      0,
      zPos
    );
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
      case ObstacleType.CRYSTAL_SPIKE:
        return this.buildCrystalSpike();
      case ObstacleType.SOLAR_MONOLITH:
        return this.buildSolarMonolith();
      case ObstacleType.VINE_BRIER:
        return this.buildVineBrier();
      case ObstacleType.MAGMA_PILLAR:
        return this.buildMagmaPillar();
      case ObstacleType.VOID_OBELISK:
        return this.buildVoidObelisk();
      case ObstacleType.SKILL_BARRIER:
        return this.buildSkillBarrier();
      case ObstacleType.SKILL_CHARGE_RUNE:
        return this.buildSkillChargeRune();
      case ObstacleType.CHEST:
        return this.buildChest();
    }
  }

  private buildPillar(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.6;
    const height = 3.6;
    const depth = 1.2;

    // 1. Soft ground contact shadow
    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    shadowMesh.position.y = 0.02;
    group.add(shadowMesh);

    // 2. Base pedestal foundation
    const baseGeo = new THREE.BoxGeometry(width, 0.3, depth * 0.8);
    const baseMesh = new THREE.Mesh(baseGeo, this.pillarMat);
    baseMesh.position.y = 0.15;
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // 3. High-Res 2.5D Illustration Billboard Sprite Quad
    const spriteGeo = new THREE.PlaneGeometry(2.0, height);
    const spriteMesh = new THREE.Mesh(spriteGeo, this.pillarSpriteMat);
    spriteMesh.position.y = height / 2;
    group.add(spriteMesh);

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
    const width = LANE_WIDTH * 3.2;
    const height = 2.4;
    const depth = 1.0;

    // 1. Ground contact shadows under left, center, and right sections
    [-LANE_WIDTH, 0, LANE_WIDTH].forEach(px => {
      const shadowGeo = new THREE.PlaneGeometry(1.6, 1.0);
      shadowGeo.rotateX(-Math.PI / 2);
      const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
      shadowMesh.position.set(px, 0.02, 0);
      group.add(shadowMesh);
    });

    // 2. High-Res 2.5D Illustration Archway Billboard Sprite Quad
    // Fully renders the 3-lane ancient ruins barrier:
    // Left/Right lanes blocked by stone monoliths with glowing red warning crosses,
    // Center lane has an open low-clearance crawl tunnel under ancient lunar moon runes.

    // 3. High-Res 2.5D Illustration Archway Billboard Sprite Quad
    const archGeo = new THREE.PlaneGeometry(width, 3.2);
    const archMesh = new THREE.Mesh(archGeo, this.archSpriteMat);
    archMesh.position.y = 1.6;
    group.add(archMesh);

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

    // 1. Deep 3D Interior Pit Walls descending down 6.0 meters into the abyss (Open hole in floor!)
    // Near drop-off wall
    const nearWallGeo = new THREE.PlaneGeometry(trackWidth * 1.05, 6.0);
    const nearWall = new THREE.Mesh(nearWallGeo, this.pillarMat);
    nearWall.position.set(0, -3.0, -gapLength / 2);
    group.add(nearWall);

    // Far drop-off wall
    const farWallGeo = new THREE.PlaneGeometry(trackWidth * 1.05, 6.0);
    const farWall = new THREE.Mesh(farWallGeo, this.pillarMat);
    farWall.rotateY(Math.PI);
    farWall.position.set(0, -3.0, gapLength / 2);
    group.add(farWall);

    // Left interior wall
    const leftWallGeo = new THREE.PlaneGeometry(gapLength, 6.0);
    const leftWall = new THREE.Mesh(leftWallGeo, this.pillarMat);
    leftWall.rotateY(Math.PI / 2);
    leftWall.position.set(-trackWidth * 0.525, -3.0, 0);
    group.add(leftWall);

    // Right interior wall
    const rightWallGeo = new THREE.PlaneGeometry(gapLength, 6.0);
    const rightWall = new THREE.Mesh(rightWallGeo, this.pillarMat);
    rightWall.rotateY(-Math.PI / 2);
    rightWall.position.set(trackWidth * 0.525, -3.0, 0);
    group.add(rightWall);

    // Bottomless abyss floor at y = -6.0
    const pitFloorGeo = new THREE.PlaneGeometry(trackWidth * 1.15, gapLength * 1.15);
    pitFloorGeo.rotateX(-Math.PI / 2);
    const pitFloor = new THREE.Mesh(pitFloorGeo, this.chasmVoidMat);
    pitFloor.position.set(0, -6.0, 0);
    group.add(pitFloor);

    // 3. Broken stone ledge slabs along the near and far chasm rims (natural stone fractures, no red lines!)
    [-gapLength / 2, gapLength / 2].forEach(edgeZ => {
      const rimSegments = 5;
      const segWidth = (trackWidth * 1.02) / rimSegments;
      for (let s = 0; s < rimSegments; s++) {
        const segX = -trackWidth / 2 + (s + 0.5) * segWidth;
        const slabHeight = 0.12 + ((s * 3) % 4) * 0.03;
        const slabDepth = 0.28 + ((s * 5) % 3) * 0.05;
        const slabGeo = new THREE.BoxGeometry(segWidth * 0.94, slabHeight, slabDepth);
        const slabMesh = new THREE.Mesh(slabGeo, this.pillarMat);
        slabMesh.position.set(segX, slabHeight / 2 + 0.01, edgeZ);
        group.add(slabMesh);
      }
    });

    // 4. Jagged broken stone columns and floating debris at the chasm edges
    [-trackWidth / 2, trackWidth / 2].forEach(sideX => {
      const rockGeo = new THREE.ConeGeometry(0.55, 1.4, 6);
      const rockMesh = new THREE.Mesh(rockGeo, this.pillarMat);
      rockMesh.position.set(sideX, 0.45, 0);
      group.add(rockMesh);
    });

    // Floating crumbled rubble chunks in the chasm void
    const debrisGeo = new THREE.DodecahedronGeometry(0.22, 0);
    [
      { x: -1.2, y: -1.8, z: -0.6 },
      { x: 0.8, y: -2.4, z: 0.8 },
      { x: -0.4, y: -3.2, z: -1.0 }
    ].forEach(pos => {
      const debris = new THREE.Mesh(debrisGeo, this.pillarMat);
      debris.position.set(pos.x, pos.y, pos.z);
      debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(debris);
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

    // 1. Soft hovering ground contact shadow
    const shadowGeo = new THREE.PlaneGeometry(1.6, 0.9);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    shadowMesh.position.y = 0.02;
    group.add(shadowMesh);

    // 2. High-Res 2.5D Illustration Sentinel Sprite Quad
    const sentinelGeo = new THREE.PlaneGeometry(2.3, 2.8);
    const sentinelMesh = new THREE.Mesh(sentinelGeo, this.sentinelSpriteMat);
    sentinelMesh.position.y = height / 2;
    group.add(sentinelMesh);

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

  private buildCrystalSpike(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.6;
    const height = 3.2;
    const depth = 1.2;

    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.0);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    shadowMesh.position.y = 0.02;
    group.add(shadowMesh);

    const spriteGeo = new THREE.PlaneGeometry(1.85, height);
    const spriteMesh = new THREE.Mesh(spriteGeo, this.crystalSpikeSpriteMat);
    spriteMesh.position.y = height / 2;
    group.add(spriteMesh);

    return {
      type: ObstacleType.CRYSTAL_SPIKE,
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

  private buildSolarMonolith(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.6;
    const height = 3.6;
    const depth = 1.2;

    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    shadowMesh.position.y = 0.02;
    group.add(shadowMesh);

    const spriteGeo = new THREE.PlaneGeometry(1.8, height);
    const spriteMesh = new THREE.Mesh(spriteGeo, this.solarMonolithSpriteMat);
    spriteMesh.position.y = height / 2;
    group.add(spriteMesh);

    return {
      type: ObstacleType.SOLAR_MONOLITH,
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

  private buildChest(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.4;
    const height = 1.4;
    const depth = 1.4;

    // Contact shadow
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.4);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    shadowMesh.position.y = 0.02;
    group.add(shadowMesh);

    // High-res Chest Sprite Quad
    const chestGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const chestMesh = new THREE.Mesh(chestGeo, this.chestSpriteMat);
    chestMesh.position.y = 0.8;
    group.add(chestMesh);

    // Glowing golden ground beacon
    const beaconGeo = new THREE.RingGeometry(0.35, 0.9, 16);
    beaconGeo.rotateX(-Math.PI / 2);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.y = 0.04;
    group.add(beaconMesh);

    return {
      type: ObstacleType.CHEST,
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

  private buildVineBrier(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.6;
    const height = 3.4;
    const depth = 1.0;

    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    shadowMesh.position.y = 0.02;
    group.add(shadowMesh);

    const sporeGeo = new THREE.RingGeometry(0.35, 0.85, 16);
    sporeGeo.rotateX(-Math.PI / 2);
    const sporeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const sporeMesh = new THREE.Mesh(sporeGeo, sporeMat);
    sporeMesh.position.y = 0.03;
    group.add(sporeMesh);

    const spriteGeo = new THREE.PlaneGeometry(1.9, height);
    const spriteMesh = new THREE.Mesh(spriteGeo, this.vineSpriteMat);
    spriteMesh.position.y = height / 2;
    group.add(spriteMesh);

    return {
      type: ObstacleType.VINE_BRIER,
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

  private buildMagmaPillar(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.6;
    const height = 3.8;
    const depth = 1.2;

    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.3);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    shadowMesh.position.y = 0.02;
    group.add(shadowMesh);

    const lavaGeo = new THREE.RingGeometry(0.4, 0.95, 16);
    lavaGeo.rotateX(-Math.PI / 2);
    const lavaMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const lavaMesh = new THREE.Mesh(lavaGeo, lavaMat);
    lavaMesh.position.y = 0.03;
    group.add(lavaMesh);

    const spriteGeo = new THREE.PlaneGeometry(2.0, height);
    const spriteMesh = new THREE.Mesh(spriteGeo, this.magmaSpriteMat);
    spriteMesh.position.y = height / 2;
    group.add(spriteMesh);

    return {
      type: ObstacleType.MAGMA_PILLAR,
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

  private buildVoidObelisk(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.5;
    const height = 4.2;
    const depth = 1.2;

    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    shadowMesh.position.y = 0.02;
    group.add(shadowMesh);

    const riftGeo = new THREE.RingGeometry(0.3, 0.9, 16);
    riftGeo.rotateX(-Math.PI / 2);
    const riftMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const riftMesh = new THREE.Mesh(riftGeo, riftMat);
    riftMesh.position.y = 0.03;
    group.add(riftMesh);

    const spriteGeo = new THREE.PlaneGeometry(2.0, height);
    const spriteMesh = new THREE.Mesh(spriteGeo, this.voidSpriteMat);
    spriteMesh.position.y = height / 2;
    group.add(spriteMesh);

    return {
      type: ObstacleType.VOID_OBELISK,
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

  private buildSkillBarrier(): ObstacleInstance {
    const group = new THREE.Group();
    const width = LANE_WIDTH * 3.4;
    const height = 4.6;
    const depth = 1.4;

    [-LANE_WIDTH, 0, LANE_WIDTH].forEach(px => {
      const shadowGeo = new THREE.PlaneGeometry(1.8, 1.2);
      shadowGeo.rotateX(-Math.PI / 2);
      const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
      shadowMesh.position.set(px, 0.02, 0);
      group.add(shadowMesh);
    });

    const thresholdGeo = new THREE.PlaneGeometry(width * 1.05, 0.28);
    thresholdGeo.rotateX(-Math.PI / 2);
    const thresholdMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const thresholdMesh = new THREE.Mesh(thresholdGeo, thresholdMat);
    thresholdMesh.position.set(0, 0.04, 0.5);
    group.add(thresholdMesh);

    const barrierGeo = new THREE.PlaneGeometry(width, height);
    const barrierMesh = new THREE.Mesh(barrierGeo, this.skillBarrierSpriteMat);
    barrierMesh.position.y = height / 2;
    group.add(barrierMesh);

    return {
      type: ObstacleType.SKILL_BARRIER,
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

  private buildSkillChargeRune(): ObstacleInstance {
    const group = new THREE.Group();
    const width = 1.2;
    const height = 1.6;
    const depth = 1.2;

    const beaconGeo = new THREE.RingGeometry(0.3, 0.8, 16);
    beaconGeo.rotateX(-Math.PI / 2);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.y = 0.04;
    group.add(beaconMesh);

    const diamondGeo = new THREE.OctahedronGeometry(0.48, 0);
    const diamondMesh = new THREE.Mesh(diamondGeo, this.skillChargeMat);
    diamondMesh.position.y = 0.95;
    group.add(diamondMesh);

    const ringGeo = new THREE.RingGeometry(0.65, 0.76, 24);
    ringGeo.rotateX(-Math.PI * 0.35);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.95;
    group.add(ringMesh);

    return {
      type: ObstacleType.SKILL_CHARGE_RUNE,
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

  public static createCrystalSpike(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.CRYSTAL_SPIKE, lane, zPos);
  }

  public static createSolarMonolith(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.SOLAR_MONOLITH, lane, zPos);
  }

  public static createVineBrier(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.VINE_BRIER, lane, zPos);
  }

  public static createMagmaPillar(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.MAGMA_PILLAR, lane, zPos);
  }

  public static createVoidObelisk(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.VOID_OBELISK, lane, zPos);
  }

  public static createSkillBarrier(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.SKILL_BARRIER, lane, zPos);
  }

  public static createSkillChargeRune(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.SKILL_CHARGE_RUNE, lane, zPos);
  }

  public static createChest(lane: number, zPos: number): ObstacleInstance {
    return this.pool.obtain(ObstacleType.CHEST, lane, zPos);
  }
}
