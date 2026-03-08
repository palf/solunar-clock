/**
 * Astronomical calculations for sun and moon positions.
 * 
 * The constants and algorithms below are derived from the "Low-precision series" 
 * for solar and lunar positions, as documented by the Astronomical Almanac 
 * and Jean Meeus's "Astronomical Algorithms".
 * 
 * All values are referenced against the J2000.0 Epoch (January 1, 2000, 12:00 UTC).
 */

import { CONFIG } from './config';
import type { GeoCoordinates } from './types';

// Non-configurable mathematical constants for astronomical series
const ASTRONOMY_CONSTANTS = {
  /**
   * SUN_MEAN_LON_BASE: The mean longitude of the Sun at the J2000.0 epoch.
   * Value (280.459°) represents the geometric mean longitude.
   */
  SUN_MEAN_LON_BASE: 280.459,

  /**
   * SUN_MEAN_LON_RATE: The average speed of the Sun's mean longitude.
   * Approximately 0.9856° per day (360° / 365.25 days).
   */
  SUN_MEAN_LON_RATE: 0.98564736,

  /**
   * SUN_MEAN_ANOM_BASE: The mean anomaly of the Sun at the J2000.0 epoch.
   * Value (357.529°) defines the Sun's position relative to its perigee.
   */
  SUN_MEAN_ANOM_BASE: 357.529,

  /**
   * SUN_MEAN_ANOM_RATE: The daily increase in the Sun's mean anomaly.
   */
  SUN_MEAN_ANOM_RATE: 0.98560028,

  /**
   * SUN_ECLIPTIC_LON_C1 & C2: Coefficients for the "Equation of the Center".
   * These correct the mean longitude to the apparent ecliptic longitude,
   * accounting for the Earth's elliptical orbit.
   */
  SUN_ECLIPTIC_LON_C1: 1.915,
  SUN_ECLIPTIC_LON_C2: 0.02,

  /**
   * MOON_MEAN_LON_BASE: The mean longitude of the Moon at J2000.0.
   * The Moon moves much faster, completing a circle in ~27.3 days.
   */
  MOON_MEAN_LON_BASE: 218.316,

  /**
   * MOON_MEAN_LON_RATE: The average daily movement of the Moon's longitude (~13.17°).
   */
  MOON_MEAN_LON_RATE: 13.176396,

  /**
   * MOON_MEAN_ANOM_BASE: The Moon's mean anomaly at J2000.0.
   */
  MOON_MEAN_ANOM_BASE: 134.963,

  /**
   * MOON_MEAN_ANOM_RATE: The daily increase in the Moon's mean anomaly (~13.06°).
   */
  MOON_MEAN_ANOM_RATE: 13.064993,

  /**
   * MOON_MEAN_ELON_BASE: The Moon's mean elongation at J2000.0.
   * This is the angular distance between the Moon and the Sun.
   */
  MOON_MEAN_ELON_BASE: 297.85,

  /**
   * MOON_MEAN_ELON_RATE: The daily change in elongation (~12.19°).
   */
  MOON_MEAN_ELON_RATE: 12.190749,

  /**
   * MOON_ECLIPTIC_LON_C1 & C2: Perturbation coefficients for the Moon's longitude.
   * These account for the complex gravitational effects of the Sun and Earth.
   */
  MOON_ECLIPTIC_LON_C1: 6.289,
  MOON_ECLIPTIC_LON_C2: 1.274,

  /**
   * MOON_ECLIPTIC_LAT_C1: Principal coefficient for the Moon's ecliptic latitude.
   * Accounts for the ~5.1° tilt of the Moon's orbit relative to the ecliptic.
   */
  MOON_ECLIPTIC_LAT_C1: 5.128,

  /**
   * ECLIPTIC_OBLIQUITY_BASE: The tilt of the Earth's axis (obliquity) at J2000.0.
   * Current value is approximately 23.439°.
   */
  ECLIPTIC_OBLIQUITY_BASE: 23.439,

  /**
   * ECLIPTIC_OBLIQUITY_RATE: The very slow rate at which the Earth's tilt decreases.
   * Approximately 0.0000004° per day.
   */
  ECLIPTIC_OBLIQUITY_RATE: 0.0000004,
};

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
  const { ECLIPTIC_OBLIQUITY_BASE, ECLIPTIC_OBLIQUITY_RATE } =
    ASTRONOMY_CONSTANTS;
  return (ECLIPTIC_OBLIQUITY_BASE - ECLIPTIC_OBLIQUITY_RATE * n) * (Math.PI / 180);
}

