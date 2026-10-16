import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a';

async function main() {
  console.log('Starting full layout & anime character verification...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');

  // Unlock all characters, costumes, and provide coins
  await page.evaluate(() => {
    const key = 'MOONFALL_RUN_SAVE_DATA_V1';
    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(key) || '{}');
    } catch (e) {}
    data.unlockedCharacters = ['luna', 'stella', 'solaris', 'nyx'];
    data.unlockedCostumes = [
      'default', 'luna_default', 'luna_guardian', 'luna_dawn',
      'stella_default', 'stella_archmage', 'stella_chronos',
      'solaris_default', 'solaris_obsidian', 'solaris_phoenix',
      'nyx_default', 'nyx_cyber', 'nyx_bloodmoon'
    ];
    data.moonCoins = 99999;
    localStorage.setItem(key, JSON.stringify(data));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1200));

  // 1. Capture Main Menu with new top layout and unobstructed hero
  console.log('1. Capturing main menu layout...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_01_main_menu_clean.png') });

  // 2. Open Costumes Modal
  console.log('2. Opening costumes modal...');
  await page.click('#btn-open-costumes');
  await page.waitForSelector('#costume-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 600));

  // Screenshot Luna
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_02_costumes_luna.png') });

  // Switch to Stella
  console.log('Selecting Stella...');
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.hero-chip'));
    const stellaChip = chips.find(c => c.textContent.includes('스텔라'));
    stellaChip?.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_03_costumes_stella.png') });

  // Switch to Solaris
  console.log('Selecting Solaris...');
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.hero-chip'));
    const solarisChip = chips.find(c => c.textContent.includes('솔라리스'));
    solarisChip?.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_04_costumes_solaris.png') });

  // Switch to Nyx
  console.log('Selecting Nyx...');
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.hero-chip'));
    const nyxChip = chips.find(c => c.textContent.includes('닉스'));
    nyxChip?.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_05_costumes_nyx.png') });

  // Equip Nyx and close modal
  console.log('Equipping Nyx and closing modal...');
  await page.evaluate(() => {
    const actionBtn = document.getElementById('btn-select-hero-action');
    actionBtn?.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.click('#btn-close-costumes-corner');
  await new Promise(r => setTimeout(r, 500));

  // 3. Start Run with Nyx and verify in-game HUD layout
  console.log('3. Starting run with Nyx...');
  await page.click('#btn-start-run');
  await page.waitForSelector('#game-hud:not(.hidden)', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_06_hud_nyx_running.png') });

  // Let him run for 2 seconds
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_07_nyx_gameplay_action.png') });

  // Pause modal check
  console.log('Checking Pause Modal...');
  await page.click('#btn-pause');
  await page.waitForSelector('#pause-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_08_pause_modal_clean.png') });

  // Close Pause and reload to test Solaris
  console.log('Testing Solaris gameplay...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await page.click('#btn-open-costumes');
  await page.waitForSelector('#costume-modal:not(.hidden)');
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.hero-chip'));
    const solarisChip = chips.find(c => c.textContent.includes('솔라리스'));
    solarisChip?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => {
    const actionBtn = document.getElementById('btn-select-hero-action');
    actionBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.click('#btn-close-costumes-corner');
  await new Promise(r => setTimeout(r, 400));
  await page.click('#btn-start-run');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_09_solaris_running.png') });

  // Reload to test Stella
  console.log('Testing Stella gameplay...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await page.click('#btn-open-costumes');
  await page.waitForSelector('#costume-modal:not(.hidden)');
  await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.hero-chip'));
    const stellaChip = chips.find(c => c.textContent.includes('스텔라'));
    stellaChip?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => {
    const actionBtn = document.getElementById('btn-select-hero-action');
    actionBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.click('#btn-close-costumes-corner');
  await new Promise(r => setTimeout(r, 400));
  await page.click('#btn-start-run');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_10_stella_running.png') });

  await browser.close();
  console.log('All layout and anime hero verifications completed successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
