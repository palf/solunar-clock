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

  it('defaults to TERRAIN layer', () => {
    const state = new AppState();
    expect(state.mapLayer).toBe('TERRAIN');
  });
});
