import { describe, expect, it } from 'vitest';
import { Projection } from './projection';
import { asLongitude, asLatitude, asScale } from './types';
import { normalizeLongitude } from './astronomy';

describe('Projection Math', () => {
  const cx = 300;
  const cy = 300;
  const lat0 = asLatitude(51.5);
  const lon0 = asLongitude(-0.1);
  const scale = asScale(100);

  it('projects the center point exactly to cx, cy', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    const [x, y] = p.project([lon0, lat0]);
    expect(x).toBeCloseTo(cx);
    expect(y).toBeCloseTo(cy);
  });

  it('projects a point to the north correctly relative to the center', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    const [x, y] = p.project([lon0, asLatitude(lat0 + 1)]);
    expect(x).toBeCloseTo(cx);
    expect(y).toBeLessThan(cy);
  });

  it('projects a point to the east correctly relative to the center', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    const [x, y] = p.project([asLongitude(lon0 + 1), lat0]);
    expect(x).toBeGreaterThan(cx);
    expect(y).toBeCloseTo(cy, 0); // AE isn't perfectly horizontal for east
  });

  it('correctly updates the center and scale of the projection', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    p.updateCenter(asLatitude(0), asLongitude(0));
    p.updateScale(asScale(200));
    
    const [x, y] = p.project([asLongitude(0), asLatitude(0)]);
    expect(x).toBeCloseTo(cx);
    expect(y).toBeCloseTo(cy);
    expect(p.getScale()).toBe(200);
  });

  it('returns the current center coordinates', () => {
    const p = new Projection(cx, cy, lat0, lon0, scale);
    const center = p.getCenter();
    expect(center.lat).toBe(lat0);
    expect(center.lon).toBe(lon0);
  });

  it('handles longitude wrapping correctly across the dateline', () => {
    const p = new Projection(cx, cy, asLatitude(0), asLongitude(179), scale);
    const [x1, y1] = p.project([normalizeLongitude(181), asLatitude(0)]); // Should wrap to -179
    const [x2, y2] = p.project([asLongitude(-179), asLatitude(0)]);
    expect(x1).toBeCloseTo(x2);
    expect(y1).toBeCloseTo(y2);
  });

  it('projects points far away from the center correctly', () => {
    const p = new Projection(cx, cy, asLatitude(0), asLongitude(0), scale);
    const [x, _y] = p.project([asLongitude(90), asLatitude(0)]);
    expect(x).toBeGreaterThan(cx);
  });

  it('handles calculations at the poles without errors', () => {
    const p = new Projection(cx, cy, asLatitude(90), asLongitude(0), scale);
    const [_x, y] = p.project([asLongitude(0), asLatitude(89)]);
    expect(y).toBeGreaterThan(cy);
  });
});
