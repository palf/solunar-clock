/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapRenderer } from './map-renderer';
import { Projection } from './projection';

describe('MapRenderer', () => {
  let mapG: any;
  let projection: Projection;

  beforeEach(() => {
    mapG = {
      append: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis()
    };
    projection = new Projection(300, 300, 0, 0, 100);
    
    // Mock d3.path
    vi.stubGlobal('d3', {
      path: () => ({
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        toString: () => 'path-data'
      }),
      json: vi.fn()
    });

    // Mock topojson
    vi.stubGlobal('topojson', {
      feature: vi.fn().mockReturnValue({ features: [] }),
      mesh: vi.fn().mockReturnValue({ coordinates: [] })
    });
  });

  it('renders a GeoJSON feature collection', async () => {
    const renderer = new MapRenderer(mapG, projection);
    const mockData = {
      type: 'FeatureCollection',
      features: [
        {
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        }
      ]
    };

    await renderer.render(mockData as any);
    expect(mapG.append).toHaveBeenCalledWith('path');
  });

  it('handles null map data with fallback', async () => {
    const renderer = new MapRenderer(mapG, projection);
    await renderer.render(null);
    
    // Fallback outline should be rendered
    expect(mapG.append).toHaveBeenCalledWith('path');
  });
});
