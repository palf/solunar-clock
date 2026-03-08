import { describe, expect, it } from 'vitest';
import { calculateSunPosition, calculateMoonPosition, normalizeLongitude } from './astronomy';

describe('Astronomy Calculations', () => {
  it('calculates the sun position correctly for a known date', () => {
    const date = new Date('2024-03-07T12:00:00Z');
    const pos = calculateSunPosition(date);
    
    // London roughly midday
    expect(pos[0]).toBeLessThan(10);
    expect(pos[0]).toBeGreaterThan(-10);
  });

  it('calculates the moon position correctly for a known date', () => {
    const date = new Date('2024-03-07T12:00:00Z');
    const pos = calculateMoonPosition(date);
    
    expect(pos).toHaveLength(2);
    expect(pos[0]).toBeGreaterThanOrEqual(-180);
    expect(pos[0]).toBeLessThanOrEqual(180);
  });

  it('moves the sun position westward over time', () => {
    const d1 = new Date('2024-03-07T12:00:00Z');
    const d2 = new Date('2024-03-07T13:00:00Z');
    
    const p1 = calculateSunPosition(d1);
    const p2 = calculateSunPosition(d2);
    
    // Should move roughly 15 degrees west
    expect(p2[0]).toBeLessThan(p1[0]);
  });

  it('handles the J2000 epoch correctly', () => {
    const date = new Date('2000-01-01T12:00:00Z');
    const pos = calculateSunPosition(date);
    // Sun is at ~0.82 degrees lon at J2000 noon
    expect(pos[0]).toBeCloseTo(0.82, 1);
  });

  it('wraps positive longitude values correctly', () => {
    const date = new Date('2024-03-07T00:00:00Z');
    const pos = calculateSunPosition(date);
    expect(pos[0]).toBeGreaterThanOrEqual(-180);
    expect(pos[0]).toBeLessThanOrEqual(180);
  });

  it('wraps high-negative longitude values correctly', () => {
    const times = [0, 6, 12, 18].map(h => new Date(2024, 0, 1, h));
    times.forEach(t => {
      const p = calculateSunPosition(t);
      expect(p[0]).toBeGreaterThanOrEqual(-180);
      expect(p[0]).toBeLessThanOrEqual(180);
    });
  });

  it('correctly normalizes longitude across multiple revolutions', () => {
    expect(normalizeLongitude(1000)).toBeCloseTo(-80, 1);
    expect(normalizeLongitude(-1000)).toBeCloseTo(80, 1);
    // 180 and -180 are the same meridian. Our formula returns -180.
    expect(normalizeLongitude(180)).toBe(-180);
    expect(normalizeLongitude(-180)).toBe(-180);
    expect(normalizeLongitude(360)).toBe(0);
  });

  it('calculates distinct positions for the sun and moon', () => {
    const date = new Date('2024-03-07T12:00:00Z');
    const sun = calculateSunPosition(date);
    const moon = calculateMoonPosition(date);
    expect(sun).not.toEqual(moon);
  });

  it('predictably cycles the sun position over 24 hours', () => {
    const d1 = new Date('2024-03-07T12:00:00Z');
    const d2 = new Date('2024-03-08T12:00:00Z');
    const p1 = calculateSunPosition(d1);
    const p2 = calculateSunPosition(d2);
    
    // Sun should be back roughly in the same longitude
    expect(Math.abs(p1[0] - p2[0])).toBeLessThan(2);
  });

  it('calculates the westward drift of the moon relative to the sun', () => {
    const d1 = new Date('2024-03-07T12:00:00Z');
    const d2 = new Date('2024-03-08T12:00:00Z');
    
    const m1 = calculateMoonPosition(d1);
    const m2 = calculateMoonPosition(d2);
    
    // In 24 hours, the Earth rotates 360 degrees. 
    // The Moon moves ~13.2 degrees in its orbit.
    // So after 24h, the Moon should be ~13 degrees EAST (larger longitude) 
    // of where it was relative to the stars, but on our globe clock (which rotates with Earth), 
    // it appears to "lag" behind the sun.
    
    let diff = m2[0] - m1[0];
    // Normalize to handle wrap
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    
    // Expect ~12-15 degrees of daily EASTWARD movement (increasing longitude)
    expect(diff).toBeGreaterThan(10);
    expect(diff).toBeLessThan(16);
  });

  it.skip('calculates the lunar sidereal period correctly (~27.32 days)', () => {

    // A sidereal month is ~27.32166 days.
    // In our model, after this time, the Moon's RA returns to start.
    // However, the Earth has rotated 27 full times + 0.32166 of a rotation.
    // So the longitude (GHA) will be shifted by ~0.32166 * 360 degrees.
    const start = new Date('2024-03-07T12:00:00Z');
    const siderealMonthMs = 27.32166 * 24 * 60 * 60 * 1000;
    const end = new Date(start.getTime() + siderealMonthMs);
    
    const m1 = calculateMoonPosition(start);
    const m2 = calculateMoonPosition(end);
    
    let diff = m2[0] - m1[0];
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    
    // The observed shift is ~116 degrees.
    // (0.32166 * 360) = 115.8 degrees.
    expect(Math.abs(diff)).toBeCloseTo(116, 0);
  });

  it('calculates the north/south latitude oscillation of the moon (~5.1 degrees)', () => {
    // Check points over a month to find max/min latitude
    let maxLat = -90;
    let minLat = 90;
    const start = new Date('2024-03-07T12:00:00Z');
    
    for (let day = 0; day < 30; day++) {
      const d = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
      const pos = calculateMoonPosition(d);
      maxLat = Math.max(maxLat, pos[1]);
      minLat = Math.min(minLat, pos[1]);
    }
    
    // The Moon's orbit is tilted ~5.1 degrees to the ecliptic, 
    // which is itself tilted ~23.4 degrees to the equator.
    // Total swing should be substantial (up to ~28 degrees)
    expect(maxLat).toBeGreaterThan(18);
    expect(minLat).toBeLessThan(-18);
  });

  it('calculates extreme latitude swings during Solstices', () => {
    const summer = new Date('2024-06-21T12:00:00Z');
    const winter = new Date('2024-12-21T12:00:00Z');
    
    const pSum = calculateSunPosition(summer);
    const pWin = calculateSunPosition(winter);
    
    expect(pSum[1]).toBeGreaterThan(23);
    expect(pWin[1]).toBeLessThan(-23);
  });

  it('calculates near-zero latitudes during Equinoxes', () => {
    const spring = new Date('2024-03-20T12:00:00Z');
    const autumn = new Date('2024-09-22T12:00:00Z');
    
    const pSpr = calculateSunPosition(spring);
    const pAut = calculateSunPosition(autumn);
    
    expect(Math.abs(pSpr[1])).toBeLessThan(1.0);
    expect(Math.abs(pAut[1])).toBeLessThan(1.0);
  });

  it('positions the sun within 5 degrees of standard 24-hour clock time', () => {
    for (let i = 0; i < 100; i++) {
      const timestamp = Date.now() + (Math.random() - 0.5) * 10 * 365 * 24 * 60 * 60 * 1000;
      const date = new Date(timestamp);
      
      const pos = calculateSunPosition(date);
      const sunLon = pos[0];

      const hoursSinceNoon = (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) - 12;
      let clockLon = -hoursSinceNoon * 15;
      
      if (clockLon > 180) clockLon -= 360;
      if (clockLon < -180) clockLon += 360;

      let diff = Math.abs(sunLon - clockLon);
      if (diff > 180) diff = 360 - diff;

      expect(diff).toBeLessThan(5);
    }
  });

  it('positions the moon due south from Greenwich at a specific time (2026-03-08 03:27 UTC)', () => {
    // According to our model, at this time the moon should be near 0 longitude.
    const date = new Date('2026-03-08T03:27:00Z');
    const [lon, _lat] = calculateMoonPosition(date);
    
    // "Due south" means longitude is 0.
    // We allow a small tolerance for precision.
    expect(lon).toBeCloseTo(0, 0); // Within 0.5 degrees
  });
});
