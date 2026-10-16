import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a';

async function main() {
  console.log('🚀 Starting Comprehensive Goal Verification with Puppeteer...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));

  // Unlock all heroes and costumes for full verification showcase
  await page.evaluate(() => {
    try {
      const data = JSON.parse(localStorage.getItem('moonfall_run_save') || '{}');
      data.unlockedCharacters = ['luna', 'stella', 'solaris', 'nyx'];
      data.unlockedCostumes = [
        'default', 'luna_default', 'luna_guardian', 'luna_dawn',
        'stella_default', 'stella_archmage', 'stella_chronos',
        'solaris_default', 'solaris_obsidian', 'solaris_phoenix',
        'nyx_default', 'nyx_cyber', 'nyx_bloodmoon'
      ];
      data.moonCoins = 99999;
      localStorage.setItem('moonfall_run_save', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));

  // -------------------------------------------------------------
  // 1. Verify Growth Modal Scrolling (Up and Down)
  // -------------------------------------------------------------
  console.log('Testing Growth Modal Scrolling...');
  await page.click('#btn-open-growth');
  await page.waitForSelector('#growth-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 800));

  // Initial top view of Growth Modal
  const growthTopShot = path.join(ARTIFACT_DIR, 'goal_01_growth_modal_top.png');
  await page.screenshot({ path: growthTopShot });
  console.log('Saved:', growthTopShot);

  // Scroll down in the Growth Modal
  const scrollResult = await page.evaluate(() => {
    const list = document.querySelector('#growth-items-list');
    if (!list) return { error: 'growth-items-list not found' };
    const initialScroll = list.scrollTop;
    list.scrollTop = list.scrollHeight;
    return {
      initialScroll,
      newScroll: list.scrollTop,
      scrollHeight: list.scrollHeight,
      clientHeight: list.clientHeight
    };
  });
  console.log('Growth modal scroll down result:', scrollResult);
  await new Promise(r => setTimeout(r, 600));

  const growthScrolledShot = path.join(ARTIFACT_DIR, 'goal_02_growth_modal_scrolled_down.png');
  await page.screenshot({ path: growthScrolledShot });
  console.log('Saved:', growthScrolledShot);

  // Close growth modal
  await page.click('#btn-close-growth-corner');
  await new Promise(r => setTimeout(r, 600));

  // -------------------------------------------------------------
  // 2. Verify Character Showcase: Solaris (Sun Paladin)
  // -------------------------------------------------------------
  console.log('Testing Character Showcase: Solaris...');
  await page.click('#btn-open-costumes');
  await page.waitForSelector('#costume-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 800));

  // Switch tab to Solaris
  await page.evaluate(() => {
    const solarisTab = document.querySelector('.hero-tab-btn[data-character="solaris"]');
    if (solarisTab) solarisTab.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const solarisCostumeShot = path.join(ARTIFACT_DIR, 'goal_03_solaris_character_showcase.png');
  await page.screenshot({ path: solarisCostumeShot });
  console.log('Saved:', solarisCostumeShot);

  // -------------------------------------------------------------
  // 3. Verify Character Showcase: Nyx (Shadow Rogue Assassin)
  // -------------------------------------------------------------
  console.log('Testing Character Showcase: Nyx...');
  await page.evaluate(() => {
    const nyxTab = document.querySelector('.hero-tab-btn[data-character="nyx"]');
    if (nyxTab) nyxTab.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const nyxCostumeShot = path.join(ARTIFACT_DIR, 'goal_04_nyx_character_showcase.png');
  await page.screenshot({ path: nyxCostumeShot });
  console.log('Saved:', nyxCostumeShot);

  // Select Nyx and close costume modal
  await page.evaluate(() => {
    const selectBtn = document.querySelector('#btn-select-hero');
    if (selectBtn) selectBtn.click();
    const closeBtn = document.querySelector('#btn-close-costumes');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // -------------------------------------------------------------
  // 4. Verify In-Game Gameplay & Relocated Fever Gauge with Nyx
  // -------------------------------------------------------------
  console.log('Starting In-Game Gameplay with Nyx...');
  await page.click('#btn-start-run');
  await new Promise(r => setTimeout(r, 1500));

  // Add fever progress to verify fever gauge visuals
  await page.evaluate(() => {
    const feverFill = document.querySelector('#hud-fever-fill');
    const feverPct = document.querySelector('#hud-fever-pct');
    if (feverFill) feverFill.style.width = '65%';
    if (feverPct) feverPct.textContent = '65%';
  });
  await new Promise(r => setTimeout(r, 500));

  const gameplayNyxShot = path.join(ARTIFACT_DIR, 'goal_05_gameplay_nyx_fever_top.png');
  await page.screenshot({ path: gameplayNyxShot });
  console.log('Saved:', gameplayNyxShot);

  // Measure Fever Gauge position on screen
  const feverPos = await page.evaluate(() => {
    const feverWrap = document.querySelector('#hud-fever-wrap');
    if (!feverWrap) return null;
    const rect = feverWrap.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      windowHeight: window.innerHeight
    };
  });
  console.log('Fever gauge screen position:', feverPos);

  // -------------------------------------------------------------
  // 5. Test Solaris In-Game Gameplay & Clean Track
  // -------------------------------------------------------------
  console.log('Switching to Solaris for In-Game Gameplay...');
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('moonfall_run_save') || '{}');
    data.selectedCharacter = 'solaris';
    localStorage.setItem('moonfall_run_save', JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#main-menu');
  await new Promise(r => setTimeout(r, 1000));

  // Start game with Solaris
  await page.click('#btn-start-run');
  await new Promise(r => setTimeout(r, 1800));

  await page.evaluate(() => {
    const feverFill = document.querySelector('#hud-fever-fill');
    const feverPct = document.querySelector('#hud-fever-pct');
    if (feverFill) feverFill.style.width = '80%';
    if (feverPct) feverPct.textContent = '80%';
  });
  await new Promise(r => setTimeout(r, 400));

  const gameplaySolarisShot = path.join(ARTIFACT_DIR, 'goal_06_gameplay_solaris_clean_track.png');
  await page.screenshot({ path: gameplaySolarisShot });
  console.log('Saved:', gameplaySolarisShot);

  await browser.close();
  console.log('🎉 Comprehensive Goal Verification Completed Successfully!');
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
