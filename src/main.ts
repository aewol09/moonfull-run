import { GameEngine } from './core/GameEngine';

window.addEventListener('DOMContentLoaded', () => {
  try {
    const engine = new GameEngine();
    (window as unknown as { __MOONFALL_ENGINE__: GameEngine }).__MOONFALL_ENGINE__ = engine;
    console.log('🌙 Moonfall Run Initialized Successfully!');
  } catch (err) {
    console.error('Failed to initialize Moonfall Run engine:', err);
  }
});
