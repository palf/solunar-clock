/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClockFace } from './clock-face';

describe('ClockFace', () => {
  let svg: any;
  let group: any;

  beforeEach(() => {
    // Mock D3 selection
    group = {
      append: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis()
    };
    svg = {
      selectAll: vi.fn().mockReturnThis(),
      data: vi.fn().mockReturnThis(),
      enter: vi.fn().mockReturnThis(),
      append: vi.fn().mockReturnThis()
    };
    
    // Mock d3.path
    vi.stubGlobal('d3', {
      path: () => ({
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        toString: () => 'path-data'
      })
    });
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

  it('draws slices', () => {
    const clock = new ClockFace(svg, 240, 240, 200);
    clock.drawSlices(group);
    
    // Should draw 24 slices
    expect(group.append).toHaveBeenCalledWith('path');
    expect(group.append).toHaveBeenCalledTimes(24);
  });
});
