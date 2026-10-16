import puppeteer from 'puppeteer-core';
import path from 'path';
import { spawn } from 'child_process';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a';

async function main() {
  console.log('Starting Vite server on 5202...');
  const server = spawn('npx', ['vite', '--port', '5202'], { cwd: process.cwd() });

  await new Promise(r => setTimeout(r, 2500));

  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  try {
    await page.goto('http://localhost:5202/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('#main-menu');
    console.log('Page loaded.');

    // Click Game Start button
    console.log('Clicking Game Start...');
    await page.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 1000));

    // Capture Stage 1 (달빛 유적지)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage1_moonlit_ruins.png') });
    console.log('Captured ingame_stage1_moonlit_ruins.png');

    // Switch to Stage 2 (별빛 안개 숲)
    await page.evaluate(() => { window.__MOONFALL_ENGINE__.environment.setBiome(2); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage2_starlight_forest.png') });
    console.log('Captured ingame_stage2_starlight_forest.png');

    // Switch to Stage 3 (보랏빛 성역)
    await page.evaluate(() => { window.__MOONFALL_ENGINE__.environment.setBiome(3); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage3_amethyst_sanctuary.png') });
    console.log('Captured ingame_stage3_amethyst_sanctuary.png');

    // Switch to Stage 4 (비취석 협곡)
    await page.evaluate(() => { window.__MOONFALL_ENGINE__.environment.setBiome(4); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage4_jade_canyon.png') });
    console.log('Captured ingame_stage4_jade_canyon.png');

    // Switch to Stage 5 (황혼의 고대 신전)
    await page.evaluate(() => { window.__MOONFALL_ENGINE__.environment.setBiome(5); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage5_twilight_temple.png') });
    console.log('Captured ingame_stage5_twilight_temple.png');

    // Switch to Stage 6 (붉은 달의 회랑)
    await page.evaluate(() => { window.__MOONFALL_ENGINE__.environment.setBiome(6); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage6_crimson_moon.png') });
    console.log('Captured ingame_stage6_crimson_moon.png');

    // Switch to Stage 7 (얼어붙은 별의 빙하)
    await page.evaluate(() => { window.__MOONFALL_ENGINE__.environment.setBiome(7); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage7_glacial_frost.png') });
    console.log('Captured ingame_stage7_glacial_frost.png');

    // Switch to Stage 8 (태양의 일식 신전)
    await page.evaluate(() => { window.__MOONFALL_ENGINE__.environment.setBiome(8); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage8_solar_eclipse.png') });
    console.log('Captured ingame_stage8_solar_eclipse.png');

    // Switch to Stage 9 (공허의 심연 제단)
    await page.evaluate(() => { window.__MOONFALL_ENGINE__.environment.setBiome(9); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage9_void_abyss.png') });
    console.log('Captured ingame_stage9_void_abyss.png');

    // Switch to Stage 10 (끝없는 별빛의 시련)
    await page.evaluate(() => { window.__MOONFALL_ENGINE__.environment.setBiome(10); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ingame_stage10_celestial_chaos.png') });
    console.log('Captured ingame_stage10_celestial_chaos.png');

    console.log('All stage screenshots captured successfully!');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    try {
      await browser.close();
    } catch {}
    try {
      server.kill('SIGTERM');
    } catch {}
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
