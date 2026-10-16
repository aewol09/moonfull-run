import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log('🎨 Generating Character Costumes Assets v5 (Solaris Phoenix, Nyx Bloodmoon, Stella Chronos)...');

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

    // ==========================================
    // 1. Solaris Phoenix (Front, 4 Run Frames, Jump, Slide)
    // Fiery Crimson/Gold Phoenix Knight
    // ==========================================
    function drawSolarisPhoenixFront() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);

      // Fiery Wing Cape
      const capeGrad = ctx.createLinearGradient(256, 150, 256, 450);
      capeGrad.addColorStop(0, '#f97316');
      capeGrad.addColorStop(0.5, '#dc2626');
      capeGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = capeGrad;
      ctx.beginPath();
      ctx.moveTo(170, 160);
      ctx.lineTo(90, 410);
      ctx.lineTo(256, 380);
      ctx.lineTo(422, 410);
      ctx.lineTo(342, 160);
      ctx.closePath();
      ctx.fill();

      // Greaves & Legs
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(195, 300, 45, 150);
      ctx.fillRect(272, 300, 45, 150);

      // Ruby Phoenix Greaves
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(190, 360, 55, 80);
      ctx.fillRect(267, 360, 55, 80);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.strokeRect(190, 360, 55, 80);
      ctx.strokeRect(267, 360, 55, 80);

      // Gold Boots
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(217, 445, 30, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(294, 445, 30, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chestplate & Fiery Crest
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(180, 170);
      ctx.lineTo(195, 310);
      ctx.lineTo(317, 310);
      ctx.lineTo(332, 170);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#fde047';
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

      // Blazing Phoenix Sigil
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(256, 230, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(256, 215);
      ctx.lineTo(262, 230);
      ctx.lineTo(276, 235);
      ctx.lineTo(262, 240);
      ctx.lineTo(256, 255);
      ctx.lineTo(250, 240);
      ctx.lineTo(236, 235);
      ctx.lineTo(250, 230);
      ctx.closePath();
      ctx.fill();

      // Pauldrons (Fiery Phoenix Wing Shoulders)
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(185, 170);
      ctx.lineTo(135, 195);
      ctx.lineTo(185, 240);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(327, 170);
      ctx.lineTo(377, 195);
      ctx.lineTo(327, 240);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Head & Red/Blonde Spiky Flame Hair
      ctx.fillStyle = '#ffedd5';
      ctx.beginPath();
      ctx.ellipse(256, 120, 36, 42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair (Flame Red with Gold Highlights)
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(220, 110);
      ctx.quadraticCurveTo(256, 40, 292, 110);
      ctx.lineTo(275, 75);
      ctx.lineTo(256, 50);
      ctx.lineTo(235, 75);
      ctx.closePath();
      ctx.fill();

      // Eyes & Brow
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(238, 110, 14, 4);
      ctx.fillRect(260, 110, 14, 4);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(245, 122, 5, 0, Math.PI * 2);
      ctx.arc(267, 122, 5, 0, Math.PI * 2);
      ctx.fill();

      // Confident smile
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(256, 138, 10, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Phoenix Circlet
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(225, 95);
      ctx.lineTo(256, 85);
      ctx.lineTo(287, 95);
      ctx.stroke();

      return canvas.toDataURL('image/png');
    }

    function drawSolarisPhoenixRun(frameIdx) {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);

      const strideAngles = [-0.45, -0.15, 0.45, 0.15];
      const legAngle = strideAngles[frameIdx];

      // Fiery Cape Billowing
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(220, 180);
      ctx.lineTo(130 + frameIdx * 10, 390);
      ctx.lineTo(382 - frameIdx * 10, 390);
      ctx.lineTo(292, 180);
      ctx.closePath();
      ctx.fill();

      // Left Leg
      ctx.save();
      ctx.translate(225, 300);
      ctx.rotate(legAngle);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-18, 0, 36, 120);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-22, 50, 44, 70);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.strokeRect(-22, 50, 44, 70);
      ctx.restore();

      // Right Leg
      ctx.save();
      ctx.translate(287, 300);
      ctx.rotate(-legAngle);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-18, 0, 36, 120);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-22, 50, 44, 70);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.strokeRect(-22, 50, 44, 70);
      ctx.restore();

      // Back Torso
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(210, 180);
      ctx.lineTo(220, 300);
      ctx.lineTo(292, 300);
      ctx.lineTo(302, 180);
      ctx.closePath();
      ctx.fill();

      // Heavy Gold Plate
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.strokeRect(220, 190, 72, 95);

      // Shoulders
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(175, 175, 45, 35);
      ctx.fillRect(292, 175, 45, 35);

      // Head (back view)
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(256, 130, 34, 0, Math.PI * 2);
      ctx.fill();

      // Sparks trail
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(210, 430, 6, 0, Math.PI * 2);
      ctx.arc(302, 430, 8, 0, Math.PI * 2);
      ctx.fill();

      return canvas.toDataURL('image/png');
    }

    function drawSolarisPhoenixJump() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(200, 150);
      ctx.lineTo(80, 350);
      ctx.lineTo(432, 350);
      ctx.lineTo(312, 150);
      ctx.closePath();
      ctx.fill();

      // Body upward
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(220, 170, 72, 110);
      // Tuck legs
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(205, 270, 40, 60);
      ctx.fillRect(267, 270, 40, 60);
      // Head
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(256, 120, 32, 0, Math.PI * 2);
      ctx.fill();
      return canvas.toDataURL('image/png');
    }

    function drawSolarisPhoenixSlide() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(140, 320, 240, 50);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(180, 290, 150, 45);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(170, 295, 26, 0, Math.PI * 2);
      ctx.fill();
      return canvas.toDataURL('image/png');
    }

    // ==========================================
    // 2. Nyx Bloodmoon (Front, 4 Run Frames, Jump, Slide)
    // Dark Crimson & Bone Reaper Assassin
    // ==========================================
    function drawNyxBloodmoonFront() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);

      // Dark Crimson Cloak
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(190, 150);
      ctx.lineTo(130, 430);
      ctx.lineTo(382, 430);
      ctx.lineTo(322, 150);
      ctx.closePath();
      ctx.fill();

      // Slender Legs
      ctx.fillStyle = '#18181b';
      ctx.fillRect(205, 290, 38, 160);
      ctx.fillRect(269, 290, 38, 160);

      // Bloodmoon Reaper Greaves & Bindings
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(202, 350, 44, 90);
      ctx.fillRect(266, 350, 44, 90);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(202, 350, 44, 90);
      ctx.strokeRect(266, 350, 44, 90);

      // Stealth Torso
      ctx.fillStyle = '#27272a';
      ctx.fillRect(200, 160, 112, 140);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(215, 175, 82, 115);

      // Crossed Daggers (Scarlet blades)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(160, 210);
      ctx.lineTo(240, 290);
      ctx.moveTo(352, 210);
      ctx.lineTo(272, 290);
      ctx.stroke();

      // Hood & Mask
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(256, 115, 42, 0, Math.PI * 2);
      ctx.fill();

      // Bone Half-Mask
      ctx.fillStyle = '#f4f4f5';
      ctx.beginPath();
      ctx.moveTo(225, 115);
      ctx.lineTo(256, 145);
      ctx.lineTo(287, 115);
      ctx.lineTo(256, 125);
      ctx.closePath();
      ctx.fill();

      // Glowing Crimson Eyes
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 10;
      ctx.fillRect(238, 108, 12, 6);
      ctx.fillRect(262, 108, 12, 6);
      ctx.shadowBlur = 0;

      return canvas.toDataURL('image/png');
    }

    function drawNyxBloodmoonRun(frameIdx) {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);

      const strideAngles = [-0.48, -0.16, 0.48, 0.16];
      const legAngle = strideAngles[frameIdx];

      // Torn Cloak
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(230, 170);
      ctx.lineTo(150 + frameIdx * 8, 380);
      ctx.lineTo(362 - frameIdx * 8, 380);
      ctx.lineTo(282, 170);
      ctx.closePath();
      ctx.fill();

      // Left Leg
      ctx.save();
      ctx.translate(230, 290);
      ctx.rotate(legAngle);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-16, 0, 32, 130);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-18, 50, 36, 75);
      ctx.restore();

      // Right Leg
      ctx.save();
      ctx.translate(282, 290);
      ctx.rotate(-legAngle);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-16, 0, 32, 130);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-18, 50, 36, 75);
      ctx.restore();

      // Torso & Hood
      ctx.fillStyle = '#27272a';
      ctx.fillRect(215, 170, 82, 120);
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(256, 125, 32, 0, Math.PI * 2);
      ctx.fill();

      // Twin Daggers glint
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(180, 240);
      ctx.lineTo(150, 290);
      ctx.moveTo(332, 240);
      ctx.lineTo(362, 290);
      ctx.stroke();

      return canvas.toDataURL('image/png');
    }

    function drawNyxBloodmoonJump() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(190, 160, 132, 110);
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(256, 120, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(180, 190);
      ctx.lineTo(120, 260);
      ctx.moveTo(332, 190);
      ctx.lineTo(392, 260);
      ctx.stroke();
      return canvas.toDataURL('image/png');
    }

    function drawNyxBloodmoonSlide() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(140, 320, 240, 45);
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(170, 310, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(190, 330);
      ctx.lineTo(360, 330);
      ctx.stroke();
      return canvas.toDataURL('image/png');
    }

    // ==========================================
    // 3. Stella Chronos (Front, 4 Run Frames, Jump, Slide)
    // Pure White, Emerald & Gold Chronomancer
    // ==========================================
    function drawStellaChronosFront() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);

      // Chronos Clock Gear Halo
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(256, 140, 95, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const rad = (i * Math.PI) / 6;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(256 + Math.cos(rad) * 95, 140 + Math.sin(rad) * 95, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Chrono Robe Gown
      const robeGrad = ctx.createLinearGradient(256, 160, 256, 460);
      robeGrad.addColorStop(0, '#f8fafc');
      robeGrad.addColorStop(0.6, '#ecfdf5');
      robeGrad.addColorStop(1, '#059669');
      ctx.fillStyle = robeGrad;
      ctx.beginPath();
      ctx.moveTo(210, 180);
      ctx.lineTo(140, 440);
      ctx.lineTo(372, 440);
      ctx.lineTo(302, 180);
      ctx.closePath();
      ctx.fill();

      // Gold Filigree Trim
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Robe Core & Emerald Gem
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.moveTo(230, 180);
      ctx.lineTo(256, 260);
      ctx.lineTo(282, 180);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#34d399';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(256, 230, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Mage Staff with Rotating Dial
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(365, 100);
      ctx.lineTo(365, 450);
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(365, 95, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Face & Silver-Green Hair
      ctx.fillStyle = '#fef2f2';
      ctx.beginPath();
      ctx.ellipse(256, 125, 32, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair (Mint White)
      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.moveTo(215, 125);
      ctx.quadraticCurveTo(256, 60, 297, 125);
      ctx.lineTo(280, 95);
      ctx.lineTo(256, 75);
      ctx.lineTo(232, 95);
      ctx.closePath();
      ctx.fill();

      // Emerald Eyes
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(246, 125, 5, 0, Math.PI * 2);
      ctx.arc(266, 125, 5, 0, Math.PI * 2);
      ctx.fill();

      // Tiara
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(240, 100);
      ctx.lineTo(256, 85);
      ctx.lineTo(272, 100);
      ctx.closePath();
      ctx.fill();

      return canvas.toDataURL('image/png');
    }

    function drawStellaChronosRun(frameIdx) {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);

      const strideAngles = [-0.42, -0.14, 0.42, 0.14];
      const legAngle = strideAngles[frameIdx];

      // Flowing Emerald Robe
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.moveTo(225, 180);
      ctx.lineTo(150 + frameIdx * 10, 420);
      ctx.lineTo(362 - frameIdx * 10, 420);
      ctx.lineTo(287, 180);
      ctx.closePath();
      ctx.fill();

      // White Mage Boots
      ctx.save();
      ctx.translate(230, 310);
      ctx.rotate(legAngle);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-14, 0, 28, 120);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-16, 60, 32, 55);
      ctx.restore();

      ctx.save();
      ctx.translate(282, 310);
      ctx.rotate(-legAngle);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-14, 0, 28, 120);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-16, 60, 32, 55);
      ctx.restore();

      // Back Robe & Gear Halo
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(256, 150, 70, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(225, 180, 62, 120);

      // Mint Hair Twin Ponytails
      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.arc(256, 125, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(220, 140, 16, 35, -0.3, 0, Math.PI * 2);
      ctx.ellipse(292, 140, 16, 35, 0.3, 0, Math.PI * 2);
      ctx.fill();

      return canvas.toDataURL('image/png');
    }

    function drawStellaChronosJump() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      ctx.arc(256, 260, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.fillRect(225, 180, 62, 100);
      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.arc(256, 125, 30, 0, Math.PI * 2);
      ctx.fill();
      return canvas.toDataURL('image/png');
    }

    function drawStellaChronosSlide() {
      const { canvas, ctx } = helperCanvas(512, 512);
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = '#059669';
      ctx.fillRect(140, 330, 240, 45);
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(180, 305, 140, 40);
      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.arc(170, 310, 24, 0, Math.PI * 2);
      ctx.fill();
      return canvas.toDataURL('image/png');
    }

    // Generate All
    results['solaris_phoenix_front.png'] = drawSolarisPhoenixFront();
    results['solaris_phoenix_run_f1.png'] = drawSolarisPhoenixRun(0);
    results['solaris_phoenix_run_f2.png'] = drawSolarisPhoenixRun(1);
    results['solaris_phoenix_run_f3.png'] = drawSolarisPhoenixRun(2);
    results['solaris_phoenix_run_f4.png'] = drawSolarisPhoenixRun(3);
    results['solaris_phoenix_jump.png'] = drawSolarisPhoenixJump();
    results['solaris_phoenix_slide.png'] = drawSolarisPhoenixSlide();

    results['nyx_bloodmoon_front.png'] = drawNyxBloodmoonFront();
    results['nyx_bloodmoon_run_f1.png'] = drawNyxBloodmoonRun(0);
    results['nyx_bloodmoon_run_f2.png'] = drawNyxBloodmoonRun(1);
    results['nyx_bloodmoon_run_f3.png'] = drawNyxBloodmoonRun(2);
    results['nyx_bloodmoon_run_f4.png'] = drawNyxBloodmoonRun(3);
    results['nyx_bloodmoon_jump.png'] = drawNyxBloodmoonJump();
    results['nyx_bloodmoon_slide.png'] = drawNyxBloodmoonSlide();

    results['stella_chronos_front.png'] = drawStellaChronosFront();
    results['stella_chronos_run_f1.png'] = drawStellaChronosRun(0);
    results['stella_chronos_run_f2.png'] = drawStellaChronosRun(1);
    results['stella_chronos_run_f3.png'] = drawStellaChronosRun(2);
    results['stella_chronos_run_f4.png'] = drawStellaChronosRun(3);
    results['stella_chronos_jump.png'] = drawStellaChronosJump();
    results['stella_chronos_slide.png'] = drawStellaChronosSlide();

    return results;
  });

  for (const [filename, dataUrl] of Object.entries(generated)) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, base64Data, 'base64');
    console.log(`Saved: ${filepath}`);
  }

  await browser.close();
  console.log('✨ All v5 Character & Costume assets generated successfully!');
}

main().catch(err => {
  console.error('Fatal error generating assets:', err);
  process.exit(1);
});
