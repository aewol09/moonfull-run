import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/02f75fb4-6812-4f6d-900b-c1d5cd233e36';

async function main() {
  console.log('🚀 Capturing in-game skill effects for each character and costume...');

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

  // Helper to setup character & costume, start run, trigger skill, and capture screenshot
  async function captureSkillShot(charId, costumeId, filename, customSetup) {
    await page.evaluate(({ charId, costumeId }) => {
      const engine = window.gameEngine;
      if (engine) {
        // Clean out any lingering toasts from previous runs
        const oldToasts = document.querySelectorAll('.toast, .game-toast, #toast-container > div');
        oldToasts.forEach(t => t.remove());

        engine.storage.unlockCharacter(charId);
        engine.storage.selectCharacter(charId);
        engine.storage.unlockCostume(costumeId);
        engine.storage.equipCostume(costumeId, charId);
        engine.startRun();
        engine.luna.applyCharacter(charId, costumeId);
        engine.luna.applyCostume(costumeId, charId);
        engine.luna.setShieldActive(false);

        // Position player on pristine starting runway (z = -8m, safe from pits and turns)
        engine.scoreSystem.distance = 15;
        engine.luna.mesh.position.set(0, 0, -8);
        engine.luna.posY = 0;
        engine.luna.velocityY = 0;
        engine.luna.isFallingIntoPit = false;
        engine.cameraFollower.reanchorBehindPlayer(engine.luna.mesh.position);

        // Clear any obstacles nearby so view of hero & skill effect is crystal clear
        if (engine.trackManager && engine.trackManager.obstacles) {
          engine.trackManager.obstacles.forEach(obs => {
            obs.cleared = true;
            if (obs.mesh) obs.mesh.visible = false;
          });
        }

        // Activate skill
        engine.luna.skillCooldownRemaining = 0;
        engine.triggerActiveSkill();
      }
    }, { charId, costumeId });

    if (customSetup) {
      await page.evaluate(customSetup);
    }

    // Step animation frames so effects and particles fully blossom
    await page.evaluate(({ charId }) => {
      const engine = window.gameEngine;
      if (engine) {
        const stepCount = (charId === 'luna') ? 4 : 15;
        for (let i = 0; i < stepCount; i++) {
          engine.luna.update(0.025, 14);
          engine.cameraFollower.update(engine.luna.mesh.position, false, false, 0.025, 0);
        }

        if (charId === 'luna') {
          // Center the crescent slash blade in local coordinates (3.2m in front of Luna)
          engine.luna.skillFX.slashWaveMesh.position.set(0, 0.8, -3.2);
          engine.luna.skillFX.slashWaveMesh.visible = true;
        }

        engine.sceneManager.render();
      }
    }, { charId });
    await new Promise(r => setTimeout(r, 250));

    const shotPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: shotPath });
    console.log(`Saved: ${filename}`);
  }

  // 1. Luna Default: Moonlight Cyan Crescent Slash Blade
  await captureSkillShot('luna', 'luna_default', 'skill_01_luna_default_slash.png');

  // 2. Luna Guardian: Sacred Amethyst Star-Cross Blade
  await captureSkillShot('luna', 'luna_guardian', 'skill_02_luna_guardian_slash.png');

  // 3. Luna Dawn: Radiant Golden Solar Dawn Blade
  await captureSkillShot('luna', 'luna_dawn', 'skill_03_luna_dawn_slash.png');

  // 4. Stella Default: Lavender Nebula Magic Circle & Orbiting Star Crystals
  await captureSkillShot('stella', 'stella_default', 'skill_04_stella_default_nebula.png');

  // 5. Stella Archmage: Zodiac 12-Point Constellation Ring & Golden Astrolabe Rings
  await captureSkillShot('stella', 'stella_archmage', 'skill_05_stella_archmage_zodiac.png');

  // 6. Stella Chronos: Emerald Chronos Clock Dial & Rotating Time Gears
  await captureSkillShot('stella', 'stella_chronos', 'skill_06_stella_chronos_clock.png');

  // 7. Solaris Default: Blazing Golden Solar Chariot Shield & Flame Wheels
  await captureSkillShot('solaris', 'solaris_default', 'skill_07_solaris_default_sunfire.png');

  // 8. Solaris Obsidian: Volcanic Magma Rock Armor & Red Molten Fissures
  await captureSkillShot('solaris', 'solaris_obsidian', 'skill_08_solaris_obsidian_magma.png');

  // 9. Solaris Phoenix: Blazing Vermilion Phoenix Fire Wings & Feathers
  await captureSkillShot('solaris', 'solaris_phoenix', 'skill_09_solaris_phoenix_wings.png');

  // 10. Nyx Default: Midnight Void Portal & Cyan Phantom Mist & Afterimages
  await captureSkillShot('nyx', 'nyx_default', 'skill_10_nyx_default_shadow.png');

  // 11. Nyx Cyber: 3D Holographic Cyber Grid Box & Digital Matrix Reticle
  await captureSkillShot('nyx', 'nyx_cyber', 'skill_11_nyx_cyber_matrix.png');

  // 12. Nyx Bloodmoon: Crimson Blood-Moon Eclipse Ring & Bleeding Petals
  await captureSkillShot('nyx', 'nyx_bloodmoon', 'skill_12_nyx_bloodmoon_eclipse.png');

  await browser.close();
  console.log('🎉 All 12 character and costume skill effects captured successfully!');
}

main().catch(err => {
  console.error('Error capturing skill effects:', err);
  process.exit(1);
});
