import { asLongitude, asLatitude, asTimeMultiplier, asMilliseconds } from './types';

/**
 * Configuration constants for the Solunar Clock application.
 * Only values that are intended to be adjusted for hardware tuning, 
 * aesthetic preferences, or user defaults should reside here.
 */

export const CONFIG = {
  // Internal Coordinate System
  INTERNAL_WIDTH: 600,
  INTERNAL_HEIGHT: 600,
  INTERNAL_CENTER_X: 300,
  INTERNAL_CENTER_Y: 300,

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
  CENTER_MARK_COLOR: '#222222',
  ARM_WIDTH: 2,

  // HUD Colors
  COLOR_ACTIVE: '#4ade80',
  COLOR_DANGER: '#ef4444',
  COLOR_ACCENT: 'var(--accent)',
  COLOR_TEXT_DIM: 'var(--text-dim)',
  COLOR_BORDER: 'var(--border)',

  // Sun Aesthetics
  SUN_COLOR_PRIMARY: '#fbbf24',
  SUN_COLOR_SECONDARY: '#f59e0b',
  SUN_ARM_COLOR: 'rgba(255, 165, 0, 0.3)',
  SUN_RADIUS: 10,
  SUN_RAY_COUNT: 8,
  SUN_RAY_START: -12,
  SUN_RAY_END: -16,
  SUN_STROKE_WIDTH: 2,

  // Moon Aesthetics
  MOON_COLOR_PRIMARY: '#f1f5f9',
  MOON_COLOR_SECONDARY: '#38bdf8',
  MOON_ARM_COLOR: 'rgba(56, 189, 248, 0.3)',
  MOON_PATH: 'M -6 -8 A 10 10 0 1 1 -6 8 A 8 8 0 1 0 -6 -8',
  MOON_STROKE_WIDTH: 1,

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
  SEARCH_RESULT_LIMIT: 5,
  SEARCH_MIN_QUERY: 3,
  ZOOM_DISPLAY_MULTIPLIER: 10,
  MIN_ZOOM_INPUT: 0.05,
  HOME_TOLERANCE: 0.0001,
  NOMINATIM_API_URL: 'https://nominatim.openstreetmap.org/search',

  // Keyboard Shortcuts
  KEYBOARD_ZOOM_FACTOR: 1.1,
  KEYBOARD_PAN_SENSITIVITY: 10,
  SHIFT_MULTIPLIER: 10,

  // Touch & Wheel Interaction
  WHEEL_ZOOM_FACTOR: 1.1,
  TOUCH_PAN_SENSITIVITY: 0.1,
  TOUCH_PAN_DIVISOR: 10,
  TOUCH_MIN_SCALE: 1,

  // Data
  MAP_DATA_SOURCES: [
    'https://unpkg.com/topojson@3.0.2/world/110m.json',
    'https://unpkg.com/world-atlas@2.0.2/world/110m.json',
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
    'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/world/110m.json',
  ],

  // Rendering Colors
  COLOR_MAP_BG: '#0f172a',
  COLOR_EMPTY_SPACE: '#0d1729', // WebGL clear color

  // Tile Subdivision
  TILE_SUBDIVISIONS_2D: 4,
  TILE_SUBDIVISIONS_3D: 8,
};
