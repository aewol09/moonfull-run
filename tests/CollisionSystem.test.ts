import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import * as THREE from 'three';
import { CollisionSystem } from '../src/world/CollisionSystem';
import { LunaCharacter, CharacterState, LANE_WIDTH } from '../src/entities/LunaCharacter';
import { ObstacleFactory } from '../src/world/Obstacles';

describe('CollisionSystem', () => {
  let collisionSystem: CollisionSystem;
  let luna: LunaCharacter;

  beforeAll(() => {
    collisionSystem = new CollisionSystem();
    luna = new LunaCharacter();
  });

  beforeEach(() => {
    luna.reset();
  });

  it('should detect collision when running through a low arch without sliding', () => {
    const arch = ObstacleFactory.createLowArch(0, -10);
    luna.mesh.position.set(0, 0, -10);
    luna.state = CharacterState.RUN;

    const result = collisionSystem.checkCollisions(luna, [arch], 0.016);
    expect(result.hit).toBe(true);
    expect(result.fatal).toBe(false);
  });

  it('should safely pass under a low arch when sliding in center lane', () => {
    const arch = ObstacleFactory.createLowArch(0, -10);
    luna.mesh.position.set(0, 0, -10);
    luna.state = CharacterState.SLIDE;

    const result = collisionSystem.checkCollisions(luna, [arch], 0.016);
    expect(result.hit).toBe(false);
  });

  it('should collide with low arch when sliding in left or right side lanes', () => {
    const arch = ObstacleFactory.createLowArch(0, -10);

    // Left side lane sliding -> hits barrier
    luna.mesh.position.set(-LANE_WIDTH, 0, -10);
    luna.state = CharacterState.SLIDE;
    let result = collisionSystem.checkCollisions(luna, [arch], 0.016);
    expect(result.hit).toBe(true);
    expect(result.fatal).toBe(false);

    // Right side lane sliding -> hits barrier
    arch.cleared = false;
    luna.mesh.position.set(LANE_WIDTH, 0, -10);
    luna.state = CharacterState.SLIDE;
    result = collisionSystem.checkCollisions(luna, [arch], 0.016);
    expect(result.hit).toBe(true);
    expect(result.fatal).toBe(false);
  });

  it('should detect fatal pit fall on broken bridge when not jumping', () => {
    const bridge = ObstacleFactory.createBrokenBridge(0, -20);
    luna.mesh.position.set(0, 0, -20);
    luna.posY = 0; // On the ground in the gap
    luna.state = CharacterState.RUN;

    const result = collisionSystem.checkCollisions(luna, [bridge], 0.016);
    expect(result.hit).toBe(true);
    expect(result.fatal).toBe(true); // Pit falls are always fatal
  });

  it('should safely clear broken bridge when jumping high over it', () => {
    const bridge = ObstacleFactory.createBrokenBridge(0, -20);
    luna.mesh.position.set(0, 0, -20);
    luna.posY = 1.8; // High in midair
    luna.state = CharacterState.JUMP;

    const result = collisionSystem.checkCollisions(luna, [bridge], 0.016);
    expect(result.hit).toBe(false);
  });

  it('should collide with a ruined pillar in same lane and dodge in open lane', () => {
    const pillarLeft = ObstacleFactory.createPillar(-1, -15);

    // 1. Same lane (-1) collision
    luna.mesh.position.set(-1 * LANE_WIDTH, 0, -15);
    let result = collisionSystem.checkCollisions(luna, [pillarLeft], 0.016);
    expect(result.hit).toBe(true);

    // 2. Open lane (0) dodge
    pillarLeft.cleared = false;
    luna.mesh.position.set(0, 0, -15);
    result = collisionSystem.checkCollisions(luna, [pillarLeft], 0.016);
    expect(result.hit).toBe(false);
  });

  it('should trigger crumbling platform and detect pit fall when collapsed', () => {
    const platform = ObstacleFactory.createCrumblingPlatform(0, -30);
    luna.mesh.position.set(0, 0, -30);
    luna.posY = 0;

    // Platform begins crumbling
    let result = collisionSystem.checkCollisions(luna, [platform], 0.016, 15);
    expect(platform.isCrumbling).toBe(true);
    expect(result.hit).toBe(false);

    // Platform fully collapsed
    platform.crumbleProgress = 1.0;
    result = collisionSystem.checkCollisions(luna, [platform], 0.016, 15);
    expect(result.hit).toBe(true);
    expect(result.fatal).toBe(true);
  });

  it('should detect collision with moving obstacle at its position', () => {
    const moving = ObstacleFactory.createMovingObstacle(0, -40);
    moving.mesh.position.x = 0;
    luna.mesh.position.set(0, 0, -40);

    const result = collisionSystem.checkCollisions(luna, [moving], 0.016, 15);
    expect(result.hit).toBe(true);
    expect(result.fatal).toBe(false);
  });

  describe('Skill Barrier (Mandatory Skill Obstacle)', () => {
    it('should block player across all lanes if no skill is active, even when jumping or sliding', () => {
      // Test center lane
      const barrier = ObstacleFactory.createSkillBarrier(0, -50);
      luna.mesh.position.set(0, 0, -50);
      luna.state = CharacterState.RUN;
      let result = collisionSystem.checkCollisions(luna, [barrier], 0.016);
      expect(result.hit).toBe(true);

      // Test left lane with jump
      barrier.cleared = false;
      luna.mesh.position.set(-LANE_WIDTH, 1.8, -50);
      luna.state = CharacterState.JUMP;
      result = collisionSystem.checkCollisions(luna, [barrier], 0.016);
      expect(result.hit).toBe(true);

      // Test right lane with slide
      barrier.cleared = false;
      luna.mesh.position.set(LANE_WIDTH, 0, -50);
      luna.state = CharacterState.SLIDE;
      result = collisionSystem.checkCollisions(luna, [barrier], 0.016);
      expect(result.hit).toBe(true);
    });

    it('should warn player when approaching skill barrier within 35 meters', () => {
      const barrier = ObstacleFactory.createSkillBarrier(0, -60);
      barrier.warned = false;
      luna.mesh.position.set(0, 0, -35); // 25m away

      const result = collisionSystem.checkCollisions(luna, [barrier], 0.016);
      expect(result.skillBarrierWarning).toBe(true);
      expect(barrier.warned).toBe(true);
    });

    it('should smash skill barrier when Luna activates Crescent Slash Wave or active skill', () => {
      const barrier = ObstacleFactory.createSkillBarrier(0, -50);
      luna.applyCharacter('luna');
      luna.mesh.position.set(0, 0, -50);
      luna.isSkillActive = true;

      const result = collisionSystem.checkCollisions(luna, [barrier], 0.016);
      expect(result.hit).toBe(false);
      expect(result.smashed).toBe(true);
      expect(result.skillBarrierBroken).toBe(true);
      expect(barrier.cleared).toBe(true);
    });

    it('should smash skill barrier when Stella activates Celestial Starfall', () => {
      const barrier = ObstacleFactory.createSkillBarrier(0, -50);
      luna.applyCharacter('stella');
      luna.mesh.position.set(0, 0, -50);
      luna.isSkillActive = true;

      const result = collisionSystem.checkCollisions(luna, [barrier], 0.016);
      expect(result.hit).toBe(false);
      expect(result.smashed).toBe(true);
      expect(result.skillBarrierBroken).toBe(true);
    });

    it('should smash skill barrier when Solaris activates Sunfire Juggernaut', () => {
      const barrier = ObstacleFactory.createSkillBarrier(0, -50);
      luna.applyCharacter('solaris');
      luna.mesh.position.set(0, 0, -50);
      luna.isSkillActive = true;

      const result = collisionSystem.checkCollisions(luna, [barrier], 0.016);
      expect(result.hit).toBe(false);
      expect(result.smashed).toBe(true);
      expect(result.skillBarrierBroken).toBe(true);
    });

    it('should phase through skill barrier when Nyx activates Shadow Shift', () => {
      const barrier = ObstacleFactory.createSkillBarrier(0, -50);
      luna.applyCharacter('nyx');
      luna.mesh.position.set(0, 0, -50);
      luna.isSkillActive = true;

      const result = collisionSystem.checkCollisions(luna, [barrier], 0.016);
      expect(result.hit).toBe(false);
      expect(result.evaded).toBe(true);
      expect(result.skillBarrierBroken).toBe(true);
    });

    it('should smash skill barrier when Fever Mode is active', () => {
      const barrier = ObstacleFactory.createSkillBarrier(0, -50);
      luna.mesh.position.set(0, 0, -50);
      luna.isFeverMode = true;

      const result = collisionSystem.checkCollisions(luna, [barrier], 0.016);
      expect(result.hit).toBe(false);
      expect(result.smashed).toBe(true);
      expect(result.skillBarrierBroken).toBe(true);
    });
  });

  describe('Skill Charge Rune', () => {
    it('should instantly recharge character skill cooldown upon pickup', () => {
      const rune = ObstacleFactory.createSkillChargeRune(0, -45);
      luna.skillCooldownRemaining = 12.5; // On long cooldown
      luna.mesh.position.set(0, 0, -45);

      const result = collisionSystem.checkCollisions(luna, [rune], 0.016);
      expect(result.skillChargeCollected).toBe(true);
      expect(luna.skillCooldownRemaining).toBe(0);
      expect(rune.cleared).toBe(true);
    });
  });

  describe('Stage Themed Obstacles', () => {
    it('should collide with Vine Brier (Stage 2) in lane and dodge when moving away', () => {
      const vine = ObstacleFactory.createVineBrier(1, -70);
      luna.mesh.position.set(LANE_WIDTH, 0, -70);
      let result = collisionSystem.checkCollisions(luna, [vine], 0.016);
      expect(result.hit).toBe(true);

      vine.cleared = false;
      luna.mesh.position.set(0, 0, -70); // moved to center
      result = collisionSystem.checkCollisions(luna, [vine], 0.016);
      expect(result.hit).toBe(false);
    });

    it('should collide with Magma Pillar (Stage 3) in lane and dodge when moving away', () => {
      const magma = ObstacleFactory.createMagmaPillar(-1, -80);
      luna.mesh.position.set(-LANE_WIDTH, 0, -80);
      let result = collisionSystem.checkCollisions(luna, [magma], 0.016);
      expect(result.hit).toBe(true);

      magma.cleared = false;
      luna.mesh.position.set(0, 0, -80);
      result = collisionSystem.checkCollisions(luna, [magma], 0.016);
      expect(result.hit).toBe(false);
    });

    it('should collide with Void Obelisk (Stage 4) in lane and dodge when moving away', () => {
      const obelisk = ObstacleFactory.createVoidObelisk(0, -90);
      luna.mesh.position.set(0, 0, -90);
      let result = collisionSystem.checkCollisions(luna, [obelisk], 0.016);
      expect(result.hit).toBe(true);

      obelisk.cleared = false;
      luna.mesh.position.set(LANE_WIDTH, 0, -90);
      result = collisionSystem.checkCollisions(luna, [obelisk], 0.016);
      expect(result.hit).toBe(false);
    });
  });
});
