import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/02f75fb4-6812-4f6d-900b-c1d5cd233e36';

async function main() {
  console.log('--- Starting Accurate In-Game Visual Capture Script ---');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));

  // Unlock all characters and start game
  await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__;
    engine.storage.addCoins(99999);
    engine.storage.unlockCharacter('solaris', 1000);
    engine.storage.unlockCharacter('nyx', 1500);
    engine.storage.unlockCharacter('stella', 2000);
    document.getElementById('btn-start-run')?.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  // Ensure shield is down for crystal-clear character visibility during screenshots
  await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__;
    engine.luna.hasShield = false;
    engine.luna.shieldBubble.visible = false;
  });

  const heroes = ['luna', 'solaris', 'nyx', 'stella'];
  for (const heroId of heroes) {
    console.log(`Capturing gameplay running for ${heroId}...`);

    // Switch to hero
    await page.evaluate((id) => {
      const engine = window.__MOONFALL_ENGINE__;
      engine.luna.applyCharacter(id, `${id}_default`);
      engine.luna.hasShield = false;
      engine.luna.shieldBubble.visible = false;
    }, heroId);

    // Stride 1: Left foot plant (runAnimTime = 0)
    await page.evaluate(() => {
      const engine = window.__MOONFALL_ENGINE__;
      engine.luna.runAnimTime = 0.0;
      engine.luna.update(0.016, 18);
    });
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `ingame_${heroId}_run_stride1.png`) });

    // Stride 2: Right foot plant / opposite leg (runAnimTime = Math.PI)
    await page.evaluate(() => {
      const engine = window.__MOONFALL_ENGINE__;
      engine.luna.runAnimTime = Math.PI;
      engine.luna.update(0.016, 18);
    });
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `ingame_${heroId}_run_stride2.png`) });
    
    console.log(`✅ Captured both strides for ${heroId}`);
  }

  // Capture Track Curving Right in active gameplay
  console.log('Capturing Track Curving Right in gameplay...');
  await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__;
    engine.luna.applyCharacter('luna', 'luna_default');
    engine.luna.hasShield = false;
    engine.luna.shieldBubble.visible = false;
    engine.scoreSystem.distance = 125;
    for (let i = 0; i < 45; i++) {
      engine.turnDirector.update(125, 0.05, true);
      engine.curveDirector.update(0.05, true, engine.turnDirector.currentCurveX);
      engine.cameraFollower.update(engine.luna.mesh.position, false, false, 0.05, engine.turnDirector.currentYaw);
    }
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_track_curving_right.png') });

  // Capture Track Curving Left in active gameplay
  console.log('Capturing Track Curving Left in gameplay...');
  await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__;
    for (let i = 0; i < 30; i++) {
      engine.turnDirector.update(240, 0.05, true);
      engine.curveDirector.update(0.05, true, engine.turnDirector.currentCurveX);
    }
    engine.scoreSystem.distance = 375;
    for (let i = 0; i < 45; i++) {
      engine.turnDirector.update(375, 0.05, true);
      engine.curveDirector.update(0.05, true, engine.turnDirector.currentCurveX);
      engine.cameraFollower.update(engine.luna.mesh.position, false, false, 0.05, engine.turnDirector.currentYaw);
    }
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_track_curving_left.png') });

  await browser.close();
  console.log('🎉 All in-game screenshots captured with 100% fidelity!');
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
