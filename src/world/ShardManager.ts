import * as THREE from 'three';
import { LANE_WIDTH } from '../entities/LunaCharacter';

export interface ShardInstance {
  mesh: THREE.Mesh;
  lane: number;
  zPos: number;
  initialY: number;
  collected: boolean;
  active: boolean;
}

export class ShardManager {
  private scene: THREE.Scene;
  private shards: ShardInstance[] = [];
  private shardGeo: THREE.OctahedronGeometry;
  private shardMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Glowing celestial diamond/shard geometry (faceted crystal)
    this.shardGeo = new THREE.OctahedronGeometry(0.32, 0);
    this.shardMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2,
      roughness: 0.15,
      metalness: 0.85,
      flatShading: true
    });
  }

  public spawnShard(lane: number, zPos: number, height = 0.8): ShardInstance {
    // Find reusable inactive shard from pool
    let shard = this.shards.find(s => !s.active);
    if (!shard) {
      const mesh = new THREE.Mesh(this.shardGeo, this.shardMat);
      mesh.castShadow = true;
      this.scene.add(mesh);
      shard = {
        mesh,
        lane,
        zPos,
        initialY: height,
        collected: false,
        active: true
      };
      this.shards.push(shard);
    } else {
      shard.active = true;
      shard.collected = false;
      shard.lane = lane;
      shard.zPos = zPos;
      shard.initialY = height;
      shard.mesh.visible = true;
      shard.mesh.scale.set(1, 1, 1);
    }

    shard.mesh.position.set(lane * LANE_WIDTH, height, zPos);
    return shard;
  }

  public spawnShardLine(lane: number, startZ: number, count = 5, spacing = 2.5, height = 0.8): void {
    for (let i = 0; i < count; i++) {
      this.spawnShard(lane, startZ - i * spacing, height);
    }
  }

  public update(
    playerPos: THREE.Vector3,
    dt: number,
    magnetActive: boolean,
    magnetRadius: number,
    onCollect: () => void
  ): void {
    const time = Date.now() * 0.003;

    for (const shard of this.shards) {
      if (!shard.active || shard.collected) continue;

      // Gentle floating spin
      shard.mesh.rotation.y += dt * 3.5;
      shard.mesh.rotation.x = Math.sin(time + shard.zPos) * 0.2;
      shard.mesh.position.y = shard.initialY + Math.sin(time * 1.5 + shard.zPos * 0.5) * 0.15;

      const dist = shard.mesh.position.distanceTo(playerPos);

      // 1. Magnet Pull Attraction
      if (magnetActive && dist < magnetRadius) {
        // Accelerate towards player
        const dir = new THREE.Vector3().subVectors(playerPos, shard.mesh.position).normalize();
        const pullSpeed = Math.max(16, 30 / (dist + 0.1));
        shard.mesh.position.addScaledVector(dir, pullSpeed * dt);
      }

      // 2. Collection Hitbox
      if (dist < 1.35) {
        shard.collected = true;
        shard.active = false;
        shard.mesh.visible = false;
        onCollect();
        continue;
      }

      // 3. Recycle if left behind player
      if (shard.mesh.position.z > playerPos.z + 12) {
        shard.active = false;
        shard.mesh.visible = false;
      }
    }
  }

  public clear(): void {
    for (const shard of this.shards) {
      shard.active = false;
      shard.collected = false;
      shard.mesh.visible = false;
    }
  }
}
