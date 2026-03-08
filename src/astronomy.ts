/**
 * Astronomical calculations for sun and moon positions.
 *
 * The constants and algorithms below are derived from the "Low-precision series"
 * for solar and lunar positions.
 *
 * Sources:
 * - Solar: USNO "Low Precision Solar Position" (https://aa.usno.navy.mil/faq/sun_approx)
 * - Lunar: USNO "Low Precision Lunar Position" (https://aa.usno.navy.mil/faq/moon_approx)
 * - General: Jean Meeus, "Astronomical Algorithms", 2nd Ed.
 *
 * All values are referenced against the J2000.0 Epoch (January 1, 2000, 12:00 UTC).
 */

import {
  asDegrees,
  asLatitude,
  asLongitude,
  type Degrees,
  type GeoCoordinates,
  type Longitude,
} from './types';

/**
 * Astronomy-internal branded types to prevent mixing units or coordinate systems.
 */
type Radians = number & { readonly __brand: 'Radians' };
type JulianDays = number & { readonly __brand: 'JulianDays' };
type EclipticLongitude = Degrees & { readonly __brand: 'EclipticLongitude' };
type RightAscension = Degrees & { readonly __brand: 'RightAscension' };
type Declination = Degrees & { readonly __brand: 'Declination' };

// Internal smart constructors
const asRadians = (n: number) => n as Radians;
const asJulianDays = (n: number) => n as JulianDays;
const asEclipticLongitude = (d: Degrees) => d as EclipticLongitude;
const asRightAscension = (d: Degrees) => d as RightAscension;
const asDeclination = (d: Degrees) => d as Declination;

/**
 * Unit conversion helpers.
 */
function toRadians(deg: Degrees | number): Radians {
  return asRadians(deg * (Math.PI / 180));
}

function toDegrees(rad: Radians): Degrees {
  return asDegrees(rad * (180 / Math.PI));
}

// Non-configurable mathematical constants for astronomical series
const ASTRONOMY_CONSTANTS = {
  /**
   * J2000_EPOCH: The standard astronomical epoch (January 1, 2000, 12:00 UTC).
   * Ref: https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000.0
   * VERIFIED
   */
  J2000_EPOCH: new Date('2000-01-01T12:00:00Z'),

  /**
   * SUN_MEAN_LON_BASE: Geometric mean longitude of the Sun.
   * Ref: USNO (L = 280.459 + 0.98564736 * n)
   * VERIFIED
   */
  SUN_MEAN_LON_BASE: 280.459,

  /**
   * SUN_MEAN_LON_RATE: Mean daily movement of the Sun.
   * Ref: USNO (0.98564736°/day)
   * VERIFIED
   */
  SUN_MEAN_LON_RATE: 0.98564736,

  /**
   * SUN_MEAN_ANOM_BASE: Mean anomaly of the Sun.
   * Ref: USNO (g = 357.529 + 0.98560028 * n)
   * VERIFIED
   */
  SUN_MEAN_ANOM_BASE: 357.529,

  /**
   * SUN_MEAN_ANOM_RATE: Daily increase in mean anomaly.
   * Ref: USNO (0.98560028°/day)
   * VERIFIED
   */
  SUN_MEAN_ANOM_RATE: 0.98560028,

  /**
   * SUN_ECLIPTIC_LON_C1 & C2: Coefficients for the Equation of Center.
   * Ref: USNO (lambda = L + 1.915 sin g + 0.020 sin 2g)
   * VERIFIED
   */
  SUN_ECLIPTIC_LON_C1: 1.915,
  SUN_ECLIPTIC_LON_C2: 0.02,

  /**
   * MOON_MEAN_LON_BASE: Mean longitude of the Moon.
   * Ref: USNO (L' = 218.316 + 481267.881 * T)
   * T is Julian centuries since J2000.
   * VERIFIED
   */
  MOON_MEAN_LON_BASE: 218.316,
  MOON_MEAN_LON_RATE_CY: 481267.881,

  /**
   * MOON_MEAN_ANOM_BASE: Mean anomaly of the Moon.
   * Ref: USNO (M' = 134.963 + 477198.868 * T)
   * VERIFIED
   */
  MOON_MEAN_ANOM_BASE: 134.963,
  MOON_MEAN_ANOM_RATE_CY: 477198.868,

  /**
   * MOON_MEAN_ELON_BASE: Mean elongation of the Moon.
   * Ref: USNO (D = 297.850 + 445267.111 * T)
   * VERIFIED
   */
  MOON_MEAN_ELON_BASE: 297.85,
  MOON_MEAN_ELON_RATE_CY: 445267.111,

  /**
   * MOON_MEAN_ARG_LAT_BASE: Mean argument of latitude.
   * Ref: USNO (F = 93.272 + 483202.018 * T)
   * VERIFIED
   */
  MOON_MEAN_ARG_LAT_BASE: 93.272,
  MOON_MEAN_ARG_LAT_RATE_CY: 483202.018,

  /**
   * GMST_BASE: Greenwich Mean Sidereal Time at J2000 noon.
   * Ref: USNO (280.46061837 + 360.985647366 * n)
   * VERIFIED
   */
  GMST_BASE: 280.46061837,

  /**
   * GMST_RATE: Daily rate of change in GMST (Earth's over-rotation).
   * Ref: USNO (360.985647366°/day)
   * VERIFIED
   */
  GMST_RATE: 360.985647366,

  /**
   * ECLIPTIC_OBLIQUITY_BASE: Mean obliquity of the ecliptic.
   * Ref: USNO (epsilon = 23.439 - 0.00000036 * n)
   * VERIFIED
   */
  ECLIPTIC_OBLIQUITY_BASE: 23.439,

  /**
   * ECLIPTIC_OBLIQUITY_RATE: Daily rate of change in obliquity.
   * Ref: USNO (0.00000036°/day)
   * VERIFIED
   */
  ECLIPTIC_OBLIQUITY_RATE: 0.00000036,
};

