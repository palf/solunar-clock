/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state';
import { TouchController } from './touch-controller';

describe('TouchController', () => {
  let state: AppState;
  let element: HTMLElement;
  let onUpdate: any;

  beforeEach(() => {
    state = new AppState(AppState.loadInitialState());
    element = document.createElement('div');
    onUpdate = vi.fn().mockResolvedValue(undefined);
  });

  it('updates center position on single touch drag', async () => {
    new TouchController(element, state, onUpdate);
    const initialLat = state.centerLat;
    const initialLon = state.centerLon;

    // Simulate touch start
    const startEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as any],
    });
    element.dispatchEvent(startEvent);

    // Simulate touch move
    const moveEvent = new TouchEvent('touchmove', {
      touches: [{ clientX: 150, clientY: 150 } as any],
    });
    element.dispatchEvent(moveEvent);

    expect(state.centerLat).not.toBe(initialLat);
    expect(state.centerLon).not.toBe(initialLon);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('updates scaling factor on pinch', async () => {
    new TouchController(element, state, onUpdate);
    const initialScale = state.scalingFactor;

    // Simulate pinch start (2 fingers)
    const startEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as any, { clientX: 200, clientY: 200 } as any],
    });
    element.dispatchEvent(startEvent);

    // Simulate pinch move (fingers further apart)
    const moveEvent = new TouchEvent('touchmove', {
      touches: [{ clientX: 50, clientY: 50 } as any, { clientX: 250, clientY: 250 } as any],
    });
    element.dispatchEvent(moveEvent);

    expect(state.scalingFactor).toBeGreaterThan(initialScale);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('resets pan anchors when transitioning from 2 fingers to 1 finger', async () => {
    new TouchController(element, state, onUpdate);

    // 1. Start with 2 fingers
    const startEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as any, { clientX: 200, clientY: 200 } as any],
    });
    element.dispatchEvent(startEvent);

    // 2. Remove one finger (touchend)
    // In a real browser, the remaining finger is still in the 'touches' list of the end event
    const endEvent = new TouchEvent('touchend', {
      touches: [{ clientX: 100, clientY: 100 } as any],
    });
    element.dispatchEvent(endEvent);

    // 3. Move the remaining finger
    const initialLat = state.centerLat;
    const moveEvent = new TouchEvent('touchmove', {
      touches: [{ clientX: 110, clientY: 110 } as any],
    });
    element.dispatchEvent(moveEvent);

    // If anchors were NOT reset, dx/dy would be (110-startX).
    // If they WERE reset, dx/dy is (110-100) = 10px.
    // At 1x zoom (sens 0.1), 10px move should change lat by ~1.0 degree.
    // A jump (if startX was 0) would be 110px (~11 degrees).
    expect(Math.abs(state.centerLat - initialLat)).toBeLessThan(5);
  });
});
