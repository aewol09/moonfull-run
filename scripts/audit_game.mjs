import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/72342643-b4fb-4c1e-9565-9dc80de3f962/scratch';

async function runAudit() {
  console.log('=== STARTING COMPREHENSIVE GAME AUDIT ===');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--window-size=412,915'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(`[CONSOLE ERROR] ${text}`);
      console.error('CONSOLE ERROR:', text);
    } else if (msg.type() === 'warning') {
      warnings.push(`[CONSOLE WARN] ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[PAGE ERROR] ${err.message}\n${err.stack}`);
    console.error('PAGE ERROR:', err.message);
  });

  try {
    console.log('1. Loading main page...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_main_menu.png') });
    console.log('Saved 01_main_menu.png');

    const engineReady = await page.evaluate(() => !!window.gameEngine);
    console.log('GameEngine exists on window:', engineReady);

    // 2. Test Settings Modal & Corner Close Button
    console.log('2. Testing Settings Modal & Corner Close...');
    await page.click('#btn-open-settings');
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_settings_modal.png') });

    // Toggle quality buttons
    await page.click('.btn-quality[data-quality="low"]');
    await page.click('.btn-quality[data-quality="high"]');
    // Test top-right corner close button
    await page.click('#btn-close-settings-corner');
    await new Promise(r => setTimeout(r, 300));

    // 3. Test Costumes & Character Modal & Hero Chips
    console.log('3. Testing Costumes & Character Modal & Hero Chips...');
    await page.click('#btn-open-costumes');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_costumes_modal.png') });

    // Switch between heroes in hero bar using .hero-chip
    const heroChipsCount = (await page.$$('.hero-chip')).length;
    console.log(`Found ${heroChipsCount} hero chips.`);
    for (let i = 0; i < heroChipsCount; i++) {
      const chips = await page.$$('.hero-chip');
      if (chips[i]) await chips[i].click();
      await new Promise(r => setTimeout(r, 300));
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_costumes_last_hero.png') });
    // Test corner close button
    await page.click('#btn-close-costumes-corner');
    await new Promise(r => setTimeout(r, 300));

    // 4. Test Growth Modal & Corner Close
    console.log('4. Testing Growth Modal...');
    await page.click('#btn-open-growth');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_growth_modal.png') });

    await page.click('#btn-buy-magnet');
    await new Promise(r => setTimeout(r, 200));
    await page.click('#btn-close-growth-corner');
    await new Promise(r => setTimeout(r, 300));

    // 5. Test Shop Modal (Shards & Cash) & Billing
    console.log('5. Testing Shop Modal & Billing...');
    await page.click('#btn-open-shop');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_shop_items.png') });

    // Switch to Cash shop tab
    await page.click('#tab-btn-cash-shop');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_shop_cash.png') });

    // Click starter package to open billing modal
    await page.evaluate(() => {
      const btn = document.querySelector('.btn-cash-buy');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_billing_modal.png') });

    // Cancel billing modal
    await page.click('#btn-cancel-billing');
    await new Promise(r => setTimeout(r, 300));

    // Close shop modal via corner button
    await page.click('#btn-close-shop-corner');
    await new Promise(r => setTimeout(r, 300));

    // 6. Test Starlight Gacha Modal
    console.log('6. Testing Gacha Modal...');
    await page.click('#btn-open-gacha');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_gacha_modal.png') });

    // Toggle rates table
    await page.click('#btn-toggle-gacha-rates');
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_gacha_rates.png') });

    // Grant 10,000 coins and do 1 pull and 10 pull
    await page.evaluate(() => {
      window.gameEngine.storage.addCoins(10000);
      window.gameEngine.ui.updateWalletDisplays();
    });

    // 1-Pull
    await page.click('#btn-gacha-single');
    await new Promise(r => setTimeout(r, 300));
    const skipBtn1 = await page.$('#btn-skip-gacha');
    if (skipBtn1) await skipBtn1.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_gacha_single_result.png') });

    // 10-Pull
    await page.click('#btn-gacha-multi');
    await new Promise(r => setTimeout(r, 300));
    const skipBtn2 = await page.$('#btn-skip-gacha');
    if (skipBtn2) await skipBtn2.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_gacha_multi_result.png') });

    await page.click('#btn-close-gacha-corner');
    await new Promise(r => setTimeout(r, 300));

    // 7. Test Mystery Chest Modal
    console.log('7. Testing Mystery Chest Modal...');
    await page.evaluate(() => {
      window.gameEngine.storage.addMysteryChests(3);
      window.gameEngine.ui.updateWalletDisplays();
    });
    await page.click('#btn-menu-open-chest');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_chest_modal.png') });

    // Open one chest
    await page.click('#btn-chest-open-next');
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_chest_opened.png') });
    await page.click('#btn-close-chest-corner');
    await new Promise(r => setTimeout(r, 300));

    // 8. Test Gameplay Loop
    console.log('8. Testing Gameplay Loop...');
    await page.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_gameplay_running.png') });

    // Test Lane Movement, Jump, Slide, Skill
    await page.keyboard.press('KeyD');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('KeyA');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('KeyW');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('KeyS');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('KeyE');
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_gameplay_skill_active.png') });

    // 9. Test Pause & Resume
    console.log('9. Testing Pause & Resume...');
    await page.click('#btn-pause');
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_pause_modal.png') });

    await page.click('#btn-resume');
    await new Promise(r => setTimeout(r, 400));

    // 10. Test Ad Revive & Continue Flow
    console.log('10. Testing Ad Revive Continue Flow...');
    await page.evaluate(() => {
      const engine = window.gameEngine;
      engine.showAdReviveModal();
    });

    await page.waitForFunction(() => {
      const modal = document.getElementById('revive-modal');
      return modal && !modal.classList.contains('hidden');
    }, { timeout: 10000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_revive_modal.png') });

    // Click watch ad to revive
    await page.evaluate(() => {
      document.getElementById('btn-watch-ad-revive')?.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_ad_player_modal.png') });

    // Wait for ad to complete (either claim button shows or modal auto-completes and closes)
    await page.waitForFunction(() => {
      const modal = document.getElementById('ad-player-modal');
      const btn = document.getElementById('btn-claim-ad-reward');
      return (btn && !btn.classList.contains('hidden')) || (modal && modal.classList.contains('hidden'));
    }, { timeout: 10000 });

    await page.evaluate(() => {
      const btn = document.getElementById('btn-claim-ad-reward');
      if (btn && !btn.classList.contains('hidden')) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_revived_running.png') });

    // 11. Test Game Over Modal
    console.log('11. Testing Game Over Modal...');
    await page.evaluate(() => {
      const engine = window.gameEngine;
      engine.stateManager.setState('GAME_OVER');
    });

    await page.waitForFunction(() => {
      const modal = document.getElementById('gameover-modal');
      return modal && !modal.classList.contains('hidden');
    }, { timeout: 10000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_gameover_modal.png') });

    // Click Restart
    await page.evaluate(() => {
      document.getElementById('btn-restart-go')?.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_restarted_gameplay.png') });

    console.log('=== AUDIT FINISHED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Audit encountered error:', err);
    errors.push(`[RUN ERROR] ${err.message}\n${err.stack}`);
  } finally {
    await browser.close();
  }

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Total Errors: ${errors.length}`);
  console.log(`Total Warnings: ${warnings.length}`);
  if (errors.length > 0) {
    console.log('ERRORS LIST:');
    errors.forEach(e => console.log(e));
  }
}

runAudit();
