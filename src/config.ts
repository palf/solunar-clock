/**
 * Configuration constants for the Solunar Clock application
 */

export const CONFIG = {
  // Display dimensions
  WIDTH: 820,
  HEIGHT: 820,
  RADIUS_FACTOR: 0.40, // Percentage of width/height for globe radius
  SCALING_FACTOR: 40, // Zoom level multiplier
  
  // Clock face
  SLICES: 24, // Number of hour slices
  HAND_LENGTH_FACTOR: 0.85, // Percentage of radius for hand length
  LABEL_SPACING: 35, // Distance from edge for hour labels
  TZ_LABEL_SPACING: 15, // Distance from edge for timezone labels
  
  // Animation
  UPDATE_INTERVAL_MS: 16, // ~60fps
  
  // Time simulation
  DEFAULT_TIME_SPEED: 1.0,
  MIN_TIME_SPEED: 0,
  MAX_TIME_SPEED: 1000,
  
  // Map data sources (fallback chain)
  MAP_DATA_SOURCES: [
    "https://unpkg.com/world-atlas@2.0.2/world/110m.json",
    "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/world/110m.json",
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
    "https://unpkg.com/topojson@3.0.2/world/110m.json"
  ],
  
  // Astronomical constants
  J2000_EPOCH: new Date('2000-01-01T12:00:00Z'),
} as const;

