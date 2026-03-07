/**
 * Controller for managing the HUD and search overlays
 */

import type { AppState } from './app-state';

export class UIController {
  private searchOverlay = document.getElementById('search-overlay');
  private searchInput = document.getElementById('locationSearch') as HTMLInputElement;
  private searchResults = document.getElementById('searchResults');
  private searchDebounce: any;

  constructor(
    private state: AppState,
    private onLocationSelected: () => Promise<void>
  ) {
    this.initSearch();
  }

  /**
   * Update all HUD elements with latest state
   */
  updateHUD(now: Date): void {
    const elements = {
      'display-time': now.toISOString().substring(11, 19),
      'display-pos': `${Math.abs(this.state.centerLat).toFixed(2)}° ${this.state.centerLat >= 0 ? 'N' : 'S'}, ${Math.abs(this.state.centerLon).toFixed(2)}° ${this.state.centerLon >= 0 ? 'E' : 'W'}`,
      'display-zoom': `${(this.state.scalingFactor / 10).toFixed(1)}x`,
      'display-layer': this.state.mapLayer,
    };

    for (const [id, value] of Object.entries(elements)) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }
  }

  showSearch(): void {
    if (this.searchOverlay) this.searchOverlay.style.display = 'block';
    this.searchInput?.focus();
  }

  hideSearch(): void {
    if (this.searchOverlay) this.searchOverlay.style.display = 'none';
    this.searchInput?.blur();
    this.searchInput.value = '';
  }

  private initSearch(): void {
    this.searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      if (!this.searchResults || query.length < 3) return;

      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(() => this.performSearch(query), 300);
    });

    this.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideSearch();
    });
  }

  private async performSearch(query: string): Promise<void> {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await resp.json();

      if (this.searchResults) {
        this.searchResults.innerHTML = '';
        data.forEach((item: any) => {
          const div = document.createElement('div');
          div.className = 'search-item';
          div.textContent = item.display_name;
          div.onclick = async () => {
            this.state.centerLat = parseFloat(item.lat);
            this.state.centerLon = parseFloat(item.lon);
            this.hideSearch();
            await this.onLocationSelected();
          };
          this.searchResults.appendChild(div);
        });
      }
    } catch (e) {
      console.error('Search failed:', e);
    }
  }
}
