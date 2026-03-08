/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { TileRenderer } from './tile-renderer';
import { Projection } from './projection';

describe('TileRenderer Math', () => {
  let canvas2d: HTMLCanvasElement;
  let canvas3d: HTMLCanvasElement;
  let projection: Projection;
  let renderer: TileRenderer;

  beforeEach(() => {
    canvas2d = document.createElement('canvas');
    canvas3d = document.createElement('canvas');
    projection = new Projection(300, 300, 51.5, -0.1, 100);
    renderer = new TileRenderer(canvas2d, canvas3d, projection);
  });

  it('converts lon/lat to tile coordinates correctly', () => {
    // London at Z=10
    // @ts-ignore - accessing private for test
    const [x, y] = renderer.lonLatToTile(-0.1278, 51.5074, 10);
    
    // Standard OSM tile for London at Z10 is 511/340
    expect(Math.floor(x)).toBe(511);
    expect(Math.floor(y)).toBe(340);
  });

  it('converts tile coordinates to lon/lat correctly', () => {
    // @ts-ignore - accessing private for test
    const [lon, lat] = renderer.tileToLonLat(511, 340, 10);
    
    expect(lon).toBeCloseTo(-0.35, 1);
    expect(lat).toBeCloseTo(51.6, 1);
  });

  it('handles pole clamping in lonLatToTile', () => {
    // @ts-ignore
    const [_, yNorth] = renderer.lonLatToTile(0, 90, 10);
    // @ts-ignore
    const [__, ySouth] = renderer.lonLatToTile(0, -90, 10);
    
    expect(yNorth).toBeGreaterThanOrEqual(0);
    expect(ySouth).toBeLessThan(1024); // 2^10
  });
});
