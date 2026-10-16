import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log('🌟 Generating High-Definition Anime Hero Sprites for Solaris and Nyx (896x1200 RGBA)...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const generated = await page.evaluate(async () => {
    const results = {};
    const W = 896;
    const H = 1200;

    function helperCanvas(w = W, h = H) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return { canvas: c, ctx: c.getContext('2d') };
    }

    // =========================================================================
    // 1. SOLARIS - VALIANT SUN PALADIN KNIGHT (남성 태양의 성기사)
    // =========================================================================
    function drawSolaris(theme = 'default', pose = 'front') {
      const { canvas, ctx } = helperCanvas();

      // Theme color palette definitions
      let goldMain = '#f59e0b';
      let goldLight = '#fef08a';
      let goldDark = '#b45309';
      let goldDeep = '#78350f';
      let capeMain = '#dc2626';
      let capeLight = '#ef4444';
      let capeDark = '#991b1b';
      let tunicMain = '#f8fafc';
      let tunicShade = '#cbd5e1';
      let hairMain = '#fde047';
      let hairShade = '#d97706';
      let eyeColor = '#d97706';
      let auraColor = '#fbbf24';

      if (theme === 'obsidian') {
        goldMain = '#f97316';
        goldLight = '#fdba74';
        goldDark = '#c2410c';
        goldDeep = '#7c2d12';
        capeMain = '#7f1d1d';
        capeLight = '#991b1b';
        capeDark = '#450a0a';
        tunicMain = '#18181b';
        tunicShade = '#27272a';
        hairMain = '#71717a';
        hairShade = '#3f3f46';
        eyeColor = '#f97316';
        auraColor = '#ea580c';
      } else if (theme === 'phoenix') {
        goldMain = '#f59e0b';
        goldLight = '#fde047';
        goldDark = '#b45309';
        goldDeep = '#78350f';
        capeMain = '#f43f5e';
        capeLight = '#fb7185';
        capeDark = '#be123c';
        tunicMain = '#fff1f2';
        tunicShade = '#fecdd3';
        hairMain = '#fef08a';
        hairShade = '#eab308';
        eyeColor = '#f43f5e';
        auraColor = '#f43f5e';
      }

      ctx.clearRect(0, 0, W, H);

      // --- Radiant Starlight / Solar Flare Aura ---
      const auraGrad = ctx.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, W * 0.46);
      auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      auraGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
      auraGrad.addColorStop(0.95, `${auraColor}22`);
      auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, W, H);

      // Drifting Solar Embers / Sparkles
      ctx.save();
      const sparkSeed = pose === 'front' ? 10 : pose === 'run_f1' ? 20 : pose === 'run_f2' ? 30 : 40;
      for (let i = 0; i < 28; i++) {
        const sx = (Math.sin(i * 13 + sparkSeed) * 0.5 + 0.5) * (W * 0.7) + W * 0.15;
        const sy = (Math.cos(i * 17 + sparkSeed) * 0.5 + 0.5) * (H * 0.8) + H * 0.1;
        const sr = 2 + (i % 4);
        ctx.fillStyle = i % 2 === 0 ? goldLight : '#ffffff';
        ctx.shadowColor = auraColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ==========================================================
      // POSES: FRONT vs RUN vs JUMP vs SLIDE
      // ==========================================================
      if (pose === 'front') {
        // --- 1. BILLOWING ROYAL CAPE (Back Layer) ---
        ctx.save();
        const capeGrad = ctx.createLinearGradient(W / 2, 350, W / 2, 1080);
        capeGrad.addColorStop(0, capeLight);
        capeGrad.addColorStop(0.5, capeMain);
        capeGrad.addColorStop(1, capeDark);
        ctx.fillStyle = capeGrad;

        ctx.beginPath();
        ctx.moveTo(310, 370);
        ctx.bezierCurveTo(240, 520, 210, 780, 230, 1050);
        ctx.bezierCurveTo(340, 1080, 556, 1080, 666, 1050);
        ctx.bezierCurveTo(686, 780, 656, 520, 586, 370);
        ctx.closePath();
        ctx.fill();

        // Cape gold embroidered trim
        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 8;
        ctx.stroke();

        // Cape interior shadow folds
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.moveTo(250, 600);
        ctx.bezierCurveTo(290, 800, 270, 950, 310, 1060);
        ctx.lineTo(270, 1055);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(646, 600);
        ctx.bezierCurveTo(606, 800, 626, 950, 586, 1060);
        ctx.lineTo(626, 1055);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // --- 2. LEGS & ARMORED GREAVES (Heroic Standing Stance) ---
        // Left Leg & Right Leg (Athletic Male Paladin Stance)
        const legPositions = [
          { hipX: 380, footX: 360, isLeft: true },
          { hipX: 516, footX: 536, isLeft: false }
        ];

        legPositions.forEach(leg => {
          // Thigh armor
          ctx.save();
          ctx.fillStyle = tunicShade;
          ctx.beginPath();
          ctx.moveTo(leg.hipX - 35, 680);
          ctx.lineTo(leg.hipX + 35, 680);
          ctx.lineTo(leg.footX + 30, 880);
          ctx.lineTo(leg.footX - 30, 880);
          ctx.closePath();
          ctx.fill();

          // Knee Cops (Gold plate)
          const kneeGrad = ctx.createLinearGradient(leg.footX - 36, 860, leg.footX + 36, 920);
          kneeGrad.addColorStop(0, goldLight);
          kneeGrad.addColorStop(0.6, goldMain);
          kneeGrad.addColorStop(1, goldDark);
          ctx.fillStyle = kneeGrad;
          ctx.beginPath();
          ctx.arc(leg.footX, 890, 34, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = goldLight;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Fluted Greaves (Lower leg plate armor)
          const greaveGrad = ctx.createLinearGradient(leg.footX - 34, 910, leg.footX + 34, 1070);
          greaveGrad.addColorStop(0, goldLight);
          greaveGrad.addColorStop(0.5, goldMain);
          greaveGrad.addColorStop(1, goldDark);
          ctx.fillStyle = greaveGrad;
          ctx.beginPath();
          ctx.moveTo(leg.footX - 32, 910);
          ctx.lineTo(leg.footX + 32, 910);
          ctx.lineTo(leg.footX + 36, 1070);
          ctx.lineTo(leg.footX - 36, 1070);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = goldLight;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Armored Sabatons (Boots)
          const bootGrad = ctx.createLinearGradient(leg.footX - 44, 1070, leg.footX + 44, 1140);
          bootGrad.addColorStop(0, goldMain);
          bootGrad.addColorStop(0.7, goldDark);
          bootGrad.addColorStop(1, goldDeep);
          ctx.fillStyle = bootGrad;
          ctx.beginPath();
          ctx.ellipse(leg.footX + (leg.isLeft ? -6 : 6), 1105, 48, 26, leg.isLeft ? -0.1 : 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = goldLight;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        });

        // --- 3. TORSO & WAIST FAULDS / BELT ---
        ctx.save();
        // White Royal Tunic Undergarment
        ctx.fillStyle = tunicMain;
        ctx.beginPath();
        ctx.moveTo(370, 520);
        ctx.lineTo(526, 520);
        ctx.lineTo(556, 700);
        ctx.lineTo(340, 700);
        ctx.closePath();
        ctx.fill();

        // Gold Faulds (Waist Armor Plating)
        const fauldGrad = ctx.createLinearGradient(350, 580, 546, 720);
        fauldGrad.addColorStop(0, goldLight);
        fauldGrad.addColorStop(0.5, goldMain);
        fauldGrad.addColorStop(1, goldDark);
        ctx.fillStyle = fauldGrad;
        ctx.beginPath();
        ctx.moveTo(375, 580);
        ctx.lineTo(521, 580);
        ctx.lineTo(550, 690);
        ctx.lineTo(448, 730);
        ctx.lineTo(346, 690);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Broad Paladin Breastplate (Cuirass)
        const chestGrad = ctx.createLinearGradient(330, 340, 566, 560);
        chestGrad.addColorStop(0, goldLight);
        chestGrad.addColorStop(0.4, goldMain);
        chestGrad.addColorStop(0.8, goldDark);
        chestGrad.addColorStop(1, goldDeep);
        ctx.fillStyle = chestGrad;
        ctx.beginPath();
        ctx.moveTo(330, 360);
        ctx.lineTo(566, 360);
        ctx.bezierCurveTo(556, 470, 530, 550, 510, 580);
        ctx.lineTo(386, 580);
        ctx.bezierCurveTo(366, 550, 340, 470, 330, 360);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 6;
        ctx.stroke();

        // Sculpted Sun / Roaring Lion Crest on Breastplate
        ctx.fillStyle = goldLight;
        ctx.shadowColor = goldMain;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(448, 440, 42, 0, Math.PI * 2);
        ctx.fill();
        // Sun rays radiating from lion crest
        for (let r = 0; r < 8; r++) {
          const ang = (r * Math.PI) / 4;
          const rx1 = 448 + Math.cos(ang) * 44;
          const ry1 = 440 + Math.sin(ang) * 44;
          const rx2 = 448 + Math.cos(ang) * 62;
          const ry2 = 440 + Math.sin(ang) * 62;
          ctx.beginPath();
          ctx.moveTo(rx1, ry1);
          ctx.lineTo(rx2, ry2);
          ctx.strokeStyle = goldLight;
          ctx.lineWidth = 6;
          ctx.stroke();
        }
        ctx.restore();

        // --- 4. ARMS, GAUNTLETS & PALADIN BROADSWORD ---
        // Left Arm & Gauntlet
        ctx.save();
        const armGrad = ctx.createLinearGradient(270, 360, 330, 560);
        armGrad.addColorStop(0, goldLight);
        armGrad.addColorStop(0.5, goldMain);
        armGrad.addColorStop(1, goldDark);
        ctx.fillStyle = armGrad;
        ctx.beginPath();
        ctx.moveTo(320, 370);
        ctx.lineTo(280, 540);
        ctx.lineTo(326, 560);
        ctx.lineTo(356, 420);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Right Arm & Gauntlet gripping Sheathed Sword
        ctx.fillStyle = armGrad;
        ctx.beginPath();
        ctx.moveTo(576, 370);
        ctx.lineTo(616, 540);
        ctx.lineTo(570, 560);
        ctx.lineTo(540, 420);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Sheathed Paladin Sword at left hip
        ctx.fillStyle = goldDark;
        ctx.beginPath();
        ctx.moveTo(310, 510);
        ctx.lineTo(260, 840);
        ctx.lineTo(280, 844);
        ctx.lineTo(330, 514);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 4;
        ctx.stroke();
        // Sword Pommel & Crossguard
        ctx.fillStyle = goldLight;
        ctx.fillRect(300, 480, 35, 16);
        ctx.fillRect(312, 450, 11, 30);
        ctx.beginPath();
        ctx.arc(317, 444, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- 5. BROAD SHOULDERS & ORNATE LION PAULDRONS ---
        const pauldrons = [
          { cx: 310, cy: 360, rad: 58, tilt: -0.2 },
          { cx: 586, cy: 360, rad: 58, tilt: 0.2 }
        ];
        pauldrons.forEach(p => {
          ctx.save();
          const pGrad = ctx.createRadialGradient(p.cx - 10, p.cy - 10, 5, p.cx, p.cy, p.rad);
          pGrad.addColorStop(0, goldLight);
          pGrad.addColorStop(0.5, goldMain);
          pGrad.addColorStop(1, goldDark);
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.ellipse(p.cx, p.cy, p.rad, p.rad * 0.85, p.tilt, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = goldLight;
          ctx.lineWidth = 6;
          ctx.stroke();

          // Pauldron lion gem accent
          ctx.fillStyle = capeLight;
          ctx.beginPath();
          ctx.arc(p.cx, p.cy + 6, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // --- 6. HEAD, HANDSOME MALE FACE & DETERMINED AMBER EYES ---
        // Neck & Gorget (Neck armor)
        ctx.save();
        const gorgetGrad = ctx.createLinearGradient(410, 290, 486, 350);
        gorgetGrad.addColorStop(0, goldLight);
        gorgetGrad.addColorStop(1, goldDark);
        ctx.fillStyle = gorgetGrad;
        ctx.beginPath();
        ctx.moveTo(406, 310);
        ctx.lineTo(490, 310);
        ctx.lineTo(476, 360);
        ctx.lineTo(420, 360);
        ctx.closePath();
        ctx.fill();

        // Handsome Anime Face & Sharp Jawline
        ctx.fillStyle = '#ffedd5'; // Fair athletic anime skin tone
        ctx.beginPath();
        ctx.moveTo(396, 210);
        ctx.bezierCurveTo(396, 280, 420, 320, 448, 335); // Pointed heroic chin
        ctx.bezierCurveTo(476, 320, 500, 280, 500, 210);
        ctx.closePath();
        ctx.fill();

        // Ear accents
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(394, 240, 10, 18, -0.15, 0, Math.PI * 2);
        ctx.ellipse(502, 240, 10, 18, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Anime Eyes (Fierce & Determined Male Amber Eyes)
        const eyeY = 240;
        [-1, 1].forEach(side => {
          const eyeX = 448 + side * 28;
          // White of eye
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(eyeX, eyeY, 14, 9, side * 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Glowing Amber Iris
          ctx.fillStyle = eyeColor;
          ctx.beginPath();
          ctx.arc(eyeX, eyeY, 7, 0, Math.PI * 2);
          ctx.fill();

          // Pupil & Sparkle
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(eyeX - 2, eyeY - 2, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Strong confident eyebrow
          ctx.strokeStyle = hairShade;
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(eyeX - side * 16, eyeY - 14);
          ctx.lineTo(eyeX + side * 14, eyeY - 12);
          ctx.stroke();
        });

        // Handsome nose bridge & confident smile
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(448, 252);
        ctx.lineTo(446, 272);
        ctx.lineTo(452, 274);
        ctx.stroke();

        ctx.strokeStyle = '#9a3412';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(448, 290, 12, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.restore();

        // --- 7. STYLISH SPIKY GOLDEN-BLOND ANIME HAIR ---
        ctx.save();
        const hairGrad = ctx.createLinearGradient(400, 110, 500, 240);
        hairGrad.addColorStop(0, goldLight);
        hairGrad.addColorStop(0.5, hairMain);
        hairGrad.addColorStop(1, hairShade);
        ctx.fillStyle = hairGrad;

        // Big dynamic spiky hair locks framing handsome head
        ctx.beginPath();
        ctx.moveTo(448, 110);
        ctx.lineTo(420, 140);
        ctx.lineTo(390, 120);
        ctx.lineTo(370, 170);
        ctx.lineTo(348, 160);
        ctx.lineTo(354, 215);
        ctx.lineTo(380, 220); // Left cheek locks
        ctx.lineTo(405, 230);
        ctx.lineTo(420, 210); // Forehead bang 1
        ctx.lineTo(435, 225);
        ctx.lineTo(448, 195); // Forehead center bang
        ctx.lineTo(462, 225);
        ctx.lineTo(478, 210); // Forehead bang 2
        ctx.lineTo(495, 230);
        ctx.lineTo(518, 220); // Right cheek locks
        ctx.lineTo(544, 215);
        ctx.lineTo(550, 160);
        ctx.lineTo(528, 170);
        ctx.lineTo(508, 120);
        ctx.lineTo(478, 140);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Golden hair highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(448, 145, 40, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else {
        // ==========================================================
        // RUN / JUMP / SLIDE CYCLE (Seen from behind / 3rd-person runner)
        // ==========================================================
        const isRun1 = pose === 'run_f1';
        const isRun2 = pose === 'run_f2';
        const isRun3 = pose === 'run_f3';
        const isRun4 = pose === 'run_f4';
        const isJump = pose === 'jump';
        const isSlide = pose === 'slide';

        const yBounce = (isRun2 || isRun4) ? -28 : isJump ? -65 : isSlide ? 80 : 0;
        const capeBillow = isRun1 ? 45 : isRun3 ? -45 : isJump ? 75 : 0;

        ctx.save();
        ctx.translate(0, yBounce);

        // --- 1. BILLOWING ROYAL CAPE (Seen from behind) ---
        ctx.save();
        const capeGrad = ctx.createLinearGradient(W / 2, 320, W / 2 + capeBillow, 1080);
        capeGrad.addColorStop(0, capeLight);
        capeGrad.addColorStop(0.5, capeMain);
        capeGrad.addColorStop(1, capeDark);
        ctx.fillStyle = capeGrad;

        ctx.beginPath();
        ctx.moveTo(310, 360);
        ctx.bezierCurveTo(240 + capeBillow, 500, 190 + capeBillow * 1.5, 780, 220 + capeBillow * 2, 1060);
        ctx.bezierCurveTo(340 + capeBillow, 1100, 556 + capeBillow, 1100, 676 + capeBillow * 2, 1060);
        ctx.bezierCurveTo(706 + capeBillow * 1.5, 780, 656 + capeBillow, 500, 586, 360);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();

        // --- 2. RUNNING LEGS & HEAVY GOLDEN GREAVES ---
        if (isRun1) {
          // Left Foot Planted Forward (Ground y = 1120), Right Foot Kicking Back High (y = 960)
          // Left Leg (Planted Forward)
          drawRunnerLeg(ctx, 380, 1110, true, goldLight, goldMain, goldDark, goldDeep, true);
          // Right Leg (Bent back high in stride)
          drawRunnerLeg(ctx, 536, 960, false, goldLight, goldMain, goldDark, goldDeep, false);
        } else if (isRun2) {
          // Passing airborne stride
          drawRunnerLeg(ctx, 400, 1030, true, goldLight, goldMain, goldDark, goldDeep, false);
          drawRunnerLeg(ctx, 510, 1050, false, goldLight, goldMain, goldDark, goldDeep, false);
        } else if (isRun3) {
          // Right Foot Planted Forward (Ground y = 1120), Left Foot Kicking Back High (y = 960)
          drawRunnerLeg(ctx, 380, 960, true, goldLight, goldMain, goldDark, goldDeep, false);
          drawRunnerLeg(ctx, 536, 1110, false, goldLight, goldMain, goldDark, goldDeep, true);
        } else if (isRun4) {
          // Passing airborne stride 2
          drawRunnerLeg(ctx, 410, 1050, true, goldLight, goldMain, goldDark, goldDeep, false);
          drawRunnerLeg(ctx, 500, 1030, false, goldLight, goldMain, goldDark, goldDeep, false);
        } else if (isJump) {
          // Airborne tucked legs
          drawRunnerLeg(ctx, 390, 940, true, goldLight, goldMain, goldDark, goldDeep, false);
          drawRunnerLeg(ctx, 526, 940, false, goldLight, goldMain, goldDark, goldDeep, false);
        } else if (isSlide) {
          // Low slide extended legs
          drawRunnerLeg(ctx, 360, 1140, true, goldLight, goldMain, goldDark, goldDeep, true);
          drawRunnerLeg(ctx, 580, 1140, false, goldLight, goldMain, goldDark, goldDeep, true);
        }

        // --- 3. BROAD BACK PLATE & PAULDRONS (Seen from behind) ---
        ctx.save();
        const backGrad = ctx.createLinearGradient(330, 330, 566, 520);
        backGrad.addColorStop(0, goldLight);
        backGrad.addColorStop(0.5, goldMain);
        backGrad.addColorStop(1, goldDark);
        ctx.fillStyle = backGrad;
        ctx.beginPath();
        ctx.moveTo(330, 340);
        ctx.lineTo(566, 340);
        ctx.lineTo(540, 530);
        ctx.lineTo(356, 530);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 6;
        ctx.stroke();

        // Golden Pauldrons (Top view from behind)
        ctx.beginPath();
        ctx.ellipse(310, 340, 52, 44, -0.2, 0, Math.PI * 2);
        ctx.ellipse(586, 340, 52, 44, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // --- 4. BACK OF HEAD & SPIKY HAIR (Seen from behind) ---
        ctx.save();
        const hairBackGrad = ctx.createLinearGradient(400, 100, 500, 280);
        hairBackGrad.addColorStop(0, goldLight);
        hairBackGrad.addColorStop(0.5, hairMain);
        hairBackGrad.addColorStop(1, hairShade);
        ctx.fillStyle = hairBackGrad;

        ctx.beginPath();
        ctx.moveTo(448, 100);
        ctx.lineTo(410, 130);
        ctx.lineTo(370, 110);
        ctx.lineTo(346, 170);
        ctx.lineTo(330, 220);
        ctx.lineTo(360, 260);
        ctx.lineTo(410, 290);
        ctx.lineTo(448, 295);
        ctx.lineTo(486, 290);
        ctx.lineTo(536, 260);
        ctx.lineTo(566, 220);
        ctx.lineTo(550, 170);
        ctx.lineTo(526, 110);
        ctx.lineTo(486, 130);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldLight;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();

        ctx.restore(); // restore translation
      }

      return canvas.toDataURL('image/png');
    }

    // Helper for drawing athletic runner legs
    function drawRunnerLeg(ctx, x, y, isLeft, lightCol, mainCol, darkCol, deepCol, isPlanted) {
      ctx.save();
      // Greave plate
      const gGrad = ctx.createLinearGradient(x - 30, y - 100, x + 30, y);
      gGrad.addColorStop(0, lightCol);
      gGrad.addColorStop(0.6, mainCol);
      gGrad.addColorStop(1, darkCol);
      ctx.fillStyle = gGrad;
      ctx.beginPath();
      ctx.moveTo(x - 28, y - 100);
      ctx.lineTo(x + 28, y - 100);
      ctx.lineTo(x + 32, y - 20);
      ctx.lineTo(x - 32, y - 20);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = lightCol;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Knee cop
      ctx.fillStyle = lightCol;
      ctx.beginPath();
      ctx.arc(x, y - 100, 28, 0, Math.PI * 2);
      ctx.fill();

      // Sabaton (Armored Boot)
      const bGrad = ctx.createLinearGradient(x - 40, y - 25, x + 40, y + 25);
      bGrad.addColorStop(0, mainCol);
      bGrad.addColorStop(1, deepCol);
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.ellipse(x + (isLeft ? -8 : 8), y + 6, 44, 22, isLeft ? -0.15 : 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = lightCol;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Ground impact starlight burst for planted foot
      if (isPlanted) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x, y + 22, 55, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // =========================================================================
    // 2. NYX - SLEEK SHADOW ASSASSIN ROGUE (남성 밤의 그림자 닉스)
    // =========================================================================
    function drawNyx(theme = 'default', pose = 'front') {
      const { canvas, ctx } = helperCanvas();

      // Theme color palette definitions
      let suitMain = '#090d16';
      let suitShade = '#020617';
      let suitHighlight = '#1e293b';
      let runeColor = '#06b6d4';
      let runeGlow = '#22d3ee';
      let scarfMain = '#0f172a';
      let scarfHighlight = '#0284c7';
      let hairMain = '#1e293b';
      let hairHighlight = '#38bdf8';
      let bladeGlow = '#22d3ee';

      if (theme === 'cyber') {
        suitMain = '#05050f';
        suitShade = '#000005';
        suitHighlight = '#1e1035';
        runeColor = '#ec4899';
        runeGlow = '#f43f5e';
        scarfMain = '#06b6d4';
        scarfHighlight = '#22d3ee';
        hairMain = '#2e1065';
        hairHighlight = '#a855f7';
        bladeGlow = '#f43f5e';
      } else if (theme === 'bloodmoon') {
        suitMain = '#0c0708';
        suitShade = '#000000';
        suitHighlight = '#1c0a0c';
        runeColor = '#dc2626';
        runeGlow = '#ef4444';
        scarfMain = '#7f1d1d';
        scarfHighlight = '#991b1b';
        hairMain = '#18181b';
        hairHighlight = '#ef4444';
        bladeGlow = '#ef4444';
      }

      ctx.clearRect(0, 0, W, H);

      // --- Ethereal Shadow Smoke & Cyan Particle Aura ---
      const shadowGrad = ctx.createRadialGradient(W / 2, H * 0.48, 50, W / 2, H * 0.48, W * 0.45);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.92, `${runeColor}20`);
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(0, 0, W, H);

      // Drifting Cyan Rune Particles
      ctx.save();
      const sparkSeed = pose === 'front' ? 55 : pose === 'run_f1' ? 65 : 75;
      for (let i = 0; i < 26; i++) {
        const sx = (Math.sin(i * 19 + sparkSeed) * 0.5 + 0.5) * (W * 0.7) + W * 0.15;
        const sy = (Math.cos(i * 23 + sparkSeed) * 0.5 + 0.5) * (H * 0.8) + H * 0.1;
        const sr = 2 + (i % 3);
        ctx.fillStyle = runeGlow;
        ctx.shadowColor = runeColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ==========================================================
      // POSES: FRONT vs RUN vs JUMP vs SLIDE
      // ==========================================================
      if (pose === 'front') {
        // --- 1. BILLOWING SHADOW SCARF (Back Layer) ---
        ctx.save();
        const scarfGrad = ctx.createLinearGradient(W / 2, 280, W / 2 + 100, 1050);
        scarfGrad.addColorStop(0, scarfHighlight);
        scarfGrad.addColorStop(0.5, scarfMain);
        scarfGrad.addColorStop(1, 'rgba(2, 6, 23, 0.2)');
        ctx.fillStyle = scarfGrad;

        ctx.beginPath();
        ctx.moveTo(380, 310);
        ctx.bezierCurveTo(260, 480, 220, 720, 250, 1020);
        ctx.bezierCurveTo(280, 1040, 330, 980, 340, 850);
        ctx.bezierCurveTo(360, 680, 410, 480, 420, 320);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = runeGlow;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Right scarf wing
        ctx.beginPath();
        ctx.moveTo(476, 320);
        ctx.bezierCurveTo(560, 480, 680, 720, 690, 1020);
        ctx.bezierCurveTo(660, 1040, 610, 980, 580, 850);
        ctx.bezierCurveTo(550, 680, 510, 480, 480, 310);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // --- 2. LEGS & SHADOW SHINOBI BOOTS (Agile Athletic Stance) ---
        const legs = [
          { hipX: 386, footX: 370, isLeft: true },
          { hipX: 510, footX: 526, isLeft: false }
        ];

        legs.forEach(leg => {
          ctx.save();
          // Dark stealth leather pants
          ctx.fillStyle = suitShade;
          ctx.beginPath();
          ctx.moveTo(leg.hipX - 30, 660);
          ctx.lineTo(leg.hipX + 30, 660);
          ctx.lineTo(leg.footX + 24, 880);
          ctx.lineTo(leg.footX - 24, 880);
          ctx.closePath();
          ctx.fill();

          // Wrapped calf shinobi bandages with cyan runic lines
          const wrapGrad = ctx.createLinearGradient(leg.footX - 26, 880, leg.footX + 26, 1060);
          wrapGrad.addColorStop(0, suitMain);
          wrapGrad.addColorStop(1, suitHighlight);
          ctx.fillStyle = wrapGrad;
          ctx.fillRect(leg.footX - 24, 880, 48, 180);

          // Runic Circuit Lines on calf
          ctx.strokeStyle = runeColor;
          ctx.lineWidth = 3;
          ctx.shadowColor = runeGlow;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(leg.footX - 18, 900);
          ctx.lineTo(leg.footX, 930);
          ctx.lineTo(leg.footX - 14, 980);
          ctx.lineTo(leg.footX + 16, 1040);
          ctx.stroke();

          // Sleek Assassin Boots
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.ellipse(leg.footX + (leg.isLeft ? -5 : 5), 1090, 42, 22, leg.isLeft ? -0.1 : 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = runeColor;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        });

        // --- 3. SLEEK LEATHER ASSASSIN TUNIC & UTILITY HARNESS ---
        ctx.save();
        const bodyGrad = ctx.createLinearGradient(350, 360, 546, 680);
        bodyGrad.addColorStop(0, suitHighlight);
        bodyGrad.addColorStop(0.5, suitMain);
        bodyGrad.addColorStop(1, suitShade);
        ctx.fillStyle = bodyGrad;

        // V-shaped agile torso
        ctx.beginPath();
        ctx.moveTo(350, 370);
        ctx.lineTo(546, 370);
        ctx.lineTo(516, 660);
        ctx.lineTo(380, 660);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = suitHighlight;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Glowing Cyan Assassin Chest Runes
        ctx.strokeStyle = runeGlow;
        ctx.lineWidth = 4;
        ctx.shadowColor = runeColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(448, 380);
        ctx.lineTo(448, 540);
        ctx.moveTo(410, 420);
        ctx.lineTo(448, 450);
        ctx.lineTo(486, 420);
        ctx.moveTo(400, 480);
        ctx.lineTo(448, 510);
        ctx.lineTo(496, 480);
        ctx.stroke();

        // Utility Leather Belt & Throwing Knife Pouches
        ctx.fillStyle = '#090d16';
        ctx.fillRect(360, 600, 176, 26);
        ctx.strokeStyle = runeColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(360, 600, 176, 26);
        // Belt Buckle (Glowing Phantom Eye)
        ctx.fillStyle = runeGlow;
        ctx.beginPath();
        ctx.arc(448, 613, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- 4. DUAL PHANTOM BLADES AT HIPS ---
        [-1, 1].forEach(side => {
          ctx.save();
          const dX = 448 + side * 96;
          // Blade Hilt
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(dX - 8, 560, 16, 35);
          ctx.strokeStyle = runeGlow;
          ctx.lineWidth = 2;
          ctx.strokeRect(dX - 8, 560, 16, 35);

          // Glowing Phantom Dagger Blade
          const bladeGrad = ctx.createLinearGradient(dX, 595, dX + side * 30, 770);
          bladeGrad.addColorStop(0, '#020617');
          bladeGrad.addColorStop(0.7, runeColor);
          bladeGrad.addColorStop(1, bladeGlow);
          ctx.fillStyle = bladeGrad;
          ctx.shadowColor = bladeGlow;
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.moveTo(dX - 7, 595);
          ctx.lineTo(dX + 7, 595);
          ctx.lineTo(dX + side * 22, 770); // Sharp dagger tip
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });

        // --- 5. SHOULDERS & FOREARM GAUNTLETS ---
        [-1, 1].forEach(side => {
          ctx.save();
          const armX = 448 + side * 110;
          // Segmented shoulder armor pad
          ctx.fillStyle = suitHighlight;
          ctx.beginPath();
          ctx.ellipse(armX, 370, 36, 24, side * 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = runeColor;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Forearm Stealth Bracer
          const bGrad = ctx.createLinearGradient(armX - 18, 420, armX + 18, 560);
          bGrad.addColorStop(0, suitMain);
          bGrad.addColorStop(1, suitShade);
          ctx.fillStyle = bGrad;
          ctx.fillRect(armX - 16, 420, 32, 130);
          ctx.strokeStyle = runeColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(armX - 16, 420, 32, 130);
          ctx.restore();
        });

        // --- 6. HEAD, SHADOW HOOD COWL & GLOWING CYAN VISOR ---
        ctx.save();
        // Dark Hood / Cowl
        const cowlGrad = ctx.createRadialGradient(448, 220, 20, 448, 220, 110);
        cowlGrad.addColorStop(0, '#020617');
        cowlGrad.addColorStop(0.7, suitMain);
        cowlGrad.addColorStop(1, suitHighlight);
        ctx.fillStyle = cowlGrad;

        ctx.beginPath();
        ctx.moveTo(448, 120); // Hood peak
        ctx.bezierCurveTo(370, 130, 350, 210, 360, 290);
        ctx.bezierCurveTo(390, 340, 430, 340, 448, 340);
        ctx.bezierCurveTo(466, 340, 506, 340, 536, 290);
        ctx.bezierCurveTo(546, 210, 526, 130, 448, 120);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = runeColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Dark Interior Shadow within cowl
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(448, 240, 56, 48, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spiky Dark Hair Locks poking from hood
        ctx.fillStyle = hairMain;
        ctx.beginPath();
        ctx.moveTo(420, 180);
        ctx.lineTo(405, 215);
        ctx.lineTo(435, 205);
        ctx.lineTo(448, 225);
        ctx.lineTo(465, 205);
        ctx.lineTo(495, 215);
        ctx.lineTo(475, 180);
        ctx.closePath();
        ctx.fill();

        // Glowing Cyan Visor Eyes / Phantom Slit
        ctx.fillStyle = runeGlow;
        ctx.shadowColor = runeColor;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(428, 242, 16, 5, -0.15, 0, Math.PI * 2);
        ctx.ellipse(468, 242, 16, 5, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Visor lens glint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(424, 241, 2.5, 0, Math.PI * 2);
        ctx.arc(464, 241, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Dark Ninja Face Mask covering lower face
        ctx.fillStyle = suitMain;
        ctx.beginPath();
        ctx.moveTo(406, 258);
        ctx.lineTo(448, 274);
        ctx.lineTo(490, 258);
        ctx.lineTo(476, 320);
        ctx.lineTo(420, 320);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = runeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

      } else {
        // ==========================================================
        // RUN / JUMP / SLIDE CYCLE (Seen from behind / 3rd-person runner)
        // ==========================================================
        const isRun1 = pose === 'run_f1';
        const isRun2 = pose === 'run_f2';
        const isRun3 = pose === 'run_f3';
        const isRun4 = pose === 'run_f4';
        const isJump = pose === 'jump';
        const isSlide = pose === 'slide';

        const yBounce = (isRun2 || isRun4) ? -24 : isJump ? -60 : isSlide ? 75 : 0;
        const scarfBillow = isRun1 ? 50 : isRun3 ? -50 : isJump ? 80 : 0;

        ctx.save();
        ctx.translate(0, yBounce);

        // --- 1. BILLOWING SHADOW SCARF (Seen from behind) ---
        ctx.save();
        const scarfGrad = ctx.createLinearGradient(W / 2, 300, W / 2 + scarfBillow, 1050);
        scarfGrad.addColorStop(0, scarfHighlight);
        scarfGrad.addColorStop(0.5, scarfMain);
        scarfGrad.addColorStop(1, 'rgba(2, 6, 23, 0.2)');
        ctx.fillStyle = scarfGrad;

        ctx.beginPath();
        ctx.moveTo(390, 320);
        ctx.bezierCurveTo(300 + scarfBillow, 460, 260 + scarfBillow * 1.5, 740, 280 + scarfBillow * 2, 1040);
        ctx.bezierCurveTo(400 + scarfBillow, 1060, 520 + scarfBillow, 1060, 600 + scarfBillow * 2, 1040);
        ctx.bezierCurveTo(620 + scarfBillow * 1.5, 740, 580 + scarfBillow, 460, 506, 320);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = runeGlow;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();

        // --- 2. RUNNING LEGS & SILENT SHADOW BOOTS ---
        if (isRun1) {
          // Left Foot Planted Forward (Ground y = 1110), Right Foot Kicking Back High (y = 950)
          drawNyxRunnerLeg(ctx, 380, 1110, true, suitMain, suitShade, runeColor, runeGlow, true);
          drawNyxRunnerLeg(ctx, 526, 950, false, suitMain, suitShade, runeColor, runeGlow, false);
        } else if (isRun2) {
          drawNyxRunnerLeg(ctx, 400, 1030, true, suitMain, suitShade, runeColor, runeGlow, false);
          drawNyxRunnerLeg(ctx, 506, 1050, false, suitMain, suitShade, runeColor, runeGlow, false);
        } else if (isRun3) {
          drawNyxRunnerLeg(ctx, 380, 950, true, suitMain, suitShade, runeColor, runeGlow, false);
          drawNyxRunnerLeg(ctx, 526, 1110, false, suitMain, suitShade, runeColor, runeGlow, true);
        } else if (isRun4) {
          drawNyxRunnerLeg(ctx, 410, 1050, true, suitMain, suitShade, runeColor, runeGlow, false);
          drawNyxRunnerLeg(ctx, 496, 1030, false, suitMain, suitShade, runeColor, runeGlow, false);
        } else if (isJump) {
          drawNyxRunnerLeg(ctx, 390, 930, true, suitMain, suitShade, runeColor, runeGlow, false);
          drawNyxRunnerLeg(ctx, 516, 930, false, suitMain, suitShade, runeColor, runeGlow, false);
        } else if (isSlide) {
          drawNyxRunnerLeg(ctx, 360, 1130, true, suitMain, suitShade, runeColor, runeGlow, true);
          drawNyxRunnerLeg(ctx, 560, 1130, false, suitMain, suitShade, runeColor, runeGlow, true);
        }

        // --- 3. BACK OF TUNIC & HOOD (Seen from behind) ---
        ctx.save();
        ctx.fillStyle = suitMain;
        ctx.beginPath();
        ctx.moveTo(350, 340);
        ctx.lineTo(546, 340);
        ctx.lineTo(520, 560);
        ctx.lineTo(376, 560);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = runeColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Back Hood Peak
        ctx.fillStyle = suitHighlight;
        ctx.beginPath();
        ctx.moveTo(448, 120);
        ctx.bezierCurveTo(360, 140, 350, 240, 360, 300);
        ctx.bezierCurveTo(400, 330, 496, 330, 536, 300);
        ctx.bezierCurveTo(546, 240, 536, 140, 448, 120);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = runeColor;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      }

      return canvas.toDataURL('image/png');
    }

    // Helper for drawing Nyx runner legs
    function drawNyxRunnerLeg(ctx, x, y, suitMain, suitShade, runeColor, runeGlow, isPlanted) {
      ctx.save();
      ctx.fillStyle = suitShade;
      ctx.beginPath();
      ctx.moveTo(x - 24, y - 90);
      ctx.lineTo(x + 24, y - 90);
      ctx.lineTo(x + 28, y - 20);
      ctx.lineTo(x - 28, y - 20);
      ctx.closePath();
      ctx.fill();

      // Bandages & Cyan rune circuit
      ctx.fillStyle = suitMain;
      ctx.fillRect(x - 22, y - 80, 44, 60);
      ctx.strokeStyle = runeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 22, y - 80, 44, 60);

      // Silent Shadow Boot
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 38, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = runeGlow;
      ctx.lineWidth = 3;
      ctx.stroke();

      if (isPlanted) {
        ctx.fillStyle = `${runeColor}40`;
        ctx.beginPath();
        ctx.ellipse(x, y + 16, 50, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // =========================================================================
    // GENERATE ALL REQUIRED SPRITES
    // =========================================================================
    console.log('Rendering Solaris sprites...');
    // 1. Solaris Default (Royal Paladin)
    results['solaris_front.png'] = drawSolaris('default', 'front');
    results['solaris_run_f1.png'] = drawSolaris('default', 'run_f1');
    results['solaris_run_f2.png'] = drawSolaris('default', 'run_f2');
    results['solaris_run_f3.png'] = drawSolaris('default', 'run_f3');
    results['solaris_run_f4.png'] = drawSolaris('default', 'run_f4');
    results['solaris_jump.png'] = drawSolaris('default', 'jump');
    results['solaris_slide.png'] = drawSolaris('default', 'slide');

    // 2. Solaris Obsidian Champion
    results['solaris_obsidian_front.png'] = drawSolaris('obsidian', 'front');
    results['solaris_obsidian_run_f1.png'] = drawSolaris('obsidian', 'run_f1');
    results['solaris_obsidian_run_f2.png'] = drawSolaris('obsidian', 'run_f2');
    results['solaris_obsidian_run_f3.png'] = drawSolaris('obsidian', 'run_f3');
    results['solaris_obsidian_run_f4.png'] = drawSolaris('obsidian', 'run_f4');
    results['solaris_obsidian_jump.png'] = drawSolaris('obsidian', 'jump');
    results['solaris_obsidian_slide.png'] = drawSolaris('obsidian', 'slide');

    // 3. Solaris Phoenix Knight
    results['solaris_phoenix_front.png'] = drawSolaris('phoenix', 'front');
    results['solaris_phoenix_run_f1.png'] = drawSolaris('phoenix', 'run_f1');
    results['solaris_phoenix_run_f2.png'] = drawSolaris('phoenix', 'run_f2');
    results['solaris_phoenix_run_f3.png'] = drawSolaris('phoenix', 'run_f3');
    results['solaris_phoenix_run_f4.png'] = drawSolaris('phoenix', 'run_f4');
    results['solaris_phoenix_jump.png'] = drawSolaris('phoenix', 'jump');
    results['solaris_phoenix_slide.png'] = drawSolaris('phoenix', 'slide');

    console.log('Rendering Nyx sprites...');
    // 4. Nyx Default (Shadow Assassin)
    results['nyx_front.png'] = drawNyx('default', 'front');
    results['nyx_run_f1.png'] = drawNyx('default', 'run_f1');
    results['nyx_run_f2.png'] = drawNyx('default', 'run_f2');
    results['nyx_run_f3.png'] = drawNyx('default', 'run_f3');
    results['nyx_run_f4.png'] = drawNyx('default', 'run_f4');
    results['nyx_jump.png'] = drawNyx('default', 'jump');
    results['nyx_slide.png'] = drawNyx('default', 'slide');

    // 5. Nyx Cyber Phantom
    results['nyx_cyber_front.png'] = drawNyx('cyber', 'front');
    results['nyx_cyber_run_f1.png'] = drawNyx('cyber', 'run_f1');
    results['nyx_cyber_run_f2.png'] = drawNyx('cyber', 'run_f2');
    results['nyx_cyber_run_f3.png'] = drawNyx('cyber', 'run_f3');
    results['nyx_cyber_run_f4.png'] = drawNyx('cyber', 'run_f4');
    results['nyx_cyber_jump.png'] = drawNyx('cyber', 'jump');
    results['nyx_cyber_slide.png'] = drawNyx('cyber', 'slide');

    // 6. Nyx Blood Moon Reaper
    results['nyx_bloodmoon_front.png'] = drawNyx('bloodmoon', 'front');
    results['nyx_bloodmoon_run_f1.png'] = drawNyx('bloodmoon', 'run_f1');
    results['nyx_bloodmoon_run_f2.png'] = drawNyx('bloodmoon', 'run_f2');
    results['nyx_bloodmoon_run_f3.png'] = drawNyx('bloodmoon', 'run_f3');
    results['nyx_bloodmoon_run_f4.png'] = drawNyx('bloodmoon', 'run_f4');
    results['nyx_bloodmoon_jump.png'] = drawNyx('bloodmoon', 'jump');
    results['nyx_bloodmoon_slide.png'] = drawNyx('bloodmoon', 'slide');

    return results;
  });

  await browser.close();

  // Save all rendered sprites to public/assets
  console.log(`Writing ${Object.keys(generated).length} sprites to ${OUTPUT_DIR}...`);
  for (const [filename, dataUri] of Object.entries(generated)) {
    const base64Data = dataUri.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
    console.log(`Saved: ${filename} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
  }

  console.log('✨ All high-definition hero sprites successfully generated!');
}

main().catch(err => {
  console.error('Error generating hero sprites:', err);
  process.exit(1);
});
