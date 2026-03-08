import { describe, expect, it, vi } from 'vitest';
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

  it('adjusts zoom level correctly', () => {
    const config = loadInitialState();
    const state = new AppState(config);
    const initialScale = state.scalingFactor;

    state.adjustZoom(2);
    expect(state.scalingFactor).toBe(asScale(initialScale * 2));
  });

  it('emits a change event when state properties are modified', () => {
    const config = loadInitialState();
    const state = new AppState(config);
    const callback = vi.fn();
    state.onChange(callback);

    state.centerLat = 10 as any;
    expect(callback).toHaveBeenCalledTimes(1);

    state.centerLon = 20 as any;
    expect(callback).toHaveBeenCalledTimes(2);

    state.scalingFactor = 5 as any;
    expect(callback).toHaveBeenCalledTimes(3);

    state.mapLayer = 'IMAGERY';
    expect(callback).toHaveBeenCalledTimes(4);

    state.renderMode = '2D';
    expect(callback).toHaveBeenCalledTimes(5);

    state.setHome();
    expect(callback).toHaveBeenCalledTimes(6);

    state.clearHome();
    expect(callback).toHaveBeenCalledTimes(7);
  });
});
