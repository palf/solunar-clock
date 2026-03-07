/**
 * Controller for managing animated transitions between locations
 */

import { AppState } from './app-state';
import { CONFIG } from './config';

export class AnimationController {
  private isAnimating = false;

  constructor(
    private state: AppState,
    private onRedraw: () => Promise<void>
  ) {}

  /**
   * Smoothly glide the map to a new target location and zoom level
   */
  async glideTo(
    targetLat: number,
    targetLon: number,
    targetScalingFactor?: number
  ): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const startLat = this.state.centerLat;
    const startLon = this.state.centerLon;
    const startScale = this.state.scalingFactor;
    const endScale = targetScalingFactor ?? startScale;

    // Shortest path for longitude (-180 to 180 wrap)
    let dLon = targetLon - startLon;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;
    const endLon = startLon + dLon;

    const duration = CONFIG.ANIMATION_DURATION_MS;
    const stepMs = CONFIG.ANIMATION_STEP_MS;
    const steps = Math.floor(duration / stepMs);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // Use ease-in-out quintic or similar? Let's start with linear for simplicity/CPU
      const easedT = t * t * (3 - 2 * t); // Smoothstep

      this.state.centerLat = startLat + (targetLat - startLat) * easedT;
      this.state.centerLon = startLon + (endLon - startLon) * easedT;
      this.state.scalingFactor = startScale + (endScale - startScale) * easedT;

      await this.onRedraw();
      await new Promise((resolve) => setTimeout(resolve, stepMs));
    }

    // Final snap to target to ensure precision
    this.state.centerLat = targetLat;
    this.state.centerLon = targetLon;
    if (targetScalingFactor !== undefined) {
      this.state.scalingFactor = targetScalingFactor;
    }
    await this.onRedraw();

    this.isAnimating = false;
  }
}
