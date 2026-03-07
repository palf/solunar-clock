import { describe, it, expect, vi } from 'vitest';
import { TimeSimulation } from './time-simulation';

describe('TimeSimulation', () => {
  it('advances time according to the speed multiplier', () => {
    const start = new Date('2024-03-07T12:00:00Z');
    const sim = new TimeSimulation(start, 2); // 2x speed
    
    // Fast-forward real time
    const realElapsed = 1000; // 1s
    const now = new Date(start.getTime() + realElapsed);
    
    vi.useFakeTimers();
    vi.setSystemTime(now);
    
    const simulated = sim.getSimulatedTime();
    
    // In 2x speed, simulated time should be 2s ahead
    expect(simulated.getTime() - start.getTime()).toBe(2000);
    
    vi.useRealTimers();
  });
});
