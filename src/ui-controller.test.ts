/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state';
import { UIController } from './ui-controller';
import type { AnimationController } from './animation-controller';

describe('UIController', () => {
  let state: AppState;
  let onLocationSelected: any;
  let animationController: AnimationController;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="search-overlay"></div>
      <input id="locationSearch" />
      <div id="searchResults"></div>
      <div id="display-time"></div>
      <div id="display-pos"></div>
      <div id="display-zoom"></div>
      <div id="display-layer"></div>
    `;
    state = new AppState();
    onLocationSelected = vi.fn().mockResolvedValue(undefined);
    animationController = {
      glideTo: vi.fn().mockResolvedValue(undefined),
    } as any;
  });

  it('updates HUD elements', () => {
    const ui = new UIController(state, onLocationSelected, animationController);
    const now = new Date('2024-03-07T12:00:00Z');

    ui.updateHUD(now);

    expect(document.getElementById('display-time')?.textContent).toBe('12:00:00');
    expect(document.getElementById('display-pos')?.textContent).toContain('51.51° N');
  });

  it('shows and hides search', () => {
    const ui = new UIController(state, onLocationSelected, animationController);
    const overlay = document.getElementById('search-overlay');

    ui.showSearch();
    expect(overlay?.style.display).toBe('block');

    ui.hideSearch();
    expect(overlay?.style.display).toBe('none');
  });
});
