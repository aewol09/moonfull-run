import * as THREE from 'three';
import { LANE_WIDTH } from '../entities/LunaCharacter';
import { TextureGenerator } from './TextureGenerator';

export interface SkinFXTheme {
  primaryColor: number;
  secondaryColor: number;
  highlightColor: number;
  primaryHex: string;
  secondaryHex: string;
  highlightHex: string;
}

export class SkillFXManager {
  public rootGroup: THREE.Group;

  // Active character & costume IDs
  public currentCharacterId = 'luna';
  public currentCostumeId = 'luna_default';

  // 1. Luna: Crescent Moonlight Slash Wave
  public slashWaveMesh: THREE.Mesh;
  private slashBladeMat: THREE.MeshBasicMaterial;
  private slashParticlePoints: THREE.Points;
  private slashParticlePositions: Float32Array;
  private slashParticleCount = 36;

  // 2. Stella: Astrological Magic Circle, Orbiting Satellites, Sky Meteor Shower
  private magicCircleMesh: THREE.Mesh;
  private magicCircleMat: THREE.MeshBasicMaterial;
  private orbitingGroup: THREE.Group;
  private orbitingObjects: THREE.Object3D[] = [];
  private meteorGroup: THREE.Group;
  private meteors: { mesh: THREE.Mesh; x: number; y: number; z: number; speed: number; length: number }[] = [];
  private transmuteBurstsGroup: THREE.Group;
  private activeTransmuteBursts: { mesh: THREE.Mesh; scale: number; maxScale: number; alpha: number }[] = [];

  // 3. Solaris: Solar Chariot Juggernaut, Vanguard Wings/Wheels, Fire Tread, Exhaust Jet
  private chariotGroup: THREE.Group;
  private vanguardShieldMesh: THREE.Mesh;
  private vanguardShieldMat: THREE.MeshBasicMaterial;
  private sideOrnamentsGroup: THREE.Group;
  private phoenixLeftWing?: THREE.Mesh;
  private phoenixRightWing?: THREE.Mesh;
  private solarWheels: THREE.Mesh[] = [];
  private obsidianPlates: THREE.Mesh[] = [];
  private groundTreadMesh: THREE.Mesh;
  private groundTreadMat: THREE.MeshBasicMaterial;
  private exhaustPoints: THREE.Points;
  private exhaustPositions: Float32Array;
  private exhaustCount = 48;
  private smashBurstsGroup: THREE.Group;
  private activeSmashBursts: { mesh: THREE.Mesh; scale: number; alpha: number }[] = [];

  // 4. Nyx: Spatial Rift, Intangible Phasing Aura, Trailing Afterimages, Matrix Grid
  private spatialRiftMesh: THREE.Mesh;
  private spatialRiftMat: THREE.MeshBasicMaterial;
  private phasingAuraGroup: THREE.Group;
  private cyberGridBox?: THREE.LineSegments;
  private phantomSmokeMesh?: THREE.Mesh;
  private bloodmoonMistMesh?: THREE.Mesh;
  private afterimagePlanes: THREE.Mesh[] = [];
  private afterimageMats: THREE.MeshBasicMaterial[] = [];
  private shadowPoints: THREE.Points;
  private shadowPositions: Float32Array;
  private shadowCount = 36;

  private fxClock = 0;

