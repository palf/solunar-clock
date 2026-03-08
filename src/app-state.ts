/**
 * Application state management.
 * Internalizes fixed coordinate constants while utilizing CONFIG for user preferences.
 */

import { normalizeLongitude } from './astronomy';
import { CONFIG } from './config';
import {
  asLatitude,
  asScale,
  type Latitude,
  type Longitude,
  type MapLayer,
  type Scale,
  type TimeMultiplier,
  type TopoJSONData,
} from './types';

export interface AppStateConfig {
  centerLat: Latitude;
  centerLon: Longitude;
  scalingFactor: Scale;
  timeSpeedMultiplier: TimeMultiplier;
  mapLayer: MapLayer;
  homeLocation: { lat: Latitude; lon: Longitude } | null;
}

export class AppState {
  // Fixed internal coordinate system for consistent rendering math
  readonly width = CONFIG.ENGINE.INTERNAL_WIDTH;
  readonly height = CONFIG.ENGINE.INTERNAL_HEIGHT;
  readonly centerX = CONFIG.ENGINE.INTERNAL_CENTER_X;
  readonly centerY = CONFIG.ENGINE.INTERNAL_CENTER_Y;

  // Radius is a percentage of the internal dimension
  readonly radius = CONFIG.ENGINE.INTERNAL_WIDTH * CONFIG.DISPLAY.RADIUS_FACTOR;

  // Zoom scale (configurable)
  private _scalingFactor: Scale;

  // Map center position
  private _centerLat: Latitude;
  private _centerLon: Longitude;

  // Time simulation
  readonly startTime: Date = new Date();
  private _timeSpeedMultiplier: TimeMultiplier;

  // Map Layer
  private _mapLayer: MapLayer;
  private _renderMode: '2D' | '3D' = '3D'; // 2D = Canvas Quad Grid, 3D = WebGL Vertex Warp

  // Dynamic Home Location
  private _homeLocation: { lat: Latitude; lon: Longitude } | null;

  // Map data
  mapData: TopoJSONData | null = null;

  // Event Listeners
  private changeListeners: Array<() => void> = [];

  constructor(config: AppStateConfig) {
    this._centerLat = config.centerLat;
    this._centerLon = config.centerLon;
    this._scalingFactor = config.scalingFactor;
    this._timeSpeedMultiplier = config.timeSpeedMultiplier;
    this._mapLayer = config.mapLayer;
    this._homeLocation = config.homeLocation;
  }

  // Getters
  get scalingFactor(): Scale {
    return this._scalingFactor;
  }
  get centerLat(): Latitude {
    return this._centerLat;
  }
  get centerLon(): Longitude {
    return this._centerLon;
  }
  get timeSpeedMultiplier(): TimeMultiplier {
    return this._timeSpeedMultiplier;
  }
  get homeLocation() {
    return this._homeLocation;
  }
  get mapLayer(): MapLayer {
    return this._mapLayer;
  }

  // Setters with NaN guards
  set scalingFactor(val: Scale) {
    if (Number.isFinite(val) && val > 0 && val !== this._scalingFactor) {
      this._scalingFactor = val;
      this.saveState();
      this.emitChange();
    }
  }
  set centerLat(val: Latitude) {
    const clamped = asLatitude(
      Math.max(-CONFIG.ENGINE.MAX_LATITUDE, Math.min(CONFIG.ENGINE.MAX_LATITUDE, val))
    );
    if (Number.isFinite(val) && clamped !== this._centerLat) {
      this._centerLat = clamped;
      this.emitChange();
    }
  }
  set centerLon(val: Longitude) {
    if (Number.isFinite(val) && val !== this._centerLon) {
      this._centerLon = val;
      this.emitChange();
    }
  }
  set timeSpeedMultiplier(val: TimeMultiplier) {
    if (
      Number.isFinite(val) &&
      val >= CONFIG.SIMULATION.MIN_TIME_RATIO &&
      val <= CONFIG.SIMULATION.MAX_TIME_RATIO &&
      val !== this._timeSpeedMultiplier
    ) {
      this._timeSpeedMultiplier = val;
      this.saveState();
      this.emitChange();
    }
  }
  set mapLayer(val: MapLayer) {
    if (val !== this._mapLayer) {
      this._mapLayer = val;
      this.saveState();
      this.emitChange();
    }
  }

  get renderMode(): '2D' | '3D' {
    return this._renderMode;
  }
  set renderMode(val: '2D' | '3D') {
    if (val !== this._renderMode) {
      this._renderMode = val;
      this.emitChange();
    }
  }

  // Event methods
  onChange(callback: () => void): void {
    this.changeListeners.push(callback);
  }

  private emitChange(): void {
    for (const listener of this.changeListeners) {
      listener();
    }
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
    localStorage.setItem('solunar-clock-time-ratio', this._timeSpeedMultiplier.toString());
  }

  setHome(): void {
    this._homeLocation = { lat: this._centerLat, lon: this._centerLon };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('solunar-clock-home', JSON.stringify(this._homeLocation));
    }
    this.emitChange();
  }

  clearHome(): void {
    this._homeLocation = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('solunar-clock-home');
    }
    this.emitChange();
  }

  isAtHome(): boolean {
    if (!this._homeLocation) return false;
    return (
      Math.abs(this._centerLat - this._homeLocation.lat) < CONFIG.ENGINE.HOME_TOLERANCE &&
      Math.abs(this._centerLon - this._homeLocation.lon) < CONFIG.ENGINE.HOME_TOLERANCE
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
    this.scalingFactor = asScale(
      Math.max(
        CONFIG.DISPLAY.MIN_SCALING_FACTOR,
        Math.min(CONFIG.DISPLAY.MAX_SCALING_FACTOR, this._scalingFactor * multiplier)
      )
    );
  }

  pan(dLat: number, dLon: number): void {
    if (!Number.isFinite(dLat) || !Number.isFinite(dLon)) return;
    const newLat = Math.max(
      -CONFIG.ENGINE.MAX_LATITUDE,
      Math.min(CONFIG.ENGINE.MAX_LATITUDE, this._centerLat + dLat)
    );
    this.centerLat = asLatitude(newLat);
    this._centerLon = normalizeLongitude(this._centerLon + dLon);
  }

  cycleLayer(): void {
    const layers: MapLayer[] = ['STREETS', 'TOPOGRAPHIC', 'IMAGERY'];
    const idx = layers.indexOf(this.mapLayer);
    this.mapLayer = layers[(idx + 1) % layers.length];
    this.saveState();
  }
}
