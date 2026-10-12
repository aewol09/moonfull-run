import { GameState, GameStateManager } from '../core/GameState';
import { StorageManager, UPGRADE_MAX_LEVEL, GraphicsQuality } from '../core/StorageManager';
import { AudioManager } from '../core/AudioManager';

export interface UIEventListeners {
  onStartRun: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onQualityChange: (quality: GraphicsQuality) => void;
}

export class UIManager {
  private stateManager: GameStateManager;
  private storage: StorageManager;
  private audio: AudioManager;
  private listeners: UIEventListeners;

  constructor(
    stateManager: GameStateManager,
    storage: StorageManager,
    audio: AudioManager,
    listeners: UIEventListeners
  ) {
    this.stateManager = stateManager;
    this.storage = storage;
    this.audio = audio;
    this.listeners = listeners;

    this.bindEvents();
    this.updateWalletDisplays();
    this.initSettingsUI();
  }

  // --- Display Updates ---

  public updateWalletDisplays(): void {
    const coins = this.storage.getData().coins;
    const menuEl = document.getElementById('menu-coin-count');
    const shopEl = document.getElementById('shop-coin-count');
    if (menuEl) menuEl.textContent = coins.toLocaleString();
    if (shopEl) shopEl.textContent = coins.toLocaleString();
  }

  public updateHUD(
    distance: number,
    score: number,
    coins: number,
    hasShield: boolean,
    magnetTimeRemaining: number,
    maxMagnetDuration: number
  ): void {
    const distEl = document.getElementById('hud-dist-val');
    const scoreEl = document.getElementById('hud-score-val');
    const coinEl = document.getElementById('hud-coin-val');
    const shieldEl = document.getElementById('buff-shield');
    const magnetEl = document.getElementById('buff-magnet');
    const magnetGauge = document.getElementById('buff-magnet-gauge');

    if (distEl) distEl.textContent = Math.floor(distance).toString();
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (coinEl) coinEl.textContent = coins.toString();

    if (shieldEl) {
      if (hasShield) {
        shieldEl.classList.remove('hidden');
      } else {
        shieldEl.classList.add('hidden');
      }
    }

    if (magnetEl && magnetGauge) {
      if (magnetTimeRemaining > 0) {
        magnetEl.classList.remove('hidden');
        const pct = Math.max(0, Math.min(100, (magnetTimeRemaining / maxMagnetDuration) * 100));
        magnetGauge.style.width = `${pct}%`;
      } else {
        magnetEl.classList.add('hidden');
      }
    }
  }

  public showPauseModal(distance: number, score: number, coins: number): void {
    const distEl = document.getElementById('pause-dist');
    const scoreEl = document.getElementById('pause-score');
    const coinsEl = document.getElementById('pause-coins');
    const modal = document.getElementById('pause-modal');

    if (distEl) distEl.textContent = `${Math.floor(distance)}m`;
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (coinsEl) coinsEl.textContent = coins.toString();
    if (modal) modal.classList.remove('hidden');
  }

  public hidePauseModal(): void {
    const modal = document.getElementById('pause-modal');
    if (modal) modal.classList.add('hidden');
  }

  public showGameOverModal(result: {
    score: number;
    distance: number;
    coins: number;
    isNewScore: boolean;
    isNewDist: boolean;
  }): void {
    const modal = document.getElementById('gameover-modal');
    const scoreEl = document.getElementById('go-score');
    const distEl = document.getElementById('go-dist');
    const coinsEl = document.getElementById('go-coins');
    const bestScoreEl = document.getElementById('go-best-score');
    const bestDistEl = document.getElementById('go-best-dist');
    const badgeEl = document.getElementById('new-record-badge');

    const data = this.storage.getData();

    if (scoreEl) scoreEl.textContent = result.score.toLocaleString();
    if (distEl) distEl.textContent = `${result.distance.toLocaleString()} m`;
    if (coinsEl) coinsEl.textContent = result.coins.toLocaleString();
    if (bestScoreEl) bestScoreEl.textContent = data.highScore.toLocaleString();
    if (bestDistEl) bestDistEl.textContent = `${data.maxDistance.toLocaleString()} m`;

    if (badgeEl) {
      if (result.isNewScore || result.isNewDist) {
        badgeEl.classList.remove('hidden');
      } else {
        badgeEl.classList.add('hidden');
      }
    }

    if (modal) modal.classList.remove('hidden');
    this.updateWalletDisplays();
  }

  public hideGameOverModal(): void {
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.classList.add('hidden');
  }

