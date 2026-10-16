import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { SkillFXManager } from '../src/render/SkillFXManager';

describe('SkillFXManager', () => {
  let fx: SkillFXManager;

  beforeEach(() => {
    fx = new SkillFXManager();
  });

  it('should initialize with default Luna theme and hidden meshes', () => {
    expect(fx.currentCharacterId).toBe('luna');
    expect(fx.currentCostumeId).toBe('luna_default');
    expect(fx.slashWaveMesh.visible).toBe(false);
    expect(fx.rootGroup).toBeInstanceOf(THREE.Group);
  });

  it('should apply and switch themes for all 4 characters and their 3 costumes each', () => {
    // 1. Luna Costumes
    fx.setTheme('luna', 'luna_default');
    expect(fx.currentCharacterId).toBe('luna');
    expect(fx.currentCostumeId).toBe('luna_default');

    fx.setTheme('luna', 'luna_guardian');
    expect(fx.currentCostumeId).toBe('luna_guardian');

    fx.setTheme('luna', 'luna_dawn');
    expect(fx.currentCostumeId).toBe('luna_dawn');

    // 2. Stella Costumes
    fx.setTheme('stella', 'stella_default');
    expect(fx.currentCharacterId).toBe('stella');
    expect(fx.currentCostumeId).toBe('stella_default');

    fx.setTheme('stella', 'stella_archmage');
    expect(fx.currentCostumeId).toBe('stella_archmage');

    fx.setTheme('stella', 'stella_chronos');
    expect(fx.currentCostumeId).toBe('stella_chronos');

    // 3. Solaris Costumes
    fx.setTheme('solaris', 'solaris_default');
    expect(fx.currentCharacterId).toBe('solaris');
    expect(fx.currentCostumeId).toBe('solaris_default');

    fx.setTheme('solaris', 'solaris_obsidian');
    expect(fx.currentCostumeId).toBe('solaris_obsidian');

    fx.setTheme('solaris', 'solaris_phoenix');
    expect(fx.currentCostumeId).toBe('solaris_phoenix');

    // 4. Nyx Costumes
    fx.setTheme('nyx', 'nyx_default');
    expect(fx.currentCharacterId).toBe('nyx');
    expect(fx.currentCostumeId).toBe('nyx_default');

    fx.setTheme('nyx', 'nyx_cyber');
    expect(fx.currentCostumeId).toBe('nyx_cyber');

    fx.setTheme('nyx', 'nyx_bloodmoon');
    expect(fx.currentCostumeId).toBe('nyx_bloodmoon');
  });

  it('should activate appropriate FX meshes upon triggerSkill for each character', () => {
    // Luna Moonlight Slash
    fx.triggerSkill('luna', 'luna_default');
    expect(fx.slashWaveMesh.visible).toBe(true);

    // Reset
    fx.reset();
    expect(fx.slashWaveMesh.visible).toBe(false);

    // Stella Starfall Transmute
    fx.triggerSkill('stella', 'stella_archmage');
    fx.update(0.016, true, new THREE.Vector3(0, 0, 0), false);
    // Stella meshes should be active during skill
    expect(fx.currentCharacterId).toBe('stella');

    // Solaris Solar Juggernaut
    fx.triggerSkill('solaris', 'solaris_phoenix');
    fx.update(0.016, true, new THREE.Vector3(0, 0, 0), false);
    expect(fx.currentCharacterId).toBe('solaris');

    // Nyx Shadow Shift
    fx.triggerSkill('nyx', 'nyx_cyber');
    fx.update(0.016, true, new THREE.Vector3(0, 0, 0), false);
    expect(fx.currentCharacterId).toBe('nyx');
  });

  it('should spawn and animate Stella transmute bursts and Solaris smash bursts', () => {
    fx.triggerTransmuteBurst(0, -15);
    fx.triggerSmashBurst(0, -20);

    // Update step
    fx.update(0.05, false, new THREE.Vector3(0, 0, 0), false);
    expect(fx.rootGroup.children.length).toBeGreaterThan(0);

    // Advance until bursts dissolve
    for (let i = 0; i < 30; i++) {
      fx.update(0.05, false, new THREE.Vector3(0, 0, 0), false);
    }
  });

  it('should reset all visual effects cleanly on reset()', () => {
    fx.triggerSkill('solaris', 'solaris_default');
    fx.triggerTransmuteBurst(0, -10);
    fx.triggerSmashBurst(0, -10);

    fx.reset();
    expect(fx.slashWaveMesh.visible).toBe(false);
  });
});
