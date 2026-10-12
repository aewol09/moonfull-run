export interface GameUpgrades {
  magnet: number;     // 1 ~ 5
  shield: number;     // 1 ~ 5
  headStart: number;  // 1 ~ 5
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  bgm: boolean;
  sfx: boolean;
  vibration: boolean;
  graphicsQuality: GraphicsQuality;
}

export interface SaveData {
  highScore: number;
  maxDistance: number;
  coins: number;
  upgrades: GameUpgrades;
  settings: GameSettings;
  unlockedCostumes: string[];
  currentCostume: string;
}

export const UPGRADE_MAX_LEVEL = 5;

export const UPGRADE_COSTS: Record<keyof GameUpgrades, number[]> = {
  // Lv 1 is base (0 cost to have), indices 1..4 are upgrade costs to Lv 2, 3, 4, 5
  magnet: [0, 100, 250, 500, 1000, 2000],
  shield: [0, 150, 350, 750, 1500, 3000],
  headStart: [0, 100, 200, 450, 900, 1800]
};

const DEFAULT_DATA: SaveData = {
  highScore: 0,
  maxDistance: 0,
  coins: 0,
  upgrades: {
    magnet: 1,
    shield: 1,
    headStart: 1
  },
  settings: {
    bgm: true,
    sfx: true,
    vibration: true,
    graphicsQuality: 'medium'
  },
  unlockedCostumes: ['default'],
  currentCostume: 'default'
};

const STORAGE_KEY = 'MOONFALL_RUN_SAVE_DATA_V1';

export class StorageManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  public getData(): Readonly<SaveData> {
    return this.data;
  }

  public load(): SaveData {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
      const parsed = JSON.parse(serialized);
      // Validate schema and merge with defaults for resilience
      return {
        highScore: typeof parsed.highScore === 'number' ? Math.max(0, parsed.highScore) : DEFAULT_DATA.highScore,
        maxDistance: typeof parsed.maxDistance === 'number' ? Math.max(0, parsed.maxDistance) : DEFAULT_DATA.maxDistance,
        coins: typeof parsed.coins === 'number' ? Math.max(0, parsed.coins) : DEFAULT_DATA.coins,
        upgrades: {
          magnet: this.clampLevel(parsed.upgrades?.magnet, DEFAULT_DATA.upgrades.magnet),
          shield: this.clampLevel(parsed.upgrades?.shield, DEFAULT_DATA.upgrades.shield),
          headStart: this.clampLevel(parsed.upgrades?.headStart, DEFAULT_DATA.upgrades.headStart)
        },
        settings: {
          bgm: typeof parsed.settings?.bgm === 'boolean' ? parsed.settings.bgm : DEFAULT_DATA.settings.bgm,
          sfx: typeof parsed.settings?.sfx === 'boolean' ? parsed.settings.sfx : DEFAULT_DATA.settings.sfx,
          vibration: typeof parsed.settings?.vibration === 'boolean' ? parsed.settings.vibration : DEFAULT_DATA.settings.vibration,
          graphicsQuality: ['low', 'medium', 'high'].includes(parsed.settings?.graphicsQuality)
            ? parsed.settings.graphicsQuality
            : DEFAULT_DATA.settings.graphicsQuality
        },
        unlockedCostumes: Array.isArray(parsed.unlockedCostumes) ? parsed.unlockedCostumes : ['default'],
        currentCostume: typeof parsed.currentCostume === 'string' ? parsed.currentCostume : 'default'
      };
    } catch {
      // Fallback on parse or storage access error
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  public save(): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.warn('Moonfall Run: Failed to save to localStorage', e);
      return false;
    }
  }

  public addCoins(amount: number): number {
    if (amount <= 0) return this.data.coins;
    this.data.coins += Math.floor(amount);
    this.save();
    return this.data.coins;
  }

  public spendCoins(amount: number): boolean {
    if (amount <= 0 || this.data.coins < amount) return false;
    this.data.coins -= Math.floor(amount);
    this.save();
    return true;
  }

  public updateRecords(score: number, distance: number): { isNewScore: boolean; isNewDist: boolean } {
    let isNewScore = false;
    let isNewDist = false;

    if (score > this.data.highScore) {
      this.data.highScore = Math.floor(score);
      isNewScore = true;
    }
    if (distance > this.data.maxDistance) {
      this.data.maxDistance = Math.floor(distance);
      isNewDist = true;
    }

    if (isNewScore || isNewDist) {
      this.save();
    }

    return { isNewScore, isNewDist };
  }

  public getUpgradeCost(type: keyof GameUpgrades): number | null {
    const currentLvl = this.data.upgrades[type];
    if (currentLvl >= UPGRADE_MAX_LEVEL) return null; // Max level
    const nextLvl = currentLvl + 1;
    return UPGRADE_COSTS[type][nextLvl] ?? null;
  }

  public upgrade(type: keyof GameUpgrades): boolean {
    const cost = this.getUpgradeCost(type);
    if (cost === null) return false;
    if (this.spendCoins(cost)) {
      this.data.upgrades[type] += 1;
      this.save();
      return true;
    }
    return false;
  }

  public updateSettings(settings: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  public resetSettings(): void {
    this.data.settings = JSON.parse(JSON.stringify(DEFAULT_DATA.settings));
    this.save();
  }

  private clampLevel(val: unknown, fallback: number): number {
    if (typeof val !== 'number') return fallback;
    return Math.max(1, Math.min(UPGRADE_MAX_LEVEL, Math.floor(val)));
  }
}
