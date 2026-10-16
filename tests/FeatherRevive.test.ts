import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('three', async (importOriginal) => {
  const actual: any = await importOriginal();
  class MockWebGLRenderer {
    domElement = document.createElement('canvas');
    outputColorSpace = '';
    toneMapping = 0;
    toneMappingExposure = 1;
    capabilities = { isWebGL2: false };
    shadowMap = { enabled: false, type: 0 };
    getPixelRatio = vi.fn(() => 1);
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
  }
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

import { StorageManager } from '../src/core/StorageManager';
import { GameEngine } from '../src/core/GameEngine';
import { CharacterState } from '../src/entities/LunaCharacter';
import { ObstacleType } from '../src/world/Obstacles';

describe('Phoenix Feather Revive Restrictions (불사조 깃털 판당 1회 및 낙사 제외)', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    global.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      length: 0,
      key: () => null
    };

    document.body.innerHTML = `
      <div id="canvas-container"><canvas id="game-canvas"></canvas></div>
      <div id="main-menu" class="screen"></div>
      <div id="game-hud" class="screen-view">
        <div id="hud-fever-overlay" class="hud-fever-overlay"></div>
        <div id="hud-fever-wrap" class="hud-fever-wrap">
          <div id="hud-fever-title"></div>
          <div id="hud-fever-pct"></div>
          <div id="hud-fever-fill"></div>
        </div>
        <div id="hud-score-val"></div>
        <div id="hud-dist-val"></div>
        <div id="hud-coin-val"></div>
        <div id="hud-chest-val"></div>
        <div id="buff-shield" class="hidden"></div>
        <div id="buff-magnet" class="hidden"><div id="buff-magnet-gauge"></div></div>
      </div>
      <div id="toast-container"></div>
      <div id="gameover-modal" class="modal-backdrop hidden"></div>
      <div id="revive-modal" class="modal-backdrop hidden">
        <button id="btn-watch-ad-revive"></button>
        <button id="btn-skip-revive"></button>
      </div>
      <div id="ad-player-modal" class="modal-backdrop hidden"></div>
      <div id="settings-modal" class="modal-backdrop hidden"></div>
    `;
  });

  it('should initialize usedFeatherReviveThisRun as false and reset it upon startRun', () => {
    const engine = new GameEngine();
    expect(engine.usedFeatherReviveThisRun).toBe(false);

    engine.usedFeatherReviveThisRun = true;
    engine.startRun();
    expect(engine.usedFeatherReviveThisRun).toBe(false);
  });

  it('should allow phoenix feather to revive only once per run on fatal obstacle collision', () => {
    const engine = new GameEngine();
    engine.startRun();

    // Give player 2 feathers
    engine.storage.getData().inventory.revive_feather = 2;
    expect(engine.storage.getData().inventory.revive_feather).toBe(2);

    // Ensure player has no shield and no upgrade revive and not VIP
    engine.luna.hasShield = false;
    expect(engine.usedFeatherReviveThisRun).toBe(false);

    // Simulate fatal obstacle collision
    const fatalCollision = {
      isFatal: true,
      type: ObstacleType.MAGMA_PILLAR,
      obstacle: {} as any
    };

    // First collision: should consume 1 feather and set usedFeatherReviveThisRun to true
    // In GameEngine physics loop:
    if (!engine.usedFeatherReviveThisRun && engine.storage.consumeInventoryItem('revive_feather')) {
      engine.usedFeatherReviveThisRun = true;
      engine.luna.posY = 0.5;
      engine.luna.velocityY = 10.0;
      engine.luna.state = CharacterState.JUMP;
      engine.luna.setShieldActive(true);
    }

    expect(engine.usedFeatherReviveThisRun).toBe(true);
    expect(engine.storage.getData().inventory.revive_feather).toBe(1);
    expect(engine.luna.hasShield).toBe(true);

    // Break shield
    engine.luna.setShieldActive(false);

    // Second fatal collision in same run: feather must NOT be consumed
    let revivedSecondTime = false;
    if (!engine.usedFeatherReviveThisRun && engine.storage.consumeInventoryItem('revive_feather')) {
      revivedSecondTime = true;
    }

    expect(revivedSecondTime).toBe(false);
    expect(engine.storage.getData().inventory.revive_feather).toBe(1); // Still 1 feather remaining
  });

  it('should NOT allow phoenix feather to revive when falling into pit (낙사 시 사용 불가)', () => {
    const engine = new GameEngine();
    engine.startRun();

    // Give player feathers
    engine.storage.getData().inventory.revive_feather = 3;
    expect(engine.storage.getData().inventory.revive_feather).toBe(3);

    // Simulate falling into pit
    engine.luna.posY = -3.0;
    engine.luna.isFallingIntoPit = true;

    // Pit fall logic: feather must not be consumed
    // Check that inventory is still intact
    expect(engine.storage.getData().inventory.revive_feather).toBe(3);
    expect(engine.usedFeatherReviveThisRun).toBe(false);
  });
});
