export enum GameState {
  MAIN_MENU = 'MAIN_MENU',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export type StateListener = (newState: GameState, prevState: GameState) => void;

export class GameStateManager {
  private currentState: GameState = GameState.MAIN_MENU;
  private listeners: StateListener[] = [];

  public getState(): GameState {
    return this.currentState;
  }

  public setState(nextState: GameState): void {
    if (this.currentState === nextState) return;
    const prevState = this.currentState;
    this.currentState = nextState;
    this.notify(nextState, prevState);
  }

  public isRunning(): boolean {
    return this.currentState === GameState.RUNNING;
  }

  public isPaused(): boolean {
    return this.currentState === GameState.PAUSED;
  }

  public isGameOver(): boolean {
    return this.currentState === GameState.GAME_OVER;
  }

  public isMainMenu(): boolean {
    return this.currentState === GameState.MAIN_MENU;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(newState: GameState, prevState: GameState): void {
    for (const listener of this.listeners) {
      listener(newState, prevState);
    }
  }
}
