/**
 * Controller for managing the HUD and search overlays
 */

import type { AppState } from './app-state';
import { CONFIG } from './config';
import { TileRenderer } from './tile-renderer';
import { asLatitude, asLongitude } from './types';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export class UIController {
  private searchOverlay = document.getElementById('search-overlay');
  private searchInput = document.getElementById(
    'locationSearch'
  ) as HTMLInputElement;
  private searchResults = document.getElementById('searchResults');
  
  private zoomOverlay = document.getElementById('zoom-overlay');
  private zoomInput = document.getElementById('zoomInput') as HTMLInputElement;
  private zoomGroup = document.getElementById('group-zoom');

  private helpOverlay = document.getElementById('help-overlay');
  private btnHelp = document.getElementById('btn-help');

  private layerTrigger = document.getElementById('layer-trigger');
  private layerDropdown = document.getElementById('layer-dropdown');
  private btnLocate = document.getElementById('btn-locate');
  private btnMode = document.getElementById('btn-mode');
  private btnSearch = document.getElementById('btn-search');
  private searchDebounce: ReturnType<typeof setTimeout> | undefined;

  // Keyboard navigation for search
  private selectedSearchIndex = -1;
  private currentSearchData: SearchResult[] = [];

  constructor(
    private state: AppState,
    private onLocationSelected: () => Promise<void>
  ) {
    this.initSearch();
    this.initZoomDialog();
    this.initLayerSwitcher();
    this.initButtons();
    this.initClickOutside();
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
        this.state.renderMode === '3D' ? CONFIG.COLOR_ACTIVE : CONFIG.COLOR_TEXT_DIM;
      modeEl.style.borderColor =
        this.state.renderMode === '3D' ? CONFIG.COLOR_ACTIVE : CONFIG.COLOR_BORDER;
    }

    // Combined Locate/Home button logic
    if (this.btnLocate) {
      const hasHome = this.state.homeLocation !== null;
      const atHome = this.state.isAtHome();

      if (!hasHome) {
        this.btnLocate.textContent = '🎯';
        this.btnLocate.style.color = CONFIG.COLOR_ACCENT;
        this.btnLocate.title = 'Set Current Location as Home';
      } else if (atHome) {
        this.btnLocate.textContent = '✖️'; // Clear icon
        this.btnLocate.style.color = CONFIG.COLOR_DANGER; 
        this.btnLocate.title = 'Clear Saved Home';
      } else {
        this.btnLocate.textContent = '🏠'; // Go Home icon
        this.btnLocate.style.color = CONFIG.COLOR_ACCENT;
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
      zoomEl.textContent = `${(this.state.scalingFactor / CONFIG.ZOOM_DISPLAY_MULTIPLIER).toFixed(1)}x`;
    }

    const attrEl = document.getElementById('display-attribution');
    if (attrEl) {
      attrEl.textContent = TileRenderer.getAttribution(this.state.mapLayer);
    }

    this.syncLayerButtons();
  }

  showSearch(): void {
    this.hideZoomDialog();
    this.hideHelpDialog();
    if (this.searchOverlay) this.searchOverlay.style.display = 'block';
    this.searchInput?.focus();
  }

  hideSearch(): void {
    if (this.searchOverlay) this.searchOverlay.style.display = 'none';
    this.searchInput?.blur();
    this.searchInput.value = '';
    this.selectedSearchIndex = -1;
    if (this.searchResults) this.searchResults.innerHTML = '';
  }

  showZoomDialog(): void {
    this.hideSearch();
    this.hideHelpDialog();
    if (this.zoomOverlay) this.zoomOverlay.style.display = 'block';
    if (this.zoomInput) {
      this.zoomInput.value = (this.state.scalingFactor / CONFIG.ZOOM_DISPLAY_MULTIPLIER).toString();
      this.zoomInput.focus();
      this.zoomInput.select();
    }
  }

  hideZoomDialog(): void {
    if (this.zoomOverlay) this.zoomOverlay.style.display = 'none';
    this.zoomInput?.blur();
  }

  showHelpDialog(): void {
    this.hideSearch();
    this.hideZoomDialog();
    if (this.helpOverlay) this.helpOverlay.style.display = 'block';
  }

  hideHelpDialog(): void {
    if (this.helpOverlay) this.helpOverlay.style.display = 'none';
  }

  toggleHelpDialog(): void {
    if (this.helpOverlay && this.helpOverlay.style.display === 'block') {
      this.hideHelpDialog();
    } else {
      this.showHelpDialog();
    }
  }

  /**
   * The complex Home logic (Set/Go/Clear) shared between button and hotkey
   */
  async handleHomeAction(): Promise<void> {
    const hasHome = this.state.homeLocation !== null;
    const atHome = this.state.isAtHome();

    if (!hasHome) {
      this.state.setHome();
    } else if (atHome) {
      this.state.clearHome();
    } else {
      const home = this.state.homeLocation!;
      this.state.setLocation(home.lat, home.lon);
    }

    this.updateHUD(new Date()); 
    await this.onLocationSelected();
  }

  private initSearch(): void {
    this.searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      if (!this.searchResults || query.length < CONFIG.SEARCH_MIN_QUERY) return;

      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(
        () => this.performSearch(query),
        CONFIG.SEARCH_DEBOUNCE_MS
      );
    });

    this.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateResults(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateResults(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.selectedSearchIndex >= 0) {
          const item = this.currentSearchData[this.selectedSearchIndex];
          this.selectItem(item);
        }
      }
    });
  }

  private initZoomDialog(): void {
    this.zoomInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideZoomDialog();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const val = parseFloat(this.zoomInput.value);
        if (!isNaN(val) && val >= CONFIG.MIN_ZOOM_INPUT) {
          this.state.scalingFactor = val * CONFIG.ZOOM_DISPLAY_MULTIPLIER;
          this.hideZoomDialog();
          this.onLocationSelected();
        }
      }
    });
  }

  private initClickOutside(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Close search if clicking outside
      if (this.searchOverlay?.style.display === 'block' && 
          !this.searchOverlay.contains(target) && 
          !this.btnSearch?.contains(target)) {
        this.hideSearch();
      }

      // Close zoom if clicking outside
      if (this.zoomOverlay?.style.display === 'block' && 
          !this.zoomOverlay.contains(target) && 
          !this.zoomGroup?.contains(target)) {
        this.hideZoomDialog();
      }

      // Close help if clicking outside
      if (this.helpOverlay?.style.display === 'block' && 
          !this.helpOverlay.contains(target) && 
          !this.btnHelp?.contains(target)) {
        this.hideHelpDialog();
      }
    });
  }

  private navigateResults(dir: number): void {
    if (this.currentSearchData.length === 0) return;
    
    this.selectedSearchIndex += dir;
    if (this.selectedSearchIndex < 0) this.selectedSearchIndex = this.currentSearchData.length - 1;
    if (this.selectedSearchIndex >= this.currentSearchData.length) this.selectedSearchIndex = 0;

    this.updateResultHighlight();
  }

  private updateResultHighlight(): void {
    if (!this.searchResults) return;
    const items = this.searchResults.querySelectorAll('.search-item');
    items.forEach((item, idx) => {
      if (idx === this.selectedSearchIndex) {
        item.classList.add('selected');
        if (typeof item.scrollIntoView === 'function') {
          item.scrollIntoView({ block: 'nearest' });
        }
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private selectItem(item: SearchResult): void {
    this.state.setLocation(asLatitude(parseFloat(item.lat)), asLongitude(parseFloat(item.lon)));
    this.hideSearch();
    this.onLocationSelected();
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
        ) as 'STREETS' | 'TOPOGRAPHIC' | 'IMAGERY';
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
      await this.handleHomeAction();
    });

    this.btnMode?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.state.renderMode = this.state.renderMode === '3D' ? '2D' : '3D';
      this.onLocationSelected();
    });

    this.btnSearch?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.showSearch();
    });

    this.btnHelp?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.toggleHelpDialog();
    });

    this.zoomGroup?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.showZoomDialog();
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
        )}&limit=${CONFIG.SEARCH_RESULT_LIMIT}`
      );
      this.currentSearchData = await resp.json();
      this.selectedSearchIndex = -1;

      const resultsContainer = this.searchResults;
      if (resultsContainer) {
        resultsContainer.innerHTML = '';
        this.currentSearchData.forEach((item: SearchResult) => {
          const div = document.createElement('div');
          div.className = 'search-item';
          div.textContent = item.display_name;
          div.onpointerdown = (e) => {
            e.stopPropagation();
            this.selectItem(item);
          };
          resultsContainer.appendChild(div);
        });
      }
    } catch (e) {
      console.error('Search failed:', e);
    }
  }
}
