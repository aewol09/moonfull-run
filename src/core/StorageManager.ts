export interface GameUpgrades {
  magnet: number;       // 1 ~ 20
  shield: number;       // 1 ~ 20
  headStart: number;    // 1 ~ 20
  coinBonus: number;    // 1 ~ 20
  feverBoost: number;   // 1 ~ 20
  revive: number;       // 1 ~ 20
  skillMastery: number; // 1 ~ 20 (Reduces cooldown by up to 50%)
  luckyChest: number;   // 1 ~ 20 (Increases mystery chest appearance rate)
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  bgm: boolean;
  sfx: boolean;
  vibration: boolean;
  graphicsQuality: GraphicsQuality;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  description: string;
  cost: number;
  unlockedByDefault: boolean;
  skillName: string;
  skillDesc: string;
  skillCooldown: number; // seconds
  accentColor: number;
  glowColor: number;
  iconUrl: string;
}

export const CHARACTERS: Record<string, CharacterDef> = {
  luna: {
    id: 'luna',
    name: '루나',
    title: '달빛의 방랑자',
    description: '달빛의 가호를 받는 은빛 머릿결의 방랑 소녀',
    cost: 0,
    unlockedByDefault: true,
    skillName: '달빛 일섬 (Moon Slash)',
    skillDesc: '전방 3개 라인에 초승달 검기를 날려 40m 내 모든 장애물을 일도양단합니다.',
    skillCooldown: 12,
    accentColor: 0x38bdf8,
    glowColor: 0x38bdf8,
    iconUrl: '/assets/skill_luna.png'
  },
  stella: {
    id: 'stella',
    name: '스텔라',
    title: '별빛의 마법사',
    description: '라벤더빛 유성우를 소환하는 신비로운 천문 마법사',
    cost: 500,
    unlockedByDefault: false,
    skillName: '스타폴 변환 (Starfall)',
    skillDesc: '하늘에서 유성우가 쏟아져 6초간 전방 장애물을 달의 파편으로 변환하고 자동 흡수합니다.',
    skillCooldown: 15,
    accentColor: 0xc084fc,
    glowColor: 0xa855f7,
    iconUrl: '/assets/skill_stella.png'
  },
  solaris: {
    id: 'solaris',
    name: '솔라리스',
    title: '태양의 수호기사',
    description: '황금빛 태양 불꽃을 두르고 질주하는 불굴의 팔라딘',
    cost: 1200,
    unlockedByDefault: false,
    skillName: '태양 전차 돌격 (Solar Dash)',
    skillDesc: '5초간 태양 불꽃 전차로 변신하여 속도 +40% 증가 및 모든 장애물을 폭파합니다.',
    skillCooldown: 17,
    accentColor: 0xf59e0b,
    glowColor: 0xfbbf24,
    iconUrl: '/assets/skill_solaris.png'
  },
  nyx: {
    id: 'nyx',
    name: '닉스',
    title: '밤의 그림자',
    description: '시공간의 틈새를 은신하여 심연을 넘나드는 팬텀 요원',
    cost: 2500,
    unlockedByDefault: false,
    skillName: '그림자 차원 은신 (Shadow Shift)',
    skillDesc: '6초간 차원을 왜곡하여 모든 충돌/낙하 무시 및 코인·점수 획득량이 2배가 됩니다.',
    skillCooldown: 16,
    accentColor: 0x06b6d4,
    glowColor: 0x22d3ee,
    iconUrl: '/assets/skill_nyx.png'
  }
};

export interface CharacterCostumeDef {
  id: string;
  characterId: string;
  name: string;
  description: string;
  cost: number;
  previewImage: string;
  runPrefix: string;
}

