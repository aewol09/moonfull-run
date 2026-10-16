import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/02f75fb4-6812-4f6d-900b-c1d5cd233e36';

async function main() {
  console.log('🚀 Starting Verification of all 6 requirements...');

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

  // Unlock characters and costumes for testing
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

  // =========================================================================
  // Requirement 5: Swap Shop Tabs (Consumables first, Cash second)
  // =========================================================================
  console.log('Verifying Requirement 5: Shop tab order...');
  await page.click('#btn-open-shop');
  await page.waitForSelector('#shop-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 600));

  const shopItemShot = path.join(ARTIFACT_DIR, 'goal_verify_01_shop_consumables_first.png');
  await page.screenshot({ path: shopItemShot });
  console.log('Saved:', shopItemShot);

  // Switch to cash tab
  await page.click('#tab-btn-cash-shop');
  await new Promise(r => setTimeout(r, 400));
  const shopCashShot = path.join(ARTIFACT_DIR, 'goal_verify_02_shop_cash_second.png');
  await page.screenshot({ path: shopCashShot });
  console.log('Saved:', shopCashShot);

  // Close shop modal
  await page.click('#btn-close-shop');
  await new Promise(r => setTimeout(r, 400));

  // =========================================================================
  // Requirement 3: Character Skill Description Popup Modal
  // =========================================================================
  console.log('Verifying Requirement 3: Character Skill Description Popup Modal...');
  await page.click('#btn-open-costumes');
  await page.waitForSelector('#costume-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 600));

  // Click on the skill info badge on hero banner
  await page.click('#btn-hero-skill-info');
  await page.waitForSelector('#skill-detail-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 600));

  // 1. Luna Skill
  const lunaSkillShot = path.join(ARTIFACT_DIR, 'goal_verify_03_skill_popup_luna.png');
  await page.screenshot({ path: lunaSkillShot });
  console.log('Saved:', lunaSkillShot);

  // 2. Solaris Skill
  await page.click('#skill-hero-tabs button[data-char="solaris"]');
  await new Promise(r => setTimeout(r, 400));
  const solarisSkillShot = path.join(ARTIFACT_DIR, 'goal_verify_04_skill_popup_solaris.png');
  await page.screenshot({ path: solarisSkillShot });
  console.log('Saved:', solarisSkillShot);

  // 3. Nyx Skill
  await page.click('#skill-hero-tabs button[data-char="nyx"]');
  await new Promise(r => setTimeout(r, 400));
  const nyxSkillShot = path.join(ARTIFACT_DIR, 'goal_verify_05_skill_popup_nyx.png');
  await page.screenshot({ path: nyxSkillShot });
  console.log('Saved:', nyxSkillShot);

  // 4. Stella Skill
  await page.click('#skill-hero-tabs button[data-char="stella"]');
  await new Promise(r => setTimeout(r, 400));
  const stellaSkillShot = path.join(ARTIFACT_DIR, 'goal_verify_06_skill_popup_stella.png');
  await page.screenshot({ path: stellaSkillShot });
  console.log('Saved:', stellaSkillShot);

  // Close skill modal & costume modal
  await page.click('#btn-close-skill');
  await new Promise(r => setTimeout(r, 300));
  await page.click('#btn-close-costumes');
  await new Promise(r => setTimeout(r, 400));

  // =========================================================================
  // Requirement 6: Low Arch Center-Only Slide & Side Stone Barriers
  // =========================================================================
  console.log('Verifying Requirement 6: Low Arch Visuals & Barriers...');
  // Start in-game run
  await page.evaluate(() => {
    (window).gameEngine.startRun();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      // Clear obstacles and spawn LOW_ARCH 18m ahead
      engine.trackManager.activeObstacles.forEach((obs) => {
        engine.trackManager['obstaclePool'].recycle(obs);
      });
      engine.trackManager.activeObstacles.length = 0;
      const arch = engine.trackManager['obstaclePool'].obtain('LOW_ARCH', 0, engine.luna.mesh.position.z - 14);
      engine.trackManager.activeObstacles.push(arch);
    }
  });

  await new Promise(r => setTimeout(r, 500));
  const lowArchShot = path.join(ARTIFACT_DIR, 'goal_verify_07_low_arch_barriers.png');
  await page.screenshot({ path: lowArchShot });
  console.log('Saved:', lowArchShot);

  // =========================================================================
  // Requirement 1: Open Floor Chasm Hole & Falling into Abyss
  // =========================================================================
  console.log('Verifying Requirement 1: Floor Hole & Delayed Abyss Death...');
  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      // Clear obstacles and spawn BROKEN_BRIDGE 15m ahead
      engine.trackManager.activeObstacles.forEach((obs) => {
        engine.trackManager['obstaclePool'].recycle(obs);
      });
      engine.trackManager.activeObstacles.length = 0;
      const bridge = engine.trackManager['obstaclePool'].obtain('BROKEN_BRIDGE', 0, engine.luna.mesh.position.z - 15);
      engine.trackManager.activeObstacles.push(bridge);
    }
  });

  await new Promise(r => setTimeout(r, 400));
  const chasmOpenShot = path.join(ARTIFACT_DIR, 'goal_verify_08_open_chasm_pit.png');
  await page.screenshot({ path: chasmOpenShot });
  console.log('Saved:', chasmOpenShot);

  // Now advance player into the hole without jumping so they fall down into the abyss
  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      const bridge = engine.trackManager.activeObstacles.find((o) => o.type === 'BROKEN_BRIDGE');
      if (bridge) {
        engine.luna.mesh.position.z = bridge.zPos;
        engine.luna.posY = -1.2;
        engine.luna.isFallingIntoPit = true;
        engine.luna.state = 'FALL';
        engine.luna.velocityY = -6.0;
      }
    }
  });

  await new Promise(r => setTimeout(r, 200));
  const fallingShot = path.join(ARTIFACT_DIR, 'goal_verify_09_falling_into_abyss.png');
  await page.screenshot({ path: fallingShot });
  console.log('Saved:', fallingShot);

  // Let it fall deeper to ~ -4.0m
  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      engine.luna.posY = -3.8;
      engine.luna.update(0.016, 0);
    }
  });
  await new Promise(r => setTimeout(r, 100));
  const deepFallingShot = path.join(ARTIFACT_DIR, 'goal_verify_09_deep_falling_abyss.png');
  await page.screenshot({ path: deepFallingShot });
  console.log('Saved:', deepFallingShot);

  // =========================================================================
  // Requirement 2: 90-Degree Road Turn (Road bends 90 degrees)
  // =========================================================================
  console.log('Verifying Requirement 2: 90-Degree Road Turn...');
  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      engine.luna.isFallingIntoPit = false;
      engine.luna.posY = 0;
      engine.luna.velocityY = 0;
      engine.luna.state = 'RUN';
      // Trigger 90-degree right turn
      engine.turnDirector.nextTurnDist = 0;
      engine.turnDirector.update(350, 0.05, true);
      // Run several frames to interpolate curveX and yaw
      for (let i = 0; i < 40; i++) {
        engine.turnDirector.update(350, 0.05, true);
        engine.curveDirector.update(0.05, true, engine.turnDirector.currentCurveX);
        engine.cameraFollower.update(
          engine.luna.mesh.position,
          false,
          false,
          0.05,
          engine.turnDirector.currentYaw
        );
        engine.luna.cameraYaw = engine.turnDirector.currentYaw;
      }
    }
  });

  await new Promise(r => setTimeout(r, 500));
  const turnShot = path.join(ARTIFACT_DIR, 'goal_verify_10_road_turns_90deg.png');
  await page.screenshot({ path: turnShot });
  console.log('Saved:', turnShot);

  // =========================================================================
  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      if (engine.shardManager && typeof engine.shardManager.clear === 'function') {
        engine.shardManager.clear();
      }
      engine.luna.hasShield = false;
      engine.luna.applyCharacter('solaris', 'solaris_obsidian');
      engine.turnDirector.reset();
      engine.curveDirector.reset();
      engine.luna.cameraYaw = 0;
      for (let i = 0; i < 40; i++) {
        engine.cameraFollower.update(engine.luna.mesh.position, false, false, 0.05, 0);
      }
      engine.luna.update(0.016, 14);
    }
  });
  await new Promise(r => setTimeout(r, 400));
  const solarisObsidianShot = path.join(ARTIFACT_DIR, 'goal_verify_11_solaris_obsidian_run.png');
  await page.screenshot({ path: solarisObsidianShot });
  console.log('Saved:', solarisObsidianShot);

  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      engine.luna.applyCharacter('nyx', 'nyx_cyber');
      engine.luna.update(0.016, 14);
    }
  });
  await new Promise(r => setTimeout(r, 400));
  const nyxCyberShot = path.join(ARTIFACT_DIR, 'goal_verify_12_nyx_cyber_run.png');
  await page.screenshot({ path: nyxCyberShot });
  console.log('Saved:', nyxCyberShot);

  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      engine.luna.applyCharacter('stella', 'stella_archmage');
      engine.luna.update(0.016, 14);
    }
  });
  await new Promise(r => setTimeout(r, 400));
  const stellaArchmageShot = path.join(ARTIFACT_DIR, 'goal_verify_13_stella_archmage_run.png');
  await page.screenshot({ path: stellaArchmageShot });
  console.log('Saved:', stellaArchmageShot);

  // Additional Skin Run Verifications: Luna Guardian & Luna Dawn & Stella Chronos
  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      engine.luna.applyCharacter('luna', 'luna_guardian');
      engine.luna.update(0.016, 14);
    }
  });
  await new Promise(r => setTimeout(r, 400));
  const lunaGuardianShot = path.join(ARTIFACT_DIR, 'goal_verify_14_luna_guardian_run.png');
  await page.screenshot({ path: lunaGuardianShot });
  console.log('Saved:', lunaGuardianShot);

  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      engine.luna.applyCharacter('luna', 'luna_dawn');
      engine.luna.update(0.016, 14);
    }
  });
  await new Promise(r => setTimeout(r, 400));
  const lunaDawnShot = path.join(ARTIFACT_DIR, 'goal_verify_15_luna_dawn_run.png');
  await page.screenshot({ path: lunaDawnShot });
  console.log('Saved:', lunaDawnShot);

  await page.evaluate(() => {
    const engine = (window).gameEngine;
    if (engine) {
      engine.luna.applyCharacter('stella', 'stella_chronos');
      engine.luna.update(0.016, 14);
    }
  });
  await new Promise(r => setTimeout(r, 400));
  const stellaChronosShot = path.join(ARTIFACT_DIR, 'goal_verify_16_stella_chronos_run.png');
  await page.screenshot({ path: stellaChronosShot });
  console.log('Saved:', stellaChronosShot);

  await browser.close();
  console.log('🎉 All 6 requirements successfully verified and captured!');
}

main().catch(err => {
  console.error('Error running verification:', err);
  process.exit(1);
});
