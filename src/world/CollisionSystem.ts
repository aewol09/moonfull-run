import * as THREE from 'three';
import { LunaCharacter, CharacterState, LANE_WIDTH } from '../entities/LunaCharacter';
import { ObstacleInstance, ObstacleType } from './Obstacles';

export interface CollisionResult {
  hit: boolean;
  type?: ObstacleType;
  fatal: boolean; // true if pit fall (cannot be blocked by shield)
}

export class CollisionSystem {
  public checkCollisions(
    luna: LunaCharacter,
    obstacles: ObstacleInstance[],
    dt: number
  ): CollisionResult {
    const playerX = luna.mesh.position.x;
    const playerY = luna.posY;
    const playerZ = luna.mesh.position.z;
    const isSliding = luna.state === CharacterState.SLIDE;
    const isAirborne = luna.state === CharacterState.JUMP || luna.state === CharacterState.FALL;

    // Luna collision bounds
    const playerRadius = 0.45;
    const playerHeight = isSliding ? 0.75 : 1.6;

    for (const obs of obstacles) {
      if (!obs.active || obs.cleared) continue;

      const zDist = Math.abs(playerZ - obs.zPos);

      // Early discard if not close in Z
      if (zDist > Math.max(obs.depth, 4.0)) continue;

      // 1. Broken Bridge (Gap in the floor)
      if (obs.type === ObstacleType.BROKEN_BRIDGE) {
        const halfGap = obs.depth / 2;
        if (playerZ <= obs.zPos + halfGap && playerZ >= obs.zPos - halfGap) {
          // If player is not jumping high enough over the gap, they fall to their doom
          if (playerY < 0.25) {
            obs.cleared = true;
            return { hit: true, type: ObstacleType.BROKEN_BRIDGE, fatal: true };
          }
        }
        continue;
      }

      // 2. Low Stone Arch
      if (obs.type === ObstacleType.LOW_ARCH) {
        // Clearance under the arch is 1.05m
        if (Math.abs(playerZ - obs.zPos) < (obs.depth / 2 + 0.3)) {
          // If sliding, safely pass underneath
          if (isSliding) {
            continue;
          }
          // If standing or jumping, hit the top beam
          obs.cleared = true;
          return { hit: true, type: ObstacleType.LOW_ARCH, fatal: false };
        }
        continue;
      }

      // 3. Crumbling Platform
      if (obs.type === ObstacleType.CRUMBLING_PLATFORM) {
        const obsX = obs.lane * LANE_WIDTH;
        const xDist = Math.abs(playerX - obsX);

        if (zDist < 8.0 && xDist < obs.width / 2 + 0.5) {
          // Trigger crumbling shake warning
          obs.isCrumbling = true;
          if (obs.crumbleTimer !== undefined) {
            obs.crumbleTimer -= dt;
            // Visual shake
            obs.mesh.position.x = obsX + (Math.random() - 0.5) * 0.12;

            // If timer runs out, platform drops
            if (obs.crumbleTimer <= 0) {
              obs.mesh.position.y -= dt * 15;
              if (zDist < obs.depth / 2 && xDist < obs.width / 2 && playerY < 0.2) {
                obs.cleared = true;
                return { hit: true, type: ObstacleType.CRUMBLING_PLATFORM, fatal: true };
              }
            }
          }
        }
        continue;
      }

      // 4. Ruined Pillar
      if (obs.type === ObstacleType.RUINED_PILLAR) {
        const obsX = obs.lane * LANE_WIDTH;
        const xDist = Math.abs(playerX - obsX);

        if (xDist < (obs.width / 2 + playerRadius - 0.08) && zDist < (obs.depth / 2 + 0.35)) {
          // Cannot jump over high pillar
          if (playerY < obs.height - 0.2) {
            obs.cleared = true;
            return { hit: true, type: ObstacleType.RUINED_PILLAR, fatal: false };
          }
        }
        continue;
      }

      // 5. Moving Obstacle
      if (obs.type === ObstacleType.MOVING_OBSTACLE) {
        const obsX = obs.mesh.position.x;
        const xDist = Math.abs(playerX - obsX);

        if (xDist < (obs.width / 2 + playerRadius - 0.08) && zDist < (obs.depth / 2 + 0.35)) {
          if (playerY < obs.height - 0.2) {
            obs.cleared = true;
            return { hit: true, type: ObstacleType.MOVING_OBSTACLE, fatal: false };
          }
        }
        continue;
      }
    }

    return { hit: false, fatal: false };
  }
}