export const CHARACTER_COSTUMES: Record<string, CharacterCostumeDef[]> = {
  luna: [
    {
      id: 'luna_default',
      characterId: 'luna',
      name: '달빛 모험가',
      description: '은빛 머릿결과 밤하늘 망토를 두른 기본 모험 복장',
      cost: 0,
      previewImage: '/assets/luna_front.png',
      runPrefix: 'luna_run'
    },
    {
      id: 'luna_guardian',
      characterId: 'luna',
      name: '성스러운 수호자',
      description: '고대 별의 기운을 담은 딥 바이올렛 수호 성기사 갑주',
      cost: 300,
      previewImage: '/assets/luna_guardian.png',
      runPrefix: 'luna_run_guardian'
    },
    {
      id: 'luna_dawn',
      characterId: 'luna',
      name: '황금빛 여명',
      description: '아침 햇살을 받아 찬란히 빛나는 왕실 황금 예복',
      cost: 800,
      previewImage: '/assets/luna_dawn.png',
      runPrefix: 'luna_run_dawn'
    }
  ],
  solaris: [
    {
      id: 'solaris_default',
      characterId: 'solaris',
      name: '태양의 성기사',
      description: '황금빛 사자 문장과 붉은 망토를 두른 용맹한 남성 성기사',
      cost: 0,
      previewImage: '/assets/solaris_front.png',
      runPrefix: 'solaris_run'
    },
    {
      id: 'solaris_obsidian',
      characterId: 'solaris',
      name: '흑요석 챔피언',
      description: '흑요석 마그마 중갑과 불꽃 각인을 두른 전장의 지배자',
      cost: 600,
      previewImage: '/assets/solaris_obsidian_front.png',
      runPrefix: 'solaris_obsidian_run'
    },
    {
      id: 'solaris_phoenix',
      characterId: 'solaris',
      name: '불멸의 불사조 기사',
      description: '작열하는 태양의 화염과 붉은 깃털 망토를 두른 불사조 성기사',
      cost: 800,
      previewImage: '/assets/solaris_phoenix_front.png',
      runPrefix: 'solaris_phoenix_run'
    }
  ],
  nyx: [
    {
      id: 'nyx_default',
      characterId: 'nyx',
      name: '그림자 암살자',
      description: '청록빛 안광과 날렵한 가죽 복장을 갖춘 남성 그림자 로그',
      cost: 0,
      previewImage: '/assets/nyx_front.png',
      runPrefix: 'nyx_run'
    },
    {
      id: 'nyx_cyber',
      characterId: 'nyx',
      name: '사이버 팬텀',
      description: '네온 사이버 슈트와 시공간 은신 장치를 장착한 미래형 요원',
      cost: 600,
      previewImage: '/assets/nyx_cyber_front.png',
      runPrefix: 'nyx_cyber_run'
    },
    {
      id: 'nyx_bloodmoon',
      characterId: 'nyx',
      name: '블러드문 사신',
      description: '진홍빛 달빛의 그림자 속에서 쌍검을 휘두르는 암살단의 사신',
      cost: 800,
      previewImage: '/assets/nyx_bloodmoon_front.png',
      runPrefix: 'nyx_bloodmoon_run'
    }
  ],
  stella: [
    {
      id: 'stella_default',
      characterId: 'stella',
      name: '성운의 마법사',
      description: '라벤더빛 유성 로브를 두른 신비로운 천문 마법 소녀',
      cost: 0,
      previewImage: '/assets/stella_front.png',
      runPrefix: 'stella_run'
    },
    {
      id: 'stella_archmage',
      characterId: 'stella',
      name: '황도 12궁 대마법사',
      description: '금빛 천체 보옥과 심연의 로브를 입은 최고위 성좌 마도사',
      cost: 600,
      previewImage: '/assets/stella_archmage_front.png',
      runPrefix: 'stella_archmage_run'
    },
    {
      id: 'stella_chronos',
      characterId: 'stella',
      name: '시간의 지배자',
      description: '금빛 톱니바퀴와 에메랄드 시공간 결계를 다루는 시간의 대마법사',
      cost: 800,
      previewImage: '/assets/stella_chronos_front.png',
      runPrefix: 'stella_chronos_run'
    }
  ]
};

export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  category: 'consumable' | 'chest';
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'start_shield',
    name: '출발 보호막',
    icon: '🛡️',
    description: '출발 시 장애물 1회 충돌을 완벽 방어합니다.',
    cost: 150,
    category: 'consumable'
  },
  {
    id: 'magnet_potion',
    name: '자석 강화 비약',
    icon: '🧲',
    description: '자석 지속 시간과 흡수 반경을 2배 증폭합니다.',
    cost: 120,
    category: 'consumable'
  },
  {
    id: 'shard_booster',
    name: '파편 1.5배 부스터',
    icon: '💎',
    description: '달리기 종료 시 달의 파편을 1.5배 정산합니다.',
    cost: 200,
    category: 'consumable'
  },
  {
    id: 'rocket_headstart',
    name: '초광속 로켓 스타트',
    icon: '⚡',
    description: '시작 즉시 500m 거리를 초광속 무적 질주합니다.',
    cost: 250,
    category: 'consumable'
  },
  {
    id: 'mystery_chest_buy',
    name: '신비한 보물상자',
    icon: '📦',
    description: '비급서와 대량 파편이 든 보물상자를 획득합니다.',
    cost: 350,
    category: 'chest'
  },
  {
    id: 'revive_feather',
    name: '부활의 불사조 깃털',
    icon: '🌟',
    description: '치명적 장애물 충돌 시 1회 즉시 무적으로 부활합니다. (판당 1회 / 낙사 시 제외)',
    cost: 300,
    category: 'consumable'
  }
];

