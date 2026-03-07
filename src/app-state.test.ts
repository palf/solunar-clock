import { describe, expect, it } from 'vitest';
import { AppState } from './app-state';

describe('AppState', () => {
  it('initializes with London coordinates', () => {
    const state = new AppState();
    expect(state.centerLat).toBe(51.5074);
    expect(state.centerLon).toBe(-0.1278);
  });

  it('calculates scale based on scalingFactor', () => {
    const state = new AppState();
    const initialScale = state.scale;

    state.scalingFactor *= 2;
    expect(state.scale).toBe(initialScale * 2);
  });

  it('defaults to TOPOGRAPHIC layer', () => {
    const state = new AppState();
    expect(state.mapLayer).toBe('TOPOGRAPHIC');
  });

  describe('NaN and Infinity guards', () => {
    it('rejects NaN for scalingFactor', () => {
      const state = new AppState();
      const initial = state.scalingFactor;
      state.scalingFactor = NaN;
      expect(state.scalingFactor).toBe(initial);
    });

    it('rejects Infinity for latitude', () => {
      const state = new AppState();
      const initial = state.centerLat;
      state.centerLat = Infinity;
      expect(state.centerLat).toBe(initial);
    });

    it('rejects invalid inputs in setLocation', () => {
      const state = new AppState();
      const initialLat = state.centerLat;
      const initialLon = state.centerLon;
      state.setLocation(NaN, 10);
      expect(state.centerLat).toBe(initialLat);
      expect(state.centerLon).toBe(initialLon);
    });

    it('rejects invalid multiplier in adjustZoom', () => {
      const state = new AppState();
      const initial = state.scalingFactor;
      state.adjustZoom(NaN);
      expect(state.scalingFactor).toBe(initial);
    });

    it('rejects invalid values in pan', () => {
      const state = new AppState();
      const initialLat = state.centerLat;
      state.pan(NaN, 0);
      expect(state.centerLat).toBe(initialLat);
    });

    it('clamps latitude to MAX_LATITUDE during pan', () => {
      const state = new AppState();
      state.pan(100, 0);
      expect(state.centerLat).toBeCloseTo(85.0511);

      state.pan(-200, 0);
      expect(state.centerLat).toBeCloseTo(-85.0511);
    });
  });
});
