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

  it('renders all eight compass point labels', () => {
    const clock = new ClockFace(svg, 240, 240, 200);
    clock.drawHourLabels(group);

    // Should draw 8 compass points
    expect(group.append).toHaveBeenCalledWith('text');
    expect(group.append).toHaveBeenCalledTimes(8);
  });

  it('renders the center mark circle', () => {
    const clock = new ClockFace(svg, 240, 240, 200);
    const centerGroup = { append: vi.fn().mockReturnThis(), attr: vi.fn().mockReturnThis() };
    clock.drawCenterMark(centerGroup as any);
    expect(centerGroup.append).toHaveBeenCalledWith('circle');
  });
});
