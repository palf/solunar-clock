import { describe, expect, it } from 'vitest';
import { Projection } from './projection';

describe('Projection', () => {
  const centerX = 300;
  const centerY = 300;
  const scale = 100;

  it('projects center coordinate to center screen coordinate', () => {
    const lat = 51.5074;
    const lon = -0.1278;
    const projection = new Projection(centerX, centerY, lat, lon, scale);
    const [x, y] = projection.project([lon, lat]);
    expect(x).toBeCloseTo(centerX, 5);
    expect(y).toBeCloseTo(centerY, 5);
  });

  it('handles the North Pole as center', () => {
    const projection = new Projection(centerX, centerY, 90, 0, scale);
    const [x, y] = projection.project([0, 90]);
    expect(x).toBeCloseTo(centerX, 5);
    expect(y).toBeCloseTo(centerY, 5);
  });

  it('handles the South Pole as center', () => {
    const projection = new Projection(centerX, centerY, -90, 0, scale);
    const [x, y] = projection.project([0, -90]);
    expect(x).toBeCloseTo(centerX, 5);
    expect(y).toBeCloseTo(centerY, 5);
  });

  it('handles the Anti-meridian (180/-180)', () => {
    const projection = new Projection(centerX, centerY, 0, 180, scale);
    const [x1, y1] = projection.project([180, 0]);
    const [x2, y2] = projection.project([-180, 0]);

    expect(x1).toBeCloseTo(centerX, 5);
    expect(y1).toBeCloseTo(centerY, 5);
    expect(x2).toBeCloseTo(x1, 5);
    expect(y2).toBeCloseTo(y1, 5);
  });

  it('projects coordinates at the edge of the hemisphere', () => {
    const projection = new Projection(centerX, centerY, 0, 0, scale);
    const [x, y] = projection.project([90, 0]); // 90 degrees away

    // Distance in radians is PI/2. Screen distance = (PI/2) * scale
    const expectedDist = (Math.PI / 2) * scale;
    const actualDist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    expect(actualDist).toBeCloseTo(expectedDist, 1);
  });

  it('returns center for invalid coordinates', () => {
    const projection = new Projection(centerX, centerY, 0, 0, scale);
    const [x, y] = projection.project([NaN, Infinity]);
    expect(x).toBe(centerX);
    expect(y).toBe(centerY);
  });
});