export interface CashShopPackage {
  id: string;
  name: string;
  priceKrw: number;
  formattedPrice: string;
  badge: string;
  icon: string;
  description: string;
  rewardsSummary: string[];
  coins: number;
  chests: number;
  items?: Record<string, number>;
  unlockAllCharacters?: boolean;
  grantVip?: boolean;
  grantMonthlyPass?: boolean;
}

export const CASH_SHOP_PACKAGES: CashShopPackage[] = [
  {
    id: 'starter_pack',
    name: '스타터 한정 특가 패키지',
    priceKrw: 1200,
    formattedPrice: '₩1,200',
    badge: '80% 초특가',
    icon: '🎁',
    description: '모험의 첫걸음을 위한 파격 혜택! 대량 파편과 보물상자 및 필수 소모품 올인원',
    rewardsSummary: [
      '🌙 달의 파편 5,000개',
      '📦 신비한 보물상자 5개',
      '🌟 부활 깃털 5개',
      '🛡️ 출발 보호막 10개'
    ],
    coins: 5000,
    chests: 5,
    items: {
      revive_feather: 5,
      start_shield: 10
    }
  },
  {
    id: 'monthly_pass',
    name: '신비한 30일 월간 패스',
    priceKrw: 5500,
    formattedPrice: '₩5,500',
    badge: '최고 인기',
    icon: '📜',
    description: '구매 즉시 15,000 파편 지급 + 30일간 매일 1,000 파편 지급 + 보물상자 5개',
    rewardsSummary: [
      '🌙 즉시 달의 파편 15,000개',
      '📦 신비한 보물상자 5개',
      '📅 30일간 매일 1,000 파편 지급'
    ],
    coins: 15000,
    chests: 5,
    grantMonthlyPass: true
  },
  {
    id: 'vip_unlimited',
    name: 'VIP 평생 회원권 (무제한 부활 & 2배)',
    priceKrw: 9900,
    formattedPrice: '₩9,900',
    badge: '강력 추천',
    icon: '👑',
    description: '매 판 1회 무료 부활 영구 제공 + 파편 획득 2배 영구 패시브 + 황금 VIP 칭호',
    rewardsSummary: [
      '🌟 매판 1회 무료 부활 영구 적용',
      '💎 달의 파편 획득량 2배 영구 패시브',
      '👑 황금 VIP 칭호 마크 획득',
      '🌙 즉시 달의 파편 20,000개'
    ],
    coins: 20000,
    chests: 5,
    grantVip: true
  },
  {
    id: 'gem_vault',
    name: '달빛 파편 금고',
    priceKrw: 12000,
    formattedPrice: '₩12,000',
    badge: '인기 상품',
    icon: '💎',
    description: '대량의 달빛 파편과 신비한 보물상자, 초광속 로켓 스타트 대용량 번들',
    rewardsSummary: [
      '🌙 달의 파편 35,000개',
      '📦 신비한 보물상자 12개',
      '⚡ 초광속 로켓 스타트 15개'
    ],
    coins: 35000,
    chests: 12,
    items: {
      rocket_headstart: 15
    }
  },
  {
    id: 'mythic_truck',
    name: '신화의 보물 트럭 (캐릭터 올인원)',
    priceKrw: 33000,
    formattedPrice: '₩33,000',
    badge: '초호화 올인원',
    icon: '🚛',
    description: '모든 캐릭터 즉시 전체 해금 + 120,000 파편 + 보물상자 40개 + 전 스킬 Lv+5 각성',
    rewardsSummary: [
      '👥 전 캐릭터(스텔라, 솔라리스, 닉스) 즉시 해금',
      '🌙 달의 파편 120,000개',
      '📦 신비한 보물상자 40개',
      '✨ 전 캐릭터 스킬 Lv+5 즉시 각성'
    ],
    coins: 120000,
    chests: 40,
    unlockAllCharacters: true
  },
  {
    id: 'chest_bundle_10',
    name: '신비한 보물상자 10+2 묶음팩',
    priceKrw: 4500,
    formattedPrice: '₩4,500',
    badge: '10+2 보너스',
    icon: '📦',
    description: '비급서와 희귀 아이템이 든 신비한 보물상자 12개 대용량 번들',
    rewardsSummary: [
      '📦 신비한 보물상자 12개 (10개 가격)',
      '🌙 보너스 파편 2,000개'
    ],
    coins: 2000,
    chests: 12
  }
];

