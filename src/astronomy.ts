/**
 * Astronomical calculations for sun and moon positions.
 * Referenced from standard astronomical algorithms (Low-precision series).
 */

import { CONFIG } from './config';
import type { GeoCoordinates } from './types';

/**
 * Standard angle normalization to [0, 360) range.
 */
function normalizeAngle(deg: number): number {
  return deg - 360 * Math.floor(deg / 360);
}

/**
 * Normalize longitude to [-180, 180] range.
 */
export function normalizeLongitude(lon: number): number {
  return lon - 360 * Math.floor((lon + 180) / 360);
}

/**
 * Calculate fractional days since J2000.0 epoch.
 */
function daysSinceJ2000(date: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return (date.getTime() - CONFIG.J2000_EPOCH.getTime()) / msPerDay;
}

/**
 * Calculate the current obliquity of the ecliptic.
 */
function getEclipticObliquity(n: number): number {
  const { ECLIPTIC_OBLIQUITY_BASE, ECLIPTIC_OBLIQUITY_RATE } = CONFIG.ASTRONOMY;
  return (ECLIPTIC_OBLIQUITY_BASE - ECLIPTIC_OBLIQUITY_RATE * n) * (Math.PI / 180);
}

/**
 * Calculate the geographic position where the sun is directly overhead.
 * Returns [longitude, latitude]
 */
export function calculateSunPosition(date: Date): GeoCoordinates {
  const n = daysSinceJ2000(date);
  const ast = CONFIG.ASTRONOMY;

  // 1. Mean longitude and anomaly
  const q = normalizeAngle(ast.SUN_MEAN_LON_BASE + ast.SUN_MEAN_LON_RATE * n);
  const g = normalizeAngle(ast.SUN_MEAN_ANOM_BASE + ast.SUN_MEAN_ANOM_RATE * n);
  const gRad = g * (Math.PI / 180);

  // 2. Ecliptic longitude
  const L = q + ast.SUN_ECLIPTIC_LON_C1 * Math.sin(gRad) + ast.SUN_ECLIPTIC_LON_C2 * Math.sin(2 * gRad);
  const LRad = L * (Math.PI / 180);

  // 3. Obliquity
  const epsilonRad = getEclipticObliquity(n);

  // 4. Coordinates
  const alpha = (Math.atan2(Math.cos(epsilonRad) * Math.sin(LRad), Math.cos(LRad)) * 180) / Math.PI;
  const delta = Math.asin(Math.sin(epsilonRad) * Math.sin(LRad));

  // Latitude is direct declination
  const sunLat = (delta * 180) / Math.PI;

  // 5. Longitude (Greenwich Hour Angle)
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const eot = q - alpha;
  const gha = normalizeAngle(15 * (utcHours - 12) + eot);
  const sunLon = normalizeLongitude(-gha);

  return [sunLon, sunLat];
}

/**
 * Calculate the geographic position where the moon is directly overhead.
 * Returns [longitude, latitude]
 */
export function calculateMoonPosition(date: Date): GeoCoordinates {
  const n = daysSinceJ2000(date);
  const ast = CONFIG.ASTRONOMY;

  // 1. Mean lunar elements
  const Lm = normalizeAngle(ast.MOON_MEAN_LON_BASE + ast.MOON_MEAN_LON_RATE * n);
  const Mm = normalizeAngle(ast.MOON_MEAN_ANOM_BASE + ast.MOON_MEAN_ANOM_RATE * n);
  const D = normalizeAngle(ast.MOON_MEAN_ELON_BASE + ast.MOON_MEAN_ELON_RATE * n);
  
  const MmRad = Mm * (Math.PI / 180);
  const DRad = D * (Math.PI / 180);

  // 2. Simplified Ecliptic Coordinates
  const lambdaM = Lm + ast.MOON_ECLIPTIC_LON_C1 * Math.sin(MmRad) + ast.MOON_ECLIPTIC_LON_C2 * Math.sin(2 * DRad - MmRad);
  const lambdaMRad = lambdaM * (Math.PI / 180);

  const betaM = ast.MOON_ECLIPTIC_LAT_C1 * Math.sin(DRad);
  const betaMRad = betaM * (Math.PI / 180);

  // 3. Obliquity
  const epsilonRad = getEclipticObliquity(n);

  // 4. Equatorial conversion
  const alphaM = Math.atan2(
    Math.cos(epsilonRad) * Math.sin(lambdaMRad) - Math.tan(betaMRad) * Math.sin(epsilonRad),
    Math.cos(lambdaMRad)
  );
  const deltaM = Math.asin(
    Math.sin(betaMRad) * Math.cos(epsilonRad) +
      Math.cos(betaMRad) * Math.sin(epsilonRad) * Math.sin(lambdaMRad)
  );

  const moonLat = (deltaM * 180) / Math.PI;

  // 5. Longitude
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const gha = normalizeAngle(15 * utcHours - (alphaM * 180) / Math.PI);
  const moonLon = normalizeLongitude(-gha);

  return [moonLon, moonLat];
}
