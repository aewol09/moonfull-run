import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export class WorldEnvironment {
  private scene: THREE.Scene;
  private moonMesh: THREE.Mesh;
  private islandsGroup: THREE.Group;
  private starsPoints: THREE.Points;
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0x1a243b, 1.2);
    this.scene.add(this.ambientLight);

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

    // 2. Giant Glowing Celestial Moon with Crater Surface Map
    const moonGeo = new THREE.SphereGeometry(18, 32, 32);
    const moonTex = TextureGenerator.createMoonTexture();
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTex,
      color: 0xffffff
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(25, 45, -160);
    this.scene.add(this.moonMesh);

    // Inner Moon Rim Glow
    const haloGeo = new THREE.SphereGeometry(20, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.moonMesh.add(haloMesh);

    // Outer Ethereal Atmosphere Aura
    const outerHaloGeo = new THREE.SphereGeometry(23.5, 32, 32);
    const outerHaloMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const outerHaloMesh = new THREE.Mesh(outerHaloGeo, outerHaloMat);
    this.moonMesh.add(outerHaloMesh);

    // 3. Celestial Starfield
    const starsCount = 400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 300;
      starPositions[i * 3 + 1] = Math.random() * 90 + 10;
      starPositions[i * 3 + 2] = -Math.random() * 260 - 20;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 1.2,
      transparent: true,
      opacity: 0.8
    });
    this.starsPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starsPoints);

    // 4. Floating Fantasy Islands in Background
    this.islandsGroup = new THREE.Group();
    this.scene.add(this.islandsGroup);
    this.createFloatingIslands();
  }

  private createFloatingIslands(): void {
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2
    });

    const crystalMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    for (let i = 0; i < 12; i++) {
      const island = new THREE.Group();
      const radius = 6 + Math.random() * 8;
      const rockGeo = new THREE.ConeGeometry(radius, radius * 1.6, 7);
      rockGeo.rotateX(Math.PI); // Inverted cone looks like floating cliff rock
      const rock = new THREE.Mesh(rockGeo, islandMat);
      island.add(rock);

      // Glowing crystal shard on top of island
      const crystalGeo = new THREE.OctahedronGeometry(1.8, 0);
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(0, radius * 0.8 + 1, 0);
      island.add(crystal);

      // Position flanking the track far away
      const side = i % 2 === 0 ? -1 : 1;
      const posX = side * (32 + Math.random() * 45);
      const posY = 10 + Math.random() * 25;
      const posZ = -i * 28 - 20;

      island.position.set(posX, posY, posZ);
      this.islandsGroup.add(island);
    }
  }

  public update(playerZ: number, dt: number): void {
    // Keep sky elements relatively anchored to player's forward progress
    this.moonMesh.position.z = playerZ - 160;
    this.starsPoints.position.z = playerZ;
    this.dirLight.position.z = playerZ - 20;
    this.dirLight.target.position.set(0, 0, playerZ);
    this.dirLight.target.updateMatrixWorld();

    // Floating islands slow bobbing & recycled wrapping
    this.islandsGroup.children.forEach((island, idx) => {
      island.position.y += Math.sin(Date.now() * 0.001 + idx) * (dt * 0.4);
      // Recycle if left far behind player
      if (island.position.z > playerZ + 40) {
        island.position.z -= 12 * 28;
      }
    });
  }
}
