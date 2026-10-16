import * as THREE from 'three';
import { GameState, GameStateManager } from './GameState';
import { StorageManager } from './StorageManager';
import { AudioManager } from './AudioManager';
import { InputManager, InputAction } from './InputManager';
import { SceneManager } from '../render/SceneManager';
import { CameraFollower } from '../render/CameraFollower';
import { WorldEnvironment } from '../render/WorldEnvironment';
import { LunaCharacter, CharacterState, LANE_WIDTH } from '../entities/LunaCharacter';
import { TrackManager } from '../world/TrackManager';
import { ShardManager } from '../world/ShardManager';
import { CollisionSystem } from '../world/CollisionSystem';
import { ObstacleType } from '../world/Obstacles';
import { ScoreSystem } from '../gameplay/ScoreSystem';
import { DifficultyDirector } from '../gameplay/DifficultyDirector';
import { UpgradeManager } from '../gameplay/UpgradeManager';
import { UIManager } from '../ui/UIManager';
import { CapacitorAdapter } from '../mobile/CapacitorAdapter';
import { AdMobService } from '../mobile/AdMobService';
import { installCurveWorld, CurveDirector } from '../render/CurveWorld';
import { TurnDirector } from '../gameplay/TurnDirector';

export class GameEngine {
  public stateManager: GameStateManager;
  public storage: StorageManager;
  public audio: AudioManager;
  public input: InputManager;
  public sceneManager: SceneManager;
  public cameraFollower: CameraFollower;
  private curveDirector = new CurveDirector();
  public turnDirector = new TurnDirector();
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
  public adMob: AdMobService;

  private lastTime = 0;
  private isGameOverProcessed = false;
  public sessionChests = 0;
  private usedVipReviveThisRun = false;
  public usedAdReviveThisRun = false;
  public isReviveModalShowing = false;
  private lastAddedCoins = 0;
  private lastAddedChests = 0;
  private magnetPotionActive = false;

