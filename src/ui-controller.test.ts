/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state';
import { UIController } from './ui-controller';

describe('UIController', () => {
  let state: AppState;
  let onLocationSelected: any;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="search-overlay"></div>
      <input id="locationSearch" />
      <div id="searchResults"></div>
      <div id="display-time"></div>
      <div id="display-pos"></div>
      <div id="display-zoom"></div>
      <div id="display-layer"></div>
      <button id="btn-mode"></button>
      <button id="btn-home"></button>
      <button id="btn-gps"></button>
      <div id="layer-trigger"></div>
      <div id="layer-dropdown" style="display: none;">
        <div class="layer-option" data-layer="TOPOGRAPHIC"></div>
        <div class="layer-option" data-layer="IMAGERY"></div>
      </div>
    `;
    state = new AppState();
    onLocationSelected = vi.fn().mockResolvedValue(undefined);
  });

  it('updates HUD elements', () => {
    const ui = new UIController(state, onLocationSelected);
    const now = new Date('2024-03-07T12:00:00Z');

    ui.updateHUD(now);

    expect(document.getElementById('display-time')?.textContent).toBe('12:00:00');
    expect(document.getElementById('display-pos')?.textContent).toContain('51.51° N');
  });

  it('shows and hides search', () => {
    const ui = new UIController(state, onLocationSelected);
    const overlay = document.getElementById('search-overlay');

    ui.showSearch();
    expect(overlay?.style.display).toBe('block');

    ui.hideSearch();
    expect(overlay?.style.display).toBe('none');
  });

  it('toggles render mode when mode button is clicked', () => {
    new UIController(state, onLocationSelected);
    const modeBtn = document.getElementById('btn-mode');
    
    expect(state.renderMode).toBe('3D');
    modeBtn?.dispatchEvent(new Event('click'));
    
    expect(state.renderMode).toBe('2D');
    expect(onLocationSelected).toHaveBeenCalled();
  });

  it('resets to home when home button is clicked', () => {
    new UIController(state, onLocationSelected);
    const homeBtn = document.getElementById('btn-home');
    
    state.centerLat = 0;
    homeBtn?.dispatchEvent(new Event('click'));
    
    expect(state.centerLat).toBe(51.071);
    expect(onLocationSelected).toHaveBeenCalled();
  });

  it('cycles layers via dropdown', () => {
    new UIController(state, onLocationSelected);
    const option = document.querySelector('.layer-option[data-layer="IMAGERY"]');
    
    option?.dispatchEvent(new Event('click'));
    
    expect(state.mapLayer).toBe('IMAGERY');
    expect(onLocationSelected).toHaveBeenCalled();
  });
});
