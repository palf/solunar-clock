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

import { asLongitude, asLatitude, asDegrees, type GeoCoordinates, type Longitude, type Degrees } from './types';

/**
 * Astronomy-internal branded types to prevent mixing units or coordinate systems.
 */
type Radians = number & { readonly __brand: 'Radians' };
type JulianDays = number & { readonly __brand: 'JulianDays' };
type EclipticLongitude = Degrees & { readonly __brand: 'EclipticLongitude' };
type EclipticLatitude = Degrees & { readonly __brand: 'EclipticLatitude' };
type RightAscension = Degrees & { readonly __brand: 'RightAscension' };
type Declination = Degrees & { readonly __brand: 'Declination' };

// Internal smart constructors
const asRadians = (n: number) => n as Radians;
const asJulianDays = (n: number) => n as JulianDays;
const asEclipticLongitude = (d: Degrees) => d as EclipticLongitude;
const asEclipticLatitude = (d: Degrees) => d as EclipticLatitude;
const asRightAscension = (d: Degrees) => d as RightAscension;
const asDeclination = (d: Degrees) => d as Declination;

/**
 * Unit conversion helpers.
 */
function toRadians(deg: number): Radians {
  return asRadians(deg * (Math.PI / 180));
}

function toDegrees(rad: number): Degrees {
  return asDegrees(rad * (180 / Math.PI));
}

