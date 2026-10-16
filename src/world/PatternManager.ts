import { ObstacleType } from './Obstacles';
import { GameStage } from '../gameplay/DifficultyDirector';

export interface PatternObstacleDef {
  type: ObstacleType;
  lane: number;      // -1, 0, 1 (or 0 for full-width arches/bridges/barriers)
  offsetZ: number;   // Relative offset in meters from pattern start
}

export interface PatternShardDef {
  lane: number;
  offsetZ: number;
  count: number;
  height?: number;
}

export interface TrackPattern {
  id: string;
  stage: GameStage;
  minDistance: number; // Meters required to unlock
  length: number;      // Total pattern segment length
  obstacles: PatternObstacleDef[];
  shards: PatternShardDef[];
}

export class PatternManager {
  private lastPatternId: string | null = null;
  private patterns: TrackPattern[] = [];

  constructor() {
    this.initPatterns();
  }

  private initPatterns(): void {
    this.patterns = [
      // ======================================================================
      // STAGE 1: 달빛 유적지 (Moonlit Ruins) - 0m ~ 800m
      // Theme: Ancient stone ruins, moon arches, broken stone bridges, crumbling platforms
      // ======================================================================
      {
        id: 'stage1_single_pillar',
        stage: GameStage.STAGE_1,
        minDistance: 0,
        length: 30,
        obstacles: [
          { type: ObstacleType.RUINED_PILLAR, lane: 0, offsetZ: -12 }
        ],
        shards: [
          { lane: -1, offsetZ: -8, count: 4 },
          { lane: 1, offsetZ: -8, count: 4 }
        ]
      },
      {
        id: 'stage1_low_arch',
        stage: GameStage.STAGE_1,
        minDistance: 0,
        length: 30,
        obstacles: [
          { type: ObstacleType.LOW_ARCH, lane: 0, offsetZ: -14 }
        ],
        shards: [
          { lane: 0, offsetZ: -10, count: 5, height: 0.5 } // Slide tutorial
        ]
      },
      {
        id: 'stage1_broken_bridge',
        stage: GameStage.STAGE_1,
        minDistance: 40,
        length: 35,
        obstacles: [
          { type: ObstacleType.BROKEN_BRIDGE, lane: 0, offsetZ: -14 }
        ],
        shards: [
          { lane: 0, offsetZ: -12, count: 4, height: 2.2 } // High jump guide
        ]
      },
      {
        id: 'stage1_pillar_zigzag',
        stage: GameStage.STAGE_1,
        minDistance: 100,
        length: 42,
        obstacles: [
          { type: ObstacleType.RUINED_PILLAR, lane: -1, offsetZ: -10 },
          { type: ObstacleType.RUINED_PILLAR, lane: 1, offsetZ: -24 }
        ],
        shards: [
          { lane: 0, offsetZ: -6, count: 4 },
          { lane: -1, offsetZ: -20, count: 4 }
        ]
      },
      {
        id: 'stage1_two_pillars',
        stage: GameStage.STAGE_1,
        minDistance: 180,
        length: 36,
        obstacles: [
          { type: ObstacleType.RUINED_PILLAR, lane: -1, offsetZ: -14 },
          { type: ObstacleType.RUINED_PILLAR, lane: 0, offsetZ: -14 }
        ],
        shards: [
          { lane: 1, offsetZ: -10, count: 5 } // Right lane opening
        ]
      },
      {
        id: 'stage1_crumbling_arch',
        stage: GameStage.STAGE_1,
        minDistance: 250,
        length: 42,
        obstacles: [
          { type: ObstacleType.CRUMBLING_PLATFORM, lane: 0, offsetZ: -10 },
          { type: ObstacleType.LOW_ARCH, lane: 0, offsetZ: -26 }
        ],
        shards: [
          { lane: -1, offsetZ: -10, count: 3 },
          { lane: 1, offsetZ: -10, count: 3 }
        ]
      },

      // ======================================================================
      // STAGE 2: 별빛 안개 숲 & 보랏빛 성역 (Starlight Forest & Amethyst Sanctuary) - 800m ~ 1800m
      // Theme: Mystical thorn vines, crystal spikes, moving arcane sentinels, skill charge introduction
      // ======================================================================
      {
        id: 'stage2_vine_brier_double',
        stage: GameStage.STAGE_2,
        minDistance: 800,
        length: 40,
        obstacles: [
          { type: ObstacleType.VINE_BRIER, lane: -1, offsetZ: -12 },
          { type: ObstacleType.VINE_BRIER, lane: 1, offsetZ: -12 }
        ],
        shards: [
          { lane: 0, offsetZ: -8, count: 5 }
        ]
      },
      {
        id: 'stage2_crystal_spikes_slalom',
        stage: GameStage.STAGE_2,
        minDistance: 850,
        length: 46,
        obstacles: [
          { type: ObstacleType.CRYSTAL_SPIKE, lane: -1, offsetZ: -10 },
          { type: ObstacleType.CRYSTAL_SPIKE, lane: 0, offsetZ: -22 },
          { type: ObstacleType.CRYSTAL_SPIKE, lane: 1, offsetZ: -34 }
        ],
        shards: [
          { lane: 1, offsetZ: -8, count: 3 },
          { lane: -1, offsetZ: -20, count: 3 }
        ]
      },
      {
        id: 'stage2_vine_low_arch_combo',
        stage: GameStage.STAGE_2,
        minDistance: 950,
        length: 48,
        obstacles: [
          { type: ObstacleType.LOW_ARCH, lane: 0, offsetZ: -12 },
          { type: ObstacleType.VINE_BRIER, lane: 0, offsetZ: -30 }
        ],
        shards: [
          { lane: 0, offsetZ: -10, count: 4, height: 0.5 },
          { lane: -1, offsetZ: -26, count: 3 }
        ]
      },
      {
        id: 'stage2_moving_sentinel_crystal_flank',
        stage: GameStage.STAGE_2,
        minDistance: 1100,
        length: 48,
        obstacles: [
          { type: ObstacleType.MOVING_OBSTACLE, lane: 0, offsetZ: -14 },
          { type: ObstacleType.CRYSTAL_SPIKE, lane: 1, offsetZ: -28 }
        ],
        shards: [
          { lane: -1, offsetZ: -10, count: 4 }
        ]
      },
      {
        id: 'stage2_crumble_crystal_trap',
        stage: GameStage.STAGE_2,
        minDistance: 1250,
        length: 46,
        obstacles: [
          { type: ObstacleType.CRUMBLING_PLATFORM, lane: -1, offsetZ: -10 },
          { type: ObstacleType.VINE_BRIER, lane: 0, offsetZ: -24 },
          { type: ObstacleType.CRYSTAL_SPIKE, lane: 1, offsetZ: -24 }
        ],
        shards: [
          { lane: -1, offsetZ: -20, count: 4 }
        ]
      },
      {
        id: 'stage2_skill_intro_seal',
        stage: GameStage.STAGE_2,
        minDistance: 1400,
        length: 54,
        obstacles: [
          // Skill Charge Rune placed 16m ahead so skill is guaranteed ready!
          { type: ObstacleType.SKILL_CHARGE_RUNE, lane: 0, offsetZ: -12 },
          { type: ObstacleType.SKILL_BARRIER, lane: 0, offsetZ: -32 }
        ],
        shards: [
          { lane: -1, offsetZ: -8, count: 3 },
          { lane: 1, offsetZ: -8, count: 3 }
        ]
      },

      // ======================================================================
      // STAGE 3: 태양의 사원 & 비취석 협곡 (Solar Citadel & Magma Canyon) - 1800m ~ 3000m
      // Theme: Volcanic molten magma pillars, solar monoliths, magma pits, skill gates
      // ======================================================================
      {
        id: 'stage3_magma_pillar_pinch',
        stage: GameStage.STAGE_3,
        minDistance: 1800,
        length: 46,
        obstacles: [
          { type: ObstacleType.MAGMA_PILLAR, lane: 0, offsetZ: -14 },
          { type: ObstacleType.MAGMA_PILLAR, lane: 1, offsetZ: -14 }
        ],
        shards: [
          { lane: -1, offsetZ: -10, count: 5 } // Quick left dodge
        ]
      },
      {
        id: 'stage3_solar_monolith_wall',
        stage: GameStage.STAGE_3,
        minDistance: 1950,
        length: 50,
        obstacles: [
          { type: ObstacleType.SOLAR_MONOLITH, lane: -1, offsetZ: -12 },
          { type: ObstacleType.SOLAR_MONOLITH, lane: 0, offsetZ: -12 }
        ],
        shards: [
          { lane: 1, offsetZ: -8, count: 5 }
        ]
      },
      {
        id: 'stage3_lava_chasm_magma_rush',
        stage: GameStage.STAGE_3,
        minDistance: 2150,
        length: 52,
        obstacles: [
          { type: ObstacleType.BROKEN_BRIDGE, lane: 0, offsetZ: -12 },
          { type: ObstacleType.MAGMA_PILLAR, lane: -1, offsetZ: -30 }
        ],
        shards: [
          { lane: 0, offsetZ: -10, count: 3, height: 2.2 },
          { lane: 1, offsetZ: -28, count: 4 }
        ]
      },
      {
        id: 'stage3_double_magma_stagger',
        stage: GameStage.STAGE_3,
        minDistance: 2350,
        length: 54,
        obstacles: [
          { type: ObstacleType.MAGMA_PILLAR, lane: -1, offsetZ: -10 },
          { type: ObstacleType.SOLAR_MONOLITH, lane: 0, offsetZ: -24 },
          { type: ObstacleType.MAGMA_PILLAR, lane: 1, offsetZ: -38 }
        ],
        shards: [
          { lane: 1, offsetZ: -8, count: 3 },
          { lane: -1, offsetZ: -22, count: 3 }
        ]
      },
      {
        id: 'stage3_moving_fire_sentinel',
        stage: GameStage.STAGE_3,
        minDistance: 2550,
        length: 50,
        obstacles: [
          { type: ObstacleType.MOVING_OBSTACLE, lane: 0, offsetZ: -14 },
          { type: ObstacleType.MAGMA_PILLAR, lane: 0, offsetZ: -32 }
        ],
        shards: [
          { lane: -1, offsetZ: -10, count: 3 },
          { lane: 1, offsetZ: -28, count: 3 }
        ]
      },
      {
        id: 'stage3_magma_skill_barrier',
        stage: GameStage.STAGE_3,
        minDistance: 2750,
        length: 56,
        obstacles: [
          { type: ObstacleType.SKILL_CHARGE_RUNE, lane: 1, offsetZ: -14 },
          { type: ObstacleType.SKILL_BARRIER, lane: 0, offsetZ: -36 }
        ],
        shards: [
          { lane: 1, offsetZ: -10, count: 4 }
        ]
      },

      // ======================================================================
      // STAGE 4+: 공허의 심연, 붉은 달 회랑 & 끝없는 별빛 (Void Abyss & Celestial Chaos) - 3000m+
      // Theme: Dark cosmic void obelisks, bloodmoon rifts, mandatory skill barriers, relentless gauntlets
      // ======================================================================
      {
        id: 'stage4_skill_barrier_mandate',
        stage: GameStage.STAGE_4,
        minDistance: 3000,
        length: 52,
        obstacles: [
          { type: ObstacleType.SKILL_CHARGE_RUNE, lane: 0, offsetZ: -12 },
          { type: ObstacleType.SKILL_BARRIER, lane: 0, offsetZ: -34 }
        ],
        shards: [
          { lane: -1, offsetZ: -8, count: 4 },
          { lane: 1, offsetZ: -8, count: 4 }
        ]
      },
      {
        id: 'stage4_void_spire_triad',
        stage: GameStage.STAGE_4,
        minDistance: 3200,
        length: 50,
        obstacles: [
          { type: ObstacleType.VOID_OBELISK, lane: -1, offsetZ: -10 },
          { type: ObstacleType.VOID_OBELISK, lane: 1, offsetZ: -22 },
          { type: ObstacleType.VOID_OBELISK, lane: 0, offsetZ: -36 }
        ],
        shards: [
          { lane: 0, offsetZ: -8, count: 3 },
          { lane: -1, offsetZ: -20, count: 3 }
        ]
      },
      {
        id: 'stage4_abyssal_chasm_void_combo',
        stage: GameStage.STAGE_4,
        minDistance: 3500,
        length: 56,
        obstacles: [
          { type: ObstacleType.BROKEN_BRIDGE, lane: 0, offsetZ: -12 },
          { type: ObstacleType.VOID_OBELISK, lane: 0, offsetZ: -32 },
          { type: ObstacleType.VINE_BRIER, lane: 1, offsetZ: -32 }
        ],
        shards: [
          { lane: 0, offsetZ: -10, count: 3, height: 2.2 },
          { lane: -1, offsetZ: -28, count: 4 }
        ]
      },
      {
        id: 'stage4_bloodmoon_gauntlet',
        stage: GameStage.STAGE_4,
        minDistance: 3800,
        length: 54,
        obstacles: [
          { type: ObstacleType.MOVING_OBSTACLE, lane: 0, offsetZ: -12 },
          { type: ObstacleType.VOID_OBELISK, lane: -1, offsetZ: -28 },
          { type: ObstacleType.MAGMA_PILLAR, lane: 1, offsetZ: -40 }
        ],
        shards: [
          { lane: 1, offsetZ: -10, count: 4 }
        ]
      },
      {
        id: 'stage4_double_skill_trial',
        stage: GameStage.STAGE_4,
        minDistance: 4200,
        length: 64,
        obstacles: [
          { type: ObstacleType.SKILL_CHARGE_RUNE, lane: -1, offsetZ: -12 },
          { type: ObstacleType.SKILL_BARRIER, lane: 0, offsetZ: -32 },
          { type: ObstacleType.VOID_OBELISK, lane: 1, offsetZ: -48 }
        ],
        shards: [
          { lane: -1, offsetZ: -10, count: 4 },
          { lane: 0, offsetZ: -44, count: 4 }
        ]
      },
      {
        id: 'stage4_chaos_ultimate_rush',
        stage: GameStage.STAGE_4,
        minDistance: 4600,
        length: 60,
        obstacles: [
          { type: ObstacleType.VOID_OBELISK, lane: -1, offsetZ: -10 },
          { type: ObstacleType.MAGMA_PILLAR, lane: 1, offsetZ: -10 },
          { type: ObstacleType.LOW_ARCH, lane: 0, offsetZ: -28 },
          { type: ObstacleType.MOVING_OBSTACLE, lane: 0, offsetZ: -46 }
        ],
        shards: [
          { lane: 0, offsetZ: -6, count: 3 },
          { lane: 0, offsetZ: -26, count: 4, height: 0.5 }
        ]
      }
    ];
  }

