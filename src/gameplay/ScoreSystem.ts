import { StorageManager } from '../core/StorageManager';

export class ScoreSystem {
  public distance = 0;      // meters
  public sessionCoins = 0;  // shards collected in this run
  public elapsedTime = 0;   // seconds
  public currentScore = 0;
  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  public update(dt: number, speed: number): void {
    this.elapsedTime += dt;
    this.distance += speed * dt;
    this.currentScore = Math.floor(
      this.distance * 10 + this.sessionCoins * 50 + this.elapsedTime * 5
    );
  }

  public addCoin(): void {
    this.sessionCoins += 1;
    this.currentScore += 50;
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
    const finalCoins = this.sessionCoins;

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
  }
}
