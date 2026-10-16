import * as THREE from 'three';

/**
 * Centralized Asset Loader for 2.5D Billboard Sprites & Textures.
 * Provides caching and graceful fallbacks for headless/SSR test environments.
 */
export class AssetLoader {
  private static cache = new Map<string, THREE.Texture>();
  private static loader: THREE.TextureLoader | null = null;

  public static loadTexture(path: string): THREE.Texture {
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    // SSR / Headless unit testing environment guard (Node / Vitest / Happy-DOM)
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      const dummy = new THREE.Texture();
      this.cache.set(path, dummy);
      return dummy;
    }

    if (!this.loader) {
      this.loader = new THREE.TextureLoader();
    }

    try {
      const tex = this.loader.load(path);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.cache.set(path, tex);
      return tex;
    } catch {
      const dummy = new THREE.Texture();
      this.cache.set(path, dummy);
      return dummy;
    }
  }

  /**
   * Preload critical game sprite assets.
   */
  public static preloadAll(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const assets = [
      '/assets/luna_front.png',
      '/assets/luna_guardian.png',
      '/assets/luna_dawn.png',
      '/assets/luna_run.png',
      '/assets/luna_run_f1.png',
      '/assets/luna_run_f2.png',
      '/assets/luna_run_f3.png',
      '/assets/luna_run_f4.png',
      '/assets/luna_run_guardian_f1.png',
      '/assets/luna_run_guardian_f2.png',
      '/assets/luna_run_guardian_f3.png',
      '/assets/luna_run_guardian_f4.png',
      '/assets/luna_run_dawn_f1.png',
      '/assets/luna_run_dawn_f2.png',
      '/assets/luna_run_dawn_f3.png',
      '/assets/luna_run_dawn_f4.png',
      '/assets/luna_jump.png',
      '/assets/luna_slide.png',
      '/assets/stella_front.png',
      '/assets/stella_run_f1.png',
      '/assets/stella_run_f2.png',
      '/assets/stella_run_f3.png',
      '/assets/stella_run_f4.png',
      '/assets/stella_jump.png',
      '/assets/stella_slide.png',
      '/assets/stella_archmage_front.png',
      '/assets/stella_archmage_run_f1.png',
      '/assets/stella_archmage_run_f2.png',
      '/assets/stella_archmage_run_f3.png',
      '/assets/stella_archmage_run_f4.png',
      '/assets/stella_archmage_jump.png',
      '/assets/stella_archmage_slide.png',
      '/assets/stella_chronos_front.png',
      '/assets/stella_chronos_run_f1.png',
      '/assets/stella_chronos_run_f2.png',
      '/assets/stella_chronos_run_f3.png',
      '/assets/stella_chronos_run_f4.png',
      '/assets/stella_chronos_jump.png',
      '/assets/stella_chronos_slide.png',
      '/assets/solaris_front.png',
      '/assets/solaris_run_f1.png',
      '/assets/solaris_run_f2.png',
      '/assets/solaris_run_f3.png',
      '/assets/solaris_run_f4.png',
      '/assets/solaris_jump.png',
      '/assets/solaris_slide.png',
      '/assets/solaris_obsidian_front.png',
      '/assets/solaris_obsidian_run_f1.png',
      '/assets/solaris_obsidian_run_f2.png',
      '/assets/solaris_obsidian_run_f3.png',
      '/assets/solaris_obsidian_run_f4.png',
      '/assets/solaris_obsidian_jump.png',
      '/assets/solaris_obsidian_slide.png',
      '/assets/solaris_phoenix_front.png',
      '/assets/solaris_phoenix_run_f1.png',
      '/assets/solaris_phoenix_run_f2.png',
      '/assets/solaris_phoenix_run_f3.png',
      '/assets/solaris_phoenix_run_f4.png',
      '/assets/solaris_phoenix_jump.png',
      '/assets/solaris_phoenix_slide.png',
      '/assets/nyx_front.png',
      '/assets/nyx_run_f1.png',
      '/assets/nyx_run_f2.png',
      '/assets/nyx_run_f3.png',
      '/assets/nyx_run_f4.png',
      '/assets/nyx_jump.png',
      '/assets/nyx_slide.png',
      '/assets/nyx_cyber_front.png',
      '/assets/nyx_cyber_run_f1.png',
      '/assets/nyx_cyber_run_f2.png',
      '/assets/nyx_cyber_run_f3.png',
      '/assets/nyx_cyber_run_f4.png',
      '/assets/nyx_cyber_jump.png',
      '/assets/nyx_cyber_slide.png',
      '/assets/nyx_bloodmoon_front.png',
      '/assets/nyx_bloodmoon_run_f1.png',
      '/assets/nyx_bloodmoon_run_f2.png',
      '/assets/nyx_bloodmoon_run_f3.png',
      '/assets/nyx_bloodmoon_run_f4.png',
      '/assets/nyx_bloodmoon_jump.png',
      '/assets/nyx_bloodmoon_slide.png',
      '/assets/chest_mystery.png',
      '/assets/icon_chest.png',
      '/assets/icon_gacha.png',
      '/assets/skill_luna.png',
      '/assets/skill_stella.png',
      '/assets/skill_solaris.png',
      '/assets/skill_nyx.png',
      '/assets/bg_stage1.png',
      '/assets/bg_stage2.png',
      '/assets/bg_stage3.png',
      '/assets/bg_stage4.png',
      '/assets/bg_stage5.png',
      '/assets/bg_stage6.png',
      '/assets/bg_stage7.png',
      '/assets/bg_stage8.png',
      '/assets/bg_stage9.png',
      '/assets/bg_stage10.png',
      '/assets/moon_shard.png',
      '/assets/moon_shard_guardian.png',
      '/assets/moon_shard_dawn.png',
      '/assets/obs_pillar.png',
      '/assets/obs_arch.png',
      '/assets/obs_sentinel.png',
      '/assets/obs_crystal_spike.png',
      '/assets/obs_solar_monolith.png',
      '/assets/icon_costume.png',
      '/assets/icon_growth.png',
      '/assets/icon_settings.png'
    ];

    assets.forEach(url => this.loadTexture(url));
  }
}
