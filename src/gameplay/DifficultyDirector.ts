export class DifficultyDirector {
  public readonly initialSpeed = 14.0;
  public readonly maxSpeed = 28.0;
  public readonly accelerationPer100m = 0.5;

  private currentSpeed = 14.0;

  public getSpeed(): number {
    return this.currentSpeed;
  }

  public update(currentDistance: number): number {
    const speedBoost = (currentDistance / 100) * this.accelerationPer100m;
    this.currentSpeed = Math.min(this.maxSpeed, this.initialSpeed + speedBoost);
    return this.currentSpeed;
  }

  public reset(): void {
    this.currentSpeed = this.initialSpeed;
  }
}
