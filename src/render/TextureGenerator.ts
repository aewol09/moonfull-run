import * as THREE from 'three';

/**
 * Procedural Texture Generator
 * Generates high-detail procedural PBR/Canvas textures at runtime with 0KB asset download overhead.
 * Includes graceful SSR/headless-testing fallback when 2D canvas context is not present.
 */
export class TextureGenerator {
  private static cache = new Map<string, THREE.CanvasTexture>();

  private static get2DContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    try {
      return canvas.getContext('2d');
    } catch {
      return null;
    }
  }

  /**
   * 1. Ancient Stone Road Texture
   * Slate-blue ancient flagstones with engraved moonlight runes and edge grooves.
   */
  public static createStoneRoadTexture(): THREE.CanvasTexture {
    const key = 'stone_road';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = this.get2DContext(canvas);

    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      this.cache.set(key, fallback);
      return fallback;
    }

    // Base background: dark midnight slate
    ctx.fillStyle = '#131926';
    ctx.fillRect(0, 0, size, size);

    // Stone tile grid
    const tileRows = 8;
    const tileCols = 4;
    const rw = size / tileCols;
    const rh = size / tileRows;

    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 4;

    for (let r = 0; r < tileRows; r++) {
      for (let c = 0; c < tileCols; c++) {
        const x = c * rw + ((r % 2) * (rw * 0.5)) % rw;
        const y = r * rh;

        // Subtle tile color variations
        const lightness = 18 + Math.floor(Math.sin(r * 3 + c * 7) * 4);
        ctx.fillStyle = `hsl(220, 24%, ${lightness}%)`;
        ctx.fillRect(x + 2, y + 2, rw - 4, rh - 4);
        ctx.strokeRect(x, y, rw, rh);

        // Stone surface fine speckles / noise
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        for (let i = 0; i < 20; i++) {
          const sx = x + Math.random() * rw;
          const sy = y + Math.random() * rh;
          ctx.fillRect(sx, sy, 2, 2);
        }

        // Cracks on occasional stones
        if ((r + c) % 3 === 0) {
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + rw * 0.2, y + rh * 0.3);
          ctx.lineTo(x + rw * 0.5, y + rh * 0.6);
          ctx.lineTo(x + rw * 0.8, y + rh * 0.5);
          ctx.stroke();
        }
      }
    }

    // Glowing Moonlight Runes running down the road center and lanes
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 8;

    // Lane division guide lines
    const laneX = [size * 0.33, size * 0.66];
    laneX.forEach((lx) => {
      ctx.beginPath();
      ctx.setLineDash([16, 16]);
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, size);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Mystic runic symbols along center
    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    const runes = ['ᚱ', 'ᛗ', 'ᛟ', 'ᛃ', 'ᛋ', 'ᚨ'];
    for (let i = 0; i < 6; i++) {
      ctx.fillText(runes[i % runes.length], size * 0.5, (i + 0.5) * (size / 6));
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 2. Stone Bump/Roughness Map
   * Height/relief map for realistic lighting depth on stone.
   */
  public static createStoneBumpMap(): THREE.CanvasTexture {
    const key = 'stone_bump';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = this.get2DContext(canvas);

    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      this.cache.set(key, fallback);
      return fallback;
    }

    // Mid-gray baseline
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Deep grooves
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 4;
    const rows = 8;
    const cols = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * (size / cols);
        const y = r * (size / rows);
        ctx.strokeRect(x, y, size / cols, size / rows);
      }
    }

    // High frequency surface noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 36;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 3. Ruins Stone Texture (Pillars & Arches)
   * Weathered ashlar masonry with glowing celestial veins.
   */
  public static createRuinsStoneTexture(): THREE.CanvasTexture {
    const key = 'ruins_stone';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = this.get2DContext(canvas);

    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      this.cache.set(key, fallback);
      return fallback;
    }

    // Granite slate base
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, size, size);

    // Brick mortar lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      const y = r * (size / rows);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();

      const cols = 4;
      for (let c = 0; c < cols; c++) {
        const x = c * (size / cols) + ((r % 2) * (size / cols) * 0.5);
        ctx.beginPath();
        ctx.moveTo(x % size, y);
        ctx.lineTo(x % size, y + size / rows);
        ctx.stroke();
      }
    }

    // Glowing carved ancient magical glyph in center
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 28, 0, Math.PI * 2);
    ctx.moveTo(size / 2 - 20, size / 2);
    ctx.lineTo(size / 2 + 20, size / 2);
    ctx.moveTo(size / 2, size / 2 - 20);
    ctx.lineTo(size / 2, size / 2 + 20);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 4. Crumbling Void Platform Texture
   * Stress cracks glowing with dangerous crimson / void purple mana.
   */
  public static createCrackedPlatformTexture(): THREE.CanvasTexture {
    const key = 'cracked_platform';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = this.get2DContext(canvas);

    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      this.cache.set(key, fallback);
      return fallback;
    }

    // Dark distressed stone
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, size, size);

    // Chaotic glowing magma/mana fissures
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#fb7185';
    ctx.shadowBlur = 10;

    const center = size / 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(center, center);
      let px = center;
      let py = center;
      for (let step = 0; step < 4; step++) {
        px += Math.cos(angle) * 28 + (Math.random() - 0.5) * 16;
        py += Math.sin(angle) * 28 + (Math.random() - 0.5) * 16;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 5. Character Costume Fabric Texture
   * Weave patterns with gold & starlight trim embroidery.
   */
  public static createCostumeFabricTexture(
    baseColor: string,
    trimColor: string
  ): THREE.CanvasTexture {
    const key = `costume_fabric_${baseColor}_${trimColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = this.get2DContext(canvas);

    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      this.cache.set(key, fallback);
      return fallback;
    }

    // Base cloth color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Delicate textile weave lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 6) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Gold/starlight embroidered filigree border
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = trimColor;
    ctx.shadowBlur = 4;
    ctx.strokeRect(8, 8, size - 16, size - 16);

    // Ornate crest / moon crescent emblem in the upper center
    ctx.fillStyle = trimColor;
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.35, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(size / 2 + 7, size * 0.35 - 3, 18, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 6. Anime/Fantasy Character Eyes Texture
   * Beautiful expressive anime eyes with starlight highlights and pupils.
   */
  public static createEyeTexture(color = '#38bdf8'): THREE.CanvasTexture {
    const key = `eye_${color}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = this.get2DContext(canvas);

    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      this.cache.set(key, fallback);
      return fallback;
    }

    // Eye white base
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2, 48, 56, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris gradient
    const irisGrad = ctx.createLinearGradient(size / 2, 20, size / 2, 100);
    irisGrad.addColorStop(0, '#0369a1');
    irisGrad.addColorStop(0.5, color);
    irisGrad.addColorStop(1, '#bae6fd');

    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2 + 4, 34, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep pupil
    ctx.fillStyle = '#082f49';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 + 4, 16, 0, Math.PI * 2);
    ctx.fill();

    // Twin specular highlights (anime gleam)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2 - 10, size / 2 - 8, 8, 0, Math.PI * 2);
    ctx.arc(size / 2 + 10, size / 2 + 12, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyelash contour
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 48, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 7. Celestial Moon Crater Texture
   */
  public static createMoonTexture(): THREE.CanvasTexture {
    const key = 'moon_surface';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = this.get2DContext(canvas);

    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      this.cache.set(key, fallback);
      return fallback;
    }

    // Pale luminescent yellow/gold gradient
    const grad = ctx.createRadialGradient(size * 0.4, size * 0.35, 40, size / 2, size / 2, size / 2);
    grad.addColorStop(0, '#fffbeb');
    grad.addColorStop(0.6, '#fef08a');
    grad.addColorStop(1, '#eab308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Lunar Maria (darker plains)
    ctx.fillStyle = 'rgba(217, 119, 6, 0.16)';
    ctx.beginPath();
    ctx.arc(size * 0.35, size * 0.45, 90, 0, Math.PI * 2);
    ctx.arc(size * 0.65, size * 0.55, 110, 0, Math.PI * 2);
    ctx.arc(size * 0.45, size * 0.75, 75, 0, Math.PI * 2);
    ctx.fill();

    // Craters
    const craters = [
      { x: 180, y: 150, r: 24 },
      { x: 320, y: 220, r: 35 },
      { x: 240, y: 340, r: 18 },
      { x: 380, y: 380, r: 28 },
      { x: 140, y: 360, r: 16 }
    ];

    craters.forEach(({ x, y, r }) => {
      // Crater rim light
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, r, 0, Math.PI * 2);
      ctx.fill();
      // Crater shadow basin
      ctx.fillStyle = 'rgba(161, 98, 7, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 8. Stepped Toon Gradient Ramp (for 3-tier Cel Shading)
   */
  public static createToonGradientMap(): THREE.CanvasTexture {
    const key = 'toon_gradient';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = this.get2DContext(canvas);

    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      this.cache.set(key, fallback);
      return fallback;
    }

    // 4 sharp distinct steps for classic anime cel shading
    const colors = ['#334155', '#64748b', '#94a3b8', '#ffffff'];
    colors.forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.fillRect(idx, 0, 1, 1);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    this.cache.set(key, tex);
    return tex;
  }
}
