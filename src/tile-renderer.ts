/**
 * Utility for rendering map tiles within the azimuthal equidistant projection
 */

import * as d3 from 'd3';
import { CONFIG } from './config';
import type { Projection } from './projection';

export class TileRenderer {
  private tileUrls = {
    IMAGERY:
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    TOPOGRAPHIC:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    STREETS: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  constructor(
    private container: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
    private projection: Projection
  ) {}

  /**
   * Render tiles for the current projection state
   */
  async render(
    layer: 'TOPOGRAPHIC' | 'IMAGERY' | 'STREETS',
    warped = false
  ): Promise<void> {
    this.container.selectAll('*').remove();

    const center = this.projection.getCenter();
    const scale = this.projection.getScale();
    const tileUrlTemplate = this.tileUrls[layer];

    // Determine zoom level (z) based on scale
    const z = Math.max(
      0,
      Math.min(19, Math.floor(Math.log2(scale / CONFIG.TILE_SCALE_BASE)))
    );

    // Get tile coordinates for center
    const [tx, ty] = this.lonLatToTile(center.lon, center.lat, z);

    // Smart range calculation: how many tiles do we need to cover the circular viewport?
    const viewportRadiusPx = CONFIG.WIDTH * CONFIG.RADIUS_FACTOR;
    const tilesWide = Math.ceil((viewportRadiusPx * 2) / (CONFIG.TILE_SIZE_PX / 2));
    const range = Math.max(2, Math.ceil(tilesWide / 2));

    const subdivisions = warped ? CONFIG.TILE_WARPING_SUBDIVISIONS : 1;
    const n = 2 ** z;

    for (let x = tx - range; x <= tx + range; x++) {
      for (let y = ty - range; y <= ty + range; y++) {
        // Wrap X for world wrap
        const wrappedX = ((x % n) + n) % n;
        // Clamp Y to valid Mercator range
        if (y < 0 || y >= n) continue;

        const url = tileUrlTemplate
          .replace('{z}', z.toString())
          .replace('{x}', wrappedX.toString())
          .replace('{y}', y.toString());

        this.renderTile(wrappedX, y, z, url, subdivisions);
      }
    }
  }

  private renderTile(
    _x: number,
    _y: number,
    z: number,
    url: string,
    subdivisions: number
  ): void {
    const tileWidth = CONFIG.TILE_SIZE_PX;
    const step = 1 / subdivisions;

    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; j < subdivisions; j++) {
        // Project all 4 corners to find the actual bounding box on screen
        const p1 = this.projection.project(
          this.tileToLonLat(_x + i * step, _y + j * step, z)
        );
        const p2 = this.projection.project(
          this.tileToLonLat(_x + (i + 1) * step, _y + j * step, z)
        );
        const p3 = this.projection.project(
          this.tileToLonLat(_x + (i + 1) * step, _y + (j + 1) * step, z)
        );
        const p4 = this.projection.project(
          this.tileToLonLat(_x + i * step, _y + (j + 1) * step, z)
        );

        const minX = Math.min(p1[0], p2[0], p3[0], p4[0]);
        const minY = Math.min(p1[1], p2[1], p3[1], p4[1]);
        const maxX = Math.max(p1[0], p2[0], p3[0], p4[0]);
        const maxY = Math.max(p1[1], p2[1], p3[1], p4[1]);

        // Overlap to eliminate sub-pixel gaps
        const width = maxX - minX + CONFIG.TILE_OVERLAP_PX;
        const height = maxY - minY + CONFIG.TILE_OVERLAP_PX;

        if (subdivisions === 1) {
          this.container
            .append('image')
            .attr('href', url)
            .attr('x', minX)
            .attr('y', minY)
            .attr('width', width)
            .attr('height', height)
            .attr('preserveAspectRatio', 'none')
            .style('opacity', 1.0);
        } else {
          const g = this.container
            .append('svg')
            .attr('x', minX)
            .attr('y', minY)
            .attr('width', width)
            .attr('height', height)
            .attr(
              'viewBox',
              `${i * step * tileWidth} ${j * step * tileWidth} ${
                step * tileWidth
              } ${step * tileWidth}`
            )
            .attr('preserveAspectRatio', 'none');

          g.append('image')
            .attr('href', url)
            .attr('width', tileWidth)
            .attr('height', tileWidth)
            .attr('preserveAspectRatio', 'none');
        }
      }
    }
  }

  private lonLatToTile(lon: number, lat: number, z: number): [number, number] {
    const n = 2 ** z;
    const x = Math.floor(((lon + 180) / 360) * n);
    // Clamp latitude to avoid Mercator singularities at poles
    const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
    const latRad = (clampedLat * Math.PI) / 180;
    const y = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
    );
    return [x, y];
  }

  private tileToLonLat(x: number, y: number, z: number): [number, number] {
    const n = 2 ** z;
    const lon = (x / n) * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    const lat = (latRad * 180) / Math.PI;
    return [lon, lat];
  }
}
