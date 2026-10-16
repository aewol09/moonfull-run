export enum InputAction {
  MOVE_LEFT = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',
  JUMP = 'JUMP',
  SLIDE = 'SLIDE',
  PAUSE = 'PAUSE',
  SKILL = 'SKILL'
}

export type InputCallback = (action: InputAction) => void;

export class InputManager {
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private isTouching = false;
  private readonly SWIPE_THRESHOLD = 26; // Min pixels for swipe
  private readonly MAX_SWIPE_TIME_MS = 600; // Max duration to distinguish swipe from hold

  private callback: InputCallback | null = null;
  private bufferedAction: InputAction | null = null;
  private isProcessingTransition = false;
  private isEnabled = true;
  private swipeTriggered = false;

  constructor() {
    this.initEventListeners();
  }

  public setCallback(cb: InputCallback): void {
    this.callback = cb;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.bufferedAction = null;
    }
  }

  public getActive(): boolean {
    return this.isEnabled;
  }

  public setProcessingTransition(busy: boolean): void {
    this.isProcessingTransition = busy;
    if (!busy && this.bufferedAction !== null) {
      // Consume the single buffered horizontal movement
      const nextAction = this.bufferedAction;
      this.bufferedAction = null;
      if (this.callback && this.isEnabled) {
        this.callback(nextAction);
      }
    }
  }

  public clearBuffer(): void {
    this.bufferedAction = null;
  }

  private emitAction(action: InputAction): void {
    if (!this.isEnabled) return;

    // Recommendation 3: Jump, Slide, Pause are executed IMMEDIATELY even during lane transition!
    // Only lane changes (MOVE_LEFT, MOVE_RIGHT) are buffered if currently transitioning
    if (action === InputAction.MOVE_LEFT || action === InputAction.MOVE_RIGHT) {
      if (this.isProcessingTransition) {
        // Buffer at most 1 lane move while transitioning
        this.bufferedAction = action;
        return;
      }
    }

    if (this.callback) {
      this.callback(action);
    }
  }

  private initEventListeners(): void {
    if (typeof window === 'undefined') return;

    // 1. Touch Events on document with passive: false to prevent scrolling
    window.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (!this.isEnabled || e.touches.length === 0) return;
        const target = e.target as HTMLElement | null;
        if (target && target.closest && target.closest('button, .modal-overlay, input, select')) {
          this.isTouching = false;
          return;
        }
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = performance.now();
        this.isTouching = true;
        this.swipeTriggered = false;
      },
      { passive: false }
    );

    window.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (!this.isTouching) return;
        e.preventDefault();

        // Immediate swipe trigger as soon as swipe threshold is exceeded for crisp, lag-free response
        if (!this.swipeTriggered && e.touches.length > 0) {
          const touch = e.touches[0];
          const deltaX = touch.clientX - this.touchStartX;
          const deltaY = touch.clientY - this.touchStartY;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);

          if (absX >= this.SWIPE_THRESHOLD || absY >= this.SWIPE_THRESHOLD) {
            this.swipeTriggered = true;
            if (absX > absY) {
              if (deltaX > 0) {
                this.emitAction(InputAction.MOVE_RIGHT);
              } else {
                this.emitAction(InputAction.MOVE_LEFT);
              }
            } else {
              if (deltaY < 0) {
                this.emitAction(InputAction.JUMP);
              } else {
                this.emitAction(InputAction.SLIDE);
              }
            }
          }
        }
      },
      { passive: false }
    );

    window.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        if (!this.isTouching || !this.isEnabled) return;
        this.isTouching = false;

        // If already triggered immediately during touchmove, do not duplicate
        if (this.swipeTriggered) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const elapsed = performance.now() - this.touchStartTime;

        if (elapsed > this.MAX_SWIPE_TIME_MS) return;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX < this.SWIPE_THRESHOLD && absY < this.SWIPE_THRESHOLD) {
          return;
        }

        if (absX > absY) {
          if (deltaX > 0) {
            this.emitAction(InputAction.MOVE_RIGHT);
          } else {
            this.emitAction(InputAction.MOVE_LEFT);
          }
        } else {
          if (deltaY < 0) {
            this.emitAction(InputAction.JUMP);
          } else {
            this.emitAction(InputAction.SLIDE);
          }
        }
      },
      { passive: false }
    );

    window.addEventListener('touchcancel', () => {
      this.isTouching = false;
      this.swipeTriggered = false;
    });

    // 2. Keyboard fallback for desktop testing & development
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.isEnabled) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.emitAction(InputAction.MOVE_LEFT);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.emitAction(InputAction.MOVE_RIGHT);
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          this.emitAction(InputAction.JUMP);
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.emitAction(InputAction.SLIDE);
          break;
        case 'KeyE':
        case 'KeyQ':
        case 'KeyF':
          this.emitAction(InputAction.SKILL);
          break;
        case 'Escape':
          this.emitAction(InputAction.PAUSE);
          break;
      }
    });
  }
}