  constructor() {
    this.rootGroup = new THREE.Group();

    // ------------------------------------------------------------------------
    // 1. Luna's Crescent Slash Projectile Assembly
    // ------------------------------------------------------------------------
    const slashGeo = new THREE.PlaneGeometry(LANE_WIDTH * 3.4, 1.8);
    slashGeo.rotateX(-Math.PI * 0.38);
    this.slashBladeMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createCrescentSlashTexture('#38bdf8', '#e0f2fe', 'moon'),
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.slashWaveMesh = new THREE.Mesh(slashGeo, this.slashBladeMat);
    this.slashWaveMesh.visible = false;
    this.rootGroup.add(this.slashWaveMesh);

    // Stardust Sparkles Trailing Slash Wave
    this.slashParticlePositions = new Float32Array(this.slashParticleCount * 3);
    for (let i = 0; i < this.slashParticleCount; i++) {
      this.slashParticlePositions[i * 3 + 0] = (Math.random() - 0.5) * (LANE_WIDTH * 2.8);
      this.slashParticlePositions[i * 3 + 1] = Math.random() * 1.5;
      this.slashParticlePositions[i * 3 + 2] = Math.random() * 3.0;
    }
    const slashPartGeo = new THREE.BufferGeometry();
    slashPartGeo.setAttribute('position', new THREE.BufferAttribute(this.slashParticlePositions, 3));
    const slashPartMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.slashParticlePoints = new THREE.Points(slashPartGeo, slashPartMat);
    this.slashWaveMesh.add(this.slashParticlePoints);

    // ------------------------------------------------------------------------
    // 2. Stella's Astrological Magic Circle & Orbiting Satellites & Meteors
    // ------------------------------------------------------------------------
    const circleGeo = new THREE.PlaneGeometry(3.6, 3.6);
    circleGeo.rotateX(-Math.PI / 2);
    this.magicCircleMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createMagicCircleTexture('nebula', '#c084fc', '#e9d5ff'),
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.magicCircleMesh = new THREE.Mesh(circleGeo, this.magicCircleMat);
    this.magicCircleMesh.position.y = 0.03;
    this.magicCircleMesh.visible = false;
    this.rootGroup.add(this.magicCircleMesh);

    // Orbiting Satellites Group (around Stella's core)
    this.orbitingGroup = new THREE.Group();
    this.orbitingGroup.position.set(0, 1.05, 0);
    this.orbitingGroup.visible = false;
    this.rootGroup.add(this.orbitingGroup);

    // Sky Meteor Shower Group (ahead of Stella)
    this.meteorGroup = new THREE.Group();
    this.meteorGroup.visible = false;
    this.rootGroup.add(this.meteorGroup);

    // Pre-populate 12 streaming shooting stars
    for (let i = 0; i < 12; i++) {
      const cometGeo = new THREE.CylinderGeometry(0.04, 0.16, 2.2, 6);
      cometGeo.rotateX(Math.PI * 0.35); // Angled down-forward
      const cometMat = new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const cometMesh = new THREE.Mesh(cometGeo, cometMat);
      this.meteors.push({
        mesh: cometMesh,
        x: (Math.random() - 0.5) * (LANE_WIDTH * 2.8),
        y: 6.0 + Math.random() * 4.0,
        z: -8 - Math.random() * 26,
        speed: 28 + Math.random() * 12,
        length: 2.2
      });
      this.meteorGroup.add(cometMesh);
    }

    // Transmutation Burst Pool
    this.transmuteBurstsGroup = new THREE.Group();
    this.rootGroup.add(this.transmuteBurstsGroup);

    // ------------------------------------------------------------------------
    // 3. Solaris's Vanguard Solar Chariot & Flame Aura & Tread
    // ------------------------------------------------------------------------
    this.chariotGroup = new THREE.Group();
    this.chariotGroup.position.set(0, 1.05, 0);
    this.chariotGroup.visible = false;
    this.rootGroup.add(this.chariotGroup);

    // Vanguard Front Flame Shield
    const vShieldGeo = new THREE.PlaneGeometry(2.4, 2.4);
    this.vanguardShieldMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createAuraShieldTexture('sunfire', '#f59e0b', '#fbbf24'),
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.vanguardShieldMesh = new THREE.Mesh(vShieldGeo, this.vanguardShieldMat);
    this.vanguardShieldMesh.position.set(0, 0, -0.9);
    this.chariotGroup.add(this.vanguardShieldMesh);

    // Side Ornaments (Wings / Wheels / Magma plates)
    this.sideOrnamentsGroup = new THREE.Group();
    this.chariotGroup.add(this.sideOrnamentsGroup);

    // Ground Scorched Fire Tread
    const treadGeo = new THREE.PlaneGeometry(2.4, 5.5);
    treadGeo.rotateX(-Math.PI / 2);
    this.groundTreadMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createAuraShieldTexture('sunfire', '#f59e0b', '#ef4444'),
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.groundTreadMesh = new THREE.Mesh(treadGeo, this.groundTreadMat);
    this.groundTreadMesh.position.set(0, 0.02, 1.2);
    this.groundTreadMesh.visible = false;
    this.rootGroup.add(this.groundTreadMesh);

    // Fiery Jet Exhaust Spark Stream
    this.exhaustPositions = new Float32Array(this.exhaustCount * 3);
    for (let i = 0; i < this.exhaustCount; i++) {
      this.exhaustPositions[i * 3 + 0] = (Math.random() - 0.5) * 1.6;
      this.exhaustPositions[i * 3 + 1] = Math.random() * 1.4;
      this.exhaustPositions[i * 3 + 2] = Math.random() * 4.0;
    }
    const exhaustGeo = new THREE.BufferGeometry();
    exhaustGeo.setAttribute('position', new THREE.BufferAttribute(this.exhaustPositions, 3));
    const exhaustMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.25,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.exhaustPoints = new THREE.Points(exhaustGeo, exhaustMat);
    this.chariotGroup.add(this.exhaustPoints);

    // Smash Bursts Pool
    this.smashBurstsGroup = new THREE.Group();
    this.rootGroup.add(this.smashBurstsGroup);

    // ------------------------------------------------------------------------
    // 4. Nyx's Shadow Shift Spatial Rift & Phasing Aura & Afterimages
    // ------------------------------------------------------------------------
    const riftGeo = new THREE.PlaneGeometry(3.4, 3.4);
    riftGeo.rotateX(-Math.PI / 2);
    this.spatialRiftMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createShadowRiftTexture('phantom', '#06b6d4', '#0f172a'),
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.spatialRiftMesh = new THREE.Mesh(riftGeo, this.spatialRiftMat);
    this.spatialRiftMesh.position.y = 0.02;
    this.spatialRiftMesh.visible = false;
    this.rootGroup.add(this.spatialRiftMesh);

    // Intangible Phasing Aura Group
    this.phasingAuraGroup = new THREE.Group();
    this.phasingAuraGroup.position.set(0, 1.05, 0);
    this.phasingAuraGroup.visible = false;
    this.rootGroup.add(this.phasingAuraGroup);

    // Trailing Shadow Afterimage Ghost Quad Planes
    for (let i = 0; i < 2; i++) {
      const aiGeo = new THREE.PlaneGeometry(1.5, 2.1);
      aiGeo.translate(0, 1.05, 0);
      const aiMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.45 - i * 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const aiMesh = new THREE.Mesh(aiGeo, aiMat);
      aiMesh.visible = false;
      this.afterimagePlanes.push(aiMesh);
      this.afterimageMats.push(aiMat);
      this.rootGroup.add(aiMesh);
    }

    // Shadow Mist / Cyber Particle Stream
    this.shadowPositions = new Float32Array(this.shadowCount * 3);
    for (let i = 0; i < this.shadowCount; i++) {
      this.shadowPositions[i * 3 + 0] = (Math.random() - 0.5) * 2.0;
      this.shadowPositions[i * 3 + 1] = Math.random() * 2.2;
      this.shadowPositions[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }
    const shadowGeo = new THREE.BufferGeometry();
    shadowGeo.setAttribute('position', new THREE.BufferAttribute(this.shadowPositions, 3));
    const shadowMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.22,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.shadowPoints = new THREE.Points(shadowGeo, shadowMat);
    this.phasingAuraGroup.add(this.shadowPoints);

    // Build initial costume theme
    this.setTheme('luna', 'luna_default');
  }

  /**
   * Applies skin-specific visual themes to all skill effects.
   */
  public setTheme(characterId: string, costumeId: string): void {
    this.currentCharacterId = characterId;
    this.currentCostumeId = costumeId;

    if (characterId === 'luna') {
      this.setupLunaTheme(costumeId);
    } else if (characterId === 'stella') {
      this.setupStellaTheme(costumeId);
    } else if (characterId === 'solaris') {
      this.setupSolarisTheme(costumeId);
    } else if (characterId === 'nyx') {
      this.setupNyxTheme(costumeId);
    }
  }

  // --- Theme Setup Implementations ---

  private setupLunaTheme(costumeId: string): void {
    let slashColorHex = '#38bdf8';
    let coreColorHex = '#e0f2fe';
    let runeType: 'moon' | 'star' | 'sun' = 'moon';
    let particleColor = 0x38bdf8;

    if (costumeId === 'luna_guardian') {
      slashColorHex = '#a855f7';
      coreColorHex = '#f5d0fe';
      runeType = 'star';
      particleColor = 0xc084fc;
    } else if (costumeId === 'luna_dawn') {
      slashColorHex = '#f59e0b';
      coreColorHex = '#fef08a';
      runeType = 'sun';
      particleColor = 0xfbbf24;
    }

    this.slashBladeMat.map = TextureGenerator.createCrescentSlashTexture(slashColorHex, coreColorHex, runeType);
    this.slashBladeMat.needsUpdate = true;
    (this.slashParticlePoints.material as THREE.PointsMaterial).color.setHex(particleColor);
  }

  private setupStellaTheme(costumeId: string): void {
    // Clear old orbiting objects
    while (this.orbitingObjects.length > 0) {
      const obj = this.orbitingObjects.pop()!;
      this.orbitingGroup.remove(obj);
    }

    let circleType: 'nebula' | 'zodiac' | 'chronos' = 'nebula';
    let pColor = '#c084fc';
    let sColor = '#e9d5ff';
    let cometColor = 0xc084fc;

    if (costumeId === 'stella_archmage') {
      circleType = 'zodiac';
      pColor = '#f59e0b';
      sColor = '#6366f1';
      cometColor = 0xfbbf24;

      // 4 Golden Zodiac Astrolabe Gyro Rings
      for (let r = 0; r < 4; r++) {
        const ringGeo = new THREE.TorusGeometry(1.15 + r * 0.12, 0.025, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: r % 2 === 0 ? 0xfbbf24 : 0x818cf8,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.set((r * Math.PI) / 4, (r * Math.PI) / 3, 0);
        this.orbitingGroup.add(ring);
        this.orbitingObjects.push(ring);
      }
    } else if (costumeId === 'stella_chronos') {
      circleType = 'chronos';
      pColor = '#10b981';
      sColor = '#fbbf24';
      cometColor = 0x34d399;

      // 3 Emerald & Gold Chronos Time Gears
      for (let g = 0; g < 3; g++) {
        const gearGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 12);
        gearGeo.rotateX(Math.PI / 2);
        const gearMat = new THREE.MeshBasicMaterial({
          color: g % 2 === 0 ? 0x10b981 : 0xfbbf24,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending
        });
        const gear = new THREE.Mesh(gearGeo, gearMat);
        const angle = (g * Math.PI * 2) / 3;
        gear.position.set(Math.cos(angle) * 1.35, 0, Math.sin(angle) * 1.35);
        this.orbitingGroup.add(gear);
        this.orbitingObjects.push(gear);
      }
    } else {
      // Default: 3 Orbiting Lavender Star Crystals
      for (let c = 0; c < 3; c++) {
        const crystalGeo = new THREE.OctahedronGeometry(0.18, 0);
        const crystalMat = new THREE.MeshBasicMaterial({
          color: 0xc084fc,
          transparent: true,
          opacity: 0.92,
          blending: THREE.AdditiveBlending
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        const angle = (c * Math.PI * 2) / 3;
        crystal.position.set(Math.cos(angle) * 1.25, 0, Math.sin(angle) * 1.25);
        this.orbitingGroup.add(crystal);
        this.orbitingObjects.push(crystal);
      }
    }

    this.magicCircleMat.map = TextureGenerator.createMagicCircleTexture(circleType, pColor, sColor);
    this.magicCircleMat.needsUpdate = true;

    // Update meteors color
    for (const m of this.meteors) {
      (m.mesh.material as THREE.MeshBasicMaterial).color.setHex(cometColor);
    }
  }

  private setupSolarisTheme(costumeId: string): void {
    // Clear old side ornaments
    while (this.sideOrnamentsGroup.children.length > 0) {
      this.sideOrnamentsGroup.remove(this.sideOrnamentsGroup.children[0]);
    }
    this.solarWheels = [];
    this.obsidianPlates = [];
    this.phoenixLeftWing = undefined;
    this.phoenixRightWing = undefined;

    let auraType: 'sunfire' | 'magma' | 'phoenix' = 'sunfire';
    let pColor = '#f59e0b';
    let sColor = '#fbbf24';
    let exhaustHex = 0xf59e0b;

    if (costumeId === 'solaris_obsidian') {
      auraType = 'magma';
      pColor = '#ef4444';
      sColor = '#7f1d1d';
      exhaustHex = 0xef4444;

      // 4 Floating Magma Obsidian Armor Plates
      for (let p = 0; p < 4; p++) {
        const plateGeo = new THREE.BoxGeometry(0.2, 0.6, 0.4);
        const plateMat = new THREE.MeshBasicMaterial({
          color: p % 2 === 0 ? 0xef4444 : 0x1c1917,
          wireframe: p % 2 !== 0
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        const side = p < 2 ? -1.15 : 1.15;
        const offsetZ = (p % 2) * 0.6 - 0.3;
        plate.position.set(side, -0.2, offsetZ);
        this.sideOrnamentsGroup.add(plate);
        this.obsidianPlates.push(plate);
      }
    } else if (costumeId === 'solaris_phoenix') {
      auraType = 'phoenix';
      pColor = '#ff0055';
      sColor = '#ffaa00';
      exhaustHex = 0xff3300;

      // Majestic Blazing Vermilion Phoenix Wings
      const wingGeoLeft = new THREE.PlaneGeometry(1.8, 1.2);
      wingGeoLeft.translate(-0.9, 0, 0); // Origin at hero shoulder
      const wingMat = new THREE.MeshBasicMaterial({
        map: TextureGenerator.createAuraShieldTexture('phoenix', '#ff0055', '#ffcc00'),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      this.phoenixLeftWing = new THREE.Mesh(wingGeoLeft, wingMat);
      this.phoenixLeftWing.position.set(-0.6, 0.2, 0);
      this.sideOrnamentsGroup.add(this.phoenixLeftWing);

      const wingGeoRight = new THREE.PlaneGeometry(1.8, 1.2);
      wingGeoRight.translate(0.9, 0, 0);
      this.phoenixRightWing = new THREE.Mesh(wingGeoRight, wingMat);
      this.phoenixRightWing.position.set(0.6, 0.2, 0);
      this.sideOrnamentsGroup.add(this.phoenixRightWing);
    } else {
      // Default: Dual Spinning Solar Flame Wheels
      for (let w = 0; w < 2; w++) {
        const wheelGeo = new THREE.TorusGeometry(0.42, 0.08, 8, 16);
        const wheelMat = new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending
        });
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        const side = w === 0 ? -0.95 : 0.95;
        wheel.position.set(side, -0.65, 0);
        this.sideOrnamentsGroup.add(wheel);
        this.solarWheels.push(wheel);
      }
    }

    this.vanguardShieldMat.map = TextureGenerator.createAuraShieldTexture(auraType, pColor, sColor);
    this.vanguardShieldMat.needsUpdate = true;
    this.groundTreadMat.map = TextureGenerator.createAuraShieldTexture(auraType, pColor, sColor);
    this.groundTreadMat.needsUpdate = true;
    (this.exhaustPoints.material as THREE.PointsMaterial).color.setHex(exhaustHex);
  }

  private setupNyxTheme(costumeId: string): void {
    // Clear old phasing aura contents
    while (this.phasingAuraGroup.children.length > 0) {
      this.phasingAuraGroup.remove(this.phasingAuraGroup.children[0]);
    }
    // Re-add shadow points
    this.phasingAuraGroup.add(this.shadowPoints);

    let riftType: 'phantom' | 'cyber' | 'bloodmoon' = 'phantom';
    let pColor = '#06b6d4';
    let sColor = '#0f172a';
    let auraHex = 0x06b6d4;

    if (costumeId === 'nyx_cyber') {
      riftType = 'cyber';
      pColor = '#00ffcc';
      sColor = '#39ff14';
      auraHex = 0x00ffcc;

      // 3D Digital Holographic Wireframe Grid Box
      const boxGeo = new THREE.BoxGeometry(1.7, 2.3, 1.4);
      const wireGeo = new THREE.WireframeGeometry(boxGeo);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
      });
      this.cyberGridBox = new THREE.LineSegments(wireGeo, wireMat);
      this.phasingAuraGroup.add(this.cyberGridBox);
    } else if (costumeId === 'nyx_bloodmoon') {
      riftType = 'bloodmoon';
      pColor = '#dc2626';
      sColor = '#7f1d1d';
      auraHex = 0xdc2626;

      // Blood-moon swirling eclipse ring
      const mistGeo = new THREE.TorusGeometry(1.1, 0.08, 12, 32);
      mistGeo.rotateX(Math.PI * 0.35);
      const mistMat = new THREE.MeshBasicMaterial({
        color: 0xdc2626,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      this.bloodmoonMistMesh = new THREE.Mesh(mistGeo, mistMat);
      this.phasingAuraGroup.add(this.bloodmoonMistMesh);
    } else {
      // Default: Midnight Cyan Phantom Shadow Ring
      const ringGeo = new THREE.TorusGeometry(1.05, 0.08, 12, 32);
      ringGeo.rotateX(Math.PI * 0.38);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      this.phantomSmokeMesh = new THREE.Mesh(ringGeo, ringMat);
      this.phasingAuraGroup.add(this.phantomSmokeMesh);
    }

    this.spatialRiftMat.map = TextureGenerator.createShadowRiftTexture(riftType, pColor, sColor);
    this.spatialRiftMat.needsUpdate = true;

    // Afterimage colors
    for (const mat of this.afterimageMats) {
      mat.color.setHex(auraHex);
    }
    (this.shadowPoints.material as THREE.PointsMaterial).color.setHex(auraHex);
  }

  /**
   * Triggers visual FX initialization when a character activates their skill.
   */
  public triggerSkill(characterId: string, costumeId: string): void {
    this.setTheme(characterId, costumeId);

    if (characterId === 'luna') {
      this.slashWaveMesh.visible = true;
      this.slashWaveMesh.position.set(0, 0.8, -1.0);
    } else if (characterId === 'stella') {
      this.magicCircleMesh.visible = true;
      this.orbitingGroup.visible = true;
      this.meteorGroup.visible = true;
    } else if (characterId === 'solaris') {
      this.chariotGroup.visible = true;
      this.groundTreadMesh.visible = true;
    } else if (characterId === 'nyx') {
      this.spatialRiftMesh.visible = true;
      this.phasingAuraGroup.visible = true;
      this.afterimagePlanes.forEach(ai => (ai.visible = true));
    }
  }

  /**
   * Spawns an expanding starlight burst when Stella transmutes an obstacle.
   */
  public triggerTransmuteBurst(x: number, z: number): void {
    const burstGeo = new THREE.RingGeometry(0.3, 0.9, 24);
    burstGeo.rotateX(-Math.PI / 2);
    const burstMat = new THREE.MeshBasicMaterial({
      color: this.currentCostumeId.includes('chronos') ? 0x10b981 : (this.currentCostumeId.includes('archmage') ? 0xfbbf24 : 0xc084fc),
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const burstMesh = new THREE.Mesh(burstGeo, burstMat);
    burstMesh.position.set(x, 0.4, z);
    this.transmuteBurstsGroup.add(burstMesh);
    this.activeTransmuteBursts.push({
      mesh: burstMesh,
      scale: 0.5,
      maxScale: 3.5,
      alpha: 1.0
    });
  }

  /**
   * Spawns an explosive radial flame burst when Solaris smashes through an obstacle.
   */
  public triggerSmashBurst(x: number, z: number): void {
    const smashGeo = new THREE.SphereGeometry(1.2, 12, 10);
    const smashMat = new THREE.MeshBasicMaterial({
      color: this.currentCostumeId.includes('obsidian') ? 0xef4444 : (this.currentCostumeId.includes('phoenix') ? 0xff0055 : 0xfbbf24),
      transparent: true,
      opacity: 0.85,
      wireframe: true,
      blending: THREE.AdditiveBlending
    });
    const smashMesh = new THREE.Mesh(smashGeo, smashMat);
    smashMesh.position.set(x, 0.8, z);
    this.smashBurstsGroup.add(smashMesh);
    this.activeSmashBursts.push({
      mesh: smashMesh,
      scale: 0.6,
      alpha: 1.0
    });
  }

  /**
   * Update loop for all dynamic skill particle systems and meshes.
   */
  public update(
    dt: number,
    isSkillActive: boolean,
    playerPos: THREE.Vector3,
    isSlashWaveActive: boolean,
    spriteMesh?: THREE.Mesh
  ): void {
    this.fxClock += dt;
    const time = this.fxClock;

    // 1. Luna: Update Crescent Slash Projectile & Particles
    if (isSlashWaveActive && this.slashWaveMesh.visible) {
      // Swirling stardust particles trailing the blade
      const posAttr = this.slashParticlePoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < this.slashParticleCount; i++) {
        arr[i * 3 + 2] += dt * 14.0; // drift back
        if (arr[i * 3 + 2] > 4.5) {
          arr[i * 3 + 0] = (Math.random() - 0.5) * (LANE_WIDTH * 2.8);
          arr[i * 3 + 1] = Math.random() * 1.5;
          arr[i * 3 + 2] = -0.5;
        }
      }
      posAttr.needsUpdate = true;
    } else {
      this.slashWaveMesh.visible = false;
    }

    // 2. Stella: Magic Circle Rotation, Orbiting Satellites, Meteors
    if (this.currentCharacterId === 'stella' && isSkillActive) {
      this.magicCircleMesh.visible = true;
      this.magicCircleMesh.rotation.z += dt * 1.4; // Rotates along ground
      this.magicCircleMat.opacity = 0.75 + Math.sin(time * 6) * 0.2;

      this.orbitingGroup.visible = true;
      this.orbitingGroup.rotation.y += dt * 2.5;

      // Animate satellites
      for (let i = 0; i < this.orbitingObjects.length; i++) {
        const obj = this.orbitingObjects[i];
        obj.rotation.x += dt * 2.0;
        obj.rotation.z += dt * 1.5;
        obj.position.y = Math.sin(time * 4 + i) * 0.18;
      }

      // Animate streaming sky meteors raining down
      this.meteorGroup.visible = true;
      for (const m of this.meteors) {
        m.y -= m.speed * dt * 0.6;
        m.z += m.speed * dt * 0.8; // Falling forward-down
        if (m.y < 0.2 || m.z > playerPos.z + 5) {
          // Reset to sky
          m.y = 7.0 + Math.random() * 4.0;
          m.z = playerPos.z - 15 - Math.random() * 25;
          m.x = playerPos.x + (Math.random() - 0.5) * (LANE_WIDTH * 2.8);
        }
        m.mesh.position.set(m.x - playerPos.x, m.y, m.z - playerPos.z);
      }
    } else {
      this.magicCircleMesh.visible = false;
      this.orbitingGroup.visible = false;
      this.meteorGroup.visible = false;
    }

    // Animate Transmute Bursts
    for (let i = this.activeTransmuteBursts.length - 1; i >= 0; i--) {
      const b = this.activeTransmuteBursts[i];
      b.scale += dt * 6.5;
      b.alpha -= dt * 2.0;
      b.mesh.scale.set(b.scale, b.scale, b.scale);
      (b.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, b.alpha);
      if (b.alpha <= 0 || b.scale >= b.maxScale) {
        this.transmuteBurstsGroup.remove(b.mesh);
        this.activeTransmuteBursts.splice(i, 1);
      }
    }

    // 3. Solaris: Flame Vanguard Shield, Wings Flapping, Tread, Exhaust Jet
    if (this.currentCharacterId === 'solaris' && isSkillActive) {
      this.chariotGroup.visible = true;
      this.groundTreadMesh.visible = true;

      // Pulse front shield
      const pulse = 1.0 + Math.sin(time * 12) * 0.08;
      this.vanguardShieldMesh.scale.set(pulse, pulse, 1);

      // Flap phoenix wings
      if (this.phoenixLeftWing && this.phoenixRightWing) {
        const flap = Math.sin(time * 14) * 0.35;
        this.phoenixLeftWing.rotation.y = flap;
        this.phoenixRightWing.rotation.y = -flap;
      }

      // Spin solar wheels
      for (const w of this.solarWheels) {
        w.rotation.x -= dt * 18.0;
      }

      // Rotate obsidian magma plates
      for (let p = 0; p < this.obsidianPlates.length; p++) {
        const plate = this.obsidianPlates[p];
        plate.rotation.y += dt * (p % 2 === 0 ? 3.0 : -3.0);
        plate.position.y = -0.2 + Math.sin(time * 8 + p) * 0.12;
      }

      // Animate ground tread offset
      this.groundTreadMat.opacity = 0.65 + Math.sin(time * 10) * 0.2;

      // Exhaust jet spark stream
      const exAttr = this.exhaustPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const exArr = exAttr.array as Float32Array;
      for (let i = 0; i < this.exhaustCount; i++) {
        exArr[i * 3 + 2] += dt * 22.0; // Shoot backward
        if (exArr[i * 3 + 2] > 5.5) {
          exArr[i * 3 + 0] = (Math.random() - 0.5) * 1.4;
          exArr[i * 3 + 1] = Math.random() * 1.2;
          exArr[i * 3 + 2] = -0.3;
        }
      }
      exAttr.needsUpdate = true;
    } else {
      this.chariotGroup.visible = false;
      this.groundTreadMesh.visible = false;
    }

    // Animate Smash Bursts
    for (let i = this.activeSmashBursts.length - 1; i >= 0; i--) {
      const b = this.activeSmashBursts[i];
      b.scale += dt * 8.0;
      b.alpha -= dt * 2.2;
      b.mesh.scale.set(b.scale, b.scale, b.scale);
      (b.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, b.alpha);
      if (b.alpha <= 0) {
        this.smashBurstsGroup.remove(b.mesh);
        this.activeSmashBursts.splice(i, 1);
      }
    }

    // 4. Nyx: Spatial Rift, Phasing Shimmer, Trailing Afterimages
    if (this.currentCharacterId === 'nyx' && isSkillActive) {
      this.spatialRiftMesh.visible = true;
      this.spatialRiftMesh.rotation.z += dt * 1.8;
      this.phasingAuraGroup.visible = true;

      // Rotate Cyber Grid Box if present
      if (this.cyberGridBox) {
        this.cyberGridBox.rotation.y += dt * 2.2;
        this.cyberGridBox.rotation.x = Math.sin(time * 3) * 0.15;
      }

      // Rotate Bloodmoon / Phantom mist
      if (this.bloodmoonMistMesh) {
        this.bloodmoonMistMesh.rotation.z += dt * 2.5;
      }
      if (this.phantomSmokeMesh) {
        this.phantomSmokeMesh.rotation.y += dt * 1.8;
      }

      // Update Afterimages trailing behind (clone the hero's running sprite silhouette!)
      if (spriteMesh && spriteMesh.material instanceof THREE.MeshBasicMaterial && spriteMesh.material.map) {
        for (let i = 0; i < this.afterimageMats.length; i++) {
          const mat = this.afterimageMats[i];
          if (mat.map !== spriteMesh.material.map) {
            mat.map = spriteMesh.material.map;
            mat.alphaTest = 0.08;
            mat.needsUpdate = true;
          }
        }
      }

      for (let i = 0; i < this.afterimagePlanes.length; i++) {
        const ai = this.afterimagePlanes[i];
        ai.visible = true;
        const delayZ = (i + 1) * 0.95;
        ai.position.set(0, 0, delayZ);
        this.afterimageMats[i].opacity = 0.50 - i * 0.20 + Math.sin(time * 8 + i) * 0.08;
      }

      // Shimmer character sprite opacity to indicate intangible ghost state!
      if (spriteMesh && spriteMesh.material instanceof THREE.MeshBasicMaterial) {
        spriteMesh.material.opacity = 0.55 + Math.sin(time * 12) * 0.25;
      }
    } else {
      this.spatialRiftMesh.visible = false;
      this.phasingAuraGroup.visible = false;
      this.afterimagePlanes.forEach(ai => (ai.visible = false));
      if (spriteMesh && spriteMesh.material instanceof THREE.MeshBasicMaterial) {
        spriteMesh.material.opacity = 1.0;
      }
    }
  }

  public reset(): void {
    this.slashWaveMesh.visible = false;
    this.magicCircleMesh.visible = false;
    this.orbitingGroup.visible = false;
    this.meteorGroup.visible = false;
    this.chariotGroup.visible = false;
    this.groundTreadMesh.visible = false;
    this.spatialRiftMesh.visible = false;
    this.phasingAuraGroup.visible = false;
    this.afterimagePlanes.forEach(ai => (ai.visible = false));

    while (this.activeTransmuteBursts.length > 0) {
      const b = this.activeTransmuteBursts.pop()!;
      this.transmuteBurstsGroup.remove(b.mesh);
    }
    while (this.activeSmashBursts.length > 0) {
      const b = this.activeSmashBursts.pop()!;
      this.smashBurstsGroup.remove(b.mesh);
    }
  }
}
