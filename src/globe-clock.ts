/**
 * Solunar Clock - Main Application Orchestrator
 */

/// <reference path="./types.ts" />

import * as d3 from 'd3';

import { AppState } from './app-state';
import { calculateMoonPosition, calculateSunPosition } from './astronomy';
import { ClockFace } from './clock-face';
import { CONFIG } from './config';
import { getCurrentPosition } from './geolocation-service';
import { KeyboardController } from './keyboard-controller';
import { MapRenderer } from './map-renderer';
import { Projection } from './projection';
import { TileRenderer } from './tile-renderer';
import { TimeSimulation } from './time-simulation';
import { TouchController } from './touch-controller';
import { UIController } from './ui-controller';

(async (): Promise<void> => {
  // 1. Initialize State & Core Components
  const state = new AppState();
  const svg = d3.select('#svg').attr('viewBox', `0 0 ${CONFIG.WIDTH} ${CONFIG.HEIGHT}`);

  const projection = new Projection(
    state.centerX,
    state.centerY,
    state.centerLat,
    state.centerLon,
    state.scale
  );

  const timeSim = new TimeSimulation(state.startTime, state.timeSpeedMultiplier);

  // 2. Initialize Rendering Layers
  const bgG = svg.append('g').attr('id', 'layer-bg');
  const rotatableG = svg
    .append('g')
    .attr('id', 'layer-rotatable')
    .attr(
      'transform',
      `translate(${state.centerX}, ${state.centerY}) rotate(${state.rotation}) translate(${-state.centerX}, ${-state.centerY})`
    );

  const mapG = rotatableG.append('g').attr('id', 'layer-map');
  const staticG = rotatableG.append('g').attr('id', 'layer-static');
  const handG = rotatableG.append('g').attr('id', 'layer-hands');

  const canvas = document.getElementById('map-canvas') as HTMLCanvasElement;
  const webglCanvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
  const mapRenderer = new MapRenderer(mapG, projection);
  const tileRenderer = new TileRenderer(canvas, webglCanvas, projection);
  const clockFace = new ClockFace(
    svg as any,
    state.centerX,
    state.centerY,
    state.radius
  );

  const defs = svg.append('defs');
  clockFace.drawMask(defs);
  mapG.attr('clip-path', 'url(#clock-mask)');

  // 3. Rendering Lifecycle Management
  let isRendering = false;
  let needsRedraw = false;
  let userHasInteracted = false;

  const redrawMap = async () => {
    userHasInteracted = true;
    if (isRendering) {
      needsRedraw = true;
      return;
    }

    isRendering = true;
    projection.updateCenter(state.centerLat, state.centerLon);
    projection.updateScale(state.scale);

    if (
      state.mapLayer === 'IMAGERY' ||
      state.mapLayer === 'TOPOGRAPHIC' ||
      state.mapLayer === 'STREETS'
    ) {
      mapG.selectAll('*').remove(); // Clear SVG map if exists
      await tileRenderer.render(state.mapLayer, state.renderMode);
    } else {
      canvas.style.display = 'block';
      webglCanvas.style.display = 'none';
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height); // Clear Canvas
      await mapRenderer.render(state.mapData);
    }

    updateDynamicElements();
    isRendering = false;
    if (needsRedraw) {
      needsRedraw = false;
      requestAnimationFrame(redrawMap);
    }
  };

  const updateDynamicElements = () => {
    const now = timeSim.getSimulatedTime();
    ui.updateHUD(now);
    updateHands(now);
  };

  const updateHands = (now: Date) => {
    const sunPos = calculateSunPosition(now);
    const moonPos = calculateMoonPosition(now);
    const [sunX, sunY] = projection.project(sunPos);
    const [moonX, moonY] = projection.project(moonPos);

    const handLen = state.radius * CONFIG.HAND_LENGTH_FACTOR;
    const sunAngle = Math.atan2(sunX - state.centerX, state.centerY - sunY);
    const moonAngle = Math.atan2(moonX - state.centerX, state.centerY - moonY);

    sunHand
      .attr('x1', state.centerX)
      .attr('y1', state.centerY)
      .attr('x2', state.centerX + handLen * Math.sin(sunAngle))
      .attr('y2', state.centerY - handLen * Math.cos(sunAngle));

    moonHand
      .attr('x1', state.centerX)
      .attr('y1', state.centerY)
      .attr('x2', state.centerX + handLen * Math.sin(moonAngle))
      .attr('y2', state.centerY - handLen * Math.cos(moonAngle));
  };

  const sunHand = handG
    .append('line')
    .attr('class', 'hand-sun')
    .attr('stroke', 'orange')
    .attr('stroke-width', 3)
    .attr('stroke-linecap', 'round');
  const moonHand = handG
    .append('line')
    .attr('class', 'hand-moon')
    .attr('stroke', '#38bdf8')
    .attr('stroke-width', 3)
    .attr('stroke-linecap', 'round');

  // 4. Initialize Controllers
  const ui = new UIController(state, redrawMap);
  new KeyboardController(state, ui, redrawMap);
  new TouchController(document.body, state, redrawMap);

  // 5. Draw Initial Static UI
  clockFace.drawBackground(bgG);
  clockFace.drawHourLabels(staticG);
  clockFace.drawCenterMark(staticG);
  clockFace.drawSlices(staticG);

  // 6. Bootstrap Application
  state.mapData = await mapRenderer.loadMapData();

  // Initial draw with default location
  await redrawMap();
  userHasInteracted = false; // Reset after initial draw

  // Try to upgrade to user's real location
  getCurrentPosition().then(async ([userLon, userLat]) => {
    // Only apply if user hasn't moved the map themselves
    if (!userHasInteracted) {
      state.centerLat = userLat;
      state.centerLon = userLon;
      await redrawMap();
      userHasInteracted = false; // Reset again
    }
  });

  // 7. Start Tick Loop (1Hz for RPi Zero)
  setInterval(updateDynamicElements, CONFIG.UPDATE_INTERVAL_MS);
})();
