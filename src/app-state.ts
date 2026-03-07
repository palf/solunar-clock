/**
 * Application state management
 */

import { CONFIG } from './config';
import type { TopoJSONData } from './types';

export class AppState {
  // Display dimensions
  readonly width = CONFIG.WIDTH;
  readonly height = CONFIG.HEIGHT;
  readonly centerX = CONFIG.WIDTH / 2;
  readonly centerY = CONFIG.HEIGHT / 2;
  readonly radius = Math.min(CONFIG.WIDTH, CONFIG.HEIGHT) * 0.38;

  // Zoom scale (configurable)
  scalingFactor: number = CONFIG.DEFAULT_SCALING_FACTOR;

  // Map center position (Default: London)
  centerLat: number = 51.5074;
  centerLon: number = -0.1278;

  // Rotation (in degrees)
  rotation: number = 0;

  // Time simulation
  readonly startTime: Date = new Date();
  timeSpeedMultiplier: number = CONFIG.DEFAULT_TIME_SPEED;

  // Map Layer
  mapLayer: 'TERRAIN' | 'SATELLITE' | 'LOGISTICAL' = 'TERRAIN';

  // Map data
  mapData: TopoJSONData | null = null;
  mapLoaded: boolean = false;

  // Computed scale for projection
  get scale(): number {
    return (this.radius / Math.PI) * this.scalingFactor;
  }

  // ========================================================================
  // STATE ACTIONS
  // ========================================================================

  /**
   * Reset the map to London with default zoom
   */
  resetToLondon(): void {
    this.centerLat = 51.5074;
    this.centerLon = -0.1278;
    this.scalingFactor = 10;
  }

  /**
   * Set map center to specific coordinates
   */
  setLocation(lat: number, lon: number): void {
    this.centerLat = lat;
    this.centerLon = lon;
  }

  /**
   * Adjust zoom level by a multiplier, clamping to bounds
   */
  adjustZoom(multiplier: number): void {
    const minScale = 1;
    const maxScale = 1000;
    this.scalingFactor = Math.max(minScale, Math.min(maxScale, this.scalingFactor * multiplier));
  }

  /**
   * Pan the map by a geographic offset
   */
  pan(dLat: number, dLon: number): void {
    this.centerLat = Math.max(-90, Math.min(90, this.centerLat + dLat));
    this.centerLon = ((((this.centerLon + dLon + 180) % 360) + 360) % 360) - 180;
  }

  /**
   * Cycle through map layers
   */
  cycleLayer(): void {
    const layers: ('TERRAIN' | 'SATELLITE' | 'LOGISTICAL')[] = [
      'TERRAIN',
      'SATELLITE',
      'LOGISTICAL',
    ];
    const idx = layers.indexOf(this.mapLayer);
    this.mapLayer = layers[(idx + 1) % layers.length];
  }
}
