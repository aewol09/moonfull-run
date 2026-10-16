import * as THREE from 'three';
import { LANE_WIDTH } from '../entities/LunaCharacter';
import { ObstaclePool, ObstacleInstance, ObstacleType } from './Obstacles';
import { ShardManager } from './ShardManager';
import { PatternManager, TrackPattern } from './PatternManager';
import { DifficultyDirector, GameStage } from '../gameplay/DifficultyDirector';

import { TextureGenerator } from '../render/TextureGenerator';
import { CornerMeshBuilder } from './CornerMesh';

export interface RoadSegment {
  mesh: THREE.Mesh;
  lines: THREE.Mesh[];
  curbs: THREE.Mesh[];
  guides: THREE.Mesh[];
  beacons: THREE.Mesh[];
  relZ: number;
}

export interface TrackChunk {
  mesh: THREE.Group;
  zCenter: number;
  length: number;
  active: boolean;
  roadSegments: RoadSegment[];
}

export class TrackManager {
  private scene: THREE.Scene;
  private shardManager: ShardManager;
  public patternManager: PatternManager;
  public obstaclePool: ObstaclePool;
  public difficultyDirector: DifficultyDirector;

  public chunks: TrackChunk[] = [];
  public activeObstacles: ObstacleInstance[] = [];
  public get obstacles(): ObstacleInstance[] {
    return this.activeObstacles;
  }

  // Active 90-degree corner and preview meshes
  public activeCornerGroup: THREE.Group | null = null;
  public activePreviewGroup: THREE.Group | null = null;
  public activeCornerZ: number | null = null;

  private readonly chunkLength = 40;
  private readonly visibleChunks = 6; // Keep 240m of track visible ahead
  private nextChunkZ = 0;
  private nextPatternZ = -25; // First pattern begins 25m ahead of start

