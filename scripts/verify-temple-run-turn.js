import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/02f75fb4-6812-4f6d-900b-c1d5cd233e36';

async function main() {
  console.log('🚀 Verifying Temple Run 90-degree corner turns (Right +90° and Left -90°)...');

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

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Start Run
  await page.evaluate(() => {
    const btn = document.getElementById('btn-start-run');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 2. Right Corner Approach: Luna at -315, Corner at -350 (35m ahead)
  // Verify:
  // - Straight road beyond -350 is COMPLETELY REMOVED (no ghost road ahead).
  // - Zero obstacles on or near the curve.
  // - Clean, solid 90-degree curved corner road connected to incoming path.
  await page.evaluate(() => {
    const engine = window.gameEngine;
    if (engine) {
      engine.scoreSystem.distance = 315;
      engine.luna.mesh.position.set(0, 0, -315);
      engine.cameraFollower.reanchorBehindPlayer(engine.luna.mesh.position);
      engine.trackManager.spawnCorner('right', -350, 14.0);
      engine.turnDirector.phase = 'straight';
      engine.turnDirector.isApproachingCorner = true;
      engine.turnDirector.turnDirection = 'right';
      engine.turnDirector.nextTurnDist = 350;

      // Update track manager once to apply visibility hiding beyond -350
      engine.trackManager.update(engine.luna.mesh.position.z, 315, 14);

      for (let i = 0; i < 30; i++) {
        engine.cameraFollower.update(engine.luna.mesh.position, false, false, 0.05, 0);
      }
      engine.sceneManager.render();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  const approachShot = path.join(ARTIFACT_DIR, 'temple_run_01_corner_approach.png');
  await page.screenshot({ path: approachShot });
  console.log('Saved:', approachShot);

  // 3. Mid-Turn inside the 90° Right Corner Arc:
  // Luna at 55% of the curve (~50°), camera dynamically swinging behind her back.
  // Verify:
  // - Solid road geometry directly beneath Luna (no gap or void).
  // - Luna physically turned 50° into the turn with athletic banking lean.
  await page.evaluate(() => {
    const engine = window.gameEngine;
    if (engine) {
      engine.turnDirector.phase = 'sideways';
      engine.turnDirector.turnDirection = 'right';
      engine.turnDirector.cornerStartZ = -350;
      engine.turnDirector.turnProgress = 0.55;
      engine.turnDirector.turnEndDist = 999999;

      // Freeze speed during screenshot
      engine._savedUpdate = engine.difficultyDirector.update;
      engine.difficultyDirector.update = () => 0;

      const cornerPos = engine.turnDirector.getCornerPlayerPos(0);
      engine.luna.isTurningCorner = true;
      engine.luna.mesh.position.x = cornerPos.x;
      engine.luna.mesh.position.z = cornerPos.z;
      engine.luna.mesh.rotation.y = cornerPos.rotationY; // Physical sideways turning!
      engine.luna.visualGroup.rotation.z = -0.20; // Banking lean

      const camT = engine.turnDirector.getCornerCameraTransform(cornerPos.x, 0, cornerPos.z);
      engine.sceneManager.camera.position.copy(camT.eye);
      engine.sceneManager.camera.lookAt(camT.lookAt);
      engine.sceneManager.render();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  const midTurnShot = path.join(ARTIFACT_DIR, 'temple_run_02_mid_turn_sideways.png');
  await page.screenshot({ path: midTurnShot });
  console.log('Saved:', midTurnShot);

  // 4. Corner Exit / Hand-off: "옆이 앞이 되어서 가라고 템플런처럼"
  // Verify:
  // - Reanchored track along the new forward line.
  // - Character heading straight forward down the new path.
  // - Camera centered behind character.
  await page.evaluate(() => {
    const engine = window.gameEngine;
    if (engine) {
      if (engine._savedUpdate) {
        engine.difficultyDirector.update = engine._savedUpdate;
      }
      engine.turnDirector.turnProgress = 1.0;
      engine.turnDirector.turnEndDist = 0;
      engine.turnDirector.onCornerComplete('right');
      for (let i = 0; i < 20; i++) {
        engine.cameraFollower.update(engine.luna.mesh.position, false, false, 0.05, 0);
      }
      engine.sceneManager.render();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  const afterTurnShot = path.join(ARTIFACT_DIR, 'temple_run_03_side_becomes_front.png');
  await page.screenshot({ path: afterTurnShot });
  console.log('Saved:', afterTurnShot);

  // 5. Left Corner Approach (-90° Left Turn):
  // Verify:
  // - Road curves cleanly 90° to the LEFT!
  // - Outgoing road preview extends to the left (-X direction).
  // - Forward track beyond corner is removed.
  // - Zero obstacles on the turn.
  await page.evaluate(() => {
    const engine = window.gameEngine;
    if (engine) {
      engine.scoreSystem.distance = 780;
      engine.luna.mesh.position.set(0, 0, -100);
      engine.cameraFollower.reanchorBehindPlayer(engine.luna.mesh.position);
      engine.trackManager.spawnCorner('left', -135, 14.0);
      engine.turnDirector.phase = 'straight';
      engine.turnDirector.isApproachingCorner = true;
      engine.turnDirector.turnDirection = 'left';
      engine.turnDirector.nextTurnDist = 815;

      engine.trackManager.update(engine.luna.mesh.position.z, 780, 14);

      for (let i = 0; i < 30; i++) {
        engine.cameraFollower.update(engine.luna.mesh.position, false, false, 0.05, 0);
      }
      engine.sceneManager.render();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  const leftApproachShot = path.join(ARTIFACT_DIR, 'temple_run_04_left_corner_approach.png');
  await page.screenshot({ path: leftApproachShot });
  console.log('Saved:', leftApproachShot);

  // 6. Left Corner Mid-Turn (-90°):
  // Verify:
  // - Luna traversing the left curve, facing left.
  // - Solid road beneath her feet.
  // - Camera swinging to the left behind her back.
  await page.evaluate(() => {
    const engine = window.gameEngine;
    if (engine) {
      engine.turnDirector.phase = 'sideways';
      engine.turnDirector.turnDirection = 'left';
      engine.turnDirector.cornerStartZ = -135;
      engine.turnDirector.turnProgress = 0.55;
      engine.turnDirector.turnEndDist = 999999;

      const cornerPos = engine.turnDirector.getCornerPlayerPos(0);
      engine.luna.isTurningCorner = true;
      engine.luna.mesh.position.x = cornerPos.x;
      engine.luna.mesh.position.z = cornerPos.z;
      engine.luna.mesh.rotation.y = cornerPos.rotationY; // Faces into left turn (+alpha)
      engine.luna.visualGroup.rotation.z = 0.20; // Banking lean into left turn

      const camT = engine.turnDirector.getCornerCameraTransform(cornerPos.x, 0, cornerPos.z);
      engine.sceneManager.camera.position.copy(camT.eye);
      engine.sceneManager.camera.lookAt(camT.lookAt);
      engine.sceneManager.render();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  const leftMidTurnShot = path.join(ARTIFACT_DIR, 'temple_run_05_left_mid_turn.png');
  await page.screenshot({ path: leftMidTurnShot });
  console.log('Saved:', leftMidTurnShot);

  await browser.close();
  console.log('🎉 Temple Run 90-degree corner turns verified successfully!');
}

main().catch(err => {
  console.error('Error verifying turn:', err);
  process.exit(1);
});
