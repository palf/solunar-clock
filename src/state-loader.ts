/**
 * Utility for loading application state from persistence (localStorage)
 */

import type { AppStateConfig } from './app-state';
import { CONFIG } from './config';
import { asLatitude, asLongitude, asScale, asTimeMultiplier } from './types';

export function loadInitialState(): AppStateConfig {
  const config: AppStateConfig = {
    centerLat: CONFIG.DATA.DEFAULT_LOCATION.lat,
    centerLon: CONFIG.DATA.DEFAULT_LOCATION.lon,
    scalingFactor: asScale(CONFIG.DISPLAY.DEFAULT_SCALING_FACTOR),
    timeSpeedMultiplier: CONFIG.SIMULATION.DEFAULT_TIME_SPEED,
    mapLayer: 'STREETS',
    homeLocation: null,
  };

  if (typeof localStorage === 'undefined') return config;

  try {
    // 1. Load Home
    const storedHome = localStorage.getItem('solunar-clock-home');
    if (storedHome) {
      const parsed = JSON.parse(storedHome);
      if (
        parsed &&
        typeof parsed.lat === 'number' &&
        typeof parsed.lon === 'number' &&
        !Number.isNaN(parsed.lat) &&
        !Number.isNaN(parsed.lon) &&
        Math.abs(parsed.lat) <= CONFIG.ENGINE.MAX_LATITUDE
      ) {
        config.homeLocation = {
          lat: asLatitude(parsed.lat),
          lon: asLongitude(parsed.lon),
        };
        config.centerLat = config.homeLocation.lat;
        config.centerLon = config.homeLocation.lon;
      }
    }

    // 2. Load Zoom
    const storedZoom = localStorage.getItem('solunar-clock-zoom');
    if (storedZoom) {
      const val = parseFloat(storedZoom);
      if (
        !Number.isNaN(val) &&
        val >= CONFIG.DISPLAY.MIN_SCALING_FACTOR &&
        val <= CONFIG.DISPLAY.MAX_SCALING_FACTOR
      ) {
        config.scalingFactor = asScale(val);
      }
    }

    // 3. Load Time Ratio
    const storedTimeRatio = localStorage.getItem('solunar-clock-time-ratio');
    if (storedTimeRatio) {
      const val = parseInt(storedTimeRatio, 10);
      if (
        !Number.isNaN(val) &&
        val >= CONFIG.SIMULATION.MIN_TIME_RATIO &&
        val <= CONFIG.SIMULATION.MAX_TIME_RATIO
      ) {
        config.timeSpeedMultiplier = asTimeMultiplier(val);
      }
    }

    // 4. Load Layer
    const storedLayer = localStorage.getItem('solunar-clock-layer');
    if (storedLayer === 'STREETS' || storedLayer === 'TOPOGRAPHIC' || storedLayer === 'IMAGERY') {
      config.mapLayer = storedLayer;
    }
  } catch (e) {
    console.warn('Failed to load state from storage', e);
  }

  return config;
}
