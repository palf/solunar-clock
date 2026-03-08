import { describe, expect, it, beforeEach } from 'vitest';
import { MapRenderer } from './map-renderer';
import { Projection } from './projection';
import { asLatitude, asLongitude, asScale } from './types';
import * as d3 from 'd3';

describe('MapRenderer', () => {
  let projection: Projection;
  let mapG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

  beforeEach(() => {
    const svg = d3.select(document.body).append('svg');
    mapG = svg.append('g') as any;
    projection = new Projection(300, 300, asLatitude(0), asLongitude(0), asScale(100));
  });

  it('renders a GeoJSON feature collection correctly', () => {
    const renderer = new MapRenderer(mapG, projection);
    const data = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[asLongitude(0), asLatitude(0)], [asLongitude(10), asLatitude(0)], [asLongitude(10), asLatitude(10)], [asLongitude(0), asLatitude(10)], [asLongitude(0), asLatitude(0)]]]
          }
        }
      ]
    };

    renderer.render(data as any);
    expect(mapG.selectAll('path').size()).toBe(1);
  });

  it('handles null map data by falling back to a world outline', () => {
    const renderer = new MapRenderer(mapG, projection);
    renderer.render(null);
    expect(mapG.selectAll('path').size()).toBe(1);
    expect(mapG.select('path').attr('class')).toBe('land');
  });
});
