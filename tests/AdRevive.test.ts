import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';

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
import { GameState } from '../src/core/GameState';
import { CharacterState } from '../src/entities/LunaCharacter';

describe('Ad Revive & Continue Feature (판당 1회 광고 보고 이어하기)', () => {
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

    // Setup basic DOM stubs if running in jsdom/node
    document.body.innerHTML = `
      <div id="canvas-container"><canvas id="game-canvas"></canvas></div>
      <div id="main-menu" class="screen"></div>
      <div id="game-ui" class="screen hidden"></div>
      <div id="ui-overlay"></div>
      <div id="hud-score">0</div>
      <div id="hud-distance">0m</div>
      <div id="hud-coins">0</div>
      <div id="stage-banner"></div>
      <div id="stage-title"></div>
      <div id="stage-desc"></div>
      <div id="shield-indicator" class="hidden"></div>
      <div id="magnet-indicator" class="hidden"></div>
      <div id="booster-indicator" class="hidden"></div>
      <div id="skill-btn"></div>
      <div id="skill-cooldown-fill"></div>
      <div id="skill-btn-label"></div>
      <div id="skill-ready-glow"></div>
      <div id="pause-btn"></div>
      <div id="settings-modal" class="modal-backdrop hidden"></div>
      <div id="gameover-modal" class="modal-backdrop hidden"></div>
      <div id="revive-modal" class="modal-backdrop hidden">
        <span id="revive-distance">0m</span>
        <span id="revive-score">0</span>
        <div id="revive-timer-bar"></div>
        <button id="btn-watch-ad-revive"></button>
        <button id="btn-skip-revive"></button>
      </div>
      <div id="ad-player-modal" class="modal-backdrop hidden">
        <div id="ad-progress-fill"></div>
        <span id="ad-countdown">3</span>
        <button id="btn-claim-ad-reward" class="hidden"></button>
      </div>
      <div id="btn-ad-revive-go" class="hidden"></div>
    `;
  });

  describe('StorageManager chest handling for safe ad revive rollback', () => {
    it('should spend and deduct mystery chests accurately without going negative', () => {
      const sm = new StorageManager();
      expect(sm.getData().mysteryChests).toBe(0);

      sm.addMysteryChests(3);
      expect(sm.getData().mysteryChests).toBe(3);

      const spent1 = sm.spendMysteryChests(2);
      expect(spent1).toBe(true);
      expect(sm.getData().mysteryChests).toBe(1);

      const spent2 = sm.spendMysteryChests(5);
      expect(spent2).toBe(true);
      expect(sm.getData().mysteryChests).toBe(0);

      const spentZero = sm.spendMysteryChests(1);
      expect(spentZero).toBe(false);
      expect(sm.getData().mysteryChests).toBe(0);
    });
  });

  describe('GameEngine Ad Revive State & Life Cycle', () => {
    it('should initialize usedAdReviveThisRun as false and reset it on each new run', () => {
      const canvas = document.createElement('canvas');
      const engine = new GameEngine(canvas);

      expect(engine.usedAdReviveThisRun).toBe(false);
      expect(engine.isReviveModalShowing).toBe(false);

      // Simulate reviving
      engine.reviveFromAd();
      expect(engine.usedAdReviveThisRun).toBe(true);

      // Starting a new run should reset usedAdReviveThisRun to false
      engine.startRun();
      expect(engine.usedAdReviveThisRun).toBe(false);
    });

    it('should strictly allow reviveFromAd only once per run', () => {
      const canvas = document.createElement('canvas');
      const engine = new GameEngine(canvas);

      expect(engine.usedAdReviveThisRun).toBe(false);

      // Setup character in dead state
      engine.luna.state = CharacterState.DIE;
      engine.luna.posY = -5.0;
      engine.luna.isFallingIntoPit = true;
      engine.luna.deathTimer = 1.0;
      engine.luna.setShieldActive(false);

      // First revive: MUST succeed
      engine.reviveFromAd();
      expect(engine.usedAdReviveThisRun).toBe(true);
      expect(engine.luna.state).toBe(CharacterState.JUMP);
      expect(engine.luna.posY).toBe(0.5);
      expect(engine.luna.velocityY).toBe(8.0);
      expect(engine.luna.isFallingIntoPit).toBe(false);
      expect(engine.luna.deathTimer).toBe(0);
      expect(engine.luna.hasShield).toBe(true); // Grants protective shield

      // Attempt second revive in the same run: MUST be blocked
      const prevShield = engine.luna.hasShield;
      engine.luna.posY = -10.0;
      engine.reviveFromAd(); // Should do nothing because usedAdReviveThisRun is already true
      expect(engine.luna.posY).toBe(-10.0); // Not changed
    });

    it('should clear hazardous obstacles within 24m ahead upon revive so player does not die instantly', () => {
      const canvas = document.createElement('canvas');
      const engine = new GameEngine(canvas);

      engine.luna.mesh.position.z = -100;

      // Clear existing obstacles and push mock obstacles
      engine.trackManager.obstacles.length = 0;
      engine.trackManager.obstacles.push(
        { active: true, cleared: false, zPos: -105, mesh: { visible: true } } as any, // 5m ahead -> should be cleared
        { active: true, cleared: false, zPos: -120, mesh: { visible: true } } as any, // 20m ahead -> should be cleared
        { active: true, cleared: false, zPos: -150, mesh: { visible: true } } as any  // 50m ahead -> should stay
      );

      engine.reviveFromAd();

      expect(engine.trackManager.obstacles[0].cleared).toBe(true);
      expect(engine.trackManager.obstacles[0].mesh.visible).toBe(false);

      expect(engine.trackManager.obstacles[1].cleared).toBe(true);
      expect(engine.trackManager.obstacles[1].mesh.visible).toBe(false);

      expect(engine.trackManager.obstacles[2].cleared).toBe(false);
      expect(engine.trackManager.obstacles[2].mesh.visible).toBe(true);
    });

    it('should resume running game state and re-enable input upon revive', () => {
      const canvas = document.createElement('canvas');
      const engine = new GameEngine(canvas);

      engine.stateManager.setState(GameState.GAME_OVER);
      engine.input.setEnabled(false);

      engine.reviveFromAd();

      expect(engine.stateManager.isGameOver()).toBe(false);
      expect(engine.stateManager.isRunning()).toBe(true);
      expect(engine.input.getActive()).toBe(true);
    });
  });
});
