import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';

async function run() {
  console.log('Testing live costume switching in preview...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { stdio: 'pipe' });
  await new Promise(r => setTimeout(r, 2000));

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 840, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:4174', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#btn-open-costumes');

  // Open costumes modal
  await page.click('#btn-open-costumes');
  await new Promise(r => setTimeout(r, 500));

  // Click second costume (guardian)
  const items = await page.$$('.costume-item');
  if (items[1]) {
    await items[1].click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'tests/screenshots/03_preview_guardian.png' });
    console.log('Guardian preview captured!');
  }

  // Click third costume (dawn)
  if (items[2]) {
    await items[2].click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'tests/screenshots/04_preview_dawn.png' });
    console.log('Dawn preview captured!');
  }

  await browser.close();
  server.kill('SIGTERM');
  console.log('Costume preview test finished!');
}

run().catch(e => { console.error(e); process.exit(1); });
