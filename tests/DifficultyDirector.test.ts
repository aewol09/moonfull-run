import { describe, it, expect, beforeEach } from 'vitest';
import { DifficultyDirector, GameStage } from '../src/gameplay/DifficultyDirector';

describe('DifficultyDirector', () => {
  let director: DifficultyDirector;

  beforeEach(() => {
    director = new DifficultyDirector();
  });

  it('should start at Stage 1 with initial speed', () => {
    expect(director.currentStage).toBe(GameStage.STAGE_1);
    expect(director.getSpeed()).toBe(14.0);
  });

  it('should scale speed with distance up to maxSpeed', () => {
    director.update(1000);
    expect(director.getSpeed()).toBeGreaterThan(14.0);

    // Far distance
    director.update(100000);
    expect(director.getSpeed()).toBe(director.maxSpeed);
  });

  it('should correctly determine all 10 stages based on distance', () => {
    expect(director.getStage(0)).toBe(GameStage.STAGE_1);
    expect(director.getStage(850)).toBe(GameStage.STAGE_2);
    expect(director.getStage(1900)).toBe(GameStage.STAGE_3);
    expect(director.getStage(3200)).toBe(GameStage.STAGE_4);
    expect(director.getStage(4600)).toBe(GameStage.STAGE_5);
    expect(director.getStage(6200)).toBe(GameStage.STAGE_6);
    expect(director.getStage(8000)).toBe(GameStage.STAGE_7);
    expect(director.getStage(10000)).toBe(GameStage.STAGE_8);
    expect(director.getStage(12500)).toBe(GameStage.STAGE_9);
    expect(director.getStage(15000)).toBe(GameStage.STAGE_10);
    expect(director.getStage(25000)).toBe(GameStage.STAGE_10); // Infinite stage
  });

  it('should detect stage transitions correctly', () => {
    expect(director.checkStageTransition(100)).toBeNull(); // Still Stage 1
    const transition = director.checkStageTransition(850); // Transitions to Stage 2
    expect(transition).not.toBeNull();
    expect(transition?.stage).toBe(GameStage.STAGE_2);
    expect(transition?.name).toBe('별빛 안개 숲');
  });

  it('should reset properly back to Stage 1 and initial speed', () => {
    director.update(10000);
    director.checkStageTransition(10000);
    expect(director.currentStage).toBe(GameStage.STAGE_8);

    director.reset();
    expect(director.currentStage).toBe(GameStage.STAGE_1);
    expect(director.getSpeed()).toBe(director.initialSpeed);
  });

  it('should scale obstacle frequency multiplier upwards as stages advance', () => {
    const freqStage1 = director.getObstacleFrequencyMultiplier(GameStage.STAGE_1);
    const freqStage2 = director.getObstacleFrequencyMultiplier(GameStage.STAGE_2);
    const freqStage3 = director.getObstacleFrequencyMultiplier(GameStage.STAGE_3);
    const freqStage4 = director.getObstacleFrequencyMultiplier(GameStage.STAGE_4);
    const freqStage10 = director.getObstacleFrequencyMultiplier(GameStage.STAGE_10);

    expect(freqStage1).toBeCloseTo(1.0, 2);
    expect(freqStage2).toBeGreaterThan(freqStage1);
    expect(freqStage3).toBeGreaterThan(freqStage2);
    expect(freqStage4).toBeGreaterThan(freqStage3);
    expect(freqStage10).toBeGreaterThanOrEqual(3.0);
  });

  it('should contract safe buffer distance as stages advance', () => {
    const bufStage1 = director.getSafeBufferDistance(GameStage.STAGE_1);
    const bufStage2 = director.getSafeBufferDistance(GameStage.STAGE_2);
    const bufStage4 = director.getSafeBufferDistance(GameStage.STAGE_4);
    const bufStage10 = director.getSafeBufferDistance(GameStage.STAGE_10);

    expect(bufStage1).toBe(18);
    expect(bufStage2).toBeLessThan(bufStage1);
    expect(bufStage4).toBeLessThan(bufStage2);
    expect(bufStage10).toBe(5);
  });
});
