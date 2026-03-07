/**
 * Service for handling browser geolocation
 */

import type { GeoCoordinates } from './types';

export class GeolocationService {
  /**
   * Get the current user position
   * Defaults to London if geolocation is unavailable or denied
   */
  static async getCurrentPosition(): Promise<GeoCoordinates> {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return [-0.1278, 51.5074]; // London
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
        (err) => {
          console.warn('Geolocation error:', err.message);
          resolve([-0.1278, 51.5074]); // London fallback
        },
        { timeout: 5000 }
      );
    });
  }
}
