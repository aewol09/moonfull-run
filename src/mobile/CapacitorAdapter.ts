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
    App.addListener('backButton', () => {
      if (this.stateManager.isRunning()) {
        // In gameplay, open pause modal
        this.stateManager.setState(GameState.PAUSED);
      } else if (this.stateManager.isPaused()) {
        // In pause modal, resume or keep paused
      } else {
        // In modals or menus, close modals
        const shopModal = document.getElementById('shop-modal');
        const settingsModal = document.getElementById('settings-modal');

        if (shopModal && !shopModal.classList.contains('hidden')) {
          shopModal.classList.add('hidden');
        } else if (settingsModal && !settingsModal.classList.contains('hidden')) {
          settingsModal.classList.add('hidden');
        } else if (this.stateManager.isGameOver()) {
          this.stateManager.setState(GameState.MAIN_MENU);
        } else if (this.stateManager.isMainMenu()) {
          // Native exit app
          App.exitApp().catch(() => {});
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