export interface SaveData {
  highScore: number;
  maxDistance: number;
  coins: number;
  upgrades: GameUpgrades;
  settings: GameSettings;
  unlockedCostumes: string[];
  currentCostume: string;
  equippedCostumes: Record<string, string>;
  unlockedCharacters: string[];
  currentCharacter: string;
  characterSkills: Record<string, number>;
  mysteryChests: number;
  totalChestsOpened: number;
  inventory: Record<string, number>;
  isVipMember?: boolean;
  hasMonthlyPass?: boolean;
  monthlyPassDaysRemaining?: number;
  monthlyPassLastClaimDate?: string;
  purchasedCashPackages?: string[];
}

export const UPGRADE_MAX_LEVEL = 20;

// Helper to generate smooth exponential cost curves up to Lv 20
const generateCosts = (baseArray: number[], mult: number): number[] => {
  const result = [...baseArray];
  let cur = baseArray[baseArray.length - 1];
  while (result.length < UPGRADE_MAX_LEVEL) {
    cur = Math.round((cur * mult) / 10) * 10;
    result.push(cur);
  }
  return result;
};

// Costs to advance from level L to L+1: index 1 is Lv1->2, index 2 is Lv2->3, ..., index 19 is Lv19->20
export const UPGRADE_COSTS: Record<keyof GameUpgrades, number[]> = {
  magnet: generateCosts([0, 100, 250, 500, 1000], 1.4),
  shield: generateCosts([0, 150, 350, 750, 1500], 1.4),
  headStart: generateCosts([0, 100, 200, 450, 900], 1.38),
  coinBonus: generateCosts([0, 120, 280, 600, 1200], 1.4),
  feverBoost: generateCosts([0, 150, 350, 750, 1500], 1.4),
  revive: generateCosts([0, 250, 500, 1000, 2000], 1.45),
  skillMastery: generateCosts([0, 180, 400, 850, 1700], 1.4),
  luckyChest: generateCosts([0, 120, 280, 600, 1200], 1.38)
};

const DEFAULT_DATA: SaveData = {
  highScore: 0,
  maxDistance: 0,
  coins: 0,
  upgrades: {
    magnet: 1,
    shield: 1,
    headStart: 1,
    coinBonus: 1,
    feverBoost: 1,
    revive: 1,
    skillMastery: 1,
    luckyChest: 1
  },
  settings: {
    bgm: true,
    sfx: true,
    vibration: true,
    graphicsQuality: 'medium'
  },
  unlockedCostumes: ['default', 'luna_default', 'solaris_default', 'nyx_default', 'stella_default'],
  currentCostume: 'default',
  equippedCostumes: {
    luna: 'luna_default',
    solaris: 'solaris_default',
    nyx: 'nyx_default',
    stella: 'stella_default'
  },
  unlockedCharacters: ['luna'],
  currentCharacter: 'luna',
  characterSkills: {
    luna: 1,
    stella: 1,
    solaris: 1,
    nyx: 1
  },
  mysteryChests: 0,
  totalChestsOpened: 0,
  inventory: {
    start_shield: 0,
    magnet_potion: 0,
    shard_booster: 0,
    rocket_headstart: 0,
    revive_feather: 0
  },
  isVipMember: false,
  hasMonthlyPass: false,
  monthlyPassDaysRemaining: 0,
  monthlyPassLastClaimDate: '',
  purchasedCashPackages: []
};

