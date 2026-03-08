# Configuration Reference

The Solunar Globe Clock is configured via a centralized `src/config.ts` file. This allows for tuning performance, aesthetics, and default behavior without modifying core logic.

## Coordinate Systems

| Constant | Type | Description |
| :--- | :--- | :--- |
| `INTERNAL_WIDTH` | `number` | The width of the virtual canvas (600px). |
| `INTERNAL_HEIGHT` | `number` | The height of the virtual canvas (600px). |
| `INTERNAL_CENTER_X`| `number` | The horizontal center point (300px). |
| `INTERNAL_CENTER_Y`| `number` | The vertical center point (300px). |

## Performance

| Constant | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `UPDATE_INTERVAL_MS` | `Milliseconds` | `1000` | HUD and clock hands update frequency. |
| `TILE_FETCH_RANGE` | `number` | `3` | Number of tiles to fetch in each direction from center (Range 3 = 7x7 grid). |
| `TILE_SUBDIVISIONS_2D` | `number` | `4` | Subdivision level for 2D quad warping. Higher = smoother but slower. |
| `TILE_SUBDIVISIONS_3D` | `number` | `8` | Subdivision level for WebGL vertex warping. |

## Aesthetics

### Global
| Constant | Default | Description |
| :--- | :--- | :--- |
| `RADIUS_FACTOR` | `0.40` | Globe radius as percentage of viewport. |
| `HAND_LENGTH_FACTOR`| `0.9` | Percentage of radius for sun/moon arms. |
| `RIM_WIDTH` | `8` | Width of the outer globe rim. |
| `LABEL_SPACING` | `35` | Pixel distance for compass labels (N, S, E, W). |
| `ARM_WIDTH` | `2` | Stroke width for sun/moon connector arms. |

### Sun
| Constant | Default | Description |
| :--- | :--- | :--- |
| `SUN_COLOR_PRIMARY` | `#fbbf24` | Core sun color. |
| `SUN_RADIUS` | `10` | Radius of the sun circle. |
| `SUN_RAY_COUNT` | `8` | Number of solar rays. |
| `SUN_STROKE_WIDTH` | `2` | Stroke width for sun and rays. |

### Moon
| Constant | Default | Description |
| :--- | :--- | :--- |
| `MOON_COLOR_PRIMARY`| `#f1f5f9` | Moon surface color. |
| `MOON_PATH` | `SVG Path` | Path data for the crescent shape. |
| `MOON_STROKE_WIDTH` | `1` | Stroke width for the moon icon. |

## User Defaults

| Constant | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `DEFAULT_LOCATION` | `Object` | London | Initial coordinates if no home is saved. |
| `DEFAULT_SCALING_FACTOR`| `number` | `30000` | Default zoom level (~neighborhood level). |
| `DEFAULT_TIME_SPEED` | `TimeMultiplier`| `1.0` | Initial time simulation speed. |

## UI & Interaction

| Constant | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `SEARCH_DEBOUNCE_MS` | `Milliseconds` | `300` | Delay before triggering Nominatim search. |
| `KEYBOARD_ZOOM_FACTOR` | `number` | `1.1` | Zoom multiplier for `+` and `-` keys. |
| `SHIFT_MULTIPLIER` | `number` | `10` | Panning speed multiplier when holding Shift. |
| `HOME_TOLERANCE` | `Degrees` | `0.0001` | Accuracy required to consider location "At Home". |
