/**
 * Controller for managing keyboard shortcuts
 */

import type { AppState } from './app-state';
import { CONFIG } from './config';
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

    const baseStep = e.shiftKey ? 10 : 1;
    const normalizedStep = baseStep / (this.state.scalingFactor / 10);

    switch (e.key) {
      case '+':
      case '=':
        this.state.adjustZoom(1.1);
        await this.onRedraw();
        break;
      case '-':
      case '_':
        this.state.adjustZoom(1 / 1.1);
        await this.onRedraw();
        break;
      case 'ArrowUp':
        if (e.shiftKey) {
          this.state.adjustZoom(1.1);
        } else {
          this.state.pan(normalizedStep, 0);
        }
        await this.onRedraw();
        break;
      case 'ArrowDown':
        if (e.shiftKey) {
          this.state.adjustZoom(1 / 1.1);
        } else {
          this.state.pan(-normalizedStep, 0);
        }
        await this.onRedraw();
        break;
      case 'ArrowLeft':
        this.state.pan(0, -normalizedStep);
        await this.onRedraw();
        break;
      case 'ArrowRight':
        this.state.pan(0, normalizedStep);
        await this.onRedraw();
        break;
      case 'l':
        this.state.cycleLayer();
        this.ui.updateHUD(new Date()); // Immediate HUD refresh for layer
        await this.onRedraw();
        break;
      case '/':
      case 's':
        e.preventDefault();
        this.ui.showSearch();
        break;
      case '?':
        e.preventDefault();
        this.ui.toggleHelpDialog();
        break;
      case 'z':
        e.preventDefault();
        this.ui.showZoomDialog();
        break;
      case '0':
        this.state.setLocation(51.5074, -0.1278);
        this.state.scalingFactor = CONFIG.DEFAULT_SCALING_FACTOR;
        await this.onRedraw();
        break;
      case 'h':
        await this.ui.handleHomeAction();
        break;
    }
  }
}
