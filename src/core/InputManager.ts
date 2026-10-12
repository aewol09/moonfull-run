export enum InputAction {
  MOVE_LEFT = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',
  JUMP = 'JUMP',
  SLIDE = 'SLIDE',
  PAUSE = 'PAUSE'
}

export type InputCallback = (action: InputAction) => void;

export class InputManager {
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private isTouching = false;
  private readonly SWIPE_THRESHOLD = 28; // Min pixels for swipe
  private readonly MAX_SWIPE_TIME_MS = 600; // Max duration to distinguish swipe from hold

  private callback: InputCallback | null = null;
  private bufferedAction: InputAction | null = null;
  private isProcessingTransition = false;
  private isEnabled = true;

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

  public setProcessingTransition(busy: boolean): void {
    this.isProcessingTransition = busy;
    if (!busy && this.bufferedAction !== null) {
      // Consume the single buffered action
      const nextAction = this.bufferedAction;
      this.bufferedAction = null;
      this.emitAction(nextAction);
    }
  }

  public clearBuffer(): void {
    this.bufferedAction = null;
  }

  private emitAction(action: InputAction): void {
    if (!this.isEnabled) return;

    if (this.isProcessingTransition) {
      // Buffer at most 1 input while character is transitioning lanes
      this.bufferedAction = action;
      return;
    }

    if (this.callback) {
      this.callback(action);
    }
  }

  private initEventListeners(): void {
    // 1. Touch Events on document with passive: false to prevent scrolling
    window.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (!this.isEnabled || e.touches.length === 0) return;
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = performance.now();
        this.isTouching = true;
      },
      { passive: false }
    );

    window.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (this.isTouching) {
          // Block native scrolling and gestures
          e.preventDefault();
        }
      },
      { passive: false }
    );

    window.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        if (!this.isTouching || !this.isEnabled) return;
        this.isTouching = false;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const elapsed = performance.now() - this.touchStartTime;

        if (elapsed > this.MAX_SWIPE_TIME_MS) return;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX < this.SWIPE_THRESHOLD && absY < this.SWIPE_THRESHOLD) {
          // Tap detected (ignored for running controls)
          return;
        }

        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            this.emitAction(InputAction.MOVE_RIGHT);
          } else {
            this.emitAction(InputAction.MOVE_LEFT);
          }
        } else {
          // Vertical swipe
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
        case 'Escape':
          this.emitAction(InputAction.PAUSE);
          break;
      }
    });
  }
}
