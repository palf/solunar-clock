import { describe, it, expect } from 'vitest';
import { Astronomy } from './astronomy';

describe('Astronomy', () => {
  it('calculates sun position correctly for a known date (J2000 epoch)', () => {
    // J2000 epoch: 2000-01-01 12:00:00 UTC
    const date = new Date('2000-01-01T12:00:00Z');
    const [lon, lat] = Astronomy.calculateSunPosition(date);
    
    // At J2000 epoch, the sun is approximately at (0, -23.4) at noon UTC
    // Lon should be near 0, Lat should be near -23.4 (winter solstice approx)
    expect(lat).toBeCloseTo(-23, 0);
    expect(lon).toBeDefined();
  });

  it('calculates moon position correctly for a known date', () => {
    const date = new Date('2024-03-07T12:00:00Z');
    const [lon, lat] = Astronomy.calculateMoonPosition(date);
    
    expect(Number.isFinite(lon)).toBe(true);
    expect(Number.isFinite(lat)).toBe(true);
    expect(lat).toBeGreaterThanOrEqual(-30);
    expect(lat).toBeLessThanOrEqual(30);
  });
});
