import { GameState, GameStateManager } from '../core/GameState';
import { StorageManager, UPGRADE_MAX_LEVEL, GraphicsQuality, CHARACTERS, SHOP_ITEMS, CASH_SHOP_PACKAGES, CashShopPackage } from '../core/StorageManager';
import { AudioManager } from '../core/AudioManager';
import { COSTUME_PRESETS } from '../entities/LunaCharacter';

export interface UIEventListeners {
  onStartRun: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onQualityChange: (quality: GraphicsQuality) => void;
  onSelectCostume: (costumeId: string) => void;
  onSelectCharacter?: (charId: string) => void;
  onCostumeModalToggle?: (isOpen: boolean) => void;
  onTriggerSkill?: () => void;
  onWatchAdToContinue?: () => void;
  onSkipRevive?: () => void;
}

export class UIManager {
  private stateManager: GameStateManager;
  private storage: StorageManager;
  private audio: AudioManager;
  private listeners: UIEventListeners;
  private lastSessionChests = 0;
  private isChestOpening = false;
  private currentCostumeTabChar = 'luna';
  private activeShopTab: 'cash' | 'items' = 'items';
  private pendingBillingPackage: CashShopPackage | null = null;

  // Revive & Ad Simulation State
  private reviveCountdownTimer: any = null;
  private adSimulationTimer: any = null;
  private onWatchAdReviveCallback: (() => void) | null = null;
  private onSkipReviveCallback: (() => void) | null = null;
  private onAdCompleteCallback: (() => void) | null = null;

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

  public updateMenuDisplay(): void {
    this.updateWalletDisplays();
  }

  public updateWalletDisplays(): void {
    const data = this.storage.getData();
    const coins = data.coins;
    const chests = data.mysteryChests;
    const isVip = this.storage.isVipMember();

    const menuEl = document.getElementById('menu-coin-count');
    const menuChestEl = document.getElementById('menu-chest-count');
    const growthEl = document.getElementById('growth-coin-count');
    const shopEl = document.getElementById('shop-coin-count');
    const costumeEl = document.getElementById('costume-coin-count');
    const gachaEl = document.getElementById('gacha-coin-count');

    const menuVipEl = document.getElementById('menu-vip-badge');
    const shopVipEl = document.getElementById('shop-vip-badge');

    if (menuEl) menuEl.textContent = coins.toLocaleString();
    if (menuChestEl) menuChestEl.textContent = chests.toString();
    if (growthEl) growthEl.textContent = coins.toLocaleString();
    if (shopEl) shopEl.textContent = coins.toLocaleString();
    if (costumeEl) costumeEl.textContent = coins.toLocaleString();
    if (gachaEl) gachaEl.textContent = coins.toLocaleString();

    if (menuVipEl) {
      if (isVip) menuVipEl.classList.remove('hidden');
      else menuVipEl.classList.add('hidden');
    }
    if (shopVipEl) {
      if (isVip) shopVipEl.classList.remove('hidden');
      else shopVipEl.classList.add('hidden');
    }
  }

  public updateHUD(
    distance: number,
    score: number,
    coins: number,
    hasShield: boolean,
    magnetTimeRemaining: number,
    maxMagnetDuration: number,
    feverGauge = 0,
    isFever = false,
    comboCount = 0,
    comboMultiplier = 1.0,
    stageName = '',
    sessionChests = 0,
    skillCooldown = 0,
    charId = 'luna'
  ): void {
    const distEl = document.getElementById('hud-dist-val');
    const scoreEl = document.getElementById('hud-score-val');
    const coinEl = document.getElementById('hud-coin-val');
    const chestEl = document.getElementById('hud-chest-val');
    const shieldEl = document.getElementById('buff-shield');
    const magnetEl = document.getElementById('buff-magnet');
    const magnetGauge = document.getElementById('buff-magnet-gauge');
    const feverFill = document.getElementById('hud-fever-fill');
    const feverPct = document.getElementById('hud-fever-pct');
    const feverTitle = document.getElementById('hud-fever-title');
    const comboBadge = document.getElementById('hud-combo-badge');
    const comboText = document.getElementById('hud-combo-text');
    const stageBanner = document.getElementById('hud-stage-banner');
    const skillIcon = document.getElementById('hud-skill-icon') as HTMLImageElement;
    const skillOverlay = document.getElementById('hud-skill-cooldown-overlay');
    const skillSec = document.getElementById('hud-skill-cooldown-sec');
    const skillLabel = document.getElementById('hud-skill-label');

    if (distEl) distEl.textContent = Math.floor(distance).toString();
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (coinEl) coinEl.textContent = coins.toString();
    if (chestEl) {
      chestEl.textContent = sessionChests.toString();
      const chestBadge = chestEl.closest('.chest-badge');
      if (chestBadge) {
        if (sessionChests > 0) {
          chestBadge.classList.remove('hidden');
        } else {
          chestBadge.classList.add('hidden');
        }
      }
    }

    // Skill Button HUD Cooldown & Icon
    const charDef = CHARACTERS[charId] || CHARACTERS.luna;
    if (skillIcon && charDef) {
      if (!skillIcon.src.endsWith(charDef.iconUrl)) {
        skillIcon.src = charDef.iconUrl;
      }
    }
    if (skillLabel && charDef) {
      skillLabel.textContent = `${charDef.skillName.split(' ')[0]} [E]`;
    }
    if (skillOverlay && skillSec) {
      if (skillCooldown > 0) {
        skillOverlay.classList.remove('hidden');
        skillSec.textContent = Math.ceil(skillCooldown).toString();
      } else {
        skillOverlay.classList.add('hidden');
      }
    }

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

    // Fever Mode Bar
    if (feverFill && feverPct) {
      feverFill.style.width = `${Math.min(100, Math.max(0, feverGauge))}%`;
      feverPct.textContent = isFever ? 'MAX' : `${Math.floor(feverGauge)}%`;
      if (feverTitle) {
        feverTitle.textContent = isFever ? '🔥 FEVER' : 'FEVER';
      }
    }

    // Near-Miss Combo Badge
    if (comboBadge && comboText) {
      if (comboCount >= 2) {
        comboBadge.classList.remove('hidden');
        comboText.textContent = `⚡ ${comboCount} COMBO`;
      } else {
        comboBadge.classList.add('hidden');
      }
    }

    // Stage Banner
    if (stageBanner && stageName) {
      stageBanner.textContent = stageName;
      stageBanner.classList.remove('hidden');
    }
  }

  public showPauseModal(distance: number, score: number, coins: number, sessionChests = 0): void {
    const distEl = document.getElementById('pause-dist');
    const scoreEl = document.getElementById('pause-score');
    const coinsEl = document.getElementById('pause-coins');
    const chestsEl = document.getElementById('pause-chests');
    const modal = document.getElementById('pause-modal');

    if (distEl) distEl.textContent = `${Math.floor(distance)}m`;
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (coinsEl) coinsEl.textContent = coins.toString();
    if (chestsEl) chestsEl.textContent = sessionChests.toString();
    if (modal) modal.classList.remove('hidden');
  }

