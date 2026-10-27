import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/c1e388a1-ec45-402b-8547-fdc23a9946bd';

async function main() {
  console.log('=== VERIFYING CHEST ASSETS AND APP ICON ===');
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

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  console.log('Loading local preview...');
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Verify link rel="icon" tag in head
  const iconHref = await page.$eval('link[rel="icon"]', el => el.getAttribute('href'));
  console.log('Favicon href in index.html:', iconHref);

  // 2. Main menu screenshot (showing shop chest button icon)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_main_menu_chest_icon.png') });
  console.log('📸 Saved 01_main_menu_chest_icon.png');

  // 3. Set mystery chests to 2 and open chest modal
  await page.evaluate(() => {
    const raw = localStorage.getItem('moonfull_run_save_v1');
    const data = raw ? JSON.parse(raw) : {};
    data.mysteryChests = 2;
    data.shards = 1000;
    localStorage.setItem('moonfull_run_save_v1', JSON.stringify(data));
    if (window.gameEngine && window.gameEngine.uiManager) {
      window.gameEngine.uiManager.openChestModal();
    }
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_chest_modal_closed.png') });
  console.log('📸 Saved 02_chest_modal_closed.png');

  // 4. Click open chest button
  console.log('Clicking open chest...');
  await page.evaluate(() => {
    document.getElementById('btn-chest-open-next')?.click();
  });
  await new Promise(r => setTimeout(r, 700));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_chest_modal_opened.png') });
  console.log('📸 Saved 03_chest_modal_opened.png');

  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
