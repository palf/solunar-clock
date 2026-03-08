import { describe, expect, it, beforeEach } from 'vitest';
import { TileRenderer } from './tile-renderer';
import { Projection } from './projection';
import { asLatitude, asLongitude, asScale } from './types';

describe('TileRenderer Math', () => {
  let projection: Projection;
  let renderer: TileRenderer;

  beforeEach(() => {
    // Mock canvases
    const canvas2d = document.createElement('canvas');
    const canvas3d = document.createElement('canvas');
    projection = new Projection(300, 300, asLatitude(51.5), asLongitude(-0.1), asScale(100));
    renderer = new TileRenderer(canvas2d, canvas3d, projection);
  });

  it('converts geographic coordinates to the correct tile indices', () => {
    // @ts-expect-error - accessing private for test
    const [x, y] = renderer.lonLatToTile(-0.1, 51.5, 10);
    
    // London at Z10 is roughly 511, 340
    expect(Math.floor(x)).toBe(511);
    expect(Math.floor(y)).toBe(340);
  });

  it('converts tile indices back to the correct geographic coordinates', () => {
    // @ts-expect-error - accessing private for test
    const [lon, lat] = renderer.tileToLonLat(511, 340, 10);

    expect(lon).toBeCloseTo(-0.35, 1);
    expect(lat).toBeCloseTo(51.6, 1);
  });

  it('clamps the latitude at the poles during tile index calculation', () => {
    // @ts-expect-error - accessing private for test
    const [_, yHigh] = renderer.lonLatToTile(0, 89, 10);
    // @ts-expect-error - accessing private for test
    const [__, yCapped] = renderer.lonLatToTile(0, 85.0511, 10);
    
    // Web Mercator caps at ~85.05 degrees, so 89 should be the same as 85.0511
    expect(yHigh).toBeCloseTo(yCapped, 5);
  });
});
