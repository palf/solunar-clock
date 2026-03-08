/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state';
import { KeyboardController } from './keyboard-controller';
import { loadInitialState } from './state-loader';
import type { UIController } from './ui-controller';

describe('KeyboardController', () => {
  let state: AppState;
  let ui: UIController;
  let onRedraw: () => Promise<void>;

  beforeEach(() => {
    state = new AppState(loadInitialState());
    ui = {
      showSearch: vi.fn(),
      showZoomDialog: vi.fn(),
      toggleHelpDialog: vi.fn(),
      handleHomeAction: vi.fn(),
      updateTime: vi.fn(),
      updateMetadata: vi.fn(),
    } as any;
    onRedraw = vi.fn().mockResolvedValue(undefined);
  });

  it('increases the zoom level when the + or = keys are pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialScale = state.scalingFactor;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
    expect(state.scalingFactor).toBeGreaterThan(initialScale);

    const midScale = state.scalingFactor;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '=' }));
    expect(state.scalingFactor).toBeGreaterThan(midScale);
  });

  it('decreases the zoom level when the - or _ keys are pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialScale = state.scalingFactor;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
    expect(state.scalingFactor).toBeLessThan(initialScale);

    const midScale = state.scalingFactor;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '_' }));
    expect(state.scalingFactor).toBeLessThan(midScale);
  });

  it('pans the map center when arrow keys are pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialLat = state.centerLat;
    const initialLon = state.centerLon;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(state.centerLat).toBeGreaterThan(initialLat);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(state.centerLon).toBeLessThan(initialLon);
  });

  it('performs a fast-zoom when Shift and Arrow keys are combined', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialScale = state.scalingFactor;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }));
    expect(state.scalingFactor).toBeGreaterThan(initialScale);
  });

  it('cycles through available map layers when the l key is pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    const initialLayer = state.mapLayer;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    expect(state.mapLayer).not.toBe(initialLayer);
    expect(ui.updateMetadata).toHaveBeenCalled();
    expect(onRedraw).toHaveBeenCalled();
  });

  it('launches the search overlay when the s or / keys are pressed', async () => {
    new KeyboardController(state, ui, onRedraw);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    expect(ui.showSearch).toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(ui.showSearch).toHaveBeenCalledTimes(2);
  });

  it('triggers the manual zoom dialog when the z key is pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(ui.showZoomDialog).toHaveBeenCalled();
  });

  it('triggers the combined home action when the h key is pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    expect(ui.handleHomeAction).toHaveBeenCalled();
  });

  it('toggles the help overlay when the ? key is pressed', async () => {
    new KeyboardController(state, ui, onRedraw);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    expect(ui.toggleHelpDialog).toHaveBeenCalled();
  });
});
