import { describe, expect, it } from 'vitest';
import { calculateMoonPosition } from './astronomy';

/**
 * Calculates the angular distance between two points on a sphere.
 * Formula: haversine distance (approximated for small angles)
 * Returns distance in degrees.
 */
function angularDistance(pos1: [number, number], pos2: [number, number]): number {
  const [lon1, lat1] = pos1.map(d => d * Math.PI / 180);
  const [lon2, lat2] = pos2.map(d => d * Math.PI / 180);

  const cosTheta = Math.sin(lat1) * Math.sin(lat2) + 
                   Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2);
  
  // Clamp for precision errors
  return Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180 / Math.PI;
}

describe.skip('Moon Position Accuracy Audit', () => {
  const referenceData = [
    {
      date: '2024-03-07T12:00:00Z',
      label: 'March 2024 Midday',
      expected: [17.7, -27.8] // 17° 42' E, 27° 48' S
    },
    {
      date: '2024-06-20T20:51:00Z',
      label: 'June 2024 Solstice-ish',
      expected: [-126.58, -28.28] // 126° 35' W, 28° 17' S
    },
    {
      date: '2025-01-01T00:00:00Z',
      label: 'Jan 2025 Midnight',
      expected: [-174.3, -21.9] // 174° 18' W, 21° 54' S
    }
  ];

  referenceData.forEach(({ date, label, expected }) => {
    it(`accuracy for ${label} (${date})`, () => {
      const actual = calculateMoonPosition(new Date(date));
      const error = angularDistance(actual, expected as [number, number]);
      
      console.log(`[Audit] ${label}:`);
      console.log(`  Expected: [${expected[0]}, ${expected[1]}]`);
      console.log(`  Actual:   [${actual[0].toFixed(2)}, ${actual[1].toFixed(2)}]`);
      console.log(`  Error:    ${error.toFixed(2)}°`);

      // Goal: Under 1.5 degrees for low-precision series
      expect(error).toBeLessThan(1.5);
    });
  });
});
