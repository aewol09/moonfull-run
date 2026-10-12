import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CollisionSystem } from '../src/world/CollisionSystem';
import { LunaCharacter, CharacterState, LANE_WIDTH } from '../src/entities/LunaCharacter';
import { ObstacleFactory } from '../src/world/Obstacles';

describe('CollisionSystem', () => {
  let collisionSystem: CollisionSystem;
  let luna: LunaCharacter;

  beforeEach(() => {
    collisionSystem = new CollisionSystem();
    luna = new LunaCharacter();
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

  it('should safely pass under a low arch when sliding', () => {
    const arch = ObstacleFactory.createLowArch(0, -10);
    luna.mesh.position.set(0, 0, -10);
    luna.state = CharacterState.SLIDE;

    const result = collisionSystem.checkCollisions(luna, [arch], 0.016);
    expect(result.hit).toBe(false);
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
});
