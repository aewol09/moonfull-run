import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputManager, InputAction } from '../src/core/InputManager';

describe('InputManager', () => {
  let input: InputManager;

  beforeEach(() => {
    // Setup clean window mock environment
    input = new InputManager();
  });

  it('should buffer 1 action while transitioning and consume it after transition ends', () => {
    const received: InputAction[] = [];
    input.setCallback((action) => {
      received.push(action);
    });

    // Character starts lane transition (busy)
    input.setProcessingTransition(true);

    // Keyboard dispatch while busy
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    expect(received.length).toBe(0); // Should be buffered, not yet dispatched

    // Overwrite buffer with second key
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    expect(received.length).toBe(0);

    // Lane transition completes
    input.setProcessingTransition(false);
    expect(received.length).toBe(1);
    expect(received[0]).toBe(InputAction.MOVE_RIGHT); // Latest buffered action consumed
  });

  it('should dispatch jump on ArrowUp or KeyW', () => {
    const received: InputAction[] = [];
    input.setCallback((action) => {
      received.push(action);
    });

    input.setProcessingTransition(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    expect(received).toContain(InputAction.JUMP);
  });

  it('should dispatch slide on ArrowDown or KeyS', () => {
    const received: InputAction[] = [];
    input.setCallback((action) => {
      received.push(action);
    });

    input.setProcessingTransition(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
    expect(received).toContain(InputAction.SLIDE);
  });
});
