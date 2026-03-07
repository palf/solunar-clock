/**
 * Controller for managing the HUD and search overlays
 */

import type { AppState } from './app-state';
import { getCurrentPosition } from './geolocation-service';
import type { AnimationController } from './animation-controller';
import { CONFIG } from './config';

export class UIController {
  private searchOverlay = document.getElementById('search-overlay');
  private searchInput = document.getElementById(
    'locationSearch'
  ) as HTMLInputElement;
  private searchResults = document.getElementById('searchResults');
  private layerTrigger = document.getElementById('layer-trigger');
  private layerDropdown = document.getElementById('layer-dropdown');
  private btnHome = document.getElementById('btn-home');
  private btnGPS = document.getElementById('btn-gps');
  private btnWarp = document.getElementById('btn-warp');
  private searchDebounce: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private state: AppState,
    private onLocationSelected: () => Promise<void>,
    private animationController: AnimationController
  ) {
    this.initSearch();
    this.initLayerSwitcher();
    this.initButtons();
  }

  /**
   * Update all HUD elements with latest state
   */
  updateHUD(now: Date): void {
    const timeEl = document.getElementById('display-time');
    if (timeEl) timeEl.textContent = now.toISOString().substring(11, 19);

    const warpEl = document.getElementById('btn-warp');
    if (warpEl) {
      warpEl.textContent = this.state.tileWarping ? 'WARP' : 'BOX';
      warpEl.style.color = this.state.tileWarping
        ? '#4ade80'
        : 'var(--text-dim)';
      warpEl.style.borderColor = this.state.tileWarping
        ? '#4ade80'
        : 'var(--border)';
    }

    const posEl = document.getElementById('display-pos');
    if (posEl) {
      posEl.textContent = `${Math.abs(this.state.centerLat).toFixed(
        2
      )}° ${this.state.centerLat >= 0 ? 'N' : 'S'}, ${Math.abs(this.state.centerLon).toFixed(2)}° ${this.state.centerLon >= 0 ? 'E' : 'W'}`;
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
    // Use pointerdown for instant response on touch
    this.layerTrigger?.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (this.layerDropdown) {
        const isVisible = this.layerDropdown.style.display === 'flex';
        this.layerDropdown.style.display = isVisible ? 'none' : 'flex';
      }
    });

    document.querySelectorAll('.layer-option').forEach((opt) => {
      opt.addEventListener('pointerdown', (e) => {
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

    document.addEventListener('pointerdown', () => {
      if (this.layerDropdown) this.layerDropdown.style.display = 'none';
    });
  }

  private initButtons(): void {
    // Use pointerdown for instant response
    this.btnHome?.addEventListener('pointerdown', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      await this.animationController.glideTo(
        CONFIG.HOME_LOCATION.lat,
        CONFIG.HOME_LOCATION.lon
      );
    });

    this.btnGPS?.addEventListener('pointerdown', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const [lon, lat] = await getCurrentPosition();
      await this.animationController.glideTo(lat, lon);
    });

    this.btnWarp?.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.state.tileWarping = !this.state.tileWarping;
      this.onLocationSelected(); // Trigger redraw
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
          // Use pointerdown here too for the list
          div.onpointerdown = async (e) => {
            e.stopPropagation();
            this.hideSearch();
            await this.animationController.glideTo(
              parseFloat(item.lat),
              parseFloat(item.lon),
              CONFIG.SEARCH_ZOOM_LEVEL
            );
          };
          resultsContainer.appendChild(div);
        });
      }
    } catch (e) {
      console.error('Search failed:', e);
    }
  }
}
