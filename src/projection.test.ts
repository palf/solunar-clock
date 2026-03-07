import { describe, it, expect } from 'vitest';
import { Projection } from './projection';

describe('Projection', () => {
  it('projects center coordinate to center screen coordinate', () => {
    const centerX = 300;
    const centerY = 300;
    const lat = 51.5074;
    const lon = -0.1278;
    const scale = 40;
    
    const projection = new Projection(centerX, centerY, lat, lon, scale);
    const [x, y] = projection.project([lon, lat]);
    
    expect(x).toBeCloseTo(centerX, 5);
    expect(y).toBeCloseTo(centerY, 5);
  });

  it('projects a different coordinate to a different screen coordinate', () => {
    const centerX = 300;
    const centerY = 300;
    const lat = 0;
    const lon = 0;
    const scale = 100;
    
    const projection = new Projection(centerX, centerY, lat, lon, scale);
    const [x, y] = projection.project([10, 10]); // Somewhere else
    
    expect(x).not.toBe(centerX);
    expect(y).not.toBe(centerY);
  });
});
