/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state';
import { KeyboardController } from './keyboard-controller';
import type { UIController } from './ui-controller';

describe('KeyboardController', () => {
  let state: AppState;
  let ui: UIController;
  let onRedraw: any;

  beforeEach(() => {
    state = new AppState();
    // Mock UIController
    ui = {
      showSearch: vi.fn(),
      hideSearch: vi.fn(),
      updateHUD: vi.fn(),
    } as any;
    onRedraw = vi.fn().mockResolvedValue(undefined);
  });

  it('zooms in when + is pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialScale = state.scalingFactor;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));

    expect(state.scalingFactor).toBeGreaterThan(initialScale);
    expect(onRedraw).toHaveBeenCalled();
  });

  it('resets to London when 0 is pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    state.centerLat = 0;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }));

    expect(state.centerLat).toBe(51.5074);
    expect(onRedraw).toHaveBeenCalled();
  });

  it('pans when arrow keys are pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialLat = state.centerLat;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect(state.centerLat).toBeGreaterThan(initialLat);
    expect(onRedraw).toHaveBeenCalled();
  });

  it('shows search when / is pressed', async () => {
    new KeyboardController(state, ui, onRedraw);

    const event = new KeyboardEvent('keydown', { key: '/' });
    // Need to mock preventDefault
    vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(ui.showSearch).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
