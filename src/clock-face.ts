/**
 * Clock face rendering functionality
 */

/// <reference path="./types.ts" />

import * as d3 from 'd3';
import { CONFIG } from './config';

export class ClockFace {
  constructor(
    _svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    private centerX: number,
    private centerY: number,
    private radius: number
  ) {}

  /**
   * Define a circular mask for the map
   */
  drawMask(defs: d3.Selection<SVGDefsElement, unknown, HTMLElement, any>): void {
    defs
      .append('clipPath')
      .attr('id', 'clock-mask')
      .append('circle')
      .attr('cx', this.centerX)
      .attr('cy', this.centerY)
      .attr('r', this.radius);
  }

  /**
   * Draw the background circle and rim
   * Note: Background should be drawn first, but should not cover the map
   */
  drawBackground(
    bgGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>
  ): void {
    // Outer rim circle (larger, just for border effect)
    bgGroup
      .append('circle')
      .attr('cx', this.centerX)
      .attr('cy', this.centerY)
      .attr('r', this.radius + CONFIG.RIM_WIDTH)
      .attr('fill', 'var(--border)');

    // Main clock face circle (Transparent so map below is visible)
    bgGroup
      .append('circle')
      .attr('cx', this.centerX)
      .attr('cy', this.centerY)
      .attr('r', this.radius)
      .attr('fill', 'none')
      .attr('stroke', 'var(--accent)')
      .attr('stroke-width', 1);
  }

  /**
   * Draw compass point labels (N, NE, E, SE, S, SW, W, NW)
   */
  drawHourLabels(
    labelsGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>
  ): void {
    const compassPoints = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    for (let i = 0; i < CONFIG.COMPASS_POINTS_COUNT; i++) {
      const angDeg = i * CONFIG.COMPASS_INTERVAL_DEG;
      const theta = (angDeg * Math.PI) / 180;
      const tx =
        this.centerX + (this.radius + CONFIG.LABEL_SPACING) * Math.sin(theta);
      const ty =
        this.centerY - (this.radius + CONFIG.LABEL_SPACING) * Math.cos(theta);

      labelsGroup
        .append('text')
        .attr('x', tx)
        .attr('y', ty)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('class', 'label')
        .text(compassPoints[i]);
    }
  }

  /**
   * Draw center mark
   */
  drawCenterMark(
    centerGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>
  ): void {
    centerGroup
      .append('circle')
      .attr('cx', this.centerX)
      .attr('cy', this.centerY)
      .attr('r', CONFIG.CENTER_MARK_RADIUS)
      .attr('fill', '#222');
  }
}
