import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';

describe('Config', () => {
  it('has valid dimensions', () => {
    expect(CONFIG.WIDTH).toBeGreaterThan(0);
    expect(CONFIG.HEIGHT).toBeGreaterThan(0);
  });

  it('has a valid J2000 epoch', () => {
    expect(CONFIG.J2000_EPOCH.getUTCFullYear()).toBe(2000);
    expect(CONFIG.J2000_EPOCH.getUTCMonth()).toBe(0); // January
    expect(CONFIG.J2000_EPOCH.getUTCDate()).toBe(1);
  });

  it('has valid clock face settings', () => {
    expect(CONFIG.SLICES).toBeGreaterThan(0);
    expect(CONFIG.HAND_LENGTH_FACTOR).toBeLessThanOrEqual(1.0);
  });
});
