import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/02f75fb4-6812-4f6d-900b-c1d5cd233e36';

async function main() {
  console.log('🚀 Visual verification of Stage Obstacles, Patterns, and Skill Barrier...');

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

  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    window.cleanState = (stage) => {
      const engine = window.gameEngine;
      const oldToasts = document.querySelectorAll('.toast, .game-toast, #toast-container > div');
      oldToasts.forEach(t => t.remove());

      // Freeze turns so straight track is crystal clear
      engine.turnDirector.reset();
      engine.turnDirector.nextTurnDist = 99999999;
      engine.turnDirector.phase = 'straight';
      engine.turnDirector.isApproachingCorner = false;
      engine.turnDirector.turnProgress = 0;

      engine.trackManager.activeCornerZ = null;
      if (engine.trackManager.activeCornerGroup) {
        engine.trackManager.activeCornerGroup.visible = false;
      }
      if (engine.trackManager.activePreviewGroup) {
        engine.trackManager.activePreviewGroup.visible = false;
      }

      // Ensure all road chunks and segments are visible
      for (const chunk of engine.trackManager.chunks) {
        chunk.mesh.visible = true;
        for (const seg of chunk.roadSegments) {
          seg.mesh.visible = true;
          seg.lines.forEach(l => (l.visible = true));
          seg.curbs.forEach(c => (c.visible = true));
          seg.guides.forEach(g => (g.visible = true));
          seg.beacons.forEach(b => (b.visible = true));
        }
      }

      // Clear all existing obstacles
      engine.trackManager.obstacles.forEach(o => {
        o.cleared = true;
        o.active = false;
        if (o.mesh) o.mesh.visible = false;
      });

      engine.difficultyDirector.currentStage = stage;
      engine.environment.setBiome(stage);
      engine.scoreSystem.distance = 50 * stage;

      engine.luna.mesh.position.set(0, 0, -8);
      engine.luna.posY = 0;
      engine.luna.velocityY = 0;
      engine.luna.isFallingIntoPit = false;
      engine.cameraFollower.reanchorBehindPlayer(engine.luna.mesh.position);
    };
  });

  // 1. Stage 1: Ancient Moonlit Ruins (Low Arch & Ruined Pillar)
  console.log('📸 1. Capturing Stage 1 (Ruined Pillar & Low Arch)...');
  await page.evaluate(() => {
    const engine = window.gameEngine;
    engine.startRun();
    window.cleanState(1);

    const p = engine.trackManager.patternManager.getPatternsForStage(1)[0];
    engine.trackManager.spawnPattern(p, -14);
    engine.ui.showToast('🏛️ [STAGE 1: 달빛 유적지] 고대 석조 기둥 & 낮은 아치');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'stage1_ruins_obstacles.png') });
  await page.screenshot({ path: 'tests/screenshots/stage1_obstacles.png' });

  // 2. Stage 2: Starlight Misty Forest (Vine Brier & Crystal Spike)
  console.log('📸 2. Capturing Stage 2 (Enchanted Vine Brier & Crystal Spikes)...');
  await page.evaluate(() => {
    window.cleanState(2);
    const engine = window.gameEngine;

    const p = engine.trackManager.patternManager.getPatternsForStage(2)[0]; // vine brier pattern
    engine.trackManager.spawnPattern(p, -10);
    engine.ui.showToast('🌿 [STAGE 2: 별빛 안개 숲] 가시 덩굴 장벽 & 수정 가시');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'stage2_forest_obstacles.png') });
  await page.screenshot({ path: 'tests/screenshots/stage2_obstacles.png' });

  // 3. Stage 3: Solar Citadel & Magma Canyon (Molten Magma Pillar & Monolith)
  console.log('📸 3. Capturing Stage 3 (Molten Magma Pillar & Solar Monolith)...');
  await page.evaluate(() => {
    window.cleanState(3);
    const engine = window.gameEngine;

    const p = engine.trackManager.patternManager.getPatternsForStage(3)[0]; // magma pillar pattern
    engine.trackManager.spawnPattern(p, -10);
    engine.ui.showToast('🔥 [STAGE 3: 보랏빛 성역 / 용암 협곡] 용암 분출 기둥 & 태양 모놀리스');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'stage3_magma_obstacles.png') });
  await page.screenshot({ path: 'tests/screenshots/stage3_obstacles.png' });

  // 4-A. Stage 4: Void Abyss (Void Obelisk Spire Corridor)
  console.log('📸 4-A. Capturing Stage 4 (Void Obelisk Spire Corridor)...');
  await page.evaluate(() => {
    window.cleanState(4);
    const engine = window.gameEngine;

    const p = engine.trackManager.patternManager.getPatternsForStage(4).find(
      pat => pat.id === 'stage4_void_spire_triad'
    );
    if (p) {
      engine.trackManager.spawnPattern(p, -10);
    }
    engine.ui.showToast('🌌 [STAGE 4: 비취석 협곡 / 심연] 보이드 오벨리스크 첨탑');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'stage4_void_obelisks.png') });
  await page.screenshot({ path: 'tests/screenshots/stage4_void_obelisks.png' });

  // 4-B. Stage 4: Dimensional Skill Barrier with Charge Rune
  console.log('📸 4-B. Capturing Stage 4 (Skill Barrier with Charge Rune)...');
  await page.evaluate(() => {
    window.cleanState(4);
    const engine = window.gameEngine;

    // Stage 4 skill barrier pattern
    const p = engine.trackManager.patternManager.getPatternsForStage(4).find(
      pat => pat.obstacles.some(o => o.type === 'SKILL_BARRIER')
    );
    if (p) {
      engine.trackManager.spawnPattern(p, -8);
    }
    engine.ui.showToast('⚠️ [차원 결계 접근] 스킬을 발동하여 결계를 돌파하세요!');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'stage4_skill_barrier_approach.png') });
  await page.screenshot({ path: 'tests/screenshots/stage4_skill_barrier_approach.png' });

  // 5. Shattering Skill Barrier using Luna's Slash Wave active skill
  console.log('📸 5. Capturing Skill Barrier Shatter / Breakthrough...');
  await page.evaluate(() => {
    const engine = window.gameEngine;
    engine.luna.activateSkill();
    engine.luna.skillFX.triggerSmashBurst(0, -28);

    const oldToasts = document.querySelectorAll('.toast, .game-toast, #toast-container > div');
    oldToasts.forEach(t => t.remove());
    engine.ui.showToast('⚡ [결계 돌파] 액티브 스킬로 차원 결계를 격파했습니다!');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'stage4_skill_barrier_broken.png') });
  await page.screenshot({ path: 'tests/screenshots/stage4_skill_barrier_broken.png' });

  await browser.close();
  console.log('✅ All stage obstacle and skill barrier screenshots captured successfully!');
}

main().catch(err => {
  console.error('❌ Error during capture:', err);
  process.exit(1);
});
