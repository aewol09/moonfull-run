import { ObstacleType } from './Obstacles';

export interface PatternObstacleDef {
  type: ObstacleType;
  lane: number;      // -1, 0, 1 (or 0 for arch/broken bridge)
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
      // 1. Beginner Patterns (0m+)
      {
        id: 'beginner_single_pillar',
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
        id: 'beginner_low_arch',
        minDistance: 0,
        length: 30,
        obstacles: [
          { type: ObstacleType.LOW_ARCH, lane: 0, offsetZ: -14 }
        ],
        shards: [
          { lane: 0, offsetZ: -10, count: 5, height: 0.5 } // Low shards encouraging slide
        ]
      },
      {
        id: 'beginner_broken_bridge',
        minDistance: 50,
        length: 35,
        obstacles: [
          { type: ObstacleType.BROKEN_BRIDGE, lane: 0, offsetZ: -14 }
        ],
        shards: [
          { lane: 0, offsetZ: -12, count: 4, height: 2.2 } // High shards guiding jump arc
        ]
      },

      // 2. Intermediate Patterns (150m+)
      {
        id: 'intermediate_pillar_zigzag',
        minDistance: 150,
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
        id: 'intermediate_crumbling_arch',
        minDistance: 200,
        length: 40,
        obstacles: [
          { type: ObstacleType.CRUMBLING_PLATFORM, lane: 0, offsetZ: -10 },
          { type: ObstacleType.LOW_ARCH, lane: 0, offsetZ: -25 }
        ],
        shards: [
          { lane: -1, offsetZ: -10, count: 3 },
          { lane: 1, offsetZ: -10, count: 3 }
        ]
      },
      {
        id: 'intermediate_two_pillars',
        minDistance: 250,
        length: 36,
        obstacles: [
          // 2 lanes blocked, leaving 1 safe lane (guaranteed dodgable)
          { type: ObstacleType.RUINED_PILLAR, lane: -1, offsetZ: -14 },
          { type: ObstacleType.RUINED_PILLAR, lane: 0, offsetZ: -14 }
        ],
        shards: [
          { lane: 1, offsetZ: -10, count: 5 } // Leads through open lane
        ]
      },

      // 3. Advanced Patterns (400m+)
      {
        id: 'advanced_moving_obstacle',
        minDistance: 400,
        length: 45,
        obstacles: [
          { type: ObstacleType.MOVING_OBSTACLE, lane: 0, offsetZ: -16 },
          { type: ObstacleType.RUINED_PILLAR, lane: -1, offsetZ: -32 }
        ],
        shards: [
          { lane: 1, offsetZ: -28, count: 4 }
        ]
      },
      {
        id: 'advanced_bridge_then_arch',
        minDistance: 450,
        length: 50,
        obstacles: [
          { type: ObstacleType.BROKEN_BRIDGE, lane: 0, offsetZ: -12 },
          { type: ObstacleType.LOW_ARCH, lane: 0, offsetZ: -32 }
        ],
        shards: [
          { lane: 0, offsetZ: -10, count: 3, height: 2.2 },
          { lane: 0, offsetZ: -30, count: 3, height: 0.5 }
        ]
      },
      {
        id: 'advanced_crumble_moving_combo',
        minDistance: 550,
        length: 48,
        obstacles: [
          { type: ObstacleType.CRUMBLING_PLATFORM, lane: 1, offsetZ: -12 },
          { type: ObstacleType.MOVING_OBSTACLE, lane: 0, offsetZ: -26 }
        ],
        shards: [
          { lane: -1, offsetZ: -10, count: 4 }
        ]
      }
    ];
  }

  public getNextPattern(currentDistance: number, currentSpeed: number): {
    pattern: TrackPattern;
    spacingMultiplier: number;
  } {
    // 1. Filter patterns unlocked by distance
    const eligible = this.patterns.filter(p => p.minDistance <= currentDistance);
    const pool = eligible.length > 0 ? eligible : [this.patterns[0]];

    // 2. Prevent consecutive repeats
    let candidates = pool.filter(p => p.id !== this.lastPatternId);
    if (candidates.length === 0) {
      candidates = pool;
    }

    // 3. Weighted random selection (favoring higher distance patterns as difficulty progresses)
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    this.lastPatternId = selected.id;

    // 4. Calculate speed-based spacing dilation (Lookup table)
    // Base speed = 14 m/s (mult = 1.0). At 28 m/s, mult = 1.55 so reaction time remains fair
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
    return 1.0 + factor * 0.55; // Scales smoothly from 1.0 to 1.55
  }

  public reset(): void {
    this.lastPatternId = null;
  }
}
