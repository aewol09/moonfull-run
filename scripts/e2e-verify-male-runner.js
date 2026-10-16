import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/d4821323-b742-40cc-9525-ffce08066851';

async function run() {
  console.log('🚀 Verifying Male Character (Solaris) Selection & Gameplay...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');

  // Initialize storage with unlocked characters
  await page.evaluate(() => {
    const raw = localStorage.getItem('MOONFALL_RUN_SAVE_DATA_V1');
    const data = raw ? JSON.parse(raw) : {};
    data.coins = 10000;
    data.unlockedCharacters = ['luna', 'solaris', 'nyx', 'stella'];
    data.currentCharacter = 'solaris';
    data.currentCostume = 'solaris_default';
    localStorage.setItem('MOONFALL_RUN_SAVE_DATA_V1', JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));

  // Select Solaris
  await page.click('#btn-open-costumes');
  await page.waitForSelector('#character-roster-list:not(.hidden)');
  await new Promise(r => setTimeout(r, 400));

  // Find Solaris button and click
  const solarisBtn = await page.$('button[data-char="solaris"]');
  if (solarisBtn) {
    await solarisBtn.click();
  }
  await new Promise(r => setTimeout(r, 600));

  await page.click('#btn-close-costumes');
  await new Promise(r => setTimeout(r, 600));

  // Screenshot main menu with Solaris
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_solaris_menu_selected_v4.png') });
  console.log('📸 10_solaris_menu_selected_v4.png captured.');

  // Start Run with Solaris
  await page.click('#btn-start-run');
  await page.waitForSelector('#game-hud.active');
  await new Promise(r => setTimeout(r, 1400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_solaris_running_v4.png') });
  console.log('📸 11_solaris_running_v4.png captured.');

  await browser.close();
  console.log('🎉 Male character verification completed successfully!');
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
