# Configuration Reference

The Solunar Globe Clock is configured via a centralized `src/config.ts` file. Constants are grouped into namespaces to improve maintainability and subsystem decoupling.

## `ENGINE`
Core technical constants defining the internal coordinate system and fundamental logic.

| Constant | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `INTERNAL_WIDTH` | `number` | `600` | virtual canvas width. |
| `INTERNAL_HEIGHT` | `number` | `600` | virtual canvas height. |
| `INTERNAL_CENTER_X`| `number` | `300` | Horizontal center point. |
| `INTERNAL_CENTER_Y`| `number` | `300` | Vertical center point. |
| `MAX_LATITUDE` | `number` | `85.0511`| Web Mercator limit. |
| `HOME_TOLERANCE` | `number` | `0.0001` | Degree tolerance for "At Home" check. |

## `DISPLAY`
Visual scaling, zoom limits, and HUD display behavior.

| Constant | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `RADIUS_FACTOR` | `number` | `0.4` | Globe radius as % of width. |
| `DEFAULT_SCALING_FACTOR`| `number` | `30000` | Initial zoom level. |
| `MIN_SCALING_FACTOR` | `number` | `5` | Minimum zoom level. |
| `MAX_SCALING_FACTOR` | `number` | `1000000`| Maximum zoom level. |
| `ZOOM_DISPLAY_MULTIPLIER`| `number` | `10` | Divisor for "X.X x" HUD text. |

## `AESTHETICS`
Colors, stroke widths, and shape definitions.

### `GLOBAL`
| Constant | Default | Description |
| :--- | :--- | :--- |
| `LABEL_SPACING` | `35` | Pixel distance for compass labels. |
| `RIM_WIDTH` | `8` | Width of the outer globe rim. |
| `ARM_WIDTH` | `2` | Stroke width for sun/moon arms. |

### `SUN` & `MOON`
Individual parameters for celestial icons, including `PRIMARY_COLOR`, `RAY_COUNT`, and `PATH` (moon crescent).

## `PERFORMANCE`
Timing and rendering complexity settings.

| Constant | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `UPDATE_INTERVAL_MS`| `Milliseconds`| `1000` | Hand/Time refresh rate. |
| `TILE_FETCH_RANGE` | `number` | `3` | Grid size for map tiles. |
| `TILE_SUBDIVISIONS_3D`| `number` | `8` | WebGL vertex resolution. |

## `INTERACTION`
Input handling for Keyboard, Touch, and Search.

| Constant | Namespace | Default | Description |
| :--- | :--- | :--- | :--- |
| `ZOOM_FACTOR` | `KEYBOARD` | `1.1` | Step size for zoom keys. |
| `WHEEL_ZOOM_FACTOR`| `TOUCH` | `1.1` | Step size for mouse wheel. |
| `DEBOUNCE_MS` | `SEARCH` | `300` | Nominatim API throttle. |
| `NOMINATIM_URL` | `SEARCH` | `...` | Geocoding service endpoint. |

## `SIMULATION`
Time simulation defaults and limits.

| Constant | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `DEFAULT_TIME_SPEED`| `TimeMultiplier`| `1.0` | Real-time by default. |
| `MAX_TIME_RATIO` | `number` | `1000000`| Max acceleration limit. |

## `THEME`
CSS-linked and WebGL-specific color variables.
