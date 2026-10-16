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
    expect(sm.getUpgradeCost('magnet')).toBe(1400);

    // Max level check
    (sm as unknown as { data: { upgrades: { magnet: number } } }).data.upgrades.magnet = UPGRADE_MAX_LEVEL;
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

    // Unlock costume (Luna is unlocked by default, so Luna's costumes can be unlocked)
    sm.unlockCostume('guardian');
    expect(sm.isCostumeUnlocked('guardian')).toBe(true);

    // Now equip succeeds
    expect(sm.equipCostume('guardian')).toBe(true);
    expect(sm.getData().currentCostume).toBe('luna_guardian');
  });

  it('should prevent unlocking costumes if character is not yet unlocked', () => {
    const sm = new StorageManager();
    // Solaris is locked by default
    expect(sm.isCharacterUnlocked('solaris')).toBe(false);

    // Attempting to unlock Solaris costume must fail even with abundant coins!
    sm.addCoins(10000);
    expect(sm.unlockCostume('solaris_obsidian', 600)).toBe(false);
    expect(sm.isCostumeUnlocked('solaris_obsidian')).toBe(false);
    expect(sm.equipCostume('solaris_obsidian')).toBe(false);

    // After unlocking Solaris character, skin purchase is now permitted
    expect(sm.unlockCharacter('solaris', 1200)).toBe(true);
    expect(sm.isCharacterUnlocked('solaris')).toBe(true);

    expect(sm.unlockCostume('solaris_obsidian', 600)).toBe(true);
    expect(sm.isCostumeUnlocked('solaris_obsidian')).toBe(true);
    expect(sm.equipCostume('solaris_obsidian', 'solaris')).toBe(true);
    expect(sm.getEquippedCostume('solaris')).toBe('solaris_obsidian');
  });

  it('should successfully buy starter cash package and receive rewards', () => {
    const sm = new StorageManager();
    const initCoins = sm.getData().coins;
    const initChests = sm.getData().mysteryChests;

    const res = sm.buyCashPackage('starter_pack');
    expect(res.success).toBe(true);
    expect(sm.getData().coins).toBe(initCoins + 5000);
    expect(sm.getData().mysteryChests).toBe(initChests + 5);
    expect(sm.getInventoryCount('revive_feather')).toBe(5);
    expect(sm.getInventoryCount('start_shield')).toBe(10);
  });

  it('should successfully buy VIP cash package and activate VIP perks', () => {
    const sm = new StorageManager();
    expect(sm.isVipMember()).toBe(false);

    const res = sm.buyCashPackage('vip_unlimited');
    expect(res.success).toBe(true);
    expect(sm.isVipMember()).toBe(true);
    expect(sm.getData().coins).toBeGreaterThanOrEqual(20000);
  });

  it('should unlock all characters when buying mythic truck package', () => {
    const sm = new StorageManager();
    expect(sm.isCharacterUnlocked('stella')).toBe(false);
    expect(sm.isCharacterUnlocked('solaris')).toBe(false);
    expect(sm.isCharacterUnlocked('nyx')).toBe(false);

    const res = sm.buyCashPackage('mythic_truck');
    expect(res.success).toBe(true);
    expect(sm.isCharacterUnlocked('stella')).toBe(true);
    expect(sm.isCharacterUnlocked('solaris')).toBe(true);
    expect(sm.isCharacterUnlocked('nyx')).toBe(true);
    expect(sm.getData().coins).toBeGreaterThanOrEqual(120000);
    expect(sm.getData().mysteryChests).toBeGreaterThanOrEqual(40);
  });
});
