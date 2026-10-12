import { describe, it, expect, beforeEach } from 'vitest';
import { PatternManager } from '../src/world/PatternManager';
import { ObstacleType } from '../src/world/Obstacles';

describe('PatternManager', () => {
  let pm: PatternManager;

  beforeEach(() => {
    pm = new PatternManager();
  });

  it('should unlock patterns progressively by distance', () => {
    const beginnerRes = pm.getNextPattern(0, 14);
    expect(beginnerRes.pattern.minDistance).toBeLessThanOrEqual(0);

    const advancedRes = pm.getNextPattern(600, 20);
    expect(advancedRes.pattern.minDistance).toBeLessThanOrEqual(600);
  });

  it('should not select the same pattern twice in a row', () => {
    const first = pm.getNextPattern(500, 15);
    const second = pm.getNextPattern(500, 15);
    expect(first.pattern.id).not.toBe(second.pattern.id);
  });

  it('should scale spacing multiplier with speed', () => {
    const baseMult = pm.getSpeedSpacingMultiplier(14);
    const highMult = pm.getSpeedSpacingMultiplier(28);

    expect(baseMult).toBeCloseTo(1.0, 2);
    expect(highMult).toBeGreaterThan(baseMult);
    expect(highMult).toBeCloseTo(1.55, 2);
  });

  it('should guarantee that no pattern blocks all 3 lanes at the same Z offset', () => {
    // Check all configured patterns
    // Test that for any Z offset in any pattern, at least 1 lane remains clear
    const patterns = (pm as unknown as { patterns: Array<{ id: string; obstacles: Array<{ type: ObstacleType; lane: number; offsetZ: number }> }> }).patterns;

    for (const p of patterns) {
      const zGroups = new Map<number, Set<number>>();
      for (const obs of p.obstacles) {
        if (obs.type === ObstacleType.RUINED_PILLAR) {
          if (!zGroups.has(obs.offsetZ)) {
            zGroups.set(obs.offsetZ, new Set());
          }
          zGroups.get(obs.offsetZ)!.add(obs.lane);
        }
      }

      for (const [z, lanes] of zGroups) {
        // Must never block all 3 lanes (-1, 0, 1)
        expect(lanes.size).toBeLessThan(3);
      }
    }
  });
});
