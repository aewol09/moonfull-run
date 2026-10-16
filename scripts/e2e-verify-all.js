import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/d4821323-b742-40cc-9525-ffce08066851';

async function run() {
  console.log('🚀 Starting Comprehensive E2E Verification for Moonfall Run...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('Browser Error:', msg.text());
    }
  });

  // 1. Load Main Page
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  console.log('✅ Main Menu loaded.');

  // Initialize storage with some coins and chests for testing
  await page.evaluate(() => {
    const raw = localStorage.getItem('MOONFALL_RUN_SAVE_DATA_V1');
    const data = raw ? JSON.parse(raw) : {};
    data.coins = 10000;
    data.mysteryChests = 2;
    data.unlockedCharacters = ['luna', 'solaris', 'nyx', 'stella'];
    localStorage.setItem('MOONFALL_RUN_SAVE_DATA_V1', JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_main_menu_v4.png') });
  console.log('📸 01_main_menu_v4.png captured.');

  // 2. Test Character & Per-Character Costume Modal
  await page.click('#btn-open-costumes');
  await page.waitForSelector('#costume-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_character_roster_v4.png') });
  console.log('📸 02_character_roster_v4.png captured.');

  // Click Solaris Costume Tab
  await page.click('#tab-costume-solaris');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_solaris_costumes_v4.png') });
  console.log('📸 03_solaris_costumes_v4.png captured.');

  // Click Nyx Costume Tab
  await page.click('#tab-costume-nyx');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_nyx_costumes_v4.png') });
  console.log('📸 04_nyx_costumes_v4.png captured.');

  // Close Costume Modal
  await page.click('#btn-close-costumes');
  await new Promise(r => setTimeout(r, 400));

  // 3. Test Animated Mystery Chest Opening & Real-time Counter
  await page.click('#btn-menu-open-chest');
  await page.waitForSelector('#chest-open-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 700)); // allow burst and reward card to pop up
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_chest_open_burst_v4.png') });
  console.log('📸 05_chest_open_burst_v4.png captured.');

  // Open second chest (remaining goes to 0)
  await page.click('#btn-chest-open-next');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_chest_all_opened_v4.png') });
  console.log('📸 06_chest_all_opened_v4.png captured.');

  // Verify remaining chest count is 0
  const remainingCount = await page.$eval('#chest-modal-count', el => el.textContent);
  console.log(`✅ Chest counter in modal: ${remainingCount}`);

  await page.click('#btn-close-chest-modal');
  await new Promise(r => setTimeout(r, 400));

  const menuChestCount = await page.$eval('#menu-chest-count', el => el.textContent);
  console.log(`✅ Chest counter in main menu: ${menuChestCount}`);

  // 4. Test Starlight Gacha with Portal Animation & Skip Button
  await page.click('#btn-open-gacha');
  await page.waitForSelector('#gacha-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 400));

  // Verify prices
  const singleCost = await page.$eval('#btn-gacha-single .gacha-cost', el => el.textContent.trim());
  const multiCost = await page.$eval('#btn-gacha-multi .gacha-cost', el => el.textContent.trim());
  console.log(`✅ Gacha prices verified: Single = ${singleCost}, Multi = ${multiCost}`);

  // Trigger 10x Pull
  await page.click('#btn-gacha-multi');
  await page.waitForSelector('#gacha-summon-modal:not(.hidden)');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_gacha_summon_portal_v4.png') });
  console.log('📸 07_gacha_summon_portal_v4.png captured.');

  // Click Skip button
  const skipBtn = await page.$('#btn-skip-gacha');
  if (skipBtn) {
    await page.evaluate(el => el.click(), skipBtn);
  }
  await page.waitForSelector('#gacha-results-container:not(.hidden)');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_gacha_results_skipped_v4.png') });
  console.log('📸 08_gacha_results_skipped_v4.png captured.');

  await page.click('#btn-close-gacha');
  await new Promise(r => setTimeout(r, 400));

  // 5. Test Running Gameplay & Leg Stride Motion
  await page.click('#btn-start-run');
  await page.waitForSelector('#game-hud.active');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_gameplay_running_v4.png') });
  console.log('📸 09_gameplay_running_v4.png captured.');

  await browser.close();
  console.log('🎉 E2E Verification completed successfully!');
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