/**
 * Standard angle normalization to [0, 360) range.
 */
function normalizeAngle(deg: number): Degrees {
  return asDegrees(deg - 360 * Math.floor(deg / 360));
}

/**
 * Normalize longitude to [-180, 180] range.
 */
export function normalizeLongitude(lon: number): Longitude {
  return asLongitude(lon - 360 * Math.floor((lon + 180) / 360));
}

/**
 * Calculate fractional days since J2000.0 epoch.
 */
function daysSinceJ2000(date: Date): JulianDays {
  const msPerDay = 1000 * 60 * 60 * 24;
  return asJulianDays((date.getTime() - ASTRONOMY_CONSTANTS.J2000_EPOCH.getTime()) / msPerDay);
}

/**
 * Calculate the current obliquity of the ecliptic.
 */
function getEclipticObliquity(n: JulianDays): Radians {
  const { ECLIPTIC_OBLIQUITY_BASE, ECLIPTIC_OBLIQUITY_RATE } = ASTRONOMY_CONSTANTS;
  return toRadians(asDegrees(ECLIPTIC_OBLIQUITY_BASE - ECLIPTIC_OBLIQUITY_RATE * n));
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
  const gRad = toRadians(g);

  // 2. Ecliptic longitude
  const lambda = asEclipticLongitude(
    normalizeAngle(
      q + ast.SUN_ECLIPTIC_LON_C1 * Math.sin(gRad) + ast.SUN_ECLIPTIC_LON_C2 * Math.sin(2 * gRad)
    )
  );
  const lambdaRad = toRadians(lambda);

  // 3. Obliquity
  const epsilonRad = getEclipticObliquity(n);

  // 4. Coordinates (Equatorial)
  const alpha = asRightAscension(
    toDegrees(
      asRadians(Math.atan2(Math.cos(epsilonRad) * Math.sin(lambdaRad), Math.cos(lambdaRad)))
    )
  );
  const delta = asDeclination(
    toDegrees(asRadians(Math.asin(Math.sin(epsilonRad) * Math.sin(lambdaRad))))
  );

  // Geographic Latitude is direct declination
  const sunLat = asLatitude(delta as number);

  // 5. Longitude (Greenwich Hour Angle)
  // GHA = GMST - Right Ascension
  const gmst = normalizeAngle(ast.GMST_BASE + ast.GMST_RATE * n);
  const gha = normalizeAngle(gmst - alpha);

  // Longitude East = -GHA (normalized)
  const sunLon = normalizeLongitude(-gha);

  return [sunLon, sunLat];
}

