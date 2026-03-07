/**
 * Controller for managing keyboard shortcuts
 */

import type { AppState } from './app-state';
import { GeolocationService } from './geolocation-service';
import type { UIController } from './ui-controller';

export class KeyboardController {
  constructor(
    private state: AppState,
    private ui: UIController,
    private onRedraw: () => Promise<void>
  ) {
    this.init();
  }

  private init(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  private async handleKeyDown(e: KeyboardEvent): Promise<void> {
    // Ignore if typing in search
    if (e.target instanceof HTMLInputElement) return;

    const minScale = 1;
    const maxScale = 1000;
    const baseStep = e.shiftKey ? 10 : 1;
    const normalizedStep = baseStep / (this.state.scalingFactor / 10);

    switch (e.key) {
      case '+':
      case '=':
        this.state.scalingFactor = Math.min(maxScale, this.state.scalingFactor * 1.2);
        await this.onRedraw();
        break;
      case '-':
      case '_':
        this.state.scalingFactor = Math.max(minScale, this.state.scalingFactor / 1.2);
        await this.onRedraw();
        break;
      case 'ArrowUp':
        if (e.shiftKey) {
          this.state.scalingFactor = Math.min(maxScale, this.state.scalingFactor * 1.2);
        } else {
          this.state.centerLat = Math.min(90, this.state.centerLat + normalizedStep);
        }
        await this.onRedraw();
        break;
      case 'ArrowDown':
        if (e.shiftKey) {
          this.state.scalingFactor = Math.max(minScale, this.state.scalingFactor / 1.2);
        } else {
          this.state.centerLat = Math.max(-90, this.state.centerLat - normalizedStep);
        }
        await this.onRedraw();
        break;
      case 'ArrowLeft':
        this.state.centerLon = ((this.state.centerLon - normalizedStep + 180) % 360) - 180;
        await this.onRedraw();
        break;
      case 'ArrowRight':
        this.state.centerLon = ((this.state.centerLon + normalizedStep + 180) % 360) - 180;
        await this.onRedraw();
        break;
      case 'l':
        this.toggleLayer();
        break;
      case '/':
      case 's':
        e.preventDefault();
        this.ui.showSearch();
        break;
      case '0':
        await this.resetToLondon();
        break;
      case 'h':
        await this.resetToHome();
        break;
    }
  }

  private toggleLayer(): void {
    const layers: ('TERRAIN' | 'SATELLITE' | 'LOGISTICAL')[] = [
      'TERRAIN',
      'SATELLITE',
      'LOGISTICAL',
    ];
    const idx = layers.indexOf(this.state.mapLayer);
    this.state.mapLayer = layers[(idx + 1) % layers.length];
  }

  private async resetToLondon(): Promise<void> {
    this.state.centerLat = 51.5074;
    this.state.centerLon = -0.1278;
    this.state.scalingFactor = 10;
    await this.onRedraw();
  }

  private async resetToHome(): Promise<void> {
    const [lon, lat] = await GeolocationService.getCurrentPosition();
    this.state.centerLat = lat;
    this.state.centerLon = lon;
    await this.onRedraw();
  }
}
