/**
 * Type definitions for the Solunar Clock application
 */

export type GeoCoordinates = [number, number]; // [longitude, latitude]

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

export type TopoJSONData = any; // TopoJSON is too complex for unknown in these specific d3/topojson-client calls
