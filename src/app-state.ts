/**
 * Application state management.
 * Internalizes fixed coordinate constants while utilizing CONFIG for user preferences.
 */

import { normalizeLongitude } from './astronomy';
import { CONFIG } from './config';
import {
  asLatitude,
  asLongitude,
  asScale,
  type Latitude,
  type Longitude,
  type Scale,
  type TimeMultiplier,
  type TopoJSONData,
} from './types';

export interface AppStateConfig {
  centerLat: Latitude;
  centerLon: Longitude;
  scalingFactor: number;
  mapLayer: 'STREETS' | 'TOPOGRAPHIC' | 'IMAGERY';
  homeLocation: { lat: Latitude; lon: Longitude } | null;
}

export class AppState {
  // Fixed internal coordinate system for consistent rendering math
  readonly width = CONFIG.INTERNAL_WIDTH;
  readonly height = CONFIG.INTERNAL_HEIGHT;
  readonly centerX = CONFIG.INTERNAL_CENTER_X;
  readonly centerY = CONFIG.INTERNAL_CENTER_Y;

  // Radius is a percentage of the internal dimension
  readonly radius = CONFIG.INTERNAL_WIDTH * CONFIG.RADIUS_FACTOR;

  // Zoom scale (configurable)
  private _scalingFactor: number;

  // Map center position
  private _centerLat: Latitude;
  private _centerLon: Longitude;

  // Time simulation
  readonly startTime: Date = new Date();
  timeSpeedMultiplier: TimeMultiplier = CONFIG.DEFAULT_TIME_SPEED;

  // Map Layer
  mapLayer: 'STREETS' | 'TOPOGRAPHIC' | 'IMAGERY';
  renderMode: '2D' | '3D' = '3D'; // 2D = Canvas Quad Grid, 3D = WebGL Vertex Warp

  // Dynamic Home Location
  private _homeLocation: { lat: Latitude; lon: Longitude } | null;

  // Map data
  mapData: TopoJSONData | null = null;

  /**
   * Load the initial state from storage or defaults.
   */
  static loadInitialState(): AppStateConfig {
    const config: AppStateConfig = {
      centerLat: CONFIG.DEFAULT_LOCATION.lat,
      centerLon: CONFIG.DEFAULT_LOCATION.lon,
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
        if (
          parsed &&
          typeof parsed.lat === 'number' &&
          typeof parsed.lon === 'number' &&
          !Number.isNaN(parsed.lat) &&
          !Number.isNaN(parsed.lon) &&
          Math.abs(parsed.lat) <= CONFIG.MAX_LATITUDE
        ) {
          config.homeLocation = {
            lat: asLatitude(parsed.lat),
            lon: asLongitude(parsed.lon),
          };
          config.centerLat = config.homeLocation.lat;
          config.centerLon = config.homeLocation.lon;
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
      if (storedLayer === 'STREETS' || storedLayer === 'TOPOGRAPHIC' || storedLayer === 'IMAGERY') {
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
  get centerLat(): Latitude {
    return this._centerLat;
  }
  get centerLon(): Longitude {
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
  set centerLat(val: Latitude) {
    if (Number.isFinite(val)) {
      this._centerLat = asLatitude(
        Math.max(-CONFIG.MAX_LATITUDE, Math.min(CONFIG.MAX_LATITUDE, val))
      );
    }
  }
  set centerLon(val: Longitude) {
    if (Number.isFinite(val)) this._centerLon = val;
  }

  // Computed scale for projection
  get scale(): Scale {
    return asScale((this.radius / Math.PI) * this._scalingFactor);
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
    return (
      Math.abs(this._centerLat - this._homeLocation.lat) < CONFIG.HOME_TOLERANCE &&
      Math.abs(this._centerLon - this._homeLocation.lon) < CONFIG.HOME_TOLERANCE
    );
  }

  setLocation(lat: Latitude, lon: Longitude): void {
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
    const newLat = Math.max(
      -CONFIG.MAX_LATITUDE,
      Math.min(CONFIG.MAX_LATITUDE, this._centerLat + dLat)
    );
    this.centerLat = asLatitude(newLat);
    this._centerLon = normalizeLongitude(this._centerLon + dLon);
  }

  cycleLayer(): void {
    const layers: ('STREETS' | 'TOPOGRAPHIC' | 'IMAGERY')[] = ['STREETS', 'TOPOGRAPHIC', 'IMAGERY'];
    const idx = layers.indexOf(this.mapLayer);
    this.mapLayer = layers[(idx + 1) % layers.length];
    this.saveState();
  }
}
