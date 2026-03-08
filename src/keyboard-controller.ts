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

    const baseStep = e.shiftKey ? CONFIG.INTERACTION.KEYBOARD.SHIFT_MULTIPLIER : 1;
    const normalizedStep =
      baseStep / (this.state.scalingFactor / CONFIG.INTERACTION.KEYBOARD.PAN_SENSITIVITY);

    switch (e.key) {
      case '+':
      case '=':
        this.state.adjustZoom(CONFIG.INTERACTION.KEYBOARD.ZOOM_FACTOR);
        await this.onRedraw();
        break;
      case '-':
      case '_':
        this.state.adjustZoom(1 / CONFIG.INTERACTION.KEYBOARD.ZOOM_FACTOR);
        await this.onRedraw();
        break;
      case 'ArrowUp':
        if (e.shiftKey) {
          this.state.adjustZoom(CONFIG.INTERACTION.KEYBOARD.ZOOM_FACTOR);
        } else {
          this.state.pan(normalizedStep, 0);
        }
        await this.onRedraw();
        break;
      case 'ArrowDown':
        if (e.shiftKey) {
          this.state.adjustZoom(1 / CONFIG.INTERACTION.KEYBOARD.ZOOM_FACTOR);
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
      case 't':
        e.preventDefault();
        this.ui.showTimeDialog();
        break;
      case '0':
        this.state.setLocation(CONFIG.DATA.DEFAULT_LOCATION.lat, CONFIG.DATA.DEFAULT_LOCATION.lon);
        this.state.scalingFactor = CONFIG.DISPLAY.DEFAULT_SCALING_FACTOR;
        await this.onRedraw();
        break;
      case 'h':
        await this.ui.handleHomeAction();
        break;
    }
  }
}
