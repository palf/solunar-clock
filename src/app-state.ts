/**
 * Application state management
 */

import { CONFIG } from './config';
import { TopoJSONData } from './types';

export class AppState {
  // Display dimensions
  readonly width = CONFIG.WIDTH;
  readonly height = CONFIG.HEIGHT;
  readonly centerX = CONFIG.WIDTH / 2;
  readonly centerY = CONFIG.HEIGHT / 2;
  readonly radius = Math.min(CONFIG.WIDTH, CONFIG.HEIGHT) * CONFIG.RADIUS_FACTOR;
  
  // Zoom scale (configurable)
  scalingFactor: number = CONFIG.DEFAULT_SCALING_FACTOR;
  
  // Computed scale for projection
  get scale(): number {
    return (this.radius / Math.PI) * this.scalingFactor;
  }
  
  // Map center position
  centerLat: number = 0;
  centerLon: number = 0;
  
  // Time simulation
  readonly startTime: Date = new Date();
  timeSpeedMultiplier: number = CONFIG.DEFAULT_TIME_SPEED;
  
  // Map data
  mapData: TopoJSONData | null = null;
  mapLoaded: boolean = false;
}

