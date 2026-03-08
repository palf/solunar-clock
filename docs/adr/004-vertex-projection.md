# ADR 004: Hardware-Accelerated Vertex Projection for 3D Mode

## Status
Accepted

## Context
The initial WebGL implementation (`3D` mode) attempted to use a full-screen fragment shader to calculate the inverse projection for every pixel. This approach was computationally expensive and led to synchronization issues when rendering multiple tiles, resulting in "empty maps" or flickering. The previous `WARP` mode (Canvas 2D) used a CPU-based 16x16 grid that suffered from sub-pixel anti-aliasing gaps (diagonal lines).

## Decision
We will use **Hardware-Accelerated Vertex Projection** for all 3D rendering.
1.  **Vertex Shader Math:** The exact Azimuthal Equidistant projection formula is implemented in the GLSL vertex shader.
2.  **Tile Subdivision:** Each map tile is treated as a 16x16 grid of vertices.
3.  **GPU Projection:** Instead of the CPU calculating screen coordinates, the CPU sends raw geographic coordinates (Lon/Lat) to the GPU. The GPU then projects every vertex in parallel.
4.  **Edge Bleeding:** A tiny sub-pixel "bleed" offset is applied to the tile bounds to ensure that tiles overlap perfectly at the edges, eliminating seams.

## Consequences
*   **Pixel Perfection:** Curvature is smooth and mathematically exact at all zoom levels, including the 3000x neighborhood view.
*   **Zero Artifacts:** By removing the `clip()` calls and diagonal triangle seams, the map is visually solid without any "leaking" background colors.
*   **Reliable Initialization:** Resolved the "empty map on startup" issue by using `preserveDrawingBuffer: true` and a strictly sequential async rendering loop. This ensures WebGL content is persisted while waiting for new tile images to load from the network.
*   **Performance:** Offloading the sines, cosines, and square roots to the GPU's vertex units significantly reduces the load on the RPi Zero's single CPU core.
*   **Consistency:** The `3D` mode now perfectly matches the orientation and movement directions of the `2D` and SVG layers.
