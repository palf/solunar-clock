/**
 * Solunar Clock - Main Application
 *
 * A globe clock showing sun and moon positions with:
 * - Azimuthal equidistant projection centered on user location
 * - Real-time or time-accelerated sun and moon position tracking
 * - Interactive controls for location and time speed
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
  // Initialize state
  const state = new AppState();

  // Initialize SVG
  const svg = d3
    .select('#svg')
    .attr('viewBox', `0 0 ${state.width} ${state.height}`)
    .attr('width', state.width)
    .attr('height', state.height);

  // Create clip path for the map (to clip it to the circle)
  const defs = svg.append('defs');
  const clipPath = defs.append('clipPath').attr('id', 'map-clip');
  clipPath
    .append('circle')
    .attr('cx', state.centerX)
    .attr('cy', state.centerY)
    .attr('r', state.radius);

  // Create SVG groups in rendering order (bottom to top)
  // Background layer (outer rim) - not rotated
  const bgG = svg.append('g').attr('id', 'background');

  // Rotatable container group (everything inside rotates)
  const rotatableG = svg
    .append('g')
    .attr('id', 'rotatable')
    .attr(
      'transform',
      `translate(${state.centerX}, ${state.centerY}) rotate(${state.rotation}) translate(${-state.centerX}, ${-state.centerY})`
    );

  // Map layer (should be visible, clipped to circle)
  const mapG = rotatableG.append('g').attr('id', 'map').attr('clip-path', 'url(#map-clip)');
  // Slices layer (overlay on map)
  const slicesG = rotatableG.append('g').attr('id', 'slices');
  // Labels layer
  const labelsG = rotatableG.append('g').attr('id', 'labels');
  // Center mark layer
  const centerG = rotatableG.append('g').attr('id', 'center');
  // Hands layer (top - most visible)
  const handG = rotatableG.append('g').attr('id', 'hand');

  // Initialize components
  const projection = new Projection(
    state.centerX,
    state.centerY,
    state.centerLat,
    state.centerLon,
    state.scale // This will use the getter which computes from scalingFactor
  );

  const timeSim = new TimeSimulation(state.startTime, state.timeSpeedMultiplier);
  const mapRenderer = new MapRenderer(mapG, projection);
  const clockFace = new ClockFace(svg as any, state.centerX, state.centerY, state.radius);

  // Draw clock face elements in correct order
  // 1. Background (white circles with rim)
  clockFace.drawBackground(bgG);
  // 2. Slices will be drawn after map loads
  // 3. Labels
  clockFace.drawHourLabels(labelsG);
  // 4. Center mark
  clockFace.drawCenterMark(centerG);

  // Create sun and moon hands (will be updated by updateHands)
  // Hands should NOT be clipped - they extend beyond the circle
  const sunHand = handG
    .append('line')
    .attr('class', 'hand-sun')
    .attr('x1', state.centerX)
    .attr('y1', state.centerY)
    .attr('x2', state.centerX)
    .attr('y2', state.centerY)
    .attr('stroke', 'orange')
    .attr('stroke-width', 6)
    .attr('stroke-linecap', 'round');
  const moonHand = handG
    .append('line')
    .attr('class', 'hand-moon')
    .attr('x1', state.centerX)
    .attr('y1', state.centerY)
    .attr('x2', state.centerX)
    .attr('y2', state.centerY)
    .attr('stroke', 'blue')
    .attr('stroke-width', 6)
    .attr('stroke-linecap', 'round');

  // ========================================================================
  // UI EVENT HANDLERS
  // ========================================================================

  /**
   * Update the clock hands and display
   */
  function updateHands(): void {
    const now = timeSim.getSimulatedTime();

    // Calculate sun and moon positions
    const sunPos = Astronomy.calculateSunPosition(now);
    const moonPos = Astronomy.calculateMoonPosition(now);

    // Project to screen coordinates
    const [sunX, sunY] = projection.project(sunPos);
    const [moonX, moonY] = projection.project(moonPos);

    // Calculate angles from center
    const sunAngle = Math.atan2(sunX - state.centerX, state.centerY - sunY);
    const moonAngle = Math.atan2(moonX - state.centerX, state.centerY - moonY);

    // Draw hands
    const handLen = state.radius * CONFIG.HAND_LENGTH_FACTOR;
    const sunX2 = state.centerX + handLen * Math.sin(sunAngle);
    const sunY2 = state.centerY - handLen * Math.cos(sunAngle);
    const moonX2 = state.centerX + handLen * Math.sin(moonAngle);
    const moonY2 = state.centerY - handLen * Math.cos(moonAngle);

    // Update hand positions
    sunHand.attr('x1', state.centerX).attr('y1', state.centerY).attr('x2', sunX2).attr('y2', sunY2);
    moonHand
      .attr('x1', state.centerX)
      .attr('y1', state.centerY)
      .attr('x2', moonX2)
      .attr('y2', moonY2);

    // Update caption
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const existing = svg.selectAll('.captionText').data([1]);
    existing
      .enter()
      .append('text')
      .attr('class', 'captionText caption')
      .attr('x', state.centerX)
      .attr('y', state.centerY + state.radius + 60)
      .attr('text-anchor', 'middle')
      .merge(existing as any)
      .text(
        `Time: ${timeStr} (${state.timeSpeedMultiplier.toFixed(2)}x speed) | Center: ${state.centerLat.toFixed(1)}°, ${state.centerLon.toFixed(1)}°`
      );
  }

  /**
   * Update center position from input fields
   */
  async function updateCenterPosition(): Promise<void> {
    const latInput = document.getElementById('latitude') as HTMLInputElement;
    const lonInput = document.getElementById('longitude') as HTMLInputElement;

    if (latInput && lonInput) {
      state.centerLat = parseFloat(latInput.value) || 0;
      state.centerLon = parseFloat(lonInput.value) || 0;
      projection.updateCenter(state.centerLat, state.centerLon);
      await mapRenderer.render(state.mapData);
      updateHands();
    }
  }

  /**
   * Update time speed multiplier
   */
  function updateTimeSpeed(): void {
    const speedInput = document.getElementById('timeSpeed') as HTMLInputElement;
    if (speedInput) {
      state.timeSpeedMultiplier = parseFloat(speedInput.value) || CONFIG.DEFAULT_TIME_SPEED;
      timeSim.setSpeedMultiplier(state.timeSpeedMultiplier);
      updateHands();
    }
  }

  /**
   * Update zoom scale
   */
  async function updateZoomScale(): Promise<void> {
    const zoomInput = document.getElementById('zoomScale') as HTMLInputElement;
    if (zoomInput) {
      state.scalingFactor = parseFloat(zoomInput.value) || CONFIG.DEFAULT_SCALING_FACTOR;
      projection.updateScale(state.scale);
      await mapRenderer.render(state.mapData);
      updateHands();
    }
  }

  /**
   * Update rotation
   */
  function updateRotation(): void {
    const rotationInput = document.getElementById('rotation') as HTMLInputElement;
    if (rotationInput) {
      state.rotation = parseFloat(rotationInput.value) || 0;
      rotatableG.attr(
        'transform',
        `translate(${state.centerX}, ${state.centerY}) rotate(${state.rotation}) translate(${-state.centerX}, ${-state.centerY})`
      );
      updateHands();
    }
  }

  /**
   * Get user's current location via geolocation API
   * Updates center position and input fields, but does not render map
   */
  async function getUserLocation(): Promise<void> {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          state.centerLat = lat;
          state.centerLon = lon;
          projection.updateCenter(lat, lon);

          // Update input fields
          const latInput = document.getElementById('latitude') as HTMLInputElement;
          const lonInput = document.getElementById('longitude') as HTMLInputElement;
          if (latInput) latInput.value = lat.toFixed(6);
          if (lonInput) lonInput.value = lon.toFixed(6);

          updateHands();
          resolve();
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve();
        }
      );
    });
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  // Initialize center position from inputs
  const latInput = document.getElementById('latitude');
  const lonInput = document.getElementById('longitude');

  if (latInput) {
    state.centerLat = parseFloat((latInput as HTMLInputElement).value) || 0;
  }
  if (lonInput) {
    state.centerLon = parseFloat((lonInput as HTMLInputElement).value) || 0;
  }

  projection.updateCenter(state.centerLat, state.centerLon);

  // Load map data first
  const mapData = await mapRenderer.loadMapData();
  state.mapData = mapData;

  // Try to get user's current location (updates center but doesn't render)
  // We'll render after this completes
  const getUserLocationPromise = getUserLocation().catch(() => {
    // If geolocation fails, continue with default center (0,0)
  });

  // Wait for geolocation attempt (but don't block if it's taking too long)
  await Promise.race([
    getUserLocationPromise,
    new Promise((resolve) => setTimeout(resolve, 2000)), // 2 second timeout
  ]);

  // Always render map with current center position
  await mapRenderer.render(mapData);

  // Draw slices after map is rendered (so they overlay on map)
  clockFace.drawSlices(slicesG);

  // Set up event listeners
  if (latInput) {
    latInput.addEventListener('input', updateCenterPosition);
    latInput.addEventListener('change', updateCenterPosition);
  }
  if (lonInput) {
    lonInput.addEventListener('input', updateCenterPosition);
    lonInput.addEventListener('change', updateCenterPosition);
  }

  const getLocationButton = document.getElementById('getLocation');
  if (getLocationButton) {
    getLocationButton.addEventListener('click', async () => {
      await getUserLocation();
      await mapRenderer.render(state.mapData);
    });
  }

  const speedInput = document.getElementById('timeSpeed');
  if (speedInput) {
    speedInput.addEventListener('input', updateTimeSpeed);
    speedInput.addEventListener('change', updateTimeSpeed);
  }

  const zoomInput = document.getElementById('zoomScale');
  if (zoomInput) {
    zoomInput.addEventListener('input', updateZoomScale);
    zoomInput.addEventListener('change', updateZoomScale);
  }

  const rotationInput = document.getElementById('rotation');
  if (rotationInput) {
    rotationInput.addEventListener('input', updateRotation);
    rotationInput.addEventListener('change', updateRotation);
  }

  // Start animation loop
  updateHands();
  setInterval(updateHands, CONFIG.UPDATE_INTERVAL_MS);
})();
