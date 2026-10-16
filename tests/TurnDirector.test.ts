import { describe, it, expect, vi } from 'vitest';
import { TurnDirector, TurnEvent } from '../src/gameplay/TurnDirector';

describe('TurnDirector', () => {
  it('should initialize in straight phase with zero yaw and zero curve', () => {
    const director = new TurnDirector();
    expect(director.phase).toBe('straight');
    expect(director.currentYaw).toBe(0);
    expect(director.targetYaw).toBe(0);
    expect(director.currentCurveX).toBe(0);
  });

  it('should transition to sideways right turn when distance reaches 350m', () => {
    const director = new TurnDirector();
    const eventHandler = vi.fn();
    director.onTurnChange = eventHandler;

    // Below threshold
    director.update(200, 0.05, true);
    expect(director.phase).toBe('straight');
    expect(director.targetYaw).toBe(0);
    expect(eventHandler).not.toHaveBeenCalled();

    // Reaching 350m threshold
    director.update(350, 0.05, true);
    expect(director.phase).toBe('sideways');
    expect(director.turnDirection).toBe('right');
    expect(director.targetYaw).toBeCloseTo(0.32, 2); // Dynamic banking into 180-degree right road turn
    expect(director.targetCurveX).toBeCloseTo(0.0024, 4); // Road itself physically curves 180 degrees!
    expect(eventHandler).toHaveBeenCalledTimes(1);
    expect(eventHandler).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'right' })
    );
  });

  it('should transition back to straight after running through the sideways section', () => {
    const director = new TurnDirector();
    const events: TurnEvent[] = [];
    director.onTurnChange = (e) => events.push(e);

    // Enter right turn at 350m
    director.update(350, 0.05, true);
    expect(director.phase).toBe('sideways');

    // Midway through turn (e.g. 400m)
    director.update(400, 0.05, true);
    expect(director.phase).toBe('sideways');

    // Complete turn at 465m (350 + 110 = 460m end dist)
    director.update(465, 0.05, true);
    expect(director.phase).toBe('straight');
    expect(director.targetYaw).toBe(0);
    expect(director.targetCurveX).toBe(0);
    expect(events.length).toBe(2);
    expect(events[1].direction).toBe('straight');
  });

  it('should alternate to left turn on the next turn sequence', () => {
    const director = new TurnDirector();
    const events: TurnEvent[] = [];
    director.onTurnChange = (e) => events.push(e);

    // Turn 1: Right at 350m
    director.update(350, 0.05, true);
    expect(director.turnDirection).toBe('right');

    // Return to straight at 465m
    director.update(465, 0.05, true);
    expect(director.phase).toBe('straight');

    // Next turn at 465 + 400 = 865m
    director.update(870, 0.05, true);
    expect(director.phase).toBe('sideways');
    expect(director.turnDirection).toBe('left');
    expect(director.targetYaw).toBeCloseTo(-0.32, 2); // Dynamic banking into 180-degree left road turn
    expect(director.targetCurveX).toBeCloseTo(-0.0024, 4); // Left road curvature
  });

  it('should reset properly back to initial state', () => {
    const director = new TurnDirector();
    director.update(350, 0.05, true);
    director.reset();

    expect(director.phase).toBe('straight');
    expect(director.currentYaw).toBe(0);
    expect(director.targetYaw).toBe(0);
    expect(director.turnDirection).toBe('none');
  });
});
