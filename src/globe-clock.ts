/**
 * Solunar Clock - Reimagined HUD Version
 * Fully Centered | Premium Aesthetic | Ready for Layering
 */

/// <reference path="./types.ts" />

declare const d3: any;

import { AppState } from './app-state';
import { Astronomy } from './astronomy';
import { ClockFace } from './clock-face';
import { CONFIG } from './config';
import { MapRenderer } from './map-renderer';
import { Projection } from './projection';
import { TimeSimulation } from './time-simulation';

(async (): Promise<void> => {
  const state = new AppState();
  const svg = d3.select('#svg');

  const bgG = svg.append('g');
  const rotatableG = svg.append('g').attr('transform', `translate(${state.centerX}, ${state.centerY}) rotate(${state.rotation}) translate(${-state.centerX}, ${-state.centerY})`);
  const mapG = rotatableG.append('g');
  const slicesG = rotatableG.append('g');
  const labelsG = rotatableG.append('g');
  const handG = rotatableG.append('g');

  const projection = new Projection(state.centerX, state.centerY, state.centerLat, state.centerLon, state.scale);
  const timeSim = new TimeSimulation(state.startTime, state.timeSpeedMultiplier);
  const mapRenderer = new MapRenderer(mapG, projection);
  const clockFace = new ClockFace(svg as any, state.centerX, state.centerY, state.radius);

  clockFace.drawBackground(bgG);
  clockFace.drawHourLabels(labelsG);
  clockFace.drawCenterMark(rotatableG.append('g'));

  const sunHand = handG.append('line').attr('stroke', 'orange').attr('stroke-width', 3).attr('stroke-linecap', 'round');
  const moonHand = handG.append('line').attr('stroke', '#38bdf8').attr('stroke-width', 3).attr('stroke-linecap', 'round');

  function updateHUD(): void {
    const now = timeSim.getSimulatedTime();
    
    const timeEl = document.getElementById('display-time');
    if (timeEl) timeEl.textContent = now.toISOString().substring(11, 19);
    
    const posEl = document.getElementById('display-pos');
    if (posEl) posEl.textContent = `${Math.abs(state.centerLat).toFixed(2)}° ${state.centerLat >= 0 ? 'N' : 'S'}, ${Math.abs(state.centerLon).toFixed(2)}° ${state.centerLon >= 0 ? 'E' : 'W'}`;
    
    const zoomEl = document.getElementById('display-zoom');
    if (zoomEl) zoomEl.textContent = `${(state.scalingFactor / 10).toFixed(1)}x`;

    const layerEl = document.getElementById('display-layer');
    if (layerEl) layerEl.textContent = state.mapLayer;

    // Update hands
    const sunPos = Astronomy.calculateSunPosition(now);
    const moonPos = Astronomy.calculateMoonPosition(now);
    const [sunX, sunY] = projection.project(sunPos);
    const [moonX, moonY] = projection.project(moonPos);
    const handLen = state.radius * 0.9;
    
    const sunAngle = Math.atan2(sunX - state.centerX, state.centerY - sunY);
    sunHand.attr('x1', state.centerX).attr('y1', state.centerY)
           .attr('x2', state.centerX + handLen * Math.sin(sunAngle))
           .attr('y2', state.centerY - handLen * Math.cos(sunAngle));

    const moonAngle = Math.atan2(moonX - state.centerX, state.centerY - moonY);
    moonHand.attr('x1', state.centerX).attr('y1', state.centerY)
            .attr('x2', state.centerX + handLen * Math.sin(moonAngle))
            .attr('y2', state.centerY - handLen * Math.cos(moonAngle));
  }

  async function redraw(): Promise<void> {
    // Synchronize projection state with current app state
    projection.updateCenter(state.centerLat, state.centerLon);
    projection.updateScale(state.scale);
    
    // Perform full map render
    await mapRenderer.render(state.mapData);
    
    // Update HUD display
    updateHUD();
  }

  async function getUserLocation(): Promise<void> {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      state.centerLat = pos.coords.latitude;
      state.centerLon = pos.coords.longitude;
      await redraw();
    }, (err) => {
      console.warn('Geolocation failed:', err);
    });
  }

  // Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    
    // Zoom Constraints (0.1x to 100x)
    // scalingFactor 10 = 1.0x, so range is 1 to 1000
    const minScale = 1;
    const maxScale = 1000;
    
    // Normalize panning step based on zoom
    // At 1.0x (scalingFactor 10), move by 1 degree.
    // At 10.0x (scalingFactor 100), move by 0.1 degree.
    const baseStep = e.shiftKey ? 10 : 1;
    const normalizedStep = baseStep / (state.scalingFactor / 10);

    switch(e.key) {
      case '+': case '=': 
        state.scalingFactor = Math.min(maxScale, state.scalingFactor * 1.2); 
        redraw(); 
        break;
      case '-': case '_': 
        state.scalingFactor = Math.max(minScale, state.scalingFactor / 1.2); 
        redraw(); 
        break;
      case 'ArrowUp': 
        if (e.shiftKey) { 
          state.scalingFactor = Math.min(maxScale, state.scalingFactor * 1.2); 
        } else { 
          state.centerLat = Math.min(90, state.centerLat + normalizedStep); 
        }
        redraw(); 
        break;
      case 'ArrowDown': 
        if (e.shiftKey) { 
          state.scalingFactor = Math.max(minScale, state.scalingFactor / 1.2); 
        } else { 
          state.centerLat = Math.max(-90, state.centerLat - normalizedStep); 
        }
        redraw(); 
        break;
      case 'ArrowLeft': 
        state.centerLon = ((state.centerLon - normalizedStep + 180) % 360) - 180; 
        redraw(); 
        break;
      case 'ArrowRight': 
        state.centerLon = ((state.centerLon + normalizedStep + 180) % 360) - 180; 
        redraw(); 
        break;
      case 'l': // Toggle mock layers
        const layers: ('TERRAIN' | 'SATELLITE' | 'LOGISTICAL')[] = ['TERRAIN', 'SATELLITE', 'LOGISTICAL'];
        const idx = layers.indexOf(state.mapLayer);
        state.mapLayer = layers[(idx + 1) % layers.length];
        updateHUD();
        break;
      case '/': case 's': 
        e.preventDefault();
        const box = document.getElementById('search-overlay');
        if (box) box.style.display = 'block';
        document.getElementById('locationSearch')?.focus();
        break;
      case '0':
        state.centerLat = 51.5074;
        state.centerLon = -0.1278;
        state.scalingFactor = 10;
        redraw();
        break;
    }
  });

  const searchInput = document.getElementById('locationSearch') as HTMLInputElement;
  const searchResults = document.getElementById('searchResults');

  searchInput?.addEventListener('input', async (e) => {
    const query = (e.target as any).value;
    if (!searchResults || query.length < 3) return;
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await resp.json();
      searchResults.innerHTML = '';
      data.forEach((item: any) => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.textContent = item.display_name;
        div.onclick = async () => {
          state.centerLat = parseFloat(item.lat);
          state.centerLon = parseFloat(item.lon);
          (document.getElementById('search-overlay') as any).style.display = 'none';
          searchInput.value = '';
          await redraw();
        };
        searchResults.appendChild(div);
      });
    } catch (e) { console.error(e); }
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      (document.getElementById('search-overlay') as any).style.display = 'none';
      searchInput.blur();
    }
  });

  // Start animation loop (Every 1s for RPi Zero performance)
  setInterval(updateHUD, 1000);

  // Initialize
  state.mapData = await mapRenderer.loadMapData();
  
  // First render with default (London)
  await redraw();
  clockFace.drawSlices(slicesG);

  // Then try to get location and update if possible
  getUserLocation();
})();
