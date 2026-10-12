import * as THREE from 'three';

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
    glowColor: 0x38bdf8
  },
  guardian: {
    id: 'guardian',
    name: '성스러운 수호자',
    description: '고대 별의 기운을 담은 딥 바이올렛 수호 아머',
    cost: 300,
    hairColor: 0xf1f5f9,
    tunicColor: 0x2e1065,
    capeColor: 0x4c1d95,
    accentColor: 0xa855f7,
    glowColor: 0xc084fc
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
    glowColor: 0xfde047
  }
};

export class LunaCharacter {
  public mesh: THREE.Group;
  public visualGroup: THREE.Group; // Group that gets rotated Math.PI in run mode so face points -Z
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
  private torsoMesh: THREE.Mesh;
  private pendantMesh: THREE.Mesh;
  private shieldBubble: THREE.Mesh;
  private magicTrailPoints: THREE.Points;
  private trailPositions: Float32Array;

  // Shared Materials for costume switching
  private hairMat: THREE.MeshStandardMaterial;
  private tunicMat: THREE.MeshStandardMaterial;
  private capeMat: THREE.MeshStandardMaterial;
  private pendantMat: THREE.MeshStandardMaterial;
  private glowMat: THREE.MeshBasicMaterial;

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

    // Initial default materials
    const preset = COSTUME_PRESETS.default;
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 });
    this.hairMat = new THREE.MeshStandardMaterial({ color: preset.hairColor, roughness: 0.35, metalness: 0.3 });
    this.tunicMat = new THREE.MeshStandardMaterial({ color: preset.tunicColor, roughness: 0.5, metalness: 0.2 });
    this.capeMat = new THREE.MeshStandardMaterial({ color: preset.capeColor, side: THREE.DoubleSide, roughness: 0.6 });
    this.pendantMat = new THREE.MeshStandardMaterial({ color: preset.accentColor, metalness: 0.8, roughness: 0.2 });
    this.glowMat = new THREE.MeshBasicMaterial({ color: preset.glowColor });

    // Torso (Armor / Tunic)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.9, 0);

    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.55, 12);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.tunicMat);
    this.torsoMesh.castShadow = true;
    this.torsoGroup.add(this.torsoMesh);

    // Glowing Moon Pendant (Front of chest: local +Z)
    const pendantGeo = new THREE.TorusGeometry(0.08, 0.025, 8, 16, Math.PI * 1.5);
    this.pendantMesh = new THREE.Mesh(pendantGeo, this.pendantMat);
    this.pendantMesh.position.set(0, 0.12, 0.22);
    this.torsoGroup.add(this.pendantMesh);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.42, 0);

    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Face eyes (small cute mystic eyes on local +Z)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    [-0.07, 0.07].forEach(eyeX => {
      const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
      eyeMesh.position.set(eyeX, 0.02, 0.2);
      this.headGroup.add(eyeMesh);
    });

    // Silver Hair
    const hairGeo = new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    this.hairMesh = new THREE.Mesh(hairGeo, this.hairMat);
    this.hairMesh.position.set(0, 0.04, -0.02);
    this.headGroup.add(this.hairMesh);

    // Hair Ponytail / Flowing Locks (Back of head: local -Z)
    const tailGeo = new THREE.ConeGeometry(0.12, 0.5, 8);
    this.ponytailMesh = new THREE.Mesh(tailGeo, this.hairMat);
    this.ponytailMesh.rotation.x = -Math.PI * 0.68;
    this.ponytailMesh.position.set(0, -0.05, -0.26);
    this.headGroup.add(this.ponytailMesh);

    this.torsoGroup.add(this.headGroup);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.45, 8);
    armGeo.translate(0, -0.2, 0);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.32, 0.2, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, this.tunicMat);
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    this.torsoGroup.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.32, 0.2, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, this.tunicMat);
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);
    this.torsoGroup.add(this.rightArm);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8);
    legGeo.translate(0, -0.3, 0);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, 0.6, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.tunicMat);
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);
    this.visualGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, 0.6, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.tunicMat);
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);
    this.visualGroup.add(this.rightLeg);

    // Flowing Cape (Back of torso: local -Z)
    const capeGeo = new THREE.PlaneGeometry(0.5, 0.85, 4, 4);
    capeGeo.translate(0, -0.42, 0);
    this.capeMesh = new THREE.Mesh(capeGeo, this.capeMat);
    this.capeMesh.position.set(0, 0.22, -0.16);
    this.torsoGroup.add(this.capeMesh);

    this.visualGroup.add(this.torsoGroup);

    // Shield Bubble (Protective moonlight barrier around character)
    const shieldGeo = new THREE.SphereGeometry(1.1, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    this.shieldBubble = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldBubble.position.set(0, 0.85, 0);
    this.shieldBubble.visible = false;
    this.mesh.add(this.shieldBubble);

    // Magic Lunar Footsteps Trail Particles (Sparkles behind feet)
    const trailCount = 24;
    this.trailPositions = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.16,
      transparent: true,
      opacity: 0.7
    });
    this.magicTrailPoints = new THREE.Points(trailGeo, trailMat);
    this.mesh.add(this.magicTrailPoints);

    // Default orientation: Running forward into -Z world!
    // Since local +Z is Luna's front chest, rotating visualGroup by Math.PI makes Luna face -Z!
    this.visualGroup.rotation.y = Math.PI;
  }

  // --- Costume Switching ---

  public applyCostume(costumeId: string): void {
    const preset = COSTUME_PRESETS[costumeId] || COSTUME_PRESETS.default;
    this.currentCostumeId = preset.id;

    this.hairMat.color.setHex(preset.hairColor);
    this.tunicMat.color.setHex(preset.tunicColor);
    this.capeMat.color.setHex(preset.capeColor);
    this.pendantMat.color.setHex(preset.accentColor);
    this.glowMat.color.setHex(preset.glowColor);
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

        // Cape waving back towards camera (+Z in world, which is local -Z of visualGroup)
        this.capeMesh.rotation.x = -0.45 - Math.sin(this.runAnimTime * 1.8) * 0.28;
        this.ponytailMesh.rotation.x = -Math.PI * 0.68 - Math.sin(this.runAnimTime * 1.8) * 0.15;
        break;
      }

      case CharacterState.JUMP: {
        this.leftLeg.rotation.x = 0.55;
        this.rightLeg.rotation.x = 0.35;
        this.leftArm.rotation.x = -1.6;
        this.rightArm.rotation.x = -1.6;
        this.capeMesh.rotation.x = -0.85;
        this.torsoGroup.position.y = 0.9;
        break;
      }

      case CharacterState.FALL: {
        this.leftLeg.rotation.x = -0.3;
        this.rightLeg.rotation.x = -0.2;
        this.leftArm.rotation.x = -0.8;
        this.rightArm.rotation.x = -0.8;
        this.capeMesh.rotation.x = -1.0;
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
