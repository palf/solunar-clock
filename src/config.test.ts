import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';

describe('Configuration', () => {
  it('defines valid latitude and longitude for the home location', () => {
    expect(CONFIG.HOME_LOCATION.lat).toBeGreaterThan(-90);
    expect(CONFIG.HOME_LOCATION.lat).toBeLessThan(90);
    expect(CONFIG.HOME_LOCATION.lon).toBeGreaterThan(-180);
    expect(CONFIG.HOME_LOCATION.lon).toBeLessThan(180);
  });
});
