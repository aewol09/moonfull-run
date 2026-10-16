import { GameEngine } from './core/GameEngine';
import { AssetLoader } from './render/AssetLoader';

window.addEventListener('DOMContentLoaded', () => {
  try {
    AssetLoader.preloadAll();
    const engine = new GameEngine();
    (window as unknown as { __MOONFALL_ENGINE__: GameEngine; gameEngine: GameEngine }).__MOONFALL_ENGINE__ = engine;
    (window as unknown as { gameEngine: GameEngine }).gameEngine = engine;
    console.log('🌙 Moonfall Run Initialized Successfully!');
  } catch (err) {
    console.error('Failed to initialize Moonfall Run engine:', err);
  }
});
