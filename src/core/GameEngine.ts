import * as THREE from 'three';
import { GameState, GameStateManager } from './GameState';
import { StorageManager } from './StorageManager';
import { AudioManager } from './AudioManager';
import { InputManager, InputAction } from './InputManager';
import { SceneManager } from '../render/SceneManager';
import { CameraFollower } from '../render/CameraFollower';
import { WorldEnvironment } from '../render/WorldEnvironment';
import { LunaCharacter, CharacterState } from '../entities/LunaCharacter';
import { TrackManager } from '../world/TrackManager';
import { ShardManager } from '../world/ShardManager';
import { CollisionSystem } from '../world/CollisionSystem';
import { ScoreSystem } from '../gameplay/ScoreSystem';
import { DifficultyDirector } from '../gameplay/DifficultyDirector';
import { UpgradeManager } from '../gameplay/UpgradeManager';
import { UIManager } from '../ui/UIManager';
import { CapacitorAdapter } from '../mobile/CapacitorAdapter';

export class GameEngine {
  public stateManager: GameStateManager;
  public storage: StorageManager;
  public audio: AudioManager;
  public input: InputManager;
  public sceneManager: SceneManager;
  public cameraFollower: CameraFollower;
  public environment: WorldEnvironment;
  public luna: LunaCharacter;
  public shardManager: ShardManager;
  public trackManager: TrackManager;
  public collisionSystem: CollisionSystem;
  public scoreSystem: ScoreSystem;
  public difficultyDirector: DifficultyDirector;
  public upgradeManager: UpgradeManager;
  public ui: UIManager;
  public capacitor: CapacitorAdapter;

  private lastTime = 0;
  private isGameOverProcessed = false;

