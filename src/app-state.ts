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

  // Map center position
  private _centerLat: number;
  private _centerLon: number;

  // Time simulation
  readonly startTime: Date = new Date();
  timeSpeedMultiplier: number = CONFIG.DEFAULT_TIME_SPEED;

  // Map Layer
  mapLayer: 'TOPOGRAPHIC' | 'IMAGERY' | 'STREETS' = 'TOPOGRAPHIC';
  renderMode: '2D' | '3D' = '3D'; // 2D = Canvas Quad Grid, 3D = WebGL Vertex Warp

  // Dynamic Home Location
  private _homeLocation: { lat: number; lon: number } | null = null;

  // Map data
  mapData: TopoJSONData | null = null;

  constructor() {
    // 1. Start with hardcoded defaults
    this._centerLat = CONFIG.DEFAULT_LOCATION.lat;
    this._centerLon = CONFIG.DEFAULT_LOCATION.lon;

    // 2. Load from storage (overrides defaults if they exist)
    this.loadState();
  }

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
  get homeLocation() {
    return this._homeLocation;
  }

  // Setters with NaN guards
  set scalingFactor(val: number) {
    if (Number.isFinite(val) && val > 0) {
      this._scalingFactor = val;
      this.saveState(); // Persist zoom change
    }
  }
  set centerLat(val: number) {
    if (Number.isFinite(val)) {
      this._centerLat = Math.max(-CONFIG.MAX_LATITUDE, Math.min(CONFIG.MAX_LATITUDE, val));
    }
  }
  set centerLon(val: number) {
    if (Number.isFinite(val)) this._centerLon = val;
  }

  // Computed scale for projection
  get scale(): number {
    return (this.radius / Math.PI) * this._scalingFactor;
  }

  // ========================================================================
  // STATE ACTIONS
  // ========================================================================

  /**
   * Load all persistent state (home and zoom)
   */
  private loadState(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      // Load Home
      const storedHome = localStorage.getItem('solunar-clock-home');
      if (storedHome) {
        this._homeLocation = JSON.parse(storedHome);
        if (this._homeLocation) {
          this._centerLat = this._homeLocation.lat;
          this._centerLon = this._homeLocation.lon;
        }
      }

      // Load Zoom
      const storedZoom = localStorage.getItem('solunar-clock-zoom');
      if (storedZoom) {
        const val = parseFloat(storedZoom);
        if (!Number.isNaN(val) && val > 0) {
          this._scalingFactor = val;
        }
      }
    } catch (e) {
      console.warn('Failed to load state from storage', e);
    }
  }

  /**
   * Persist specific state items
   */
  private saveState(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('solunar-clock-zoom', this._scalingFactor.toString());
  }

  setHome(): void {
    this._homeLocation = { lat: this._centerLat, lon: this._centerLon };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('solunar-clock-home', JSON.stringify(this._homeLocation));
    }
  }

  clearHome(): void {
    this._homeLocation = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('solunar-clock-home');
    }
  }

  isAtHome(): boolean {
    if (!this._homeLocation) return false;
    const tolerance = 0.0001;
    return (
      Math.abs(this._centerLat - this._homeLocation.lat) < tolerance &&
      Math.abs(this._centerLon - this._homeLocation.lon) < tolerance
    );
  }

  /**
   * Set map center to specific coordinates
   */
  setLocation(lat: number, lon: number): void {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      this.centerLat = lat;
      this.centerLon = lon;
    }
  }

  /**
   * Adjust zoom level by a multiplier, clamping to bounds
   */
  adjustZoom(multiplier: number): void {
    if (!Number.isFinite(multiplier)) return;
    const minScale = CONFIG.MIN_SCALING_FACTOR;
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
    const layers: ('TOPOGRAPHIC' | 'IMAGERY' | 'STREETS')[] = ['TOPOGRAPHIC', 'IMAGERY', 'STREETS'];
    const idx = layers.indexOf(this.mapLayer);
    this.mapLayer = layers[(idx + 1) % layers.length];
  }
}
