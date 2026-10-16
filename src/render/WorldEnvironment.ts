import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';
import { AssetLoader } from './AssetLoader';

export class WorldEnvironment {
  private scene: THREE.Scene;
  private moonMesh: THREE.Mesh;
  private horizonMesh: THREE.Mesh;
  private horizonMat: THREE.MeshBasicMaterial;
  private cloudSeaMesh: THREE.Mesh;
  private cloudSeaMat: THREE.MeshBasicMaterial;
  private islandsGroup: THREE.Group;
  private starsPoints: THREE.Points;
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private haloMat: THREE.MeshBasicMaterial;
  private outerHaloMat: THREE.MeshBasicMaterial;
  private crystalMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0x1a243b, 1.2);
    this.scene.add(this.ambientLight);

    this.crystalMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    this.dirLight = new THREE.DirectionalLight(0xdbeafe, 1.8);
    this.dirLight.position.set(15, 30, -20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    const shadowD = 20;
    this.dirLight.shadow.camera.left = -shadowD;
    this.dirLight.shadow.camera.right = shadowD;
    this.dirLight.shadow.camera.top = shadowD;
    this.dirLight.shadow.camera.bottom = -shadowD;
    this.scene.add(this.dirLight);

    // 2. 360-Degree Curved Cylindrical Panoramic Backdrop
    // Wraps completely around the runner and camera field of view
    const cylinderGeo = new THREE.CylinderGeometry(240, 240, 260, 64, 1, true);
    this.horizonMat = new THREE.MeshBasicMaterial({
      map: AssetLoader.loadTexture('/assets/bg_stage1.png'),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    this.horizonMesh = new THREE.Mesh(cylinderGeo, this.horizonMat);
    this.horizonMesh.position.set(0, 42, -30);
    this.scene.add(this.horizonMesh);

    // 3. Vast Atmospheric Sea of Clouds Floor (fills the lower left & right abyss completely)
    const seaGeo = new THREE.PlaneGeometry(550, 550);
    seaGeo.rotateX(-Math.PI / 2);
    this.cloudSeaMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createCloudSeaTexture(1),
      depthWrite: false,
      fog: false
    });
    this.cloudSeaMesh = new THREE.Mesh(seaGeo, this.cloudSeaMat);
    this.cloudSeaMesh.position.set(0, -6.5, -30);
    this.scene.add(this.cloudSeaMesh);

    // 4. Glowing Celestial Moon on Horizon with Crater Surface Map
    const moonGeo = new THREE.SphereGeometry(11, 32, 32);
    const moonTex = TextureGenerator.createMoonTexture();
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTex,
      color: 0xf8fafc,
      fog: false
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(38, 34, -200);
    this.scene.add(this.moonMesh);

    // Inner Moon Rim Glow
    const haloGeo = new THREE.SphereGeometry(12.5, 32, 32);
    this.haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide,
      fog: false
    });
    const haloMesh = new THREE.Mesh(haloGeo, this.haloMat);
    this.moonMesh.add(haloMesh);

    // Outer Ethereal Atmosphere Aura
    const outerHaloGeo = new THREE.SphereGeometry(14.8, 32, 32);
    this.outerHaloMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      fog: false
    });
    const outerHaloMesh = new THREE.Mesh(outerHaloGeo, this.outerHaloMat);
    this.moonMesh.add(outerHaloMesh);

    // 4. Celestial Starfield
    const starsCount = 450;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 320;
      starPositions[i * 3 + 1] = Math.random() * 95 + 10;
      starPositions[i * 3 + 2] = -Math.random() * 260 - 20;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 1.2,
      transparent: true,
      opacity: 0.85,
      fog: false
    });
    this.starsPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starsPoints);

    // 5. Clean Scenic Panorama Horizon (Floating round islands removed for unobstructed vista)
    this.islandsGroup = new THREE.Group();
  }

  private createFloatingIslands(): void {
    // Left empty: round floating cylinder islands removed to keep scenic panoramas clear and immersive
  }

  public setBiome(stage: number): void {
    const clampedStage = Math.max(1, Math.min(10, Math.floor(stage)));
    
    // Swap 360-degree panoramic cylindrical backdrop
    const texPath = `/assets/bg_stage${clampedStage}.png`;
    this.horizonMat.map = AssetLoader.loadTexture(texPath);
    this.horizonMat.needsUpdate = true;

    // Swap atmospheric sea of clouds texture for the new biome
    this.cloudSeaMat.map = TextureGenerator.createCloudSeaTexture(clampedStage);
    this.cloudSeaMat.needsUpdate = true;

    // Apply color harmonies for each of the 10 stages
    switch (clampedStage) {
      case 2: // 별빛 안개 숲
        this.scene.background = new THREE.Color(0x041a14);
        this.updateFog(0x06241c);
        this.ambientLight.color.setHex(0x064e3b);
        this.dirLight.color.setHex(0xa7f3d0);
        this.haloMat.color.setHex(0x34d399);
        this.outerHaloMat.color.setHex(0x10b981);
        this.crystalMat.color.setHex(0x10b981);
        break;

      case 3: // 보랏빛 성역
        this.scene.background = new THREE.Color(0x0f0a1c);
        this.updateFog(0x130a24);
        this.ambientLight.color.setHex(0x2e1065);
        this.dirLight.color.setHex(0xe9d5ff);
        this.haloMat.color.setHex(0xc084fc);
        this.outerHaloMat.color.setHex(0xa855f7);
        this.crystalMat.color.setHex(0xc084fc);
        break;

      case 4: // 비취석 협곡
        this.scene.background = new THREE.Color(0x04161f);
        this.updateFog(0x082330);
        this.ambientLight.color.setHex(0x0e7490);
        this.dirLight.color.setHex(0x67e8f9);
        this.haloMat.color.setHex(0x06b6d4);
        this.outerHaloMat.color.setHex(0x0891b2);
        this.crystalMat.color.setHex(0x22d3ee);
        break;

      case 5: // 황혼의 고대 신전
        this.scene.background = new THREE.Color(0x1f0b18);
        this.updateFog(0x280e1f);
        this.ambientLight.color.setHex(0x701a75);
        this.dirLight.color.setHex(0xf472b6);
        this.haloMat.color.setHex(0xf43f5e);
        this.outerHaloMat.color.setHex(0xdb2777);
        this.crystalMat.color.setHex(0xf472b6);
        break;

      case 6: // 붉은 달의 회랑
        this.scene.background = new THREE.Color(0x1c0606);
        this.updateFog(0x260909);
        this.ambientLight.color.setHex(0x7f1d1d);
        this.dirLight.color.setHex(0xfca5a5);
        this.haloMat.color.setHex(0xef4444);
        this.outerHaloMat.color.setHex(0xb91c1c);
        this.crystalMat.color.setHex(0xef4444);
        break;

      case 7: // 얼어붙은 별의 빙하
        this.scene.background = new THREE.Color(0x081326);
        this.updateFog(0x0b1a33);
        this.ambientLight.color.setHex(0x1e3a8a);
        this.dirLight.color.setHex(0xbae6fd);
        this.haloMat.color.setHex(0x38bdf8);
        this.outerHaloMat.color.setHex(0x93c5fd);
        this.crystalMat.color.setHex(0x67e8f9);
        break;

      case 8: // 태양의 일식 신전
        this.scene.background = new THREE.Color(0x1c0d02);
        this.updateFog(0x241103);
        this.ambientLight.color.setHex(0x451a03);
        this.dirLight.color.setHex(0xfef08a);
        this.haloMat.color.setHex(0xfbbf24);
        this.outerHaloMat.color.setHex(0xf97316);
        this.crystalMat.color.setHex(0xfbbf24);
        break;

      case 9: // 공허의 심연 제단
        this.scene.background = new THREE.Color(0x0d031c);
        this.updateFog(0x14052b);
        this.ambientLight.color.setHex(0x3b0764);
        this.dirLight.color.setHex(0xd8b4fe);
        this.haloMat.color.setHex(0xa855f7);
        this.outerHaloMat.color.setHex(0xec4899);
        this.crystalMat.color.setHex(0xc084fc);
        break;

      case 10: // 끝없는 별빛의 시련 (무한 카오스)
        this.scene.background = new THREE.Color(0x020617);
        this.updateFog(0x050c26);
        this.ambientLight.color.setHex(0x312e81);
        this.dirLight.color.setHex(0xffffff);
        this.haloMat.color.setHex(0x38bdf8);
        this.outerHaloMat.color.setHex(0xf43f5e);
        this.crystalMat.color.setHex(0xec4899);
        break;

      case 1:
      default: // 달빛 유적지
        this.scene.background = new THREE.Color(0x060914);
        this.updateFog(0x070b18);
        this.ambientLight.color.setHex(0x1a243b);
        this.dirLight.color.setHex(0xdbeafe);
        this.haloMat.color.setHex(0x38bdf8);
        this.outerHaloMat.color.setHex(0x818cf8);
        this.crystalMat.color.setHex(0x38bdf8);
        break;
    }
  }

  private updateFog(colorHex: number): void {
    if (this.scene.fog && 'color' in this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.setHex(colorHex);
    }
  }

  public update(playerZ: number, dt: number): void {
    // Keep 360-degree cylindrical backdrop and atmospheric sea of clouds centered with runner
    this.horizonMesh.position.z = playerZ - 30;
    this.cloudSeaMesh.position.z = playerZ - 30;
    if (this.cloudSeaMat.map) {
      this.cloudSeaMat.map.offset.y += dt * 0.05;
    }

    this.moonMesh.position.z = playerZ - 200;
    this.starsPoints.position.z = playerZ;
    this.dirLight.position.z = playerZ - 20;
    this.dirLight.target.position.set(0, 0, playerZ);
    this.dirLight.target.updateMatrixWorld();

    // Floating islands slow bobbing & recycled wrapping
    this.islandsGroup.children.forEach((island, idx) => {
      island.position.y += Math.sin(Date.now() * 0.001 + idx) * (dt * 0.4);
      if (island.position.z > playerZ + 40) {
        island.position.z -= 14 * 26;
      }
    });
  }

  /**
   * Rotates panoramic 360 backdrop and celestial moon by 90 degrees around center
   * to seamlessly match camera yaw rotation during Temple Run corner completion.
   */
  public rotateHorizon(dirSign: number): void {
    const angle = dirSign * (Math.PI / 2);
    this.horizonMesh.rotation.y += angle;
    const mx = this.moonMesh.position.x;
    const mz = this.moonMesh.position.z;
    this.moonMesh.position.x = mx * Math.cos(angle) - mz * Math.sin(angle);
    this.moonMesh.position.z = mx * Math.sin(angle) + mz * Math.cos(angle);
  }
}

