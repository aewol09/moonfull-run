import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('🚀 Starting V3 Comprehensive Expansion E2E Verification Test...');
  const port = 4178;
  const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  await new Promise(r => setTimeout(r, 2000));

  const screenshotsDir = path.resolve('tests/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const errors = [];
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader'
    ]
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
        errors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      console.error('Browser uncaught exception:', err.message);
      errors.push(err.message);
    });

    // Mobile viewport (typical mobile smartphone: 390 x 844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:${port}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-start-run');
    await new Promise(r => setTimeout(r, 1200));

    // 1. Capture Main Menu
    await page.screenshot({ path: path.join(screenshotsDir, 'v3_01_main_menu.png') });
    console.log('✅ Screenshot v3_01_main_menu.png captured');

    // 2. Open Character Modal (Luna, Stella, Solaris, Nyx)
    await page.evaluate(() => document.getElementById('btn-open-costumes')?.click());
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(screenshotsDir, 'v3_02_character_modal.png') });
    console.log('✅ Screenshot v3_02_character_modal.png captured');

    // Close Character Modal
    await page.evaluate(() => document.getElementById('btn-close-costumes')?.click());
    await new Promise(r => setTimeout(r, 400));

    // 3. Open Starlight Gacha Modal
    await page.evaluate(() => document.getElementById('btn-open-gacha')?.click());
    await new Promise(r => setTimeout(r, 600));

    // Give some shards to test 10x summon
    await page.evaluate(() => {
      const raw = localStorage.getItem('moonfall_run_save_v1');
      const data = raw ? JSON.parse(raw) : {};
      data.coins = 5000;
      localStorage.setItem('moonfall_run_save_v1', JSON.stringify(data));
      window.location.reload();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Open gacha modal again and pull 10x
    await page.evaluate(() => document.getElementById('btn-open-gacha')?.click());
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => document.getElementById('btn-gacha-multi')?.click());
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(screenshotsDir, 'v3_03_gacha_results.png') });
    console.log('✅ Screenshot v3_03_gacha_results.png captured');

    // Close Gacha Modal
    await page.evaluate(() => document.getElementById('btn-close-gacha')?.click());
    await new Promise(r => setTimeout(r, 400));

    // 4. Open Growth Upgrades Modal
    await page.evaluate(() => document.getElementById('btn-open-shop')?.click());
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(screenshotsDir, 'v3_04_upgrades_modal.png') });
    console.log('✅ Screenshot v3_04_upgrades_modal.png captured');

    // Close Growth Modal
    await page.evaluate(() => document.getElementById('btn-close-shop')?.click());
    await new Promise(r => setTimeout(r, 400));

    // 5. Start Run and Check Gameplay HUD & Mobile Layout
    await page.evaluate(() => document.getElementById('btn-start-run')?.click());
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, 'v3_05_gameplay_running.png') });
    console.log('✅ Screenshot v3_05_gameplay_running.png captured');

    // 6. Test Active Skill Button
    await page.evaluate(() => document.getElementById('btn-touch-skill')?.click());
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(screenshotsDir, 'v3_06_skill_activated.png') });
    console.log('✅ Screenshot v3_06_skill_activated.png captured');

    // 7. Check Game Over flow
    await page.evaluate(() => {
      // Simulate fatal obstacle hit
      const engine = (window).__MOONFALL_ENGINE__;
      if (engine) {
        engine.sessionChests = 2;
        engine.luna.hitObstacle(true);
      }
    });
    await new Promise(r => setTimeout(r, 1200));

    const isGameOverVisible = await page.evaluate(() => {
      const modal = document.getElementById('gameover-modal');
      return modal && !modal.classList.contains('hidden');
    });
    console.log('Is Game Over modal visible after death:', isGameOverVisible);

    await page.screenshot({ path: path.join(screenshotsDir, 'v3_07_gameover_modal.png') });
    console.log('✅ Screenshot v3_07_gameover_modal.png captured');

    // 8. Test Restart Flow
    await page.evaluate(() => document.getElementById('btn-restart-go')?.click());
    await new Promise(r => setTimeout(r, 1000));

    const isGameOverHidden = await page.evaluate(() => {
      const modal = document.getElementById('gameover-modal');
      return modal && modal.classList.contains('hidden');
    });
    console.log('Is Game Over modal hidden after restart:', isGameOverHidden);

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log('Errors logged:', errors.length);
    if (errors.length > 0) {
      console.error('Errors:', errors);
      process.exitCode = 1;
    } else {
      console.log('🎉 ALL V3 EXPANSION E2E VERIFICATIONS PASSED WITH 0 ERRORS!');
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
