import { GameEngine } from './core/GameEngine';
import { AssetLoader } from './render/AssetLoader';

window.addEventListener('DOMContentLoaded', () => {
  try {
    AssetLoader.preloadAll();
    const engine = new GameEngine();
    (window as unknown as { __MOONFULL_ENGINE__: GameEngine; __MOONFALL_ENGINE__: GameEngine; gameEngine: GameEngine }).__MOONFULL_ENGINE__ = engine;
    (window as unknown as { __MOONFULL_ENGINE__: GameEngine; __MOONFALL_ENGINE__: GameEngine; gameEngine: GameEngine }).__MOONFALL_ENGINE__ = engine;
    (window as unknown as { gameEngine: GameEngine }).gameEngine = engine;
    console.log('🌙 Moonfull Run Initialized Successfully!');
  } catch (err) {
    console.error('Failed to initialize Moonfull Run engine:', err);
  }
});
