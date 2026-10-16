import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a';

async function main() {
  console.log('Testing Solaris and Nyx Character Selection and Running Gameplay...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');

  // Unlock all heroes and costumes using correct STORAGE_KEY
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
  await new Promise(r => setTimeout(r, 1000));

  // -------------------------------------------------------------
  // 1. Open Costume Modal & Select Solaris (3rd hero chip)
  // -------------------------------------------------------------
  console.log('Opening costume modal and clicking Solaris chip...');
  await page.click('#btn-open-costumes');
  await page.waitForSelector('#costume-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const chips = document.querySelectorAll('.hero-chip');
    console.log('Found chips:', chips.length);
    // Find chip for Solaris (Solaris or index 2)
    for (const c of chips) {
      if (c.textContent.includes('솔라리스')) {
        c.click();
        return;
      }
    }
    if (chips[2]) chips[2].click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const solarisModalShot = path.join(ARTIFACT_DIR, 'hero_01_solaris_costume_modal.png');
  await page.screenshot({ path: solarisModalShot });
  console.log('Saved:', solarisModalShot);

  // Equip Solaris
  await page.evaluate(() => {
    const btn = document.getElementById('btn-select-hero-action');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Close modal and start run with Solaris
  await page.click('#btn-close-costumes');
  await new Promise(r => setTimeout(r, 600));

  console.log('Starting run with Solaris...');
  await page.click('#btn-start-run');
  await new Promise(r => setTimeout(r, 1800));

  const solarisRunShot = path.join(ARTIFACT_DIR, 'hero_02_solaris_running_gameplay.png');
  await page.screenshot({ path: solarisRunShot });
  console.log('Saved:', solarisRunShot);

  // Return to main menu or reload
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('MOONFALL_RUN_SAVE_DATA_V1') || '{}');
    data.currentCharacter = 'nyx';
    data.currentCostume = 'nyx_default';
    localStorage.setItem('MOONFALL_RUN_SAVE_DATA_V1', JSON.stringify(data));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));

  // -------------------------------------------------------------
  // 2. Open Costume Modal & Select Nyx (4th hero chip)
  // -------------------------------------------------------------
  console.log('Opening costume modal and clicking Nyx chip...');
  await page.click('#btn-open-costumes');
  await page.waitForSelector('#costume-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const chips = document.querySelectorAll('.hero-chip');
    for (const c of chips) {
      if (c.textContent.includes('닉스')) {
        c.click();
        return;
      }
    }
    if (chips[3]) chips[3].click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const nyxModalShot = path.join(ARTIFACT_DIR, 'hero_03_nyx_costume_modal.png');
  await page.screenshot({ path: nyxModalShot });
  console.log('Saved:', nyxModalShot);

  // Equip Nyx
  await page.evaluate(() => {
    const btn = document.getElementById('btn-select-hero-action');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Close modal and start run with Nyx
  await page.click('#btn-close-costumes');
  await new Promise(r => setTimeout(r, 600));

  console.log('Starting run with Nyx...');
  await page.click('#btn-start-run');
  await new Promise(r => setTimeout(r, 1800));

  const nyxRunShot = path.join(ARTIFACT_DIR, 'hero_04_nyx_running_gameplay.png');
  await page.screenshot({ path: nyxRunShot });
  console.log('Saved:', nyxRunShot);

  await browser.close();
  console.log('🎉 Solaris and Nyx verification completed!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
