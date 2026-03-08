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
  let onRedraw: () => Promise<void>;

  beforeEach(() => {
    state = new AppState(AppState.loadInitialState());
    ui = {
      showSearch: vi.fn(),
      showZoomDialog: vi.fn(),
      toggleHelpDialog: vi.fn(),
      handleHomeAction: vi.fn(),
      updateHUD: vi.fn(),
    } as any;
    onRedraw = vi.fn().mockResolvedValue(undefined);
  });

  it('zooms in when + or = is pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialScale = state.scalingFactor;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
    expect(state.scalingFactor).toBeGreaterThan(initialScale);

    const midScale = state.scalingFactor;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '=' }));
    expect(state.scalingFactor).toBeGreaterThan(midScale);
  });

  it('zooms out when - or _ is pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialScale = state.scalingFactor;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
    expect(state.scalingFactor).toBeLessThan(initialScale);

    const midScale = state.scalingFactor;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '_' }));
    expect(state.scalingFactor).toBeLessThan(midScale);
  });

  it('pans when arrow keys are pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialLat = state.centerLat;
    const initialLon = state.centerLon;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(state.centerLat).toBeGreaterThan(initialLat);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(state.centerLon).toBeLessThan(initialLon);
  });

  it('fast-zooms with Shift + Arrows', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialScale = state.scalingFactor;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }));
    expect(state.scalingFactor).toBeGreaterThan(initialScale);
  });

  it('cycles layers with l key', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialLayer = state.mapLayer;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    expect(state.mapLayer).not.toBe(initialLayer);
    expect(ui.updateHUD).toHaveBeenCalled();
  });

  it('triggers search with s or /', async () => {
    new KeyboardController(state, ui, onRedraw);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    expect(ui.showSearch).toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(ui.showSearch).toHaveBeenCalledTimes(2);
  });

  it('triggers zoom dialog with z', async () => {
    new KeyboardController(state, ui, onRedraw);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(ui.showZoomDialog).toHaveBeenCalled();
  });

  it('triggers home action with h', async () => {
    new KeyboardController(state, ui, onRedraw);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    expect(ui.handleHomeAction).toHaveBeenCalled();
  });

  it('toggles help with ?', async () => {
    new KeyboardController(state, ui, onRedraw);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    expect(ui.toggleHelpDialog).toHaveBeenCalled();
  });
});
