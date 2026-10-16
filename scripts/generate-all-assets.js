import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/d4821323-b742-40cc-9525-ffce08066851';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log('--- Starting Complete 2.5D Asset Synthesis Pipeline ---');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Helper to load file as base64 data URI
  function getDataUri(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const ext = path.extname(filePath).replace('.', '');
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
  }

  const frontV2Uri = getDataUri(path.join(ARTIFACT_DIR, 'luna_front_v2_attempt2_1791801453722.jpg'));
  const runBaseUri = getDataUri(path.join(OUTPUT_DIR, 'luna_run.png')) || getDataUri(path.join(ARTIFACT_DIR, 'luna_run_1791797687428.jpg'));
  const shardBaseUri = getDataUri(path.join(OUTPUT_DIR, 'moon_shard.png'));

  // 1. Process Luna Front Views (Default, Guardian, Dawn) with BFS Edge Flood-Fill Keying
  console.log('1. Processing Luna Front Views with pristine anime faces...');
  const frontSprites = await page.evaluate(async (uri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const W = img.naturalWidth;
        const H = img.naturalHeight;

        // Canvas for default front
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, W, H);
        const data = imgData.data;

        // BFS Flood fill from edges to remove ONLY exterior black background
        const visited = new Uint8Array(W * H);
        const queue = [];

        function pushIfBg(x, y) {
          if (x < 0 || x >= W || y < 0 || y >= H) return;
          const idx = y * W + x;
          if (visited[idx]) return;
          const p = idx * 4;
          const maxVal = Math.max(data[p], data[p + 1], data[p + 2]);
          if (maxVal < 35) {
            visited[idx] = 1;
            queue.push(x, y);
          }
        }

        // Initialize queue from border pixels
        for (let x = 0; x < W; x++) {
          pushIfBg(x, 0);
          pushIfBg(x, H - 1);
        }
        for (let y = 0; y < H; y++) {
          pushIfBg(0, y);
          pushIfBg(W - 1, y);
        }

        let qHead = 0;
        while (qHead < queue.length) {
          const cx = queue[qHead++];
          const cy = queue[qHead++];
          const neighbors = [
            [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
          ];
          for (let i = 0; i < 4; i++) {
            pushIfBg(neighbors[i][0], neighbors[i][1]);
          }
        }

        // Set alpha = 0 only for exterior visited pixels, with 2px feathering
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const idx = y * W + x;
            const p = idx * 4;
            if (visited[idx]) {
              data[p + 3] = 0;
            } else {
              // Edge smoothing
              const maxVal = Math.max(data[p], data[p + 1], data[p + 2]);
              if (maxVal < 45) {
                data[p + 3] = Math.round(((maxVal - 15) / 30) * 255);
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const defaultPng = canvas.toDataURL('image/png').split(',')[1];

        // --- Helper for HSL color transform ---
        function rgbToHsl(r, g, b) {
          r /= 255; g /= 255; b /= 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          let h, s, l = (max + min) / 2;
          if (max === min) {
            h = s = 0;
          } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
          }
          return [h * 360, s, l];
        }

        function hslToRgb(h, s, l) {
          h /= 360;
          let r, g, b;
          if (s === 0) {
            r = g = b = l;
          } else {
            const hue2rgb = (p, q, t) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1/6) return p + (q - p) * 6 * t;
              if (t < 1/2) return q;
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
          }
          return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }

        // --- Generate Guardian Costume Front View ---
        const guardianData = ctx.getImageData(0, 0, W, H);
        const gData = guardianData.data;
        for (let i = 0; i < gData.length; i += 4) {
          if (gData[i + 3] === 0) continue;
          const [h, s, l] = rgbToHsl(gData[i], gData[i + 1], gData[i + 2]);
          // Blue cloak & adventurer dress (Hue 190 to 240) -> Deep Violet / Amethyst (Hue 275)
          if (h >= 190 && h <= 255 && s > 0.2) {
            const [nr, ng, nb] = hslToRgb(280, Math.min(1, s * 1.15), Math.max(0.12, l * 0.95));
            gData[i] = nr;
            gData[i + 1] = ng;
            gData[i + 2] = nb;
          }
          // Gold trims (Hue 35 to 60) -> Radiant Lavender / Amethyst Gold trim
          else if (h >= 30 && h <= 65 && s > 0.35 && l < 0.8) {
            const [nr, ng, nb] = hslToRgb(295, s * 0.8, l * 1.1);
            gData[i] = nr;
            gData[i + 1] = ng;
            gData[i + 2] = nb;
          }
        }
        ctx.putImageData(guardianData, 0, 0);
        const guardianPng = canvas.toDataURL('image/png').split(',')[1];

        // --- Generate Golden Dawn Costume Front View ---
        const dawnData = ctx.getImageData(0, 0, W, H);
        const dData = dawnData.data;
        // Reload base data
        ctx.putImageData(imgData, 0, 0);
        const dawnBase = ctx.getImageData(0, 0, W, H);
        const dbData = dawnBase.data;
        for (let i = 0; i < dbData.length; i += 4) {
          if (dbData[i + 3] === 0) continue;
          const [h, s, l] = rgbToHsl(dbData[i], dbData[i + 1], dbData[i + 2]);
          // Blue cloak & dress (Hue 190 to 255) -> Radiant Royal Amber Gold (Hue 40)
          if (h >= 190 && h <= 255 && s > 0.18) {
            const [nr, ng, nb] = hslToRgb(42, Math.min(1, s * 1.25), Math.min(0.85, l * 1.15));
            dbData[i] = nr;
            dbData[i + 1] = ng;
            dbData[i + 2] = nb;
          }
          // Hair highlights -> warm glowing blonde
          else if (s < 0.25 && l > 0.65 && l < 0.96) {
            const [nr, ng, nb] = hslToRgb(48, 0.45, l * 1.05);
            dbData[i] = nr;
            dbData[i + 1] = ng;
            dbData[i + 2] = nb;
          }
        }
        ctx.putImageData(dawnBase, 0, 0);
        const dawnPng = canvas.toDataURL('image/png').split(',')[1];

        resolve({ defaultPng, guardianPng, dawnPng });
      };
      img.src = uri;
    });
  }, frontV2Uri);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_front.png'), Buffer.from(frontSprites.defaultPng, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_guardian.png'), Buffer.from(frontSprites.guardianPng, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_dawn.png'), Buffer.from(frontSprites.dawnPng, 'base64'));
  console.log('Saved front views with cute faces: luna_front.png, luna_guardian.png, luna_dawn.png');

  // 2. Synthesize Multi-Frame Running, Jump, Slide Sprites for All 3 Costumes
  console.log('2. Synthesizing multi-frame running, jump, and slide sprites...');
  const actionSprites = await page.evaluate(async (uri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const W = img.naturalWidth;
        const H = img.naturalHeight;

        // Base canvas
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = W;
        baseCanvas.height = H;
        const bCtx = baseCanvas.getContext('2d');
        bCtx.drawImage(img, 0, 0);

        function createVariant(transformFn, colorShift = null) {
          const cvs = document.createElement('canvas');
          cvs.width = W;
          cvs.height = H;
          const c = cvs.getContext('2d');

          transformFn(c, baseCanvas, W, H);

          if (colorShift) {
            const idata = c.getImageData(0, 0, W, H);
            const d = idata.data;
            for (let i = 0; i < d.length; i += 4) {
              if (d[i + 3] === 0) continue;
              colorShift(d, i);
            }
            c.putImageData(idata, 0, 0);
          }
          return cvs.toDataURL('image/png').split(',')[1];
        }

        // Color shift functions:
        // Guardian violet shift
        function shiftGuardian(d, i) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          // If blue/cyan pixels
          if (b > r && b > 60) {
            d[i] = Math.min(255, Math.round(b * 0.95));     // red (violet)
            d[i + 1] = Math.round(g * 0.35);                // green lowered
            d[i + 2] = Math.min(255, Math.round(b * 1.15)); // blue high
          }
        }

        // Dawn golden shift
        function shiftDawn(d, i) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          if (b > r && b > 50) {
            d[i] = Math.min(255, Math.round(b * 1.25));     // high red
            d[i + 1] = Math.min(255, Math.round(b * 0.85)); // amber green
            d[i + 2] = Math.round(b * 0.15);                // low blue
          } else if (r > 160 && g > 160 && b > 160) {
            // hair highlights -> blonde
            d[i] = Math.min(255, Math.round(r * 1.1));
            d[i + 1] = Math.min(255, Math.round(g * 0.95));
            d[i + 2] = Math.round(b * 0.45);
          }
        }

        // Animations:
        // Frame 1 (Left Stride)
        const tF1 = (c, src, w, h) => {
          c.save();
          c.translate(w * 0.02, 0);
          c.transform(1, 0, -0.03, 1, 0, 0); // slight left lean
          c.drawImage(src, 0, 0);
          c.restore();
        };

        // Frame 2 (Right Stride)
        const tF2 = (c, src, w, h) => {
          c.save();
          c.translate(-w * 0.02, 0);
          c.transform(1, 0, 0.03, 1, 0, 0); // slight right lean
          c.drawImage(src, 0, 0);
          c.restore();
        };

        // Jump (Leap pose with cape spread and starlight sparkles)
        const tJump = (c, src, w, h) => {
          c.save();
          c.translate(0, -h * 0.04);
          c.scale(0.96, 1.05);
          c.drawImage(src, 0, 0);
          // Draw sparkling celestial jump stars beneath feet
          c.fillStyle = '#fde047';
          for (let k = 0; k < 12; k++) {
            const sx = w * 0.5 + (Math.random() - 0.5) * w * 0.4;
            const sy = h * 0.92 + Math.random() * h * 0.08;
            c.beginPath();
            c.arc(sx, sy, 3 + Math.random() * 3, 0, Math.PI * 2);
            c.fill();
          }
          c.restore();
        };

        // Slide (Low dash pose with sparks)
        const tSlide = (c, src, w, h) => {
          c.save();
          c.translate(0, h * 0.38);
          c.scale(1.28, 0.52);
          c.drawImage(src, 0, 0);
          // Friction ground sparks
          c.fillStyle = '#38bdf8';
          for (let k = 0; k < 14; k++) {
            const sx = w * 0.5 + (Math.random() - 0.5) * w * 0.6;
            const sy = h * 0.95;
            c.fillRect(sx, sy, 6, 2);
          }
          c.restore();
        };

        resolve({
          // Default costume
          run_f1: createVariant(tF1),
          run_f2: createVariant(tF2),
          jump: createVariant(tJump),
          slide: createVariant(tSlide),

          // Guardian costume
          g_run_f1: createVariant(tF1, shiftGuardian),
          g_run_f2: createVariant(tF2, shiftGuardian),
          g_jump: createVariant(tJump, shiftGuardian),
          g_slide: createVariant(tSlide, shiftGuardian),

          // Dawn costume
          d_run_f1: createVariant(tF1, shiftDawn),
          d_run_f2: createVariant(tF2, shiftDawn),
          d_jump: createVariant(tJump, shiftDawn),
          d_slide: createVariant(tSlide, shiftDawn)
        });
      };
      img.src = uri;
    });
  }, runBaseUri);

  // Write default action frames
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_run_f1.png'), Buffer.from(actionSprites.run_f1, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_run_f2.png'), Buffer.from(actionSprites.run_f2, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_jump.png'), Buffer.from(actionSprites.jump, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_slide.png'), Buffer.from(actionSprites.slide, 'base64'));

  // Write Guardian action frames
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_run_guardian_f1.png'), Buffer.from(actionSprites.g_run_f1, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_run_guardian_f2.png'), Buffer.from(actionSprites.g_run_f2, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_jump_guardian.png'), Buffer.from(actionSprites.g_jump, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_slide_guardian.png'), Buffer.from(actionSprites.g_slide, 'base64'));

  // Write Dawn action frames
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_run_dawn_f1.png'), Buffer.from(actionSprites.d_run_f1, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_run_dawn_f2.png'), Buffer.from(actionSprites.d_run_f2, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_jump_dawn.png'), Buffer.from(actionSprites.d_jump, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'luna_slide_dawn.png'), Buffer.from(actionSprites.d_slide, 'base64'));

  console.log('Saved 12 action animation sprites for all 3 costumes!');

  // 3. Synthesize Costume-Specific Moon Shards (Default Gold, Guardian Violet, Dawn Amber Solar)
  console.log('3. Synthesizing costume-specific moon shards...');
  const shardSprites = await page.evaluate(async (uri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const W = img.naturalWidth;
        const H = img.naturalHeight;

        function processShard(colorType) {
          const cvs = document.createElement('canvas');
          cvs.width = W;
          cvs.height = H;
          const c = cvs.getContext('2d');
          c.drawImage(img, 0, 0);

          const idata = c.getImageData(0, 0, W, H);
          const d = idata.data;

          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] === 0) continue;
            const r = d[i], g = d[i + 1], b = d[i + 2];

            if (colorType === 'guardian') {
              // Transform golden diamond to royal violet/amethyst diamond
              d[i] = Math.min(255, Math.round(r * 0.85 + 40));     // rich purple red
              d[i + 1] = Math.round(g * 0.35);                    // lower green
              d[i + 2] = Math.min(255, Math.round(r * 1.1 + 60)); // high violet blue
            } else if (colorType === 'dawn') {
              // Transform to blazing solar amber sun diamond
              d[i] = 255;                                         // maximum radiant gold red
              d[i + 1] = Math.min(255, Math.round(g * 0.85 + 20));// amber orange
              d[i + 2] = Math.round(b * 0.15);                    // low blue
            }
          }
          c.putImageData(idata, 0, 0);
          return cvs.toDataURL('image/png').split(',')[1];
        }

        resolve({
          guardianShard: processShard('guardian'),
          dawnShard: processShard('dawn')
        });
      };
      img.src = uri;
    });
  }, shardBaseUri);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'moon_shard_guardian.png'), Buffer.from(shardSprites.guardianShard, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'moon_shard_dawn.png'), Buffer.from(shardSprites.dawnShard, 'base64'));
  console.log('Saved costume-specific moon shards: moon_shard_guardian.png, moon_shard_dawn.png');

  // 4. Synthesize Stage-Specific Obstacles: Crystal Spikes (Stage 2) & Solar Monolith (Stage 3)
  console.log('4. Generating stage-specific obstacles...');
  const stageObstacles = await page.evaluate(async () => {
    // Stage 2: Amethyst Crystal Cluster Spike
    const cvs1 = document.createElement('canvas');
    cvs1.width = 380;
    cvs1.height = 540;
    const c1 = cvs1.getContext('2d');

    // Outer glow
    c1.shadowColor = '#c084fc';
    c1.shadowBlur = 24;

    // Draw crystalline jagged spike cluster
    const drawSpike = (x, y, w, h, col1, col2) => {
      const grad = c1.createLinearGradient(x - w/2, y, x + w/2, y + h);
      grad.addColorStop(0, '#f5d0fe');
      grad.addColorStop(0.3, col1);
      grad.addColorStop(1, col2);
      c1.fillStyle = grad;
      c1.beginPath();
      c1.moveTo(x, y);
      c1.lineTo(x + w * 0.5, y + h * 0.65);
      c1.lineTo(x + w * 0.35, y + h);
      c1.lineTo(x - w * 0.35, y + h);
      c1.lineTo(x - w * 0.5, y + h * 0.65);
      c1.closePath();
      c1.fill();

      // Highlight facet
      c1.fillStyle = 'rgba(255, 255, 255, 0.45)';
      c1.beginPath();
      c1.moveTo(x, y);
      c1.lineTo(x, y + h);
      c1.lineTo(x - w * 0.35, y + h);
      c1.lineTo(x - w * 0.5, y + h * 0.65);
      c1.closePath();
      c1.fill();
    };

    drawSpike(190, 40, 140, 460, '#a855f7', '#3b0764');
    drawSpike(100, 160, 95, 340, '#c084fc', '#581c87');
    drawSpike(280, 180, 100, 320, '#9333ea', '#4c1d95');
    drawSpike(50, 260, 70, 240, '#a855f7', '#2e1065');
    drawSpike(330, 270, 75, 230, '#8b5cf6', '#2e1065');

    // Glowing runes on main crystal
    c1.shadowBlur = 12;
    c1.strokeStyle = '#e9d5ff';
    c1.lineWidth = 4;
    c1.beginPath();
    c1.arc(190, 240, 24, 0, Math.PI * 2);
    c1.moveTo(190, 190); c1.lineTo(190, 290);
    c1.moveTo(165, 240); c1.lineTo(215, 240);
    c1.stroke();

    const spikePng = cvs1.toDataURL('image/png').split(',')[1];

    // Stage 3: Solar Flame Monolith Obelisk
    const cvs2 = document.createElement('canvas');
    cvs2.width = 380;
    cvs2.height = 540;
    const c2 = cvs2.getContext('2d');

    c2.shadowColor = '#f59e0b';
    c2.shadowBlur = 30;

    // Ancient golden obsidian stone pillar
    const stoneGrad = c2.createLinearGradient(0, 0, 380, 540);
    stoneGrad.addColorStop(0, '#78350f');
    stoneGrad.addColorStop(0.5, '#451a03');
    stoneGrad.addColorStop(1, '#1c1917');
    c2.fillStyle = stoneGrad;

    c2.beginPath();
    c2.moveTo(190, 30); // Pyramid peak
    c2.lineTo(290, 90);
    c2.lineTo(270, 510);
    c2.lineTo(110, 510);
    c2.lineTo(90, 90);
    c2.closePath();
    c2.fill();

    // Pyramid facet
    c2.fillStyle = 'rgba(251, 191, 36, 0.35)';
    c2.beginPath();
    c2.moveTo(190, 30);
    c2.lineTo(190, 510);
    c2.lineTo(90, 90);
    c2.closePath();
    c2.fill();

    // Blazing golden solar runes
    c2.shadowColor = '#ef4444';
    c2.shadowBlur = 20;
    c2.strokeStyle = '#fbbf24';
    c2.lineWidth = 6;

    // Glowing sun disk
    c2.beginPath();
    c2.arc(190, 220, 36, 0, Math.PI * 2);
    c2.stroke();
    c2.fillStyle = '#fde047';
    c2.beginPath();
    c2.arc(190, 220, 18, 0, Math.PI * 2);
    c2.fill();

    // Molten lava fissures
    c2.strokeStyle = '#f97316';
    c2.lineWidth = 4;
    c2.beginPath();
    c2.moveTo(190, 270);
    c2.lineTo(170, 340);
    c2.lineTo(210, 420);
    c2.lineTo(190, 490);
    c2.stroke();

    const monolithPng = cvs2.toDataURL('image/png').split(',')[1];

    return { spikePng, monolithPng };
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'obs_crystal_spike.png'), Buffer.from(stageObstacles.spikePng, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'obs_solar_monolith.png'), Buffer.from(stageObstacles.monolithPng, 'base64'));
  console.log('Saved stage obstacles: obs_crystal_spike.png, obs_solar_monolith.png');

  // 5. Synthesize Gorgeous Illustrated UI Icons for Main Menu (Costume, Growth, Settings)
  console.log('5. Generating illustrated UI icons...');
  const uiIcons = await page.evaluate(async () => {
    function makeIcon(drawFn, glowCol) {
      const size = 96;
      const cvs = document.createElement('canvas');
      cvs.width = size;
      cvs.height = size;
      const c = cvs.getContext('2d');

      // Rounded gold rim background
      c.shadowColor = glowCol;
      c.shadowBlur = 16;
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(size/2, size/2, size * 0.44, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = '#fbbf24';
      c.lineWidth = 3;
      c.stroke();

      drawFn(c, size);
      return cvs.toDataURL('image/png').split(',')[1];
    }

    // 1. Costume Wardrobe Ribbon Icon
    const costumeIcon = makeIcon((c, s) => {
      c.fillStyle = '#38bdf8';
      c.shadowColor = '#38bdf8';
      c.shadowBlur = 10;
      // Bow & Ribbon
      c.beginPath();
      c.ellipse(s * 0.35, s * 0.42, 14, 8, -Math.PI / 6, 0, Math.PI * 2);
      c.ellipse(s * 0.65, s * 0.42, 14, 8, Math.PI / 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fde047';
      c.beginPath();
      c.arc(s * 0.5, s * 0.42, 7, 0, Math.PI * 2);
      c.fill();
      // Flowing ribbon tails
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(s * 0.46, s * 0.48); c.lineTo(s * 0.36, s * 0.75);
      c.moveTo(s * 0.54, s * 0.48); c.lineTo(s * 0.64, s * 0.75);
      c.stroke();
    }, '#38bdf8');

    // 2. Growth Magic Chalice / Crystal Orb Icon
    const growthIcon = makeIcon((c, s) => {
      c.shadowColor = '#c084fc';
      c.shadowBlur = 14;
      // Glowing orb
      const grad = c.createRadialGradient(s * 0.5, s * 0.48, 4, s * 0.5, s * 0.48, 22);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#c084fc');
      grad.addColorStop(1, '#581c87');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(s * 0.5, s * 0.48, 20, 0, Math.PI * 2);
      c.fill();
      // Orbiting starlight ring
      c.strokeStyle = '#fde047';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(s * 0.5, s * 0.48, 26, 8, Math.PI / 4, 0, Math.PI * 2);
      c.stroke();
    }, '#c084fc');

    // 3. Settings Mystic Astrolabe Gear Icon
    const settingsIcon = makeIcon((c, s) => {
      c.shadowColor = '#38bdf8';
      c.shadowBlur = 12;
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 4;
      c.beginPath();
      c.arc(s * 0.5, s * 0.5, 18, 0, Math.PI * 2);
      c.stroke();
      // Gear teeth
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        c.fillStyle = '#cbd5e1';
        c.fillRect(s * 0.5 + Math.cos(a) * 20 - 3, s * 0.5 + Math.sin(a) * 20 - 3, 6, 6);
      }
      c.fillStyle = '#fbbf24';
      c.beginPath();
      c.arc(s * 0.5, s * 0.5, 6, 0, Math.PI * 2);
      c.fill();
    }, '#94a3b8');

    return { costumeIcon, growthIcon, settingsIcon };
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'icon_costume.png'), Buffer.from(uiIcons.costumeIcon, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'icon_growth.png'), Buffer.from(uiIcons.growthIcon, 'base64'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'icon_settings.png'), Buffer.from(uiIcons.settingsIcon, 'base64'));
  console.log('Saved UI icons: icon_costume.png, icon_growth.png, icon_settings.png');

  await browser.close();
  console.log('--- All 2.5D Assets Synthesized and Saved Successfully! ---');
}

main().catch(console.error);
