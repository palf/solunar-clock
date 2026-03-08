import { describe, expect, it } from 'vitest';
import { calculateSunPosition, calculateMoonPosition } from './astronomy';

describe('Astronomy Calculations', () => {
  it('calculates sun position correctly for a known date', () => {
    const date = new Date('2024-03-07T12:00:00Z');
    const pos = calculateSunPosition(date);
    
    // London roughly midday
    expect(pos[0]).toBeLessThan(10);
    expect(pos[0]).toBeGreaterThan(-10);
  });

  it('calculates moon position correctly for a known date', () => {
    const date = new Date('2024-03-07T12:00:00Z');
    const pos = calculateMoonPosition(date);
    
    expect(pos).toHaveLength(2);
    expect(pos[0]).toBeGreaterThanOrEqual(-180);
    expect(pos[0]).toBeLessThanOrEqual(180);
  });

  it('moves sun position over time', () => {
    const d1 = new Date('2024-03-07T12:00:00Z');
    const d2 = new Date('2024-03-07T13:00:00Z');
    
    const p1 = calculateSunPosition(d1);
    const p2 = calculateSunPosition(d2);
    
    // Should move roughly 15 degrees west
    expect(p2[0]).toBeLessThan(p1[0]);
  });

  it('handles J2000 epoch correctly', () => {
    const date = new Date('2000-01-01T12:00:00Z');
    const pos = calculateSunPosition(date);
    // Sun is at ~0.82 degrees lon at J2000 noon
    expect(pos[0]).toBeCloseTo(0.82, 1);
  });

  it('wraps longitude correctly', () => {
    const date = new Date('2024-03-07T00:00:00Z');
    const pos = calculateSunPosition(date);
    expect(pos[0]).toBeGreaterThanOrEqual(-180);
    expect(pos[0]).toBeLessThanOrEqual(180);
  });

  it('calculates different positions for sun and moon', () => {
    const date = new Date('2024-03-07T12:00:00Z');
    const sun = calculateSunPosition(date);
    const moon = calculateMoonPosition(date);
    expect(sun).not.toEqual(moon);
  });

  it('positions change predictably over 24 hours', () => {
    const d1 = new Date('2024-03-07T12:00:00Z');
    const d2 = new Date('2024-03-08T12:00:00Z');
    const p1 = calculateSunPosition(d1);
    const p2 = calculateSunPosition(d2);
    
    // Sun should be back roughly in the same longitude
    expect(Math.abs(p1[0] - p2[0])).toBeLessThan(2);
  });
});
