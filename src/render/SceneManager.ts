import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GraphicsQuality } from '../core/StorageManager';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
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
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Post-processing Composer
    this.initPostProcessing();

    this.applyQuality(this.currentQuality);
    this.handleResize();

    window.addEventListener('resize', () => this.handleResize());
  }

  private initPostProcessing(): void {
    if (!this.renderer || typeof (this.renderer as unknown as { getSize?: () => unknown }).getSize !== 'function') {
      this.composer = null;
      return;
    }
    try {
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      const width = this.container.clientWidth || window.innerWidth || 800;
      const height = this.container.clientHeight || window.innerHeight || 600;

      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.55, // strength
        0.4,  // radius
        0.72  // threshold: only bright highlights (moon, runes, shards, shield) glow
      );
      this.composer.addPass(this.bloomPass);
    } catch (e) {
      console.warn('Post-processing could not initialize, falling back to direct render:', e);
      this.composer = null;
    }
  }

  public applyQuality(quality: GraphicsQuality): void {
    this.currentQuality = quality;
    let pixelRatio = 1.0;

    switch (quality) {
      case 'low':
        pixelRatio = 1.0;
        this.renderer.shadowMap.enabled = false;
        if (this.bloomPass) this.bloomPass.enabled = false;
        break;
      case 'medium':
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);
        this.renderer.shadowMap.enabled = false;
        if (this.bloomPass) {
          this.bloomPass.enabled = true;
          this.bloomPass.strength = 0.45;
        }
        break;
      case 'high':
        pixelRatio = Math.min(window.devicePixelRatio || 1, 2.0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if (this.bloomPass) {
          this.bloomPass.enabled = true;
          this.bloomPass.strength = 0.65;
        }
        break;
    }

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    if (this.composer) {
      this.composer.setPixelRatio(pixelRatio);
      this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
  }

  public handleResize(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
      if (this.bloomPass) {
        this.bloomPass.resolution.set(width, height);
      }
    }
  }

  public render(): void {
    if (this.currentQuality !== 'low' && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
