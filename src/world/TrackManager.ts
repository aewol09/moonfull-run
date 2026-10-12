import * as THREE from 'three';
import { LANE_WIDTH } from '../entities/LunaCharacter';
import { ObstaclePool, ObstacleInstance, ObstacleType } from './Obstacles';
import { ShardManager } from './ShardManager';
import { PatternManager } from './PatternManager';

export interface TrackChunk {
  mesh: THREE.Group;
  zCenter: number;
  length: number;
  active: boolean;
}

export class TrackManager {
  private scene: THREE.Scene;
  private shardManager: ShardManager;
  private patternManager: PatternManager;
  private obstaclePool: ObstaclePool;

  public chunks: TrackChunk[] = [];
  public activeObstacles: ObstacleInstance[] = [];
  public get obstacles(): ObstacleInstance[] {
    return this.activeObstacles;
  }

  private readonly chunkLength = 40;
  private readonly visibleChunks = 6; // Keep 240m of track visible ahead
  private nextChunkZ = 0;
  private nextPatternZ = -25; // First pattern begins 25m ahead of start

  // Track Materials
  private roadMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.1
  });

  private laneBorderMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35
  });

  private pillarSideMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7
  });

  constructor(scene: THREE.Scene, shardManager: ShardManager) {
    this.scene = scene;
    this.shardManager = shardManager;
    this.patternManager = new PatternManager();
    this.obstaclePool = new ObstaclePool(scene);
  }

  public initTrack(): void {
    this.clear();
    this.nextChunkZ = 10; // Start 10m behind player
    this.nextPatternZ = -25; // 25m obstacle-free runway

    // Pre-populate track chunks
    for (let i = 0; i < this.visibleChunks; i++) {
      this.spawnChunk();
    }
  }

  private createChunkMesh(): THREE.Group {
    const group = new THREE.Group();
    const trackWidth = LANE_WIDTH * 3.4;

    // 1. Main Stone Road Slab
    const roadGeo = new THREE.BoxGeometry(trackWidth, 0.4, this.chunkLength);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
    roadMesh.position.y = -0.2;
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // 2. Lane Guide Lines (-0.5 * LANE_WIDTH, 0.5 * LANE_WIDTH)
    [-0.5 * LANE_WIDTH, 0.5 * LANE_WIDTH].forEach(x => {
      const lineGeo = new THREE.PlaneGeometry(0.12, this.chunkLength);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMesh = new THREE.Mesh(lineGeo, this.laneBorderMat);
      lineMesh.position.set(x, 0.015, 0);
      group.add(lineMesh);
    });

    // 3. Side Boundary Ancient Pillars
    for (let z = -this.chunkLength / 2 + 5; z <= this.chunkLength / 2 - 5; z += 10) {
      [-trackWidth / 2 - 0.35, trackWidth / 2 + 0.35].forEach(sideX => {
        const pillarGeo = new THREE.CylinderGeometry(0.25, 0.32, 1.8, 8);
        const pillarMesh = new THREE.Mesh(pillarGeo, this.pillarSideMat);
        pillarMesh.position.set(sideX, 0.8, z);
        group.add(pillarMesh);
      });
    }

    return group;
  }

  private spawnChunk(): void {
    let chunk = this.chunks.find(c => !c.active);

    if (!chunk) {
      const mesh = this.createChunkMesh();
      this.scene.add(mesh);
      chunk = {
        mesh,
        zCenter: this.nextChunkZ - this.chunkLength / 2,
        length: this.chunkLength,
        active: true
      };
      this.chunks.push(chunk);
    } else {
      chunk.active = true;
      chunk.zCenter = this.nextChunkZ - this.chunkLength / 2;
      chunk.mesh.visible = true;
    }

    chunk.mesh.position.set(0, 0, chunk.zCenter);
    this.nextChunkZ -= this.chunkLength;
  }

  public update(playerZ: number, currentDistance: number, currentSpeed: number): void {
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
      this.spawnNextPattern(currentDistance, currentSpeed);
    }

    // 3. Update active obstacles and recycle behind player
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];

      // Oscillating moving obstacle
      if (obs.type === ObstacleType.MOVING_OBSTACLE && obs.active) {
        obs.oscillationTime += 0.035;
        obs.mesh.position.x = Math.sin(obs.oscillationTime) * (LANE_WIDTH * 1.15);
      }

      // Recycle obstacles that fell 18m behind player
      if (obs.zPos > playerZ + 18) {
        this.obstaclePool.recycle(obs);
        this.activeObstacles.splice(i, 1);
      }
    }
  }

  private spawnNextPattern(distance: number, speed: number): void {
    const { pattern, spacingMultiplier } = this.patternManager.getNextPattern(distance, speed);
    const patternStartZ = this.nextPatternZ;

    // Spawn obstacles in pattern
    for (const obsDef of pattern.obstacles) {
      const zPos = patternStartZ + obsDef.offsetZ * spacingMultiplier;
      const obs = this.obstaclePool.obtain(obsDef.type, obsDef.lane, zPos);
      this.activeObstacles.push(obs);
    }

    // Spawn shards in pattern
    for (const shardDef of pattern.shards) {
      const startZ = patternStartZ + shardDef.offsetZ * spacingMultiplier;
      this.shardManager.spawnShardLine(
        shardDef.lane,
        startZ,
        shardDef.count,
        2.5 * spacingMultiplier,
        shardDef.height ?? 0.8
      );
    }

    // Advance cursor: pattern length + safe dodging buffer zone
    const patternSpan = pattern.length * spacingMultiplier;
    const safeBuffer = Math.max(14.0, speed * 0.8); // Always guarantee 0.8s of clear track between patterns
    this.nextPatternZ -= (patternSpan + safeBuffer);
  }

  public clear(): void {
    for (const chunk of this.chunks) {
      chunk.active = false;
      chunk.mesh.visible = false;
    }
    this.obstaclePool.clearAll();
    this.activeObstacles = [];
    this.shardManager.clear();
    this.patternManager.reset();
  }
}