  // Track Materials (High-detail procedural PBR & Cel lighting)
  private roadMat: THREE.MeshStandardMaterial;
  private laneBorderMat: THREE.MeshBasicMaterial;
  private pillarSideMat: THREE.MeshStandardMaterial;
  private lanternMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, shardManager: ShardManager, difficultyDirector?: DifficultyDirector) {
    this.scene = scene;
    this.shardManager = shardManager;
    this.difficultyDirector = difficultyDirector || new DifficultyDirector();
    this.patternManager = new PatternManager();
    this.obstaclePool = new ObstaclePool(scene);

    const roadTex = TextureGenerator.createStoneRoadTexture();
    const roadBump = TextureGenerator.createStoneBumpMap();
    this.roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      bumpMap: roadBump,
      bumpScale: 0.08,
      roughness: 0.75,
      metalness: 0.15
    });

    this.laneBorderMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65
    });

    const pillarTex = TextureGenerator.createRuinsStoneTexture();
    this.pillarSideMat = new THREE.MeshStandardMaterial({
      map: pillarTex,
      roughness: 0.7,
      metalness: 0.2
    });

    this.lanternMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });
  }

  private lastChestDist = 0;
  public chestSpawnMultiplier = 1.0;

  public initTrack(): void {
    this.clear();
    this.nextChunkZ = 10; // Start 10m behind player
    this.nextPatternZ = -25; // 25m obstacle-free runway
    this.lastChestDist = 0;

    // Pre-populate track chunks
    for (let i = 0; i < this.visibleChunks; i++) {
      this.spawnChunk();
    }
  }

  private createChunkMesh(): { group: THREE.Group; roadSegments: RoadSegment[] } {
    const group = new THREE.Group();
    const trackWidth = LANE_WIDTH * 3.4;
    const roadSegments: RoadSegment[] = [];

    // 1. Modular Stone Road Slabs & Lane Lines (enables physically punching out floor holes for pits)
    const segLength = 2.0;
    const numSegments = Math.round(this.chunkLength / segLength); // 20 segments per 40m chunk

    for (let i = 0; i < numSegments; i++) {
      const relZ = -this.chunkLength / 2 + (i + 0.5) * segLength;
      const roadGeo = new THREE.BoxGeometry(trackWidth, 0.4, segLength);
      const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
      roadMesh.position.set(0, -0.2, relZ);
      roadMesh.receiveShadow = true;
      group.add(roadMesh);

      const lines: THREE.Mesh[] = [];
      [-0.5 * LANE_WIDTH, 0.5 * LANE_WIDTH].forEach(x => {
        const lineGeo = new THREE.PlaneGeometry(0.12, segLength);
        lineGeo.rotateX(-Math.PI / 2);
        const lineMesh = new THREE.Mesh(lineGeo, this.laneBorderMat);
        lineMesh.position.set(x, 0.015, relZ);
        group.add(lineMesh);
        lines.push(lineMesh);
      });

      // Modular curbs per segment (enables clean road cut-off at corner turns)
      const curbs: THREE.Mesh[] = [];
      [-trackWidth / 2 - 0.22, trackWidth / 2 + 0.22].forEach(sideX => {
        const curbGeo = new THREE.BoxGeometry(0.38, 0.24, segLength);
        const curbMesh = new THREE.Mesh(curbGeo, this.pillarSideMat);
        curbMesh.position.set(sideX, 0.08, relZ);
        curbMesh.receiveShadow = true;
        group.add(curbMesh);
        curbs.push(curbMesh);
      });

      // Modular luminous guide strips per segment
      const guides: THREE.Mesh[] = [];
      [-trackWidth / 2 - 0.04, trackWidth / 2 + 0.04].forEach(edgeX => {
        const guideGeo = new THREE.PlaneGeometry(0.08, segLength);
        guideGeo.rotateX(-Math.PI / 2);
        const guideMesh = new THREE.Mesh(guideGeo, this.laneBorderMat);
        guideMesh.position.set(edgeX, 0.02, relZ);
        group.add(guideMesh);
        guides.push(guideMesh);
      });

      // Milestone Prism Beacons placed at specific segment intervals
      const beacons: THREE.Mesh[] = [];
      if (i === 1 || i === numSegments - 2) {
        [-trackWidth / 2 - 0.22, trackWidth / 2 + 0.22].forEach(sideX => {
          const beaconGeo = new THREE.BoxGeometry(0.24, 0.45, 0.24);
          const beaconMesh = new THREE.Mesh(beaconGeo, this.pillarSideMat);
          beaconMesh.position.set(sideX, 0.25, relZ);
          group.add(beaconMesh);
          beacons.push(beaconMesh);

          const crystalGeo = new THREE.OctahedronGeometry(0.12, 0);
          const crystalMesh = new THREE.Mesh(crystalGeo, this.lanternMat);
          crystalMesh.position.set(sideX, 0.55, relZ);
          group.add(crystalMesh);
          beacons.push(crystalMesh);
        });
      }

      roadSegments.push({
        mesh: roadMesh,
        lines,
        curbs,
        guides,
        beacons,
        relZ
      });
    }

    return { group, roadSegments };
  }

  private spawnChunk(): void {
    let chunk = this.chunks.find(c => !c.active);

    if (!chunk) {
      const { group: mesh, roadSegments } = this.createChunkMesh();
      this.scene.add(mesh);
      chunk = {
        mesh,
        zCenter: this.nextChunkZ - this.chunkLength / 2,
        length: this.chunkLength,
        active: true,
        roadSegments
      };
      this.chunks.push(chunk);
    } else {
      chunk.active = true;
      chunk.zCenter = this.nextChunkZ - this.chunkLength / 2;
      chunk.mesh.visible = true;
      for (const seg of chunk.roadSegments) {
        seg.mesh.visible = true;
        seg.lines.forEach(l => (l.visible = true));
        seg.curbs.forEach(c => (c.visible = true));
        seg.guides.forEach(g => (g.visible = true));
        seg.beacons.forEach(b => (b.visible = true));
      }
    }

    chunk.mesh.position.set(0, 0, chunk.zCenter);
    this.nextChunkZ -= this.chunkLength;
  }

  public update(
    playerZ: number,
    currentDistance: number,
    currentSpeed: number,
    currentStage?: GameStage
  ): void {
    // 0. Update road segment visibility:
    // - Completely hide/remove the straight track past activeCornerZ ("원래 앞에 있던 길은 없애줘")
    // - Physically punch open floor holes where broken bridge gaps exist!
    for (const chunk of this.chunks) {
      if (!chunk.active) continue;

      if (this.activeCornerZ !== null && (chunk.zCenter + chunk.length / 2) <= this.activeCornerZ + 0.1) {
        chunk.mesh.visible = false;
        continue;
      }
      chunk.mesh.visible = true;

      for (const seg of chunk.roadSegments) {
        const segWorldZ = chunk.mesh.position.z + seg.relZ;

        // If road segment is past the active corner turn, completely remove/hide it!
        if (this.activeCornerZ !== null && segWorldZ <= this.activeCornerZ + 0.1) {
          seg.mesh.visible = false;
          seg.lines.forEach(l => (l.visible = false));
          seg.curbs.forEach(c => (c.visible = false));
          seg.guides.forEach(g => (g.visible = false));
          seg.beacons.forEach(b => (b.visible = false));
          continue;
        }

        // Pit hole check for broken bridge
        const inGap = this.activeObstacles.some(
          obs => obs.type === ObstacleType.BROKEN_BRIDGE && obs.active && !obs.cleared &&
                 Math.abs(segWorldZ - obs.zPos) < (obs.depth / 2 - 0.2)
        );

        const shouldBeVis = !inGap;
        seg.mesh.visible = shouldBeVis;
        seg.lines.forEach(l => (l.visible = shouldBeVis));
        seg.curbs.forEach(c => (c.visible = true));
        seg.guides.forEach(g => (g.visible = true));
        seg.beacons.forEach(b => (b.visible = true));
      }
    }

    // 1. Recycle and advance track chunks ahead of player
    for (const chunk of this.chunks) {
      if (chunk.active && (chunk.zCenter - chunk.length / 2) > playerZ + 25) {
        chunk.active = false;
        chunk.mesh.visible = false;
        this.spawnChunk();
      }
    }

    // 2. Spawn next pattern continuously ahead of player (keep ~140m queued ahead)
    while (this.nextPatternZ > playerZ - 140) {
      this.spawnNextPattern(currentDistance, currentSpeed, currentStage);
    }

    // 3. Update active obstacles and recycle behind player
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];

      // Oscillating moving obstacle
      if (obs.type === ObstacleType.MOVING_OBSTACLE && obs.active) {
        obs.oscillationTime += 0.035;
        obs.mesh.position.x = Math.sin(obs.oscillationTime) * (LANE_WIDTH * 1.15);
      }

      // Rotate floating aether skill charge rune
      if (obs.type === ObstacleType.SKILL_CHARGE_RUNE && obs.active) {
        obs.mesh.rotation.y += 0.04;
      }

      // Recycle obstacles that fell 18m behind player
      if (obs.zPos > playerZ + 18) {
        this.obstaclePool.recycle(obs);
        this.activeObstacles.splice(i, 1);
      }
    }
  }

  private spawnNextPattern(distance: number, speed: number, stage?: GameStage): void {
    const effectiveStage = stage ?? this.difficultyDirector.getStage(distance);
    const { pattern, spacingMultiplier } = this.patternManager.getNextPattern(distance, speed, effectiveStage);
    const patternStartZ = this.nextPatternZ;

    // Guarantee ZERO obstacles on and near the corner curve!
    const isNearCorner = this.activeCornerZ !== null &&
      (patternStartZ <= this.activeCornerZ + 40 && patternStartZ >= this.activeCornerZ - 40);

    if (!isNearCorner) {
      // Spawn obstacles in pattern
      for (const obsDef of pattern.obstacles) {
        const zPos = patternStartZ + obsDef.offsetZ * spacingMultiplier;
        if (this.activeCornerZ !== null && Math.abs(zPos - this.activeCornerZ) <= 35) {
          continue; // Skip any obstacle landing near the corner zone
        }
        const obs = this.obstaclePool.obtain(obsDef.type, obsDef.lane, zPos);
        this.activeObstacles.push(obs);
      }
    }

    // Spawn shards in pattern (only if not on the curve itself)
    if (!isNearCorner) {
      for (const shardDef of pattern.shards) {
        const startZ = patternStartZ + shardDef.offsetZ * spacingMultiplier;
        if (this.activeCornerZ !== null && Math.abs(startZ - this.activeCornerZ) <= 30) {
          continue;
        }
        this.shardManager.spawnShardLine(
          shardDef.lane,
          startZ,
          shardDef.count,
          2.5 * spacingMultiplier,
          shardDef.height ?? 0.8
        );
      }
    }

    // Check Mystery Chest Spawning: Spawns in late-game with paced intervals
    const chestInterval = Math.max(450, 750 / Math.max(0.5, this.chestSpawnMultiplier));
    if (distance > 650 && (distance - this.lastChestDist) >= chestInterval && !isNearCorner) {
      this.lastChestDist = distance;
      if (Math.random() < 0.55) {
        const chestLane = (Math.floor(Math.random() * 3) - 1);
        const chestZ = patternStartZ - (pattern.length * spacingMultiplier) - 5;
        if (!(this.activeCornerZ !== null && Math.abs(chestZ - this.activeCornerZ) <= 35)) {
          const chestObs = this.obstaclePool.obtain(ObstacleType.CHEST, chestLane, chestZ);
          this.activeObstacles.push(chestObs);
        }
      }
    }

    // Requirement 1: "스테이지가 늘어날 수록 장애물의 빈도가 잦아지고"
    // As stages increase, obstacle frequency multiplier increases and safe buffer distance contracts!
    const freqMult = this.difficultyDirector.getObstacleFrequencyMultiplier(effectiveStage);
    const safeBuffer = this.difficultyDirector.getSafeBufferDistance(effectiveStage);
    const patternSpan = (pattern.length * spacingMultiplier) / Math.max(1.0, freqMult * 0.85);
    this.nextPatternZ -= (patternSpan + safeBuffer);
  }

  public spawnPattern(pattern: TrackPattern, patternStartZ: number): void {
    for (const obsDef of pattern.obstacles) {
      const zPos = patternStartZ + obsDef.offsetZ;
      const obs = this.obstaclePool.obtain(obsDef.type, obsDef.lane, zPos);
      this.activeObstacles.push(obs);
    }
  }

  /**
   * Stella's Starfall Transmute: Converts active obstacles ahead into celestial moon shards!
   */
  public transmuteObstaclesToShards(
    playerZ: number,
    range = 45,
    onTransmute?: (x: number, z: number) => void
  ): number {
    let transmutedCount = 0;
    for (const obs of this.activeObstacles) {
      if (!obs.active || obs.cleared) continue;
      if (obs.type === ObstacleType.CHEST || obs.type === ObstacleType.SKILL_CHARGE_RUNE) continue;

      if (obs.zPos <= playerZ && obs.zPos >= playerZ - range) {
        obs.cleared = true;
        obs.mesh.position.y -= 25; // Remove obstacle
        const shardCount = obs.type === ObstacleType.SKILL_BARRIER ? 5 : 3;
        this.shardManager.spawnShardLine(obs.lane, obs.zPos, shardCount, 1.8, 0.9);
        if (onTransmute) {
          onTransmute(obs.lane * LANE_WIDTH, obs.zPos);
        }
        transmutedCount++;
      }
    }
    return transmutedCount;
  }

  public spawnCorner(direction: 'left' | 'right', cornerZ: number, radius = 14.0): void {
    this.clearCorner();
    this.activeCornerZ = cornerZ;
    const isRight = direction === 'right';

    // 1. Immediately purge any active obstacles within 35m of the corner, on the curve, or past it!
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      if (obs.zPos <= cornerZ + 35) {
        this.obstaclePool.recycle(obs);
        this.activeObstacles.splice(i, 1);
      }
    }

    // 2. Clear moon shards near and beyond the corner
    this.shardManager.clearNearZ(cornerZ, 35);
    this.shardManager.clearPastZ(cornerZ + 0.1);

    // 3. Build active 90-degree corner group
    this.activeCornerGroup = CornerMeshBuilder.createCornerGroup(
      radius,
      isRight,
      this.roadMat,
      this.laneBorderMat,
      this.pillarSideMat,
      this.lanternMat
    );
    this.activeCornerGroup.position.set(0, 0, cornerZ);
    this.scene.add(this.activeCornerGroup);

    // 4. Build outgoing perpendicular road preview
    this.activePreviewGroup = CornerMeshBuilder.createOutgoingRoadPreview(
      60,
      this.roadMat,
      this.laneBorderMat,
      this.pillarSideMat,
      this.lanternMat
    );
    if (isRight) {
      this.activePreviewGroup.position.set(radius, 0, cornerZ - radius);
      this.activePreviewGroup.rotation.y = -Math.PI / 2;
    } else {
      this.activePreviewGroup.position.set(-radius, 0, cornerZ - radius);
      this.activePreviewGroup.rotation.y = Math.PI / 2;
    }
    this.scene.add(this.activePreviewGroup);
  }

  public clearCorner(): void {
    if (this.activeCornerGroup) {
      this.scene.remove(this.activeCornerGroup);
      this.activeCornerGroup = null;
    }
    if (this.activePreviewGroup) {
      this.scene.remove(this.activePreviewGroup);
      this.activePreviewGroup = null;
    }
    this.activeCornerZ = null;
  }

  public reanchorTrackAtPlayer(newPlayerZ = 0): void {
    this.clearCorner();
    this.obstaclePool.clearAll();
    this.activeObstacles = [];
    this.shardManager.clear();

    this.nextChunkZ = newPlayerZ + 10;
    this.nextPatternZ = newPlayerZ - 30; // 30m clean obstacle-free runway!

    // Reposition active chunks in front of player along the new forward road
    for (let i = 0; i < this.visibleChunks; i++) {
      let chunk = this.chunks[i];
      if (!chunk) {
        this.spawnChunk();
        chunk = this.chunks[i];
      }
      chunk.active = true;
      chunk.zCenter = this.nextChunkZ - this.chunkLength / 2;
      chunk.mesh.position.set(0, 0, chunk.zCenter);
      chunk.mesh.visible = true;
      for (const seg of chunk.roadSegments) {
        seg.mesh.visible = true;
        seg.lines.forEach(l => (l.visible = true));
        seg.curbs.forEach(c => (c.visible = true));
        seg.guides.forEach(g => (g.visible = true));
        seg.beacons.forEach(b => (b.visible = true));
      }
      this.nextChunkZ -= this.chunkLength;
    }
  }


  public clear(): void {
    this.clearCorner();
    for (const chunk of this.chunks) {
      chunk.active = false;
      chunk.mesh.visible = false;
    }
    this.obstaclePool.clearAll();
    this.activeObstacles = [];
    this.shardManager.clear();
    this.patternManager.reset();
    this.lastChestDist = 0;
  }
}
