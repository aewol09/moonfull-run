import { describe, it, expect, beforeEach } from 'vitest';
import { PatternManager } from '../src/world/PatternManager';
import { ObstacleType } from '../src/world/Obstacles';
import { GameStage } from '../src/gameplay/DifficultyDirector';

describe('PatternManager', () => {
  let pm: PatternManager;

  beforeEach(() => {
    pm = new PatternManager();
  });

  it('should unlock patterns progressively by distance', () => {
    const beginnerRes = pm.getNextPattern(0, 14, GameStage.STAGE_1);
    expect(beginnerRes.pattern.minDistance).toBeLessThanOrEqual(0);

    const advancedRes = pm.getNextPattern(600, 20, GameStage.STAGE_1);
    expect(advancedRes.pattern.minDistance).toBeLessThanOrEqual(600);
  });

  it('should not select the same pattern twice in a row', () => {
    const first = pm.getNextPattern(500, 15, GameStage.STAGE_1);
    const second = pm.getNextPattern(500, 15, GameStage.STAGE_1);
    expect(first.pattern.id).not.toBe(second.pattern.id);
  });

  it('should scale spacing multiplier with speed', () => {
    const baseMult = pm.getSpeedSpacingMultiplier(14);
    const highMult = pm.getSpeedSpacingMultiplier(28);

    expect(baseMult).toBeCloseTo(1.0, 2);
    expect(highMult).toBeGreaterThan(baseMult);
    expect(highMult).toBeCloseTo(1.45, 2);
  });

  it('should guarantee that no regular pillar blocks all 3 lanes at the same Z offset', () => {
    const patterns = (pm as unknown as { patterns: Array<{ id: string; obstacles: Array<{ type: ObstacleType; lane: number; offsetZ: number }> }> }).patterns;

    for (const p of patterns) {
      const zGroups = new Map<number, Set<number>>();
      for (const obs of p.obstacles) {
        if (
          obs.type === ObstacleType.RUINED_PILLAR ||
          obs.type === ObstacleType.VINE_BRIER ||
          obs.type === ObstacleType.CRYSTAL_SPIKE ||
          obs.type === ObstacleType.MAGMA_PILLAR ||
          obs.type === ObstacleType.SOLAR_MONOLITH ||
          obs.type === ObstacleType.VOID_OBELISK
        ) {
          if (!zGroups.has(obs.offsetZ)) {
            zGroups.set(obs.offsetZ, new Set());
          }
          zGroups.get(obs.offsetZ)!.add(obs.lane);
        }
      }

      for (const [z, lanes] of zGroups) {
        // Single lane obstacles must not block all 3 lanes (-1, 0, 1) simultaneously
        expect(lanes.size).toBeLessThan(3);
      }
    }
  });

  it('should provide distinct stage-themed patterns for each stage', () => {
    const stage1Patterns = pm.getPatternsForStage(GameStage.STAGE_1);
    const stage2Patterns = pm.getPatternsForStage(GameStage.STAGE_2);
    const stage3Patterns = pm.getPatternsForStage(GameStage.STAGE_3);
    const stage4Patterns = pm.getPatternsForStage(GameStage.STAGE_4);

    expect(stage1Patterns.length).toBeGreaterThanOrEqual(5);
    expect(stage2Patterns.length).toBeGreaterThanOrEqual(5);
    expect(stage3Patterns.length).toBeGreaterThanOrEqual(5);
    expect(stage4Patterns.length).toBeGreaterThanOrEqual(5);

    // Verify Stage 2 contains vine brier or crystal spike
    const stage2Types = stage2Patterns.flatMap(p => p.obstacles.map(o => o.type));
    expect(stage2Types).toContain(ObstacleType.VINE_BRIER);
    expect(stage2Types).toContain(ObstacleType.CRYSTAL_SPIKE);

    // Verify Stage 3 contains magma pillar or solar monolith
    const stage3Types = stage3Patterns.flatMap(p => p.obstacles.map(o => o.type));
    expect(stage3Types).toContain(ObstacleType.MAGMA_PILLAR);
    expect(stage3Types).toContain(ObstacleType.SOLAR_MONOLITH);

    // Verify Stage 4 contains void obelisk and skill barrier
    const stage4Types = stage4Patterns.flatMap(p => p.obstacles.map(o => o.type));
    expect(stage4Types).toContain(ObstacleType.VOID_OBELISK);
    expect(stage4Types).toContain(ObstacleType.SKILL_BARRIER);
  });

  it('should select patterns corresponding to the requested game stage', () => {
    const s2Res = pm.getNextPattern(0, 15, GameStage.STAGE_2);
    expect(s2Res.pattern.stage).toBe(GameStage.STAGE_2);

    const s3Res = pm.getNextPattern(0, 15, GameStage.STAGE_3);
    expect(s3Res.pattern.stage).toBe(GameStage.STAGE_3);

    const s4Res = pm.getNextPattern(0, 15, GameStage.STAGE_4);
    expect(s4Res.pattern.stage).toBe(GameStage.STAGE_4);
  });

  it('should include SKILL_CHARGE_RUNE ahead of every SKILL_BARRIER in patterns', () => {
    const patterns = (pm as unknown as { patterns: Array<{ id: string; obstacles: Array<{ type: ObstacleType; lane: number; offsetZ: number }> }> }).patterns;
    const skillPatterns = patterns.filter(p => p.obstacles.some(o => o.type === ObstacleType.SKILL_BARRIER));

    expect(skillPatterns.length).toBeGreaterThanOrEqual(2);
    for (const p of skillPatterns) {
      const barrier = p.obstacles.find(o => o.type === ObstacleType.SKILL_BARRIER)!;
      const rune = p.obstacles.find(o => o.type === ObstacleType.SKILL_CHARGE_RUNE);
      expect(rune).toBeDefined();
      // Rune must be placed ahead of barrier (offsetZ closer to player or earlier in traversal)
      expect(rune!.offsetZ).toBeGreaterThan(barrier.offsetZ);
    }
  });
});
