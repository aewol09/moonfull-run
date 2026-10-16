import { StorageManager } from '../core/StorageManager';
import { LunaCharacter } from '../entities/LunaCharacter';
import { ScoreSystem } from './ScoreSystem';

export class UpgradeManager {
  private storage: StorageManager;
  private shieldCooldown = 0;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  // Coin Magnet parameters
  public getMagnetDuration(): number {
    const lvl = this.storage.getData().upgrades.magnet;
    return 3.0 + lvl * 2.5; // Lv1: 5.5s, Lv5: 15.5s
  }

  public getMagnetRadius(): number {
    const lvl = this.storage.getData().upgrades.magnet;
    return 3.5 + lvl * 1.3; // Lv1: 4.8m, Lv5: 10.0m
  }

  // Head Start bonus values
  public getHeadStartBonus(): { distance: number; coins: number } {
    const lvl = this.storage.getData().upgrades.headStart;
    const distanceBonus = (lvl - 1) * 60 + 50; // Lv1: 50m, Lv5: 290m
    const coinBonus = (lvl - 1) * 40 + 20;     // Lv1: 20, Lv5: 180
    return { distance: distanceBonus, coins: coinBonus };
  }

  // Shield parameters
  public getShieldRegenTime(): number | null {
    const lvl = this.storage.getData().upgrades.shield;
    if (lvl <= 1) return null; // Lv 1 doesn't regen after break
    return 70 - lvl * 10; // Lv2: 50s, Lv3: 40s, Lv4: 30s, Lv5: 20s
  }

  // Coin Shard Bonus Multiplier (Lv1: 1.0x, Lv5: 2.0x)
  public getCoinMultiplier(): number {
    const lvl = this.storage.getData().upgrades.coinBonus;
    return 1.0 + (lvl - 1) * 0.25;
  }

  // Starlight Fever Boost (Lv1: 5.0s & 1.5x, Lv5: 9.0s & 2.5x)
  public getFeverDuration(): number {
    const lvl = this.storage.getData().upgrades.feverBoost;
    return 5.0 + (lvl - 1) * 1.0;
  }

  public getFeverScoreMultiplier(): number {
    const lvl = this.storage.getData().upgrades.feverBoost;
    return 1.5 + (lvl - 1) * 0.25;
  }

  // Revive Mechanic: Unlocks at Lv 2 (1 free second-chance revive per run)
  private hasUsedReviveInRun = false;

  public canRevive(): boolean {
    const lvl = this.storage.getData().upgrades.revive;
    return lvl >= 2 && !this.hasUsedReviveInRun;
  }

  // Skill Mastery: Reduces active skill cooldown by up to 50%
  public getSkillCooldownMultiplier(): number {
    const lvl = this.storage.getData().upgrades.skillMastery;
    return Math.max(0.5, 1.0 - (lvl - 1) * 0.025);
  }

  // Lucky Chest: Increases in-game mystery chest spawn rate
  public getChestSpawnMultiplier(): number {
    const lvl = this.storage.getData().upgrades.luckyChest;
    return 1.0 + (lvl - 1) * 0.05;
  }

  public useRevive(): boolean {
    if (this.canRevive()) {
      this.hasUsedReviveInRun = true;
      return true;
    }
    return false;
  }

  public applyStartBuffs(luna: LunaCharacter, scoreSystem: ScoreSystem): void {
    // 1. Initial Shield
    luna.setShieldActive(true);
    this.shieldCooldown = 0;
    this.hasUsedReviveInRun = false;

    // 2. Start Bonus
    const bonus = this.getHeadStartBonus();
    scoreSystem.distance = bonus.distance;
    scoreSystem.sessionCoins = bonus.coins;
    // Initial Magnet buff for smooth pickup
    luna.magnetTimeRemaining = this.getMagnetDuration();
  }

  public update(dt: number, luna: LunaCharacter): void {
    // Check if shield was broken and needs regeneration
    if (!luna.hasShield) {
      const regenTime = this.getShieldRegenTime();
      if (regenTime !== null) {
        this.shieldCooldown += dt;
        if (this.shieldCooldown >= regenTime) {
          luna.setShieldActive(true);
          this.shieldCooldown = 0;
        }
      }
    }
  }

  public activateMagnet(luna: LunaCharacter): void {
    luna.magnetTimeRemaining = this.getMagnetDuration();
  }
}
