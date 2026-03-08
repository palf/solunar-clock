/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
      remove: vi.fn().mockReturnThis(),
    };
    projection = new Projection(300, 300, 0, 0, 100);
  });

  it('renders a GeoJSON feature collection correctly', async () => {
    const renderer = new MapRenderer(mapG, projection);
    const mockData = {
      type: 'FeatureCollection',
      features: [
        {
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
                [0, 0],
              ],
            ],
          },
        },
      ],
    };

    await renderer.render(mockData as any);
    expect(mapG.append).toHaveBeenCalledWith('path');
  });

  it('handles null map data by falling back to a world outline', async () => {
    const renderer = new MapRenderer(mapG, projection);
    await renderer.render(null);
    expect(mapG.append).toHaveBeenCalled();
  });
});
