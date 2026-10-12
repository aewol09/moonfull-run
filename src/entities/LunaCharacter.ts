import * as THREE from 'three';
import { TextureGenerator } from '../render/TextureGenerator';

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
  public visualGroup: THREE.Group; // Group rotated Math.PI in run mode so face points -Z
  public state: CharacterState = CharacterState.RUN;

  // Lane position: -1 (Left), 0 (Center), 1 (Right)
  public currentLane = 0;
  public targetLane = 0;
  public isTransitioningLane = false;

  // Vertical physics
  public posY = 0;
  public velocityY = 0;
  private readonly gravity = -34.0;
  private readonly jumpForce = 11.5;

  // Slide state
  private slideTimer = 0;
  private readonly slideDuration = 0.65; // seconds

  // Death sequence timer
  public deathTimer = 0;
  public readonly deathDuration = 1.0; // seconds before game over modal triggers

  // Procedural 3D Mesh joints
  private headGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private capeMesh: THREE.Mesh;
  private hairMesh: THREE.Mesh;
  private ponytailMesh: THREE.Mesh;
  private ponytailSecondary: THREE.Mesh;
  private torsoMesh: THREE.Mesh;
  private pendantMesh: THREE.Mesh;
  private shieldBubble: THREE.Mesh;
  private magicTrailPoints: THREE.Points;
  private trailPositions: Float32Array;

  // Face Elements
  private leftEyeMesh: THREE.Mesh;
  private rightEyeMesh: THREE.Mesh;

  // Shared Materials for costume switching
  private hairMat: THREE.MeshStandardMaterial;
  private tunicMat: THREE.MeshStandardMaterial;
  private capeMat: THREE.MeshStandardMaterial;
  private pendantMat: THREE.MeshStandardMaterial;
  private glowMat: THREE.MeshBasicMaterial;
  private bootsMat: THREE.MeshStandardMaterial;
  private skinMat: THREE.MeshStandardMaterial;
  private eyeMat: THREE.MeshBasicMaterial;

  // Animation clocks & flags
  private runAnimTime = 0;
  public hasShield = false;
  public magnetTimeRemaining = 0;
  public currentCostumeId = 'default';

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 0);

    this.visualGroup = new THREE.Group();
    this.mesh.add(this.visualGroup);

    // Initial default materials with procedural fabric textures
    const preset = COSTUME_PRESETS.default;
    const fabricTex = TextureGenerator.createCostumeFabricTexture(preset.tunicHex, preset.trimHex);
    const eyeTex = TextureGenerator.createEyeTexture(preset.eyeColor);

    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      roughness: 0.5,
      metalness: 0.05
    });

    this.hairMat = new THREE.MeshStandardMaterial({
      color: preset.hairColor,
      roughness: 0.35,
      metalness: 0.25
    });

    this.tunicMat = new THREE.MeshStandardMaterial({
      map: fabricTex,
      color: preset.tunicColor,
      roughness: 0.6,
      metalness: 0.15
    });

    this.capeMat = new THREE.MeshStandardMaterial({
      map: fabricTex,
      color: preset.capeColor,
      side: THREE.DoubleSide,
      roughness: 0.65,
      metalness: 0.2
    });

    this.pendantMat = new THREE.MeshStandardMaterial({
      color: preset.accentColor,
      metalness: 0.85,
      roughness: 0.15,
      emissive: preset.accentColor,
      emissiveIntensity: 0.3
    });

    this.glowMat = new THREE.MeshBasicMaterial({ color: preset.glowColor });

    this.bootsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.55,
      metalness: 0.3
    });

    this.eyeMat = new THREE.MeshBasicMaterial({
      map: eyeTex,
      transparent: true
    });

    // --- 1. Torso & Armor ---
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.9, 0);

    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.56, 12);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.tunicMat);
    this.torsoMesh.castShadow = true;
    this.torsoGroup.add(this.torsoMesh);

    // Gold waist belt
    const beltGeo = new THREE.CylinderGeometry(0.21, 0.2, 0.08, 12);
    const beltMat = new THREE.MeshStandardMaterial({ color: preset.accentColor, metalness: 0.7, roughness: 0.3 });
    const beltMesh = new THREE.Mesh(beltGeo, beltMat);
    beltMesh.position.y = -0.22;
    this.torsoGroup.add(beltMesh);

    // Glowing Moon Pendant (Front of chest: local +Z)
    const pendantGeo = new THREE.TorusGeometry(0.08, 0.024, 8, 16, Math.PI * 1.5);
    this.pendantMesh = new THREE.Mesh(pendantGeo, this.pendantMat);
    this.pendantMesh.position.set(0, 0.12, 0.23);
    this.torsoGroup.add(this.pendantMesh);

    // --- 2. Head & Cute Anime Face ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.42, 0);

    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, this.skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Expressive Anime Eyes on local +Z face
    const eyeGeo = new THREE.PlaneGeometry(0.08, 0.1);
    this.leftEyeMesh = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.leftEyeMesh.position.set(-0.075, 0.02, 0.21);
    this.headGroup.add(this.leftEyeMesh);

    this.rightEyeMesh = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.rightEyeMesh.position.set(0.075, 0.02, 0.21);
    this.headGroup.add(this.rightEyeMesh);

    // Soft Blush on cheeks
    const blushGeo = new THREE.PlaneGeometry(0.05, 0.025);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.35 });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.09, -0.04, 0.208);
    this.headGroup.add(leftBlush);
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.09, -0.04, 0.208);
    this.headGroup.add(rightBlush);

    // --- 3. Hair (Crown, Bangs, Flowing Locks & Ponytail) ---
    // Crown hair
    const hairGeo = new THREE.SphereGeometry(0.245, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    this.hairMesh = new THREE.Mesh(hairGeo, this.hairMat);
    this.hairMesh.position.set(0, 0.04, -0.01);
    this.headGroup.add(this.hairMesh);

    // Front Bangs framing the forehead
    [-0.07, 0, 0.07].forEach((bx, i) => {
      const bangGeo = new THREE.ConeGeometry(0.045, 0.16, 5);
      const bangMesh = new THREE.Mesh(bangGeo, this.hairMat);
      bangMesh.rotation.x = Math.PI * 0.88;
      bangMesh.rotation.z = (i - 1) * 0.18;
      bangMesh.position.set(bx, 0.14, 0.18);
      this.headGroup.add(bangMesh);
    });

    // Side hair locks
    [-0.19, 0.19].forEach((sx) => {
      const lockGeo = new THREE.ConeGeometry(0.04, 0.28, 5);
      const lockMesh = new THREE.Mesh(lockGeo, this.hairMat);
      lockMesh.rotation.x = Math.PI * 0.95;
      lockMesh.position.set(sx, -0.02, 0.06);
      this.headGroup.add(lockMesh);
    });

    // Main Volumetric Ponytail (Back of head: local -Z)
    const tailGeo = new THREE.ConeGeometry(0.13, 0.55, 8);
    this.ponytailMesh = new THREE.Mesh(tailGeo, this.hairMat);
    this.ponytailMesh.rotation.x = -Math.PI * 0.68;
    this.ponytailMesh.position.set(0, -0.05, -0.27);
    this.headGroup.add(this.ponytailMesh);

    // Secondary ponytail flare lock
    const tailSubGeo = new THREE.ConeGeometry(0.08, 0.42, 6);
    this.ponytailSecondary = new THREE.Mesh(tailSubGeo, this.hairMat);
    this.ponytailSecondary.rotation.x = -Math.PI * 0.74;
    this.ponytailSecondary.position.set(0, -0.12, -0.32);
    this.headGroup.add(this.ponytailSecondary);

    // Hair Ribbon / Tie Ring
    const ribbonGeo = new THREE.TorusGeometry(0.09, 0.025, 6, 12);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: preset.accentColor, metalness: 0.6 });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.rotation.x = Math.PI * 0.32;
    ribbonMesh.position.set(0, 0.06, -0.21);
    this.headGroup.add(ribbonMesh);

    this.torsoGroup.add(this.headGroup);

    // --- 4. Arms with Pauldrons & Bracers ---
    const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.46, 8);
    armGeo.translate(0, -0.2, 0);

    const pauldronGeo = new THREE.SphereGeometry(0.11, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.31, 0.2, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, this.tunicMat);
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    const leftPauldron = new THREE.Mesh(pauldronGeo, beltMat);
    leftPauldron.position.set(0, 0.02, 0);
    this.leftArm.add(leftPauldron);
    this.torsoGroup.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.31, 0.2, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, this.tunicMat);
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);
    const rightPauldron = new THREE.Mesh(pauldronGeo, beltMat);
    rightPauldron.position.set(0, 0.02, 0);
    this.rightArm.add(rightPauldron);
    this.torsoGroup.add(this.rightArm);

    // --- 5. Legs & Adventurer Boots ---
    const legGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.34, 8);
    legGeo.translate(0, -0.15, 0);

    const bootGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.34, 8);
    bootGeo.translate(0, -0.16, 0);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.13, 0.6, 0);
    const leftThigh = new THREE.Mesh(legGeo, this.tunicMat);
    leftThigh.castShadow = true;
    this.leftLeg.add(leftThigh);
    const leftBoot = new THREE.Mesh(bootGeo, this.bootsMat);
    leftBoot.position.set(0, -0.28, 0);
    leftBoot.castShadow = true;
    this.leftLeg.add(leftBoot);
    this.visualGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.13, 0.6, 0);
    const rightThigh = new THREE.Mesh(legGeo, this.tunicMat);
    rightThigh.castShadow = true;
    this.rightLeg.add(rightThigh);
    const rightBoot = new THREE.Mesh(bootGeo, this.bootsMat);
    rightBoot.position.set(0, -0.28, 0);
    rightBoot.castShadow = true;
    this.rightLeg.add(rightBoot);
    this.visualGroup.add(this.rightLeg);

    // --- 6. Flowing Cape (Back of torso: local -Z) ---
    const capeGeo = new THREE.PlaneGeometry(0.54, 0.88, 6, 6);
    capeGeo.translate(0, -0.42, 0);
    this.capeMesh = new THREE.Mesh(capeGeo, this.capeMat);
    this.capeMesh.position.set(0, 0.22, -0.16);
    this.torsoGroup.add(this.capeMesh);

    this.visualGroup.add(this.torsoGroup);

    // --- 7. Iridescent Moonlight Shield Bubble ---
    const shieldGeo = new THREE.SphereGeometry(1.12, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.38,
      wireframe: true
    });
    this.shieldBubble = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldBubble.position.set(0, 0.85, 0);
    this.shieldBubble.visible = false;
    this.mesh.add(this.shieldBubble);

    // --- 8. Magic Lunar Footsteps Trail Particles ---
    const trailCount = 28;
    this.trailPositions = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.8
    });
    this.magicTrailPoints = new THREE.Points(trailGeo, trailMat);
    this.mesh.add(this.magicTrailPoints);

    // Default orientation: Running forward into -Z world!
    this.visualGroup.rotation.y = Math.PI;
  }

  // --- Costume Switching ---

  public applyCostume(costumeId: string): void {
    const preset = COSTUME_PRESETS[costumeId] || COSTUME_PRESETS.default;
    this.currentCostumeId = preset.id;

    // Update base colors
    this.hairMat.color.setHex(preset.hairColor);
    this.tunicMat.color.setHex(preset.tunicColor);
    this.capeMat.color.setHex(preset.capeColor);
    this.pendantMat.color.setHex(preset.accentColor);
    this.pendantMat.emissive.setHex(preset.accentColor);
    this.glowMat.color.setHex(preset.glowColor);

    // Generate & update dynamic fabric & eye textures
    const fabricTex = TextureGenerator.createCostumeFabricTexture(preset.tunicHex, preset.trimHex);
    this.tunicMat.map = fabricTex;
    this.tunicMat.needsUpdate = true;
    this.capeMat.map = fabricTex;
    this.capeMat.needsUpdate = true;

    const eyeTex = TextureGenerator.createEyeTexture(preset.eyeColor);
    this.eyeMat.map = eyeTex;
    this.eyeMat.needsUpdate = true;
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
    if (this.state === CharacterState.DIE) return false;
    if (this.state === CharacterState.RUN || this.state === CharacterState.SLIDE) {
      this.state = CharacterState.JUMP;
      this.velocityY = this.jumpForce;
      this.slideTimer = 0;
      this.visualGroup.scale.set(1, 1, 1);
      return true;
    }
    return false;
  }

  public slide(): boolean {
    if (this.state === CharacterState.DIE) return false;
    if (this.state === CharacterState.RUN) {
      this.state = CharacterState.SLIDE;
      this.slideTimer = this.slideDuration;
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

  // --- Update Loop & Procedural Animation ---

  public update(dt: number, forwardSpeed: number): void {
    if (this.state === CharacterState.DIE) {
      this.deathTimer += dt;
      this.animateDeath(dt);
      return;
    }

    // 1. Horizontal Lane Transition (Smooth Spring Lerp)
    const targetX = this.targetLane * LANE_WIDTH;
    const diffX = targetX - this.mesh.position.x;
    if (Math.abs(diffX) > 0.03) {
      this.mesh.position.x += diffX * Math.min(1, dt * 15);
      // Lateral tilt when dashing
      this.visualGroup.rotation.z = diffX * 0.12;
      this.isTransitioningLane = true;
    } else {
      this.mesh.position.x = targetX;
      this.currentLane = this.targetLane;
      this.visualGroup.rotation.z = 0;
      this.isTransitioningLane = false;
    }

    // 2. Vertical Physics (Gravity & Jump)
    if (this.state === CharacterState.JUMP || this.state === CharacterState.FALL) {
      this.velocityY += this.gravity * dt;
      this.posY += this.velocityY * dt;

      if (this.velocityY < 0) {
        this.state = CharacterState.FALL;
      }

      if (this.posY <= 0) {
        // Landed
        this.posY = 0;
        this.velocityY = 0;
        this.state = CharacterState.LAND;
        setTimeout(() => {
          if (this.state === CharacterState.LAND) {
            this.state = CharacterState.RUN;
          }
        }, 90);
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

    // 4. Shield Rotation Animation
    if (this.hasShield) {
      this.shieldBubble.rotation.y += dt * 2.5;
      this.shieldBubble.rotation.x += dt * 1.5;
    }

    // 5. Magnet Timer Update
    if (this.magnetTimeRemaining > 0) {
      this.magnetTimeRemaining = Math.max(0, this.magnetTimeRemaining - dt);
    }

    // 6. Procedural Bone/Mesh Animations
    this.animateProcedural(dt, forwardSpeed);

    // 7. Update Footstep Sparkle Trail
    this.updateSparkleTrail(dt);
  }

  private animateProcedural(dt: number, speed: number): void {
    const runFreq = Math.max(8, speed * 0.72);
    this.runAnimTime += dt * runFreq;

    // Ensure visual group faces forward (-Z) while running
    this.visualGroup.rotation.y = Math.PI;

    switch (this.state) {
      case CharacterState.RUN: {
        const swing = Math.sin(this.runAnimTime);
        this.leftLeg.rotation.x = swing * 0.85;
        this.rightLeg.rotation.x = -swing * 0.85;
        this.leftArm.rotation.x = -swing * 0.75;
        this.rightArm.rotation.x = swing * 0.75;

        // Torso & head natural bounce
        this.torsoGroup.position.y = 0.9 + Math.abs(swing) * 0.08;
        this.torsoGroup.rotation.y = swing * 0.08;
        this.visualGroup.scale.set(1, 1, 1);

        // Cape and ponytail waving dynamically back towards camera (+Z world = local -Z)
        const wind = Math.sin(this.runAnimTime * 1.8);
        this.capeMesh.rotation.x = -0.45 - wind * 0.28;
        this.ponytailMesh.rotation.x = -Math.PI * 0.68 - wind * 0.16;
        this.ponytailSecondary.rotation.x = -Math.PI * 0.74 - wind * 0.22;
        break;
      }

      case CharacterState.JUMP: {
        this.leftLeg.rotation.x = 0.55;
        this.rightLeg.rotation.x = 0.35;
        this.leftArm.rotation.x = -1.6;
        this.rightArm.rotation.x = -1.6;
        this.capeMesh.rotation.x = -0.85;
        this.ponytailMesh.rotation.x = -Math.PI * 0.55;
        this.torsoGroup.position.y = 0.9;
        break;
      }

      case CharacterState.FALL: {
        this.leftLeg.rotation.x = -0.3;
        this.rightLeg.rotation.x = -0.2;
        this.leftArm.rotation.x = -0.8;
        this.rightArm.rotation.x = -0.8;
        this.capeMesh.rotation.x = -1.0;
        this.ponytailMesh.rotation.x = -Math.PI * 0.85;
        break;
      }

      case CharacterState.LAND: {
        this.visualGroup.scale.set(1.15, 0.85, 1.15);
        this.leftLeg.rotation.x = 0.25;
        this.rightLeg.rotation.x = 0.25;
        break;
      }

      case CharacterState.SLIDE: {
        // Lower profile and slide flat
        this.visualGroup.scale.set(1.0, 0.48, 1.25);
        this.leftLeg.rotation.x = 1.4;
        this.rightLeg.rotation.x = 1.2;
        this.leftArm.rotation.x = 1.0;
        this.rightArm.rotation.x = 1.0;
        this.capeMesh.rotation.x = -0.1;
        break;
      }

      case CharacterState.HIT: {
        this.visualGroup.rotation.x = 0.4;
        this.torsoGroup.rotation.y = 0.6;
        break;
      }
    }
  }

  private animateDeath(dt: number): void {
    // Graceful tumble and fall to floor
    const progress = Math.min(1.0, this.deathTimer / 0.4);
    this.visualGroup.rotation.x = progress * Math.PI * 0.48;
    this.mesh.position.y = Math.max(0.12, this.posY - progress * 0.6);
    this.capeMesh.rotation.x = 0.1;
    this.leftArm.rotation.x = 0;
    this.rightArm.rotation.x = 0;
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

  public setMenuPreviewMode(rotAngle: number): void {
    // Face the camera in menu showcase
    this.visualGroup.rotation.y = rotAngle;
    this.visualGroup.rotation.x = 0;
    this.visualGroup.rotation.z = 0;
    this.visualGroup.scale.set(1, 1, 1);
    this.mesh.position.set(0, 0, 0);

    // Idle breathing & gentle hair motion
    const idleTime = Date.now() * 0.002;
    this.torsoGroup.position.y = 0.9 + Math.sin(idleTime) * 0.03;
    this.capeMesh.rotation.x = -0.2 + Math.sin(idleTime * 0.8) * 0.08;
    this.ponytailMesh.rotation.x = -Math.PI * 0.68 + Math.sin(idleTime * 1.2) * 0.06;
    this.ponytailSecondary.rotation.x = -Math.PI * 0.74 + Math.sin(idleTime * 1.2) * 0.08;
    this.leftArm.rotation.x = Math.sin(idleTime) * 0.05;
    this.rightArm.rotation.x = -Math.sin(idleTime) * 0.05;
  }

  public reset(): void {
    this.currentLane = 0;
    this.targetLane = 0;
    this.isTransitioningLane = false;
    this.posY = 0;
    this.velocityY = 0;
    this.slideTimer = 0;
    this.deathTimer = 0;
    this.state = CharacterState.RUN;
    this.mesh.position.set(0, 0, 0);
    this.visualGroup.rotation.set(0, Math.PI, 0);
    this.visualGroup.scale.set(1, 1, 1);
    this.hasShield = false;
    this.shieldBubble.visible = false;
    this.magnetTimeRemaining = 0;
  }
}
