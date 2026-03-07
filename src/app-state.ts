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

  // Computed scale for projection
  get scale(): number {
    return (this.radius / Math.PI) * this.scalingFactor;
  }

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
}
