import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('🚀 Starting Comprehensive E2E Verification Test...');
  const port = 4175;
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

  await page.setViewport({ width: 420, height: 840, isMobile: true, hasTouch: true });
  await page.goto(`http://localhost:${port}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#btn-start-run');
  await new Promise(r => setTimeout(r, 1000));

  // 1. Capture Main Menu with new badge icons
  await page.screenshot({ path: path.join(screenshotsDir, '00_main_menu.png') });
  console.log('✅ Screenshot 00_main_menu.png captured');

  // 2. Open Costumes Modal
  await page.evaluate(() => document.getElementById('btn-open-costumes')?.click());
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotsDir, '01_costume_modal.png') });
  console.log('✅ Screenshot 01_costume_modal.png captured');

  // Close Costumes Modal
  await page.evaluate(() => document.getElementById('btn-close-costumes')?.click());
  await new Promise(r => setTimeout(r, 400));

  // 3. Open Growth / Shop Modal and check all 6 upgrades
  await page.evaluate(() => document.getElementById('btn-open-shop')?.click());
  await new Promise(r => setTimeout(r, 600));
  const upgradeItems = await page.$$('.upgrade-item');
  console.log(`Found ${upgradeItems.length} upgrade items in shop (expected 6)`);
  if (upgradeItems.length !== 6) {
    throw new Error(`Expected 6 upgrade items, got ${upgradeItems.length}`);
  }
  await page.screenshot({ path: path.join(screenshotsDir, '05_growth_modal.png') });
  console.log('✅ Screenshot 05_growth_modal.png captured');

  // Close Shop Modal
  await page.evaluate(() => document.getElementById('btn-close-shop')?.click());
  await new Promise(r => setTimeout(r, 400));

  // 4. Start Running
  await page.evaluate(() => document.getElementById('btn-start-run')?.click());
  await new Promise(r => setTimeout(r, 1200));

  // Verify HUD is active and Fever bar exists
  const hudActive = await page.$eval('#game-hud', el => el.classList.contains('active'));
  console.log(`HUD active: ${hudActive}`);
  if (!hudActive) throw new Error('Game HUD failed to activate upon starting run');

  await page.screenshot({ path: path.join(screenshotsDir, '02_gameplay.png') });
  console.log('✅ Screenshot 02_gameplay.png captured');

  // 5. Test Jump & Slide
  await page.keyboard.press('KeyW');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: path.join(screenshotsDir, '06_gameplay_actions.png') });
  console.log('✅ Jump action verified');

  await page.keyboard.press('KeyS');
  await new Promise(r => setTimeout(r, 150));

  // 6. Wait for obstacle collision / trigger game over
  console.log('Triggering lethal collision to test Game Over modal...');
  await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__;
    if (engine && engine.luna) {
      engine.luna.hitObstacle(true);
    }
  });

  // Wait for death sequence and Game Over modal to appear
  await page.waitForFunction(() => {
    const modal = document.getElementById('gameover-modal');
    return modal && !modal.classList.contains('hidden');
  }, { timeout: 4000 });

  await page.screenshot({ path: path.join(screenshotsDir, '07_game_over.png') });
  console.log('✅ Screenshot 07_game_over.png captured');

  // 7. Click Restart ("다시 달리기") and verify modal disappears immediately!
  console.log('Clicking "다시 달리기" (Restart)...');
  await page.evaluate(() => document.getElementById('btn-restart-go')?.click());
  await new Promise(r => setTimeout(r, 800));

  const isModalHidden = await page.$eval('#gameover-modal', el => el.classList.contains('hidden'));
  console.log(`Is Game Over modal hidden after restart: ${isModalHidden}`);
  if (!isModalHidden) {
    throw new Error('BUG NOT FIXED: Game Over modal is still visible after clicking restart!');
  }

  const isGameRunning = await page.$eval('#game-hud', el => el.classList.contains('active'));
  console.log(`Is Game HUD active after restart: ${isGameRunning}`);
  if (!isGameRunning) {
    throw new Error('Game failed to resume running after restart');
  }

  await page.screenshot({ path: path.join(screenshotsDir, '08_restart_clean.png') });
  console.log('✅ Screenshot 08_restart_clean.png captured - Modal cleanly hidden!');

  await browser.close();
  server.kill('SIGTERM');

  if (errors.length > 0) {
    console.error('Failed with console errors:', errors);
    process.exit(1);
  }

  console.log('🎉 ALL COMPREHENSIVE E2E TESTS PASSED WITH 0 ERRORS!');
}

run().catch(e => {
  console.error('E2E Test Failed:', e);
  process.exit(1);
});
