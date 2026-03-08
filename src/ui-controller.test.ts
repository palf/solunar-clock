import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state';
import { loadInitialState } from './state-loader';
import { asLatitude, asLongitude } from './types';
import { UIController } from './ui-controller';

describe('UIController', () => {
  let state: AppState;
  let ui: UIController;
  const onLocationSelected = vi.fn();

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="display-time"></div>
      <div id="btn-mode"></div>
      <div id="btn-locate"></div>
      <div id="display-pos"></div>
      <div id="display-zoom"></div>
      <div id="display-attribution"></div>
      <div id="search-overlay"></div>
      <input id="locationSearch" />
      <div id="searchResults"></div>
      <div id="zoom-overlay"></div>
      <input id="zoomInput" />
      <div id="time-overlay"></div>
      <input id="timeInput" />
      <div id="group-zoom"></div>
      <div id="help-overlay"></div>
      <button id="btn-help"></button>
      <div id="layer-trigger"></div>
      <div id="layer-dropdown"></div>
      <button id="btn-locate"></button>
      <button id="btn-mode"></button>
      <button id="btn-search"></button>
      <div class="layer-option" data-layer="STREETS"></div>
      <div class="layer-option" data-layer="TOPOGRAPHIC"></div>
      <div class="layer-option" data-layer="IMAGERY"></div>
    `;

    const config = loadInitialState();
    state = new AppState(config);

    // Mock requestAnimationFrame to execute immediately
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => cb(0));

    ui = new UIController(state, null as any, onLocationSelected);
    });

    afterEach(() => {
    vi.unstubAllGlobals();
    });

    it('updates the HUD time correctly', () => {
    const now = new Date('2024-03-07T12:34:56Z');
    ui.updateTime(now);
    const timeEl = document.getElementById('display-time');
    expect(timeEl?.textContent).toBe('12:34:56');
    });

    it('updates the HUD position correctly (reactive & throttled)', async () => {
    state.setLocation(asLatitude(10), asLongitude(20));

    const posEl = document.getElementById('display-pos');
    expect(posEl?.textContent).toContain('10.00° N');
    expect(posEl?.textContent).toContain('20.00° E');
    });


  it('toggles the search overlay', () => {
    ui.showSearch();
    const searchOverlay = document.getElementById('search-overlay');
    expect(searchOverlay?.style.display).toBe('block');

    ui.hideSearch();
    expect(searchOverlay?.style.display).toBe('none');
  });

  it('handles the home button logic (Set Home)', async () => {
    state.clearHome();
    state.setLocation(asLatitude(10), asLongitude(20));

    await ui.handleHomeAction();
    expect(state.homeLocation).toEqual({ lat: asLatitude(10), lon: asLongitude(20) });
  });

  it('handles the home button logic (Go Home)', async () => {
    state.setLocation(asLatitude(50), asLongitude(50));
    state.setHome();

    state.setLocation(asLatitude(10), asLongitude(20));
    await ui.handleHomeAction();

    expect(state.centerLat).toBe(asLatitude(50));
    expect(state.centerLon).toBe(asLongitude(50));
  });

  it('cycles the render mode', () => {
    const initialMode = state.renderMode;
    const btnMode = document.getElementById('btn-mode');
    btnMode?.click();

    expect(state.renderMode).not.toBe(initialMode);
    expect(onLocationSelected).toHaveBeenCalled();
  });

  it('filters search results (mocked fetch)', async () => {
    const mockResults = [{ display_name: 'Test City', lat: '10', lon: '20' }];

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResults),
    });

    ui.showSearch();
    const input = document.getElementById('locationSearch') as HTMLInputElement;
    input.value = 'test';
    input.dispatchEvent(new Event('input'));

    // Wait for debounce
    await new Promise((r) => setTimeout(r, 400));

    const results = document.getElementById('searchResults');
    expect(results?.children.length).toBe(1);
    expect(results?.children[0].textContent).toBe('Test City');
  });

  it('selects a search result', async () => {
    const item = { display_name: 'Test', lat: '10', lon: '20' };
    state.setLocation(asLatitude(0), asLongitude(0));

    // @ts-expect-error - testing private method
    ui.selectItem(item);

    expect(state.centerLat).toBe(asLatitude(10));
    expect(state.centerLon).toBe(asLongitude(20));
    expect(onLocationSelected).toHaveBeenCalled();
  });
});
