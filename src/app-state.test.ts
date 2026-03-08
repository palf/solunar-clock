import { describe, expect, it } from 'vitest';
import { AppState } from './app-state';
import { loadInitialState } from './state-loader';
import { asScale } from './types';

describe('AppState', () => {
  it('initializes with London coordinates by default', () => {
    const config = loadInitialState();
    const state = new AppState(config);
    expect(state.centerLat).toBe(51.5074);
    expect(state.centerLon).toBe(-0.1278);
  });

  it('calculates the scale correctly based on the scalingFactor', () => {
    const config = loadInitialState();
    const state = new AppState(config);
    const initialScale = state.scale;

    state.scalingFactor = asScale(state.scalingFactor * 2);
    expect(state.scale).toBe(initialScale * 2);
  });

  it('defaults the map layer to STREETS', () => {
    const config = loadInitialState();
    const state = new AppState(config);
    expect(state.mapLayer).toBe('STREETS');
  });

  describe('NaN and Infinity guards', () => {
    it('rejects NaN values for scalingFactor', () => {
      const config = loadInitialState();
      const state = new AppState(config);
      const initial = state.scalingFactor;
      state.scalingFactor = NaN as any;
      expect(state.scalingFactor).toBe(initial);
    });

    it('rejects invalid numeric values during panning', () => {
      const config = loadInitialState();
      const state = new AppState(config);
      const initialLat = state.centerLat;
      state.pan(NaN, 0);
      expect(state.centerLat).toBe(initialLat);
    });

    it('clamps the latitude to MAX_LATITUDE during panning', () => {
      const config = loadInitialState();
      const state = new AppState(config);
      state.pan(100, 0);
      expect(state.centerLat).toBeCloseTo(85.0511, 4);

      state.pan(-200, 0);
      expect(state.centerLat).toBeCloseTo(-85.0511, 4);
    });
  });
});
