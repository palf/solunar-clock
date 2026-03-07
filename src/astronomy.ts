/**
 * Astronomical calculations for sun and moon positions
 */

import { CONFIG } from './config';
import type { GeoCoordinates } from './types';

/**
 * Calculate days since J2000.0 epoch
 */
function daysSinceJ2000(date: Date): number {
  return (date.getTime() - CONFIG.J2000_EPOCH.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Normalize longitude to [-180, 180] range
 */
function normalizeLongitude(lon: number): number {
  let nLon = lon % 360;
  if (nLon > 180) nLon -= 360;
  if (nLon < -180) nLon += 360;
  return nLon;
}

/**
 * Calculate the geographic position where the sun is directly overhead
 * Returns [longitude, latitude]
 */
export function calculateSunPosition(date: Date): GeoCoordinates {
  const n = daysSinceJ2000(date);

  // Mean longitude of the sun (degrees)
  const q = (280.459 + 0.98564736 * n) % 360;

  // Mean anomaly (degrees)
  const g = (357.529 + 0.98560028 * n) % 360;
  const gRad = (g * Math.PI) / 180;

  // Apparent ecliptic longitude (degrees)
  const L = q + 1.915 * Math.sin(gRad) + 0.02 * Math.sin(2 * gRad);
  const LRad = (L * Math.PI) / 180;

  // Obliquity of the ecliptic (degrees)
  const epsilon = 23.439 - 0.00000036 * n;
  const epsilonRad = (epsilon * Math.PI) / 180;

  // Right ascension and declination
  const alpha = (Math.atan2(Math.cos(epsilonRad) * Math.sin(LRad), Math.cos(LRad)) * 180) / Math.PI;
  const delta = Math.asin(Math.sin(epsilonRad) * Math.sin(LRad));

  // Convert to latitude (declination = latitude where sun is overhead)
  const sunLat = (delta * 180) / Math.PI;

  // Calculate Greenwich Hour Angle (GHA)
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const eot = q - alpha;
  const gha = (15 * (utcHours - 12) + eot) % 360;
  const sunLon = normalizeLongitude(-gha);

  return [sunLon, sunLat];
}

/**
 * Calculate the geographic position where the moon is directly overhead
 * Returns [longitude, latitude]
 * Note: This is a simplified calculation
 */
export function calculateMoonPosition(date: Date): GeoCoordinates {
  const n = daysSinceJ2000(date);

  // Mean longitude of the moon (degrees)
  const Lm = (218.316 + 13.176396 * n) % 360;

  // Mean anomaly of the moon (degrees)
  const Mm = (134.963 + 13.064993 * n) % 360;
  const MmRad = (Mm * Math.PI) / 180;

  // Mean elongation of the moon (degrees)
  const D = (297.85 + 12.190749 * n) % 360;
  const DRad = (D * Math.PI) / 180;

  // Ecliptic longitude (simplified)
  const lambdaM = Lm + 6.289 * Math.sin(MmRad) + 1.274 * Math.sin(2 * DRad - MmRad);
  const lambdaMRad = (lambdaM * Math.PI) / 180;

  // Ecliptic latitude (simplified)
  const betaM = 5.128 * Math.sin(DRad);
  const betaMRad = (betaM * Math.PI) / 180;

  // Obliquity of the ecliptic
  const epsilon = 23.439 - 0.0000004 * n;
  const epsilonRad = (epsilon * Math.PI) / 180;

  // Convert to equatorial coordinates
  const alphaM = Math.atan2(
    Math.cos(epsilonRad) * Math.sin(lambdaMRad) - Math.tan(betaMRad) * Math.sin(epsilonRad),
    Math.cos(lambdaMRad)
  );
  const deltaM = Math.asin(
    Math.sin(betaMRad) * Math.cos(epsilonRad) +
      Math.cos(betaMRad) * Math.sin(epsilonRad) * Math.sin(lambdaMRad)
  );

  // Convert to latitude
  const moonLat = (deltaM * 180) / Math.PI;

  // Calculate Greenwich Hour Angle
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const gha = (15 * utcHours - (alphaM * 180) / Math.PI) % 360;
  const moonLon = normalizeLongitude(-gha);

  return [moonLon, moonLat];
}
