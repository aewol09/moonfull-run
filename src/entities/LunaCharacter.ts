import * as THREE from 'three';
import { AssetLoader } from '../render/AssetLoader';
import { SkillFXManager } from '../render/SkillFXManager';

export enum CharacterState {
  RUN = 'RUN',
  JUMP = 'JUMP',
  FALL = 'FALL',
  LAND = 'LAND',
  SLIDE = 'SLIDE',
  HIT = 'HIT',
  DIE = 'DIE'
}

export const LANE_WIDTH = 2.2; // Distance between lanes in meters

export interface CostumeDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  hairColor: number;
  tunicColor: number;
  capeColor: number;
  accentColor: number;
  glowColor: number;
  tunicHex: string;
  trimHex: string;
  eyeColor: string;
}

export const COSTUME_PRESETS: Record<string, CostumeDef> = {
  default: {
    id: 'default',
    name: '달빛 방랑자',
    description: '은빛 머릿결과 밤하늘 망토를 두른 기본 복장',
    cost: 0,
    hairColor: 0xe2e8f0,
    tunicColor: 0x0f172a,
    capeColor: 0x1e1b4b,
    accentColor: 0xfbbf24,
    glowColor: 0x38bdf8,
    tunicHex: '#0f172a',
    trimHex: '#38bdf8',
    eyeColor: '#38bdf8'
  },
  guardian: {
    id: 'guardian',
    name: '성스러운 수호자',
    description: '고대 별의 기운을 담은 딥 바이올렛 수호 아머',
    cost: 300,
    hairColor: 0xf8fafc,
    tunicColor: 0x2e1065,
    capeColor: 0x4c1d95,
    accentColor: 0xa855f7,
    glowColor: 0xc084fc,
    tunicHex: '#2e1065',
    trimHex: '#c084fc',
    eyeColor: '#a855f7'
  },
  dawn: {
    id: 'dawn',
    name: '황금빛 여명',
    description: '아침 햇살을 받아 빛나는 찬란한 황금 예복',
    cost: 800,
    hairColor: 0xfef08a,
    tunicColor: 0x78350f,
    capeColor: 0xd97706,
    accentColor: 0xfbbf24,
    glowColor: 0xfde047,
    tunicHex: '#78350f',
    trimHex: '#fbbf24',
    eyeColor: '#f59e0b'
  }
};

export class LunaCharacter {
  public mesh: THREE.Group;
  public visualGroup: THREE.Group;
  public state: CharacterState = CharacterState.RUN;
  public isTurningCorner = false;

  // Lane position: -1 (Left), 0 (Center), 1 (Right)
  public currentLane = 0;
  public targetLane = 0;
  public isTransitioningLane = false;

  // Vertical physics
  public posY = 0;
  public velocityY = 0;
  public isFallingIntoPit = false;
  private readonly gravity = -34.0;
  private readonly jumpForce = 11.5;

  // Slide & Land state timers
  private slideTimer = 0;
  private readonly slideDuration = 0.65; // seconds
  private landTimer = 0;

  // Death sequence timer
  public deathTimer = 0;
  public readonly deathDuration = 1.0; // seconds before game over modal triggers

  // 2.5D High-Res Billboard Sprite Assets & Action Sets
  public isFeverMode = false;
  public currentCharacterId = 'luna';
  public skillCooldownRemaining = 0;
  public isSkillActive = false;
  public skillActiveTimeRemaining = 0;
  public isSlashWaveActive = false;
  public slashWaveZ = 0;
  public slashWaveMesh: THREE.Mesh;
  public skillFX: SkillFXManager;

  private costumeSpriteSets: Record<string, {
    runF1: THREE.Texture;
    runF2: THREE.Texture;
    runF3: THREE.Texture;
    runF4: THREE.Texture;
    jump: THREE.Texture;
    slide: THREE.Texture;
    front: THREE.Texture;
  }>;
  private spriteMat: THREE.MeshBasicMaterial;
  private spriteMesh: THREE.Mesh;
  private shadowMesh: THREE.Mesh;
  private shadowMat: THREE.MeshBasicMaterial;

  // Visual FX
  private shieldBubble: THREE.Mesh;
  private shieldRingMat!: THREE.MeshBasicMaterial;
  private shieldOuterMat!: THREE.MeshBasicMaterial;
  private shieldDomeMat!: THREE.MeshBasicMaterial;
  private shieldOrbsGroup!: THREE.Group;
  private shieldOrbMats: THREE.MeshBasicMaterial[] = [];
  private magicTrailPoints: THREE.Points;
  private trailPositions: Float32Array;