  public getNextPattern(
    currentDistance: number,
    currentSpeed: number,
    currentStage: GameStage = GameStage.STAGE_1
  ): {
    pattern: TrackPattern;
    spacingMultiplier: number;
  } {
    // 1. Filter patterns dedicated to currentStage (matching stage and distance)
    let eligible = this.patterns.filter(p => p.stage === currentStage && p.minDistance <= currentDistance);

    // If no patterns matched within distance, allow all patterns belonging to currentStage (or STAGE_4 if >= 4)
    if (eligible.length === 0) {
      if (currentStage >= GameStage.STAGE_4) {
        eligible = this.patterns.filter(p => p.stage === GameStage.STAGE_4);
      } else {
        eligible = this.patterns.filter(p => p.stage === currentStage);
      }
    }

    // Fallback: any pattern whose minDistance <= currentDistance
    if (eligible.length === 0) {
      eligible = this.patterns.filter(p => p.minDistance <= currentDistance);
    }
    const pool = eligible.length > 0 ? eligible : [this.patterns[0]];

    // 2. Prevent consecutive repeats
    let candidates = pool.filter(p => p.id !== this.lastPatternId);
    if (candidates.length === 0) {
      candidates = pool;
    }

    // 3. Random selection from candidate pool
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    this.lastPatternId = selected.id;

    // 4. Calculate speed-based spacing dilation (fair reaction time)
    const spacingMultiplier = this.getSpeedSpacingMultiplier(currentSpeed);

    return {
      pattern: selected,
      spacingMultiplier
    };
  }

  public getSpeedSpacingMultiplier(speed: number): number {
    const baseSpeed = 14;
    const maxSpeed = 28;
    const clampedSpeed = Math.min(maxSpeed, Math.max(baseSpeed, speed));
    const factor = (clampedSpeed - baseSpeed) / (maxSpeed - baseSpeed);
    return 1.0 + factor * 0.45;
  }

  public getPatternsForStage(stage: GameStage): TrackPattern[] {
    return this.patterns.filter(p => p.stage === stage);
  }

  public reset(): void {
    this.lastPatternId = null;
  }
}
