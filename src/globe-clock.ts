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
import { loadInitialState } from './state-loader';
import { TileRenderer } from './tile-renderer';
import { TimeSimulation } from './time-simulation';
import { TouchController } from './touch-controller';
import type { Latitude, Longitude, Scale } from './types';
import { UIController } from './ui-controller';

/**
 * Bootstrap the application within an async context to handle data loading.
 * This avoids 'top-level await' issues in the ES2020 target environment.
 */
async function bootstrap() {
  console.log(
    '%c🌍 Solunar Globe Clock %c v1.0.0\n%chttps://github.com/palf/solunar-clock',
    'color: #38bdf8; font-size: 20px; font-weight: bold;',
    'color: #94a3b8; font-size: 12px;',
    'color: #accent; text-decoration: underline;'
  );

  // 1. Initialize State (The very first thing)
  const initialConfig = loadInitialState();
  const state = new AppState(initialConfig);

  // 2. Core Components
  const svg = d3
    .select<SVGSVGElement, unknown>('#svg')
    .attr('viewBox', `0 0 ${state.width} ${state.height}`);

  const projection = new Projection(
    state.centerX,
    state.centerY,
    state.centerLat,
    state.centerLon,
    state.scale
  );

  const timeSim = new TimeSimulation(state.startTime, state.timeSpeedMultiplier);

  // 3. Initialize Rendering Layers
  const rotatableG = svg.append<SVGGElement>('g').attr('id', 'layer-rotatable');

  const mapG = rotatableG.append<SVGGElement>('g').attr('id', 'layer-map');
  const staticG = rotatableG.append<SVGGElement>('g').attr('id', 'layer-static');
  const handG = rotatableG.append<SVGGElement>('g').attr('id', 'layer-hands');

  const canvas = document.getElementById('map-canvas') as HTMLCanvasElement;
  const webglCanvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
  const mapRenderer = new MapRenderer(mapG, projection);
  const tileRenderer = new TileRenderer(canvas, webglCanvas, projection);
  const clockFace = new ClockFace(svg, state.centerX, state.centerY, state.radius);

  // 4. Rendering Lifecycle Management
  let isRendering = false;
  let needsRedraw = false;
  let isInitialRender = true;
  let redrawPending = false;

  // Dirty check variables to stop 1Hz "blips"
  let lastLat: Latitude | null = null;
  let lastLon: Longitude | null = null;
  let lastScale: Scale | null = null;
  let lastLayer = '';
  let lastMode = '';

  const redrawMap = async () => {
    if (redrawPending) return;

    redrawPending = true;
    requestAnimationFrame(async () => {
      await performRedraw();
      redrawPending = false;
    });
  };

  const performRedraw = async () => {
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
      redrawMap();
    }
  };

  const updateDynamicElements = (onlyTime = false) => {
    const now = timeSim.getSimulatedTime();
    ui.updateTime(now);
    if (!onlyTime) {
      updateHands(now);
    }
  };

  const updateHands = (now: Date) => {
    const sunPos = calculateSunPosition(now);
    const moonPos = calculateMoonPosition(now);
    const [sunX, sunY] = projection.project(sunPos);
    const [moonX, moonY] = projection.project(moonPos);

    const sunAngle = Math.atan2(sunX - state.centerX, state.centerY - sunY) * (180 / Math.PI);
    const moonAngle = Math.atan2(moonX - state.centerX, state.centerY - moonY) * (180 / Math.PI);

    sunHandGroup.attr(
      'transform',
      `translate(${state.centerX}, ${state.centerY}) rotate(${sunAngle})`
    );
    moonHandGroup.attr(
      'transform',
      `translate(${state.centerX}, ${state.centerY}) rotate(${moonAngle})`
    );
  };

  // Create Sun Icon
  const sunHandGroup = handG.append('g').attr('class', 'hand-sun-group');

  // Thin arm
  sunHandGroup
    .append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', -state.radius)
    .attr('stroke', CONFIG.AESTHETICS.SUN.ARM_COLOR)
    .attr('stroke-width', CONFIG.AESTHETICS.GLOBAL.ARM_WIDTH);

  const sunIcon = sunHandGroup.append('g').attr('transform', `translate(0, ${-state.radius})`);
  sunIcon
    .append('circle')
    .attr('r', CONFIG.AESTHETICS.SUN.RADIUS)
    .attr('fill', CONFIG.AESTHETICS.SUN.PRIMARY_COLOR)
    .attr('stroke', CONFIG.AESTHETICS.SUN.SECONDARY_COLOR)
    .attr('stroke-width', 2);
  // Sun rays
  for (let i = 0; i < CONFIG.AESTHETICS.SUN.RAY_COUNT; i++) {
    sunIcon
      .append('line')
      .attr('x1', 0)
      .attr('y1', CONFIG.AESTHETICS.SUN.RAY_START)
      .attr('x2', 0)
      .attr('y2', CONFIG.AESTHETICS.SUN.RAY_END)
      .attr('stroke', CONFIG.AESTHETICS.SUN.PRIMARY_COLOR)
      .attr('stroke-width', CONFIG.AESTHETICS.SUN.STROKE_WIDTH)
      .attr('transform', `rotate(${i * (360 / CONFIG.AESTHETICS.SUN.RAY_COUNT)})`);
  }

  // Create Moon Icon
  const moonHandGroup = handG.append('g').attr('class', 'hand-moon-group');

  // Thin arm
  moonHandGroup
    .append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', -state.radius)
    .attr('stroke', CONFIG.AESTHETICS.MOON.ARM_COLOR)
    .attr('stroke-width', CONFIG.AESTHETICS.GLOBAL.ARM_WIDTH);

  const moonIcon = moonHandGroup.append('g').attr('transform', `translate(0, ${-state.radius})`);
  // Crescent moon
  moonIcon
    .append('path')
    .attr('d', CONFIG.AESTHETICS.MOON.PATH)
    .attr('fill', CONFIG.AESTHETICS.MOON.PRIMARY_COLOR)
    .attr('stroke', CONFIG.AESTHETICS.MOON.SECONDARY_COLOR)
    .attr('stroke-width', CONFIG.AESTHETICS.MOON.STROKE_WIDTH);

  // 5. Initialize Controllers
  const ui = new UIController(state, timeSim, redrawMap);
  new KeyboardController(state, ui, redrawMap);
  new TouchController(document.body, state, redrawMap);

  // 6. Draw Initial Static UI
  clockFace.drawCompassPoints(staticG);
  clockFace.drawCenterMark(staticG);

  // 7. Bootstrap Application
  state.mapData = await mapRenderer.loadMapData();

  // Initial draw
  await redrawMap();

  // 8. Start Tick Loop (1Hz for RPi Zero) - Only update time text and hands
  setInterval(() => {
    const now = timeSim.getSimulatedTime();
    ui.updateTime(now);
    updateHands(now);
  }, CONFIG.PERFORMANCE.UPDATE_INTERVAL_MS);
}

// Start the app
bootstrap().catch(console.error);