  public hidePauseModal(): void {
    const modal = document.getElementById('pause-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --- Watch Ad to Continue / Revive Modal ---

  public showReviveModal(
    distance: number,
    score: number,
    onWatchAd: () => void,
    onSkip: () => void
  ): void {
    const modal = document.getElementById('revive-modal');
    const distEl = document.getElementById('revive-dist');
    const scoreEl = document.getElementById('revive-score');
    const timerBar = document.getElementById('revive-timer-bar');
    const timerText = document.getElementById('revive-timer-text');

    if (distEl) distEl.textContent = `${Math.floor(distance).toLocaleString()} m`;
    if (scoreEl) scoreEl.textContent = Math.floor(score).toLocaleString();

    this.onWatchAdReviveCallback = onWatchAd;
    this.onSkipReviveCallback = onSkip;

    // 5-second countdown timer
    let remaining = 5.0;
    if (timerBar) timerBar.style.width = '100%';
    if (timerText) timerText.textContent = '5초 후 자동 종료';

    if (this.reviveCountdownTimer) {
      clearInterval(this.reviveCountdownTimer);
      this.reviveCountdownTimer = null;
    }

    this.reviveCountdownTimer = setInterval(() => {
      remaining -= 0.1;
      if (timerBar) {
        const pct = Math.max(0, (remaining / 5.0) * 100);
        timerBar.style.width = `${pct}%`;
      }
      if (timerText) {
        timerText.textContent = `${Math.max(1, Math.ceil(remaining))}초 후 자동 종료`;
      }

      if (remaining <= 0) {
        this.hideReviveModal();
        if (this.onSkipReviveCallback) {
          const skip = this.onSkipReviveCallback;
          this.onSkipReviveCallback = null;
          skip();
        }
      }
    }, 100);

    if (modal) modal.classList.remove('hidden');
  }

  public hideReviveModal(): void {
    if (this.reviveCountdownTimer) {
      clearInterval(this.reviveCountdownTimer);
      this.reviveCountdownTimer = null;
    }
    const modal = document.getElementById('revive-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --- Simulated Rewarded Video Ad Modal ---

  public showAdPlayerModal(onComplete: () => void): void {
    const modal = document.getElementById('ad-player-modal');
    const countdownBadge = document.getElementById('ad-countdown-badge');
    const progressFill = document.getElementById('ad-progress-fill');
    const claimBtn = document.getElementById('btn-claim-ad-reward');

    this.onAdCompleteCallback = onComplete;

    if (countdownBadge) countdownBadge.textContent = '광고 시청 중... 3초';
    if (progressFill) progressFill.style.width = '0%';
    if (claimBtn) claimBtn.classList.add('hidden');

    if (this.adSimulationTimer) {
      clearInterval(this.adSimulationTimer);
      this.adSimulationTimer = null;
    }

    let remaining = 3.0;
    this.adSimulationTimer = setInterval(() => {
      remaining -= 0.1;
      if (progressFill) {
        const pct = Math.min(100, Math.max(0, ((3.0 - remaining) / 3.0) * 100));
        progressFill.style.width = `${pct}%`;
      }
      if (countdownBadge) {
        if (remaining > 0) {
          countdownBadge.textContent = `광고 시청 중... ${Math.ceil(remaining)}초`;
        } else {
          countdownBadge.textContent = '🎉 광고 시청 완료!';
        }
      }

      if (remaining <= 0) {
        if (this.adSimulationTimer) {
          clearInterval(this.adSimulationTimer);
          this.adSimulationTimer = null;
        }
        if (claimBtn) claimBtn.classList.remove('hidden');

        // Automatically trigger reward claim after short delay if not clicked
        setTimeout(() => {
          if (modal && !modal.classList.contains('hidden') && this.onAdCompleteCallback) {
            this.hideAdPlayerModal();
            const cb = this.onAdCompleteCallback;
            this.onAdCompleteCallback = null;
            cb();
          }
        }, 600);
      }
    }, 100);

    if (modal) modal.classList.remove('hidden');
  }

  public hideAdPlayerModal(): void {
    if (this.adSimulationTimer) {
      clearInterval(this.adSimulationTimer);
      this.adSimulationTimer = null;
    }
    const modal = document.getElementById('ad-player-modal');
    if (modal) modal.classList.add('hidden');
    const claimBtn = document.getElementById('btn-claim-ad-reward');
    if (claimBtn) claimBtn.classList.add('hidden');
  }

  public showGameOverModal(result: {
    score: number;
    distance: number;
    coins: number;
    isNewScore: boolean;
    isNewDist: boolean;
  }, sessionChests = 0, canAdRevive = false): void {
    const modal = document.getElementById('gameover-modal');
    const scoreEl = document.getElementById('go-score');
    const distEl = document.getElementById('go-dist');
    const coinsEl = document.getElementById('go-coins');
    const chestsEl = document.getElementById('go-chests');
    const bestScoreEl = document.getElementById('go-best-score');
    const bestDistEl = document.getElementById('go-best-dist');
    const badgeEl = document.getElementById('new-record-badge');
    const btnOpenChests = document.getElementById('btn-open-chests-go') as HTMLButtonElement;
    const btnAdReviveGo = document.getElementById('btn-ad-revive-go') as HTMLButtonElement;

    this.lastSessionChests = sessionChests;
    const data = this.storage.getData();

    if (scoreEl) scoreEl.textContent = result.score.toLocaleString();
    if (distEl) distEl.textContent = `${result.distance.toLocaleString()} m`;
    if (coinsEl) coinsEl.textContent = result.coins.toLocaleString();
    if (chestsEl) chestsEl.textContent = `획득 ${sessionChests}개 (보유: ${data.mysteryChests}개)`;
    if (bestScoreEl) bestScoreEl.textContent = data.highScore.toLocaleString();
    if (bestDistEl) bestDistEl.textContent = `${data.maxDistance.toLocaleString()} m`;

    if (badgeEl) {
      if (result.isNewScore || result.isNewDist) {
        badgeEl.classList.remove('hidden');
      } else {
        badgeEl.classList.add('hidden');
      }
    }

    if (btnOpenChests) {
      if (data.mysteryChests > 0) {
        btnOpenChests.classList.remove('hidden');
        btnOpenChests.textContent = `📦 보물상자 개봉 (${data.mysteryChests}개 보유)`;
      } else {
        btnOpenChests.classList.add('hidden');
      }
    }

    if (btnAdReviveGo) {
      if (canAdRevive) {
        btnAdReviveGo.classList.remove('hidden');
      } else {
        btnAdReviveGo.classList.add('hidden');
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
      if (state === GameState.RUNNING) {
        this.hideGameOverModal();
        this.hidePauseModal();
      }
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

  // --- Streamlined Hero & Costume UI (Organized 2-Tier Selector) ---
  private selectedHeroId = 'luna';

  public updateHeroAndCostumesUI(charId?: string): void {
    const data = this.storage.getData();
    if (charId) {
      this.selectedHeroId = charId;
    } else {
      this.selectedHeroId = data.currentCharacter || 'luna';
    }

    const heroBar = document.getElementById('hero-selector-bar');
    const detailBanner = document.getElementById('hero-detail-banner');
    const costumeList = document.getElementById('costume-list');

    const charThumbMap: Record<string, string> = {
      luna: '/assets/luna_front.png',
      solaris: '/assets/solaris_front.png',
      nyx: '/assets/nyx_front.png',
      stella: '/assets/stella_front.png'
    };

    // 1. Populate Hero Selector Bar (Luna, Solaris, Nyx, Stella)
    if (heroBar) {
      heroBar.innerHTML = '';

      Object.values(CHARACTERS).forEach(charDef => {
        const isCurrentActive = this.selectedHeroId === charDef.id;
        const isEquippedHero = data.currentCharacter === charDef.id;
        const chip = document.createElement('div');
        chip.className = `hero-chip ${isCurrentActive ? 'active' : ''}`;
        chip.innerHTML = `
          <img src="${charThumbMap[charDef.id] || '/assets/luna_front.png'}" alt="${charDef.name}" class="hero-chip-avatar" />
          <span class="hero-chip-name">${charDef.name}</span>
          ${isEquippedHero ? '<span style="font-size: 9px; color: #22c55e; font-weight: 800;">[출전]</span>' : ''}
        `;

        chip.addEventListener('click', () => {
          this.audio.playClick();
          this.selectedHeroId = charDef.id;
          this.updateHeroAndCostumesUI(charDef.id);
        });

        heroBar.appendChild(chip);
      });
    }

    // 2. Populate Hero Detail Banner
    const charDef = CHARACTERS[this.selectedHeroId] || CHARACTERS.luna;
    const isUnlocked = this.storage.isCharacterUnlocked(charDef.id);
    const isEquippedHero = data.currentCharacter === charDef.id;
    const skillLvl = this.storage.getCharacterSkillLevel(charDef.id);

    if (detailBanner) {
      detailBanner.innerHTML = `
        <div class="hero-detail-left">
          <div class="hero-detail-title-row">
            <span class="hero-detail-name">${charDef.name}</span>
            <span class="badge-tag">${charDef.title}</span>
          </div>
          <div class="hero-detail-skill clickable-skill" id="btn-hero-skill-info" title="영웅 스킬 설명 보기">
            ⚡ ${charDef.skillName.split('(')[0].trim()} · Lv.${skillLvl}
            <span class="skill-info-badge">🔍 스킬 설명</span>
          </div>
        </div>
        <button class="btn ${isEquippedHero ? 'btn-secondary' : isUnlocked ? 'btn-primary' : 'btn-gold'} btn-hero-action" id="btn-select-hero-action">
          ${isEquippedHero ? '출전 중' : isUnlocked ? '출전하기' : `🌙 ${charDef.cost}`}
        </button>
      `;

      // Skill Info Popup Event
      const skillBtn = document.getElementById('btn-hero-skill-info');
      skillBtn?.addEventListener('click', () => {
        this.audio.playClick();
        this.openSkillDetailModal(charDef.id);
      });

      const actionBtn = document.getElementById('btn-select-hero-action');
      actionBtn?.addEventListener('click', () => {
        this.audio.playClick();
        if (isEquippedHero) return;
        if (isUnlocked) {
          this.storage.selectCharacter(charDef.id);
          this.listeners.onSelectCharacter?.(charDef.id);
          const equipped = this.storage.getEquippedCostume(charDef.id);
          this.listeners.onSelectCostume(equipped);
          this.showToast(`✨ [${charDef.name}] 출전!`);
          this.updateHeroAndCostumesUI(charDef.id);
          this.updateWalletDisplays();
        } else {
          if (this.storage.unlockCharacter(charDef.id, charDef.cost)) {
            this.storage.selectCharacter(charDef.id);
            this.listeners.onSelectCharacter?.(charDef.id);
            const equipped = this.storage.getEquippedCostume(charDef.id);
            this.listeners.onSelectCostume(equipped);
            this.audio.playCoin();
            this.showToast(`✨ [${charDef.name}] 해금 완료!`);
            this.updateHeroAndCostumesUI(charDef.id);
            this.updateWalletDisplays();
          } else {
            this.showToast('달의 파편이 부족합니다.');
          }
        }
      });
    }

    // 3. Populate Hero's Specific Costumes Grid (3 Costumes per hero)
    if (costumeList) {
      costumeList.innerHTML = '';
      const isHeroUnlocked = this.storage.isCharacterUnlocked(this.selectedHeroId);
      const equippedCostume = this.storage.getEquippedCostume(this.selectedHeroId);
      const costumes = this.storage.getCostumesForCharacter(this.selectedHeroId);

      costumes.forEach(costume => {
        const isCostumeUnlocked = this.storage.isCostumeUnlocked(costume.id);
        const isCostumeEquipped = equippedCostume === costume.id;

        const card = document.createElement('div');
        card.className = `costume-card-item ${isCostumeEquipped ? 'equipped' : ''}`;

        let btnText = '';
        let btnClass = '';
        if (isCostumeEquipped) {
          btnText = '착용 중';
          btnClass = 'btn-secondary';
        } else if (isCostumeUnlocked) {
          btnText = '착용';
          btnClass = 'btn-primary';
        } else if (!isHeroUnlocked) {
          btnText = '🔒 캐릭터 필요';
          btnClass = 'btn-locked';
        } else {
          btnText = `🌙 ${costume.cost}`;
          btnClass = 'btn-gold';
        }

        card.innerHTML = `
          <img src="${costume.previewImage}" alt="${costume.name}" class="costume-card-img" />
          <div class="costume-card-name">${costume.name}</div>
          <button class="btn btn-costume-action ${btnClass}">
            ${btnText}
          </button>
        `;

        // 3D Preview on card click (temporary preview inside modal only)
        card.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'BUTTON' || target.closest('button')) return;
          this.listeners.onSelectCostume(costume.id);
        });

        // Equip / Buy action
        const btn = card.querySelector('button') as HTMLButtonElement;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.audio.playClick();
          if (isCostumeEquipped) return;
          if (isCostumeUnlocked) {
            this.storage.equipCostume(costume.id, this.selectedHeroId);
            this.listeners.onSelectCostume(costume.id);
            this.showToast(`[${costume.name}] 의상을 착용했습니다.`);
            this.updateHeroAndCostumesUI(this.selectedHeroId);
          } else {
            // Require character ownership before skin purchase!
            if (!this.storage.isCharacterUnlocked(this.selectedHeroId)) {
              this.audio.playHit();
              this.showToast(`⚠️ [${charDef.name}] 캐릭터를 먼저 구매해야 스킨을 구매할 수 있습니다!`);
              return;
            }

            if (this.storage.unlockCostume(costume.id, costume.cost)) {
              this.storage.equipCostume(costume.id, this.selectedHeroId);
              this.listeners.onSelectCostume(costume.id);
              this.audio.playCoin();
              this.showToast(`✨ [${costume.name}] 의상 해금 및 착용 완료!`);
              this.updateHeroAndCostumesUI(this.selectedHeroId);
              this.updateWalletDisplays();
            } else {
              this.showToast('달의 파편이 부족합니다.');
            }
          }
        });

        costumeList.appendChild(card);
      });
    }

    this.updateWalletDisplays();
  }

  public updateCostumeList(forCharId?: string): void {
    this.updateHeroAndCostumesUI(forCharId);
  }

  public updateCharacterRoster(): void {
    this.updateHeroAndCostumesUI();
  }

  // --- Moonlight Shop & Premium Cash Shop Rendering ---
  public updateShopModal(): void {
    const cashPane = document.getElementById('cash-shop-tab-pane');
    const itemPane = document.getElementById('item-shop-tab-pane');
    const tabBtnCash = document.getElementById('tab-btn-cash-shop');
    const tabBtnItem = document.getElementById('tab-btn-item-shop');

    if (this.activeShopTab === 'cash') {
      cashPane?.classList.remove('hidden');
      itemPane?.classList.add('hidden');
      tabBtnCash?.classList.add('active');
      tabBtnItem?.classList.remove('active');
      this.updateCashShopPackages();
    } else {
      cashPane?.classList.add('hidden');
      itemPane?.classList.remove('hidden');
      tabBtnCash?.classList.remove('active');
      tabBtnItem?.classList.add('active');
      this.updateShopItems();
    }

    this.updateWalletDisplays();
  }

  public updateCashShopPackages(): void {
    const container = document.getElementById('cash-packages-container');
    if (!container) return;
    container.innerHTML = '';

    const data = this.storage.getData();

    CASH_SHOP_PACKAGES.forEach(pkg => {
      const card = document.createElement('div');
      card.className = 'cash-pkg-card';

      const isVipOwned = pkg.id === 'vip_unlimited' && data.isVipMember;
      const rewardsHtml = pkg.rewardsSummary
        .map(r => `<li class="cash-reward-li"><span class="chk">✓</span> ${r}</li>`)
        .join('');

      card.innerHTML = `
        <div class="cash-pkg-top-row">
          <span class="cash-pkg-badge">${pkg.badge}</span>
          <span class="cash-pkg-icon">${pkg.icon}</span>
        </div>
        <div class="cash-pkg-name">${pkg.name}</div>
        <div class="cash-pkg-desc">${pkg.description}</div>
        <ul class="cash-pkg-rewards">
          ${rewardsHtml}
        </ul>
        <div class="cash-pkg-action">
          <button class="btn-cash-buy ${isVipOwned ? 'btn-owned' : ''}" data-pkg="${pkg.id}" ${isVipOwned ? 'disabled' : ''}>
            ${isVipOwned ? '👑 VIP 회원 보유 중' : `${pkg.formattedPrice} 결제`}
          </button>
        </div>
      `;

      const btn = card.querySelector('.btn-cash-buy') as HTMLButtonElement;
      if (!isVipOwned) {
        btn.addEventListener('click', () => {
          this.audio.playClick();
          this.openBillingModal(pkg);
        });
      }

      container.appendChild(card);
    });
  }

  public openBillingModal(pkg: CashShopPackage): void {
    this.pendingBillingPackage = pkg;
    const modal = document.getElementById('cash-billing-modal');
    const iconEl = document.getElementById('billing-pkg-icon');
    const nameEl = document.getElementById('billing-pkg-name');
    const descEl = document.getElementById('billing-pkg-desc');
    const rewardsEl = document.getElementById('billing-rewards-list');
    const priceEl = document.getElementById('billing-price-val');

    if (iconEl) iconEl.textContent = pkg.icon;
    if (nameEl) nameEl.textContent = pkg.name;
    if (descEl) descEl.textContent = pkg.description;
    if (priceEl) priceEl.textContent = pkg.formattedPrice;
    if (rewardsEl) {
      rewardsEl.innerHTML = pkg.rewardsSummary
        .map(r => `<div class="billing-reward-item">✓ ${r}</div>`)
        .join('');
    }

    if (modal) modal.classList.remove('hidden');
  }

  public confirmBillingPurchase(): void {
    if (!this.pendingBillingPackage) return;
    const pkg = this.pendingBillingPackage;
    this.pendingBillingPackage = null;

    const res = this.storage.buyCashPackage(pkg.id);
    const modal = document.getElementById('cash-billing-modal');
    if (modal) modal.classList.add('hidden');

    if (res.success) {
      this.audio.playCoin();
      this.audio.playShieldBreak();
      if (this.storage.getData().settings.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
      this.showToast(`💎 [${pkg.name}] 결제 완료! 모든 보상이 즉시 지급되었습니다!`);
      this.updateShopModal();
      this.updateWalletDisplays();
      this.updateCharacterRoster();
    } else {
      this.showToast('결제 처리에 실패했습니다.');
    }
  }

  // --- Moonlight Shop Consumable Items Rendering ---
  public updateShopItems(): void {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    container.innerHTML = '';

    const data = this.storage.getData();

    SHOP_ITEMS.forEach(item => {
      const owned = item.category === 'chest' ? data.mysteryChests : this.storage.getInventoryCount(item.id);
      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.innerHTML = `
        <div class="shop-item-header">
          <span class="shop-item-icon">${item.icon}</span>
          <span class="shop-item-stock">보유: ${owned}개</span>
        </div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.description}</div>
        <button class="btn-shop-buy" data-item="${item.id}">
          <span class="shard-icon">🌙</span> ${item.cost} 구매
        </button>
      `;

      const btn = card.querySelector('.btn-shop-buy') as HTMLButtonElement;
      btn.addEventListener('click', () => {
        this.audio.playClick();
        if (this.storage.buyShopItem(item.id)) {
          this.audio.playCoin();
          this.showToast(`✨ [${item.name}] 구매 완료!`);
          this.updateShopItems();
          this.updateWalletDisplays();
        } else {
          this.showToast('달의 파편이 부족합니다.');
        }
      });

      container.appendChild(card);
    });

    this.updateWalletDisplays();
  }

  // --- Starlight Gacha Summon Handling with Grade-Specific Motion & Skip ---
  public performGachaPull(pulls: 1 | 10): void {
    const cost = pulls === 10 ? 4500 : 500;
    const currentCoins = this.storage.getData().coins;
    if (currentCoins < cost) {
      this.showToast('달의 파편이 부족합니다.');
      return;
    }

    const results = this.storage.performGacha(pulls);
    if (!results) {
      this.showToast('달의 파편이 부족합니다.');
      return;
    }

    // Calculate highest rarity
    const hasSSR = results.some(r => r.rarity === 'SSR');
    const hasSR = results.some(r => r.rarity === 'SR');
    const highestRarity: 'SSR' | 'SR' | 'R' = hasSSR ? 'SSR' : (hasSR ? 'SR' : 'R');

    // Show Grade-Specific Gacha Summon Motion Animation
    const summonModal = document.getElementById('gacha-summon-modal');
    const summonStage = document.getElementById('gacha-summon-stage');
    const rarityBadge = document.getElementById('gacha-portal-rarity-badge');
    const portalTitle = document.getElementById('gacha-portal-title');
    const portalSub = document.getElementById('gacha-portal-sub');

    if (summonStage) {
      summonStage.className = `gacha-summon-stage portal-grade-${highestRarity.toLowerCase()}`;
    }
    if (rarityBadge) {
      rarityBadge.textContent = highestRarity === 'SSR' ? '🌟 SSR 전설' : (highestRarity === 'SR' ? '🔮 SR 희귀' : '✨ R 일반');
    }
    if (portalTitle) {
      portalTitle.textContent = highestRarity === 'SSR'
        ? '🌟 황금빛 초신성 강림 (SSR 전설)!!!'
        : (highestRarity === 'SR' ? '🌌 심연의 성좌 공명 (SR 희귀)' : '✨ 고요한 별빛의 소환 (R 일반)');
    }
    if (portalSub) {
      portalSub.textContent = highestRarity === 'SSR'
        ? '천지가 개벽하며 신화 속 위대한 영웅과 전설의 비기가 강림합니다!'
        : (highestRarity === 'SR' ? '차원의 결계가 흔들리며 영웅의 비급이 응축됩니다!' : '달빛 하늘의 유성이 떨어져 은은한 기운이 깃듭니다.');
    }

    if (summonModal) summonModal.classList.remove('hidden');
    this.audio.playGachaPortal();

    let isSkipped = false;
    let timerId: number | null = null;

    const finishSummon = () => {
      if (isSkipped) return;
      isSkipped = true;
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      if (summonModal) summonModal.classList.add('hidden');

      if (hasSSR) {
        this.audio.playChestFanfare(true);
      } else if (hasSR) {
        this.audio.playChestFanfare(false);
      } else {
        this.audio.playCoin();
      }
      this.updateWalletDisplays();

      const container = document.getElementById('gacha-results-container');
      const grid = document.getElementById('gacha-results-grid');
      if (container && grid) {
        container.classList.remove('hidden');
        grid.innerHTML = '';

        results.forEach(res => {
          const card = document.createElement('div');
          card.className = `gacha-result-card rarity-${res.rarity.toLowerCase()}`;
          card.innerHTML = `
            <img src="${res.icon}" alt="${res.name}" class="gacha-res-icon" />
            <div class="gacha-res-name">${res.name}</div>
            <div class="gacha-res-desc">${res.detail}</div>
          `;
          grid.appendChild(card);
        });
      }

      this.showToast(`✨ 별빛 소환 완료! ${pulls}개의 보상을 획득했습니다.`);
    };

    const btnSkip = document.getElementById('btn-skip-gacha');
    if (btnSkip) {
      btnSkip.onclick = () => {
        this.audio.playClick();
        finishSummon();
      };
    }

    timerId = window.setTimeout(() => {
      finishSummon();
    }, 3000);
  }

  // --- Mystery Chest Modal Initial Idle View & Animated Flow ---
  public showChestModal(): void {
    const modal = document.getElementById('chest-open-modal');
    const animBox = document.getElementById('chest-anim-box');
    const spriteImg = document.getElementById('chest-sprite-img') as HTMLImageElement;
    const haloRays = document.getElementById('chest-halo-rays');
    const rewardCard = document.getElementById('chest-reward-card');
    const countEl = document.getElementById('chest-modal-count');
    const btnNext = document.getElementById('btn-chest-open-next') as HTMLButtonElement;

    if (modal) modal.classList.remove('hidden');
    if (haloRays) haloRays.classList.add('hidden');
    if (rewardCard) rewardCard.classList.add('hidden');
    if (animBox) {
      animBox.classList.remove('shake');
      animBox.classList.remove('burst');
    }
    if (spriteImg) spriteImg.src = '/assets/chest_mystery.png';

    const remaining = this.storage.getData().mysteryChests;
    if (countEl) countEl.textContent = remaining.toString();

    if (btnNext) {
      if (remaining > 0) {
        btnNext.disabled = false;
        btnNext.textContent = `📦 상자 개봉하기 (남은 상자: ${remaining}개)`;
      } else {
        btnNext.disabled = true;
        btnNext.textContent = '완료 (모든 상자 개봉됨)';
      }
    }
  }

  // --- Mystery Chest Opening Animated Flow ---
  public openChestAnimated(): void {
    if (this.isChestOpening) return;
    const data = this.storage.getData();
    if (data.mysteryChests <= 0) {
      this.showToast('개봉할 보물상자가 없습니다.');
      const btnOpenGo = document.getElementById('btn-open-chests-go');
      if (btnOpenGo) btnOpenGo.classList.add('hidden');
      return;
    }

    const modal = document.getElementById('chest-open-modal');
    const animBox = document.getElementById('chest-anim-box');
    const spriteImg = document.getElementById('chest-sprite-img') as HTMLImageElement;
    const haloRays = document.getElementById('chest-halo-rays');
    const rewardCard = document.getElementById('chest-reward-card');
    const rewardIcon = document.getElementById('chest-reward-icon');
    const rewardTitle = document.getElementById('chest-reward-title');
    const rewardDesc = document.getElementById('chest-reward-desc');
    const countEl = document.getElementById('chest-modal-count');
    const btnNext = document.getElementById('btn-chest-open-next') as HTMLButtonElement;

    if (modal) modal.classList.remove('hidden');

    this.isChestOpening = true;
    if (haloRays) haloRays.classList.add('hidden');
    if (rewardCard) rewardCard.classList.add('hidden');
    if (spriteImg) spriteImg.src = '/assets/chest_mystery.png';
    if (animBox) {
      animBox.classList.remove('burst');
      animBox.classList.add('shake');
    }

    if (btnNext) {
      btnNext.disabled = true;
      btnNext.textContent = '개봉 중...';
    }

    this.audio.playShieldBreak();

    setTimeout(() => {
      const reward = this.storage.openMysteryChest();
      this.isChestOpening = false;

      if (!reward) {
        if (animBox) animBox.classList.remove('shake');
        return;
      }

      this.audio.playChestFanfare(reward.type === 'jackpot');

      if (animBox) {
        animBox.classList.remove('shake');
        animBox.classList.add('burst');
      }
      if (spriteImg) spriteImg.src = '/assets/chest_open.png';
      if (haloRays) haloRays.classList.remove('hidden');

      if (rewardCard && rewardIcon && rewardTitle && rewardDesc) {
        if (reward.type === 'shards') {
          rewardIcon.textContent = '🌙';
          rewardTitle.textContent = '달의 파편 획득!';
          rewardDesc.textContent = `달의 파편 +${reward.amount}개를 획득했습니다.`;
        } else if (reward.type === 'skill') {
          rewardIcon.textContent = '✨';
          rewardTitle.textContent = '스킬 레벨 UP!';
          rewardDesc.textContent = reward.label;
        } else {
          rewardIcon.textContent = '💎';
          rewardTitle.textContent = '대박 보물 발견!';
          rewardDesc.textContent = `달의 파편 +${reward.amount}개 대량 획득!`;
        }
        rewardCard.classList.remove('hidden');
      }

      this.updateWalletDisplays();

      const remaining = this.storage.getData().mysteryChests;
      if (countEl) countEl.textContent = remaining.toString();

      // Update Game Over display in real time!
      const goChestsEl = document.getElementById('go-chests');
      if (goChestsEl) {
        goChestsEl.textContent = `획득 ${this.lastSessionChests}개 (보유: ${remaining}개)`;
      }

      const btnOpenGo = document.getElementById('btn-open-chests-go') as HTMLButtonElement;
      if (btnOpenGo) {
        if (remaining > 0) {
          btnOpenGo.classList.remove('hidden');
          btnOpenGo.textContent = `📦 보물상자 개봉 (${remaining}개 보유)`;
        } else {
          btnOpenGo.classList.add('hidden');
        }
      }

      if (btnNext) {
        if (remaining > 0) {
          btnNext.disabled = false;
          btnNext.textContent = `📦 한 번 더 열기 (남은 상자: ${remaining}개)`;
        } else {
          btnNext.disabled = true;
          btnNext.textContent = '완료 (모든 상자 개봉됨)';
        }
      }
    }, 450);
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

    // Coin Bonus
    const lvlCoinBonus = data.upgrades.coinBonus;
    const costCoinBonus = this.storage.getUpgradeCost('coinBonus');
    const lvlElCB = document.getElementById('lvl-coinbonus');
    const barElCB = document.getElementById('bar-coinbonus');
    const costElCB = document.getElementById('cost-coinbonus');
    const btnBuyCB = document.getElementById('btn-buy-coinbonus') as HTMLButtonElement;

    if (lvlElCB) lvlElCB.textContent = lvlCoinBonus >= UPGRADE_MAX_LEVEL ? 'MAX' : `Lv.${lvlCoinBonus}`;
    if (barElCB) barElCB.style.width = `${(lvlCoinBonus / UPGRADE_MAX_LEVEL) * 100}%`;
    if (costElCB && btnBuyCB) {
      if (costCoinBonus === null) {
        costElCB.textContent = '최대';
        btnBuyCB.disabled = true;
      } else {
        costElCB.textContent = costCoinBonus.toString();
        btnBuyCB.disabled = data.coins < costCoinBonus;
      }
    }

    // Fever Boost
    const lvlFever = data.upgrades.feverBoost;
    const costFever = this.storage.getUpgradeCost('feverBoost');
    const lvlElFB = document.getElementById('lvl-feverboost');
    const barElFB = document.getElementById('bar-feverboost');
    const costElFB = document.getElementById('cost-feverboost');
    const btnBuyFB = document.getElementById('btn-buy-feverboost') as HTMLButtonElement;

    if (lvlElFB) lvlElFB.textContent = lvlFever >= UPGRADE_MAX_LEVEL ? 'MAX' : `Lv.${lvlFever}`;
    if (barElFB) barElFB.style.width = `${(lvlFever / UPGRADE_MAX_LEVEL) * 100}%`;
    if (costElFB && btnBuyFB) {
      if (costFever === null) {
        costElFB.textContent = '최대';
        btnBuyFB.disabled = true;
      } else {
        costElFB.textContent = costFever.toString();
        btnBuyFB.disabled = data.coins < costFever;
      }
    }

    // Revive
    const lvlRevive = data.upgrades.revive;
    const costRevive = this.storage.getUpgradeCost('revive');
    const lvlElRev = document.getElementById('lvl-revive');
    const barElRev = document.getElementById('bar-revive');
    const costElRev = document.getElementById('cost-revive');
    const btnBuyRev = document.getElementById('btn-buy-revive') as HTMLButtonElement;

    if (lvlElRev) lvlElRev.textContent = lvlRevive >= UPGRADE_MAX_LEVEL ? 'MAX' : `Lv.${lvlRevive}`;
    if (barElRev) barElRev.style.width = `${(lvlRevive / UPGRADE_MAX_LEVEL) * 100}%`;
    if (costElRev && btnBuyRev) {
      if (costRevive === null) {
        costElRev.textContent = '최대';
        btnBuyRev.disabled = true;
      } else {
        costElRev.textContent = costRevive.toString();
        btnBuyRev.disabled = data.coins < costRevive;
      }
    }

    // Skill Mastery
    const lvlSkillMastery = data.upgrades.skillMastery;
    const costSkillMastery = this.storage.getUpgradeCost('skillMastery');
    const lvlElSM = document.getElementById('lvl-skillmastery');
    const barElSM = document.getElementById('bar-skillmastery');
    const costElSM = document.getElementById('cost-skillmastery');
    const btnBuySM = document.getElementById('btn-buy-skillmastery') as HTMLButtonElement;

    if (lvlElSM) lvlElSM.textContent = lvlSkillMastery >= UPGRADE_MAX_LEVEL ? 'MAX' : `Lv.${lvlSkillMastery}`;
    if (barElSM) barElSM.style.width = `${(lvlSkillMastery / UPGRADE_MAX_LEVEL) * 100}%`;
    if (costElSM && btnBuySM) {
      if (costSkillMastery === null) {
        costElSM.textContent = '최대';
        btnBuySM.disabled = true;
      } else {
        costElSM.textContent = costSkillMastery.toString();
        btnBuySM.disabled = data.coins < costSkillMastery;
      }
    }

    // Lucky Chest
    const lvlLuckyChest = data.upgrades.luckyChest;
    const costLuckyChest = this.storage.getUpgradeCost('luckyChest');
    const lvlElLC = document.getElementById('lvl-luckychest');
    const barElLC = document.getElementById('bar-luckychest');
    const costElLC = document.getElementById('cost-luckychest');
    const btnBuyLC = document.getElementById('btn-buy-luckychest') as HTMLButtonElement;

    if (lvlElLC) lvlElLC.textContent = lvlLuckyChest >= UPGRADE_MAX_LEVEL ? 'MAX' : `Lv.${lvlLuckyChest}`;
    if (barElLC) barElLC.style.width = `${(lvlLuckyChest / UPGRADE_MAX_LEVEL) * 100}%`;
    if (costElLC && btnBuyLC) {
      if (costLuckyChest === null) {
        costElLC.textContent = '최대';
        btnBuyLC.disabled = true;
      } else {
        costElLC.textContent = costLuckyChest.toString();
        btnBuyLC.disabled = data.coins < costLuckyChest;
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

  // --- Character Skill Detail Modal Rendering ---
  public openSkillDetailModal(charId?: string): void {
    const targetChar = charId || this.storage.getData().currentCharacter || 'luna';
    const modal = document.getElementById('skill-detail-modal');
    if (!modal) return;

    // Set active tab in skill modal
    const tabs = document.querySelectorAll('#skill-hero-tabs .skill-tab-btn');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-char') === targetChar) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.renderSkillDetailContent(targetChar);
    modal.classList.remove('hidden');
  }

  public renderSkillDetailContent(charId: string): void {
    const container = document.getElementById('skill-detail-content');
    if (!container) return;

    const skillLvl = this.storage.getCharacterSkillLevel(charId);

    const charDetails: Record<string, {
      name: string;
      title: string;
      avatar: string;
      skillIcon: string;
      skillName: string;
      cooldown: number;
      category: string;
      description: string;
      mechanics: string[];
      tip: string;
    }> = {
      luna: {
        name: '달빛 모험가 루나',
        title: '은빛 달의 인도자',
        avatar: '/assets/luna_front.png',
        skillIcon: '/assets/skill_luna.png',
        skillName: '달빛 일섬 (Moonlight Slash)',
        cooldown: 12,
        category: '⚔️ 전방 참격 · 장애물 일격 파괴',
        description: '초승달 형태의 거대한 푸른 달빛 검기를 전방으로 급속 방출하여, 전방 경로 상에 도사리는 모든 파괴 가능한 장애물(바위 기둥, 슬라이딩 아치, 크리스탈 스파이크 등)을 일격에 산산조각 냅니다.',
        mechanics: [
          '발사 즉시 시속 65m/s 속도로 검기가 전방으로 뻗어 나가며 경로 상 장애물을 일괄 파괴',
          '장애물 파괴 시마다 추가 분쇄 보너스 점수(+100 PTS) 획득',
          '달의 제단 [스킬 숙련] 강화 시 기본 쿨다운 최대 40% 단축'
        ],
        tip: '💡 바위 기둥과 슬라이딩 아치가 빽빽하게 이어지는 복합 난구간에서 사용하면 안전한 통로를 단숨에 뚫을 수 있습니다.'
      },
      solaris: {
        name: '태양의 수호기사 솔라리스',
        title: '태양의 성기사',
        avatar: '/assets/solaris_front.png',
        skillIcon: '/assets/skill_solaris.png',
        skillName: '태양 전차 돌격 (Solar Juggernaut)',
        cooldown: 17,
        category: '🛡️ 무적 돌진 · 심연 구멍 도약',
        description: '5초 동안 작열하는 태양의 화염 갑주를 두르고 폭발적인 기세로 돌진합니다. 돌진 중 부딪히는 모든 장애물을 부수며, 바닥의 부러진 다리 틈(구멍 함정)도 공중을 가르며 무사히 날아넘습니다.',
        mechanics: [
          '돌진 중 이동 속도 +40% 부스트 및 완전 무적 판정',
          '모든 일반 장애물 자동 분쇄 및 추가 점수 획득',
          '바닥의 부러진 다리(Chasm) 구멍 위를 안전하게 비행 돌파'
        ],
        tip: '💡 바닥 구멍 함정과 바위 기둥이 연속으로 나타나는 스테이지 2 이상에서 돌격하면 안전과 점수를 동시에 확보할 수 있습니다.'
      },
      nyx: {
        name: '밤의 그림자 닉스',
        title: '그림자 암살자',
        avatar: '/assets/nyx_front.png',
        skillIcon: '/assets/skill_nyx.png',
        skillName: '그림자 차원 은신 (Shadow Shift)',
        cooldown: 16,
        category: '👤 차원 위상 전환 · 완전 무적',
        description: '6초간 신체와 영혼을 그림자 차원으로 전환합니다. 변환 중에는 모든 장애물과 바닥 함정을 완벽하게 통과(무시)하며, 장애물을 스쳐 지나갈 때마다 아슬아슬 회피(PERFECT DODGE) 콤보와 점수 보너스를 대량으로 획득합니다.',
        mechanics: [
          '모든 장애물 및 바닥 구멍 함정 완전 통과 (무적 위상)',
          '장애물 근접 통과 시마다 완벽 회피 보너스 & 콤보 누적',
          '달빛 파편 자력 흡수 범위 대폭 증가'
        ],
        tip: '💡 랭킹 1위를 노릴 때 장애물이 빽빽한 구간에서 은신하여 연속 회피 콤보 배율을 극대화하세요.'
      },
      stella: {
        name: '성운의 마법사 스텔라',
        title: '천문 마법 소녀',
        avatar: '/assets/stella_front.png',
        skillIcon: '/assets/skill_stella.png',
        skillName: '스타폴 변환 (Starfall Transmute)',
        cooldown: 15,
        category: '✨ 연금술 변환 · 대량 코인 생성',
        description: '별빛의 마법을 해방하여 전방 45m 이내에 도사리는 모든 위험 장애물을 영롱한 달의 파편(코인) 무리로 즉시 변환시킵니다. 위험 구역이 순식간에 달콤한 보상 구역으로 바뀝니다.',
        mechanics: [
          '전방 45m 범위 내 모든 위험 장애물 즉시 소멸',
          '소멸된 장애물 1개당 3개의 영롱한 달빛 파편으로 연금술 변환',
          '달빛 제단 [코인 자석] 및 [피버 모드]와 연계 시 폭발적인 재화 파밍 가능'
        ],
        tip: '💡 움직이는 장애물이나 연속 아치 구간에서 발동하면 엄청난 양의 코인을 안전하게 쓸어 담을 수 있습니다.'
      }
    };

    const info = charDetails[charId] || charDetails.luna;
    const mechanicsHtml = info.mechanics
      .map(m => `<div class="skill-mechanic-item"><span class="skill-bullet">◆</span><span>${m}</span></div>`)
      .join('');

    container.innerHTML = `
      <div class="skill-card-inner">
        <div class="skill-hero-header">
          <div class="skill-avatar-wrap">
            <img src="${info.avatar}" alt="${info.name}" class="skill-avatar-img" />
            <div class="skill-badge-overlay">
              <img src="${info.skillIcon}" alt="스킬" class="skill-badge-img" />
            </div>
          </div>
          <div class="skill-header-info">
            <div class="skill-header-hero-name">${info.name}</div>
            <div class="skill-header-skill-name">${info.skillName}</div>
            <div class="skill-tags-row">
              <span class="skill-pill skill-pill-cd">⏱️ 쿨다운: ${info.cooldown}초</span>
              <span class="skill-pill skill-pill-type">${info.category}</span>
              <span class="skill-pill">숙련도: Lv.${skillLvl}</span>
            </div>
          </div>
        </div>

        <div class="skill-desc-box">
          <div class="skill-section-label">📜 스킬 상세 효과</div>
          <div class="skill-desc-text">${info.description}</div>
          <div class="skill-mechanic-list">
            ${mechanicsHtml}
          </div>
        </div>

        <div class="skill-tip-box">
          ${info.tip}
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // 0. Character Skill Detail Modal Handlers
    document.getElementById('btn-close-skill')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('skill-detail-modal')?.classList.add('hidden');
    });

    document.querySelectorAll('#skill-hero-tabs .skill-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        const charId = btn.getAttribute('data-char') || 'luna';
        document.querySelectorAll('#skill-hero-tabs .skill-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderSkillDetailContent(charId);
      });
    });

    // 1. Main Menu Buttons
    document.getElementById('btn-start-run')?.addEventListener('click', () => {
      this.audio.playClick();
      this.audio.startBgm();
      this.listeners.onStartRun();
    });

    // Top Settings Button
    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      this.audio.playClick();
      this.initSettingsUI();
      document.getElementById('settings-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('settings-modal')?.classList.add('hidden');
    });

    // Universal Modal Corner Close Buttons
    document.querySelectorAll('.btn-modal-close-corner').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audio.playClick();
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.add('hidden');
        if (modal?.id === 'costume-modal') {
          this.listeners.onCostumeModalToggle?.(false);
        } else if (modal?.id === 'pause-modal') {
          this.listeners.onResume();
        } else if (modal?.id === 'gameover-modal') {
          this.listeners.onMainMenu();
        }
        this.updateWalletDisplays();
      });
    });

    // Dismissible Modal Backdrop Click Handling
    const bindBackdropClose = (modalId: string, onClose?: () => void) => {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.audio.playClick();
          modal.classList.add('hidden');
          onClose?.();
          this.updateWalletDisplays();
        }
      });
    };

    bindBackdropClose('settings-modal');
    bindBackdropClose('costume-modal', () => this.listeners.onCostumeModalToggle?.(false));
    bindBackdropClose('growth-modal');
    bindBackdropClose('shop-modal');
    bindBackdropClose('cash-billing-modal');
    bindBackdropClose('skill-detail-modal');
    bindBackdropClose('gacha-modal');
    bindBackdropClose('chest-open-modal');

    // First user gesture Web Audio unlock for mobile web and Android WebView
    const unlockAudio = () => {
      this.audio.ensureContext();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    // Reorganized Character & Costume Modal Button
    document.getElementById('btn-open-costumes')?.addEventListener('click', () => {
      this.audio.playClick();
      this.updateHeroAndCostumesUI();
      document.getElementById('costume-modal')?.classList.remove('hidden');
      this.listeners.onCostumeModalToggle?.(true);
    });

    document.getElementById('btn-close-costumes')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('costume-modal')?.classList.add('hidden');
      this.listeners.onCostumeModalToggle?.(false);
    });

    // Main Menu Chest Open Button (Opens modal first in idle state!)
    document.getElementById('btn-menu-open-chest')?.addEventListener('click', () => {
      this.audio.playClick();
      this.showChestModal();
    });

    // Growth Modal Button (달의 제단 영구 성장)
    document.getElementById('btn-open-growth')?.addEventListener('click', () => {
      this.audio.playClick();
      this.updateShopCards();
      document.getElementById('growth-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-growth')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('growth-modal')?.classList.add('hidden');
    });

    // Moonlight Shop Modal Button (달빛 상점 & 캐시 샵)
    document.getElementById('btn-open-shop')?.addEventListener('click', () => {
      this.audio.playClick();
      this.updateShopModal();
      document.getElementById('shop-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-shop')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('shop-modal')?.classList.add('hidden');
    });

    // Shop Tabs Switching
    document.getElementById('tab-btn-cash-shop')?.addEventListener('click', () => {
      this.audio.playClick();
      this.activeShopTab = 'cash';
      this.updateShopModal();
    });

    document.getElementById('tab-btn-item-shop')?.addEventListener('click', () => {
      this.audio.playClick();
      this.activeShopTab = 'items';
      this.updateShopModal();
    });

    // Cash Purchase Billing Modal Buttons
    document.getElementById('btn-close-billing-corner')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('cash-billing-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-cancel-billing')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('cash-billing-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-confirm-billing')?.addEventListener('click', () => {
      this.confirmBillingPurchase();
    });

    // Rates Toggle Buttons
    document.getElementById('btn-toggle-gacha-rates')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('gacha-rates-table')?.classList.toggle('hidden');
    });

    document.getElementById('btn-toggle-chest-rates')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('chest-rates-table')?.classList.toggle('hidden');
    });

    // Starlight Gacha Modal
    document.getElementById('btn-open-gacha')?.addEventListener('click', () => {
      this.audio.playClick();
      this.updateWalletDisplays();
      document.getElementById('gacha-results-container')?.classList.add('hidden');
      document.getElementById('gacha-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-gacha')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('gacha-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-gacha-single')?.addEventListener('click', () => {
      this.performGachaPull(1);
    });

    document.getElementById('btn-gacha-multi')?.addEventListener('click', () => {
      this.performGachaPull(10);
    });

    // In-Game Touch Skill Button
    document.getElementById('btn-touch-skill')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.listeners.onTriggerSkill?.();
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

    // 4. Mystery Chest Handlers & Game Over
    document.getElementById('btn-open-chests-go')?.addEventListener('click', () => {
      this.openChestAnimated();
    });

    document.getElementById('btn-chest-open-next')?.addEventListener('click', () => {
      this.openChestAnimated();
    });

    document.getElementById('btn-close-chest-modal')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('chest-open-modal')?.classList.add('hidden');
      this.updateWalletDisplays();
    });

    document.getElementById('btn-ad-revive-go')?.addEventListener('click', () => {
      this.audio.playClick();
      this.hideGameOverModal();
      this.listeners.onWatchAdToContinue?.();
    });

    document.getElementById('btn-watch-ad-revive')?.addEventListener('click', () => {
      this.audio.playClick();
      const cb = this.onWatchAdReviveCallback;
      this.hideReviveModal();
      cb?.();
    });

    document.getElementById('btn-skip-revive')?.addEventListener('click', () => {
      this.audio.playClick();
      const cb = this.onSkipReviveCallback;
      this.hideReviveModal();
      cb?.();
    });

    document.getElementById('btn-claim-ad-reward')?.addEventListener('click', () => {
      this.audio.playCoin();
      const cb = this.onAdCompleteCallback;
      this.hideAdPlayerModal();
      cb?.();
    });

    document.getElementById('btn-restart-go')?.addEventListener('click', () => {
      this.audio.playClick();
      this.hideGameOverModal();
      this.listeners.onRestart();
    });

    document.getElementById('btn-main-go')?.addEventListener('click', () => {
      this.audio.playClick();
      this.hideGameOverModal();
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

    document.getElementById('btn-buy-coinbonus')?.addEventListener('click', () => {
      if (this.storage.upgrade('coinBonus')) {
        this.audio.playCoin();
        this.showToast('파편 연금술 업그레이드 완료!');
        this.updateShopCards();
      } else {
        this.showToast('코인이 부족합니다.');
      }
    });

    document.getElementById('btn-buy-feverboost')?.addEventListener('click', () => {
      if (this.storage.upgrade('feverBoost')) {
        this.audio.playCoin();
        this.showToast('피버 폭주 업그레이드 완료!');
        this.updateShopCards();
      } else {
        this.showToast('코인이 부족합니다.');
      }
    });

    document.getElementById('btn-buy-revive')?.addEventListener('click', () => {
      if (this.storage.upgrade('revive')) {
        this.audio.playCoin();
        this.showToast('달빛 부활 업그레이드 완료!');
        this.updateShopCards();
      } else {
        this.showToast('코인이 부족합니다.');
      }
    });

    document.getElementById('btn-buy-skillmastery')?.addEventListener('click', () => {
      if (this.storage.upgrade('skillMastery')) {
        this.audio.playCoin();
        this.showToast('스킬 마스터리 업그레이드 완료!');
        this.updateShopCards();
      } else {
        this.showToast('코인이 부족합니다.');
      }
    });

    document.getElementById('btn-buy-luckychest')?.addEventListener('click', () => {
      if (this.storage.upgrade('luckyChest')) {
        this.audio.playCoin();
        this.showToast('황금 행운 상자 업그레이드 완료!');
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
      this.showToast('스토어 정식 출시 후 광고 시청 보상이 활성화됩니다.');
    });

    document.getElementById('btn-buy-starter')?.addEventListener('click', () => {
      this.audio.playClick();
      this.showToast('스토어 정식 출시 후 인앱 결제 상품이 오픈됩니다.');
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
