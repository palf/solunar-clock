import { asLongitude, asLatitude, asTimeMultiplier, asMilliseconds } from './types';

/**
 * Configuration constants for the Solunar Clock application.
 * Only values that are intended to be adjusted for hardware tuning, 
 * aesthetic preferences, or user defaults should reside here.
 */

export const CONFIG = {
  // Display & Scaling
  RADIUS_FACTOR: 0.40, // Percentage of viewport for globe radius
  DEFAULT_SCALING_FACTOR: 30000, // Default zoom level multiplier
  MIN_SCALING_FACTOR: 5, // 0.5x zoom
  MAX_SCALING_FACTOR: 1000000, // 100,000x zoom
  MAX_LATITUDE: 85.0511, // Web Mercator limit

  // Aesthetics
  HAND_LENGTH_FACTOR: 0.9, // Percentage of radius for hand length
  LABEL_SPACING: 35, // Distance from edge for hour labels
  RIM_WIDTH: 8, // Width of the outer rim
  CENTER_MARK_RADIUS: 6,

  // Performance
  UPDATE_INTERVAL_MS: asMilliseconds(1000), // 1Hz update for RPi Zero
  TILE_FETCH_RANGE: 3, // Range 3 = 7x7 grid
  TILE_WARPING_SUBDIVISIONS: 16, // Quality vs Performance for 3D mode

  // Time simulation
  DEFAULT_TIME_SPEED: asTimeMultiplier(1.0),

  // London
  DEFAULT_LOCATION: {
    lat: asLatitude(51.5074),
    lon: asLongitude(-0.1278),
  },

  // UI Behavior
  ANIMATION_DURATION_MS: asMilliseconds(800),
  ANIMATION_STEP_MS: asMilliseconds(50),
  SEARCH_DEBOUNCE_MS: asMilliseconds(300),
  SEARCH_ZOOM_LEVEL: 15,

  // Data
  MAP_DATA_SOURCES: [
    'https://unpkg.com/topojson@3.0.2/world/110m.json',
    'https://unpkg.com/world-atlas@2.0.2/world/110m.json',
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
    'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/world/110m.json',
  ],
};
