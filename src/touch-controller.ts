/**
 * Controller for handling touch interactions (pan and pinch-zoom)
 */

import type { AppState } from './app-state';

export class TouchController {
  private startX = 0;
  private startY = 0;
  private startLat = 0;
  private startLon = 0;
  private startDist = 0;
  private startScale = 0;
  private isPinching = false;

  constructor(
    private element: HTMLElement | SVGElement,
    private state: AppState,
    private onUpdate: () => Promise<void>
  ) {
    this.init();
  }

  private init(): void {
    this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), {
      passive: false,
    });
    this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    this.element.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      // Start Panning
      this.isPinching = false;
      this.resetPanAnchors(e.touches[0]);
    } else if (e.touches.length === 2) {
      // Start Pinching
      this.isPinching = true;
      this.startDist = this.getDistance(e.touches[0], e.touches[1]);
      this.startScale = this.state.scalingFactor;
    }
    // Prevent scrolling while interacting with the clock
    e.preventDefault();
  }

  private resetPanAnchors(touch: Touch): void {
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startLat = this.state.centerLat;
    this.startLon = this.state.centerLon;
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1 && !this.isPinching) {
      // Pan Logic: ONLY if we are in a pure single-touch state
      const dx = e.touches[0].clientX - this.startX;
      const dy = e.touches[0].clientY - this.startY;

      const sensitivity = 0.1 / (this.state.scalingFactor / 10);
      const dLon = -dx * sensitivity;
      const dLat = dy * sensitivity;

      this.state.setLocation(
        Math.max(-90, Math.min(90, this.startLat + dLat)),
        ((((this.startLon + dLon + 180) % 360) + 360) % 360) - 180
      );

      this.onUpdate();
    } else if (e.touches.length === 2) {
      // Pinch Logic: ONLY update scalingFactor
      this.isPinching = true;
      const dist = this.getDistance(e.touches[0], e.touches[1]);
      const ratio = dist / this.startDist;

      const minScale = 1;
      const maxScale = 1000;

      this.state.scalingFactor = Math.max(minScale, Math.min(maxScale, this.startScale * ratio));

      this.onUpdate();
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 1) {
      // If one finger remains, reset anchors to its current position
      // so that further movement is calculated from this point, not the start of the pinch
      this.resetPanAnchors(e.touches[0]);
    } else if (e.touches.length === 0) {
      this.isPinching = false;
    }
  }

  private getDistance(t1: Touch, t2: Touch): number {
    return Math.sqrt((t2.clientX - t1.clientX) ** 2 + (t2.clientY - t1.clientY) ** 2);
  }
}
