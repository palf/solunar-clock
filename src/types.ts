/**
 * Type definitions for the Solunar Clock application
 */

declare const topojson: any;
declare const d3: any;

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
  geometries?: any[];
}

export interface TopoJSONData {
  type?: string;
  objects?: {
    land?: TopoJSONObject;
    countries?: TopoJSONObject;
    [key: string]: TopoJSONObject | undefined;
  };
  features?: GeoFeature[];
}
