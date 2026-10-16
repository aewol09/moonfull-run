import { StorageManager } from '../core/StorageManager';

export class ScoreSystem {
  public distance = 0;      // meters
  public sessionCoins = 0;  // shards collected in this run
  public elapsedTime = 0;   // seconds
  public currentScore = 0;
  public bonusScore = 0;

  // Starlight Fever Mode State
  public feverGauge = 0;    // 0 to 100
  public isFever = false;
  public feverTimeRemaining = 0;
  public maxFeverDuration = 6.0;

  // Near-Miss Combo Multiplier State
  public comboCount = 0;
  public comboTimer = 0;
  public comboMultiplier = 1.0;

  // Shop consumable booster multiplier
  public bonusCoinMultiplier = 1.0;

  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  public update(dt: number, speed: number, feverScoreMultiplier = 1.0): void {
    this.elapsedTime += dt;
    this.distance += speed * dt;

    // Update Combo Decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMultiplier = 1.0;
      }
    }

    // Update Fever Duration & Gauge Drain
    if (this.isFever) {
      this.feverTimeRemaining -= dt;
      this.feverGauge = Math.max(0, (this.feverTimeRemaining / this.maxFeverDuration) * 100);
      if (this.feverTimeRemaining <= 0) {
        this.isFever = false;
        this.feverGauge = 0;
      }
    }

    const baseScore = this.distance * 10 + this.sessionCoins * 50 + this.elapsedTime * 5 + this.bonusScore;
    const mult = this.isFever ? feverScoreMultiplier : 1.0;
    this.currentScore = Math.floor(baseScore * mult);
  }

  public addCoin(multiplier = 1.0): boolean {
    const gained = Math.max(1, Math.round(multiplier));
    this.sessionCoins += gained;
    this.currentScore += 50 * gained;

    // Build fever gauge if not currently in fever
    if (!this.isFever) {
      this.feverGauge = Math.min(100, this.feverGauge + 6.0);
      if (this.feverGauge >= 100) {
        return true; // Signal fever activation ready
      }
    }
    return false;
  }

  public activateFever(duration: number): void {
    this.isFever = true;
    this.maxFeverDuration = duration;
    this.feverTimeRemaining = duration;
    this.feverGauge = 100;
  }

  public addEvasionBonus(): { points: number; combo: number; mult: number } {
    this.comboCount += 1;
    this.comboTimer = 3.5; // 3.5 seconds to chain next dodge
    this.comboMultiplier = Math.min(2.5, 1.0 + (this.comboCount - 1) * 0.15);

    const points = Math.floor(200 * this.comboMultiplier);
    this.bonusScore += points;

    return {
      points,
      combo: this.comboCount,
      mult: this.comboMultiplier
    };
  }

  public addSmashBonus(): number {
    const points = 500;
    this.bonusScore += points;
    return points;
  }

  public advanceDistance(dist: number): void {
    this.distance += dist;
  }

  public setBonusCoinMultiplier(mult: number): void {
    this.bonusCoinMultiplier = mult;
  }

  public finishRun(): {
    score: number;
    distance: number;
    coins: number;
    isNewScore: boolean;
    isNewDist: boolean;
    totalCoins: number;
  } {
    const finalScore = this.currentScore;
    const finalDist = Math.floor(this.distance);
    const vipMultiplier = this.storage.isVipMember() ? 2.0 : 1.0;
    const finalCoins = Math.floor(this.sessionCoins * this.bonusCoinMultiplier * vipMultiplier);

    // Add collected shards to persistent wallet
    const totalCoins = this.storage.addCoins(finalCoins);
    const { isNewScore, isNewDist } = this.storage.updateRecords(finalScore, finalDist);

    return {
      score: finalScore,
      distance: finalDist,
      coins: finalCoins,
      isNewScore,
      isNewDist,
      totalCoins
    };
  }

  public reset(): void {
    this.distance = 0;
    this.sessionCoins = 0;
    this.elapsedTime = 0;
    this.currentScore = 0;
    this.bonusScore = 0;
    this.feverGauge = 0;
    this.isFever = false;
    this.feverTimeRemaining = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1.0;
    this.bonusCoinMultiplier = 1.0;
  }
}
