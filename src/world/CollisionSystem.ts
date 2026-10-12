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
    dt: number,
    currentSpeed = 14.0
  ): CollisionResult {
    const playerX = luna.mesh.position.x;
    const playerY = luna.posY;
    const playerZ = luna.mesh.position.z;
    const isSliding = luna.state === CharacterState.SLIDE;

    const playerRadius = 0.42;

    for (const obs of obstacles) {
      if (!obs.active || obs.cleared) continue;

      const zDist = Math.abs(playerZ - obs.zPos);

      // Early cull
      if (zDist > Math.max(obs.depth, 6.0)) continue;

      // 1. Broken Bridge (Chasm Gap)
      if (obs.type === ObstacleType.BROKEN_BRIDGE) {
        const halfGap = obs.depth / 2;
        if (playerZ <= obs.zPos + halfGap && playerZ >= obs.zPos - halfGap) {
          // If not jumping high enough over the abyss
          if (playerY < 0.28) {
            obs.cleared = true;
            return { hit: true, type: ObstacleType.BROKEN_BRIDGE, fatal: true };
          }
        }
        continue;
      }

      // 2. Low Stone Arch (Slide underneath)
      if (obs.type === ObstacleType.LOW_ARCH) {
        if (zDist < (obs.depth / 2 + 0.35)) {
          if (isSliding) {
            // Safely pass underneath
            continue;
          }
          obs.cleared = true;
          return { hit: true, type: ObstacleType.LOW_ARCH, fatal: false };
        }
        continue;
      }

      // 3. Crumbling Platform
      if (obs.type === ObstacleType.CRUMBLING_PLATFORM) {
        const obsX = obs.lane * LANE_WIDTH;
        const xDist = Math.abs(playerX - obsX);

        // Warning time: always gives 0.7s of shaking warning before arrival regardless of speed
        const warningDist = Math.max(8.0, currentSpeed * 0.7);

        if (zDist < warningDist && xDist < obs.width / 2 + 0.5) {
          obs.isCrumbling = true;
          obs.crumbleProgress = Math.min(1.0, obs.crumbleProgress + dt * 2.0);

          // Visual vibration shake
          obs.mesh.position.x = obsX + (Math.random() - 0.5) * 0.14 * obs.crumbleProgress;

          // If platform has collapsed and player is on it
          if (obs.crumbleProgress >= 1.0 && zDist < obs.depth / 2 && xDist < obs.width / 2) {
            // Drop platform downward
            obs.mesh.position.y -= dt * 14;

            // If player hasn't jumped over it
            if (playerY < 0.3) {
              obs.cleared = true;
              return { hit: true, type: ObstacleType.CRUMBLING_PLATFORM, fatal: true };
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
