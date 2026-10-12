import * as THREE from 'three';
import { LANE_WIDTH } from '../entities/LunaCharacter';
import { ObstacleFactory, ObstacleInstance, ObstacleType } from './Obstacles';
import { ShardManager } from './ShardManager';
import { PatternManager } from './PatternManager';

export interface TrackChunk {
  mesh: THREE.Group;
  zStart: number;
  length: number;
  active: boolean;
}

export class TrackManager {
  private scene: THREE.Scene;
  private shardManager: ShardManager;
  private patternManager: PatternManager;

  public chunks: TrackChunk[] = [];
  public obstacles: ObstacleInstance[] = [];

  private readonly chunkLength = 40;
  private readonly visibleChunks = 5;
  private nextSpawnZ = 0;

  // Track Materials
  private roadMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.1
  });

  private laneBorderMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.4
  });

  private pillarSideMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7
  });

  constructor(scene: THREE.Scene, shardManager: ShardManager) {
    this.scene = scene;
    this.shardManager = shardManager;
    this.patternManager = new PatternManager();
  }

  public initTrack(): void {
    this.clear();
    this.nextSpawnZ = 10; // Start slightly behind player

    // Spawn initial chunks
    for (let i = 0; i < this.visibleChunks; i++) {
      this.spawnChunk(i > 1); // First two chunks are obstacle-free safe runway
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
      const lineGeo = new THREE.PlaneGeometry(0.1, this.chunkLength);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMesh = new THREE.Mesh(lineGeo, this.laneBorderMat);
      lineMesh.position.set(x, 0.01, 0);
      group.add(lineMesh);
    });

    // 3. Side Boundary Ancient Pillars
    for (let z = -this.chunkLength / 2 + 5; z <= this.chunkLength / 2 - 5; z += 10) {
      [-trackWidth / 2 - 0.3, trackWidth / 2 + 0.3].forEach(sideX => {
        const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.8, 8);
        const pillarMesh = new THREE.Mesh(pillarGeo, this.pillarSideMat);
        pillarMesh.position.set(sideX, 0.8, z);
        group.add(pillarMesh);
      });
    }

    return group;
  }

  public spawnChunk(withObstacles: boolean, currentDistance = 0, currentSpeed = 14): void {
    let chunk = this.chunks.find(c => !c.active);

    if (!chunk) {
      const mesh = this.createChunkMesh();
      this.scene.add(mesh);
      chunk = {
        mesh,
        zStart: this.nextSpawnZ,
        length: this.chunkLength,
        active: true
      };
      this.chunks.push(chunk);
    } else {
      chunk.active = true;
      chunk.zStart = this.nextSpawnZ;
      chunk.mesh.visible = true;
    }

    // Set chunk position (center of chunk)
    chunk.mesh.position.set(0, 0, this.nextSpawnZ - this.chunkLength / 2);

    if (withObstacles) {
      this.populateChunkContent(chunk.zStart, currentDistance, currentSpeed);
    }

    this.nextSpawnZ -= this.chunkLength;
  }

  private populateChunkContent(chunkStartZ: number, distance: number, speed: number): void {
    const { pattern, spacingMultiplier } = this.patternManager.getNextPattern(distance, speed);

    // Spawn obstacles defined in pattern
    for (const obsDef of pattern.obstacles) {
      const zPos = chunkStartZ + obsDef.offsetZ * spacingMultiplier;
      let obsInstance: ObstacleInstance | null = null;

      switch (obsDef.type) {
        case ObstacleType.RUINED_PILLAR:
          obsInstance = ObstacleFactory.createPillar(obsDef.lane, zPos);
          break;
        case ObstacleType.LOW_ARCH:
          obsInstance = ObstacleFactory.createLowArch(obsDef.lane, zPos);
          break;
        case ObstacleType.BROKEN_BRIDGE:
          obsInstance = ObstacleFactory.createBrokenBridge(obsDef.lane, zPos);
          break;
        case ObstacleType.CRUMBLING_PLATFORM:
          obsInstance = ObstacleFactory.createCrumblingPlatform(obsDef.lane, zPos);
          break;
        case ObstacleType.MOVING_OBSTACLE:
          obsInstance = ObstacleFactory.createMovingObstacle(zPos);
          break;
      }

      if (obsInstance) {
        this.scene.add(obsInstance.mesh);
        this.obstacles.push(obsInstance);
      }
    }

    // Spawn shards defined in pattern
    for (const shardDef of pattern.shards) {
      const startZ = chunkStartZ + shardDef.offsetZ * spacingMultiplier;
      this.shardManager.spawnShardLine(
        shardDef.lane,
        startZ,
        shardDef.count,
        2.4 * spacingMultiplier,
        shardDef.height ?? 0.8
      );
    }
  }

  public update(playerZ: number, currentDistance: number, currentSpeed: number): void {
    // 1. Check if furthest chunk is behind player and recycle
    for (const chunk of this.chunks) {
      if (chunk.active && chunk.zStart - chunk.length > playerZ + 20) {
        chunk.active = false;
        chunk.mesh.visible = false;
        // Spawn a new chunk ahead
        this.spawnChunk(true, currentDistance, currentSpeed);
      }
    }

    // 2. Clean up or update active obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      // Moving obstacle horizontal oscillation
      if (obs.type === ObstacleType.MOVING_OBSTACLE && obs.active) {
        obs.oscillationTime = (obs.oscillationTime || 0) + 0.035;
        obs.mesh.position.x = Math.sin(obs.oscillationTime) * (LANE_WIDTH * 1.1);
      }

      // Recycle obstacles behind player
      if (obs.zPos > playerZ + 15) {
        obs.active = false;
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }
  }

  public clear(): void {
    for (const chunk of this.chunks) {
      chunk.active = false;
      chunk.mesh.visible = false;
    }
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.obstacles = [];
    this.patternManager.reset();
  }
}
