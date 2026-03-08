# Solunar Globe Clock

A high-performance, minimalist globe clock showing real-time sun and moon positions using an azimuthal equidistant projection. Optimized for small, low-power displays like the Raspberry Pi Zero with a 5-inch (480x800) screen.

## Features

- **Verified Astronomical Model:** High-accuracy calculation of sun and moon geographic positions, strictly following the *Astronomical Almanac* (AA page D22) low-precision series.
- **Robust Unit Safety:** Built with a "branded types" system to prevent coordinate system or unit confusion (e.g., mixing Degrees and Radians).
- **Dynamic Projection:** Azimuthal equidistant projection centered on your current location.
- **Dual Render Engine:** 
  - **3D Mode (WebGL):** Pixel-perfect vertex-warping using GLSL shaders. Recommended for primary use.
  - **2D Mode (Canvas):** High-efficiency quad-grid rendering fallback.
- **HUD Interface:** Minimalist Heads-Up Display for time, position, and scale info.

## Keyboard Commands

- **`+` / `=`**: Zoom In
- **`-` / `_`**: Zoom Out
- **Arrow Keys**: Pan Map
- **`Shift + Up/Down`**: Fast Zoom In/Out
- **`0`**: Reset to Default Location
- **`h`**: Stored Home Action (Set Home / Go Home / Clear Home)
- **`/` or `s`**: Open Location Search
- **`l`**: Cycle Map Layers (STREETS, TOPOGRAPHIC, IMAGERY)
- **`m`**: Toggle Render Mode (2D/3D)
- **`z`**: Open Manual Zoom Input
- **`?`**: Toggle Help Overlay

## Development

This project uses `pnpm` and `just` as a task runner.

```bash
# Install dependencies
pnpm install

# Start the development server
just dev

# Run all tests (including accuracy audits)
just test

# Run type-check (strict mode)
just type-check
```

### Technical Integrity
- **Unit Safety:** All coordinates (`Longitude`, `Latitude`) and units (`Degrees`, `Radians`, `Milliseconds`) use branded types with smart constructors.
- **Accuracy Audits:** The project includes a dedicated `astronomy-accuracy.test.ts` that verifies celestial positions against verified ground truth (*Astropixels* / *Stellarium*).

## Configuration

The application is highly tunable via `src/config.ts`. See [docs/CONFIG.md](./docs/CONFIG.md) for a full reference of available constants and their impact on performance/aesthetics.

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

## Future Roadmap

As documented in **ADR 003**, the current TypeScript implementation serves as a reference engine. The final production version will be pivoted to **Rust**, targeting a standalone binary that talks directly to the DRM/KMS framebuffer, eliminating browser and X-server overhead entirely.
