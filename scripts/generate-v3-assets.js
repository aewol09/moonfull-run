import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log('--- Generating Moonfall Run V3 Assets (Characters, Multi-frame Legs, Chests, Stages) ---');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Load existing luna_run.png and luna_front.png if present
  function getDataUri(filename) {
    const fullPath = path.join(OUTPUT_DIR, filename);
    if (!fs.existsSync(fullPath)) return null;
    return `data:image/png;base64,${fs.readFileSync(fullPath).toString('base64')}`;
  }

  const lunaRunUri = getDataUri('luna_run.png');
  const lunaFrontUri = getDataUri('luna_front.png');

  const generated = await page.evaluate(async (runUri, frontUri) => {
    const results = {};

    function helperCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return { canvas: c, ctx: c.getContext('2d') };
    }

    // ----------------------------------------------------
    // 1. Generate 4-Frame Running Animation for Luna with Realistic Alternating Legs
    // ----------------------------------------------------
    const runImg = new Image();
    await new Promise(r => {
      runImg.onload = r;
      runImg.src = runUri;
    });

    const W = runImg.naturalWidth || 512;
    const H = runImg.naturalHeight || 512;

    // We generate 4 distinct frames showing realistic leg strides:
    // Frame 1: Left leg planted forward, right leg bent back up high
    // Frame 2: Mid-stride passing, body at high bounce, cape fluttering high
    // Frame 3: Right leg planted forward, left leg bent back up high
    // Frame 4: Mid-stride passing second phase, left leg driving forward
    for (let f = 1; f <= 4; f++) {
      const { canvas, ctx } = helperCanvas(W, H);
      ctx.save();

      // Body vertical bounce
      const yShift = (f === 2 || f === 4) ? -12 : 6;
      // Slight hip tilt
      const hipTilt = (f === 1) ? -0.04 : (f === 3) ? 0.04 : 0;

      ctx.translate(W / 2, H * 0.55);
      ctx.rotate(hipTilt);
      ctx.translate(-W / 2, -H * 0.55);

      // Draw base torso & head
      ctx.drawImage(runImg, 0, yShift, W, H);

      // Enhance leg strides with dynamic athletic boot overlays & shadow
      const legY = H * 0.72;
      const legH = H * 0.26;
      ctx.restore();

      // Draw dynamic leg/boot accents for clear stride separation
      ctx.save();
      if (f === 1) {
        // Left boot planted forward (larger, firmly down)
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.ellipse(W * 0.38, H * 0.94, 22, 12, -0.15, 0, Math.PI * 2);
        ctx.fill();
        // Golden boot trim
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Right boot kicking back high in air
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(W * 0.62, H * 0.82, 18, 10, 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Starlight friction spark at left foot plant
        const grad = ctx.createRadialGradient(W * 0.38, H * 0.94, 2, W * 0.38, H * 0.94, 24);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(W * 0.38, H * 0.94, 24, 0, Math.PI * 2);
        ctx.fill();
      } else if (f === 2) {
        // Passing phase: Left leg swinging back, right leg swinging forward
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.ellipse(W * 0.44, H * 0.88, 19, 11, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(W * 0.56, H * 0.86, 19, 11, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (f === 3) {
        // Right boot planted forward
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.ellipse(W * 0.62, H * 0.94, 22, 12, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Left boot kicking back high in air
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(W * 0.38, H * 0.82, 18, 10, -0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Starlight spark at right foot plant
        const grad = ctx.createRadialGradient(W * 0.62, H * 0.94, 2, W * 0.62, H * 0.94, 24);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(W * 0.62, H * 0.94, 24, 0, Math.PI * 2);
        ctx.fill();
      } else if (f === 4) {
        // Passing phase 2: Right leg pushing off, left leg rising forward
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(W * 0.42, H * 0.85, 19, 11, -0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.ellipse(W * 0.58, H * 0.89, 19, 11, 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();

      results[`luna_run_f${f}.png`] = canvas.toDataURL('image/png');
    }

    // ----------------------------------------------------
    // 2. Generate 3 Other Unique Playable Characters:
    // Stella (Mage), Solaris (Paladin), Nyx (Shadow Assassin)
    // ----------------------------------------------------
    const chars = [
      {
        id: 'stella',
        name: 'Stella',
        hue: 270, // Lavender / Violet starlight
        capeGrad: ['#7c3aed', '#c084fc'],
        hairColor: '#fef08a',
        trimColor: '#e9d5ff',
        sparkleColor: '#c084fc',
        tunicGrad: ['#4c1d95', '#2e1065']
      },
      {
        id: 'solaris',
        name: 'Solaris',
        hue: 35, // Amber / Solar flame
        capeGrad: ['#b45309', '#f59e0b'],
        hairColor: '#fed7aa',
        trimColor: '#fde047',
        sparkleColor: '#fbbf24',
        tunicGrad: ['#78350f', '#451a03']
      },
      {
        id: 'nyx',
        name: 'Nyx',
        hue: 200, // Midnight Shadow / Cyan Phantasm
        capeGrad: ['#0f172a', '#1e293b'],
        hairColor: '#334155',
        trimColor: '#06b6d4',
        sparkleColor: '#22d3ee',
        tunicGrad: ['#020617', '#0f172a']
      }
    ];

    const frontImg = new Image();
    await new Promise(r => {
      frontImg.onload = r;
      frontImg.src = frontUri;
    });

    const fW = frontImg.naturalWidth || 512;
    const fH = frontImg.naturalHeight || 512;

    for (const c of chars) {
      // 2.1 Front Sprite
      const { canvas: fCanvas, ctx: fCtx } = helperCanvas(fW, fH);
      fCtx.filter = `hue-rotate(${c.hue}deg) saturate(1.2)`;
      fCtx.drawImage(frontImg, 0, 0, fW, fH);
      fCtx.filter = 'none';

      // Character-specific aura & emblem
      const aura = fCtx.createRadialGradient(fW / 2, fH * 0.45, 10, fW / 2, fH * 0.45, fW * 0.45);
      aura.addColorStop(0, 'transparent');
      aura.addColorStop(0.85, 'transparent');
      aura.addColorStop(1, c.sparkleColor + '44');
      fCtx.fillStyle = aura;
      fCtx.fillRect(0, 0, fW, fH);

      results[`${c.id}_front.png`] = fCanvas.toDataURL('image/png');

      // 2.2 4-Frame Run Stride Sprites for character
      for (let f = 1; f <= 4; f++) {
        const { canvas: rCanvas, ctx: rCtx } = helperCanvas(W, H);
        rCtx.filter = `hue-rotate(${c.hue}deg) saturate(1.15)`;
        rCtx.drawImage(runImg, 0, (f === 2 || f === 4) ? -10 : 5, W, H);
        rCtx.filter = 'none';

        // Colored Stride Boots & Sparks
        rCtx.save();
        const bootColor = c.tunicGrad[0];
        const accent = c.trimColor;
        if (f === 1) {
          rCtx.fillStyle = bootColor;
          rCtx.beginPath();
          rCtx.ellipse(W * 0.38, H * 0.94, 22, 12, -0.15, 0, Math.PI * 2);
          rCtx.fill();
          rCtx.strokeStyle = accent;
          rCtx.lineWidth = 4;
          rCtx.stroke();
        } else if (f === 3) {
          rCtx.fillStyle = bootColor;
          rCtx.beginPath();
          rCtx.ellipse(W * 0.62, H * 0.94, 22, 12, 0.15, 0, Math.PI * 2);
          rCtx.fill();
          rCtx.strokeStyle = accent;
          rCtx.lineWidth = 4;
          rCtx.stroke();
        }
        rCtx.restore();

        results[`${c.id}_run_f${f}.png`] = rCanvas.toDataURL('image/png');
      }

      // Jump Sprite
      const { canvas: jCanvas, ctx: jCtx } = helperCanvas(W, H);
      jCtx.filter = `hue-rotate(${c.hue}deg) saturate(1.2)`;
      jCtx.drawImage(runImg, 0, -28, W, H * 0.94);
      results[`${c.id}_jump.png`] = jCanvas.toDataURL('image/png');

      // Slide Sprite
      const { canvas: sCanvas, ctx: sCtx } = helperCanvas(W, H);
      sCtx.filter = `hue-rotate(${c.hue}deg) saturate(1.2)`;
      sCtx.drawImage(runImg, 0, H * 0.35, W, H * 0.65);
      results[`${c.id}_slide.png`] = sCanvas.toDataURL('image/png');
    }

    // ----------------------------------------------------
    // 3. Mystery Chest Prop Sprite & UI Icons
    // ----------------------------------------------------
    const { canvas: chestCanvas, ctx: cCtx } = helperCanvas(256, 256);
    // Draw Celestial Ornate Treasure Chest
    // Base chest body
    cCtx.shadowColor = '#fbbf24';
    cCtx.shadowBlur = 20;

    const chestGrad = cCtx.createLinearGradient(40, 100, 216, 230);
    chestGrad.addColorStop(0, '#1e1b4b');
    chestGrad.addColorStop(0.5, '#312e81');
    chestGrad.addColorStop(1, '#0f172a');
    cCtx.fillStyle = chestGrad;
    cCtx.beginPath();
    cCtx.roundRect(40, 110, 176, 110, 16);
    cCtx.fill();

    // Chest Lid
    const lidGrad = cCtx.createLinearGradient(30, 40, 226, 120);
    lidGrad.addColorStop(0, '#4338ca');
    lidGrad.addColorStop(0.5, '#6366f1');
    lidGrad.addColorStop(1, '#312e81');
    cCtx.fillStyle = lidGrad;
    cCtx.beginPath();
    cCtx.roundRect(34, 55, 188, 65, [24, 24, 8, 8]);
    cCtx.fill();

    // Gold Metal Bands
    cCtx.fillStyle = '#fbbf24';
    cCtx.fillRect(40, 105, 176, 12);
    cCtx.fillRect(70, 55, 16, 165);
    cCtx.fillRect(170, 55, 16, 165);

    // Glowing Celestial Moon Core Lock
    const lockGrad = cCtx.createRadialGradient(128, 125, 4, 128, 125, 24);
    lockGrad.addColorStop(0, '#ffffff');
    lockGrad.addColorStop(0.4, '#38bdf8');
    lockGrad.addColorStop(1, '#0284c7');
    cCtx.fillStyle = lockGrad;
    cCtx.beginPath();
    cCtx.arc(128, 125, 20, 0, Math.PI * 2);
    cCtx.fill();

    cCtx.fillStyle = '#ffffff';
    cCtx.beginPath();
    cCtx.arc(128, 125, 8, 0, Math.PI * 2);
    cCtx.fill();

    results['chest_mystery.png'] = chestCanvas.toDataURL('image/png');
    results['icon_chest.png'] = chestCanvas.toDataURL('image/png');

    // ----------------------------------------------------
    // 4. Character Skill Icons & Gacha Icon
    // ----------------------------------------------------
    function createSkillIcon(bgGradColors, symbolDraw) {
      const { canvas, ctx } = helperCanvas(128, 128);
      ctx.shadowColor = bgGradColors[1];
      ctx.shadowBlur = 12;

      // Circle Badge
      const bg = ctx.createLinearGradient(0, 0, 128, 128);
      bg.addColorStop(0, bgGradColors[0]);
      bg.addColorStop(1, bgGradColors[1]);
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(64, 64, 56, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Inner Symbol
      symbolDraw(ctx);
      return canvas.toDataURL('image/png');
    }

    // Luna: Moonlight Crescent Slash
    results['skill_luna.png'] = createSkillIcon(['#1e1b4b', '#0284c7'], (ctx) => {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(64, 64, 32, -Math.PI * 0.4, Math.PI * 0.8, false);
      ctx.bezierCurveTo(76, 50, 70, 78, 64, 96);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(68, 56, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Stella: Starfall Rain
    results['skill_stella.png'] = createSkillIcon(['#4c1d95', '#a855f7'], (ctx) => {
      ctx.fillStyle = '#fde047';
      // 4-pointed Star
      ctx.beginPath();
      ctx.moveTo(64, 28);
      ctx.lineTo(72, 54);
      ctx.lineTo(98, 64);
      ctx.lineTo(72, 74);
      ctx.lineTo(64, 100);
      ctx.lineTo(56, 74);
      ctx.lineTo(30, 64);
      ctx.lineTo(56, 54);
      ctx.closePath();
      ctx.fill();
    });

    // Solaris: Solar Dash
    results['skill_solaris.png'] = createSkillIcon(['#78350f', '#f59e0b'], (ctx) => {
      // Blazing sun with rays
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(64, 64, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Dash arrows
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(56, 50);
      ctx.lineTo(78, 64);
      ctx.lineTo(56, 78);
      ctx.closePath();
      ctx.fill();
    });

    // Nyx: Shadow Phantasm
    results['skill_nyx.png'] = createSkillIcon(['#020617', '#0891b2'], (ctx) => {
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(64, 64, 26, 0, Math.PI * 2);
      ctx.fill();

      // Phantom eye slit
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(64, 64, 20, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Gacha Summon Icon
    results['icon_gacha.png'] = createSkillIcon(['#581c87', '#ec4899'], (ctx) => {
      // Starlight portal vortex
      const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 38);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.5, '#f472b6');
      g.addColorStop(1, '#a855f7');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(64, 64, 34, 0, Math.PI * 2);
      ctx.fill();
    });

    // ----------------------------------------------------
    // 5. 10 Photorealistic Stage Horizon Scenery Backdrops
    // ----------------------------------------------------
    const stageThemes = [
      { id: 1, name: 'Moonlit Ruins', top: '#030712', mid: '#0f172a', bot: '#1e293b', moon: '#38bdf8' },
      { id: 2, name: 'Amethyst Sanctuary', top: '#1e1035', mid: '#2e1065', bot: '#4c1d95', moon: '#c084fc' },
      { id: 3, name: 'Emerald Grove', top: '#022c22', mid: '#064e3b', bot: '#065f46', moon: '#34d399' },
      { id: 4, name: 'Desert Oasis', top: '#291804', mid: '#451a03', bot: '#78350f', moon: '#fde047' },
      { id: 5, name: 'Frozen Glacier', top: '#082f49', mid: '#075985', bot: '#0284c7', moon: '#a5f3fc' },
      { id: 6, name: 'Twilight Altar', top: '#3b0764', mid: '#581c87', bot: '#701a75', moon: '#f472b6' },
      { id: 7, name: 'Solar Eclipse', top: '#451a03', mid: '#7c2d12', bot: '#9a3412', moon: '#fbbf24' },
      { id: 8, name: 'Blood Moon Abyss', top: '#3f0713', mid: '#680d21', bot: '#881337', moon: '#f43f5e' },
      { id: 9, name: 'Void Warp Rift', top: '#020617', mid: '#111827', bot: '#1e1b4b', moon: '#818cf8' },
      { id: 10, name: 'Moonlight Chaos', top: '#09090b', mid: '#18181b', bot: '#27272a', moon: '#ffffff' }
    ];

    for (const st of stageThemes) {
      const { canvas, ctx } = helperCanvas(1024, 512);

      // Sky Gradient
      const sky = ctx.createLinearGradient(0, 0, 0, 512);
      sky.addColorStop(0, st.top);
      sky.addColorStop(0.6, st.mid);
      sky.addColorStop(1, st.bot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 1024, 512);

      // Starfield
      for (let s = 0; s < 150; s++) {
        const sx = Math.random() * 1024;
        const sy = Math.random() * 340;
        const sr = Math.random() * 1.8 + 0.5;
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (Math.random() * 0.8 + 0.2) + ')';
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Celestial Orb / Giant Moon in Horizon
      const moonX = 720;
      const moonY = 160;
      const moonR = 90;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.7, moonX, moonY, moonR * 1.8);
      moonGlow.addColorStop(0, st.moon);
      moonGlow.addColorStop(0.6, st.moon + '44');
      moonGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Mountain / Temple Horizon Silhouettes
      ctx.fillStyle = st.top + 'cc';
      ctx.beginPath();
      ctx.moveTo(0, 512);
      ctx.lineTo(0, 380);
      for (let x = 0; x <= 1024; x += 64) {
        const hVar = Math.sin(x * 0.015 + st.id) * 60 + Math.cos(x * 0.03) * 35;
        ctx.lineTo(x, 380 + hVar);
      }
      ctx.lineTo(1024, 512);
      ctx.closePath();
      ctx.fill();

      results[`bg_stage${st.id}.png`] = canvas.toDataURL('image/png');
    }

    return results;
  }, lunaRunUri, lunaFrontUri);

  // Write all generated files
  for (const [filename, dataUrl] of Object.entries(generated)) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const targetPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
    console.log(`Saved ${filename} (${(base64Data.length / 1024).toFixed(1)} KB)`);
  }

  await browser.close();
  console.log('--- All V3 Assets Generated Successfully! ---');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
