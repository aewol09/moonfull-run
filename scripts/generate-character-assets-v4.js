import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log('🎨 Generating Character-Specific Costumes & Diverse Characters (Male & Female) Assets...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const generated = await page.evaluate(async () => {
    const results = {};

    function helperCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return { canvas: c, ctx: c.getContext('2d') };
    }

    // ----------------------------------------------------
    // Helper: Draw Male Warrior Front (Solaris)
    // ----------------------------------------------------
    function drawSolarisFront(isObsidian = false) {
      const { canvas, ctx } = helperCanvas(512, 512);

      // Background transparent
      ctx.clearRect(0, 0, 512, 512);

      // Cape
      ctx.fillStyle = isObsidian ? '#7c2d12' : '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(170, 160);
      ctx.lineTo(130, 430);
      ctx.lineTo(382, 430);
      ctx.lineTo(342, 160);
      ctx.closePath();
      ctx.fill();

      // Legs / Greaves (Male athletic stance)
      ctx.fillStyle = isObsidian ? '#18181b' : '#334155';
      ctx.fillRect(195, 300, 45, 150); // Left leg
      ctx.fillRect(272, 300, 45, 150); // Right leg

      // Gold / Obsidian Greaves armor
      ctx.fillStyle = isObsidian ? '#f97316' : '#f59e0b';
      ctx.fillRect(190, 360, 55, 80);
      ctx.fillRect(267, 360, 55, 80);
      ctx.strokeStyle = isObsidian ? '#ea580c' : '#fbbf24';
      ctx.lineWidth = 4;
      ctx.strokeRect(190, 360, 55, 80);
      ctx.strokeRect(267, 360, 55, 80);

      // Boots
      ctx.fillStyle = isObsidian ? '#09090b' : '#1e293b';
      ctx.beginPath();
      ctx.ellipse(217, 445, 30, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(294, 445, 30, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Torso / Muscular Chestplate
      ctx.fillStyle = isObsidian ? '#27272a' : '#475569';
      ctx.beginPath();
      ctx.moveTo(180, 170);
      ctx.lineTo(195, 310);
      ctx.lineTo(317, 310);
      ctx.lineTo(332, 170);
      ctx.closePath();
      ctx.fill();

      // Heavy Gold / Magma Chest Armor Plates
      ctx.fillStyle = isObsidian ? '#18181b' : '#f59e0b';
      ctx.strokeStyle = isObsidian ? '#f97316' : '#fef08a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(185, 175);
      ctx.lineTo(256, 260);
      ctx.lineTo(327, 175);
      ctx.lineTo(315, 290);
      ctx.lineTo(197, 290);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sun Crest Lion Emblem
      ctx.fillStyle = isObsidian ? '#ea580c' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(256, 230, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Broad Shoulder Pauldrons (Male Knight)
      ctx.fillStyle = isObsidian ? '#3f3f46' : '#d97706';
      ctx.beginPath();
      ctx.arc(160, 185, 36, 0, Math.PI * 2); // Left pauldron
      ctx.arc(352, 185, 36, 0, Math.PI * 2); // Right pauldron
      ctx.fill();
      ctx.strokeStyle = isObsidian ? '#f97316' : '#fbbf24';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Arms & Gauntlets
      ctx.fillStyle = isObsidian ? '#18181b' : '#f59e0b';
      ctx.fillRect(135, 210, 32, 90);
      ctx.fillRect(345, 210, 32, 90);

      // Neck & Chin
      ctx.fillStyle = '#fed7aa'; // Strong male skin tone
      ctx.fillRect(238, 130, 36, 30);

      // Male Face (Sharp strong jawline, handsome knight)
      ctx.beginPath();
      ctx.moveTo(225, 110);
      ctx.lineTo(256, 155); // Strong pointed jaw
      ctx.lineTo(287, 110);
      ctx.lineTo(282, 85);
      ctx.lineTo(230, 85);
      ctx.closePath();
      ctx.fill();

      // Eyes (Fierce amber/orange confident male eyes)
      ctx.fillStyle = isObsidian ? '#ea580c' : '#d97706';
      ctx.beginPath();
      ctx.ellipse(242, 112, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(270, 112, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Confident smile
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(256, 132, 8, 0.1, Math.PI - 0.1);
      ctx.stroke();

      // Spiky Male Hair (Short copper-blonde / obsidian black)
      ctx.fillStyle = isObsidian ? '#18181b' : '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(220, 95);
      ctx.lineTo(205, 60);
      ctx.lineTo(230, 68);
      ctx.lineTo(240, 45);
      ctx.lineTo(256, 62);
      ctx.lineTo(275, 42);
      ctx.lineTo(285, 65);
      ctx.lineTo(305, 55);
      ctx.lineTo(292, 95);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = isObsidian ? '#f97316' : '#fde047';
      ctx.lineWidth = 3;
      ctx.stroke();

      return canvas.toDataURL('image/png');
    }

    // ----------------------------------------------------
    // Helper: Draw Male Shadow Rogue Front (Nyx)
    // ----------------------------------------------------
    function drawNyxFront(isCyber = false) {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);

      // Leather Trench Coat / Cloak Tails
      ctx.fillStyle = isCyber ? '#0369a1' : '#0f172a';
      ctx.beginPath();
      ctx.moveTo(180, 170);
      ctx.lineTo(140, 435);
      ctx.lineTo(230, 410);
      ctx.lineTo(256, 320);
      ctx.lineTo(282, 410);
      ctx.lineTo(372, 435);
      ctx.lineTo(332, 170);
      ctx.closePath();
      ctx.fill();

      // Legs (Stealth agile rogue trousers)
      ctx.fillStyle = '#020617';
      ctx.fillRect(200, 310, 40, 140);
      ctx.fillRect(272, 310, 40, 140);

      // Stealth Boots & Shin guards with cyan neon straps
      ctx.fillStyle = isCyber ? '#0284c7' : '#1e293b';
      ctx.fillRect(195, 370, 50, 70);
      ctx.fillRect(267, 370, 50, 70);
      ctx.strokeStyle = isCyber ? '#38bdf8' : '#06b6d4';
      ctx.lineWidth = 3;
      ctx.strokeRect(195, 370, 50, 70);
      ctx.strokeRect(267, 370, 50, 70);

      // Boots
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(220, 446, 26, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(292, 446, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sleek Leather Tunic & Belt
      ctx.fillStyle = isCyber ? '#0f172a' : '#18181b';
      ctx.fillRect(190, 170, 132, 145);

      // Tactical straps & neon neon seams
      ctx.strokeStyle = isCyber ? '#38bdf8' : '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(195, 180);
      ctx.lineTo(317, 305);
      ctx.moveTo(317, 180);
      ctx.lineTo(195, 305);
      ctx.stroke();

      // Twin Daggers at waist
      ctx.fillStyle = isCyber ? '#38bdf8' : '#67e8f9';
      ctx.fillRect(165, 270, 30, 8);
      ctx.fillRect(317, 270, 30, 8);

      // Shoulders & Arms
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(145, 185, 45, 120);
      ctx.fillRect(322, 185, 45, 120);

      // Male Face (Sharp, cold male assassin with half mask)
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(228, 105);
      ctx.lineTo(256, 150);
      ctx.lineTo(284, 105);
      ctx.lineTo(280, 80);
      ctx.lineTo(232, 80);
      ctx.closePath();
      ctx.fill();

      // Assassin Mask / Bandana covering lower face
      ctx.fillStyle = isCyber ? '#0369a1' : '#020617';
      ctx.beginPath();
      ctx.moveTo(224, 120);
      ctx.lineTo(256, 152);
      ctx.lineTo(288, 120);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = isCyber ? '#38bdf8' : '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sharp glowing cyan eyes (Intense assassin gaze)
      ctx.fillStyle = isCyber ? '#38bdf8' : '#22d3ee';
      ctx.beginPath();
      ctx.ellipse(242, 108, 7, 3, -0.1, 0, Math.PI * 2);
      ctx.ellipse(270, 108, 7, 3, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Dark Sleek Male Hair (Parted stylish fringe)
      ctx.fillStyle = isCyber ? '#0f172a' : '#09090b';
      ctx.beginPath();
      ctx.moveTo(225, 95);
      ctx.lineTo(210, 65);
      ctx.lineTo(238, 72);
      ctx.lineTo(256, 50);
      ctx.lineTo(276, 70);
      ctx.lineTo(300, 60);
      ctx.lineTo(285, 95);
      ctx.lineTo(256, 90);
      ctx.closePath();
      ctx.fill();

      return canvas.toDataURL('image/png');
    }

    // ----------------------------------------------------
    // Helper: Draw Stella Zodiac Archmage Front (2nd Costume)
    // ----------------------------------------------------
    function drawStellaArchmageFront() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);

      // Deep Indigo & Gold Zodiac Archmage Gown
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(200, 160);
      ctx.lineTo(130, 440);
      ctx.lineTo(382, 440);
      ctx.lineTo(312, 160);
      ctx.closePath();
      ctx.fill();

      // Golden Zodiac Runes on gown hem
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Constellation stars on skirt
      ctx.fillStyle = '#c084fc';
      for (let i = 0; i < 18; i++) {
        const sx = 160 + (i * 12) % 190;
        const sy = 280 + ((i * 23) % 140);
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Torso & Royal Gold Corset
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(205, 170, 102, 120);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(225, 190, 62, 90);

      // Arms & Cosmic Sleeves
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(180, 170);
      ctx.lineTo(120, 310);
      ctx.lineTo(150, 320);
      ctx.lineTo(195, 230);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(332, 170);
      ctx.lineTo(392, 310);
      ctx.lineTo(362, 320);
      ctx.lineTo(317, 230);
      ctx.closePath();
      ctx.fill();

      // Wand with floating crescent orb in right hand
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(375, 310);
      ctx.lineTo(410, 200);
      ctx.stroke();
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(412, 195, 18, 0, Math.PI * 2);
      ctx.fill();

      // Face (Cute anime sorceress)
      ctx.fillStyle = '#fdf4ff';
      ctx.beginPath();
      ctx.moveTo(228, 110);
      ctx.lineTo(256, 145);
      ctx.lineTo(284, 110);
      ctx.lineTo(280, 80);
      ctx.lineTo(232, 80);
      ctx.closePath();
      ctx.fill();

      // Sparkling purple anime eyes
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(242, 110, 6, 0, Math.PI * 2);
      ctx.arc(270, 110, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(244, 108, 2, 0, Math.PI * 2);
      ctx.arc(272, 108, 2, 0, Math.PI * 2);
      ctx.fill();

      // Long Lavender / Magenta Hair
      ctx.fillStyle = '#d946ef';
      ctx.beginPath();
      ctx.moveTo(220, 95);
      ctx.lineTo(180, 260);
      ctx.lineTo(210, 240);
      ctx.lineTo(230, 80);
      ctx.lineTo(282, 80);
      ctx.lineTo(302, 240);
      ctx.lineTo(332, 260);
      ctx.lineTo(292, 95);
      ctx.closePath();
      ctx.fill();

      // Royal Gold Zodiac Tiara Crown
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(230, 82);
      ctx.lineTo(240, 60);
      ctx.lineTo(256, 75);
      ctx.lineTo(272, 60);
      ctx.lineTo(282, 82);
      ctx.closePath();
      ctx.fill();

      return canvas.toDataURL('image/png');
    }

    // ----------------------------------------------------
    // Dynamic 4-Frame Running Animation Generator
    // Generates high-energy, alternating leg strides
    // ----------------------------------------------------
    function generate4FrameRunCycle(baseFrontDataUrl, themeConfig) {
      const frames = [];
      const {
        primaryColor,
        bootColor,
        trimColor,
        isMale,
        hairColor,
        capeColor
      } = themeConfig;

      for (let f = 1; f <= 4; f++) {
        const { canvas, ctx } = helperCanvas(512, 512);

        // Body vertical stride bounce
        // Frame 1: Left foot planted down (lowest bounce: 0)
        // Frame 2: Mid-stride liftoff (high bounce: -16)
        // Frame 3: Right foot planted down (lowest bounce: 0)
        // Frame 4: Mid-stride liftoff 2 (high bounce: -16)
        const bounce = (f === 2 || f === 4) ? -16 : 0;
        const hipTilt = (f === 1) ? -0.05 : (f === 3) ? 0.05 : 0;

        ctx.save();
        ctx.translate(256, 260 + bounce);
        ctx.rotate(hipTilt);

        // Flowing Cape fluttering in wind behind runner
        ctx.fillStyle = capeColor;
        const capeWave = (f === 1 || f === 3) ? 25 : -15;
        ctx.beginPath();
        ctx.moveTo(-60, -90);
        ctx.quadraticCurveTo(-110 + capeWave, 60, -125, 170);
        ctx.lineTo(125, 170);
        ctx.quadraticCurveTo(110 - capeWave, 60, 60, -90);
        ctx.closePath();
        ctx.fill();

        // Torso / Back view
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        const shoulderW = isMale ? 75 : 55;
        const waistW = isMale ? 50 : 38;
        ctx.moveTo(-shoulderW, -90);
        ctx.lineTo(-waistW, 35);
        ctx.lineTo(waistW, 35);
        ctx.lineTo(shoulderW, -90);
        ctx.closePath();
        ctx.fill();

        // Gold / Trim belt
        ctx.fillStyle = trimColor;
        ctx.fillRect(-waistW, 25, waistW * 2, 14);

        // Head & Ponytail/Hair from behind
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(0, -135, isMale ? 32 : 36, 0, Math.PI * 2);
        ctx.fill();

        // Ponytail / Short hair flying in run wind
        ctx.beginPath();
        const hairSway = (f === 1) ? -18 : (f === 3) ? 18 : 0;
        if (isMale) {
          // Spiky male hair back
          ctx.moveTo(-30, -145);
          ctx.lineTo(-45, -165);
          ctx.lineTo(-15, -160);
          ctx.lineTo(0, -180);
          ctx.lineTo(15, -160);
          ctx.lineTo(45, -165);
          ctx.lineTo(30, -145);
        } else {
          // Flowing ponytail trailing behind
          ctx.moveTo(-15, -135);
          ctx.quadraticCurveTo(-40 + hairSway, -180, -30 + hairSway, -210);
          ctx.quadraticCurveTo(0 + hairSway, -200, 15, -135);
        }
        ctx.closePath();
        ctx.fill();

        // Arms swinging forward & back
        ctx.fillStyle = primaryColor;
        ctx.lineWidth = isMale ? 18 : 14;
        ctx.strokeStyle = primaryColor;
        ctx.lineCap = 'round';

        const leftArmY = (f === 1) ? 30 : (f === 3) ? -40 : -5;
        const rightArmY = (f === 1) ? -40 : (f === 3) ? 30 : -5;

        // Left arm
        ctx.beginPath();
        ctx.moveTo(-shoulderW + 8, -80);
        ctx.lineTo(-shoulderW - 20, leftArmY);
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(shoulderW - 8, -80);
        ctx.lineTo(shoulderW + 20, rightArmY);
        ctx.stroke();

        ctx.restore();

        // ----------------------------------------
        // LEGS ANIMATION (Clear Dynamic Alternating Strides!)
        // ----------------------------------------
        ctx.save();
        ctx.translate(256, 260 + bounce);

        ctx.lineWidth = isMale ? 28 : 22;
        ctx.lineCap = 'round';

        if (f === 1) {
          // Frame 1: LEFT LEG FORWARD & PLANTED, RIGHT LEG BENT BACK HIGH!
          // Left Leg (Stretching forward down)
          ctx.strokeStyle = primaryColor;
          ctx.beginPath();
          ctx.moveTo(-25, 35);
          ctx.lineTo(-42, 110); // Knee forward
          ctx.lineTo(-55, 175); // Foot planted forward
          ctx.stroke();

          // Left Boot
          ctx.fillStyle = bootColor;
          ctx.beginPath();
          ctx.ellipse(-55, 185, 24, 12, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = trimColor;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Right Leg (Kicking back high in air)
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = isMale ? 26 : 20;
          ctx.beginPath();
          ctx.moveTo(25, 35);
          ctx.lineTo(55, 95);  // Knee bent back
          ctx.lineTo(75, 130); // Foot trailing behind in air
          ctx.stroke();

          // Right Boot in air
          ctx.fillStyle = bootColor;
          ctx.beginPath();
          ctx.ellipse(82, 135, 20, 11, 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = trimColor;
          ctx.lineWidth = 4;
          ctx.stroke();

        } else if (f === 2) {
          // Frame 2: PASSING POSE 1 (Airborne glide, legs crossing through center)
          ctx.strokeStyle = primaryColor;
          ctx.beginPath();
          ctx.moveTo(-20, 35);
          ctx.lineTo(-25, 105);
          ctx.lineTo(-20, 160);
          ctx.stroke();

          ctx.fillStyle = bootColor;
          ctx.beginPath();
          ctx.ellipse(-20, 168, 20, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = isMale ? 26 : 20;
          ctx.beginPath();
          ctx.moveTo(20, 35);
          ctx.lineTo(28, 90);
          ctx.lineTo(32, 145);
          ctx.stroke();

          ctx.fillStyle = bootColor;
          ctx.beginPath();
          ctx.ellipse(32, 150, 18, 10, 0.1, 0, Math.PI * 2);
          ctx.fill();

        } else if (f === 3) {
          // Frame 3: RIGHT LEG FORWARD & PLANTED, LEFT LEG BENT BACK HIGH!
          // Right Leg (Stretching forward down)
          ctx.strokeStyle = primaryColor;
          ctx.beginPath();
          ctx.moveTo(25, 35);
          ctx.lineTo(42, 110); // Knee forward
          ctx.lineTo(55, 175); // Foot planted forward
          ctx.stroke();

          // Right Boot
          ctx.fillStyle = bootColor;
          ctx.beginPath();
          ctx.ellipse(55, 185, 24, 12, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = trimColor;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Left Leg (Kicking back high in air)
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = isMale ? 26 : 20;
          ctx.beginPath();
          ctx.moveTo(-25, 35);
          ctx.lineTo(-55, 95);  // Knee bent back
          ctx.lineTo(-75, 130); // Foot trailing behind in air
          ctx.stroke();

          // Left Boot in air
          ctx.fillStyle = bootColor;
          ctx.beginPath();
          ctx.ellipse(-82, 135, 20, 11, -0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = trimColor;
          ctx.lineWidth = 4;
          ctx.stroke();

        } else {
          // Frame 4: PASSING POSE 2 (Airborne glide, opposite legs crossing)
          ctx.strokeStyle = primaryColor;
          ctx.beginPath();
          ctx.moveTo(20, 35);
          ctx.lineTo(25, 105);
          ctx.lineTo(20, 160);
          ctx.stroke();

          ctx.fillStyle = bootColor;
          ctx.beginPath();
          ctx.ellipse(20, 168, 20, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = isMale ? 26 : 20;
          ctx.beginPath();
          ctx.moveTo(-20, 35);
          ctx.lineTo(-28, 90);
          ctx.lineTo(-32, 145);
          ctx.stroke();

          ctx.fillStyle = bootColor;
          ctx.beginPath();
          ctx.ellipse(-32, 150, 18, 10, -0.1, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        frames.push(canvas.toDataURL('image/png'));
      }

      return frames;
    }

    // Generate Jump & Slide Actions
    function generateActionSprites(themeConfig) {
      const { primaryColor, bootColor, trimColor, isMale, hairColor, capeColor } = themeConfig;

      // Jump Sprite
      const { canvas: jumpC, ctx: jumpCtx } = helperCanvas(512, 512);
      jumpCtx.save();
      jumpCtx.translate(256, 210);

      // Cape spread wide like eagle wings
      jumpCtx.fillStyle = capeColor;
      jumpCtx.beginPath();
      jumpCtx.moveTo(0, -90);
      jumpCtx.lineTo(-145, 60);
      jumpCtx.lineTo(145, 60);
      jumpCtx.closePath();
      jumpCtx.fill();

      // Torso
      jumpCtx.fillStyle = primaryColor;
      const sw = isMale ? 75 : 55;
      jumpCtx.fillRect(-sw, -90, sw * 2, 110);

      // Head
      jumpCtx.fillStyle = hairColor;
      jumpCtx.beginPath();
      jumpCtx.arc(0, -135, 34, 0, Math.PI * 2);
      jumpCtx.fill();

      // Both knees tucked in athletic leap
      jumpCtx.strokeStyle = primaryColor;
      jumpCtx.lineWidth = isMale ? 26 : 20;
      jumpCtx.lineCap = 'round';
      jumpCtx.beginPath();
      jumpCtx.moveTo(-25, 20);
      jumpCtx.lineTo(-45, 80);
      jumpCtx.lineTo(-30, 125);
      jumpCtx.moveTo(25, 20);
      jumpCtx.lineTo(45, 80);
      jumpCtx.lineTo(30, 125);
      jumpCtx.stroke();

      jumpCtx.fillStyle = bootColor;
      jumpCtx.beginPath();
      jumpCtx.ellipse(-30, 130, 18, 10, 0, 0, Math.PI * 2);
      jumpCtx.ellipse(30, 130, 18, 10, 0, 0, Math.PI * 2);
      jumpCtx.fill();
      jumpCtx.restore();

      // Slide Sprite
      const { canvas: slideC, ctx: slideCtx } = helperCanvas(512, 512);
      slideCtx.save();
      slideCtx.translate(256, 320);

      // Low flat cape trailing
      slideCtx.fillStyle = capeColor;
      slideCtx.beginPath();
      slideCtx.moveTo(-40, -40);
      slideCtx.lineTo(-160, 40);
      slideCtx.lineTo(160, 40);
      slideCtx.lineTo(40, -40);
      slideCtx.closePath();
      slideCtx.fill();

      // Low profile crouch body
      slideCtx.fillStyle = primaryColor;
      slideCtx.beginPath();
      slideCtx.ellipse(0, -20, 80, 35, 0, 0, Math.PI * 2);
      slideCtx.fill();

      // Head low
      slideCtx.fillStyle = hairColor;
      slideCtx.beginPath();
      slideCtx.arc(45, -35, 26, 0, Math.PI * 2);
      slideCtx.fill();

      // Slide spark friction
      slideCtx.fillStyle = '#fbbf24';
      for (let i = 0; i < 8; i++) {
        slideCtx.beginPath();
        slideCtx.arc(-90 + Math.random() * 180, 35 + Math.random() * 10, 4, 0, Math.PI * 2);
        slideCtx.fill();
      }

      slideCtx.restore();

      return {
        jump: jumpC.toDataURL('image/png'),
        slide: slideC.toDataURL('image/png')
      };
    }

    // -------------------------------------------------------------------------
    // Execution: Build all assets
    // -------------------------------------------------------------------------

    // 1. Solaris (Male Knight Default & Obsidian)
    results['solaris_front.png'] = drawSolarisFront(false);
    results['solaris_obsidian_front.png'] = drawSolarisFront(true);

    const solarisConfig = {
      primaryColor: '#f59e0b',
      bootColor: '#1e293b',
      trimColor: '#fbbf24',
      isMale: true,
      hairColor: '#f59e0b',
      capeColor: '#b91c1c'
    };
    const solarisRun = generate4FrameRunCycle(results['solaris_front.png'], solarisConfig);
    solarisRun.forEach((f, idx) => { results[`solaris_run_f${idx + 1}.png`] = f; });
    const solarisActions = generateActionSprites(solarisConfig);
    results['solaris_jump.png'] = solarisActions.jump;
    results['solaris_slide.png'] = solarisActions.slide;

    const solarisObsidianConfig = {
      primaryColor: '#27272a',
      bootColor: '#09090b',
      trimColor: '#f97316',
      isMale: true,
      hairColor: '#18181b',
      capeColor: '#7c2d12'
    };
    const solarisObsidianRun = generate4FrameRunCycle(results['solaris_obsidian_front.png'], solarisObsidianConfig);
    solarisObsidianRun.forEach((f, idx) => { results[`solaris_obsidian_run_f${idx + 1}.png`] = f; });
    const solarisObsidianActions = generateActionSprites(solarisObsidianConfig);
    results['solaris_obsidian_jump.png'] = solarisObsidianActions.jump;
    results['solaris_obsidian_slide.png'] = solarisObsidianActions.slide;

    // 2. Nyx (Male Shadow Assassin Default & Cyber)
    results['nyx_front.png'] = drawNyxFront(false);
    results['nyx_cyber_front.png'] = drawNyxFront(true);

    const nyxConfig = {
      primaryColor: '#0f172a',
      bootColor: '#1e293b',
      trimColor: '#06b6d4',
      isMale: true,
      hairColor: '#09090b',
      capeColor: '#020617'
    };
    const nyxRun = generate4FrameRunCycle(results['nyx_front.png'], nyxConfig);
    nyxRun.forEach((f, idx) => { results[`nyx_run_f${idx + 1}.png`] = f; });
    const nyxActions = generateActionSprites(nyxConfig);
    results['nyx_jump.png'] = nyxActions.jump;
    results['nyx_slide.png'] = nyxActions.slide;

    const nyxCyberConfig = {
      primaryColor: '#0369a1',
      bootColor: '#0f172a',
      trimColor: '#38bdf8',
      isMale: true,
      hairColor: '#0f172a',
      capeColor: '#0284c7'
    };
    const nyxCyberRun = generate4FrameRunCycle(results['nyx_cyber_front.png'], nyxCyberConfig);
    nyxCyberRun.forEach((f, idx) => { results[`nyx_cyber_run_f${idx + 1}.png`] = f; });
    const nyxCyberActions = generateActionSprites(nyxCyberConfig);
    results['nyx_cyber_jump.png'] = nyxCyberActions.jump;
    results['nyx_cyber_slide.png'] = nyxCyberActions.slide;

    // 3. Stella Zodiac Archmage (2nd Costume)
    results['stella_archmage_front.png'] = drawStellaArchmageFront();
    const stellaArchmageConfig = {
      primaryColor: '#4c1d95',
      bootColor: '#1e1b4b',
      trimColor: '#fbbf24',
      isMale: false,
      hairColor: '#d946ef',
      capeColor: '#1e1b4b'
    };
    const stellaArchmageRun = generate4FrameRunCycle(results['stella_archmage_front.png'], stellaArchmageConfig);
    stellaArchmageRun.forEach((f, idx) => { results[`stella_archmage_run_f${idx + 1}.png`] = f; });
    const stellaArchmageActions = generateActionSprites(stellaArchmageConfig);
    results['stella_archmage_jump.png'] = stellaArchmageActions.jump;
    results['stella_archmage_slide.png'] = stellaArchmageActions.slide;

    // 4. Luna 4-Frame Dynamic Run Enhancement
    const lunaConfig = {
      primaryColor: '#1e3a8a',
      bootColor: '#0f172a',
      trimColor: '#fbbf24',
      isMale: false,
      hairColor: '#e2e8f0',
      capeColor: '#172554'
    };
    const lunaRun = generate4FrameRunCycle(null, lunaConfig);
    lunaRun.forEach((f, idx) => { results[`luna_run_f${idx + 1}.png`] = f; });

    // 5. Animated Chest Sprites (Closed, Glowing, Open)
    const { canvas: chestClosedC, ctx: c1 } = helperCanvas(256, 256);
    c1.clearRect(0, 0, 256, 256);
    // Base wood/gold chest
    c1.fillStyle = '#78350f';
    c1.fillRect(38, 90, 180, 120);
    c1.fillStyle = '#b45309';
    c1.fillRect(48, 100, 160, 100);
    c1.strokeStyle = '#f59e0b';
    c1.lineWidth = 10;
    c1.strokeRect(38, 90, 180, 120);
    // Gold Lock
    c1.fillStyle = '#fbbf24';
    c1.beginPath();
    c1.arc(128, 150, 18, 0, Math.PI * 2);
    c1.fill();
    results['chest_mystery.png'] = chestClosedC.toDataURL('image/png');

    // Chest Open Sprite with Burst
    const { canvas: chestOpenC, ctx: c2 } = helperCanvas(256, 256);
    c2.clearRect(0, 0, 256, 256);
    // Golden rays burst from inside
    c2.fillStyle = 'rgba(251, 191, 36, 0.4)';
    c2.beginPath();
    c2.arc(128, 120, 110, 0, Math.PI * 2);
    c2.fill();
    // Chest base
    c2.fillStyle = '#78350f';
    c2.fillRect(38, 120, 180, 95);
    c2.strokeStyle = '#f59e0b';
    c2.lineWidth = 10;
    c2.strokeRect(38, 120, 180, 95);
    // Chest open lid tilted back
    c2.fillStyle = '#92400e';
    c2.beginPath();
    c2.moveTo(38, 120);
    c2.lineTo(55, 45);
    c2.lineTo(201, 45);
    c2.lineTo(218, 120);
    c2.closePath();
    c2.fill();
    c2.stroke();
    // Inner radiant sparkles
    c2.fillStyle = '#ffffff';
    for (let i = 0; i < 16; i++) {
      c2.beginPath();
      c2.arc(70 + (i * 18) % 120, 90 + ((i * 13) % 40), 4, 0, Math.PI * 2);
      c2.fill();
    }
    results['chest_open.png'] = chestOpenC.toDataURL('image/png');

    return results;
  });

  await browser.close();

  // Save all generated PNGs to disk
  let savedCount = 0;
  for (const [filename, dataUrl] of Object.entries(generated)) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const targetPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(targetPath, base64Data, 'base64');
    savedCount++;
  }

  console.log(`✨ Successfully generated and saved ${savedCount} character and costume action assets!`);
}

main().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
