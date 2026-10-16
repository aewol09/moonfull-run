import * as THREE from 'three';
import { LunaCharacter, CharacterState, LANE_WIDTH } from '../entities/LunaCharacter';
import { ObstacleInstance, ObstacleType } from './Obstacles';

export interface CollisionResult {
  hit: boolean;
  type?: ObstacleType;
  fatal: boolean; // true if pit fall (cannot be blocked by shield)
  evaded?: boolean; // true if near-miss evasion occurred
  smashed?: boolean; // true if smashed during Fever mode or Solaris Juggernaut
  chestCollected?: boolean; // true if mystery chest collected
  skillChargeCollected?: boolean; // true if skill charge rune collected
  skillBarrierWarning?: boolean; // true if approaching a skill barrier
  skillBarrierBroken?: boolean; // true if skill barrier successfully broken/phased by active skill
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

    // 0. Luna Crescent Slash Wave check: Destroys incoming obstacles ahead in path
    if (luna.isSlashWaveActive) {
      const slashWorldZ = luna.mesh.position.z + luna.slashWaveMesh.position.z;
      for (const obs of obstacles) {
        if (!obs.active || obs.cleared) continue;
        if (
          obs.type === ObstacleType.CHEST ||
          obs.type === ObstacleType.BROKEN_BRIDGE ||
          obs.type === ObstacleType.SKILL_CHARGE_RUNE
        ) {
          continue;
        }
        if (Math.abs(obs.zPos - slashWorldZ) < 3.2) {
          obs.cleared = true;
          obs.mesh.position.y -= 25; // Smashed into oblivion
          if (obs.type === ObstacleType.SKILL_BARRIER) {
            return {
              hit: false,
              fatal: false,
              smashed: true,
              skillBarrierBroken: true,
              type: ObstacleType.SKILL_BARRIER
            };
          }
        }
      }
    }

