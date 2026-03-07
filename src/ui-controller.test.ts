/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIController } from './ui-controller';
import { AppState } from './app-state';

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
});