// Non-configurable mathematical constants for astronomical series
const ASTRONOMY_CONSTANTS = {
  /**
   * J2000_EPOCH: The standard astronomical epoch (January 1, 2000, 12:00 UTC).
   * Ref: https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000.0
   */
  J2000_EPOCH: new Date('2000-01-01T12:00:00Z'),

  /**
   * SUN_MEAN_LON_BASE: Geometric mean longitude of the Sun.
   * Ref: USNO (L = 280.460 + 0.9856474 * n)
   */
  SUN_MEAN_LON_BASE: 280.459,

  /**
   * SUN_MEAN_LON_RATE: Mean daily movement of the Sun.
   * Ref: USNO (0.9856474°/day)
   */
  SUN_MEAN_LON_RATE: 0.98564736,

  /**
   * SUN_MEAN_ANOM_BASE: Mean anomaly of the Sun.
   * Ref: USNO (g = 357.528 + 0.9856003 * n)
   */
  SUN_MEAN_ANOM_BASE: 357.529,

  /**
   * SUN_MEAN_ANOM_RATE: Daily increase in mean anomaly.
   * Ref: USNO (0.9856003°/day)
   */
  SUN_MEAN_ANOM_RATE: 0.98560028,

  /**
   * SUN_ECLIPTIC_LON_C1 & C2: Coefficients for the Equation of Center.
   * Ref: USNO (lambda = L + 1.915 sin g + 0.020 sin 2g)
   */
  SUN_ECLIPTIC_LON_C1: 1.915,
  SUN_ECLIPTIC_LON_C2: 0.02,

  /**
   * MOON_MEAN_LON_BASE: Mean longitude of the Moon.
   * Ref: USNO (L' = 218.32 + 13.176396 * n)
   */
  MOON_MEAN_LON_BASE: 218.316,

  /**
   * MOON_MEAN_LON_RATE: Mean daily movement of the Moon.
   * Ref: USNO (13.176396°/day)
   */
  MOON_MEAN_LON_RATE: 13.17639648,

  /**
   * MOON_MEAN_ANOM_BASE: Mean anomaly of the Moon.
   * Ref: USNO (M' = 134.96 + 13.064993 * n)
   */
  MOON_MEAN_ANOM_BASE: 134.963,

  /**
   * MOON_MEAN_ANOM_RATE: Daily increase in mean lunar anomaly.
   * Ref: USNO (13.064993°/day)
   */
  MOON_MEAN_ANOM_RATE: 13.06499295,

  /**
   * MOON_MEAN_ELON_BASE: Mean elongation of the Moon.
   * Ref: USNO (D = 297.85 + 12.190749 * n)
   */
  MOON_MEAN_ELON_BASE: 297.85,

  /**
   * MOON_MEAN_ELON_RATE: Daily change in lunar elongation.
   * Ref: USNO (12.190749°/day)
   */
  MOON_MEAN_ELON_RATE: 12.19074912,

  /**
   * MOON_MEAN_ARG_LAT_BASE: Mean argument of latitude.
   * Ref: USNO (F = 93.27 + 13.229350 * n)
   */
  MOON_MEAN_ARG_LAT_BASE: 93.272,

  /**
   * MOON_MEAN_ARG_LAT_RATE: Daily change in argument of latitude.
   * Ref: USNO (13.229350°/day)
   */
  MOON_MEAN_ARG_LAT_RATE: 13.22935026,

  /**
   * GMST_BASE: Greenwich Mean Sidereal Time at J2000 noon.
   * Ref: USNO (100.46 + 0.985647 * n + 15 * UT)
   */
  GMST_BASE: 280.46061837,

  /**
   * GMST_RATE: Daily rate of change in GMST.
   */
  GMST_RATE: 360.985647366,

  /**
   * MOON_ECLIPTIC_LON_C1 & C2: Longitude perturbation coefficients.
   * Ref: USNO (lambda' = L' + 6.29 sin M' + 1.27 sin(2D-M'))
   */
  MOON_ECLIPTIC_LON_C1: 6.289,
  MOON_ECLIPTIC_LON_C2: 1.274,

  /**
   * MOON_ECLIPTIC_LAT_C1: Principal latitude coefficient.
   * Ref: USNO (beta' = 5.13 sin F, F approx D)
   */
  MOON_ECLIPTIC_LAT_C1: 5.128,

  /**
   * ECLIPTIC_OBLIQUITY_BASE: Mean obliquity of the ecliptic.
   * Ref: USNO (epsilon = 23.439 - 0.0000004 * n)
   */
  ECLIPTIC_OBLIQUITY_BASE: 23.439,

  /**
   * ECLIPTIC_OBLIQUITY_RATE: Daily rate of change in obliquity.
   * Ref: USNO (0.0000004°/day)
   */
  ECLIPTIC_OBLIQUITY_RATE: 0.0000004,
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
  const { ECLIPTIC_OBLIQUITY_BASE, ECLIPTIC_OBLIQUITY_RATE } =
    ASTRONOMY_CONSTANTS;
  return toRadians(ECLIPTIC_OBLIQUITY_BASE - ECLIPTIC_OBLIQUITY_RATE * n);
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
      q +
      ast.SUN_ECLIPTIC_LON_C1 * Math.sin(gRad) +
      ast.SUN_ECLIPTIC_LON_C2 * Math.sin(2 * gRad)
    )
  );
  const lambdaRad = toRadians(lambda);

  // 3. Obliquity
  const epsilonRad = getEclipticObliquity(n);

  // 4. Coordinates (Equatorial)
  const alpha = asRightAscension(
    toDegrees(
      asRadians(
        Math.atan2(Math.cos(epsilonRad) * Math.sin(lambdaRad), Math.cos(lambdaRad))
      )
    )
  );
  const delta = asDeclination(
    toDegrees(
      asRadians(
        Math.asin(Math.sin(epsilonRad) * Math.sin(lambdaRad))
      )
    )
  );

  // Geographic Latitude is direct declination
  const sunLat = asLatitude(delta);

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
  const F = normalizeAngle(ast.MOON_MEAN_ARG_LAT_BASE + ast.MOON_MEAN_ARG_LAT_RATE * n);

  const MmRad = toRadians(Mm);
  const DRad = toRadians(D);
  const FRad = toRadians(F);

  // 2. Simplified Ecliptic Coordinates
  const lambdaM = asEclipticLongitude(
    normalizeAngle(
      Lm +
      ast.MOON_ECLIPTIC_LON_C1 * Math.sin(MmRad) +
      ast.MOON_ECLIPTIC_LON_C2 * Math.sin(2 * DRad - MmRad)
    )
  );
  const lambdaMRad = toRadians(lambdaM);

  const betaM = asEclipticLatitude(
    asDegrees(ast.MOON_ECLIPTIC_LAT_C1 * Math.sin(FRad))
  );
  const betaMRad = toRadians(betaM);

  // 3. Obliquity
  const epsilonRad = getEclipticObliquity(n);

  // 4. Equatorial conversion (Right Ascension alphaM, Declination deltaM)
  const alphaM = asRightAscension(
    toDegrees(
      asRadians(
        Math.atan2(
          Math.cos(epsilonRad) * Math.sin(lambdaMRad) -
            Math.tan(betaMRad) * Math.sin(epsilonRad),
          Math.cos(lambdaMRad)
        )
      )
    )
  );
  const deltaM = asDeclination(
    toDegrees(
      asRadians(
        Math.asin(
          Math.sin(betaMRad) * Math.cos(epsilonRad) +
            Math.cos(betaMRad) * Math.sin(epsilonRad) * Math.sin(lambdaMRad)
        )
      )
    )
  );

  const moonLat = asLatitude(deltaM);

  // 5. Greenwich Hour Angle (GHA)
  // GHA = GMST - Right Ascension
  const gmst = normalizeAngle(ast.GMST_BASE + ast.GMST_RATE * n);
  const gha = normalizeAngle(gmst - alphaM);
  
  // Longitude is -GHA, normalized to [-180, 180]
  const moonLon = normalizeLongitude(-gha);

  return [moonLon, moonLat];
}
