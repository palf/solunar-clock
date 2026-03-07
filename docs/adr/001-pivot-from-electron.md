# ADR 001: Pivot from Electron to Browser Kiosk for RPi Zero

## Status
Accepted

## Context
The goal of the Solunar Globe Clock is to run on a 5-inch (480x800) display powered by a Raspberry Pi Zero (v1/W). The initial prototype used Electron for a standalone application experience.

### Challenges with Electron
- **CPU Constraints:** Electron is based on Chromium and requires significant CPU overhead. The RPi Zero's single-core ARMv6 (700-1000 MHz) is heavily bottlenecked by Electron's main and renderer processes.
- **RAM Constraints:** Electron typically consumes 100-200MB of RAM at idle. The RPi Zero only has 512MB, making Electron likely to cause swapping and system instability.
- **Boot Time:** Startup times for Electron apps on RPi Zero are prohibitively long (often 60+ seconds).

## Decision
We will pivot away from Electron and use a standard, lightweight browser in kiosk mode (Chromium or WPE WebKit). The application will be served from a lightweight web server or built as a static site.

## Consequences
- **Improved Performance:** Browser kiosk mode (especially with `matchbox-window-manager`) has significantly lower overhead.
- **Faster Startup:** Launching Chromium directly into kiosk mode is faster than initializing the Electron framework.
- **Simplified Deployment:** We can leverage standard Pi-specific kiosk configurations and avoid Electron-specific binary compatibility issues on ARMv6.
- **Development Consistency:** The codebase remains pure D3/TypeScript, which is compatible with both development browsers and the production kiosk setup.

## Technical Optimizations for RPi Zero
- Map redraws are decoupled from hand updates.
- HUD/Hand updates are throttled to 1Hz (1 second).
- Fixed-resolution SVG viewBox (600x600) to ensure predictable coordinate mapping.
