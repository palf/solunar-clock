/**
 * Clock face rendering functionality
 */

/// <reference path="./types.ts" />

import type * as d3 from 'd3';
import { CONFIG } from './config';

export class ClockFace {
  // Non-configurable structural constants
  private static readonly COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  private static readonly COMPASS_INTERVAL_DEG = 360 / this.COMPASS_POINTS.length;

  constructor(
    _svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    private centerX: number,
    private centerY: number,
    private radius: number
  ) {}

  /**
   * Draw compass point labels (N, NE, E, SE, S, SW, W, NW)
   */
  drawCompassPoints(labelsGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>): void {
    ClockFace.COMPASS_POINTS.forEach((point, i) => {
      const angDeg = i * ClockFace.COMPASS_INTERVAL_DEG;
      const theta = (angDeg * Math.PI) / 180;
      const tx =
        this.centerX + (this.radius + CONFIG.AESTHETICS.GLOBAL.LABEL_SPACING) * Math.sin(theta);
      const ty =
        this.centerY - (this.radius + CONFIG.AESTHETICS.GLOBAL.LABEL_SPACING) * Math.cos(theta);

      labelsGroup
        .append('text')
        .attr('x', tx)
        .attr('y', ty)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('class', 'label')
        .text(point);
    });
  }

  /**
   * Draw center mark
   */
  drawCenterMark(centerGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>): void {
    centerGroup
      .append('circle')
      .attr('cx', this.centerX)
      .attr('cy', this.centerY)
      .attr('r', CONFIG.AESTHETICS.GLOBAL.CENTER_MARK_RADIUS)
      .attr('fill', CONFIG.AESTHETICS.GLOBAL.CENTER_MARK_COLOR);
  }
}