/**
 * Calculate the geographic position where the moon is directly overhead.
 * Returns [longitude, latitude]
 */
export function calculateMoonPosition(date: Date): GeoCoordinates {
  const n = daysSinceJ2000(date);
  const T = n / 36525; // Julian centuries
  const ast = ASTRONOMY_CONSTANTS;

  // 1. Mean lunar elements
  const L_prime = normalizeAngle(ast.MOON_MEAN_LON_BASE + ast.MOON_MEAN_LON_RATE_CY * T);
  const D = normalizeAngle(ast.MOON_MEAN_ELON_BASE + ast.MOON_MEAN_ELON_RATE_CY * T);
  const M = normalizeAngle(ast.MOON_MEAN_ANOM_BASE + ast.MOON_MEAN_ANOM_RATE_CY * T);
  const F = normalizeAngle(ast.MOON_MEAN_ARG_LAT_BASE + ast.MOON_MEAN_ARG_LAT_RATE_CY * T);

  // Sun mean anomaly for moon perturbations
  const M_solar = normalizeAngle(ast.SUN_MEAN_ANOM_BASE + ast.SUN_MEAN_ANOM_RATE * n);

  // 2. Ecliptic Coordinates (lambda, beta)
  // Ref: AA page D22, Celestial Programming
  const MmRad = toRadians(M);
  const DRad = toRadians(D);
  const FRad = toRadians(F);
  const MsRad = toRadians(M_solar);

  const lambda = normalizeAngle(
    L_prime +
      6.289 * Math.sin(MmRad) +
      1.274 * Math.sin(2 * DRad - MmRad) +
      0.658 * Math.sin(2 * DRad) +
      0.214 * Math.sin(2 * MmRad) -
      0.186 * Math.sin(MsRad) -
      0.114 * Math.sin(2 * FRad)
  );

  const beta =
    5.128 * Math.sin(FRad) +
    0.28 * Math.sin(MmRad + FRad) -
    0.278 * Math.sin(FRad - MmRad) -
    0.173 * Math.sin(FRad - 2 * DRad);

  const lambdaRad = toRadians(lambda);
  const betaRad = toRadians(asDegrees(beta));

  // 3. Obliquity
  const epsilonRad = getEclipticObliquity(n);

  // 4. Equatorial conversion (Right Ascension alphaM, Declination deltaM)
  // Ref: Meeus
  const alphaM = asRightAscension(
    toDegrees(
      asRadians(
        Math.atan2(
          Math.cos(betaRad) * Math.cos(epsilonRad) * Math.sin(lambdaRad) -
            Math.sin(betaRad) * Math.sin(epsilonRad),
          Math.cos(betaRad) * Math.cos(lambdaRad)
        )
      )
    )
  );
  const deltaM = asDeclination(
    toDegrees(
      asRadians(
        Math.asin(
          Math.sin(betaRad) * Math.cos(epsilonRad) +
            Math.cos(betaRad) * Math.sin(epsilonRad) * Math.sin(lambdaRad)
        )
      )
    )
  );

  const moonLat = asLatitude(deltaM as number);

  // 5. Greenwich Hour Angle (GHA)
  const gmst = normalizeAngle(ast.GMST_BASE + ast.GMST_RATE * n);
  const gha = normalizeAngle(gmst - alphaM);

  // Longitude East = -GHA (normalized)
  const moonLon = normalizeLongitude(-gha);

  return [moonLon, moonLat];
}
