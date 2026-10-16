export enum GameStage {
  STAGE_1 = 1,  // 0 ~ 400m: 달빛 유적지 (Moonlit Ruins)
  STAGE_2 = 2,  // 400 ~ 900m: 별빛 안개 숲 (Starlight Misty Forest)
  STAGE_3 = 3,  // 900 ~ 1500m: 보랏빛 성역 (Amethyst Sanctuary)
  STAGE_4 = 4,  // 1500 ~ 2200m: 비취석 협곡 (Jade Canyon)
  STAGE_5 = 5,  // 2200 ~ 3000m: 황혼의 고대 신전 (Twilight Temple)
  STAGE_6 = 6,  // 3000 ~ 3900m: 붉은 달의 회랑 (Crimson Moon Corridor)
  STAGE_7 = 7,  // 3900 ~ 4900m: 얼어붙은 별의 빙하 (Glacial Frost Hollow)
  STAGE_8 = 8,  // 4900 ~ 6000m: 태양의 일식 신전 (Solar Eclipse Citadel)
  STAGE_9 = 9,  // 6000 ~ 7200m: 공허의 심연 제단 (Void Abyssal Spire)
  STAGE_10 = 10 // 7200m+: 끝없는 별빛의 시련 (Infinite Celestial Chaos)
}

export interface StageInfo {
  stage: GameStage;
  name: string;
  themeDesc: string;
  minDistance: number;
}

export class DifficultyDirector {
  public readonly initialSpeed = 14.0;
  public readonly maxSpeed = 35.0; // Scaled up for 10 stages
  public readonly accelerationPer100m = 0.14; // Paced across 15,000m

  private currentSpeed = 14.0;
  public currentStage: GameStage = GameStage.STAGE_1;

  public static readonly STAGE_CONFIGS: Record<GameStage, StageInfo> = {
    [GameStage.STAGE_1]: {
      stage: GameStage.STAGE_1,
      name: '달빛 유적지',
      themeDesc: '무너진 고대 기둥과 밤하늘 별빛이 내리는 시작의 길',
      minDistance: 0
    },
    [GameStage.STAGE_2]: {
      stage: GameStage.STAGE_2,
      name: '별빛 안개 숲',
      themeDesc: '신비로운 에메랄드 안개와 반딧불이가 춤추는 고대 숲',
      minDistance: 800
    },
    [GameStage.STAGE_3]: {
      stage: GameStage.STAGE_3,
      name: '보랏빛 성역',
      themeDesc: '보랏빛 크리스탈과 아케인 센티넬이 도사리는 성소',
      minDistance: 1800
    },
    [GameStage.STAGE_4]: {
      stage: GameStage.STAGE_4,
      name: '비취석 협곡',
      themeDesc: '비취석 암석과 푸른 오로라가 흐르는 험준한 협곡',
      minDistance: 3000
    },
    [GameStage.STAGE_5]: {
      stage: GameStage.STAGE_5,
      name: '황혼의 고대 신전',
      themeDesc: '붉은 노을빛과 고대 황금 수호석이 자리한 황혼의 제단',
      minDistance: 4400
    },
    [GameStage.STAGE_6]: {
      stage: GameStage.STAGE_6,
      name: '붉은 달의 회랑',
      themeDesc: '핏빛 블러드문이 떠올라 위험한 마력이 요동치는 회랑',
      minDistance: 6000
    },
    [GameStage.STAGE_7]: {
      stage: GameStage.STAGE_7,
      name: '얼어붙은 별의 빙하',
      themeDesc: '차가운 푸른 서리와 영원한 얼음 기둥이 둘러싼 혹한의 설원',
      minDistance: 7800
    },
    [GameStage.STAGE_8]: {
      stage: GameStage.STAGE_8,
      name: '태양의 일식 신전',
      themeDesc: '황금빛 태양석과 고대 석판이 지키는 최후의 일식 제단',
      minDistance: 9800
    },
    [GameStage.STAGE_9]: {
      stage: GameStage.STAGE_9,
      name: '공허의 심연 제단',
      themeDesc: '차원의 틈새에서 공허의 에너지가 소용돌이치는 심연의 첨탑',
      minDistance: 12000
    },
    [GameStage.STAGE_10]: {
      stage: GameStage.STAGE_10,
      name: '끝없는 별빛의 시련',
      themeDesc: '우주의 모든 원소가 격돌하는 무한의 초고속 한계 영역',
      minDistance: 14500
    }
  };

  public getSpeed(): number {
    return this.currentSpeed;
  }

  public update(currentDistance: number): number {
    const speedBoost = (currentDistance / 100) * this.accelerationPer100m;
    this.currentSpeed = Math.min(this.maxSpeed, this.initialSpeed + speedBoost);
    return this.currentSpeed;
  }

  public getStage(distance: number): GameStage {
    if (distance >= 14500) return GameStage.STAGE_10;
    if (distance >= 12000) return GameStage.STAGE_9;
    if (distance >= 9800) return GameStage.STAGE_8;
    if (distance >= 7800) return GameStage.STAGE_7;
    if (distance >= 6000) return GameStage.STAGE_6;
    if (distance >= 4400) return GameStage.STAGE_5;
    if (distance >= 3000) return GameStage.STAGE_4;
    if (distance >= 1800) return GameStage.STAGE_3;
    if (distance >= 800) return GameStage.STAGE_2;
    return GameStage.STAGE_1;
  }

  public checkStageTransition(distance: number): StageInfo | null {
    const newStage = this.getStage(distance);
    if (newStage !== this.currentStage) {
      this.currentStage = newStage;
      return this.getStageInfo(newStage);
    }
    return null;
  }

  public getStageInfo(stage: GameStage): StageInfo {
    return DifficultyDirector.STAGE_CONFIGS[stage] || DifficultyDirector.STAGE_CONFIGS[GameStage.STAGE_1];
  }

  /**
   * Returns obstacle spawn frequency multiplier based on current stage ("스테이지가 늘어날 수록 장애물의 빈도가 잦아지고").
   * Scales from 1.0 at Stage 1 up to 3.2 at Stage 10.
   */
  public getObstacleFrequencyMultiplier(stage?: GameStage): number {
    const s = stage ?? this.currentStage;
    const multipliers: Record<GameStage, number> = {
      [GameStage.STAGE_1]: 1.0,
      [GameStage.STAGE_2]: 1.25,
      [GameStage.STAGE_3]: 1.5,
      [GameStage.STAGE_4]: 1.75,
      [GameStage.STAGE_5]: 2.0,
      [GameStage.STAGE_6]: 2.25,
      [GameStage.STAGE_7]: 2.5,
      [GameStage.STAGE_8]: 2.75,
      [GameStage.STAGE_9]: 3.0,
      [GameStage.STAGE_10]: 3.2
    };
    return multipliers[s] || 1.0;
  }

  /**
   * Returns safe dodging buffer distance (meters) between obstacle patterns.
   * Decreases progressively as stages increase, creating tighter reaction gauntlets.
   */
  public getSafeBufferDistance(stage?: GameStage): number {
    const s = stage ?? this.currentStage;
    // Base 18m at Stage 1, down to 5.0m at Stage 10
    const stageClamped = Math.min(10, Math.max(1, s));
    const buffer = 18.0 - ((stageClamped - 1) / 9) * 13.0;
    return Math.max(5.0, Math.round(buffer * 10) / 10);
  }

  public reset(): void {
    this.currentSpeed = this.initialSpeed;
    this.currentStage = GameStage.STAGE_1;
  }
}

