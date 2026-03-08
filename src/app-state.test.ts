import { describe, expect, it } from 'vitest';
import { AppState } from './app-state';

describe('AppState', () => {
  it('initializes with London coordinates by default', () => {
    const config = AppState.loadInitialState();
    const state = new AppState(config);
    expect(state.centerLat).toBe(51.5074);
    expect(state.centerLon).toBe(-0.1278);
  });

  it('calculates scale based on scalingFactor', () => {
    const config = AppState.loadInitialState();
    const state = new AppState(config);
    const initialScale = state.scale;

    state.scalingFactor *= 2;
    expect(state.scale).toBe(initialScale * 2);
  });

  it('defaults to STREETS layer', () => {
    const config = AppState.loadInitialState();
    const state = new AppState(config);
    expect(state.mapLayer).toBe('STREETS');
  });

  describe('NaN and Infinity guards', () => {
    it('rejects NaN for scalingFactor', () => {
      const config = AppState.loadInitialState();
      const state = new AppState(config);
      const initial = state.scalingFactor;
      state.scalingFactor = NaN;
      expect(state.scalingFactor).toBe(initial);
    });

    it('rejects invalid values in pan', () => {
      const config = AppState.loadInitialState();
      const state = new AppState(config);
      const initialLat = state.centerLat;
      state.pan(NaN, 0);
      expect(state.centerLat).toBe(initialLat);
    });

    it('clamps latitude to MAX_LATITUDE during pan', () => {
      const config = AppState.loadInitialState();
      const state = new AppState(config);
      state.pan(100, 0);
      expect(state.centerLat).toBeCloseTo(85.0511);

      state.pan(-200, 0);
      expect(state.centerLat).toBeCloseTo(-85.0511);
    });
  });
});
