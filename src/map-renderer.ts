/**
 * Map rendering functionality for displaying world map data
 */

/// <reference path="./types.ts" />

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CONFIG } from './config';
import type { Projection } from './projection';
import { asLongitude, asLatitude, type GeoCoordinates, type GeoFeature, type TopoJSONData } from './types';

export class MapRenderer {
  constructor(
    private mapGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
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
      const mesh = topojson.mesh(
        topoData,
        topoData.objects.countries,
        (a: any, b: any) => a !== b
      ) as any;
      if (!mesh?.coordinates) return;

      const path = d3.path();
      mesh.coordinates.forEach((line: any[]) => {
        line.forEach((pt: any, idx: number) => {
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
      [asLongitude(-180), asLatitude(-60)],
      [asLongitude(-180), asLatitude(80)],
      [asLongitude(-120), asLatitude(80)],
      [asLongitude(-60), asLatitude(80)],
      [asLongitude(0), asLatitude(80)],
      [asLongitude(60), asLatitude(80)],
      [asLongitude(120), asLatitude(80)],
      [asLongitude(180), asLatitude(80)],
      [asLongitude(180), asLatitude(60)],
      [asLongitude(180), asLatitude(0)],
      [asLongitude(180), asLatitude(-60)],
      [asLongitude(120), asLatitude(-60)],
      [asLongitude(60), asLatitude(-60)],
      [asLongitude(0), asLatitude(-60)],
      [asLongitude(-60), asLatitude(-60)],
      [asLongitude(-120), asLatitude(-60)],
      [asLongitude(-180), asLatitude(-60)],
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
      .attr('class', 'land');
  }

  /**
   * Main render method
   */
  render(data: TopoJSONData | null): void {
    this.mapGroup.selectAll('*').remove();

    if (!data) {
      this.renderFallbackOutline();
      return;
    }

    // Try TopoJSON mesh first (coastlines only)
    if (data.objects) {
      console.log('Detected TopoJSON format');
      this.renderCoastlines(data);
    } else if (data.type === 'FeatureCollection' || data.features) {
      console.log('Detected GeoJSON format');
      const features = (data.features || data) as GeoFeature[];
      this.renderGeoJSONFeatures(features);
    } else {
      this.renderFallbackOutline();
    }
  }
}
