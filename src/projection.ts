/**
 * Azimuthal equidistant projection for mapping geographic coordinates to screen coordinates
 */

/// <reference path="./types.ts" />

import { GeoCoordinates, GeoRing } from './types';

export class Projection {
  constructor(
    private centerX: number,
    private centerY: number,
    private centerLat: number,
    private centerLon: number,
    private scale: number
  ) {}
  
  /**
   * Project geographic coordinates to screen coordinates using
   * azimuthal equidistant projection centered on the map center.
   */
  project([lon, lat]: GeoCoordinates): [number, number] {
    if (!isFinite(lat) || !isFinite(lon)) {
      return [this.centerX, this.centerY];
    }
    
    // Convert to radians
    const lat1 = this.centerLat * Math.PI / 180;
    const lon1 = this.centerLon * Math.PI / 180;
    const lat2 = lat * Math.PI / 180;
    const lon2 = lon * Math.PI / 180;
    
    // Calculate distance using haversine formula
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const aClamped = Math.min(a, 1.0);
    const c = 2 * Math.atan2(Math.sqrt(aClamped), Math.sqrt(1 - aClamped));
    const distance = c; // in radians
    
    // Calculate bearing (azimuth)
    const bearingY = Math.sin(dLon) * Math.cos(lat2);
    const bearingX = Math.cos(lat1) * Math.sin(lat2) - 
                     Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = Math.atan2(bearingY, bearingX);
    
    // Convert to screen coordinates
    const r = distance * this.scale;
    const screenX = this.centerX + r * Math.sin(bearing);
    const screenY = this.centerY - r * Math.cos(bearing);
    
    if (!isFinite(screenX) || !isFinite(screenY)) {
      return [this.centerX, this.centerY];
    }
    
    return [screenX, screenY];
  }
  
  /**
   * Update the center point for the projection
   */
  updateCenter(lat: number, lon: number): void {
    this.centerLat = lat;
    this.centerLon = lon;
  }
  
  /**
   * Convert a ring of coordinates to an SVG path string
   */
  geoPathFromCoords(coords: GeoRing[]): string {
    const path = d3.path();
    coords.forEach((ring: GeoRing) => {
      ring.forEach((pt: GeoCoordinates, j: number) => {
        const [x, y] = this.project(pt);
        if (j === 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      });
      path.closePath();
    });
    return path.toString();
  }
}

