/**
 * Clock face rendering functionality
 */

/// <reference path="./types.ts" />

import { CONFIG } from './config';

export class ClockFace {
  constructor(
    private svg: d3.Selection<SVGSVGElement, unknown, any, any>,
    private centerX: number,
    private centerY: number,
    private radius: number
  ) {}
  
  /**
   * Draw the background circle and rim
   * Note: Background should be drawn first, but should not cover the map
   */
  drawBackground(bgGroup: d3.Selection<SVGGElement, unknown, any, any>): void {
    // Outer rim circle (larger, just for border effect)
    bgGroup.append("circle")
      .attr("cx", this.centerX)
      .attr("cy", this.centerY)
      .attr("r", this.radius + 8)
      .attr("fill", "#fff");
    
    // Main clock face circle (with border, but map will be visible inside)
    bgGroup.append("circle")
      .attr("cx", this.centerX)
      .attr("cy", this.centerY)
      .attr("r", this.radius)
      .attr("fill", "none")  // Transparent so map is visible
      .attr("stroke", "#111")
      .attr("stroke-width", 2);
  }
  
  /**
   * Draw hour slices
   */
  drawSlices(slicesGroup: d3.Selection<SVGGElement, unknown, any, any>): void {
    for (let i = 0; i < CONFIG.SLICES; i++) {
      const a1 = (i * (360 / CONFIG.SLICES)) - (360 / CONFIG.SLICES / 2);
      const a2 = ((i + 1) * (360 / CONFIG.SLICES)) - (360 / CONFIG.SLICES / 2);
      const p = d3.path();
      p.moveTo(this.centerX, this.centerY);
      
      const steps = 80;
      for (let s = 0; s <= steps; s++) {
        const t = a1 + (a2 - a1) * (s / steps);
        const theta = t * Math.PI / 180;
        const x = this.centerX + this.radius * Math.sin(theta);
        const y = this.centerY - this.radius * Math.cos(theta);
        p.lineTo(x, y);
      }
      p.closePath();
      
      slicesGroup.append("path")
        .attr("d", p.toString())
        .attr("class", `slice ${i % 2 ? "alt" : ""}`)
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.06)
        .attr("stroke-width", 1);
    }
  }
  
  /**
   * Draw hour labels
   */
  drawHourLabels(labelsGroup: d3.Selection<SVGGElement, unknown, any, any>): void {
    for (let i = 0; i < 12; i++) {
      const angDeg = i * 30;
      const theta = angDeg * Math.PI / 180;
      const tx = this.centerX + (this.radius + CONFIG.LABEL_SPACING) * Math.sin(theta);
      const ty = this.centerY - (this.radius + CONFIG.LABEL_SPACING) * Math.cos(theta);
      const labelHour = ((12 + i) % 12) === 0 ? 12 : ((12 + i) % 12);
      
      labelsGroup.append("text")
        .attr("x", tx)
        .attr("y", ty)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("class", "label")
        .text(labelHour.toString());
    }
  }
  
  /**
   * Draw timezone offset labels
   */
  drawTimezoneLabels(labelsGroup: d3.Selection<SVGGElement, unknown, any, any>): void {
    for (let i = 0; i < 12; i += 3) {
      const utcOffset = i * 2; // hours ahead of UTC
      const ang = (i * 30) * Math.PI / 180;
      const tx = this.centerX + (this.radius - CONFIG.TZ_LABEL_SPACING) * Math.sin(ang);
      const ty = this.centerY - (this.radius - CONFIG.TZ_LABEL_SPACING) * Math.cos(ang);
      
      labelsGroup.append("text")
        .attr("x", tx)
        .attr("y", ty)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("class", "tz-label")
        .text(`UTC${utcOffset >= 0 ? "+" + utcOffset : utcOffset}`);
    }
  }
  
  /**
   * Draw center mark
   */
  drawCenterMark(centerGroup: d3.Selection<SVGGElement, unknown, any, any>): void {
    centerGroup.append("circle")
      .attr("cx", this.centerX)
      .attr("cy", this.centerY)
      .attr("r", 6)
      .attr("fill", "#222");
  }
}

