import * as THREE from 'three';
import { GraphicsQuality } from '../core/StorageManager';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private currentQuality: GraphicsQuality = 'medium';

  constructor(containerId = 'canvas-container') {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`SceneManager: Container #${containerId} not found`);
    }
    this.container = el;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060914);
    this.scene.fog = new THREE.FogExp2(0x070b18, 0.014);

    // 2. Camera: FOV 65 for balanced speed sensation & obstacle awareness
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 400);
    this.camera.position.set(0, 3.8, 6.2);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.applyQuality(this.currentQuality);
    this.handleResize();

    window.addEventListener('resize', () => this.handleResize());
  }

  public applyQuality(quality: GraphicsQuality): void {
    this.currentQuality = quality;
    let pixelRatio = 1.0;

    switch (quality) {
      case 'low':
        pixelRatio = 1.0;
        this.renderer.shadowMap.enabled = false;
        break;
      case 'medium':
        pixelRatio = Math.min(window.devicePixelRatio, 1.35);
        this.renderer.shadowMap.enabled = false;
        break;
      case 'high':
        pixelRatio = Math.min(window.devicePixelRatio, 2.0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
    }

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public handleResize(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
