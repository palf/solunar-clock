import { describe, expect, it } from 'vitest';
import { Astronomy } from './astronomy';

describe('Astronomy', () => {
  it('calculates sun position correctly for a known date (J2000 epoch)', () => {
    const date = new Date('2000-01-01T12:00:00Z');
    const [lon, lat] = Astronomy.calculateSunPosition(date);
    expect(lat).toBeLessThan(-22);
    expect(lat).toBeGreaterThan(-24);
    expect(Math.abs(lon)).toBeLessThan(2.0); // Within 2 degrees of 0
  });

  it('calculates sun position for Spring Equinox (approx)', () => {
    const date = new Date('2024-03-20T12:00:00Z');
    const [lon, lat] = Astronomy.calculateSunPosition(date);
    expect(Math.abs(lat)).toBeLessThan(1.0); // Within 1 degree of equator
    expect(Math.abs(lon)).toBeLessThan(3.0); // Within 3 degrees of 0
  });

  it('calculates sun position for Summer Solstice (approx)', () => {
    const date = new Date('2024-06-21T12:00:00Z');
    const [_, lat] = Astronomy.calculateSunPosition(date);
    expect(lat).toBeGreaterThan(23); // Near Tropic of Cancer
  });

  it('calculates sun position for Winter Solstice (approx)', () => {
    const date = new Date('2024-12-21T12:00:00Z');
    const [_, lat] = Astronomy.calculateSunPosition(date);
    expect(lat).toBeLessThan(-23);
  });

  it('calculates moon position for a known date', () => {
    const date = new Date('2024-03-07T12:00:00Z');
    const [lon, lat] = Astronomy.calculateMoonPosition(date);
    expect(Number.isFinite(lon)).toBe(true);
    expect(Number.isFinite(lat)).toBe(true);
    expect(lat).toBeGreaterThanOrEqual(-30);
    expect(lat).toBeLessThanOrEqual(30);
  });

  it('handles extremely old dates', () => {
    const date = new Date('1900-01-01T00:00:00Z');
    const [lon, lat] = Astronomy.calculateSunPosition(date);
    expect(Number.isFinite(lon)).toBe(true);
    expect(Number.isFinite(lat)).toBe(true);
  });

  it('handles future dates', () => {
    const date = new Date('2100-01-01T00:00:00Z');
    const [lon, lat] = Astronomy.calculateSunPosition(date);
    expect(Number.isFinite(lon)).toBe(true);
    expect(Number.isFinite(lat)).toBe(true);
  });
});