const STORAGE_KEY = 'MOONFULL_RUN_SAVE_DATA_V1';
const LEGACY_STORAGE_KEY = 'MOONFALL_RUN_SAVE_DATA_V1';

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
      const serialized = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
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
          headStart: this.clampLevel(parsed.upgrades?.headStart, DEFAULT_DATA.upgrades.headStart),
          coinBonus: this.clampLevel(parsed.upgrades?.coinBonus, DEFAULT_DATA.upgrades.coinBonus),
          feverBoost: this.clampLevel(parsed.upgrades?.feverBoost, DEFAULT_DATA.upgrades.feverBoost),
          revive: this.clampLevel(parsed.upgrades?.revive, DEFAULT_DATA.upgrades.revive),
          skillMastery: this.clampLevel(parsed.upgrades?.skillMastery, DEFAULT_DATA.upgrades.skillMastery),
          luckyChest: this.clampLevel(parsed.upgrades?.luckyChest, DEFAULT_DATA.upgrades.luckyChest)
        },
        settings: {
          bgm: typeof parsed.settings?.bgm === 'boolean' ? parsed.settings.bgm : DEFAULT_DATA.settings.bgm,
          sfx: typeof parsed.settings?.sfx === 'boolean' ? parsed.settings.sfx : DEFAULT_DATA.settings.sfx,
          vibration: typeof parsed.settings?.vibration === 'boolean' ? parsed.settings.vibration : DEFAULT_DATA.settings.vibration,
          graphicsQuality: ['low', 'medium', 'high'].includes(parsed.settings?.graphicsQuality)
            ? parsed.settings.graphicsQuality
            : DEFAULT_DATA.settings.graphicsQuality
        },
        unlockedCostumes: Array.isArray(parsed.unlockedCostumes) && parsed.unlockedCostumes.length > 0
          ? Array.from(new Set(['default', 'luna_default', ...parsed.unlockedCostumes]))
          : DEFAULT_DATA.unlockedCostumes,
        currentCostume: typeof parsed.currentCostume === 'string' ? parsed.currentCostume : 'default',
        equippedCostumes: {
          luna: parsed.equippedCostumes?.luna || 'luna_default',
          solaris: parsed.equippedCostumes?.solaris || 'solaris_default',
          nyx: parsed.equippedCostumes?.nyx || 'nyx_default',
          stella: parsed.equippedCostumes?.stella || 'stella_default'
        },
        unlockedCharacters: Array.isArray(parsed.unlockedCharacters) && parsed.unlockedCharacters.length > 0
          ? Array.from(new Set(['luna', ...parsed.unlockedCharacters]))
          : ['luna'],
        currentCharacter: typeof parsed.currentCharacter === 'string' && CHARACTERS[parsed.currentCharacter]
          ? parsed.currentCharacter
          : 'luna',
        characterSkills: {
          luna: typeof parsed.characterSkills?.luna === 'number' ? Math.max(1, parsed.characterSkills.luna) : 1,
          stella: typeof parsed.characterSkills?.stella === 'number' ? Math.max(1, parsed.characterSkills.stella) : 1,
          solaris: typeof parsed.characterSkills?.solaris === 'number' ? Math.max(1, parsed.characterSkills.solaris) : 1,
          nyx: typeof parsed.characterSkills?.nyx === 'number' ? Math.max(1, parsed.characterSkills.nyx) : 1
        },
        mysteryChests: typeof parsed.mysteryChests === 'number' ? Math.max(0, parsed.mysteryChests) : 0,
        totalChestsOpened: typeof parsed.totalChestsOpened === 'number' ? Math.max(0, parsed.totalChestsOpened) : 0,
        inventory: typeof parsed.inventory === 'object' && parsed.inventory !== null
          ? { ...DEFAULT_DATA.inventory, ...parsed.inventory }
          : { ...DEFAULT_DATA.inventory },
        isVipMember: typeof parsed.isVipMember === 'boolean' ? parsed.isVipMember : false,
        hasMonthlyPass: typeof parsed.hasMonthlyPass === 'boolean' ? parsed.hasMonthlyPass : false,
        monthlyPassDaysRemaining: typeof parsed.monthlyPassDaysRemaining === 'number'
          ? Math.max(0, parsed.monthlyPassDaysRemaining)
          : (parsed.hasMonthlyPass ? 30 : 0),
        monthlyPassLastClaimDate: typeof parsed.monthlyPassLastClaimDate === 'string' ? parsed.monthlyPassLastClaimDate : '',
        purchasedCashPackages: Array.isArray(parsed.purchasedCashPackages) ? parsed.purchasedCashPackages : []
      };
    } catch {
      // Fallback on parse or storage access error
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  public isVipMember(): boolean {
    return !!this.data.isVipMember;
  }

  public hasMonthlyPass(): boolean {
    return !!this.data.hasMonthlyPass;
  }

  public checkMonthlyPassDailyReward(): { claimed: boolean; amount: number; daysRemaining: number } {
    if (!this.data.hasMonthlyPass) {
      return { claimed: false, amount: 0, daysRemaining: 0 };
    }
    const remaining = this.data.monthlyPassDaysRemaining ?? 30;
    if (remaining <= 0) {
      this.data.hasMonthlyPass = false;
      this.save();
      return { claimed: false, amount: 0, daysRemaining: 0 };
    }
    const today = new Date().toISOString().slice(0, 10);
    if (this.data.monthlyPassLastClaimDate === today) {
      return { claimed: false, amount: 0, daysRemaining: remaining };
    }
    const rewardAmount = 1000;
    this.data.coins += rewardAmount;
    this.data.monthlyPassLastClaimDate = today;
    this.data.monthlyPassDaysRemaining = remaining - 1;
    if (this.data.monthlyPassDaysRemaining <= 0) {
      this.data.hasMonthlyPass = false;
    }
    this.save();
    return { claimed: true, amount: rewardAmount, daysRemaining: this.data.monthlyPassDaysRemaining };
  }

  public buyCashPackage(packageId: string): { success: boolean; pkg?: CashShopPackage } {
    const pkg = CASH_SHOP_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return { success: false };

    // Grant coins
    this.data.coins += pkg.coins;
    // Grant chests
    this.data.mysteryChests += pkg.chests;

    // Grant items
    if (pkg.items) {
      for (const [itemId, count] of Object.entries(pkg.items)) {
        this.data.inventory[itemId] = (this.data.inventory[itemId] || 0) + count;
      }
    }

    // Grant VIP
    if (pkg.grantVip) {
      this.data.isVipMember = true;
    }

    // Grant Monthly Pass
    if (pkg.grantMonthlyPass) {
      this.data.hasMonthlyPass = true;
      this.data.monthlyPassDaysRemaining = (this.data.monthlyPassDaysRemaining || 0) + 30;
    }

    // Grant all characters & skills
    if (pkg.unlockAllCharacters) {
      const allChars = ['stella', 'solaris', 'nyx'];
      allChars.forEach(charId => {
        if (!this.data.unlockedCharacters.includes(charId)) {
          this.data.unlockedCharacters.push(charId);
        }
        this.data.characterSkills[charId] = (this.data.characterSkills[charId] || 1) + 5;
      });
      this.data.characterSkills['luna'] = (this.data.characterSkills['luna'] || 1) + 5;
    }

    if (!this.data.purchasedCashPackages) {
      this.data.purchasedCashPackages = [];
    }
    this.data.purchasedCashPackages.push(packageId);

    this.save();
    return { success: true, pkg };
  }

  public save(): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.warn('Moonfull Run: Failed to save to localStorage', e);
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
    if (currentLvl >= UPGRADE_MAX_LEVEL) return null; // Max level reached
    return UPGRADE_COSTS[type][currentLvl] ?? null;
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

  // Costumes
  public normalizeCostumeId(id: string): string {
    if (id === 'default') return 'luna_default';
    if (id === 'guardian') return 'luna_guardian';
    if (id === 'dawn') return 'luna_dawn';
    if (id === 'solaris') return 'solaris_default';
    if (id === 'nyx') return 'nyx_default';
    if (id === 'stella') return 'stella_default';
    return id;
  }

  public getCharacterForCostume(costumeId: string): string {
    const norm = this.normalizeCostumeId(costumeId);
    for (const [charId, list] of Object.entries(CHARACTER_COSTUMES)) {
      if (list.some(c => c.id === norm || c.id === costumeId)) {
        return charId;
      }
    }
    // Prefix fallback
    for (const charId of Object.keys(CHARACTERS)) {
      if (costumeId.startsWith(charId)) return charId;
    }
    return 'luna';
  }

  public isCostumeUnlocked(costumeId: string): boolean {
    const norm = this.normalizeCostumeId(costumeId);
    return this.data.unlockedCostumes.includes(costumeId) || this.data.unlockedCostumes.includes(norm);
  }

  /**
   * Unlocks costume. Requirement: The character must be unlocked before purchasing any of their skins.
   */
  public unlockCostume(costumeId: string, cost = 0): boolean {
    const norm = this.normalizeCostumeId(costumeId);
    if (this.isCostumeUnlocked(norm)) return true;

    // Rule: Character must be purchased/unlocked first!
    const ownerChar = this.getCharacterForCostume(costumeId);
    if (ownerChar && !this.isCharacterUnlocked(ownerChar)) {
      return false;
    }

    if (cost > 0 && !this.spendCoins(cost)) return false;

    this.data.unlockedCostumes.push(norm);
    if (norm !== costumeId) {
      this.data.unlockedCostumes.push(costumeId);
    }
    this.save();
    return true;
  }

  public getCostumesForCharacter(charId: string): CharacterCostumeDef[] {
    return CHARACTER_COSTUMES[charId] || [];
  }

  public getEquippedCostume(charId: string): string {
    const defaultCostume = `${charId}_default`;
    if (this.data.equippedCostumes && this.data.equippedCostumes[charId]) {
      const equipped = this.data.equippedCostumes[charId];
      if (this.isCostumeUnlocked(equipped)) {
        return equipped;
      }
    }
    return defaultCostume;
  }

  public equipCostume(costumeId: string, charId?: string): boolean {
    const norm = this.normalizeCostumeId(costumeId);
    if (!this.isCostumeUnlocked(norm)) return false;

    // Detect character if not explicitly provided
    let targetChar = charId || this.getCharacterForCostume(costumeId);
    if (!targetChar) targetChar = this.data.currentCharacter || 'luna';

    // Must own the character
    if (!this.isCharacterUnlocked(targetChar)) return false;

    if (!this.data.equippedCostumes) {
      this.data.equippedCostumes = {
        luna: 'luna_default',
        solaris: 'solaris_default',
        nyx: 'nyx_default',
        stella: 'stella_default'
      };
    }
    this.data.equippedCostumes[targetChar] = norm;

    if (targetChar === this.data.currentCharacter) {
      this.data.currentCostume = norm;
    }
    this.save();
    return true;
  }

  // Playable Characters
  public isCharacterUnlocked(charId: string): boolean {
    return this.data.unlockedCharacters.includes(charId);
  }

  public unlockCharacter(charId: string, cost = 0): boolean {
    if (this.isCharacterUnlocked(charId)) return true;
    if (cost > 0 && !this.spendCoins(cost)) return false;

    this.data.unlockedCharacters.push(charId);
    // Automatically unlock the default costume for this character
    const defaultCostume = `${charId}_default`;
    if (!this.data.unlockedCostumes.includes(defaultCostume)) {
      this.data.unlockedCostumes.push(defaultCostume);
    }
    this.save();
    return true;
  }

  public selectCharacter(charId: string): boolean {
    if (!this.isCharacterUnlocked(charId)) return false;
    this.data.currentCharacter = charId;
    this.data.currentCostume = this.getEquippedCostume(charId);
    this.save();
    return true;
  }

  public getCharacterSkillLevel(charId: string): number {
    return this.data.characterSkills[charId] || 1;
  }

  public upgradeCharacterSkill(charId: string, cost = 300): boolean {
    if (!this.spendCoins(cost)) return false;
    this.data.characterSkills[charId] = (this.data.characterSkills[charId] || 1) + 1;
    this.save();
    return true;
  }

  // Shop & Inventory Items
  public buyShopItem(itemId: string): boolean {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    if (!this.spendCoins(item.cost)) return false;

    if (item.category === 'chest') {
      this.data.mysteryChests += 1;
    } else {
      this.data.inventory[itemId] = (this.data.inventory[itemId] || 0) + 1;
    }
    this.save();
    return true;
  }

  public getInventoryCount(itemId: string): number {
    return this.data.inventory?.[itemId] || 0;
  }

  public consumeInventoryItem(itemId: string): boolean {
    if (!this.data.inventory || (this.data.inventory[itemId] || 0) <= 0) return false;
    this.data.inventory[itemId] -= 1;
    this.save();
    return true;
  }

  // Mystery Chests
  public addMysteryChests(count = 1): number {
    this.data.mysteryChests += Math.max(1, count);
    this.save();
    return this.data.mysteryChests;
  }

  public spendMysteryChests(count = 1): boolean {
    if (this.data.mysteryChests <= 0) return false;
    this.data.mysteryChests = Math.max(0, this.data.mysteryChests - count);
    this.save();
    return true;
  }

  public openMysteryChest(): {
    type: 'shards' | 'skill' | 'jackpot';
    amount?: number;
    charId?: string;
    label: string;
  } | null {
    if (this.data.mysteryChests <= 0) return null;
    this.data.mysteryChests -= 1;
    this.data.totalChestsOpened += 1;

    const roll = Math.random();
    let result: { type: 'shards' | 'skill' | 'jackpot'; amount?: number; charId?: string; label: string };

    if (roll < 0.65) {
      // 65% Shards (100 ~ 250)
      const amount = Math.floor(100 + Math.random() * 150);
      this.data.coins += amount;
      result = { type: 'shards', amount, label: `🌙 달의 파편 +${amount}개 획득!` };
    } else if (roll < 0.90) {
      // 25% Random Skill Level Up
      const chars = ['luna', 'stella', 'solaris', 'nyx'];
      const charId = chars[Math.floor(Math.random() * chars.length)];
      this.data.characterSkills[charId] = (this.data.characterSkills[charId] || 1) + 1;
      const charName = CHARACTERS[charId]?.name || charId;
      result = {
        type: 'skill',
        charId,
        label: `✨ [${charName}] 스킬 레벨 UP! (Lv.${this.data.characterSkills[charId]})`
      };
    } else {
      // 10% Jackpot Shards (400 ~ 800)
      const amount = Math.floor(400 + Math.random() * 400);
      this.data.coins += amount;
      result = { type: 'jackpot', amount, label: `💎 대박 보물! 달의 파편 +${amount}개 대량 획득!` };
    }

    this.save();
    return result;
  }

  // Starlight Gacha Summon (1x = 500, 10x = 4,500)
  public performGacha(pulls: 1 | 10): Array<{
    rarity: 'SSR' | 'SR' | 'R';
    type: 'character' | 'skill' | 'shards';
    name: string;
    detail: string;
    icon: string;
  }> | null {
    const cost = pulls === 10 ? 4500 : 500;
    if (!this.spendCoins(cost)) return null;

    const results: Array<{
      rarity: 'SSR' | 'SR' | 'R';
      type: 'character' | 'skill' | 'shards';
      name: string;
      detail: string;
      icon: string;
    }> = [];

    const charKeys = ['stella', 'solaris', 'nyx'];

    for (let i = 0; i < pulls; i++) {
      const roll = Math.random();

      if (roll < 0.08) {
        // 8% SSR: Character Unlock or duplicate bonus
        const charId = charKeys[Math.floor(Math.random() * charKeys.length)];
        const char = CHARACTERS[charId];
        if (!this.isCharacterUnlocked(charId)) {
          this.unlockCharacter(charId);
          results.push({
            rarity: 'SSR',
            type: 'character',
            name: char.name,
            detail: `신규 캐릭터 [${char.name}] 해금!`,
            icon: char.iconUrl
          });
        } else {
          // Duplicate conversion: 120 shards + 1 skill level
          this.data.coins += 120;
          this.data.characterSkills[charId] = (this.data.characterSkills[charId] || 1) + 1;
          results.push({
            rarity: 'SSR',
            type: 'skill',
            name: `${char.name} 스킬 각성`,
            detail: `스킬 Lv+1 & 보너스 파편 +120개!`,
            icon: char.iconUrl
          });
        }
      } else if (roll < 0.35) {
        // 27% SR: Skill Level Up + 40 Shards
        const allChars = ['luna', 'stella', 'solaris', 'nyx'];
        const charId = allChars[Math.floor(Math.random() * allChars.length)];
        const char = CHARACTERS[charId];
        this.data.characterSkills[charId] = (this.data.characterSkills[charId] || 1) + 1;
        this.data.coins += 40;
        results.push({
          rarity: 'SR',
          type: 'skill',
          name: `${char.name} 비급서`,
          detail: `스킬 Lv+1 & 보너스 파편 +40개!`,
          icon: char.iconUrl
        });
      } else {
        // 65% R: Shard Cache (15 ~ 35 shards - strictly controlled economy)
        const shards = Math.floor(15 + Math.random() * 20);
        this.data.coins += shards;
        results.push({
          rarity: 'R',
          type: 'shards',
          name: '달빛 원석 조각',
          detail: `달의 파편 +${shards}개 획득!`,
          icon: '/assets/moon_shard.png'
        });
      }
    }

    this.save();
    return results;
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
