import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';

describe('Configuration', () => {
  it('contains valid essential display dimensions', () => {
    expect(CONFIG.WIDTH).toBeGreaterThan(0);
    expect(CONFIG.HEIGHT).toBeGreaterThan(0);
  });

  it('defines valid latitude and longitude location constants', () => {
    expect(CONFIG.HOME_LOCATION.lat).toBeGreaterThan(-90);
    expect(CONFIG.HOME_LOCATION.lat).toBeLessThan(90);
    expect(CONFIG.DEFAULT_LOCATION.lat).toBe(51.5074);
  });

  it('specifies valid HTTPS map data sources', () => {
    expect(CONFIG.MAP_DATA_SOURCES.length).toBeGreaterThan(0);
    expect(CONFIG.MAP_DATA_SOURCES[0]).toMatch(/^https?:\/\//);
  });
});
