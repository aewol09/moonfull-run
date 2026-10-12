import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreSystem } from '../src/gameplay/ScoreSystem';
import { StorageManager } from '../src/core/StorageManager';

describe('ScoreSystem', () => {
  let storage: StorageManager;
  let scoreSystem: ScoreSystem;

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      length: 0,
      key: () => null
    };

    storage = new StorageManager();
    scoreSystem = new ScoreSystem(storage);
  });

  it('should accurately calculate distance and real-time score', () => {
    scoreSystem.update(1.0, 10); // 1s at 10m/s = 10m
    expect(scoreSystem.distance).toBe(10);
    // formula: distance*10 + coins*50 + time*5 = 100 + 0 + 5 = 105
    expect(scoreSystem.currentScore).toBe(105);
  });

  it('should increase score when collecting coins', () => {
    scoreSystem.update(1.0, 10);
    scoreSystem.addCoin();
    scoreSystem.addCoin();

    expect(scoreSystem.sessionCoins).toBe(2);
    // 10*10 + 2*50 + 1*5 = 100 + 100 + 5 = 205
    expect(scoreSystem.currentScore).toBe(205);
  });

  it('should persist new high score on run finish', () => {
    scoreSystem.update(10, 20); // 200m
    scoreSystem.addCoin();

    const result = scoreSystem.finishRun();
    expect(result.isNewScore).toBe(true);
    expect(result.isNewDist).toBe(true);
    expect(result.coins).toBe(1);
    expect(storage.getData().highScore).toBe(result.score);
    expect(storage.getData().maxDistance).toBe(200);
  });
});
