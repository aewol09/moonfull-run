import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a';

async function main() {
  console.log('Starting verification of shields and sideways turning...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  // Open the dev server (port 3001)
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));

  // Unlock all characters & costumes in localStorage
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

  // Reload so storage picks up unlocked state
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));

  // --- Helper function to start game with hero and shield ---
  async function setupRun(charId, costumeId, withShield = true) {
    await page.evaluate(({ charId, costumeId }) => {
      const engine = window.__MOONFALL_ENGINE__;
      if (engine) {
        engine.storage.selectCharacter(charId);
        engine.storage.equipCostume(costumeId, charId);
        engine.luna.applyCharacter(charId, costumeId);
        engine.luna.applyCostume(costumeId, charId);
      }
    }, { charId, costumeId });

    console.log(`Clicking start run for ${charId}...`);
    await page.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 1200));

    if (withShield) {
      await page.evaluate(() => {
        const engine = window.__MOONFALL_ENGINE__;
        if (engine) {
          engine.luna.setShieldActive(true);
        }
      });
    }
    await new Promise(r => setTimeout(r, 800));
  }

  // --- Test 1: Solaris running with Golden Shield ---
  console.log('1. Testing Solaris running with Golden Shield...');
  await setupRun('solaris', 'solaris_default', true);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_shield_solaris_gold.png') });
  console.log('-> Saved verify_shield_solaris_gold.png');

  // --- Test 2: Dynamic Sideways Running Phase (At 150m, in the middle of a 75-degree turn) ---
  console.log('2. Testing Dynamic Sideways Running (Screen turns sideways)...');
  await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__;
    if (engine) {
      engine.scoreSystem.advanceDistance(150); // In sideways turn zone (120m-230m)
    }
  });
  // Wait 1.8 seconds for gameplay loop to advance and camera to smoothly rotate
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_turn_sideways_phase.png') });
  console.log('-> Saved verify_turn_sideways_phase.png');

  // --- Test 3: Return to Straight Phase (At 280m) ---
  console.log('3. Testing Return to Straight Phase...');
  await page.evaluate(() => {
    const engine = window.__MOONFALL_ENGINE__;
    if (engine) {
      engine.scoreSystem.advanceDistance(130); // Advance past turn end to 280m
    }
  });
  // Wait 1.8 seconds for camera to smoothly swing back to straight
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_turn_straight_phase.png') });
  console.log('-> Saved verify_turn_straight_phase.png');

  // --- Test 4: Stella running with Amethyst Shield ---
  console.log('4. Testing Stella running with Amethyst Shield...');
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));
  await setupRun('stella', 'stella_default', true);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_shield_stella_amethyst.png') });
  console.log('-> Saved verify_shield_stella_amethyst.png');

  // --- Test 5: Nyx running with Cyan Shield ---
  console.log('5. Testing Nyx running with Cyan Shield...');
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));
  await setupRun('nyx', 'nyx_default', true);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_shield_nyx_cyan.png') });
  console.log('-> Saved verify_shield_nyx_cyan.png');

  await browser.close();
  console.log('All visual verification screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
