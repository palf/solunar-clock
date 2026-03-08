# ADR 003: WebGL Reference Implementation and Future Rust Pivot

## Status
Proposed

## Context
The current Canvas 2D "WARP" mode uses a 16x16 CPU-based quad grid to approximate the azimuthal equidistant projection. While functional, it suffers from sub-pixel anti-aliasing artifacts (diagonal lines) and high CPU overhead on the Raspberry Pi Zero's single-core ARMv11 processor.

Additionally, browser overhead (Chromium) on the Pi Zero is significant (~200MB RAM), limiting the long-term stability of the device.

## Decision
1.  **Reference Implementation:** We will implement a WebGL 1.0 (OpenGL ES 2.0 compatible) renderer named `3D`. 
    *   This will replace the manual `WARP` logic with a fragment shader that calculates the inverse projection per-pixel.
    *   The current `BOX` mode will be renamed to `2D` and kept as a low-power fallback.
2.  **Language Pivot:** After the WebGL implementation is verified and deployed to AWS, we will pivot the codebase to **Rust** using a standalone graphics library (e.g., `macroquad` or `raylib-rs`).
    *   The GLSL shaders written for the WebGL version will be reused directly in the Rust binary.

## Consequences
*   **Visual Quality:** `3D` mode will be pixel-perfect with zero diagonal artifacts or seams.
*   **Performance:** Offloading math to the GPU frees the CPU for HUD updates and networking.
*   **Binary Strategy:** The transition to Rust will eliminate the need for Chromium, X-Server, and a Window Manager on the RPi Zero, reducing RAM usage by >80% and improving boot times.
*   **Portability:** The browser version remains available for web-based previews and AWS deployment.
