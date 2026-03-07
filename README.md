# Solunar Globe Clock

A high-performance, minimalist globe clock showing real-time sun and moon positions using an azimuthal equidistant projection. Optimized for small, low-power displays like the Raspberry Pi Zero with a 5-inch (480x800) screen.

## Features

- **Real-time Tracking:** Precise calculation of sun and moon geographic positions.
- **Dynamic Projection:** Azimuthal equidistant projection centered on your current location.
- **Keyboard Navigable:** Full control via keyboard for panning, zooming, and searching.
- **RPi Zero Optimized:** Decoupled rendering logic to minimize CPU usage on single-core hardware.
- **HUD Interface:** Minimalist Heads-Up Display for time, position, and scale info.

## Keyboard Commands

- **`+` / `=`**: Zoom In
- **`-` / `_`**: Zoom Out
- **`Arrow Keys`**: Pan Map (Up/Down for Latitude, Left/Right for Longitude)
- **`Shift + Up/Down`**: Zoom In/Out
- **`0`**: Reset to London (Default Location)
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
```

## Deployment on Raspberry Pi Zero

**Note:** Do not use Electron on the RPi Zero. It is too resource-intensive for the ARMv6 single-core CPU and 512MB RAM.

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
   chromium-browser --display=:0 --kiosk --incognito --window-position=0,0 --window-size=480,800 http://localhost:8888
   ```

## Performance Optimizations

- **Decoupled Rendering:** The world map (expensive to draw) is only re-rendered when the center position or zoom level changes.
- **Throttled Updates:** Clock hands and HUD are updated at a 1-second interval to preserve CPU cycles on low-power devices.
- **Minimalist CSS:** Uses hardware-accelerated transforms and avoids heavy filter effects where possible.
