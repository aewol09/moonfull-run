import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager, UPGRADE_MAX_LEVEL } from '../src/core/StorageManager';

describe('StorageManager', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    global.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      length: 0,
      key: () => null
    };
  });

  it('should initialize with default data on clean state', () => {
    const sm = new StorageManager();
    const data = sm.getData();
    expect(data.coins).toBe(0);
    expect(data.highScore).toBe(0);
    expect(data.upgrades.magnet).toBe(1);
    expect(data.settings.bgm).toBe(true);
  });

  it('should gracefully fallback to defaults if storage has corrupted JSON', () => {
    store['MOONFALL_RUN_SAVE_DATA_V1'] = 'INVALID_JSON_@@##';
    const sm = new StorageManager();
    const data = sm.getData();
    expect(data.coins).toBe(0);
    expect(data.upgrades.shield).toBe(1);
  });

  it('should spend and add coins correctly', () => {
    const sm = new StorageManager();
    sm.addCoins(500);
    expect(sm.getData().coins).toBe(500);

    const success = sm.spendCoins(200);
    expect(success).toBe(true);
    expect(sm.getData().coins).toBe(300);

    const fail = sm.spendCoins(1000);
    expect(fail).toBe(false);
    expect(sm.getData().coins).toBe(300);
  });

  it('should process upgrades and cap at max level', () => {
    const sm = new StorageManager();
    sm.addCoins(10000);

    for (let i = 1; i < UPGRADE_MAX_LEVEL; i++) {
      expect(sm.upgrade('magnet')).toBe(true);
    }

    expect(sm.getData().upgrades.magnet).toBe(UPGRADE_MAX_LEVEL);
    expect(sm.getUpgradeCost('magnet')).toBeNull();
    expect(sm.upgrade('magnet')).toBe(false); // cannot upgrade beyond max
  });
});
