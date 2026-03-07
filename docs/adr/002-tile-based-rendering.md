# ADR 002: Pivot to Tile-Based Rendering for Map Layers

## Status
Accepted

## Context
The initial prototype used TopoJSON for rendering map features. While efficient for simple outlines, TopoJSON does not support high-resolution satellite imagery, detailed terrain, or logistical data (roads/streets) which are required for the advanced map modes.

## Decision
We will transition to a **Tile-Based Rendering** system. This involves:
- Using a `TileRenderer` utility to fetch and project map tiles from public providers.
- Supporting three primary modes:
  - **IMAGERY:** Esri World Imagery.
  - **TOPOGRAPHIC:** Esri World Topographic Map.
  - **STREETS:** OpenStreetMap.
- Dynamically calculating Web Mercator tile coordinates based on the custom Azimuthal Equidistant projection.

## Consequences
- **Improved Detail:** Provides high-resolution visual data at all zoom levels (up to 100,000x).
- **Network Dependency:** Requires an internet connection to fetch tiles (cached locally by the browser).
- **Rendering Complexity:** Requires mapping spherical Mercator tiles into the azimuthal screen space, which results in some distortion at the tile boundaries but provides a superior visual experience.
- **Hardware Impact:** Throttled rendering (1Hz) remains necessary for RPi Zero stability when loading multiple tile images.
