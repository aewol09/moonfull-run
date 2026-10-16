import puppeteer from 'puppeteer-core';
import path from 'path';
import { spawn } from 'child_process';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a';

async function main() {
  console.log('Starting Vite server...');
  const server = spawn('npx', ['vite', '--port', '5199'], { cwd: process.cwd() });

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
    await page.goto('http://localhost:5199/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('#main-menu');
    console.log('Page loaded.');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_menu_screenshot.png') });
    console.log('Saved 01_menu_screenshot.png');

    // Click Game Start button
    console.log('Clicking Game Start...');
    await page.click('#btn-start-run');
    await new Promise(r => setTimeout(r, 800));

    // Capture gameplay running frame A
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_gameplay_running_frameA.png') });
    console.log('Saved 02_gameplay_running_frameA.png');

    // Wait 250ms and capture gameplay running frame B (different leg stride)
    await new Promise(r => setTimeout(r, 250));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_gameplay_running_frameB.png') });
    console.log('Saved 03_gameplay_running_frameB.png');

    // Wait another 250ms and capture gameplay running frame C
    await new Promise(r => setTimeout(r, 250));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_gameplay_running_frameC.png') });
    console.log('Saved 04_gameplay_running_frameC.png');

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch(console.error);
