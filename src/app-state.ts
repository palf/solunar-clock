/**
 * Application state management
 */

import { CONFIG } from './config';
import type { TopoJSONData } from './types';

export class AppState {
  // Fixed internal coordinate system for consistent rendering math
  readonly width = CONFIG.WIDTH;
  readonly height = CONFIG.HEIGHT;
  readonly centerX = CONFIG.CENTER_X;
  readonly centerY = CONFIG.CENTER_Y;

  // Radius is a percentage of the internal dimension
  readonly radius = CONFIG.WIDTH * CONFIG.RADIUS_FACTOR;

  // Zoom scale (configurable)
  private _scalingFactor: number = CONFIG.DEFAULT_SCALING_FACTOR;

  // Map center position (Default: London)
  private _centerLat: number = CONFIG.DEFAULT_LOCATION.lat;
  private _centerLon: number = CONFIG.DEFAULT_LOCATION.lon;

  // Getters
  get scalingFactor(): number {
    return this._scalingFactor;
  }
  get centerLat(): number {
    return this._centerLat;
  }
  get centerLon(): number {
    return this._centerLon;
  }

  // Setters with NaN guards
  set scalingFactor(val: number) {
    if (Number.isFinite(val) && val > 0) this._scalingFactor = val;
  }
  set centerLat(val: number) {
    if (Number.isFinite(val)) {
      this._centerLat = Math.max(-CONFIG.MAX_LATITUDE, Math.min(CONFIG.MAX_LATITUDE, val));
    }
  }
  set centerLon(val: number) {
    if (Number.isFinite(val)) this._centerLon = val;
  }

  // Rotation (in degrees)
  rotation: number = 0;

  // Time simulation
  readonly startTime: Date = new Date();
  timeSpeedMultiplier: number = CONFIG.DEFAULT_TIME_SPEED;

  // Map Layer
  mapLayer: 'TOPOGRAPHIC' | 'IMAGERY' | 'STREETS' = 'TOPOGRAPHIC';
  tileWarping = false; // Toggle for mesh-based tile warping

  // Map data
  mapData: TopoJSONData | null = null;
  mapLoaded: boolean = false;

  // Computed scale for projection
  get scale(): number {
    return (this.radius / Math.PI) * this._scalingFactor;
  }

  // ========================================================================
  // STATE ACTIONS
  // ========================================================================

  /**
   * Reset the map to Winchester Home
   */
  resetToHome(): void {
    this.setLocation(CONFIG.HOME_LOCATION.lat, CONFIG.HOME_LOCATION.lon);
  }

  /**
   * Reset the map to London with default zoom
   */
  resetToLondon(): void {
    this.setLocation(51.5074, -0.1278);
    this.scalingFactor = 10;
  }

  /**
   * Set map center to specific coordinates
   */
  setLocation(lat: number, lon: number): void {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      this._centerLat = lat;
      this._centerLon = lon;
    }
  }

  /**
   * Adjust zoom level by a multiplier, clamping to bounds
   */
  adjustZoom(multiplier: number): void {
    if (!Number.isFinite(multiplier)) return;
    const minScale = 1;
    const maxScale = CONFIG.MAX_SCALING_FACTOR;
    this.scalingFactor = Math.max(minScale, Math.min(maxScale, this._scalingFactor * multiplier));
  }

  /**
   * Pan the map by a geographic offset
   */
  pan(dLat: number, dLon: number): void {
    if (!Number.isFinite(dLat) || !Number.isFinite(dLon)) return;
    this.centerLat = this._centerLat + dLat;
    this._centerLon = ((((this._centerLon + dLon + 180) % 360) + 360) % 360) - 180;
  }

  /**
   * Cycle through map layers
   */
  cycleLayer(): void {
    const layers: ('TOPOGRAPHIC' | 'IMAGERY' | 'STREETS')[] = [
      'TOPOGRAPHIC',
      'IMAGERY',
      'STREETS',
    ];
    const idx = layers.indexOf(this.mapLayer);
    this.mapLayer = layers[(idx + 1) % layers.length];
  }
}
