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

export class LunaCharacter {
  public mesh: THREE.Group;
  public state: CharacterState = CharacterState.RUN;

  // Lane position: -1 (Left), 0 (Center), 1 (Right)
  public currentLane = 0;
  public targetLane = 0;
  public isTransitioningLane = false;

  // Vertical physics
  public posY = 0;
  public velocityY = 0;
  private readonly gravity = -32.0;
  private readonly jumpForce = 11.2;

  // Slide state
  private slideTimer = 0;
  private readonly slideDuration = 0.7; // seconds

  // Procedural 3D Mesh joints
  private headGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private capeMesh: THREE.Mesh;
  private shieldBubble: THREE.Mesh;
  private magicTrail: THREE.Points;

  // Animation clocks & flags
  private runAnimTime = 0;
  public hasShield = false;
  public magnetTimeRemaining = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 0);

    // 1. Build Luna's Procedural 3D Character
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 });
    const silverHairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.4 });
    const darkNavyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const mysticCyanMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.2 });

    // Torso (Armor / Tunic)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.9, 0);

    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.55, 12);
    const torsoMesh = new THREE.Mesh(torsoGeo, darkNavyMat);
    torsoMesh.castShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Glowing Moon Pendant
    const pendantGeo = new THREE.TorusGeometry(0.08, 0.025, 8, 16, Math.PI * 1.5);
    const pendantMesh = new THREE.Mesh(pendantGeo, goldMat);
    pendantMesh.position.set(0, 0.12, 0.22);
    this.torsoGroup.add(pendantMesh);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.42, 0);

    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Silver Hair
    const hairGeo = new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairMesh = new THREE.Mesh(hairGeo, silverHairMat);
    hairMesh.position.set(0, 0.04, -0.02);
    this.headGroup.add(hairMesh);

    // Hair Ponytail / Flowing Locks
    const tailGeo = new THREE.ConeGeometry(0.12, 0.45, 8);
    const tailMesh = new THREE.Mesh(tailGeo, silverHairMat);
    tailMesh.rotation.x = -Math.PI * 0.7;
    tailMesh.position.set(0, -0.05, -0.26);
    this.headGroup.add(tailMesh);

    this.torsoGroup.add(this.headGroup);

    // Arms
    const limbMat = darkNavyMat;
    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.45, 8);
    armGeo.translate(0, -0.2, 0);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.32, 0.2, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, limbMat);
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    this.torsoGroup.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.32, 0.2, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, limbMat);
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);
    this.torsoGroup.add(this.rightArm);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8);
    legGeo.translate(0, -0.3, 0);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, 0.6, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, limbMat);
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, 0.6, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, limbMat);
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);
    this.mesh.add(this.rightLeg);

    // Flowing Cape (Dark Navy with Moonlight Cyan Trim)
    const capeGeo = new THREE.PlaneGeometry(0.48, 0.8, 4, 4);
    capeGeo.translate(0, -0.4, 0);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      side: THREE.DoubleSide,
      roughness: 0.6
    });
    this.capeMesh = new THREE.Mesh(capeGeo, capeMat);
    this.capeMesh.position.set(0, 0.22, -0.16);
    this.torsoGroup.add(this.capeMesh);

    this.mesh.add(this.torsoGroup);

    // Shield Bubble (Protective moonlight barrier)
    const shieldGeo = new THREE.SphereGeometry(1.05, 24, 24);
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

    // Magic Lunar Footsteps Trail
    const trailGeo = new THREE.BufferGeometry();
    const trailCount = 30;
    const trailPositions = new Float32Array(trailCount * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.6
    });
    this.magicTrail = new THREE.Points(trailGeo, trailMat);
    this.mesh.add(this.magicTrail);
  }

  // --- Controls & Lane Mechanics ---

  public moveLeft(): boolean {
    if (this.currentLane > -1) {
      this.targetLane = this.currentLane - 1;
      this.isTransitioningLane = true;
      return true;
    }
    return false;
  }

  public moveRight(): boolean {
    if (this.currentLane < 1) {
      this.targetLane = this.currentLane + 1;
      this.isTransitioningLane = true;
      return true;
    }
    return false;
  }

  public jump(): boolean {
    if (this.state === CharacterState.RUN || this.state === CharacterState.SLIDE) {
      this.state = CharacterState.JUMP;
      this.velocityY = this.jumpForce;
      this.slideTimer = 0;
      this.mesh.scale.set(1, 1, 1);
      return true;
    }
    return false;
  }

  public slide(): boolean {
    if (this.state === CharacterState.RUN) {
      this.state = CharacterState.SLIDE;
      this.slideTimer = this.slideDuration;
      return true;
    } else if (this.state === CharacterState.JUMP || this.state === CharacterState.FALL) {
      // Fast fall when sliding in midair
      this.velocityY = -22.0;
      this.state = CharacterState.FALL;
      return true;
    }
    return false;
  }

  public hitObstacle(): void {
    if (this.hasShield) {
      this.hasShield = false;
      this.shieldBubble.visible = false;
      return;
    }
    this.state = CharacterState.DIE;
  }

  public setShieldActive(active: boolean): void {
    this.hasShield = active;
    this.shieldBubble.visible = active;
  }

  // --- Update Loop & Procedural Animation ---

  public update(dt: number, forwardSpeed: number): void {
    // 1. Horizontal Lane Transition (Smooth Spring Lerp)
    const targetX = this.targetLane * LANE_WIDTH;
    const diffX = targetX - this.mesh.position.x;
    if (Math.abs(diffX) > 0.03) {
      this.mesh.position.x += diffX * Math.min(1, dt * 14);
      // Lateral tilt when dashing
      this.mesh.rotation.z = -diffX * 0.12;
      this.isTransitioningLane = true;
    } else {
      this.mesh.position.x = targetX;
      this.currentLane = this.targetLane;
      this.mesh.rotation.z = 0;
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
        }, 80);
      }
    }

    // 3. Sliding Duration
    if (this.state === CharacterState.SLIDE) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.slideTimer = 0;
        this.state = CharacterState.RUN;
        this.mesh.scale.set(1, 1, 1);
      }
    }

    this.mesh.position.y = this.posY;

    // 4. Shield Animation
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
  }

  private animateProcedural(dt: number, speed: number): void {
    const runFreq = Math.max(8, speed * 0.7);
    this.runAnimTime += dt * runFreq;

    switch (this.state) {
      case CharacterState.RUN: {
        // Natural running cycle
        const swing = Math.sin(this.runAnimTime);
        this.leftLeg.rotation.x = swing * 0.8;
        this.rightLeg.rotation.x = -swing * 0.8;
        this.leftArm.rotation.x = -swing * 0.7;
        this.rightArm.rotation.x = swing * 0.7;

        // Torso & head subtle bounce
        this.torsoGroup.position.y = 0.9 + Math.abs(swing) * 0.08;
        this.torsoGroup.rotation.y = swing * 0.08;
        this.mesh.scale.set(1, 1, 1);

        // Cape waving backwards
        this.capeMesh.rotation.x = 0.4 + Math.sin(this.runAnimTime * 1.8) * 0.25;
        break;
      }

      case CharacterState.JUMP: {
        // Arms up, knees tucked slightly
        this.leftLeg.rotation.x = 0.5;
        this.rightLeg.rotation.x = 0.3;
        this.leftArm.rotation.x = -1.6;
        this.rightArm.rotation.x = -1.6;
        this.capeMesh.rotation.x = 0.8;
        this.torsoGroup.position.y = 0.9;
        break;
      }

      case CharacterState.FALL: {
        // Descending pose
        this.leftLeg.rotation.x = -0.3;
        this.rightLeg.rotation.x = -0.2;
        this.leftArm.rotation.x = -0.8;
        this.rightArm.rotation.x = -0.8;
        this.capeMesh.rotation.x = 1.0;
        break;
      }

      case CharacterState.LAND: {
        // Squash on land
        this.mesh.scale.set(1.15, 0.85, 1.15);
        this.leftLeg.rotation.x = 0.2;
        this.rightLeg.rotation.x = 0.2;
        break;
      }

      case CharacterState.SLIDE: {
        // Crouching slide pose: scale Y halved, sliding forward
        this.mesh.scale.set(1.0, 0.5, 1.2);
        this.mesh.position.y = 0;
        this.leftLeg.rotation.x = 1.4;
        this.rightLeg.rotation.x = 1.2;
        this.leftArm.rotation.x = 1.0;
        this.rightArm.rotation.x = 1.0;
        this.capeMesh.rotation.x = 0.1;
        break;
      }

      case CharacterState.HIT: {
        // Flinching back
        this.mesh.rotation.x = -0.4;
        this.torsoGroup.rotation.y = 0.6;
        break;
      }

      case CharacterState.DIE: {
        // Fallen
        this.mesh.rotation.x = -Math.PI * 0.45;
        this.mesh.position.y = 0.1;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        break;
      }
    }
  }

  public reset(): void {
    this.currentLane = 0;
    this.targetLane = 0;
    this.isTransitioningLane = false;
    this.posY = 0;
    this.velocityY = 0;
    this.slideTimer = 0;
    this.state = CharacterState.RUN;
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.scale.set(1, 1, 1);
    this.hasShield = false;
    this.shieldBubble.visible = false;
    this.magnetTimeRemaining = 0;
  }
}
