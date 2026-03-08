/**
 * Application state management.
 * Internalizes fixed coordinate constants while utilizing CONFIG for user preferences.
 */

import { CONFIG } from './config';
import type { TopoJSONData } from './types';

export interface AppStateConfig {
  centerLat: number;
  centerLon: number;
  scalingFactor: number;
  mapLayer: 'STREETS' | 'TOPOGRAPHIC' | 'IMAGERY';
  homeLocation: { lat: number; lon: number } | null;
}

export class AppState {
  // Fixed internal coordinate system for consistent rendering math
  readonly width = 600;
  readonly height = 600;
  readonly centerX = 300;
  readonly centerY = 300;

  // Radius is a percentage of the internal dimension
  readonly radius = 600 * CONFIG.RADIUS_FACTOR;

  // Zoom scale (configurable)
  private _scalingFactor: number;

  // Map center position
  private _centerLat: number;
  private _centerLon: number;

  // Time simulation
  readonly startTime: Date = new Date();
  timeSpeedMultiplier: number = CONFIG.DEFAULT_TIME_SPEED;

  // Map Layer
  mapLayer: 'STREETS' | 'TOPOGRAPHIC' | 'IMAGERY';
  renderMode: '2D' | '3D' = '3D'; // 2D = Canvas Quad Grid, 3D = WebGL Vertex Warp

  // Dynamic Home Location
  private _homeLocation: { lat: number; lon: number } | null;

  // Map data
  mapData: TopoJSONData | null = null;

  /**
   * Load the initial state from storage or defaults.
   */
  static loadInitialState(): AppStateConfig {
    const config: AppStateConfig = {
      centerLat: 51.5074, // Default London
      centerLon: -0.1278,
      scalingFactor: CONFIG.DEFAULT_SCALING_FACTOR,
      mapLayer: 'STREETS',
      homeLocation: null,
    };

    if (typeof localStorage === 'undefined') return config;

    try {
      // 1. Load Home
      const storedHome = localStorage.getItem('solunar-clock-home');
      if (storedHome) {
        const parsed = JSON.parse(storedHome);
        const MAX_LAT = 85.0511;
        if (
          parsed &&
          typeof parsed.lat === 'number' &&
          typeof parsed.lon === 'number' &&
          !Number.isNaN(parsed.lat) &&
          !Number.isNaN(parsed.lon) &&
          Math.abs(parsed.lat) <= MAX_LAT
        ) {
          config.homeLocation = parsed;
          config.centerLat = parsed.lat;
          config.centerLon = parsed.lon;
        }
      }

      // 2. Load Zoom
      const storedZoom = localStorage.getItem('solunar-clock-zoom');
      if (storedZoom) {
        const val = parseFloat(storedZoom);
        if (
          !Number.isNaN(val) &&
          val >= CONFIG.MIN_SCALING_FACTOR &&
          val <= CONFIG.MAX_SCALING_FACTOR
        ) {
          config.scalingFactor = val;
        }
      }

      // 3. Load Layer
      const storedLayer = localStorage.getItem('solunar-clock-layer');
      if (
        storedLayer === 'STREETS' ||
        storedLayer === 'TOPOGRAPHIC' ||
        storedLayer === 'IMAGERY'
      ) {
        config.mapLayer = storedLayer;
      }
    } catch (e) {
      console.warn('Failed to load state from storage', e);
    }

    return config;
  }

  constructor(config: AppStateConfig) {
    this._centerLat = config.centerLat;
    this._centerLon = config.centerLon;
    this._scalingFactor = config.scalingFactor;
    this.mapLayer = config.mapLayer;
    this._homeLocation = config.homeLocation;
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
      this.saveState();
    }
  }
  set centerLat(val: number) {
    if (Number.isFinite(val)) {
      const MAX_LAT = 85.0511;
      this._centerLat = Math.max(-MAX_LAT, Math.min(MAX_LAT, val));
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

  private saveState(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('solunar-clock-zoom', this._scalingFactor.toString());
    localStorage.setItem('solunar-clock-layer', this.mapLayer);
  }

  setHome(): void {
    this._homeLocation = { lat: this._centerLat, lon: this._centerLon };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'solunar-clock-home',
        JSON.stringify(this._homeLocation)
      );
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

  setLocation(lat: number, lon: number): void {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      this.centerLat = lat;
      this.centerLon = lon;
    }
  }

  adjustZoom(multiplier: number): void {
    if (!Number.isFinite(multiplier)) return;
    this.scalingFactor = Math.max(
      CONFIG.MIN_SCALING_FACTOR,
      Math.min(CONFIG.MAX_SCALING_FACTOR, this._scalingFactor * multiplier)
    );
  }

  pan(dLat: number, dLon: number): void {
    if (!Number.isFinite(dLat) || !Number.isFinite(dLon)) return;
    this.centerLat = this._centerLat + dLat;
    this._centerLon = ((((this._centerLon + dLon + 180) % 360) + 360) % 360) - 180;
  }

  cycleLayer(): void {
    const layers: ('STREETS' | 'TOPOGRAPHIC' | 'IMAGERY')[] = [
      'STREETS',
      'TOPOGRAPHIC',
      'IMAGERY',
    ];
    const idx = layers.indexOf(this.mapLayer);
    this.mapLayer = layers[(idx + 1) % layers.length];
    this.saveState();
  }
}
