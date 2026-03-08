/**
 * Controller for managing the HUD and search overlays
 */

import type { AppState } from './app-state';
import { CONFIG } from './config';

export class UIController {
  private searchOverlay = document.getElementById('search-overlay');
  private searchInput = document.getElementById(
    'locationSearch'
  ) as HTMLInputElement;
  private searchResults = document.getElementById('searchResults');
  private layerTrigger = document.getElementById('layer-trigger');
  private layerDropdown = document.getElementById('layer-dropdown');
  private btnLocate = document.getElementById('btn-locate');
  private btnMode = document.getElementById('btn-mode');
  private searchDebounce: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private state: AppState,
    private onLocationSelected: () => Promise<void>
  ) {
    this.initSearch();
    this.initLayerSwitcher();
    this.initButtons();
  }

  /**
   * Update HUD elements. 
   * onlyTime = true allows 1Hz ticks to only refresh the clock text.
   */
  updateHUD(now: Date, onlyTime = false): void {
    const timeEl = document.getElementById('display-time');
    if (timeEl) timeEl.textContent = now.toISOString().substring(11, 19);

    if (onlyTime) return;

    const modeEl = document.getElementById('btn-mode');
    if (modeEl) {
      modeEl.textContent = this.state.renderMode;
      modeEl.style.color =
        this.state.renderMode === '3D' ? '#4ade80' : 'var(--text-dim)';
      modeEl.style.borderColor =
        this.state.renderMode === '3D' ? '#4ade80' : 'var(--border)';
    }

    // Combined Locate/Home button logic
    if (this.btnLocate) {
      const hasHome = this.state.homeLocation !== null;
      const atHome = this.state.isAtHome();

      if (!hasHome) {
        this.btnLocate.textContent = '🎯';
        this.btnLocate.style.color = 'var(--accent)';
        this.btnLocate.title = 'Set Current Location as Home';
      } else if (atHome) {
        this.btnLocate.textContent = '✖️'; // Clear icon
        this.btnLocate.style.color = '#ef4444'; // Red
        this.btnLocate.title = 'Clear Saved Home';
      } else {
        this.btnLocate.textContent = '🏠'; // Go Home icon
        this.btnLocate.style.color = 'var(--accent)';
        this.btnLocate.title = 'Return to Stored Home';
      }
    }

    const posEl = document.getElementById('display-pos');
    if (posEl) {
      posEl.textContent = `${Math.abs(this.state.centerLat).toFixed(
        2
      )}° ${this.state.centerLat >= 0 ? 'N' : 'S'}, ${Math.abs(
        this.state.centerLon
      ).toFixed(2)}° ${this.state.centerLon >= 0 ? 'E' : 'W'}`;
    }

    const zoomEl = document.getElementById('display-zoom');
    if (zoomEl) {
      zoomEl.textContent = `${(this.state.scalingFactor / 10).toFixed(1)}x`;
    }

    const layerEl = document.getElementById('display-layer');
    if (layerEl) {
      layerEl.textContent = this.state.mapLayer;
      layerEl.style.color =
        this.state.mapLayer === 'TOPOGRAPHIC'
          ? '#4ade80'
          : this.state.mapLayer === 'IMAGERY'
            ? '#38bdf8'
            : '#fb923c';
    }

    const attrEl = document.getElementById('display-attribution');
    if (attrEl) {
      attrEl.textContent =
        CONFIG.ATTRIBUTIONS[
          this.state.mapLayer as keyof typeof CONFIG.ATTRIBUTIONS
        ] || '';
    }

    this.syncLayerButtons();
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
      this.searchDebounce = setTimeout(
        () => this.performSearch(query),
        CONFIG.SEARCH_DEBOUNCE_MS
      );
    });

    this.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideSearch();
    });
  }

  private initLayerSwitcher(): void {
    this.layerTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (this.layerDropdown) {
        const isVisible = this.layerDropdown.style.display === 'flex';
        this.layerDropdown.style.display = isVisible ? 'none' : 'flex';
      }
    });

    document.querySelectorAll('.layer-option').forEach((opt) => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const layer = (e.currentTarget as HTMLElement).getAttribute(
          'data-layer'
        ) as any;
        if (layer) {
          this.state.mapLayer = layer;
          if (this.layerDropdown) this.layerDropdown.style.display = 'none';
          this.onLocationSelected();
        }
      });
    });

    document.addEventListener('click', () => {
      if (this.layerDropdown) this.layerDropdown.style.display = 'none';
    });
  }

  private initButtons(): void {
    this.btnLocate?.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      const hasHome = this.state.homeLocation !== null;
      const atHome = this.state.isAtHome();

      if (!hasHome) {
        // Step 1: Set current location as home
        this.state.setHome();
      } else if (atHome) {
        // Step 2: Unset home
        this.state.clearHome();
      } else {
        // Step 3: Go home
        const home = this.state.homeLocation!;
        this.state.setLocation(home.lat, home.lon);
      }

      this.updateHUD(new Date()); // Immediate visual feedback for icon change
      await this.onLocationSelected();
    });

    this.btnMode?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.state.renderMode = this.state.renderMode === '3D' ? '2D' : '3D';
      this.onLocationSelected();
    });
  }

  private syncLayerButtons(): void {
    document.querySelectorAll('.layer-option').forEach((opt) => {
      if (opt.getAttribute('data-layer') === this.state.mapLayer) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  private async performSearch(query: string): Promise<void> {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`
      );
      const data = await resp.json();

      const resultsContainer = this.searchResults;
      if (resultsContainer) {
        resultsContainer.innerHTML = '';
        data.forEach((item: any) => {
          const div = document.createElement('div');
          div.className = 'search-item';
          div.textContent = item.display_name;
          div.onpointerdown = async (e) => {
            e.stopPropagation();
            this.state.setLocation(parseFloat(item.lat), parseFloat(item.lon));
            this.state.scalingFactor = CONFIG.SEARCH_ZOOM_LEVEL;
            this.hideSearch();
            await this.onLocationSelected();
          };
          resultsContainer.appendChild(div);
        });
      }
    } catch (e) {
      console.error('Search failed:', e);
    }
  }
}
