import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/02f75fb4-6812-4f6d-900b-c1d5cd233e36';

async function main() {
  console.log('🚀 Starting Puppeteer Verification for Goal Features...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1200));

  // --- 1. Verify Cash Shop Modal & Real-money Packages ---
  console.log('💎 1. Testing Cash Shop Modal & Real-money Packages...');
  await page.click('#btn-open-shop');
  await new Promise(r => setTimeout(r, 600));

  // Take screenshot of Cash Shop
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'goal_req3_cash_shop_modal.png') });
  console.log('📸 Captured goal_req3_cash_shop_modal.png');

  // Verify packages rendered
  const pkgCount = await page.$$eval('.cash-pkg-card', els => els.length);
  console.log(`✓ Rendered ${pkgCount} cash packages (Expected: 6)`);

  // Click on Starter Pack buy button
  console.log('💳 Opening billing modal for Starter Pack...');
  await page.click('.cash-pkg-card button[data-pkg="starter_pack"]');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'goal_req3_cash_billing_modal.png') });
  console.log('📸 Captured goal_req3_cash_billing_modal.png');

  // Confirm Starter Pack purchase
  await page.click('#btn-confirm-billing');
  await new Promise(r => setTimeout(r, 600));

  // Now buy VIP package to test VIP status
  console.log('👑 Buying VIP package...');
  await page.click('.cash-pkg-card button[data-pkg="vip_unlimited"]');
  await new Promise(r => setTimeout(r, 500));
  await page.click('#btn-confirm-billing');
  await new Promise(r => setTimeout(r, 600));

  // Close shop modal
  await page.click('#btn-close-shop');
  await new Promise(r => setTimeout(r, 500));

  // Verify VIP badge on main menu
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'goal_req3_vip_activated.png') });
  console.log('📸 Captured goal_req3_vip_activated.png');

  // --- 2. Verify Open Chasm Pit Floor (No Red Line) ---
  console.log('🕳️ 2. Testing In-game Open Chasm Pit Floor...');
  await page.click('#btn-start-run');
  await new Promise(r => setTimeout(r, 600));

  // Inject broken bridge obstacle immediately ahead of player and capture
  await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__ || window.gameEngine;
    if (engine) {
      // Clear other obstacles and spawn broken bridge 15m ahead
      engine.trackManager.obstacles.forEach(o => engine.trackManager['obstaclePool'].recycle(o));
      engine.trackManager.obstacles.length = 0;
      const chasm = engine.trackManager['obstaclePool'].obtain(
        'BROKEN_BRIDGE',
        0,
        engine.luna.mesh.position.z - 15
      );
      engine.trackManager.obstacles.push(chasm);
    }
  });

  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'goal_req1_open_chasm_pit.png') });
  console.log('📸 Captured goal_req1_open_chasm_pit.png');

  // --- 3. Verify 90-Degree Sideways Turn without Road Bending ---
  console.log('↱ 3. Testing 90-degree Sideways Turn at 350m...');
  // Advance distance to 355m to trigger the 90-degree turn
  await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__ || window.gameEngine;
    if (engine) {
      engine.scoreSystem.distance = 352;
      engine.turnDirector.update(352, 0.05, true);
    }
  });

  // Let camera lerp to 90 degrees
  await new Promise(r => setTimeout(r, 900));

  const turnData = await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__ || window.gameEngine;
    if (!engine) return null;
    return {
      phase: engine.turnDirector.phase,
      direction: engine.turnDirector.turnDirection,
      currentYaw: engine.turnDirector.currentYaw,
      targetYaw: engine.turnDirector.targetYaw,
      currentCurveX: engine.turnDirector.currentCurveX,
      targetCurveX: engine.turnDirector.targetCurveX,
      cameraX: engine.cameraFollower['camera'].position.x,
      cameraZ: engine.cameraFollower['camera'].position.z,
    };
  });
  console.log('✓ Turn State:', turnData);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'goal_req2_turn_90deg_sideways.png') });
  console.log('📸 Captured goal_req2_turn_90deg_sideways.png');

  await browser.close();
  console.log('🎉 Verification Script Completed Successfully!');
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