  constructor() {
    // 1. Core Systems
    this.stateManager = new GameStateManager();
    this.storage = new StorageManager();
    const settings = this.storage.getData().settings;
    this.audio = new AudioManager(settings.bgm, settings.sfx);
    this.input = new InputManager();

    // 2. Rendering & 3D Environment
    this.sceneManager = new SceneManager();
    this.sceneManager.applyQuality(settings.graphicsQuality);
    this.cameraFollower = new CameraFollower(this.sceneManager.camera);
    this.environment = new WorldEnvironment(this.sceneManager.scene);

    // 3. Characters & World
    this.luna = new LunaCharacter();
    this.sceneManager.scene.add(this.luna.mesh);

    this.shardManager = new ShardManager(this.sceneManager.scene);
    this.trackManager = new TrackManager(this.sceneManager.scene, this.shardManager);
    this.collisionSystem = new CollisionSystem();

    // 4. Gameplay Logic
    this.scoreSystem = new ScoreSystem(this.storage);
    this.difficultyDirector = new DifficultyDirector();
    this.upgradeManager = new UpgradeManager(this.storage);

    // 5. Native & UI Integrations
    this.capacitor = new CapacitorAdapter(this.stateManager, this.storage);
    this.ui = new UIManager(
      this.stateManager,
      this.storage,
      this.audio,
      {
        onStartRun: () => this.startRun(),
        onResume: () => this.resume(),
        onRestart: () => this.restart(),
        onMainMenu: () => this.goToMainMenu(),
        onQualityChange: (quality) => this.sceneManager.applyQuality(quality)
      }
    );

    // 6. Bind Input & State Listeners
    this.initInputCallbacks();
    this.initStateListener();

    // 7. Initial Track setup for Main Menu background
    this.trackManager.initTrack();

    // Start requestAnimationFrame Loop
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  private initInputCallbacks(): void {
    this.input.setCallback((action: InputAction) => {
      if (this.stateManager.isRunning()) {
        switch (action) {
          case InputAction.MOVE_LEFT:
            if (this.luna.moveLeft()) {
              this.capacitor.vibrateLight();
            }
            break;
          case InputAction.MOVE_RIGHT:
            if (this.luna.moveRight()) {
              this.capacitor.vibrateLight();
            }
            break;
          case InputAction.JUMP:
            if (this.luna.jump()) {
              this.audio.playJump();
              this.capacitor.vibrateLight();
            }
            break;
          case InputAction.SLIDE:
            if (this.luna.slide()) {
              this.audio.playSlide();
              this.capacitor.vibrateLight();
            }
            break;
          case InputAction.PAUSE:
            this.stateManager.setState(GameState.PAUSED);
            break;
        }
      }
    });
  }

  private initStateListener(): void {
    this.stateManager.subscribe((newState, prevState) => {
      this.ui.switchScreen(newState);

      if (newState === GameState.MAIN_MENU) {
        this.cameraFollower.setMenuMode(true);
        this.input.setEnabled(false);
      } else if (newState === GameState.RUNNING) {
        this.cameraFollower.setMenuMode(false);
        this.input.setEnabled(true);
        this.ui.hidePauseModal();
      } else if (newState === GameState.PAUSED) {
        this.input.setEnabled(false);
        this.ui.showPauseModal(
          this.scoreSystem.distance,
          this.scoreSystem.currentScore,
          this.scoreSystem.sessionCoins
        );
      } else if (newState === GameState.GAME_OVER) {
        this.input.setEnabled(false);
        if (!this.isGameOverProcessed) {
          this.isGameOverProcessed = true;
          const result = this.scoreSystem.finishRun();
          this.ui.showGameOverModal(result);
        }
      }
    });
  }

  public startRun(): void {
    this.isGameOverProcessed = false;
    this.luna.reset();
    this.scoreSystem.reset();
    this.difficultyDirector.reset();
    this.trackManager.initTrack();
    this.upgradeManager.applyStartBuffs(this.luna, this.scoreSystem);
    this.stateManager.setState(GameState.RUNNING);
  }

  public resume(): void {
    this.stateManager.setState(GameState.RUNNING);
  }

  public restart(): void {
    this.startRun();
  }

  public goToMainMenu(): void {
    this.isGameOverProcessed = false;
    this.luna.reset();
    this.scoreSystem.reset();
    this.difficultyDirector.reset();
    this.trackManager.initTrack();
    this.stateManager.setState(GameState.MAIN_MENU);
  }

  private gameLoop(time: number): void {
    requestAnimationFrame((t) => this.gameLoop(t));

    if (this.lastTime === 0) {
      this.lastTime = time;
      return;
    }

    const dt = Math.min((time - this.lastTime) / 1000, 0.05); // Clamp dt to prevent jumping through obstacles
    this.lastTime = time;

    // Pass character lane transitioning state to input manager buffer
    this.input.setProcessingTransition(this.luna.isTransitioningLane);

    if (this.stateManager.isMainMenu()) {
      // Main menu showcase
      this.luna.mesh.rotation.y = Math.sin(time * 0.0015) * 0.4;
      this.environment.update(0, dt);
      this.cameraFollower.update(this.luna.mesh.position, false, false, dt);
    } else if (this.stateManager.isRunning()) {
      // 1. Difficulty & Speed
      const speed = this.difficultyDirector.update(this.scoreSystem.distance);

      // 2. Forward Movement
      this.luna.mesh.position.z -= speed * dt;

      // 3. Entity Updates
      this.luna.update(dt, speed);
      this.upgradeManager.update(dt, this.luna);
      this.scoreSystem.update(dt, speed);

      // 4. World & Obstacle Updates
      this.trackManager.update(this.luna.mesh.position.z, this.scoreSystem.distance, speed);
      this.environment.update(this.luna.mesh.position.z, dt);

      // 5. Moon Shards & Magnet
      const magnetActive = this.luna.magnetTimeRemaining > 0;
      const magnetRadius = this.upgradeManager.getMagnetRadius();
      this.shardManager.update(
        this.luna.mesh.position,
        dt,
        magnetActive,
        magnetRadius,
        () => {
          this.scoreSystem.addCoin();
          this.audio.playCoin();
          this.capacitor.vibrateLight();
        }
      );

      // 6. Collision Checking
      const collision = this.collisionSystem.checkCollisions(
        this.luna,
        this.trackManager.obstacles,
        dt
      );

      if (collision.hit) {
        if (collision.fatal) {
          // Pit fall - cannot be protected by shield
          this.audio.playGameOver();
          this.capacitor.vibrateHeavy();
          this.luna.hitObstacle();
          this.stateManager.setState(GameState.GAME_OVER);
        } else {
          // Regular obstacle hit
          if (this.luna.hasShield) {
            this.luna.setShieldActive(false);
            this.audio.playShieldBreak();
            this.capacitor.vibrateLight();
            this.ui.showToast('🛡️ 달빛 보호막이 충돌을 방어했습니다!');
          } else {
            this.audio.playHit();
            this.audio.playGameOver();
            this.capacitor.vibrateHeavy();
            this.luna.hitObstacle();
            this.stateManager.setState(GameState.GAME_OVER);
          }
        }
      }

      // Instant pit fall boundary check
      if (this.luna.posY < -4.0 && !this.stateManager.isGameOver()) {
        this.audio.playGameOver();
        this.capacitor.vibrateHeavy();
        this.stateManager.setState(GameState.GAME_OVER);
      }

      // 7. Camera Follower
      this.cameraFollower.update(
        this.luna.mesh.position,
        this.luna.state === CharacterState.JUMP || this.luna.state === CharacterState.FALL,
        this.luna.state === CharacterState.SLIDE,
        dt
      );

      // 8. Update In-Game HUD
      this.ui.updateHUD(
        this.scoreSystem.distance,
        this.scoreSystem.currentScore,
        this.scoreSystem.sessionCoins,
        this.luna.hasShield,
        this.luna.magnetTimeRemaining,
        this.upgradeManager.getMagnetDuration()
      );
    }

    // Render Scene
    this.sceneManager.render();
  }
}
