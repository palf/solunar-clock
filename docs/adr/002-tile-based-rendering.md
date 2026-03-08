# ADR 002: Pivot to Tile-Based Rendering for Map Layers

## Status
Accepted

## Context
The initial prototype used TopoJSON for rendering map features. While efficient for simple outlines, TopoJSON does not support high-resolution satellite imagery or detailed terrain required for fixed-location neighborhood views (3000x zoom).

## Decision
We will transition to a **Tile-Based Rendering** system. This involves:
- Using a `TileRenderer` utility to fetch and project map tiles from public providers.
- Supporting three primary modes:
  - **IMAGERY:** Esri World Imagery.
  - **TOPOGRAPHIC:** Esri World Topographic Map.
  - **STREETS:** OpenStreetMap.
- Dynamically calculating Web Mercator tile coordinates based on the custom Azimuthal Equidistant projection.
- Using a **7x7 grid** (49 tiles) to provide a movement buffer and ensure full coverage of the circular clock face at all zoom levels.

## Consequences
- **Improved Detail:** Provides high-resolution visual data at all zoom levels (up to 1,000,000x scaling).
- **Network Dependency:** Requires an internet connection to fetch tiles (cached locally by the browser).
- **Rendering Complexity:** Requires a dual-engine approach:
  - **2D Engine:** Quad-grid subdivision for performance.
  - **3D Engine:** WebGL fragment shaders for pixel-perfect warping.
- **Hardware Impact:** Throttled rendering (1Hz) and double-buffering are used to maintain stability on the Raspberry Pi Zero.