  // Animation clocks & flags
  private runAnimTime = 0;
  private isMenuMode = true;
  public hasShield = false;
  public magnetTimeRemaining = 0;
  public currentCostumeId = 'default';
  public cameraYaw = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 0);

    this.visualGroup = new THREE.Group();
    this.mesh.add(this.visualGroup);

    // 1. Load Multi-Frame Action Sprite Sets for all Characters & Costumes
    this.costumeSpriteSets = {
      default: {
        runF1: AssetLoader.loadTexture('/assets/luna_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/luna_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/luna_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/luna_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/luna_jump.png'),
        slide: AssetLoader.loadTexture('/assets/luna_slide.png'),
        front: AssetLoader.loadTexture('/assets/luna_front.png')
      },
      luna_default: {
        runF1: AssetLoader.loadTexture('/assets/luna_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/luna_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/luna_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/luna_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/luna_jump.png'),
        slide: AssetLoader.loadTexture('/assets/luna_slide.png'),
        front: AssetLoader.loadTexture('/assets/luna_front.png')
      },
      guardian: {
        runF1: AssetLoader.loadTexture('/assets/luna_guardian_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/luna_guardian_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/luna_guardian_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/luna_guardian_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/luna_jump_guardian.png'),
        slide: AssetLoader.loadTexture('/assets/luna_slide_guardian.png'),
        front: AssetLoader.loadTexture('/assets/luna_guardian.png')
      },
      luna_guardian: {
        runF1: AssetLoader.loadTexture('/assets/luna_guardian_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/luna_guardian_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/luna_guardian_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/luna_guardian_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/luna_jump_guardian.png'),
        slide: AssetLoader.loadTexture('/assets/luna_slide_guardian.png'),
        front: AssetLoader.loadTexture('/assets/luna_guardian.png')
      },
      dawn: {
        runF1: AssetLoader.loadTexture('/assets/luna_dawn_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/luna_dawn_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/luna_dawn_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/luna_dawn_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/luna_jump_dawn.png'),
        slide: AssetLoader.loadTexture('/assets/luna_slide_dawn.png'),
        front: AssetLoader.loadTexture('/assets/luna_dawn.png')
      },
      luna_dawn: {
        runF1: AssetLoader.loadTexture('/assets/luna_dawn_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/luna_dawn_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/luna_dawn_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/luna_dawn_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/luna_jump_dawn.png'),
        slide: AssetLoader.loadTexture('/assets/luna_slide_dawn.png'),
        front: AssetLoader.loadTexture('/assets/luna_dawn.png')
      },
      stella: {
        runF1: AssetLoader.loadTexture('/assets/stella_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/stella_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/stella_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/stella_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/stella_jump.png'),
        slide: AssetLoader.loadTexture('/assets/stella_slide.png'),
        front: AssetLoader.loadTexture('/assets/stella_front.png')
      },
      stella_default: {
        runF1: AssetLoader.loadTexture('/assets/stella_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/stella_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/stella_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/stella_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/stella_jump.png'),
        slide: AssetLoader.loadTexture('/assets/stella_slide.png'),
        front: AssetLoader.loadTexture('/assets/stella_front.png')
      },
      stella_archmage: {
        runF1: AssetLoader.loadTexture('/assets/stella_archmage_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/stella_archmage_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/stella_archmage_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/stella_archmage_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/stella_archmage_jump.png'),
        slide: AssetLoader.loadTexture('/assets/stella_archmage_slide.png'),
        front: AssetLoader.loadTexture('/assets/stella_archmage_front.png')
      },
      solaris: {
        runF1: AssetLoader.loadTexture('/assets/solaris_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/solaris_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/solaris_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/solaris_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/solaris_jump.png'),
        slide: AssetLoader.loadTexture('/assets/solaris_slide.png'),
        front: AssetLoader.loadTexture('/assets/solaris_front.png')
      },
      solaris_default: {
        runF1: AssetLoader.loadTexture('/assets/solaris_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/solaris_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/solaris_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/solaris_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/solaris_jump.png'),
        slide: AssetLoader.loadTexture('/assets/solaris_slide.png'),
        front: AssetLoader.loadTexture('/assets/solaris_front.png')
      },
      solaris_obsidian: {
        runF1: AssetLoader.loadTexture('/assets/solaris_obsidian_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/solaris_obsidian_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/solaris_obsidian_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/solaris_obsidian_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/solaris_obsidian_jump.png'),
        slide: AssetLoader.loadTexture('/assets/solaris_obsidian_slide.png'),
        front: AssetLoader.loadTexture('/assets/solaris_obsidian_front.png')
      },
      solaris_phoenix: {
        runF1: AssetLoader.loadTexture('/assets/solaris_phoenix_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/solaris_phoenix_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/solaris_phoenix_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/solaris_phoenix_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/solaris_phoenix_jump.png'),
        slide: AssetLoader.loadTexture('/assets/solaris_phoenix_slide.png'),
        front: AssetLoader.loadTexture('/assets/solaris_phoenix_front.png')
      },
      nyx: {
        runF1: AssetLoader.loadTexture('/assets/nyx_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/nyx_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/nyx_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/nyx_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/nyx_jump.png'),
        slide: AssetLoader.loadTexture('/assets/nyx_slide.png'),
        front: AssetLoader.loadTexture('/assets/nyx_front.png')
      },
      nyx_default: {
        runF1: AssetLoader.loadTexture('/assets/nyx_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/nyx_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/nyx_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/nyx_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/nyx_jump.png'),
        slide: AssetLoader.loadTexture('/assets/nyx_slide.png'),
        front: AssetLoader.loadTexture('/assets/nyx_front.png')
      },
      nyx_cyber: {
        runF1: AssetLoader.loadTexture('/assets/nyx_cyber_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/nyx_cyber_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/nyx_cyber_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/nyx_cyber_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/nyx_cyber_jump.png'),
        slide: AssetLoader.loadTexture('/assets/nyx_cyber_slide.png'),
        front: AssetLoader.loadTexture('/assets/nyx_cyber_front.png')
      },
      nyx_bloodmoon: {
        runF1: AssetLoader.loadTexture('/assets/nyx_bloodmoon_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/nyx_bloodmoon_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/nyx_bloodmoon_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/nyx_bloodmoon_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/nyx_bloodmoon_jump.png'),
        slide: AssetLoader.loadTexture('/assets/nyx_bloodmoon_slide.png'),
        front: AssetLoader.loadTexture('/assets/nyx_bloodmoon_front.png')
      },
      stella_chronos: {
        runF1: AssetLoader.loadTexture('/assets/stella_chronos_run_f1.png'),
        runF2: AssetLoader.loadTexture('/assets/stella_chronos_run_f2.png'),
        runF3: AssetLoader.loadTexture('/assets/stella_chronos_run_f3.png'),
        runF4: AssetLoader.loadTexture('/assets/stella_chronos_run_f4.png'),
        jump: AssetLoader.loadTexture('/assets/stella_chronos_jump.png'),
        slide: AssetLoader.loadTexture('/assets/stella_chronos_slide.png'),
        front: AssetLoader.loadTexture('/assets/stella_chronos_front.png')
      }
    };

    // Character-Specific and Skin-Specific Dynamic 3D Skill Effects Manager
    this.skillFX = new SkillFXManager();
    this.mesh.add(this.skillFX.rootGroup);
    this.slashWaveMesh = this.skillFX.slashWaveMesh;

    // 2. 2.5D Billboard Sprite Material & Quad Mesh
    // Height 2.1m, width 1.55m, anchored so bottom edge rests on road (y = 0)
    const spriteGeo = new THREE.PlaneGeometry(1.55, 2.1);
    spriteGeo.translate(0, 1.05, 0);

    this.spriteMat = new THREE.MeshBasicMaterial({
      map: this.costumeSpriteSets.default.front,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide,
      depthWrite: true,
      fog: false
    });
    this.spriteMesh = new THREE.Mesh(spriteGeo, this.spriteMat);
    this.visualGroup.add(this.spriteMesh);

    // 3. Ground Contact Shadow Oval (Attached to mesh, dynamically adjusted on jump)
    const shadowGeo = new THREE.PlaneGeometry(1.25, 0.72);
    shadowGeo.rotateX(-Math.PI / 2);
    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.55,
      fog: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMat);
    this.shadowMesh.position.y = 0.02;
    this.mesh.add(this.shadowMesh);

    // 4. Forcefield Shield Aura - ground rune rings + protective energy dome + orbiting defense crystal orbs
    const shieldGroup = new THREE.Group();
    // Centered at hero core (y = 1.05)
    shieldGroup.position.set(0, 1.05, 0);

    // Ground Rune Rings at feet level (y = -1.02)
    const ringGeo = new THREE.RingGeometry(0.75, 0.92, 40);
    ringGeo.rotateX(-Math.PI / 2);
    this.shieldRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    const ringMesh = new THREE.Mesh(ringGeo, this.shieldRingMat);
    ringMesh.position.y = -1.02;
    shieldGroup.add(ringMesh);

    const outerRingGeo = new THREE.RingGeometry(0.98, 1.08, 40);
    outerRingGeo.rotateX(-Math.PI / 2);
    this.shieldOuterMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, this.shieldOuterMat);
    outerRingMesh.position.y = -1.02;
    shieldGroup.add(outerRingMesh);

    // Protective Energy Dome surrounding hero
    const domeGeo = new THREE.SphereGeometry(1.32, 24, 16);
    this.shieldDomeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    const dome = new THREE.Mesh(domeGeo, this.shieldDomeMat);
    dome.position.y = 0;
    dome.renderOrder = -1;
    shieldGroup.add(dome);

    // 3 Orbiting Celestial Defense Crystal Orbs
    this.shieldOrbsGroup = new THREE.Group();
    const orbGeo = new THREE.OctahedronGeometry(0.14, 0);
    this.shieldOrbMats = [];
    for (let i = 0; i < 3; i++) {
      const orbMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      this.shieldOrbMats.push(orbMat);
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      const angle = (i * Math.PI * 2) / 3;
      orbMesh.position.set(Math.cos(angle) * 1.18, 0, Math.sin(angle) * 1.18);
      this.shieldOrbsGroup.add(orbMesh);
    }
    shieldGroup.add(this.shieldOrbsGroup);

    this.shieldBubble = shieldGroup as unknown as THREE.Mesh;
    this.shieldBubble.visible = false;
    this.mesh.add(this.shieldBubble);

    // 5. Starlight Footstep Sparkle Trail
    const trailCount = 40;
    this.trailPositions = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.magicTrailPoints = new THREE.Points(trailGeo, trailMat);
    this.mesh.add(this.magicTrailPoints);
  }

  /**
   * Applies the selected costume. Updates the menu front view texture and sparkle trail color.
   */
  public applyCostume(costumeId: string, charId?: string): void {
    if (charId) {
      this.currentCharacterId = charId;
    }
    let effectiveCostume = costumeId;
    if (this.currentCharacterId !== 'luna' && (!costumeId || costumeId === 'default' || costumeId === 'luna_default')) {
      effectiveCostume = `${this.currentCharacterId}_default`;
    }
    this.currentCostumeId = effectiveCostume;

    const colors: Record<string, number> = {
      luna: 0x38bdf8,
      stella: 0xc084fc,
      solaris: 0xf59e0b,
      nyx: 0x06b6d4
    };
    const glow = colors[this.currentCharacterId] || 0x38bdf8;
    if (this.magicTrailPoints.material instanceof THREE.PointsMaterial) {
      this.magicTrailPoints.material.color.setHex(glow);
    }

    const setKey = this.costumeSpriteSets[this.currentCostumeId]
      ? this.currentCostumeId
      : (this.costumeSpriteSets[`${this.currentCharacterId}_default`] ? `${this.currentCharacterId}_default` : 'default');
    const set = this.costumeSpriteSets[setKey] || this.costumeSpriteSets.default;
    this.skillFX.setTheme(this.currentCharacterId, this.currentCostumeId);
    if (this.isMenuMode) {
      this.spriteMat.map = set.front;
      this.spriteMat.needsUpdate = true;
    }
  }

  /**
   * Applies selected playable character (Luna, Stella, Solaris, Nyx).
   */
  public applyCharacter(charId: string, costumeId?: string): void {
    this.currentCharacterId = charId;
    if (costumeId && costumeId.startsWith(charId)) {
      this.currentCostumeId = costumeId;
    } else {
      this.currentCostumeId = `${charId}_default`;
    }

    const colors: Record<string, number> = {
      luna: 0x38bdf8,
      stella: 0xc084fc,
      solaris: 0xf59e0b,
      nyx: 0x06b6d4
    };
    const glow = colors[charId] || 0x38bdf8;
    if (this.magicTrailPoints.material instanceof THREE.PointsMaterial) {
      this.magicTrailPoints.material.color.setHex(glow);
    }

    const setKey = this.costumeSpriteSets[this.currentCostumeId]
      ? this.currentCostumeId
      : (this.costumeSpriteSets[`${charId}_default`] ? `${charId}_default` : 'default');
    const set = this.costumeSpriteSets[setKey] || this.costumeSpriteSets.default;
    this.skillFX.setTheme(this.currentCharacterId, this.currentCostumeId);

    if (this.isMenuMode) {
      this.spriteMat.map = set.front;
      this.spriteMat.needsUpdate = true;
    }
  }

  /**
   * Activates the character's unique combat/survival skill.
   */
  public activateSkill(cooldownMult = 1.0, skillLevel = 1): { success: boolean; skillName: string } {
    if (this.skillCooldownRemaining > 0 || this.state === CharacterState.DIE) {
      return { success: false, skillName: '' };
    }

    const baseCooldowns: Record<string, number> = {
      luna: 12,
      stella: 15,
      solaris: 17,
      nyx: 16
    };
    const baseCooldown = baseCooldowns[this.currentCharacterId] || 12;
    // Skill level reduces cooldown slightly (2% per level above 1, up to 30% extra reduction) and extends duration (+0.15s per level above 1)
    const lvlCdMult = Math.max(0.7, 1.0 - Math.max(0, skillLevel - 1) * 0.02);
    const bonusDuration = Math.min(3.0, Math.max(0, skillLevel - 1) * 0.15);

    this.skillCooldownRemaining = baseCooldown * cooldownMult * lvlCdMult;
    this.isSkillActive = true;
    this.skillFX.triggerSkill(this.currentCharacterId, this.currentCostumeId);

    if (this.currentCharacterId === 'luna') {
      this.skillActiveTimeRemaining = 0.8 + bonusDuration * 0.25;
      this.isSlashWaveActive = true;
      this.slashWaveMesh.visible = true;
      this.slashWaveMesh.position.set(0, 0.8, -1.2);
      return { success: true, skillName: '달빛 일섬 (Moonlight Slash)' };
    } else if (this.currentCharacterId === 'stella') {
      this.skillActiveTimeRemaining = 6.0 + bonusDuration;
      return { success: true, skillName: '스타폴 변환 (Starfall Transmute)' };
    } else if (this.currentCharacterId === 'solaris') {
      this.skillActiveTimeRemaining = 5.0 + bonusDuration;
      return { success: true, skillName: '태양 전차 돌격 (Solar Juggernaut)' };
    } else if (this.currentCharacterId === 'nyx') {
      this.skillActiveTimeRemaining = 6.0 + bonusDuration;
      return { success: true, skillName: '그림자 차원 은신 (Shadow Shift)' };
    }

    return { success: true, skillName: 'Active Skill' };
  }

  // --- Controls & Lane Mechanics ---

  public moveLeft(): boolean {
    if (this.state === CharacterState.DIE) return false;
    if (this.currentLane > -1) {
      this.targetLane = this.currentLane - 1;
      this.isTransitioningLane = true;
      return true;
    }
    return false;
  }

  public moveRight(): boolean {
    if (this.state === CharacterState.DIE) return false;
    if (this.currentLane < 1) {
      this.targetLane = this.currentLane + 1;
      this.isTransitioningLane = true;
      return true;
    }
    return false;
  }

  public jump(): boolean {
    if (this.state === CharacterState.DIE || this.isFallingIntoPit) return false;
    if (
      this.state === CharacterState.RUN ||
      this.state === CharacterState.SLIDE ||
      this.state === CharacterState.LAND
    ) {
      this.state = CharacterState.JUMP;
      this.velocityY = this.jumpForce;
      this.slideTimer = 0;
      this.landTimer = 0;
      this.visualGroup.scale.set(1, 1, 1);
      return true;
    }
    return false;
  }

  public slide(): boolean {
    if (this.state === CharacterState.DIE || this.isFallingIntoPit) return false;
    if (this.state === CharacterState.RUN || this.state === CharacterState.LAND) {
      this.state = CharacterState.SLIDE;
      this.slideTimer = this.slideDuration;
      this.landTimer = 0;
      return true;
    } else if (this.state === CharacterState.JUMP || this.state === CharacterState.FALL) {
      // Immediate fast-fall dive
      this.velocityY = -22.0;
      this.state = CharacterState.FALL;
      return true;
    }
    return false;
  }

  public hitObstacle(isFatal = false): void {
    // Nyx is completely immune during shadow phantasm
    if (this.currentCharacterId === 'nyx' && this.isSkillActive) {
      return;
    }
    // Solaris smashes through non-fatal obstacles during solar rush
    if (this.currentCharacterId === 'solaris' && this.isSkillActive && !isFatal) {
      return;
    }

    if (!isFatal && this.hasShield) {
      this.hasShield = false;
      this.shieldBubble.visible = false;
      return;
    }
    this.state = CharacterState.DIE;
    this.deathTimer = 0;
  }

  public setShieldActive(active: boolean): void {
    this.hasShield = active;
    this.shieldBubble.visible = active;
  }

  public activateMagnet(duration: number): void {
    this.magnetTimeRemaining = Math.max(this.magnetTimeRemaining, duration);
  }

  // --- Update Loop & 2.5D Sprite Animation ---

  public update(dt: number, forwardSpeed = 16): void {
    this.isMenuMode = false;

    // Update active skill timers
    if (this.skillCooldownRemaining > 0) {
      this.skillCooldownRemaining = Math.max(0, this.skillCooldownRemaining - dt);
    }
    if (this.isSkillActive) {
      this.skillActiveTimeRemaining = Math.max(0, this.skillActiveTimeRemaining - dt);
      if (this.skillActiveTimeRemaining <= 0) {
        this.isSkillActive = false;
        if (this.isSlashWaveActive) {
          this.isSlashWaveActive = false;
          this.slashWaveMesh.visible = false;
        }
      }
    }
    if (this.isSlashWaveActive) {
      this.slashWaveMesh.position.z -= dt * 65.0; // Rushes forward ahead of character
    }

    // Update active skill 3D visual FX, particle systems, and auras
    this.skillFX.update(dt, this.isSkillActive, this.mesh.position, this.isSlashWaveActive, this.spriteMesh);

    if (this.state === CharacterState.DIE) {
      this.deathTimer += dt;
      this.animateDeath(dt);
      return;
    }

    // Select action sprite based on character/costume and state
    let setKey = this.currentCostumeId;
    if (this.currentCharacterId !== 'luna' && (!setKey || setKey === 'default' || !setKey.startsWith(this.currentCharacterId))) {
      setKey = `${this.currentCharacterId}_default`;
    }
    if (!this.costumeSpriteSets[setKey]) {
      setKey = `${this.currentCharacterId}_default`;
    }
    const currentSet = this.costumeSpriteSets[setKey] || this.costumeSpriteSets.default;
    let targetTex = currentSet.runF1;

    if (this.state === CharacterState.SLIDE) {
      targetTex = currentSet.slide;
    } else if (this.state === CharacterState.JUMP || this.state === CharacterState.FALL) {
      targetTex = currentSet.jump;
    } else {
      // 4-Frame running stride cycle based on runAnimTime (realistic alternating leg movement)
      const norm = ((this.runAnimTime % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
      const frameIdx = Math.floor((norm / (Math.PI * 2)) * 4);
      if (frameIdx === 0) targetTex = currentSet.runF1;
      else if (frameIdx === 1) targetTex = currentSet.runF2;
      else if (frameIdx === 2) targetTex = currentSet.runF3 || currentSet.runF1;
      else targetTex = currentSet.runF4 || currentSet.runF2;
    }

    if (this.spriteMat.map !== targetTex) {
      this.spriteMat.map = targetTex;
      this.spriteMat.needsUpdate = true;
    }

    // Fever mode rainbow glow or standard color
    if (this.isFeverMode) {
      const feverTime = Date.now() * 0.008;
      this.spriteMat.color.setRGB(
        0.85 + Math.sin(feverTime) * 0.15,
        0.85 + Math.sin(feverTime + 2) * 0.15,
        0.85 + Math.sin(feverTime + 4) * 0.15
      );
    } else {
      this.spriteMat.color.setRGB(1, 1, 1);
    }
    this.spriteMat.opacity = 1.0;

    // 1. Horizontal Lane Transition (Smooth Spring Lerp when not turning corner)
    if (!this.isTurningCorner) {
      const targetX = this.targetLane * LANE_WIDTH;
      const diffX = targetX - this.mesh.position.x;
      const cornerTilt = -this.cameraYaw * 0.35;
      if (Math.abs(diffX) > 0.03) {
        this.mesh.position.x += diffX * Math.min(1, dt * 15);
        // Lateral tilt when dashing plus corner banking lean
        this.visualGroup.rotation.z = diffX * 0.12 + cornerTilt;
        this.isTransitioningLane = true;
      } else {
        this.mesh.position.x = targetX;
        this.currentLane = this.targetLane;
        this.visualGroup.rotation.z = cornerTilt;
        this.isTransitioningLane = false;
      }
    }

    // 2. Vertical Physics (Gravity & Jump & Abyss Pit Fall)
    if (this.state === CharacterState.JUMP || this.state === CharacterState.FALL) {
      this.velocityY += this.gravity * dt;
      this.posY += this.velocityY * dt;

      if (this.velocityY < 0) {
        this.state = CharacterState.FALL;
      }

      if (!this.isFallingIntoPit && this.posY <= 0) {
        // Landed on solid track floor
        this.posY = 0;
        this.velocityY = 0;
        this.state = CharacterState.LAND;
        this.landTimer = 0.09;
        this.visualGroup.rotation.x = 0;
      } else if (this.isFallingIntoPit) {
        // Forward plunge posture as she falls down into the abyss pit
        this.visualGroup.rotation.x = Math.min(0.7, -this.posY * 0.16);
      }
    } else if (this.state === CharacterState.LAND) {
      this.landTimer -= dt;
      if (this.landTimer <= 0) {
        this.landTimer = 0;
        this.state = CharacterState.RUN;
      }
    }

    // 3. Sliding Duration
    if (this.state === CharacterState.SLIDE) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.slideTimer = 0;
        this.state = CharacterState.RUN;
        this.visualGroup.scale.set(1, 1, 1);
      }
    }

    this.mesh.position.y = this.posY;

    // Contact shadow follows Luna's X/Z but stays on floor (y = 0.02); hidden when falling into pit
    this.shadowMesh.visible = !this.isFallingIntoPit;
    this.shadowMesh.position.y = -this.posY + 0.02;
    const shadowScale = Math.max(0.38, 1.0 - this.posY * 0.22);
    this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
    this.shadowMat.opacity = Math.max(0.12, 0.55 - this.posY * 0.12);

    // 4. Shield Ground Ring & Orbiting Crystals Animation
    if (this.hasShield) {
      this.shieldBubble.visible = true;
      this.shieldBubble.rotation.y += dt * 2.2;
      this.shieldOrbsGroup.rotation.y += dt * 3.6;
      const shieldColors: Record<string, number> = { luna: 0x38bdf8, stella: 0xc084fc, solaris: 0xfbbf24, nyx: 0x22d3ee };
      const c = shieldColors[this.currentCharacterId] || 0x38bdf8;
      this.shieldRingMat.color.setHex(c);
      this.shieldOuterMat.color.setHex(c);
      this.shieldDomeMat.color.setHex(c);
      for (const mat of this.shieldOrbMats) {
        mat.color.setHex(c);
      }
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
      this.shieldDomeMat.opacity = 0.22 + pulse * 0.15;
      this.shieldRingMat.opacity = 0.7 + pulse * 0.3;
      this.shieldOuterMat.opacity = 0.5 + pulse * 0.3;
    } else {
      this.shieldBubble.visible = false;
    }

    // 5. Magnet Timer Update
    if (this.magnetTimeRemaining > 0) {
      this.magnetTimeRemaining = Math.max(0, this.magnetTimeRemaining - dt);
    }

    // 6. 2.5D Sprite Motion & Squash/Stretch
    this.animateSprite(dt, forwardSpeed);

    // 7. Update Footstep Sparkle Trail
    this.updateSparkleTrail(dt);
  }

  private animateSprite(dt: number, speed: number): void {
    const runFreq = Math.max(8, speed * 0.72);
    this.runAnimTime += dt * runFreq;

    // Sprite quad faces camera in running mode, maintaining orientation with camera angle
    this.visualGroup.rotation.y = this.cameraYaw;

    switch (this.state) {
      case CharacterState.RUN: {
        // Subtle vertical footstep bounce
        const bounce = Math.abs(Math.sin(this.runAnimTime)) * 0.065;
        this.visualGroup.position.y = bounce;
        this.visualGroup.scale.set(1, 1, 1);
        break;
      }

      case CharacterState.JUMP: {
        // Jump upward stretch
        this.visualGroup.position.y = 0.05;
        this.visualGroup.scale.set(0.92, 1.08, 1);
        break;
      }

      case CharacterState.FALL: {
        this.visualGroup.position.y = 0;
        this.visualGroup.scale.set(0.96, 1.04, 1);
        break;
      }

      case CharacterState.LAND: {
        // Impact landing squash
        this.visualGroup.position.y = 0;
        this.visualGroup.scale.set(1.15, 0.86, 1);
        break;
      }

      case CharacterState.SLIDE: {
        // Slide squash: low profile (46% height) to pass cleanly under low archways
        this.visualGroup.position.y = 0;
        this.visualGroup.scale.set(1.28, 0.46, 1);
        break;
      }

      case CharacterState.HIT: {
        this.visualGroup.rotation.z = 0.35;
        break;
      }
    }
  }

  private animateDeath(dt: number): void {
    const progress = Math.min(1.0, this.deathTimer / 0.45);
    this.visualGroup.rotation.z = progress * (Math.PI / 2.2);
    this.visualGroup.position.y = Math.max(0, 0.3 - progress * 0.3);
    this.spriteMat.color.setRGB(1.0, Math.max(0.25, 1.0 - progress * 0.75), Math.max(0.25, 1.0 - progress * 0.75));
    this.spriteMat.opacity = Math.max(0.35, 1.0 - progress * 0.5);
  }

  private updateSparkleTrail(dt: number): void {
    const posAttr = this.magicTrailPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    // Shift previous particles back
    for (let i = array.length - 3; i >= 3; i -= 3) {
      array[i] = array[i - 3];
      array[i + 1] = array[i - 2] * 0.95;
      array[i + 2] = array[i - 1] + dt * 4.0;
    }

    // Spawn new sparkle at current footstep
    if (this.state === CharacterState.RUN) {
      const footX = (Math.random() - 0.5) * 0.3;
      array[0] = footX;
      array[1] = 0.08;
      array[2] = 0.2;
    }

    posAttr.needsUpdate = true;
  }

  /**
   * Main Menu & Costume Select 3D showcase mode.
   * Displays full-body front illustration with gentle idle floating & breathing.
   */
  public setMenuPreviewMode(rotAngle: number): void {
    this.isMenuMode = true;
    this.mesh.position.set(0, 0, 0);
    this.posY = 0;

    // Display front costume illustration
    const setKey = this.costumeSpriteSets[this.currentCostumeId]
      ? this.currentCostumeId
      : (this.costumeSpriteSets[`${this.currentCharacterId}_default`] ? `${this.currentCharacterId}_default` : 'default');
    const set = this.costumeSpriteSets[setKey] || this.costumeSpriteSets.default;
    if (this.spriteMat.map !== set.front) {
      this.spriteMat.map = set.front;
      this.spriteMat.needsUpdate = true;
    }
    this.spriteMat.color.setRGB(1, 1, 1);
    this.spriteMat.opacity = 1.0;

    // Face camera with subtle sway
    this.visualGroup.rotation.set(0, rotAngle * 0.25, 0);

    // Idle breathing & floating
    const idleTime = Date.now() * 0.002;
    this.visualGroup.position.y = Math.sin(idleTime) * 0.035;
    const breath = 1.0 + Math.sin(idleTime * 1.5) * 0.015;
    this.visualGroup.scale.set(breath, breath, 1);

    // Shadow breathing
    this.shadowMesh.position.y = 0.02;
    this.shadowMesh.scale.set(breath, breath, 1);
    this.shadowMat.opacity = 0.52;
  }

  public reset(): void {
    this.currentLane = 0;
    this.targetLane = 0;
    this.isTransitioningLane = false;
    this.posY = 0;
    this.velocityY = 0;
    this.isFallingIntoPit = false;
    this.slideTimer = 0;
    this.landTimer = 0;
    this.deathTimer = 0;
    this.state = CharacterState.RUN;
    this.mesh.position.set(0, 0, 0);
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.rotation.set(0, 0, 0);
    this.visualGroup.scale.set(1, 1, 1);
    this.spriteMat.color.setRGB(1, 1, 1);
    this.spriteMat.opacity = 1.0;
    this.hasShield = false;
    this.shieldBubble.visible = false;
    this.magnetTimeRemaining = 0;
    this.isMenuMode = true;
    this.isFeverMode = false;
    this.currentCharacterId = 'luna';
    this.skillCooldownRemaining = 0;
    this.isSkillActive = false;
    this.skillActiveTimeRemaining = 0;
    this.isSlashWaveActive = false;
    this.skillFX.reset();

    const setKey = this.costumeSpriteSets[this.currentCostumeId]
      ? this.currentCostumeId
      : (this.costumeSpriteSets[`${this.currentCharacterId}_default`] ? `${this.currentCharacterId}_default` : 'default');
    const set = this.costumeSpriteSets[setKey] || this.costumeSpriteSets.default;
    this.spriteMat.map = set.front;
    this.spriteMat.needsUpdate = true;
  }
}
