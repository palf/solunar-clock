/**
 * Solunar Clock - Main Application Orchestrator
 */

/// <reference path="./types.ts" />

import * as d3 from 'd3';

import { AppState } from './app-state';
import { calculateMoonPosition, calculateSunPosition } from './astronomy';
import { ClockFace } from './clock-face';
import { CONFIG } from './config';
import { KeyboardController } from './keyboard-controller';
import { MapRenderer } from './map-renderer';
import { Projection } from './projection';
import { TileRenderer } from './tile-renderer';
import { TimeSimulation } from './time-simulation';
import { TouchController } from './touch-controller';
import { UIController } from './ui-controller';

(async (): Promise<void> => {
  console.log(
    '%c🌍 Solunar Globe Clock %c v1.0.0\n%chttps://github.com/palf/solunar-clock',
    'color: #38bdf8; font-size: 20px; font-weight: bold;',
    'color: #94a3b8; font-size: 12px;',
    'color: #accent; text-decoration: underline;'
  );

  // 1. Initialize State & Core Components
  const state = new AppState();
  const svg = d3.select<SVGSVGElement, unknown>('#svg').attr('viewBox', `0 0 ${CONFIG.WIDTH} ${CONFIG.HEIGHT}`);

  const projection = new Projection(
    state.centerX,
    state.centerY,
    state.centerLat,
    state.centerLon,
    state.scale
  );

  const timeSim = new TimeSimulation(state.startTime, state.timeSpeedMultiplier);

  // 2. Initialize Rendering Layers
  const bgG = svg.append<SVGGElement>('g').attr('id', 'layer-bg');
  const rotatableG = svg
    .append<SVGGElement>('g')
    .attr('id', 'layer-rotatable');

  const mapG = rotatableG.append<SVGGElement>('g').attr('id', 'layer-map');
  const staticG = rotatableG.append<SVGGElement>('g').attr('id', 'layer-static');
  const handG = rotatableG.append<SVGGElement>('g').attr('id', 'layer-hands');

  const canvas = document.getElementById('map-canvas') as HTMLCanvasElement;
  const webglCanvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
  const mapRenderer = new MapRenderer(mapG, projection);
  const tileRenderer = new TileRenderer(canvas, webglCanvas, projection);
  const clockFace = new ClockFace(
    svg,
    state.centerX,
    state.centerY,
    state.radius
  );

  const defs = svg.append<SVGDefsElement>('defs');
  clockFace.drawMask(defs);
  mapG.attr('clip-path', 'url(#clock-mask)');

  // 3. Rendering Lifecycle Management
  let isRendering = false;
  let needsRedraw = false;
  let isInitialRender = true;

  // Dirty check variables to stop 1Hz "blips"
  let lastLat = -999;
  let lastLon = -999;
  let lastScale = -999;
  let lastLayer = '';
  let lastMode = '';

  const redrawMap = async () => {
    // Check if anything geographic actually changed
    const isDirty = 
      isInitialRender ||
      state.centerLat !== lastLat || 
      state.centerLon !== lastLon || 
      state.scale !== lastScale || 
      state.mapLayer !== lastLayer ||
      state.renderMode !== lastMode;

    if (!isDirty) return;

    if (isRendering) {
      needsRedraw = true;
      return;
    }

    isRendering = true;
    isInitialRender = false;
    
    // Update trackers
    lastLat = state.centerLat;
    lastLon = state.centerLon;
    lastScale = state.scale;
    lastLayer = state.mapLayer;
    lastMode = state.renderMode;

    projection.updateCenter(state.centerLat, state.centerLon);
    projection.updateScale(state.scale);

    if (
      state.mapLayer === 'IMAGERY' ||
      state.mapLayer === 'TOPOGRAPHIC' ||
      state.mapLayer === 'STREETS'
    ) {
      mapG.selectAll('*').remove();
      await tileRenderer.render(state.mapLayer, state.renderMode);
    } else {
      canvas.style.display = 'block';
      webglCanvas.style.display = 'none';
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      await mapRenderer.render(state.mapData);
    }

    updateDynamicElements(false);
    isRendering = false;
    if (needsRedraw) {
      needsRedraw = false;
      requestAnimationFrame(redrawMap);
    }
  };

  const updateDynamicElements = (onlyTime = false) => {
    const now = timeSim.getSimulatedTime();
    ui.updateHUD(now, onlyTime);
    if (!onlyTime) {
      updateHands(now);
    }
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

  // Initial draw
  await redrawMap();

  // 7. Start Tick Loop (1Hz for RPi Zero) - Only update time text and hands
  setInterval(() => {
    const now = timeSim.getSimulatedTime();
    ui.updateHUD(now, true);
    updateHands(now);
  }, CONFIG.UPDATE_INTERVAL_MS);
})();
