import { describe, expect, it, vi } from 'vitest';
import { TimeSimulation } from './time-simulation';
import { asTimeMultiplier } from './types';

describe('TimeSimulation', () => {
  it('returns the actual system time by default', () => {
    const start = new Date();
    const sim = new TimeSimulation(start, asTimeMultiplier(1.0));
    const now = sim.getSimulatedTime();
    
    expect(now.getTime()).toBeGreaterThanOrEqual(start.getTime());
  });

  it('correctly calculates simulated time when speed is increased', () => {
    const start = new Date('2024-03-07T12:00:00Z');
    const sim = new TimeSimulation(start, asTimeMultiplier(60.0)); // 1 minute per second
    
    // Fast forward 1 second in real time
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 1000));
    
    const now = sim.getSimulatedTime();
    expect(now.getTime()).toBeGreaterThanOrEqual(start.getTime() + 60000);
    vi.useRealTimers();
  });
});
