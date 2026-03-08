/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state';
import { UIController } from './ui-controller';

describe('UIController Button Behaviors', () => {
  let state: AppState;
  let onLocationSelected: () => Promise<void>;
  let ui: UIController;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="search-overlay" style="display: none;"></div>
      <input id="locationSearch" />
      <div id="searchResults"></div>
      <div id="zoom-overlay" style="display: none;"></div>
      <input id="zoomInput" />
      <div id="help-overlay" style="display: none;"></div>
      <div id="display-time"></div>
      <div id="display-pos"></div>
      <div id="display-zoom"></div>
      <div id="group-zoom"></div>
      <button id="layer-trigger"></button>
      <div id="display-attribution"></div>
      <button id="btn-mode"></button>
      <button id="btn-locate"></button>
      <button id="btn-search"></button>
      <button id="btn-help"></button>
      <div id="layer-dropdown" style="display: none;">
        <div class="layer-option" data-layer="TOPOGRAPHIC"></div>
        <div class="layer-option" data-layer="IMAGERY"></div>
        <div class="layer-option" data-layer="STREETS"></div>
      </div>
    `;
    state = new AppState(AppState.loadInitialState());
    onLocationSelected = vi.fn().mockResolvedValue(undefined);
    ui = new UIController(state, onLocationSelected);
  });

  it('updates HUD elements', () => {
    const now = new Date('2024-03-07T12:00:00Z');
    ui.updateHUD(now);

    expect(document.getElementById('display-time')?.textContent).toBe('12:00:00');
    expect(document.getElementById('display-pos')?.textContent).toContain('51.51° N');
  });

  it('shows and hides search', () => {
    const overlay = document.getElementById('search-overlay');

    ui.showSearch();
    expect(overlay?.style.display).toBe('block');

    ui.hideSearch();
    expect(overlay?.style.display).toBe('none');
  });

  it('toggles render mode when mode button is clicked', () => {
    const modeBtn = document.getElementById('btn-mode') as HTMLButtonElement;
    ui.updateHUD(new Date());
    
    // Initial state
    expect(state.renderMode).toBe('3D');
    expect(modeBtn.textContent).toBe('3D');

    // Toggle to 2D
    modeBtn.dispatchEvent(new Event('click'));
    expect(state.renderMode).toBe('2D');
    ui.updateHUD(new Date());
    expect(modeBtn.textContent).toBe('2D');

    // Toggle back to 3D
    modeBtn.dispatchEvent(new Event('click'));
    expect(state.renderMode).toBe('3D');
  });

  it('handles the Set Home behavior (🎯 -> ✖️)', () => {
    const locateBtn = document.getElementById('btn-locate') as HTMLButtonElement;
    
    // 1. Initial State: No home set
    expect(state.homeLocation).toBeNull();
    ui.updateHUD(new Date());
    expect(locateBtn.textContent).toBe('🎯');

    // 2. Click to Set Home
    state.setLocation(10, 20);
    locateBtn.dispatchEvent(new Event('click'));
    
    expect(state.homeLocation).toEqual({ lat: 10, lon: 20 });
    expect(locateBtn.textContent).toBe('✖️'); // Should show clear icon because we are at home
  });

  it('handles the Go Home behavior (🏠 -> ✖️)', () => {
    const locateBtn = document.getElementById('btn-locate') as HTMLButtonElement;
    
    // 1. Setup: Stored home at 10, 20
    state.setLocation(10, 20);
    state.setHome();
    
    // 2. Move Away
    state.setLocation(50, 50);
    ui.updateHUD(new Date());
    expect(locateBtn.textContent).toBe('🏠'); // Icon for "Go Home"

    // 3. Click to Go Home
    locateBtn.dispatchEvent(new Event('click'));
    
    expect(state.centerLat).toBe(10);
    expect(state.centerLon).toBe(20);
    expect(locateBtn.textContent).toBe('✖️'); // Now at home, icon for "Clear"
  });

  it('handles the Clear Home behavior (✖️ -> 🎯)', () => {
    const locateBtn = document.getElementById('btn-locate') as HTMLButtonElement;
    
    // 1. Setup: At home
    state.setLocation(10, 20);
    state.setHome();
    ui.updateHUD(new Date());
    expect(locateBtn.textContent).toBe('✖️');

    // 2. Click to Clear
    locateBtn.dispatchEvent(new Event('click'));
    
    expect(state.homeLocation).toBeNull();
    expect(locateBtn.textContent).toBe('🎯');
  });

  it('shows search when search button is clicked', () => {
    const searchBtn = document.getElementById('btn-search') as HTMLButtonElement;
    const overlay = document.getElementById('search-overlay');
    
    expect(overlay?.style.display).toBe('none');
    searchBtn.dispatchEvent(new Event('click'));
    expect(overlay?.style.display).toBe('block');
  });

  it('shows zoom dialog', () => {
    const overlay = document.getElementById('zoom-overlay');
    expect(overlay?.style.display).toBe('none');
    ui.showZoomDialog();
    expect(overlay?.style.display).toBe('block');
  });

  it('shows help dialog', () => {
    const overlay = document.getElementById('help-overlay');
    expect(overlay?.style.display).toBe('none');
    ui.showHelpDialog();
    expect(overlay?.style.display).toBe('block');
  });

  it('opens zoom dialog when zoom HUD is clicked', () => {
    const zoomGroup = document.getElementById('group-zoom');
    const overlay = document.getElementById('zoom-overlay');
    
    expect(overlay?.style.display).toBe('none');
    zoomGroup?.dispatchEvent(new Event('click'));
    expect(overlay?.style.display).toBe('block');
  });
});
