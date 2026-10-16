import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager, CHARACTERS } from '../src/core/StorageManager';

describe('Character and Gacha Systems', () => {
  let storage: StorageManager;

  beforeEach(() => {
    localStorage.clear();
    storage = new StorageManager();
  });

  it('should have 4 characters defined with skills and costs', () => {
    expect(Object.keys(CHARACTERS)).toEqual(['luna', 'stella', 'solaris', 'nyx']);
    expect(CHARACTERS.luna.unlockedByDefault).toBe(true);
    expect(CHARACTERS.stella.unlockedByDefault).toBe(false);
    expect(CHARACTERS.solaris.cost).toBe(1200);
    expect(CHARACTERS.nyx.cost).toBe(2500);
  });

  it('should select unlocked characters and reject locked characters', () => {
    expect(storage.isCharacterUnlocked('luna')).toBe(true);
    expect(storage.selectCharacter('luna')).toBe(true);
    expect(storage.getData().currentCharacter).toBe('luna');

    // Stella is locked initially
    expect(storage.isCharacterUnlocked('stella')).toBe(false);
    expect(storage.selectCharacter('stella')).toBe(false);

    // Give coins and unlock Stella
    storage.addCoins(600);
    expect(storage.unlockCharacter('stella')).toBe(true);
    expect(storage.isCharacterUnlocked('stella')).toBe(true);
    expect(storage.selectCharacter('stella')).toBe(true);
    expect(storage.getData().currentCharacter).toBe('stella');
  });

  it('should add mystery chests and open them with valid rewards', () => {
    expect(storage.getData().mysteryChests).toBe(0);
    storage.addMysteryChests(3);
    expect(storage.getData().mysteryChests).toBe(3);

    const reward = storage.openMysteryChest();
    expect(reward).not.toBeNull();
    expect(reward?.label).toBeDefined();
    expect(storage.getData().mysteryChests).toBe(2);
    expect(storage.getData().totalChestsOpened).toBe(1);
  });

  it('should perform single and 10x gacha pulls with rewards', () => {
    // Cannot pull with insufficient coins
    expect(storage.performGacha(1)).toBeNull();

    // Add coins for 1x pull (cost 500)
    storage.addCoins(500);
    const singlePull = storage.performGacha(1);
    expect(singlePull).not.toBeNull();
    expect(singlePull?.length).toBe(1);
    expect(['SSR', 'SR', 'R']).toContain(singlePull?.[0].rarity);

    // Add coins for 10x pull (cost 4500)
    storage.addCoins(4500);
    const multiPull = storage.performGacha(10);
    expect(multiPull).not.toBeNull();
    expect(multiPull?.length).toBe(10);
  });

  it('should manage character-specific costumes independently', () => {
    // Check Luna default costume
    expect(storage.getEquippedCostume('luna')).toBe('luna_default');
    expect(storage.getCostumesForCharacter('luna').length).toBe(3);

    // Check Solaris default and costumes
    expect(storage.getEquippedCostume('solaris')).toBe('solaris_default');
    expect(storage.getCostumesForCharacter('solaris').length).toBe(3);

    // Trying to unlock costume without owning character fails
    storage.addCoins(2000);
    expect(storage.unlockCostume('solaris_obsidian', 600)).toBe(false);

    // Unlock Solaris character first (cost 1000)
    expect(storage.unlockCharacter('solaris', 1000)).toBe(true);

    // Now unlocking and equipping solaris obsidian costume succeeds
    expect(storage.unlockCostume('solaris_obsidian', 600)).toBe(true);
    expect(storage.equipCostume('solaris_obsidian', 'solaris')).toBe(true);
    expect(storage.getEquippedCostume('solaris')).toBe('solaris_obsidian');
    // Luna's costume remains unchanged
    expect(storage.getEquippedCostume('luna')).toBe('luna_default');
  });
});

