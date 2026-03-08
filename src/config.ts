/**
 * Configuration constants for the Solunar Clock application
 */

export const CONFIG = {
  // Display dimensions
  WIDTH: 600,
  HEIGHT: 600,
  CENTER_X: 300,
  CENTER_Y: 300,
  RADIUS_FACTOR: 0.38, // Percentage of internal dimension for globe radius
  DEFAULT_SCALING_FACTOR: 30000, // 3000x zoom

  // Clock face
  SLICES: 24, // Number of hour slices
  SLICE_RESOLUTION: 80, // Segments for curved slices
  HAND_LENGTH_FACTOR: 0.9, // Percentage of radius for hand length
  LABEL_SPACING: 35, // Distance from edge for hour labels
  RIM_WIDTH: 8, // Width of the outer rim
  CENTER_MARK_RADIUS: 6,
  COMPASS_POINTS_COUNT: 8,
  COMPASS_INTERVAL_DEG: 45, // 360 / 8

  // Animation
  UPDATE_INTERVAL_MS: 1000, // 1Hz update for RPi Zero

  // Time simulation
  DEFAULT_TIME_SPEED: 1.0,

  // Map data sources (fallback chain)
  MAP_DATA_SOURCES: [
    'https://unpkg.com/topojson@3.0.2/world/110m.json',
    'https://unpkg.com/world-atlas@2.0.2/world/110m.json',
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
    'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/world/110m.json',
  ],

  // Astronomical constants
  J2000_EPOCH: new Date('2000-01-01T12:00:00Z'),
  
  ASTRONOMY: {
    // Sun Constants
    SUN_MEAN_LON_BASE: 280.459,
    SUN_MEAN_LON_RATE: 0.98564736,
    SUN_MEAN_ANOM_BASE: 357.529,
    SUN_MEAN_ANOM_RATE: 0.98560028,
    SUN_ECLIPTIC_LON_C1: 1.915,
    SUN_ECLIPTIC_LON_C2: 0.02,
    
    // Moon Constants (Simplified Series)
    MOON_MEAN_LON_BASE: 218.316,
    MOON_MEAN_LON_RATE: 13.176396,
    MOON_MEAN_ANOM_BASE: 134.963,
    MOON_MEAN_ANOM_RATE: 13.064993,
    MOON_MEAN_ELON_BASE: 297.85,
    MOON_MEAN_ELON_RATE: 12.190749,
    MOON_ECLIPTIC_LON_C1: 6.289,
    MOON_ECLIPTIC_LON_C2: 1.274,
    MOON_ECLIPTIC_LAT_C1: 5.128,

    // General Earth
    ECLIPTIC_OBLIQUITY_BASE: 23.439,
    ECLIPTIC_OBLIQUITY_RATE: 0.0000004,
  },

  // Location Constants
  HOME_LOCATION: {
    lat: 51.071,
    lon: -1.3451,
  },

  DEFAULT_LOCATION: {
    lat: 51.5074,
    lon: -0.1278,
  },

  MAX_LATITUDE: 85.0511, // Standard Web Mercator limit to avoid tile calculation issues

  // Animation settings
  ANIMATION_DURATION_MS: 800,
  ANIMATION_STEP_MS: 50, // Frequency of updates during transition (20fps)

  // Tile rendering
  TILE_WARPING_SUBDIVISIONS: 16, // 16x16 = 256 sub-tiles per tile in WARPED mode
  TILE_SIZE_PX: 256,
  TILE_FETCH_RANGE: 3, // Range 3 = 7x7 grid
  TILE_SCALE_BASE: 20, // Base scaling for zoom level calculation
  TILE_OVERLAP_PX: 1.0, // Overlap to prevent gaps

  // Search
  SEARCH_DEBOUNCE_MS: 300,
  SEARCH_ZOOM_LEVEL: 15,

  MIN_SCALING_FACTOR: 5, // 0.5x zoom
  MAX_SCALING_FACTOR: 1000000, // 100,000x zoom

  ATTRIBUTIONS: {
    IMAGERY: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    TOPOGRAPHIC: 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    STREETS: '© OpenStreetMap contributors'
  }
} as const;
