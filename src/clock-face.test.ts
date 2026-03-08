/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClockFace } from './clock-face';

describe('ClockFace', () => {
  let svg: any;
  let group: any;

  beforeEach(() => {
    group = {
      append: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
    };
    svg = {
      append: vi.fn().mockReturnValue(group),
      attr: vi.fn().mockReturnThis(),
    };

    // Mock d3.path
    vi.stubGlobal('d3', {
      path: () => ({
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        toString: () => 'path-data',
      }),
    });
  });

  it('defines a mask', () => {
    const clock = new ClockFace(svg, 300, 300, 228);
    const defs = {
      append: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
    };
    clock.drawMask(defs as any);
    expect(defs.append).toHaveBeenCalledWith('clipPath');
  });

  it('draws background elements', () => {
    const clock = new ClockFace(svg, 240, 240, 200);
    clock.drawBackground(group);

    // Should append 2 circles (rim and face)
    expect(group.append).toHaveBeenCalledWith('circle');
    expect(group.append).toHaveBeenCalledTimes(2);
  });

  it('draws hour labels', () => {
    const clock = new ClockFace(svg, 240, 240, 200);
    clock.drawHourLabels(group);

    // Should draw 8 compass points
    expect(group.append).toHaveBeenCalledWith('text');
    expect(group.append).toHaveBeenCalledTimes(8);
  });

  it('draws hour slices', () => {
    const clock = new ClockFace(svg, 240, 240, 200);
    clock.drawSlices(group);

    // Should draw 24 slices
    expect(group.append).toHaveBeenCalledWith('path');
    expect(group.append).toHaveBeenCalledTimes(24);
  });
});
