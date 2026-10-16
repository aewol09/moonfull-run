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

  /**
   * 9. Luminous Atmospheric Sea of Clouds / Chasm Mist Texture (per stage)
   */
  public static createCloudSeaTexture(stage: number): THREE.CanvasTexture {
    const key = `cloud_sea_stage_${stage}`;
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

    const palettes: Record<number, { bg: string; cloud: string; mist: string; rim: string }> = {
      1: { bg: '#081226', cloud: '#1e3a8a', mist: '#38bdf8', rim: '#93c5fd' }, // Moonlit Ruins
      2: { bg: '#041d14', cloud: '#064e3b', mist: '#10b981', rim: '#6ee7b7' }, // Starlight Forest
      3: { bg: '#170b28', cloud: '#4c1d95', mist: '#a855f7', rim: '#e9d5ff' }, // Amethyst Sanctuary
      4: { bg: '#06202e', cloud: '#0e7490', mist: '#06b6d4', rim: '#67e8f9' }, // Jade Canyon
      5: { bg: '#2b1008', cloud: '#7c2d12', mist: '#d97706', rim: '#fde047' }, // Twilight Temple
      6: { bg: '#260606', cloud: '#7f1d1d', mist: '#dc2626', rim: '#fca5a5' }, // Crimson Moon
      7: { bg: '#081c33', cloud: '#0369a1', mist: '#38bdf8', rim: '#e0f2fe' }, // Glacial Frost
      8: { bg: '#260d03', cloud: '#9a3412', mist: '#ea580c', rim: '#fdba74' }, // Solar Eclipse
      9: { bg: '#1a052e', cloud: '#581c87', mist: '#9333ea', rim: '#f0abfc' }, // Void Abyss
      10: { bg: '#0b0f2e', cloud: '#3730a3', mist: '#6366f1', rim: '#f43f5e' } // Celestial Chaos
    };

    const p = palettes[stage] || palettes[1];

    // 1. Deep atmospheric background
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, size, size);

    // 2. Rolling volumetric cloud banks
    for (let i = 0; i < 28; i++) {
      const cx = (Math.sin(i * 1.7) * 0.5 + 0.5) * size;
      const cy = (Math.cos(i * 2.3) * 0.5 + 0.5) * size;
      const radius = 60 + (i % 5) * 24;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, p.cloud);
      grad.addColorStop(0.55, p.mist);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Ethereal luminous stardust & light wisps
    ctx.globalAlpha = 0.65;
    for (let j = 0; j < 40; j++) {
      const wx = Math.random() * size;
      const wy = Math.random() * size;
      const wr = 2 + Math.random() * 5;
      ctx.fillStyle = p.rim;
      ctx.beginPath();
      ctx.arc(wx, wy, wr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 10. Luna's Crescent Slash Projectile Texture (Per Skin)
   */
  public static createCrescentSlashTexture(
    slashColorHex: string,
    coreColorHex: string,
    runeType: 'moon' | 'star' | 'sun'
  ): THREE.CanvasTexture {
    const key = `slash_${slashColorHex}_${runeType}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const w = 512;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = this.get2DContext(canvas);

    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      this.cache.set(key, fallback);
      return fallback;
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Broad Sweeping Energy Arc (Crescent Blade)
    const cx = w * 0.5;
    const cy = h * 0.85;
    const outerR = w * 0.46;
    const innerR = w * 0.38;

    // Glowing outer edge aura
    const edgeGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR * 1.1);
    edgeGrad.addColorStop(0, coreColorHex);
    edgeGrad.addColorStop(0.5, slashColorHex);
    edgeGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = edgeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR * 1.08, -Math.PI * 0.88, -Math.PI * 0.12, false);
    ctx.arc(cx, cy + 25, innerR * 0.9, -Math.PI * 0.14, -Math.PI * 0.86, true);
    ctx.closePath();
    ctx.fill();

    // Dense inner razor edge
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, -Math.PI * 0.82, -Math.PI * 0.18, false);
    ctx.arc(cx, cy + 18, outerR - 10, -Math.PI * 0.18, -Math.PI * 0.82, true);
    ctx.closePath();
    ctx.fill();

    // 2. Emblems in center of blade
    ctx.strokeStyle = slashColorHex;
    ctx.fillStyle = coreColorHex;
    ctx.lineWidth = 3;

    const runeX = cx;
    const runeY = cy - outerR * 0.92;

    if (runeType === 'moon') {
      // Crescent Moon
      ctx.beginPath();
      ctx.arc(runeX, runeY, 18, 0.4, Math.PI * 1.6);
      ctx.arc(runeX + 6, runeY, 14, Math.PI * 1.5, 0.5, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (runeType === 'star') {
      // Sacred Star Cross
      for (let arm = 0; arm < 4; arm++) {
        const ang = (arm * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(runeX, runeY);
        ctx.lineTo(runeX + Math.cos(ang) * 22, runeY + Math.sin(ang) * 22);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(runeX, runeY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Radiant Solar Sunburst
      ctx.beginPath();
      ctx.arc(runeX, runeY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let ray = 0; ray < 8; ray++) {
        const ang = (ray * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(runeX + Math.cos(ang) * 13, runeY + Math.sin(ang) * 13);
        ctx.lineTo(runeX + Math.cos(ang) * 22, runeY + Math.sin(ang) * 22);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 11. Stella's Astrological Magic Circle Texture (Per Skin)
   */
  public static createMagicCircleTexture(
    circleType: 'nebula' | 'zodiac' | 'chronos',
    primaryHex: string,
    secondaryHex: string
  ): THREE.CanvasTexture {
    const key = `magic_circle_${circleType}_${primaryHex}_${secondaryHex}`;
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

    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;

    // Ambient radial glow from center
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.48);
    glow.addColorStop(0, primaryHex + '33'); // 20% opacity
    glow.addColorStop(0.7, secondaryHex + '18');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = primaryHex;
    ctx.lineWidth = 3;

    // Concentric border rings
    [0.46, 0.42, 0.38, 0.22, 0.12].forEach(rRatio => {
      ctx.beginPath();
      ctx.arc(cx, cy, size * rRatio, 0, Math.PI * 2);
      ctx.stroke();
    });

    if (circleType === 'nebula') {
      // 1. Nebula: Star Nodes & Planetary Rings
      ctx.strokeStyle = secondaryHex;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * size * 0.12, cy + Math.sin(ang) * size * 0.12);
        ctx.lineTo(cx + Math.cos(ang) * size * 0.42, cy + Math.sin(ang) * size * 0.42);
        ctx.stroke();

        // Star Nodes on outer ring
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * size * 0.42, cy + Math.sin(ang) * size * 0.42, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Interlocking triangles (Hexagram)
      for (let rot = 0; rot < 2; rot++) {
        const offset = rot * (Math.PI / 3);
        ctx.beginPath();
        for (let p = 0; p < 3; p++) {
          const a = offset + (p * 2 * Math.PI) / 3;
          const px = cx + Math.cos(a) * size * 0.36;
          const py = cy + Math.sin(a) * size * 0.36;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    } else if (circleType === 'zodiac') {
      // 2. Zodiac: 12 Astrological Radial Segments & Sigils
      ctx.strokeStyle = secondaryHex;
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const ang = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * size * 0.22, cy + Math.sin(ang) * size * 0.22);
        ctx.lineTo(cx + Math.cos(ang) * size * 0.46, cy + Math.sin(ang) * size * 0.46);
        ctx.stroke();

        // Glyphs in 12 sectors
        const midA = ang + Math.PI / 12;
        const gx = cx + Math.cos(midA) * size * 0.40;
        const gy = cy + Math.sin(midA) * size * 0.40;
        ctx.fillStyle = primaryHex;
        ctx.beginPath();
        ctx.arc(gx, gy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Central 12-point astral star
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const a1 = (i * Math.PI) / 6;
        const a2 = ((i + 4) * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * size * 0.20, cy + Math.sin(a1) * size * 0.20);
        ctx.lineTo(cx + Math.cos(a2) * size * 0.20, cy + Math.sin(a2) * size * 0.20);
        ctx.stroke();
      }
    } else {
      // 3. Chronos: Ticking Roman Clock Face & Gear Teeth Ring
      // Gear Teeth on outer boundary
      const teeth = 36;
      ctx.fillStyle = primaryHex;
      for (let t = 0; t < teeth; t++) {
        const ang = (t * Math.PI * 2) / teeth;
        const tx = cx + Math.cos(ang) * size * 0.46;
        const ty = cy + Math.sin(ang) * size * 0.46;
        ctx.fillRect(tx - 3, ty - 3, 6, 6);
      }

      // 12 Clock Hour Marks (Roman Numeral ticks)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      for (let h = 0; h < 12; h++) {
        const ang = (h * Math.PI * 2) / 12 - Math.PI / 2;
        const inner = size * (h % 3 === 0 ? 0.35 : 0.38);
        const outer = size * 0.42;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
        ctx.lineTo(cx + Math.cos(ang) * outer, cy + Math.sin(ang) * outer);
        ctx.stroke();
      }

      // Central Clock Hands
      ctx.lineWidth = 4;
      ctx.strokeStyle = primaryHex;
      // Minute Hand (pointing at 2 o'clock)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(-Math.PI / 6) * size * 0.26, cy + Math.sin(-Math.PI / 6) * size * 0.26);
      ctx.stroke();

      // Hour Hand (pointing at 10 o'clock)
      ctx.lineWidth = 6;
      ctx.strokeStyle = secondaryHex;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(-Math.PI * 5 / 6) * size * 0.17, cy + Math.sin(-Math.PI * 5 / 6) * size * 0.17);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 12. Solaris's Vanguard Aura Shield Texture (Per Skin)
   */
  public static createAuraShieldTexture(
    auraType: 'sunfire' | 'magma' | 'phoenix',
    primaryHex: string,
    secondaryHex: string
  ): THREE.CanvasTexture {
    const key = `aura_shield_${auraType}_${primaryHex}_${secondaryHex}`;
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

    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;

    // Glowing energy envelope
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
    grad.addColorStop(0, primaryHex + '88');
    grad.addColorStop(0.65, secondaryHex + '44');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = primaryHex;
    ctx.lineWidth = 4;

    if (auraType === 'sunfire') {
      // Holy Solar Lion Crest & Sunburst
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 16; i++) {
        const ang = (i * Math.PI) / 8;
        const r1 = size * 0.32;
        const r2 = size * (i % 2 === 0 ? 0.44 : 0.38);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        ctx.stroke();
      }
    } else if (auraType === 'magma') {
      // Obsidian Cracking Volcanic Magma Fissures
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        let curX = cx + Math.cos(ang) * 20;
        let curY = cy + Math.sin(ang) * 20;
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        for (let seg = 1; seg <= 5; seg++) {
          const r = seg * size * 0.08;
          const a = ang + (Math.sin(seg * 3 + i) * 0.3);
          curX = cx + Math.cos(a) * r;
          curY = cy + Math.sin(a) * r;
          ctx.lineTo(curX, curY);
        }
        ctx.stroke();
      }
    } else {
      // Phoenix Vermilion Fire Wings
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 3;
      for (let wing = 0; wing < 2; wing++) {
        const side = wing === 0 ? 1 : -1;
        for (let feather = 0; feather < 6; feather++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          const cpX = cx + side * (feather * 30 + 40);
          const cpY = cy - feather * 25 - 20;
          const endX = cx + side * (feather * 40 + 60);
          const endY = cy - feather * 10;
          ctx.quadraticCurveTo(cpX, cpY, endX, endY);
          ctx.stroke();
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 13. Nyx's Shadow Shift Spatial Rift Texture (Per Skin)
   */
  public static createShadowRiftTexture(
    riftType: 'phantom' | 'cyber' | 'bloodmoon',
    primaryHex: string,
    secondaryHex: string
  ): THREE.CanvasTexture {
    const key = `shadow_rift_${riftType}_${primaryHex}_${secondaryHex}`;
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

    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;

    if (riftType === 'phantom') {
      // 1. Phantom: Void Spiral Vortex
      const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
      radGrad.addColorStop(0, '#000000');
      radGrad.addColorStop(0.65, primaryHex + '55');
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Spiral Arms
      ctx.strokeStyle = primaryHex;
      ctx.lineWidth = 3;
      for (let arm = 0; arm < 3; arm++) {
        const offset = (arm * Math.PI * 2) / 3;
        ctx.beginPath();
        for (let theta = 0; theta < Math.PI * 3; theta += 0.1) {
          const r = theta * 22;
          const x = cx + Math.cos(theta + offset) * r;
          const y = cy + Math.sin(theta + offset) * r;
          if (theta === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (riftType === 'cyber') {
      // 2. Cyber: Holographic Radar Grid & Digital Binary Reticle
      ctx.strokeStyle = primaryHex;
      ctx.lineWidth = 2;

      // Radar Concentric Circles
      [0.45, 0.35, 0.25, 0.15].forEach(rRatio => {
        ctx.beginPath();
        ctx.arc(cx, cy, size * rRatio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs & Grid Lines
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.45, cy);
      ctx.lineTo(cx + size * 0.45, cy);
      ctx.moveTo(cx, cy - size * 0.45);
      ctx.lineTo(cx, cy + size * 0.45);
      ctx.stroke();

      // Digital Matrix Nodes
      ctx.fillStyle = secondaryHex;
      for (let nx = -3; nx <= 3; nx++) {
        for (let ny = -3; ny <= 3; ny++) {
          if (nx * nx + ny * ny < 14) {
            ctx.fillRect(cx + nx * 45 - 2, cy + ny * 45 - 2, 4, 4);
          }
        }
      }
    } else {
      // 3. Bloodmoon: Eclipse Crescent & Occult Bleeding Runes
      const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
      radGrad.addColorStop(0, '#1a0003');
      radGrad.addColorStop(0.5, '#7f1d1d88');
      radGrad.addColorStop(0.9, primaryHex + '55');
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Blood Eclipse Ring
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Blood Drops radiating outward
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        const bx = cx + Math.cos(ang) * size * 0.41;
        const by = cy + Math.sin(ang) * size * 0.41;
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }
}
