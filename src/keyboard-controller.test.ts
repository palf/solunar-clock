/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state';
import { KeyboardController } from './keyboard-controller';
import type { UIController } from './ui-controller';
import type { AnimationController } from './animation-controller';

describe('KeyboardController', () => {
  let state: AppState;
  let ui: UIController;
  let onRedraw: any;
  let animationController: AnimationController;

  beforeEach(() => {
    state = new AppState();
    // Mock UIController
    ui = {
      showSearch: vi.fn(),
      hideSearch: vi.fn(),
      updateHUD: vi.fn(),
    } as any;
    onRedraw = vi.fn().mockResolvedValue(undefined);
    animationController = {
      glideTo: vi.fn().mockImplementation(async (lat, lon, scale) => {
        state.centerLat = lat;
        state.centerLon = lon;
        if (scale !== undefined) state.scalingFactor = scale;
        await onRedraw();
      }),
    } as any;
  });

  it('zooms in when + is pressed', async () => {
    new KeyboardController(state, ui, onRedraw, animationController);
    const initialScale = state.scalingFactor;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));

    expect(state.scalingFactor).toBeGreaterThan(initialScale);
    expect(onRedraw).toHaveBeenCalled();
  });

  it('resets to London when 0 is pressed', async () => {
    new KeyboardController(state, ui, onRedraw, animationController);
    state.centerLat = 0;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }));

    expect(state.centerLat).toBe(51.5074);
    expect(animationController.glideTo).toHaveBeenCalledWith(51.5074, -0.1278, 10);
    expect(onRedraw).toHaveBeenCalled();
  });

  it('pans when arrow keys are pressed', async () => {
    new KeyboardController(state, ui, onRedraw, animationController);
    const initialLat = state.centerLat;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect(state.centerLat).toBeGreaterThan(initialLat);
    expect(onRedraw).toHaveBeenCalled();
  });

  it('shows search when / is pressed', async () => {
    new KeyboardController(state, ui, onRedraw, animationController);

    const event = new KeyboardEvent('keydown', { key: '/' });
    // Need to mock preventDefault
    vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(ui.showSearch).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
