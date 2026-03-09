import { asLatitude, asLongitude, asMilliseconds, asScale, asTimeMultiplier } from './types';

/**
 * Configuration for the Solunar Clock application.
 * Values are grouped by domain to improve discoverability and maintainability.
 */
export const CONFIG = {
  // Core technical constants defining the internal coordinate system
  ENGINE: {
    INTERNAL_WIDTH: 600,
    INTERNAL_HEIGHT: 600,
    INTERNAL_CENTER_X: 300,
    INTERNAL_CENTER_Y: 300,
    // MAX_LATITUDE: 85.0511, // Web Mercator limit
    MAX_LATITUDE: 90,
    HOME_TOLERANCE: 0.0001,
  },

  // Visual scaling and layout
  DISPLAY: {
    RADIUS_FACTOR: 0.4, // Percentage of internal width
    DEFAULT_SCALING_FACTOR: asScale(30000),
    MIN_SCALING_FACTOR: asScale(5),
    MAX_SCALING_FACTOR: asScale(1000000),
    ZOOM_DISPLAY_MULTIPLIER: 10,
    MIN_ZOOM_INPUT: 0.05,
  },

  // Visual preferences
  AESTHETICS: {
    GLOBAL: {
      LABEL_SPACING: 35,
      RIM_WIDTH: 8,
      CENTER_MARK_RADIUS: 6,
      CENTER_MARK_COLOR: '#222222',
      ARM_WIDTH: 2,
    },
    SUN: {
      PRIMARY_COLOR: '#fbbf24',
      SECONDARY_COLOR: '#f59e0b',
      ARM_COLOR: 'rgba(255, 165, 0, 0.3)',
      RADIUS: 10,
      RAY_COUNT: 8,
      RAY_START: -12,
      RAY_END: -16,
      STROKE_WIDTH: 2,
    },
    MOON: {
      PRIMARY_COLOR: '#f1f5f9',
      SECONDARY_COLOR: '#38bdf8',
      ARM_COLOR: 'rgba(56, 189, 248, 0.3)',
      PATH: 'M -6 -8 A 10 10 0 1 1 -6 8 A 8 8 0 1 0 -6 -8',
      STROKE_WIDTH: 1,
    },
  },

  // Performance and hardware tuning
  PERFORMANCE: {
    UPDATE_INTERVAL_MS: asMilliseconds(16),
    TILE_FETCH_RANGE: 3,
    TILE_SUBDIVISIONS_2D: 4,
    TILE_SUBDIVISIONS_3D: 8,
    TILE_WARPING_SUBDIVISIONS: 16,
  },

  // Input behavior
  INTERACTION: {
    KEYBOARD: {
      ZOOM_FACTOR: 1.1,
      PAN_SENSITIVITY: 10,
      SHIFT_MULTIPLIER: 10,
    },
    TOUCH: {
      WHEEL_ZOOM_FACTOR: 1.1,
      PAN_SENSITIVITY: 0.1,
      PAN_DIVISOR: 10,
      MIN_SCALE: 1,
    },
    SEARCH: {
      DEBOUNCE_MS: asMilliseconds(300),
      RESULT_LIMIT: 5,
      MIN_QUERY_LENGTH: 3,
      NOMINATIM_URL: 'https://nominatim.openstreetmap.org/search',
    },
  },

  // Simulation defaults
  SIMULATION: {
    DEFAULT_TIME_SPEED: asTimeMultiplier(1.0),
    MIN_TIME_RATIO: 1,
    MAX_TIME_RATIO: 1000000,
  },

  // Geodata
  DATA: {
    DEFAULT_LOCATION: {
      lat: asLatitude(51.5074),
      lon: asLongitude(-0.1278),
    },
    MAP_SOURCES: [
      'https://unpkg.com/topojson@3.0.2/world/110m.json',
      'https://unpkg.com/world-atlas@2.0.2/world/110m.json',
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
      'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/world/110m.json',
    ],
  },

  // HUD Theming
  THEME: {
    COLOR_ACTIVE: '#4ade80',
    COLOR_DANGER: '#ef4444',
    COLOR_ACCENT: 'var(--accent)',
    COLOR_TEXT_DIM: 'var(--text-dim)',
    COLOR_BORDER: 'var(--border)',
    COLOR_MAP_BG: '#0f172a',
    COLOR_EMPTY_SPACE: '#0d1729',
  },
} as const;
