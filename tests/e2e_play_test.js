import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- Starting Moonfall Run E2E Smoke Test ---');

  // Ensure screenshot dir exists
  const screenshotDir = path.resolve(process.cwd(), 'tests/screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Launch Vite preview server
  console.log('Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    stdio: 'pipe'
  });

  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('http://localhost:4173')) {
        console.log('Preview server ready at port 4173');
        resolve();
      }
    });
    server.stderr.on('data', (d) => console.error('Server err:', d.toString()));
    server.on('error', reject);
    setTimeout(() => resolve(), 3000); // fallback timeout
  });

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 840, isMobile: true, hasTouch: true });

  const errors = [];
  page.on('pageerror', (err) => {
    console.error('Page error:', err.message);
    errors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text());
      errors.push(msg.text());
    }
  });

  console.log('Navigating to http://localhost:4173...');
  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // 2. Test Main Menu & Costume Modal
  console.log('Checking Main Menu...');
  await page.waitForSelector('#btn-start-run', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 600)); // Allow 3D scene to render
  await page.screenshot({ path: path.join(screenshotDir, '00_main_menu.png') });
  const startBtn = await page.$('#btn-start-run');
  if (!startBtn) throw new Error('Start button not found!');

  console.log('Opening Costumes modal...');
  const costumeBtn = await page.$('#btn-open-costumes');
  if (costumeBtn) {
    await costumeBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(screenshotDir, '01_costume_modal.png') });

    // Close modal
    const closeBtn = await page.$('#btn-close-costumes');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 3. Start Run
  console.log('Clicking Start Run...');
  await startBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  // 4. In-game actions: lane switch, jump, slide
  console.log('Simulating gameplay: jump, slide, move...');
  await page.keyboard.press('KeyA');
  await new Promise(r => setTimeout(r, 400));
  await page.keyboard.press('KeyW'); // Jump
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('KeyS'); // Slide / fast fall
  await new Promise(r => setTimeout(r, 400));
  await page.keyboard.press('KeyD');
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: path.join(screenshotDir, '02_gameplay.png') });
  console.log('Gameplay screenshot saved!');

  await browser.close();
  server.kill('SIGTERM');

  if (errors.length > 0) {
    console.error('E2E test failed with errors:', errors);
    process.exit(1);
  } else {
    console.log('--- E2E Smoke Test Passed Cleanly! 0 Console/Page Errors ---');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
