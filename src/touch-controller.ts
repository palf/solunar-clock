/**
 * Controller for handling touch and mouse interactions (pan and zoom)
 */

import type { AppState } from './app-state';
import { CONFIG } from './config';

export class TouchController {
  private startX = 0;
  private startY = 0;
  private startLat = 0;
  private startLon = 0;
  private startDist = 0;
  private startScale = 0;
  private isPinching = false;
  private isDragging = false;

  constructor(
    private element: HTMLElement | SVGElement | Document,
    private state: AppState,
    private onUpdate: () => Promise<void>
  ) {
    this.init();
  }

  private init(): void {
    const el = this.element instanceof Document ? this.element.documentElement : this.element;

    // Touch events
    el.addEventListener('touchstart', (e) => this.handleTouchStart(e as TouchEvent), {
      passive: false,
    });
    el.addEventListener('touchmove', (e) => this.handleTouchMove(e as TouchEvent), {
      passive: false,
    });
    el.addEventListener('touchend', (e) => this.handleTouchEnd(e as TouchEvent));
    el.addEventListener('touchcancel', (e) => this.handleTouchEnd(e as TouchEvent));

    // Mouse events
    el.addEventListener('mousedown', (e) => this.handleMouseDown(e as MouseEvent));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e as MouseEvent));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    el.addEventListener('wheel', (e) => this.handleWheel(e as WheelEvent), {
      passive: false,
    });
  }

  private isInteractive(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const interactiveTags = ['BUTTON', 'INPUT', 'SELECT', 'A'];
    if (interactiveTags.includes(target.tagName)) return true;
    if (
      target.closest('.layer-option') ||
      target.closest('#layer-trigger') ||
      target.closest('.hud-btn')
    )
      return true;
    return false;
  }

  private handleTouchStart(e: TouchEvent): void {
    if (this.isInteractive(e.target)) return;

    if (e.touches.length === 1) {
      this.isPinching = false;
      this.resetPanAnchors(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      this.isPinching = true;
      this.startDist = this.getDistance(e.touches[0], e.touches[1]);
      this.startScale = this.state.scalingFactor;
    }

    e.preventDefault();
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.isInteractive(e.target)) return;
    this.isDragging = true;
    this.resetPanAnchors(e.clientX, e.clientY);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.applyPan(e.clientX, e.clientY);
  }

  private handleMouseUp(): void {
    if (this.isDragging || this.isPinching) {
      this.isDragging = false;
      this.isPinching = false;
      this.onUpdate();
    }
  }

  private handleWheel(e: WheelEvent): void {
    if (this.isInteractive(e.target)) return;
    e.preventDefault();

    const zoomSpeed = 1.1;
    const multiplier = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed;
    this.state.adjustZoom(multiplier);
    this.onUpdate();
  }

  private resetPanAnchors(clientX: number, clientY: number): void {
    this.startX = clientX;
    this.startY = clientY;
    this.startLat = this.state.centerLat;
    this.startLon = this.state.centerLon;
  }

  private handleTouchMove(e: TouchEvent): void {
    if (this.isInteractive(e.target)) return;

    e.preventDefault();

    if (e.touches.length === 1 && !this.isPinching) {
      this.applyPan(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      this.isPinching = true;
      const dist = this.getDistance(e.touches[0], e.touches[1]);
      if (this.startDist === 0) return;
      const ratio = dist / this.startDist;

      this.state.scalingFactor = Math.max(
        1,
        Math.min(CONFIG.MAX_SCALING_FACTOR, this.startScale * ratio)
      );
      this.onUpdate();
    }
  }

  private applyPan(clientX: number, clientY: number): void {
    const dx = clientX - this.startX;
    const dy = clientY - this.startY;

    const sensitivity = 0.1 / (this.state.scalingFactor / 10);
    const dLon = -dx * sensitivity;
    const dLat = dy * sensitivity;

    this.state.centerLat = this.startLat + dLat;
    this.state.centerLon = ((((this.startLon + dLon + 180) % 360) + 360) % 360) - 180;

    this.onUpdate();
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.resetPanAnchors(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 0) {
      this.isPinching = false;
      this.onUpdate();
    }
  }

  private getDistance(t1: Touch, t2: Touch): number {
    return Math.sqrt((t2.clientX - t1.clientX) ** 2 + (t2.clientY - t1.clientY) ** 2);
  }
}
