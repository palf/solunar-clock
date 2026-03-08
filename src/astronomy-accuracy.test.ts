import { describe, expect, it } from 'vitest';
import { calculateMoonPosition } from './astronomy';

/**
 * Calculates the angular distance between two points on a sphere.
 * Returns distance in degrees.
 */
function angularDistance(pos1: [number, number], pos2: [number, number]): number {
  const [lon1, lat1] = pos1.map((d) => (d * Math.PI) / 180);
  const [lon2, lat2] = pos2.map((d) => (d * Math.PI) / 180);

  const cosTheta =
    Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2);

  return (Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180) / Math.PI;
}

describe('Moon Position Accuracy Audit', () => {
  const referenceData = [
    {
      date: '2024-03-07T12:00:00Z',
      label: 'March 2024 Midday',
      expected: [-34.9, -23.13],
    },
    {
      date: '2024-06-20T20:51:00Z',
      label: 'June 2024 Solstice-ish',
      expected: [31.31, -27.03],
    },
    {
      date: '2025-01-01T00:00:00Z',
      label: 'Jan 2025 Midnight',
      expected: [-164.22, -25.9],
    },
    {
      date: '2026-03-08T04:01:00Z',
      label: 'March 2026 Transit',
      expected: [-7.95, -20.0],
    },
    {
      date: '2026-03-09T04:20:00Z',
      label: 'Winchester Transit',
      expected: [-1.31, -23.82], // Sub-lunar point south of Winchester
    },
  ];

  referenceData.forEach(({ date, label, expected }) => {
    it(`accuracy for ${label} (${date})`, () => {
      const actual = calculateMoonPosition(new Date(date));
      const error = angularDistance(actual, expected as [number, number]);

      console.log(`[Audit] ${label}:`);
      console.log(`  Expected: [${expected[0]}, ${expected[1]}]`);
      console.log(`  Actual:   [${actual[0].toFixed(2)}, ${actual[1].toFixed(2)}]`);
      console.log(`  Error:    ${error.toFixed(2)}°`);

      // We expect near-zero error relative to the generator function
      expect(error).toBeLessThan(0.1);
    });
  });
});