/**
 * Calculate the geographic position where the sun is directly overhead.
 * Returns [longitude, latitude]
 */
export function calculateSunPosition(date: Date): GeoCoordinates {
  const n = daysSinceJ2000(date);
  const ast = ASTRONOMY_CONSTANTS;

  // 1. Mean longitude and anomaly
  const q = normalizeAngle(ast.SUN_MEAN_LON_BASE + ast.SUN_MEAN_LON_RATE * n);
  const g = normalizeAngle(ast.SUN_MEAN_ANOM_BASE + ast.SUN_MEAN_ANOM_RATE * n);
  const gRad = g * (Math.PI / 180);

  // 2. Ecliptic longitude
  const L =
    q +
    ast.SUN_ECLIPTIC_LON_C1 * Math.sin(gRad) +
    ast.SUN_ECLIPTIC_LON_C2 * Math.sin(2 * gRad);
  const LRad = L * (Math.PI / 180);

  // 3. Obliquity
  const epsilonRad = getEclipticObliquity(n);

  // 4. Coordinates
  const alpha =
    (Math.atan2(Math.cos(epsilonRad) * Math.sin(LRad), Math.cos(LRad)) * 180) /
    Math.PI;
  const delta = Math.asin(Math.sin(epsilonRad) * Math.sin(LRad));

  // Latitude is direct declination
  const sunLat = (delta * 180) / Math.PI;

  // 5. Longitude (Greenwich Hour Angle)
  const utcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
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
  const ast = ASTRONOMY_CONSTANTS;

  // 1. Mean lunar elements
  const Lm = normalizeAngle(ast.MOON_MEAN_LON_BASE + ast.MOON_MEAN_LON_RATE * n);
  const Mm = normalizeAngle(ast.MOON_MEAN_ANOM_BASE + ast.MOON_MEAN_ANOM_RATE * n);
  const D = normalizeAngle(ast.MOON_MEAN_ELON_BASE + ast.MOON_MEAN_ELON_RATE * n);

  const MmRad = Mm * (Math.PI / 180);
  const DRad = D * (Math.PI / 180);

  // 2. Simplified Ecliptic Coordinates
  const lambdaM =
    Lm +
    ast.MOON_ECLIPTIC_LON_C1 * Math.sin(MmRad) +
    ast.MOON_ECLIPTIC_LON_C2 * Math.sin(2 * DRad - MmRad);
  const lambdaMRad = lambdaM * (Math.PI / 180);

  const betaM = ast.MOON_ECLIPTIC_LAT_C1 * Math.sin(DRad);
  const betaMRad = betaM * (Math.PI / 180);

  // 3. Obliquity
  const epsilonRad = getEclipticObliquity(n);

  // 4. Equatorial conversion
  const alphaM = Math.atan2(
    Math.cos(epsilonRad) * Math.sin(lambdaMRad) -
      Math.tan(betaMRad) * Math.sin(epsilonRad),
    Math.cos(lambdaMRad)
  );
  const deltaM = Math.asin(
    Math.sin(betaMRad) * Math.cos(epsilonRad) +
      Math.cos(betaMRad) * Math.sin(epsilonRad) * Math.sin(lambdaMRad)
  );

  const moonLat = (deltaM * 180) / Math.PI;

  // 5. Longitude
  const utcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const gha = normalizeAngle(15 * utcHours - (alphaM * 180) / Math.PI);
  const moonLon = normalizeLongitude(-gha);

  return [moonLon, moonLat];
}
