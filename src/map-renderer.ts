/**
 * Map rendering functionality for displaying world map data
 */

/// <reference path="./types.ts" />

import { CONFIG } from './config';
import type { Projection } from './projection';
import type { GeoCoordinates, GeoFeature, GeoFeatureCollection, TopoJSONData } from './types';

export class MapRenderer {
  constructor(
    private mapGroup: d3.Selection<SVGGElement, unknown, any, any>,
    private projection: Projection
  ) {}

  /**
   * Load map data from available sources
   * Returns the loaded data or null if all sources fail
   */
  async loadMapData(): Promise<TopoJSONData | null> {
    for (const url of CONFIG.MAP_DATA_SOURCES) {
      try {
        console.log(`Trying map source: ${url}`);
        const data = (await d3.json(url)) as TopoJSONData;

        if (data && (data.type === 'FeatureCollection' || data.objects || data.features)) {
          console.log(`Successfully loaded map from: ${url}`);
          return data;
        }
        throw new Error('Invalid data structure');
      } catch (err) {
        console.warn(`Failed to load map from ${url}:`, err);
        if (url === CONFIG.MAP_DATA_SOURCES[CONFIG.MAP_DATA_SOURCES.length - 1]) {
          console.error('All map sources failed to load');
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Render map features from GeoJSON
   */
  private renderGeoJSONFeatures(features: GeoFeature[]): void {
    features.forEach((feat: GeoFeature) => {
      const geom = feat.geometry;
      if (!geom) return;

      if (geom.type === 'Polygon') {
        const rings = geom.coordinates.map((r) => r.map((pt) => [pt[0], pt[1]] as GeoCoordinates));
        const d = this.projection.geoPathFromCoords(rings);
        this.mapGroup.append('path').attr('d', d).attr('class', 'land');
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((polygon) => {
          const rings = polygon.map((r) => r.map((pt) => [pt[0], pt[1]] as GeoCoordinates));
          const d = this.projection.geoPathFromCoords(rings);
          this.mapGroup.append('path').attr('d', d).attr('class', 'land');
        });
      }
    });
  }

  /**
   * Render coastlines from TopoJSON mesh
   */
  private renderCoastlines(topoData: TopoJSONData): void {
    if (!topoData.objects?.countries) return;

    try {
      const mesh = topojson.mesh(topoData, topoData.objects.countries, (a: any, b: any) => a !== b);
      if (!mesh?.coordinates) return;

      const path = d3.path();
      mesh.coordinates.forEach((line: GeoCoordinates[]) => {
        line.forEach((pt: GeoCoordinates, idx: number) => {
          const [x, y] = this.projection.project(pt);
          if (idx === 0) {
            path.moveTo(x, y);
          } else {
            path.lineTo(x, y);
          }
        });
      });
      this.mapGroup.append('path').attr('d', path.toString()).attr('class', 'coast');
    } catch (e) {
      console.warn('Could not create mesh:', e);
    }
  }

  /**
   * Render fallback world outline
   */
  private renderFallbackOutline(): void {
    console.log('Creating fallback world outline');
    const fallbackPath = d3.path();
    const worldOutline: GeoCoordinates[] = [
      [-180, -60],
      [-180, 80],
      [-120, 80],
      [-60, 80],
      [0, 80],
      [60, 80],
      [120, 80],
      [180, 80],
      [180, 60],
      [180, 0],
      [180, -60],
      [120, -60],
      [60, -60],
      [0, -60],
      [-60, -60],
      [-120, -60],
      [-180, -60],
    ];

    worldOutline.forEach((pt: GeoCoordinates, idx: number) => {
      const [x, y] = this.projection.project(pt);
      if (idx === 0) {
        fallbackPath.moveTo(x, y);
      } else {
        fallbackPath.lineTo(x, y);
      }
    });

    this.mapGroup
      .append('path')
      .attr('d', fallbackPath.toString())
      .attr('class', 'land')
      .attr('fill', '#e6f0dd')
      .attr('stroke', '#2b3b2b')
      .attr('stroke-width', 1);
  }

  /**
   * Render the map with current projection center
   */
  async render(mapData: TopoJSONData | null): Promise<void> {
    this.mapGroup.selectAll('*').remove();

    if (!mapData) {
      this.renderFallbackOutline();
      return;
    }

    try {
      // Handle GeoJSON format
      if (mapData.type === 'FeatureCollection') {
        console.log('Detected GeoJSON format');
        this.renderGeoJSONFeatures((mapData as GeoFeatureCollection).features);
      }
      // Handle TopoJSON format
      else if (mapData.objects?.land) {
        console.log('Detected TopoJSON format with land object');
        const land = topojson.feature(mapData, mapData.objects.land) as GeoFeatureCollection;
        this.renderGeoJSONFeatures(land.features);
        this.renderCoastlines(mapData);
      }
      // Try to find any geometry object
      else if (mapData.objects) {
        const objectKeys = Object.keys(mapData.objects);
        const geometryKey = objectKeys.find((key) => {
          const obj = mapData.objects![key];
          return obj && (obj.type === 'GeometryCollection' || obj.geometries);
        });

        if (geometryKey) {
          console.log(`Using geometry object: ${geometryKey}`);
          const geometry = topojson.feature(
            mapData,
            mapData.objects[geometryKey]!
          ) as GeoFeatureCollection;
          this.renderGeoJSONFeatures(geometry.features);
        } else {
          throw new Error('No suitable geometry found');
        }
      } else {
        throw new Error('No objects property found');
      }
    } catch (mapError) {
      console.error('Error processing map data:', mapError);
      this.renderFallbackOutline();
    }
  }
}
