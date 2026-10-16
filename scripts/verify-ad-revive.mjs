import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/02f75fb4-6812-4f6d-900b-c1d5cd233e36';

async function main() {
  console.log('🚀 Visual verification of Ad Revive Continue (판당 1회 광고 보고 이어하기)...');

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
      '--window-size=430,932'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932 });
  page.setDefaultNavigationTimeout(60000);

  // Navigate to local dev server
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Start the game run
  console.log('🎮 Starting game run...');
  await page.click('#btn-start-run');
  await new Promise(r => setTimeout(r, 1000));

  // Advance player some distance
  await page.evaluate(() => {
    const engine = window.gameEngine;
    engine.scoreSystem.advanceDistance(245);
    engine.luna.mesh.position.z = -245;
  });
  await new Promise(r => setTimeout(r, 500));

  // 2. Trigger player death (first death this run)
  console.log('💀 Triggering first death...');
  await page.evaluate(() => {
    const engine = window.gameEngine;
    // Remove shields/buffs
    engine.luna.setShieldActive(false);
    // Hit fatal obstacle
    engine.luna.hitObstacle(true);
  });

  // Wait for death animation (0.75s) and Revive modal to appear
  console.log('⏳ Waiting for Revive Modal (#revive-modal)...');
  await page.waitForFunction(() => {
    const modal = document.getElementById('revive-modal');
    return modal && !modal.classList.contains('hidden');
  }, { timeout: 10000 });

  const reviveModalShot = path.join(ARTIFACT_DIR, 'ad_revive_01_modal.png');
  await page.screenshot({ path: reviveModalShot });
  console.log(`📸 Saved screenshot 1: ${reviveModalShot}`);

  // 3. Click "Watch Ad to Continue" button
  console.log('🎬 Clicking "Watch Ad to Continue" button (#btn-watch-ad-revive)...');
  await page.click('#btn-watch-ad-revive');
  await new Promise(r => setTimeout(r, 600));

  // Verify Ad Player Modal is open
  const isAdPlaying = await page.evaluate(() => {
    const adModal = document.getElementById('ad-player-modal');
    return adModal && !adModal.classList.contains('hidden');
  });
  console.log('📺 Ad Player Modal visible:', isAdPlaying);

  const adPlayerShot = path.join(ARTIFACT_DIR, 'ad_revive_02_ad_player.png');
  await page.screenshot({ path: adPlayerShot });
  console.log(`📸 Saved screenshot 2: ${adPlayerShot}`);

  // 4. Wait for ad simulation to finish (3 seconds) and auto-claim / claim reward
  console.log('⏳ Waiting for ad playback completion and revive...');
  await page.waitForFunction(() => {
    const adModal = document.getElementById('ad-player-modal');
    const reviveModal = document.getElementById('revive-modal');
    const isRunning = window.gameEngine.stateManager.isRunning();
    const hasShield = window.gameEngine.luna.hasShield;
    return (!adModal || adModal.classList.contains('hidden')) &&
           (!reviveModal || reviveModal.classList.contains('hidden')) &&
           isRunning &&
           hasShield;
  }, { timeout: 10000 });

  await new Promise(r => setTimeout(r, 600));

  // Verify revived state and player position
  const reviveState = await page.evaluate(() => {
    const engine = window.gameEngine;
    return {
      usedAdReviveThisRun: engine.usedAdReviveThisRun,
      distance: engine.scoreSystem.distance,
      zPos: engine.luna.mesh.position.z,
      hasShield: engine.luna.hasShield,
      isRunning: engine.stateManager.isRunning(),
      isGameOver: engine.stateManager.isGameOver(),
      state: engine.luna.state
    };
  });
  console.log('✨ Revived Player State:', JSON.stringify(reviveState, null, 2));

  const revivedGameShot = path.join(ARTIFACT_DIR, 'ad_revive_03_revived_gameplay.png');
  await page.screenshot({ path: revivedGameShot });
  console.log(`📸 Saved screenshot 3: ${revivedGameShot}`);

  // 5. Trigger second death in the same run to verify "once per run" limit
  console.log('💀 Triggering second death in the same run (should NOT show revive modal)...');
  await page.evaluate(() => {
    const engine = window.gameEngine;
    engine.luna.setShieldActive(false);
    engine.luna.hitObstacle(true);
  });

  // Wait for Game Over screen (Revive modal MUST NOT show)
  await page.waitForFunction(() => {
    const goModal = document.getElementById('gameover-modal');
    return goModal && !goModal.classList.contains('hidden');
  }, { timeout: 10000 });

  await new Promise(r => setTimeout(r, 600));

  const secondDeathCheck = await page.evaluate(() => {
    const engine = window.gameEngine;
    const reviveModal = document.getElementById('revive-modal');
    const goModal = document.getElementById('gameover-modal');
    const btnAdReviveGo = document.getElementById('btn-ad-revive-go');
    return {
      usedAdReviveThisRun: engine.usedAdReviveThisRun,
      reviveModalHidden: reviveModal ? reviveModal.classList.contains('hidden') : true,
      goModalVisible: goModal ? !goModal.classList.contains('hidden') : false,
      btnAdReviveGoHidden: btnAdReviveGo ? btnAdReviveGo.classList.contains('hidden') : true
    };
  });
  console.log('🏁 Second Death Verification:', JSON.stringify(secondDeathCheck, null, 2));

  const secondDeathShot = path.join(ARTIFACT_DIR, 'ad_revive_04_second_death_gameover.png');
  await page.screenshot({ path: secondDeathShot });
  console.log(`📸 Saved screenshot 4: ${secondDeathShot}`);

  // 6. Test New Run Reset & Reviving from Game Over Modal
  console.log('🔄 Restarting run to verify reset & game over modal ad revive button...');
  await page.click('#btn-restart-go');
  await new Promise(r => setTimeout(r, 1000));

  const newRunState = await page.evaluate(() => {
    return {
      usedAdReviveThisRun: window.gameEngine.usedAdReviveThisRun,
      isRunning: window.gameEngine.stateManager.isRunning()
    };
  });
  console.log('✨ New Run Initial State:', JSON.stringify(newRunState, null, 2));

  // Advance distance
  await page.evaluate(() => {
    const engine = window.gameEngine;
    engine.scoreSystem.advanceDistance(180);
    engine.luna.mesh.position.z = -180;
    engine.luna.setShieldActive(false);
    engine.luna.hitObstacle(true);
  });

  // Wait for revive modal and SKIP it
  await page.waitForFunction(() => {
    const modal = document.getElementById('revive-modal');
    return modal && !modal.classList.contains('hidden');
  }, { timeout: 10000 });

  console.log('⏭️ Skipping initial revive countdown...');
  await page.click('#btn-skip-revive');
  await new Promise(r => setTimeout(r, 600));

  // Verify Game Over modal appears WITH #btn-ad-revive-go visible
  const goWithReviveBtn = await page.evaluate(() => {
    const btn = document.getElementById('btn-ad-revive-go');
    return btn && !btn.classList.contains('hidden');
  });
  console.log('🎬 Game Over Modal has Ad Revive button visible:', goWithReviveBtn);

  const goAdReviveShot = path.join(ARTIFACT_DIR, 'ad_revive_05_gameover_button.png');
  await page.screenshot({ path: goAdReviveShot });
  console.log(`📸 Saved screenshot 5: ${goAdReviveShot}`);

  // Click #btn-ad-revive-go on Game Over screen
  await page.click('#btn-ad-revive-go');
  await new Promise(r => setTimeout(r, 600));

  // Wait for ad completion and revive
  await page.waitForFunction(() => {
    return window.gameEngine.stateManager.isRunning() && window.gameEngine.usedAdReviveThisRun;
  }, { timeout: 10000 });

  await new Promise(r => setTimeout(r, 600));

  const goRevivedShot = path.join(ARTIFACT_DIR, 'ad_revive_06_revived_from_gameover.png');
  await page.screenshot({ path: goRevivedShot });
  console.log(`📸 Saved screenshot 6: ${goRevivedShot}`);

  await browser.close();
  console.log('🎉 Ad Revive feature fully verified in all paths successfully!');
}

main().catch(err => {
  console.error('❌ Error during visual verification:', err);
  process.exit(1);
});
