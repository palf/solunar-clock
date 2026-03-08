# Solunar Globe Clock

A high-performance, minimalist globe clock showing real-time sun and moon positions using an azimuthal equidistant projection. Optimized for small, low-power displays like the Raspberry Pi Zero with a 5-inch (480x800) screen.

## Features

- **Real-time Tracking:** Precise calculation of sun and moon geographic positions.
- **Dynamic Projection:** Azimuthal equidistant projection centered on your current location.
- **Dual Render Engine:** 
  - **3D Mode (WebGL):** Pixel-perfect per-pixel warping using GLSL shaders. Recommended for primary use.
  - **2D Mode (Canvas):** High-efficiency quad-grid rendering. Ideal for saving power or low-memory situations.
- **Fixed Location Optimized:** Designed for 24/7 operation at a neighborhood level (default 3000x zoom).
- **HUD Interface:** Minimalist Heads-Up Display for time, position, and scale info.

## Keyboard Commands

- **`+` / `=`**: Zoom In (1.1x)
- **`-` / `_`**: Zoom Out (0.9x)
- **Arrow Keys**: Pan Map (Up/Down for Latitude, Left/Right for Longitude)
- **`Shift + Up/Down`**: Fast Zoom In/Out
- **`0`**: Reset to London (Default Location)
- **`h`**: Reset to Home (Winchester)
- **`/` or `s`**: Open Location Search
- **`l`**: Toggle Map Layers (TOPOGRAPHIC, IMAGERY, STREETS)
- **`Escape`**: Close Search or Blur Input

## Development

This project uses `pnpm` and `just` as a task runner.

```bash
# Install dependencies
pnpm install

# Start the development server
just dev

# Run tests
pnpm test

# Run type-check
pnpm type-check
```

## Deployment on Raspberry Pi Zero

**Note:** Chromium in kiosk mode is the recommended browser environment. Ensure the GL Driver (KMS or FKMS) is enabled in `raspi-config` to support WebGL hardware acceleration.

### Recommended Kiosk Setup
Use Chromium in kiosk mode with a lightweight window manager (e.g., `matchbox-window-manager`).

1. **Install Dependencies:**
   ```bash
   sudo apt-get install chromium-browser matchbox-window-manager x11-xserver-utils
   ```

2. **Launch Script (`kiosk.sh`):**
   ```bash
   #!/bin/bash
   xset -dpms
   xset s off
   xset s noblank
   matchbox-window-manager -use_titlebar no &
   # Ensure WebGL is forced on for VideoCore IV
   chromium-browser --display=:0 --kiosk --incognito --ignore-gpu-blacklist --enable-webgl --window-position=0,0 --window-size=480,800 http://localhost:3000
   ```

## Performance Optimizations

- **WebGL Math:** Projection math is offloaded to the GPU using GLSL fragment shaders, freeing the single-core CPU for other tasks.
- **Adaptive Tiling:** Standardizes on a 7x7 grid to provide a movement buffer while maintaining high resolution at 3000x zoom.
- **Double Buffering:** Prevents map "blanking" or flickering during state updates.
- **Throttled Updates:** Clock hands and HUD are updated at a 1-second interval to preserve CPU cycles on low-power hardware.

## Future Roadmap

As documented in **ADR 003**, the current TypeScript implementation serves as a reference engine. The final production version will be pivoted to **Rust**, targeting a standalone binary that talks directly to the DRM/KMS framebuffer, eliminating browser and X-server overhead entirely.
