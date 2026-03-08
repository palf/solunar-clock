/**
 * Type definitions for the Solunar Clock application
 */

/**
 * Branded types for coordinate units to prevent accidental mixing.
 */
export type Degrees = number & { readonly __brand: 'Degrees' };
export type Longitude = number & { readonly __brand: 'Longitude' };
export type Latitude = number & { readonly __brand: 'Latitude' };
export type TimeMultiplier = number & { readonly __brand: 'TimeMultiplier' }; // SIMULATED_SECONDS / REAL_SECONDS
export type Milliseconds = number & { readonly __brand: 'Milliseconds' };
export type Scale = number & { readonly __brand: 'Scale' };
export type ScreenPixel = number & { readonly __brand: 'ScreenPixel' };
export type ZoomMultiplier = number & { readonly __brand: 'ZoomMultiplier' };

export type MapLayer = 'STREETS' | 'TOPOGRAPHIC' | 'IMAGERY';

/**
 * Smart constructors for branded types.
 * These validate requirements and throw errors for invalid inputs.
 */
export const asDegrees = (n: number): Degrees => {
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid degrees: ${n}`);
  }
  return n as Degrees;
};

export const asTimeMultiplier = (n: number): TimeMultiplier => {
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid time multiplier: ${n}`);
  }
  return n as TimeMultiplier;
};

export const asMilliseconds = (n: number): Milliseconds => {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid milliseconds: ${n}`);
  }
  return n as Milliseconds;
};

export const asScale = (n: number): Scale => {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid scale: ${n}`);
  }
  return n as Scale;
};

export const asScreenPixel = (n: number): ScreenPixel => {
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid screen pixel: ${n}`);
  }
  return n as ScreenPixel;
};

export const asZoomMultiplier = (n: number): ZoomMultiplier => {
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid zoom multiplier: ${n}`);
  }
  return n as ZoomMultiplier;
};

export const asLongitude = (n: number): Longitude => {
  // We allow a tiny margin for floating point errors at the boundaries
  if (!Number.isFinite(n) || n < -180.000000000001 || n > 180.000000000001) {
    throw new Error(`Longitude must be between -180 and 180. Received: ${n}`);
  }
  return n as Longitude;
};

export const asLatitude = (n: number): Latitude => {
  if (!Number.isFinite(n) || n < -90.000000000001 || n > 90.000000000001) {
    throw new Error(`Latitude must be between -90 and 90. Received: ${n}`);
  }
  return n as Latitude;
};

export type GeoCoordinates = [Longitude, Latitude]; // [longitude, latitude]

export interface GeoRing extends Array<GeoCoordinates> {}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: GeoRing[];
}

export interface GeoMultiPolygon {
  type: 'MultiPolygon';
  coordinates: GeoRing[][];
}

export interface GeoFeature {
  geometry: GeoPolygon | GeoMultiPolygon | null;
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export interface TopoJSONObject {
  type: 'GeometryCollection';
  geometries?: unknown[];
}

export type TopoJSONData = any; // TopoJSON is too complex for unknown in these specific d3/topojson-client calls.