    for (const obs of obstacles) {
      if (!obs.active || obs.cleared) continue;

      const zDist = Math.abs(playerZ - obs.zPos);

      // Early warning for incoming SKILL_BARRIER (spawns ~30m ahead)
      if (obs.type === ObstacleType.SKILL_BARRIER && !obs.warned) {
        if (zDist < 35.0 && zDist > 5.0 && playerZ > obs.zPos) {
          obs.warned = true;
          return {
            hit: false,
            fatal: false,
            skillBarrierWarning: true,
            type: ObstacleType.SKILL_BARRIER
          };
        }
      }

      // Early cull
      if (zDist > Math.max(obs.depth, 6.0)) continue;

      // 1. Mystery Chest Collectible (Safe pickup)
      if (obs.type === ObstacleType.CHEST) {
        const obsX = obs.lane * LANE_WIDTH;
        const xDist = Math.abs(playerX - obsX);
        if (xDist < (obs.width / 2 + playerRadius) && zDist < (obs.depth / 2 + 0.45)) {
          obs.cleared = true;
          obs.mesh.visible = false;
          return { hit: false, fatal: false, chestCollected: true, type: ObstacleType.CHEST };
        }
        continue;
      }

      // 2. Skill Charge Rune Collectible (Instantly recharges active skill)
      if (obs.type === ObstacleType.SKILL_CHARGE_RUNE) {
        const obsX = obs.lane * LANE_WIDTH;
        const xDist = Math.abs(playerX - obsX);
        if (xDist < (obs.width / 2 + playerRadius) && zDist < (obs.depth / 2 + 0.45)) {
          obs.cleared = true;
          obs.mesh.visible = false;
          luna.skillCooldownRemaining = 0; // Instant skill charge!
          return {
            hit: false,
            fatal: false,
            skillChargeCollected: true,
            type: ObstacleType.SKILL_CHARGE_RUNE
          };
        }
        continue;
      }

      // Nyx Shadow Shift: Passes right through all obstacles & pits with complete phasing immunity
      if (luna.currentCharacterId === 'nyx' && luna.isSkillActive) {
        if (obs.evaded) continue;
        const obsX = (obs.type === ObstacleType.LOW_ARCH || obs.type === ObstacleType.SKILL_BARRIER || obs.type === ObstacleType.BROKEN_BRIDGE)
          ? 0
          : obs.lane * LANE_WIDTH;
        const xDist = Math.abs(playerX - obsX);
        if (xDist < (obs.width / 2 + 1.2) && zDist < (obs.depth / 2 + 0.45)) {
          obs.evaded = true;
          if (obs.type === ObstacleType.SKILL_BARRIER) {
            obs.cleared = true;
            return {
              hit: false,
              fatal: false,
              evaded: true,
              skillBarrierBroken: true,
              type: ObstacleType.SKILL_BARRIER
            };
          }
          return { hit: false, fatal: false, evaded: true };
        }
        continue;
      }

      // 3. Broken Bridge (Chasm Gap)
      if (obs.type === ObstacleType.BROKEN_BRIDGE) {
        const halfGap = obs.depth / 2;
        if (playerZ <= obs.zPos + halfGap && playerZ >= obs.zPos - halfGap) {
          // Solaris during Juggernaut or Fever Mode can dash safely across the gap
          if ((luna.currentCharacterId === 'solaris' && luna.isSkillActive) || luna.isFeverMode) {
            continue;
          }
          // If not jumping high enough over the abyss
          if (playerY < 0.28) {
            obs.cleared = true;
            return { hit: true, type: ObstacleType.BROKEN_BRIDGE, fatal: true };
          }
        }
        continue;
      }

      // Solaris Juggernaut: Smashes through all standing obstacles!
      if (luna.currentCharacterId === 'solaris' && luna.isSkillActive) {
        if (obs.type === ObstacleType.CRUMBLING_PLATFORM) {
          continue; // Safely charges across crumbling platform
        }
        const obsX = (obs.type === ObstacleType.LOW_ARCH || obs.type === ObstacleType.SKILL_BARRIER)
          ? 0
          : (obs.lane * LANE_WIDTH);
        const xDist = Math.abs(playerX - obsX);
        if (xDist < (obs.width / 2 + playerRadius) && zDist < (obs.depth / 2 + 0.45)) {
          obs.cleared = true;
          obs.mesh.position.y -= 25;
          if (obs.type === ObstacleType.SKILL_BARRIER) {
            return {
              hit: false,
              fatal: false,
              smashed: true,
              skillBarrierBroken: true,
              type: ObstacleType.SKILL_BARRIER
            };
          }
          return { hit: false, fatal: false, smashed: true, type: obs.type };
        }
      }

      // 4. Low Stone Arch (Slide underneath - CENTER LANE ONLY!)
      if (obs.type === ObstacleType.LOW_ARCH) {
        if (zDist < (obs.depth / 2 + 0.35)) {
          const isCenterLane = Math.abs(playerX) < (LANE_WIDTH * 0.45);
          if (isSliding && isCenterLane) {
            // Safely pass underneath center crawl opening!
            continue;
          }
          if (luna.isFeverMode) {
            obs.cleared = true;
            obs.mesh.position.y -= 10;
            return { hit: false, fatal: false, smashed: true, type: ObstacleType.LOW_ARCH };
          }
          obs.cleared = true;
          return { hit: true, type: ObstacleType.LOW_ARCH, fatal: false };
        }
        continue;
      }

      // 5. Crumbling Platform
      if (obs.type === ObstacleType.CRUMBLING_PLATFORM) {
        if (luna.isFeverMode || (luna.currentCharacterId === 'solaris' && luna.isSkillActive)) {
          continue;
        }
        const obsX = obs.lane * LANE_WIDTH;
        const xDist = Math.abs(playerX - obsX);
        const warningDist = Math.max(8.0, currentSpeed * 0.7);

        if (zDist < warningDist && xDist < obs.width / 2 + 0.5) {
          obs.isCrumbling = true;
          obs.crumbleProgress = Math.min(1.0, obs.crumbleProgress + dt * 2.0);
          obs.mesh.position.x = obsX + (Math.random() - 0.5) * 0.14 * obs.crumbleProgress;

          if (obs.crumbleProgress >= 1.0 && zDist < obs.depth / 2 && xDist < obs.width / 2) {
            obs.mesh.position.y -= dt * 14;
            if (playerY < 0.3) {
              obs.cleared = true;
              return { hit: true, type: ObstacleType.CRUMBLING_PLATFORM, fatal: true };
            }
          }
        }
        continue;
      }

      // 6. Moving Obstacle (Oscillating)
      if (obs.type === ObstacleType.MOVING_OBSTACLE) {
        const obsX = obs.mesh.position.x;
        const xDist = Math.abs(playerX - obsX);

        if (xDist < (obs.width / 2 + playerRadius - 0.08) && zDist < (obs.depth / 2 + 0.35)) {
          if (luna.isFeverMode) {
            obs.cleared = true;
            obs.mesh.position.y -= 10;
            return { hit: false, fatal: false, smashed: true, type: ObstacleType.MOVING_OBSTACLE };
          }
          if (playerY < obs.height - 0.2) {
            obs.cleared = true;
            return { hit: true, type: ObstacleType.MOVING_OBSTACLE, fatal: false };
          }
        } else if (!obs.evaded && zDist < 0.8 && zDist > 0.05 && xDist < (obs.width / 2 + 1.35)) {
          obs.evaded = true;
          return { hit: false, fatal: false, evaded: true };
        }
        continue;
      }

      // 7. Mandatory Skill Barrier ("스킬을 사용하지 않으면 못 지나가는 장애물")
      if (obs.type === ObstacleType.SKILL_BARRIER) {
        const xDist = Math.abs(playerX);
        if (xDist < (obs.width / 2 + playerRadius) && zDist < (obs.depth / 2 + 0.45)) {
          // Check hero skills
          if (luna.isSlashWaveActive || (luna.currentCharacterId === 'luna' && luna.isSkillActive)) {
            obs.cleared = true;
            obs.mesh.position.y -= 25;
            return {
              hit: false,
              fatal: false,
              smashed: true,
              skillBarrierBroken: true,
              type: ObstacleType.SKILL_BARRIER
            };
          }
          if (luna.currentCharacterId === 'stella' && luna.isSkillActive) {
            obs.cleared = true;
            obs.mesh.position.y -= 25;
            return {
              hit: false,
              fatal: false,
              smashed: true,
              skillBarrierBroken: true,
              type: ObstacleType.SKILL_BARRIER
            };
          }
          if (luna.currentCharacterId === 'solaris' && luna.isSkillActive) {
            obs.cleared = true;
            obs.mesh.position.y -= 25;
            return {
              hit: false,
              fatal: false,
              smashed: true,
              skillBarrierBroken: true,
              type: ObstacleType.SKILL_BARRIER
            };
          }
          if (luna.currentCharacterId === 'nyx' && luna.isSkillActive) {
            obs.evaded = true;
            return {
              hit: false,
              fatal: false,
              evaded: true,
              skillBarrierBroken: true,
              type: ObstacleType.SKILL_BARRIER
            };
          }
          if (luna.isFeverMode) {
            obs.cleared = true;
            obs.mesh.position.y -= 25;
            return {
              hit: false,
              fatal: false,
              smashed: true,
              skillBarrierBroken: true,
              type: ObstacleType.SKILL_BARRIER
            };
          }

          // NO SKILL ACTIVE: Fatal obstacle hit!
          obs.cleared = true;
          return { hit: true, type: ObstacleType.SKILL_BARRIER, fatal: false };
        }
        continue;
      }

      // 8. Standard Standing Pillars & Monoliths (Pillar, Crystal Spike, Solar Monolith, Vine Brier, Magma Pillar, Void Obelisk)
      if (
        obs.type === ObstacleType.RUINED_PILLAR ||
        obs.type === ObstacleType.CRYSTAL_SPIKE ||
        obs.type === ObstacleType.SOLAR_MONOLITH ||
        obs.type === ObstacleType.VINE_BRIER ||
        obs.type === ObstacleType.MAGMA_PILLAR ||
        obs.type === ObstacleType.VOID_OBELISK
      ) {
        const obsX = obs.lane * LANE_WIDTH;
        const xDist = Math.abs(playerX - obsX);

        if (xDist < (obs.width / 2 + playerRadius - 0.08) && zDist < (obs.depth / 2 + 0.35)) {
          if (luna.isFeverMode) {
            obs.cleared = true;
            obs.mesh.position.y -= 10;
            return { hit: false, fatal: false, smashed: true, type: obs.type };
          }
          if (playerY < obs.height - 0.2) {
            obs.cleared = true;
            return { hit: true, type: obs.type, fatal: false };
          }
        } else if (!obs.evaded && zDist < 0.8 && zDist > 0.05 && xDist < (obs.width / 2 + 1.35)) {
          obs.evaded = true;
          return { hit: false, fatal: false, evaded: true };
        }
        continue;
      }
    }

    return { hit: false, fatal: false };
  }
}
