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
  readonly scale = (this.radius / Math.PI) * CONFIG.SCALING_FACTOR;
  
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

