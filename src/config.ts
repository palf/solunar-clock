/**
 * Configuration constants for the Solunar Clock application.
 * Only values that are intended to be adjusted for hardware tuning, 
 * aesthetic preferences, or user defaults should reside here.
 */

export const CONFIG = {
  // Display & Scaling
  RADIUS_FACTOR: 0.38, // Percentage of viewport for globe radius
  DEFAULT_SCALING_FACTOR: 30000, // Default zoom level multiplier
  MIN_SCALING_FACTOR: 5, // 0.5x zoom
  MAX_SCALING_FACTOR: 1000000, // 100,000x zoom

  // Aesthetics
  HAND_LENGTH_FACTOR: 0.9, // Percentage of radius for hand length
  LABEL_SPACING: 35, // Distance from edge for hour labels
  RIM_WIDTH: 8, // Width of the outer rim
  CENTER_MARK_RADIUS: 6,

  // Performance
  UPDATE_INTERVAL_MS: 1000, // 1Hz update for RPi Zero
  TILE_FETCH_RANGE: 3, // Range 3 = 7x7 grid
  TILE_WARPING_SUBDIVISIONS: 16, // Quality vs Performance for 3D mode

  // Time simulation
  DEFAULT_TIME_SPEED: 1.0,

  // User Defaults
  HOME_LOCATION: {
    lat: 51.071,
    lon: -1.3451,
  },

  // UI Behavior
  ANIMATION_DURATION_MS: 800,
  ANIMATION_STEP_MS: 50,
  SEARCH_DEBOUNCE_MS: 300,
  SEARCH_ZOOM_LEVEL: 15,

  // Data
  MAP_DATA_SOURCES: [
    'https://unpkg.com/topojson@3.0.2/world/110m.json',
    'https://unpkg.com/world-atlas@2.0.2/world/110m.json',
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
    'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/world/110m.json',
  ],

  ATTRIBUTIONS: {
    IMAGERY: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    TOPOGRAPHIC: 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    STREETS: '© OpenStreetMap contributors'
  }
} as const;