  constructor() {
    // 1. Core Systems
    this.stateManager = new GameStateManager();
    this.storage = new StorageManager();
    const settings = this.storage.getData().settings;
    this.audio = new AudioManager(settings.bgm, settings.sfx);
    this.input = new InputManager();

    // 2. Rendering & 3D Environment
    installCurveWorld();
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
    this.adMob = new AdMobService();
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
        onQualityChange: (quality) => this.sceneManager.applyQuality(quality),
        onSelectCostume: (costumeId) => {
          const ownerChar = this.storage.getCharacterForCostume(costumeId);
          this.luna.applyCharacter(ownerChar, costumeId);
          this.luna.applyCostume(costumeId, ownerChar);
          this.shardManager.applyCostumeShard(costumeId);
        },
        onSelectCharacter: (charId) => {
          const equippedCostume = this.storage.getEquippedCostume(charId);
          this.luna.applyCharacter(charId, equippedCostume);
          this.luna.applyCostume(equippedCostume, charId);
          this.shardManager.applyCostumeShard(equippedCostume);
        },
        onCostumeModalToggle: (isOpen) => {
          this.cameraFollower.setCostumeModalOpen(isOpen);
          if (!isOpen) {
            // Revert 3D preview to the currently equipped character & costume on modal close
            const curChar = this.storage.getData().currentCharacter || 'luna';
            const equippedCostume = this.storage.getEquippedCostume(curChar);
            this.luna.applyCharacter(curChar, equippedCostume);
            this.luna.applyCostume(equippedCostume, curChar);
            this.shardManager.applyCostumeShard(equippedCostume);
          }
        },
        onTriggerSkill: () => this.triggerActiveSkill(),
        onWatchAdToContinue: () => this.watchAdAndRevive(),
        onSkipRevive: () => this.skipAdRevive()
      }
    );

    // Check daily Monthly Pass reward on launch
    const passReward = this.storage.checkMonthlyPassDailyReward();
    if (passReward.claimed) {
      this.ui.updateMenuDisplay();
      this.ui.showToast(`📜 [월간 패스 일일 보상] 달의 파편 +${passReward.amount.toLocaleString()}개 지급! (남은 기간: ${passReward.daysRemaining}일)`);
    }

    // Apply saved character & costume to Luna and ShardManager
    const initialChar = this.storage.getData().currentCharacter || 'luna';
    const initialCostume = this.storage.getEquippedCostume(initialChar);
    this.luna.applyCharacter(initialChar);
    this.luna.applyCostume(initialCostume, initialChar);
    this.shardManager.applyCostumeShard(initialCostume);

    // 6. Bind Input & State Listeners
    this.initInputCallbacks();
    this.initStateListener();

    // Auto-pause on browser tab switch / window blur during active gameplay
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.stateManager.isRunning() && !this.isReviveModalShowing) {
          this.stateManager.setState(GameState.PAUSED);
        }
      });
    }

    // Turn director callbacks for in-game notifications
    this.turnDirector.onTurnChange = (evt) => {
      this.ui.showToast(evt.title);
      this.audio.playCoin();
      this.capacitor.vibrateLight();
    };

    this.turnDirector.onCornerApproaching = (direction, cornerZ, radius) => {
      this.trackManager.spawnCorner(direction, cornerZ, radius);
    };

    this.turnDirector.onCornerComplete = (direction) => {
      this.environment.rotateHorizon(direction === 'right' ? 1 : -1);
      this.trackManager.reanchorTrackAtPlayer(0);
      this.luna.mesh.position.set(this.luna.targetLane * LANE_WIDTH, this.luna.posY, 0);
      this.luna.mesh.rotation.y = 0;
      this.luna.visualGroup.rotation.z = 0;
      this.luna.isTurningCorner = false;
      this.cameraFollower.reanchorBehindPlayer(this.luna.mesh.position);
      this.scoreSystem.bonusScore += 500;
      this.audio.playCoin();
      this.ui.showToast('⭐ 코너링 완료! 새로운 도로로 전방 질주 (+500점)');
    };

    // 7. Initial Track setup for Main Menu background
    this.trackManager.initTrack();

    // Start requestAnimationFrame Loop
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  public triggerActiveSkill(): void {
    if (!this.stateManager.isRunning() || this.luna.state === CharacterState.DIE) return;
    const cdMult = this.upgradeManager.getSkillCooldownMultiplier();
    const skillLvl = this.storage.getCharacterSkillLevel(this.luna.currentCharacterId);
    const res = this.luna.activateSkill(cdMult, skillLvl);
    if (res.success) {
      if (this.luna.currentCharacterId === 'luna') {
        this.audio.playSkillSlash();
      } else if (this.luna.currentCharacterId === 'stella') {
        this.audio.playSkillStarfall();
      } else if (this.luna.currentCharacterId === 'solaris') {
        this.audio.playSkillSolarDash();
      } else if (this.luna.currentCharacterId === 'nyx') {
        this.audio.playSkillShadow();
      } else {
        this.audio.playShieldBreak();
      }
      this.capacitor.vibrateHeavy();
      if (this.luna.currentCharacterId === 'stella') {
        const count = this.trackManager.transmuteObstaclesToShards(
          this.luna.mesh.position.z,
          45,
          (x, z) => this.luna.skillFX.triggerTransmuteBurst(x, z)
        );
        this.ui.showToast(`✨ [스타폴 변환 Lv.${skillLvl}] 전방 장애물이 달빛 파편으로 승화! (${count}개 변환)`);
      } else {
        this.ui.showToast(`⚡ [${res.skillName} Lv.${skillLvl}] 스킬 발동!`);
      }
    }
  }

  private initInputCallbacks(): void {
    this.input.setCallback((action: InputAction) => {
      if (this.stateManager.isRunning()) {
        switch (action) {
          case InputAction.MOVE_LEFT:
            if (this.turnDirector.isApproachingCorner && this.turnDirector.turnDirection === 'left') {
              this.scoreSystem.bonusScore += 500;
              this.audio.playCoin();
              this.ui.showToast('⭐ PERFECT CORNER TURN! (+500 PTS)');
            }
            if (this.luna.moveLeft()) {
              this.capacitor.vibrateLight();
            }
            break;
          case InputAction.MOVE_RIGHT:
            if (this.turnDirector.isApproachingCorner && this.turnDirector.turnDirection === 'right') {
              this.scoreSystem.bonusScore += 500;
              this.audio.playCoin();
              this.ui.showToast('⭐ PERFECT CORNER TURN! (+500 PTS)');
            }
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
          case InputAction.SKILL:
            this.triggerActiveSkill();
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
          this.scoreSystem.sessionCoins,
          this.sessionChests
        );
      } else if (newState === GameState.GAME_OVER) {
        this.input.setEnabled(false);
        if (!this.isGameOverProcessed) {
          this.isGameOverProcessed = true;
          const result = this.scoreSystem.finishRun();
          this.lastAddedCoins = result.coins;
          this.lastAddedChests = this.sessionChests;
          if (this.sessionChests > 0) {
            this.storage.addMysteryChests(this.sessionChests);
          }
          this.ui.showGameOverModal(result, this.sessionChests, !this.usedAdReviveThisRun);
        }
      }
    });
  }

  public startRun(): void {
    this.isGameOverProcessed = false;
    this.sessionChests = 0;
    this.usedVipReviveThisRun = false;
    this.usedAdReviveThisRun = false;
    this.isReviveModalShowing = false;
    this.lastAddedCoins = 0;
    this.lastAddedChests = 0;
    this.magnetPotionActive = false;
    this.curveDirector.reset();
    this.turnDirector.reset();
    this.ui.hideGameOverModal();
    this.ui.hidePauseModal();
    this.ui.hideReviveModal();
    this.ui.hideAdPlayerModal();
    this.luna.reset();

    const curChar = this.storage.getData().currentCharacter || 'luna';
    const curCostume = this.storage.getEquippedCostume(curChar);
    this.luna.applyCharacter(curChar, curCostume);
    this.luna.applyCostume(curCostume, curChar);
    this.shardManager.applyCostumeShard(curCostume);

    this.scoreSystem.reset();
    this.difficultyDirector.reset();
    this.environment.setBiome(1);
    this.trackManager.chestSpawnMultiplier = this.upgradeManager.getChestSpawnMultiplier();
    this.trackManager.initTrack();
    this.upgradeManager.applyStartBuffs(this.luna, this.scoreSystem);

    // Apply & Consume Shop Consumables if available in inventory
    if (this.storage.consumeInventoryItem('start_shield')) {
      this.luna.setShieldActive(true);
      this.ui.showToast('🛡️ [출발 보호막] 아이템 적용 완료!');
    }
    if (this.storage.consumeInventoryItem('rocket_headstart')) {
      this.scoreSystem.advanceDistance(500);
      this.ui.showToast('⚡ [초광속 로켓 스타트] 500m 돌파!');
    }
    if (this.storage.consumeInventoryItem('magnet_potion')) {
      this.magnetPotionActive = true;
      const boostedDuration = Math.max(15, this.upgradeManager.getMagnetDuration() * 2);
      this.luna.activateMagnet(boostedDuration);
      this.ui.showToast(`🧲 [자석 강화 비약] 지속시간·반경 2배 증폭 (${boostedDuration.toFixed(0)}초)!`);
    }
    if (this.storage.consumeInventoryItem('shard_booster')) {
      this.scoreSystem.setBonusCoinMultiplier(1.5);
      this.ui.showToast('💎 [파편 1.5배 부스터] 활성화!');
    }

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
    this.sessionChests = 0;
    this.usedAdReviveThisRun = false;
    this.isReviveModalShowing = false;
    this.lastAddedCoins = 0;
    this.lastAddedChests = 0;
    this.magnetPotionActive = false;
    this.ui.hideGameOverModal();
    this.ui.hidePauseModal();
    this.ui.hideReviveModal();
    this.ui.hideAdPlayerModal();
    this.luna.reset();
    this.turnDirector.reset();

    const curChar = this.storage.getData().currentCharacter || 'luna';
    this.luna.applyCharacter(curChar);

    const curCostume = this.storage.getEquippedCostume(curChar);
    this.luna.applyCostume(curCostume, curChar);
    this.shardManager.applyCostumeShard(curCostume);

    this.scoreSystem.reset();
    this.difficultyDirector.reset();
    this.environment.setBiome(1);
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
      this.luna.cameraYaw = 0;
      this.turnDirector.update(0, dt, false);
      this.luna.setMenuPreviewMode(Math.sin(time * 0.0015) * 0.4);
      this.environment.update(0, dt);
      this.cameraFollower.update(this.luna.mesh.position, false, false, dt, 0);
      this.curveDirector.update(dt, false);
    } else if (this.stateManager.isRunning()) {
      // If Luna has perished, play full tumble/fall death animation before showing Game Over modal
      if (this.luna.state === CharacterState.DIE) {
        this.luna.update(dt, 0);
        this.cameraFollower.update(this.luna.mesh.position, false, false, dt);
        if (this.luna.deathTimer >= 0.75 && !this.stateManager.isGameOver()) {
          if (!this.usedAdReviveThisRun && !this.isReviveModalShowing) {
            this.showAdReviveModal();
          } else if (!this.isReviveModalShowing) {
            this.stateManager.setState(GameState.GAME_OVER);
          }
        }
        this.sceneManager.render();
        return;
      }

      // Stage progression & Biome changes
      const stageTransition = this.difficultyDirector.checkStageTransition(this.scoreSystem.distance);
      if (stageTransition) {
        this.environment.setBiome(stageTransition.stage);
        this.audio.playStageFanfare();
        this.capacitor.vibrateLight();
        this.ui.showToast(`✨ [STAGE ${stageTransition.stage}] ${stageTransition.name} 진입!`);
      }

      // 1. Difficulty & Speed
      let speed = this.difficultyDirector.update(this.scoreSystem.distance);
      if (this.scoreSystem.isFever) {
        speed *= 1.25; // Fever sprint speed
      }
      if (this.luna.currentCharacterId === 'solaris' && this.luna.isSkillActive) {
        speed *= 1.4; // Solaris Solar Dash +40% speed boost
      }

      // 2. Forward Movement (Straight track)
      if (this.turnDirector.phase !== 'sideways') {
        this.luna.mesh.position.z -= speed * dt;
        this.luna.isTurningCorner = false;
      }

      // 3. Entity Updates
      this.luna.isFeverMode = this.scoreSystem.isFever;
      this.luna.update(dt, speed);
      this.upgradeManager.update(dt, this.luna);

      // Continuous Starfall transmutation while Stella's skill is active
      if (this.luna.currentCharacterId === 'stella' && this.luna.isSkillActive) {
        this.trackManager.transmuteObstaclesToShards(
          this.luna.mesh.position.z,
          45,
          (x, z) => this.luna.skillFX.triggerTransmuteBurst(x, z)
        );
      }

      let feverScoreMult = this.upgradeManager.getFeverScoreMultiplier();
      if (this.luna.currentCharacterId === 'nyx' && this.luna.isSkillActive) {
        feverScoreMult *= 2; // Nyx Shadow Shift 2x score gain
      }
      this.scoreSystem.update(dt, speed, feverScoreMult);

      // Pit Abyss Fall Check: Player plunged through floor hole into abyss; dies after falling a short while!
      if (this.luna.isFallingIntoPit) {
        if (this.luna.posY < -4.5) {
          if (this.upgradeManager.canRevive()) {
            this.upgradeManager.useRevive();
            this.luna.posY = 0.5;
            this.luna.velocityY = 11.0;
            this.luna.isFallingIntoPit = false;
            this.luna.state = CharacterState.JUMP;
            this.luna.setShieldActive(true);
            this.audio.playReviveFanfare();
            this.capacitor.vibrateHeavy();
            this.ui.showToast('🌟 달빛 부활! 기적처럼 심연을 차고 날아올랐습니다!');
          } else if (this.storage.isVipMember() && !this.usedVipReviveThisRun) {
            this.usedVipReviveThisRun = true;
            this.luna.posY = 0.5;
            this.luna.velocityY = 11.0;
            this.luna.isFallingIntoPit = false;
            this.luna.state = CharacterState.JUMP;
            this.luna.setShieldActive(true);
            this.audio.playReviveFanfare();
            this.capacitor.vibrateHeavy();
            this.ui.showToast('👑 [VIP 무료 부활] 심연을 극복하고 날아올랐습니다!');
          } else if (this.storage.consumeInventoryItem('revive_feather')) {
            this.luna.posY = 0.5;
            this.luna.velocityY = 11.0;
            this.luna.isFallingIntoPit = false;
            this.luna.state = CharacterState.JUMP;
            this.luna.setShieldActive(true);
            this.audio.playReviveFanfare();
            this.capacitor.vibrateHeavy();
            this.ui.showToast('🌟 [부활의 불사조 깃털] 심연을 극복하고 부활했습니다!');
          } else {
            this.audio.playGameOver();
            this.capacitor.vibrateHeavy();
            this.luna.hitObstacle(true);
          }
        }
      }

      // 4. World & Obstacle Updates
      this.trackManager.update(
        this.luna.mesh.position.z,
        this.scoreSystem.distance,
        speed,
        this.difficultyDirector.currentStage
      );
      this.environment.update(this.luna.mesh.position.z, dt);

      // 5. Moon Shards & Magnet
      const skillMagnet =
        this.luna.isSkillActive &&
        (this.luna.currentCharacterId === 'stella' || this.luna.currentCharacterId === 'nyx');
      const magnetActive = this.luna.magnetTimeRemaining > 0 || this.scoreSystem.isFever || skillMagnet;
      let magnetRadius = this.scoreSystem.isFever ? 14.0 : this.upgradeManager.getMagnetRadius();
      if (this.magnetPotionActive && this.luna.magnetTimeRemaining > 0) {
        magnetRadius *= 2.0;
      }
      if (skillMagnet) {
        magnetRadius = Math.max(magnetRadius, 14.0);
      }
      let coinMult = this.upgradeManager.getCoinMultiplier();
      if (this.luna.currentCharacterId === 'nyx' && this.luna.isSkillActive) {
        coinMult *= 2; // Nyx Shadow Shift 2x coin gain
      }

      this.shardManager.update(
        this.luna.mesh.position,
        dt,
        magnetActive,
        magnetRadius,
        () => {
          const feverReady = this.scoreSystem.addCoin(coinMult);
          this.audio.playCoin();
          this.capacitor.vibrateLight();

          if (feverReady && !this.scoreSystem.isFever) {
            const feverDuration = this.upgradeManager.getFeverDuration();
            this.scoreSystem.activateFever(feverDuration);
            this.luna.isFeverMode = true;
            this.audio.playShieldBreak();
            this.capacitor.vibrateHeavy();
            this.ui.showToast('🔥 STARLIGHT FEVER! 무적 질주 발동!');
          }
        }
      );

      // 6. Collision Checking
      const collision = this.collisionSystem.checkCollisions(
        this.luna,
        this.trackManager.obstacles,
        dt,
        speed
      );

      if (collision.skillChargeCollected) {
        this.audio.playCoin();
        this.capacitor.vibrateLight();
        this.ui.showToast('⚡ [스킬 충전 룬] 스킬 즉시 충전 완료! 결계를 돌파하세요!');
      }

      if (collision.skillBarrierWarning) {
        this.ui.showToast('⚠️ [차원 결계 접근] 스킬을 발동하여 결계를 돌파하세요!');
      }

      if (collision.skillBarrierBroken) {
        this.luna.skillFX.triggerSmashBurst(this.luna.mesh.position.x, this.luna.mesh.position.z - 1.2);
        this.audio.playShieldBreak();
        this.capacitor.vibrateHeavy();
        this.ui.showToast('⚡ [결계 돌파] 액티브 스킬로 차원 결계를 격파했습니다!');
      }

      if (collision.chestCollected) {
        this.sessionChests++;
        this.audio.playCoin();
        this.capacitor.vibrateLight();
        this.ui.showToast(`📦 신비한 보물상자 획득! (현재 ${this.sessionChests}개)`);
      } else if (collision.smashed) {
        const bonus = this.scoreSystem.addSmashBonus();
        this.luna.skillFX.triggerSmashBurst(this.luna.mesh.position.x, this.luna.mesh.position.z - 1.2);
        this.audio.playShieldBreak();
        this.capacitor.vibrateLight();
        this.ui.showToast(`💥 장애물 분쇄! +${bonus} PTS`);
      } else if (collision.evaded) {
        const evasion = this.scoreSystem.addEvasionBonus();
        this.audio.playCoin();
        this.ui.showToast(`⚡ 아슬아슬 회피! +${evasion.points} (${evasion.combo} COMBO x${evasion.mult.toFixed(1)})`);
      } else if (collision.hit) {
        if (collision.fatal) {
          if (collision.type === ObstacleType.BROKEN_BRIDGE || collision.type === ObstacleType.CRUMBLING_PLATFORM) {
            // Plunge through the floor hole into the deep abyss, then die after falling a short while!
            if (!this.luna.isFallingIntoPit) {
              this.luna.isFallingIntoPit = true;
              this.luna.state = CharacterState.FALL;
              this.luna.velocityY = Math.min(this.luna.velocityY, -9.0);
              this.audio.playSlide();
              this.capacitor.vibrateHeavy();
              this.ui.showToast('⚠️ 발밑이 꺼져 심연으로 추락합니다!');
            }
          } else {
            if (this.upgradeManager.canRevive()) {
              this.upgradeManager.useRevive();
              this.luna.posY = 0.5;
              this.luna.velocityY = 10.0;
              this.luna.state = CharacterState.JUMP;
              this.luna.setShieldActive(true);
              this.audio.playReviveFanfare();
              this.capacitor.vibrateHeavy();
              this.ui.showToast('🌟 달빛 부활! 기적처럼 다시 일어섰습니다!');
            } else if (this.storage.isVipMember() && !this.usedVipReviveThisRun) {
              this.usedVipReviveThisRun = true;
              this.luna.posY = 0.5;
              this.luna.velocityY = 10.0;
              this.luna.state = CharacterState.JUMP;
              this.luna.setShieldActive(true);
              this.audio.playReviveFanfare();
              this.capacitor.vibrateHeavy();
              this.ui.showToast('👑 [VIP 무료 부활] 치명상을 극복하고 부활했습니다!');
            } else if (this.storage.consumeInventoryItem('revive_feather')) {
              this.luna.posY = 0.5;
              this.luna.velocityY = 10.0;
              this.luna.state = CharacterState.JUMP;
              this.luna.setShieldActive(true);
              this.audio.playReviveFanfare();
              this.capacitor.vibrateHeavy();
              this.ui.showToast('🌟 [부활의 불사조 깃털] 치명상을 극복하고 부활했습니다!');
            } else {
              this.audio.playGameOver();
              this.capacitor.vibrateHeavy();
              this.luna.hitObstacle(true);
            }
          }
        } else {
          // Regular obstacle hit
          if (collision.type === ObstacleType.SKILL_BARRIER) {
            this.ui.showToast('💥 차원 결계를 돌파하려면 액티브 스킬을 발동해야 합니다!');
          }
          if (this.luna.hasShield) {
            this.luna.setShieldActive(false);
            this.audio.playShieldBreak();
            this.capacitor.vibrateLight();
            this.ui.showToast('🛡️ 달빛 보호막이 충돌을 방어했습니다!');
          } else if (this.upgradeManager.canRevive()) {
            this.upgradeManager.useRevive();
            this.luna.setShieldActive(true);
            this.audio.playShieldBreak();
            this.capacitor.vibrateHeavy();
            this.ui.showToast('🌟 달빛 부활! 충돌을 극복하고 보호막이 충전되었습니다!');
          } else if (this.storage.isVipMember() && !this.usedVipReviveThisRun) {
            this.usedVipReviveThisRun = true;
            this.luna.setShieldActive(true);
            this.audio.playShieldBreak();
            this.capacitor.vibrateHeavy();
            this.ui.showToast('👑 [VIP 무료 부활] 1회 무료 부활로 보호막이 충전되었습니다!');
          } else if (this.storage.consumeInventoryItem('revive_feather')) {
            this.luna.setShieldActive(true);
            this.audio.playShieldBreak();
            this.capacitor.vibrateHeavy();
            this.ui.showToast('🌟 [부활의 불사조 깃털] 보호막이 충전되어 회생했습니다!');
          } else {
            this.audio.playHit();
            this.audio.playGameOver();
            this.capacitor.vibrateHeavy();
            this.luna.hitObstacle(false);
          }
        }
      }

      // Instant pit fall boundary check
      if (this.luna.posY < -4.0) {
        if (this.upgradeManager.canRevive()) {
          this.upgradeManager.useRevive();
          this.luna.posY = 0.5;
          this.luna.velocityY = 10.0;
          this.luna.state = CharacterState.JUMP;
          this.luna.setShieldActive(true);
          this.audio.playShieldBreak();
          this.capacitor.vibrateHeavy();
          this.ui.showToast('🌟 달빛 부활! 심연에서 날아올랐습니다!');
        } else if (this.storage.isVipMember() && !this.usedVipReviveThisRun) {
          this.usedVipReviveThisRun = true;
          this.luna.posY = 0.5;
          this.luna.velocityY = 10.0;
          this.luna.state = CharacterState.JUMP;
          this.luna.setShieldActive(true);
          this.audio.playShieldBreak();
          this.capacitor.vibrateHeavy();
          this.ui.showToast('👑 [VIP 무료 부활] 심연에서 날아올랐습니다!');
        } else if (this.storage.consumeInventoryItem('revive_feather')) {
          this.luna.posY = 0.5;
          this.luna.velocityY = 10.0;
          this.luna.state = CharacterState.JUMP;
          this.luna.setShieldActive(true);
          this.audio.playShieldBreak();
          this.capacitor.vibrateHeavy();
          this.ui.showToast('🌟 [부활의 불사조 깃털] 심연에서 날아올랐습니다!');
        } else {
          this.audio.playGameOver();
          this.capacitor.vibrateHeavy();
          this.luna.hitObstacle(true);
        }
      }

      // 7. Dynamic 90-Degree Temple Run Turn Director & Camera Follower
      this.turnDirector.update(
        this.scoreSystem.distance,
        dt,
        true,
        speed,
        this.luna.mesh.position.z
      );

      if (this.turnDirector.phase === 'sideways') {
        this.luna.isTurningCorner = true;
        const cornerPos = this.turnDirector.getCornerPlayerPos(this.luna.targetLane * LANE_WIDTH);
        this.luna.mesh.position.x = cornerPos.x;
        this.luna.mesh.position.z = cornerPos.z;
        this.luna.mesh.rotation.y = cornerPos.rotationY; // Physical sideways turning!
        const dirSign = this.turnDirector.turnDirection === 'right' ? 1 : -1;
        this.luna.visualGroup.rotation.z = -dirSign * 0.20; // Dynamic athletic banking lean into the apex!

        const camT = this.turnDirector.getCornerCameraTransform(
          this.luna.mesh.position.x,
          this.luna.mesh.position.y,
          this.luna.mesh.position.z
        );
        this.cameraFollower.updateCornerCamera(camT.eye, camT.lookAt, dt);
      } else {
        this.luna.isTurningCorner = false;
        this.luna.mesh.rotation.y = 0;
        this.luna.cameraYaw = this.turnDirector.currentYaw;

        this.cameraFollower.update(
          this.luna.mesh.position,
          this.luna.state === CharacterState.JUMP || this.luna.state === CharacterState.FALL,
          this.luna.state === CharacterState.SLIDE,
          dt,
          this.turnDirector.currentYaw
        );
      }
      this.curveDirector.update(dt, true, 0);

      // 8. Update In-Game HUD
      const maxMagnetDur = this.magnetPotionActive
        ? Math.max(15, this.upgradeManager.getMagnetDuration() * 2)
        : this.upgradeManager.getMagnetDuration();
      const stageInfo = this.difficultyDirector.getStageInfo(this.difficultyDirector.currentStage);
      this.ui.updateHUD(
        this.scoreSystem.distance,
        this.scoreSystem.currentScore,
        this.scoreSystem.sessionCoins,
        this.luna.hasShield,
        this.luna.magnetTimeRemaining,
        maxMagnetDur,
        this.scoreSystem.feverGauge,
        this.scoreSystem.isFever,
        this.scoreSystem.comboCount,
        this.scoreSystem.comboMultiplier,
        `STAGE ${stageInfo.stage}: ${stageInfo.name}`,
        this.sessionChests,
        this.luna.skillCooldownRemaining,
        this.luna.currentCharacterId
      );
    }

    // Render Scene
    this.sceneManager.render();
  }

  // --- Rewarded Ad Revive Continue (Watch Ad to Continue - 1 per run) ---

  public showAdReviveModal(): void {
    this.isReviveModalShowing = true;
    this.input.setEnabled(false);
    this.ui.showReviveModal(
      this.scoreSystem.distance,
      this.scoreSystem.currentScore,
      () => this.watchAdAndRevive(),
      () => this.skipAdRevive()
    );
  }

  public skipAdRevive(): void {
    this.isReviveModalShowing = false;
    this.ui.hideReviveModal();
    this.stateManager.setState(GameState.GAME_OVER);
  }

  public watchAdAndRevive(): void {
    this.ui.hideReviveModal();
    this.ui.hideGameOverModal();

    if (this.adMob.isNativeAdSupported()) {
      this.adMob.showRewardedAd(
        () => {
          this.reviveFromAd();
        },
        () => {
          this.ui.showAdPlayerModal(() => {
            this.reviveFromAd();
          });
        }
      );
    } else {
      this.ui.showAdPlayerModal(() => {
        this.reviveFromAd();
      });
    }
  }

  public reviveFromAd(): void {
    if (this.usedAdReviveThisRun) return;
    this.usedAdReviveThisRun = true;
    this.isReviveModalShowing = false;
    this.ui.hideReviveModal();
    this.ui.hideAdPlayerModal();
    this.ui.hideGameOverModal();

    // If game over was already processed (e.g. revive from game over screen), revert duplicate additions
    if (this.isGameOverProcessed) {
      this.isGameOverProcessed = false;
      if (this.lastAddedCoins > 0) {
        this.storage.spendCoins(this.lastAddedCoins);
        this.lastAddedCoins = 0;
      }
      if (this.lastAddedChests > 0) {
        this.storage.spendMysteryChests(this.lastAddedChests);
        this.lastAddedChests = 0;
      }
    }

    // 1. Recover player position right where they died
    this.luna.posY = 0.5;
    this.luna.velocityY = 8.0; // Gentle recovery hop
    this.luna.isFallingIntoPit = false;
    this.luna.state = CharacterState.JUMP;
    this.luna.deathTimer = 0;
    this.luna.visualGroup.rotation.set(0, 0, 0);
    this.luna.visualGroup.position.set(0, 0, 0);
    this.luna.currentLane = this.luna.targetLane;
    if (this.turnDirector.phase !== 'sideways') {
      this.luna.mesh.position.x = this.luna.targetLane * LANE_WIDTH;
      this.luna.mesh.rotation.y = 0;
      this.luna.isTurningCorner = false;
    }

    // 2. Grant Invincibility Protective Shield (so player doesn't immediately crash again)
    this.luna.setShieldActive(true);

    // 3. Clear any hazardous obstacles in immediate vicinity (within 24m)
    for (const obs of this.trackManager.obstacles) {
      if (obs.active && !obs.cleared && Math.abs(obs.zPos - this.luna.mesh.position.z) < 24) {
        obs.cleared = true;
        if (obs.mesh) obs.mesh.visible = false;
      }
    }

    // 4. Reanchor camera follower
    this.cameraFollower.reanchorBehindPlayer(this.luna.mesh.position);

    // 5. Sound, Haptics & Notification
    this.audio.playReviveFanfare();
    this.capacitor.vibrateHeavy();
    this.ui.showToast('🌟 [광고 보상 이어하기] 죽은 자리에서 부활했습니다! (보호막 부여)');

    // 6. Resume running
    this.stateManager.setState(GameState.RUNNING);
    this.input.setEnabled(true);
  }
}
