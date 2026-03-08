import { describe, expect, it } from 'vitest';
import { Projection } from './projection';

describe('Projection Math', () => {
  const cx = 300;
  const cy = 300;
  const lat0 = 51.5;
  const lon0 = -0.1;
  const scale = 100;

  it('projects the center point to cx, cy', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    const [x, y] = p.project([lon0, lat0]);
    expect(x).toBeCloseTo(cx);
    expect(y).toBeCloseTo(cy);
  });

  it('projects a point to the north correctly', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    const [x, y] = p.project([lon0, lat0 + 1]);
    expect(x).toBeCloseTo(cx);
    expect(y).toBeLessThan(cy);
  });

  it('projects a point to the east correctly', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    const [x, y] = p.project([lon0 + 1, lat0]);
    expect(x).toBeGreaterThan(cx);
    expect(y).toBeCloseTo(cy, 0); // AE isn't perfectly horizontal for east
  });

  it('updates center and scale', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    p.updateCenter(0, 0);
    p.updateScale(200);
    
    const [x, y] = p.project([0, 0]);
    expect(x).toBeCloseTo(cx);
    expect(y).toBeCloseTo(cy);
    expect(p.getScale()).toBe(200);
  });

  it('returns center coordinates', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    const center = p.getCenter();
    expect(center.lat).toBe(lat0);
    expect(center.lon).toBe(lon0);
  });

  it('handles longitude wrapping in project', () => {
    const p = new Projection(cx, cy, 0, 179, scale);
    const [x1, y1] = p.project([181, 0]); // Should wrap to -179
    const [x2, y2] = p.project([-179, 0]);
    expect(x1).toBeCloseTo(x2);
    expect(y1).toBeCloseTo(y2);
  });

  it('projects a point far away', () => {
    const p = new Projection(cx, cy, 0, 0, scale);
    const [x, _y] = p.project([90, 0]);
    expect(x).toBeGreaterThan(cx);
  });

  it('handles poles', () => {
    const p = new Projection(cx, cy, 90, 0, scale);
    const [_x, y] = p.project([0, 89]);
    expect(y).toBeGreaterThan(cy);
  });
});
