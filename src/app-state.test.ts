import { describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state';
import { CONFIG } from './config';
import { loadInitialState } from './state-loader';
import { asLatitude, asLongitude, asScale } from './types';

describe('AppState', () => {
  it('initializes with London coordinates by default', () => {
    const config = loadInitialState();
    const state = new AppState(config);
    expect(state.centerLat).toBe(51.5074);
    expect(state.centerLon).toBe(-0.1278);
  });

  describe('scalingFactor', () => {
    it('calculates the scale correctly based on the scalingFactor', () => {
      const config = loadInitialState();
      const state = new AppState(config);
      state.scalingFactor = asScale(1000);
      const initialScale = state.scale;

      state.scalingFactor = asScale(state.scalingFactor * 2);
      expect(state.scale).toBe(initialScale * 2);
    });

    it('clamps to MIN/MAX limits', () => {
      const state = new AppState(loadInitialState());

      state.scalingFactor = (CONFIG.DISPLAY.MIN_SCALING_FACTOR - 1) as any;
      expect(state.scalingFactor).toBe(CONFIG.DISPLAY.MIN_SCALING_FACTOR);

      state.scalingFactor = (CONFIG.DISPLAY.MAX_SCALING_FACTOR + 1) as any;
      expect(state.scalingFactor).toBe(CONFIG.DISPLAY.MAX_SCALING_FACTOR);
    });

    it('rejects NaN values', () => {
      const state = new AppState(loadInitialState());
      const initialScale = state.scalingFactor;
      state.scalingFactor = NaN as any;
      expect(state.scalingFactor).toBe(initialScale);
    });

    it('adjusts correctly via multiplier', () => {
      const config = loadInitialState();
      const state = new AppState(config);
      state.scalingFactor = asScale(1000);
      const initialScale = state.scalingFactor;

      state.adjustZoom(2);
      expect(state.scalingFactor).toBe(asScale(initialScale * 2));
    });
  });

  describe('centerLat', () => {
    it('clamps to MAX_LATITUDE', () => {
      const state = new AppState(loadInitialState());

      state.centerLat = 100 as any;
      expect(state.centerLat).toBe(CONFIG.ENGINE.MAX_LATITUDE);

      state.centerLat = -100 as any;
      expect(state.centerLat).toBe(-CONFIG.ENGINE.MAX_LATITUDE);
    });

    it('rejects NaN values (via types error)', () => {
      const state = new AppState(loadInitialState());
      const initialLat = state.centerLat;

      expect(() => {
        state.centerLat = NaN as any;
      }).toThrow();
      expect(state.centerLat).toBe(initialLat);
    });
  });

  describe('centerLon', () => {
    it('normalizes values (wraps around -180/180)', () => {
      const state = new AppState(loadInitialState());

      state.centerLon = 190 as any;
      expect(state.centerLon).toBe(-170);

      state.centerLon = -190 as any;
      expect(state.centerLon).toBe(170);
    });

    it('rejects NaN values', () => {
      const state = new AppState(loadInitialState());
      const initialLon = state.centerLon;
      state.centerLon = NaN as any;
      expect(state.centerLon).toBe(initialLon);
    });
  });

  describe('mapLayer', () => {
    it('defaults to STREETS', () => {
      const config = loadInitialState();
      const state = new AppState(config);
      expect(state.mapLayer).toBe('STREETS');
    });

    it('updates correctly', () => {
      const state = new AppState(loadInitialState());
      state.mapLayer = 'IMAGERY';
      expect(state.mapLayer).toBe('IMAGERY');
    });

    it('cycles through layers', () => {
      const state = new AppState(loadInitialState());
      const initial = state.mapLayer;
      state.cycleLayer();
      expect(state.mapLayer).not.toBe(initial);
    });
  });

  describe('pan', () => {
    it('updates coordinates correctly by delegating to setters', () => {
      const state = new AppState(loadInitialState());
      state.centerLat = asLatitude(0);
      state.centerLon = asLongitude(0);

      state.pan(10, 20);
      expect(state.centerLat).toBe(10);
      expect(state.centerLon).toBe(20);

      // Test clamping via pan
      state.pan(100, 0);
      expect(state.centerLat).toBe(CONFIG.ENGINE.MAX_LATITUDE);

      // Test normalization via pan
      state.centerLon = asLongitude(170);
      state.pan(0, 20);
      expect(state.centerLon).toBe(-170);
    });
  });

  describe('events', () => {
    it('emits a change event when state properties are modified', () => {
      const config = loadInitialState();
      const state = new AppState(config);
      const callback = vi.fn();
      state.onChange(callback);

      state.centerLat = (state.centerLat + 1) as any;
      expect(callback).toHaveBeenCalledTimes(1);

      state.centerLon = (state.centerLon + 1) as any;
      expect(callback).toHaveBeenCalledTimes(2);

      state.scalingFactor = (state.scalingFactor + 10) as any;
      expect(callback).toHaveBeenCalledTimes(3);

      state.mapLayer = 'IMAGERY';
      expect(callback).toHaveBeenCalledTimes(4);

      state.renderMode = '2D';
      expect(callback).toHaveBeenCalledTimes(5);

      state.setHome();
      expect(callback).toHaveBeenCalledTimes(6);

      state.clearHome();
      expect(callback).toHaveBeenCalledTimes(7);

      state.pan(1, 1);
      expect(callback).toHaveBeenCalledTimes(9); // Pan calls both lat and lon setters
    });
  });
});
