import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { GameState, GameStateManager } from '../core/GameState';
import { StorageManager } from '../core/StorageManager';

export class CapacitorAdapter {
  private stateManager: GameStateManager;
  private storage: StorageManager;

  constructor(stateManager: GameStateManager, storage: StorageManager) {
    this.stateManager = stateManager;
    this.storage = storage;
    this.initCapacitor();
  }

  private initCapacitor(): void {
    // 1. Android Lifecycle (Auto pause on background transition)
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive && this.stateManager.isRunning()) {
        this.stateManager.setState(GameState.PAUSED);
      }
    }).catch(err => {
      console.warn('Moonfall Run: Capacitor App listener not available in web context', err);
    });

    // 2. Android Hardware Back Button Handling
    let lastBackPressTime = 0;

    App.addListener('backButton', () => {
      // 1. Check open modals in order of precedence
      const billingModal = document.getElementById('cash-billing-modal');
      const skillDetailModal = document.getElementById('skill-detail-modal');
      const gachaSummonModal = document.getElementById('gacha-summon-modal');
      const gachaModal = document.getElementById('gacha-modal');
      const chestModal = document.getElementById('chest-open-modal');
      const growthModal = document.getElementById('growth-modal');
      const costumeModal = document.getElementById('costume-modal');
      const shopModal = document.getElementById('shop-modal');
      const settingsModal = document.getElementById('settings-modal');
      const reviveModal = document.getElementById('revive-modal');
      const adPlayerModal = document.getElementById('ad-player-modal');

      if (billingModal && !billingModal.classList.contains('hidden')) {
        billingModal.classList.add('hidden');
        return;
      }
      if (skillDetailModal && !skillDetailModal.classList.contains('hidden')) {
        skillDetailModal.classList.add('hidden');
        return;
      }
      if (gachaSummonModal && !gachaSummonModal.classList.contains('hidden')) {
        const skipBtn = document.getElementById('btn-skip-gacha');
        if (skipBtn) skipBtn.click();
        else gachaSummonModal.classList.add('hidden');
        return;
      }
      if (adPlayerModal && !adPlayerModal.classList.contains('hidden')) {
        return;
      }
      if (reviveModal && !reviveModal.classList.contains('hidden')) {
        const skipBtn = document.getElementById('btn-skip-revive');
        if (skipBtn) skipBtn.click();
        return;
      }
      if (gachaModal && !gachaModal.classList.contains('hidden')) {
        gachaModal.classList.add('hidden');
        return;
      }
      if (chestModal && !chestModal.classList.contains('hidden')) {
        chestModal.classList.add('hidden');
        return;
      }
      if (growthModal && !growthModal.classList.contains('hidden')) {
        growthModal.classList.add('hidden');
        return;
      }
      if (costumeModal && !costumeModal.classList.contains('hidden')) {
        const btnClose = document.getElementById('btn-close-costumes');
        if (btnClose) btnClose.click();
        else costumeModal.classList.add('hidden');
        return;
      }
      if (shopModal && !shopModal.classList.contains('hidden')) {
        shopModal.classList.add('hidden');
        return;
      }
      if (settingsModal && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
        return;
      }

      // 2. State-dependent Back handling
      if (this.stateManager.isRunning()) {
        // In gameplay, open pause modal
        this.stateManager.setState(GameState.PAUSED);
      } else if (this.stateManager.isPaused()) {
        // In pause modal, resume game
        this.stateManager.setState(GameState.RUNNING);
      } else if (this.stateManager.isGameOver()) {
        // In game over, safely return to main menu
        this.stateManager.setState(GameState.MAIN_MENU);
      } else if (this.stateManager.isMainMenu()) {
        // Double-back to exit on Android
        const now = Date.now();
        if (now - lastBackPressTime < 2000) {
          App.exitApp().catch(() => {});
        } else {
          lastBackPressTime = now;
          const toastContainer = document.getElementById('toast-container');
          if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = '뒤로가기 버튼을 한 번 더 누르면 게임이 종료됩니다.';
            toastContainer.appendChild(toast);
            setTimeout(() => {
              if (toast.parentElement) toast.parentElement.removeChild(toast);
            }, 2000);
          }
        }
      }
    }).catch(() => {});
  }

  public vibrateLight(): void {
    if (!this.storage.getData().settings.vibration) return;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
    });
  }

  public vibrateHeavy(): void {
    if (!this.storage.getData().settings.vibration) return;
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(60);
      }
    });
  }
}