  public switchScreen(state: GameState): void {
    const mainMenu = document.getElementById('main-menu');
    const hud = document.getElementById('game-hud');

    if (state === GameState.MAIN_MENU) {
      if (mainMenu) mainMenu.classList.add('active');
      if (hud) hud.classList.remove('active');
      this.hidePauseModal();
      this.hideGameOverModal();
      this.updateWalletDisplays();
    } else if (state === GameState.RUNNING || state === GameState.PAUSED) {
      if (mainMenu) mainMenu.classList.remove('active');
      if (hud) hud.classList.add('active');
    }
  }

  public showToast(message: string): void {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 2500);
  }

  // --- Modal & Shop Handling ---

  private updateShopCards(): void {
    const data = this.storage.getData();

    // Magnet
    const lvlMagnet = data.upgrades.magnet;
    const costMagnet = this.storage.getUpgradeCost('magnet');
    const lvlElM = document.getElementById('lvl-magnet');
    const barElM = document.getElementById('bar-magnet');
    const costElM = document.getElementById('cost-magnet');
    const btnBuyM = document.getElementById('btn-buy-magnet') as HTMLButtonElement;

    if (lvlElM) lvlElM.textContent = lvlMagnet >= UPGRADE_MAX_LEVEL ? 'MAX' : `Lv.${lvlMagnet}`;
    if (barElM) barElM.style.width = `${(lvlMagnet / UPGRADE_MAX_LEVEL) * 100}%`;
    if (costElM && btnBuyM) {
      if (costMagnet === null) {
        costElM.textContent = '최대';
        btnBuyM.disabled = true;
      } else {
        costElM.textContent = costMagnet.toString();
        btnBuyM.disabled = data.coins < costMagnet;
      }
    }

    // Shield
    const lvlShield = data.upgrades.shield;
    const costShield = this.storage.getUpgradeCost('shield');
    const lvlElS = document.getElementById('lvl-shield');
    const barElS = document.getElementById('bar-shield');
    const costElS = document.getElementById('cost-shield');
    const btnBuyS = document.getElementById('btn-buy-shield') as HTMLButtonElement;

    if (lvlElS) lvlElS.textContent = lvlShield >= UPGRADE_MAX_LEVEL ? 'MAX' : `Lv.${lvlShield}`;
    if (barElS) barElS.style.width = `${(lvlShield / UPGRADE_MAX_LEVEL) * 100}%`;
    if (costElS && btnBuyS) {
      if (costShield === null) {
        costElS.textContent = '최대';
        btnBuyS.disabled = true;
      } else {
        costElS.textContent = costShield.toString();
        btnBuyS.disabled = data.coins < costShield;
      }
    }

    // Head Start
    const lvlHead = data.upgrades.headStart;
    const costHead = this.storage.getUpgradeCost('headStart');
    const lvlElH = document.getElementById('lvl-headstart');
    const barElH = document.getElementById('bar-headstart');
    const costElH = document.getElementById('cost-headstart');
    const btnBuyH = document.getElementById('btn-buy-headstart') as HTMLButtonElement;

    if (lvlElH) lvlElH.textContent = lvlHead >= UPGRADE_MAX_LEVEL ? 'MAX' : `Lv.${lvlHead}`;
    if (barElH) barElH.style.width = `${(lvlHead / UPGRADE_MAX_LEVEL) * 100}%`;
    if (costElH && btnBuyH) {
      if (costHead === null) {
        costElH.textContent = '최대';
        btnBuyH.disabled = true;
      } else {
        costElH.textContent = costHead.toString();
        btnBuyH.disabled = data.coins < costHead;
      }
    }

    this.updateWalletDisplays();
  }

  private initSettingsUI(): void {
    const settings = this.storage.getData().settings;

    const bgmToggle = document.getElementById('toggle-bgm') as HTMLInputElement;
    const sfxToggle = document.getElementById('toggle-sfx') as HTMLInputElement;
    const vibToggle = document.getElementById('toggle-vibrate') as HTMLInputElement;

    if (bgmToggle) bgmToggle.checked = settings.bgm;
    if (sfxToggle) sfxToggle.checked = settings.sfx;
    if (vibToggle) vibToggle.checked = settings.vibration;

    document.querySelectorAll('.btn-quality').forEach(btn => {
      const q = btn.getAttribute('data-quality');
      if (q === settings.graphicsQuality) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private bindEvents(): void {
    // 1. Main Menu Buttons
    document.getElementById('btn-start-run')?.addEventListener('click', () => {
      this.audio.playClick();
      this.audio.startBgm();
      this.listeners.onStartRun();
    });

    document.getElementById('btn-open-shop')?.addEventListener('click', () => {
      this.audio.playClick();
      this.updateShopCards();
      document.getElementById('shop-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-shop')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('shop-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      this.audio.playClick();
      this.initSettingsUI();
      document.getElementById('settings-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('settings-modal')?.classList.add('hidden');
    });

    // 2. HUD Pause Button
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      this.audio.playClick();
      this.stateManager.setState(GameState.PAUSED);
    });

    // 3. Pause Modal Buttons
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.audio.playClick();
      this.listeners.onResume();
    });

    document.getElementById('btn-restart-pause')?.addEventListener('click', () => {
      this.audio.playClick();
      this.listeners.onRestart();
    });

    document.getElementById('btn-main-pause')?.addEventListener('click', () => {
      this.audio.playClick();
      this.listeners.onMainMenu();
    });

    // 4. Game Over Modal Buttons
    document.getElementById('btn-restart-go')?.addEventListener('click', () => {
      this.audio.playClick();
      this.listeners.onRestart();
    });

    document.getElementById('btn-main-go')?.addEventListener('click', () => {
      this.audio.playClick();
      this.listeners.onMainMenu();
    });

    // 5. Shop Upgrade Purchases
    document.getElementById('btn-buy-magnet')?.addEventListener('click', () => {
      if (this.storage.upgrade('magnet')) {
        this.audio.playCoin();
        this.showToast('코인 자석 업그레이드 완료!');
        this.updateShopCards();
      } else {
        this.showToast('코인이 부족합니다.');
      }
    });

    document.getElementById('btn-buy-shield')?.addEventListener('click', () => {
      if (this.storage.upgrade('shield')) {
        this.audio.playCoin();
        this.showToast('달빛 보호막 업그레이드 완료!');
        this.updateShopCards();
      } else {
        this.showToast('코인이 부족합니다.');
      }
    });

    document.getElementById('btn-buy-headstart')?.addEventListener('click', () => {
      if (this.storage.upgrade('headStart')) {
        this.audio.playCoin();
        this.showToast('시작 보너스 업그레이드 완료!');
        this.updateShopCards();
      } else {
        this.showToast('코인이 부족합니다.');
      }
    });

    // 6. Shop Tabs & Rewards
    document.getElementById('tab-upgrades')?.addEventListener('click', () => {
      document.getElementById('tab-upgrades')?.classList.add('active');
      document.getElementById('tab-rewards')?.classList.remove('active');
      document.getElementById('shop-content-upgrades')?.classList.add('active');
      document.getElementById('shop-content-rewards')?.classList.remove('active');
    });

    document.getElementById('tab-rewards')?.addEventListener('click', () => {
      document.getElementById('tab-rewards')?.classList.add('active');
      document.getElementById('tab-upgrades')?.classList.remove('active');
      document.getElementById('shop-content-rewards')?.classList.add('active');
      document.getElementById('shop-content-upgrades')?.classList.remove('active');
    });

    document.getElementById('btn-watch-ad')?.addEventListener('click', () => {
      this.audio.playClick();
      this.showToast('광고 시청 완료! +100 파편 지급');
      this.storage.addCoins(100);
      this.updateShopCards();
    });

    document.getElementById('btn-buy-starter')?.addEventListener('click', () => {
      this.audio.playCoin();
      this.showToast('루나 스타터 팩 획득! +1,000 파편 지급');
      this.storage.addCoins(1000);
      this.updateShopCards();
    });

    // 7. Settings Toggles
    document.getElementById('toggle-bgm')?.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      this.storage.updateSettings({ bgm: enabled });
      this.audio.setBgmEnabled(enabled);
    });

    document.getElementById('toggle-sfx')?.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      this.storage.updateSettings({ sfx: enabled });
      this.audio.setSfxEnabled(enabled);
    });

    document.getElementById('toggle-vibrate')?.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      this.storage.updateSettings({ vibration: enabled });
    });

    document.querySelectorAll('.btn-quality').forEach(btn => {
      btn.addEventListener('click', () => {
        const quality = btn.getAttribute('data-quality') as GraphicsQuality;
        document.querySelectorAll('.btn-quality').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.storage.updateSettings({ graphicsQuality: quality });
        this.listeners.onQualityChange(quality);
        this.showToast(`그래픽 품질이 [${quality.toUpperCase()}]로 변경되었습니다.`);
      });
    });

    document.getElementById('btn-reset-settings')?.addEventListener('click', () => {
      this.audio.playClick();
      this.storage.resetSettings();
      this.initSettingsUI();
      const settings = this.storage.getData().settings;
      this.audio.setBgmEnabled(settings.bgm);
      this.audio.setSfxEnabled(settings.sfx);
      this.listeners.onQualityChange(settings.graphicsQuality);
      this.showToast('설정이 기본값으로 초기화되었습니다.');
    });
  }
}
