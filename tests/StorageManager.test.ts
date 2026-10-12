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

  it('should process upgrades with exact cost progression and cap at max level', () => {
    const sm = new StorageManager();
    // Default Lv 1 cost should be 100
    expect(sm.getUpgradeCost('magnet')).toBe(100);

    sm.addCoins(100);
    expect(sm.upgrade('magnet')).toBe(true);
    expect(sm.getData().upgrades.magnet).toBe(2);
    expect(sm.getUpgradeCost('magnet')).toBe(250);

    sm.addCoins(250);
    expect(sm.upgrade('magnet')).toBe(true);
    expect(sm.getData().upgrades.magnet).toBe(3);
    expect(sm.getUpgradeCost('magnet')).toBe(500);

    sm.addCoins(500);
    expect(sm.upgrade('magnet')).toBe(true);
    expect(sm.getData().upgrades.magnet).toBe(4);
    expect(sm.getUpgradeCost('magnet')).toBe(1000);

    sm.addCoins(1000);
    expect(sm.upgrade('magnet')).toBe(true);
    expect(sm.getData().upgrades.magnet).toBe(5);
    expect(sm.getUpgradeCost('magnet')).toBeNull();
    expect(sm.upgrade('magnet')).toBe(false); // cannot upgrade beyond max
  });

  it('should manage costume unlock and equipping persistence', () => {
    const sm = new StorageManager();
    expect(sm.getData().currentCostume).toBe('default');
    expect(sm.isCostumeUnlocked('default')).toBe(true);
    expect(sm.isCostumeUnlocked('guardian')).toBe(false);

    // Cannot equip locked costume
    expect(sm.equipCostume('guardian')).toBe(false);

    // Unlock costume
    sm.unlockCostume('guardian');
    expect(sm.isCostumeUnlocked('guardian')).toBe(true);

    // Now equip succeeds
    expect(sm.equipCostume('guardian')).toBe(true);
    expect(sm.getData().currentCostume).toBe('guardian');
  });
});
