/**
 * Utility for rendering map tiles within the azimuthal equidistant projection.
 * Supports 2D (Canvas Quad-Grid) and 3D (WebGL Vertex-Warp) modes.
 */

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

  private ctx2d: CanvasRenderingContext2D | null;
  private gl: WebGLRenderingContext | null = null;
  private tileCache = new Map<string, HTMLImageElement>();

  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;

  // Double buffering for 2D to stop flickering
  private backCanvas = document.createElement('canvas');
  private backCtx = this.backCanvas.getContext('2d', { alpha: false });

  constructor(
    private canvas2d: HTMLCanvasElement,
    private canvas3d: HTMLCanvasElement,
    private projection: Projection
  ) {
    this.ctx2d = canvas2d.getContext('2d', { alpha: false });
    this.backCanvas.width = CONFIG.WIDTH;
    this.backCanvas.height = CONFIG.HEIGHT;
    this.initWebGL();
  }

  async render(layer: 'TOPOGRAPHIC' | 'IMAGERY' | 'STREETS', mode: '2D' | '3D'): Promise<void> {
    if (mode === '3D' && this.gl) {
      this.canvas2d.style.display = 'none';
      this.canvas3d.style.display = 'block';
      await this.render3D(layer);
    } else {
      this.canvas3d.style.display = 'none';
      this.canvas2d.style.display = 'block';
      await this.render2D(layer);
    }
  }

  // ========================================================================
  // 2D RENDERING
  // ========================================================================

  private async render2D(layer: 'TOPOGRAPHIC' | 'IMAGERY' | 'STREETS'): Promise<void> {
    if (!this.ctx2d || !this.backCtx) return;

    // Clear back buffer
    this.backCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.backCtx.fillStyle = '#0f172a';
    this.backCtx.fillRect(0, 0, this.backCanvas.width, this.backCanvas.height);

    const center = this.projection.getCenter();
    const scale = this.projection.getScale();
    const baseZ = Math.floor(Math.log2(scale / CONFIG.TILE_SCALE_BASE));
    const z = Math.max(0, Math.min(19, baseZ - 1));

    const [fTX, fTY] = this.lonLatToTile(center.lon, center.lat, z);
    const tx = Math.floor(fTX);
    const ty = Math.floor(fTY);

    const range = CONFIG.TILE_FETCH_RANGE;
    const n = 2 ** z;

    // Fetch and draw all quads to back buffer
    const tiles: Promise<void>[] = [];
    for (let x = tx - range; x <= tx + range; x++) {
      for (let y = ty - range; y <= ty + range; y++) {
        const wx = ((x % n) + n) % n;
        if (y < 0 || y >= n) continue;
        const url = this.tileUrls[layer]
          .replace('{z}', z.toString())
          .replace('{x}', wx.toString())
          .replace('{y}', y.toString());
        tiles.push(
          this.getTileImage(url).then((img) => {
            if (img) this.renderTile2D(wx, y, z, img);
          })
        );
      }
    }

    await Promise.all(tiles);

    // Atomic Swap
    this.ctx2d.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx2d.drawImage(this.backCanvas, 0, 0);
  }

  private renderTile2D(tx: number, ty: number, z: number, img: HTMLImageElement): void {
    const subdivisions = 4;
    const step = 1 / subdivisions;
    const tileSize = CONFIG.TILE_SIZE_PX;
    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; j < subdivisions; j++) {
        const pNW = this.projection.project(this.tileToLonLat(tx + i * step, ty + j * step, z));
        const pSE = this.projection.project(
          this.tileToLonLat(tx + (i + 1) * step, ty + (j + 1) * step, z)
        );
        this.backCtx!.drawImage(
          img,
          i * step * tileSize,
          j * step * tileSize,
          step * tileSize,
          step * tileSize,
          pNW[0],
          pNW[1],
          pSE[0] - pNW[0] + 1.1,
          pSE[1] - pNW[1] + 1.1
        );
      }
    }
  }

  // ========================================================================
  // 3D RENDERING
  // ========================================================================

  private initWebGL(): void {
    this.gl = this.canvas3d.getContext('webgl', {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    if (!this.gl) return;

    const vs = `
      precision highp float;
      attribute vec2 a_lonlat;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      uniform vec2 u_centerLonLat;
      uniform float u_scale;
      const float PI = 3.141592653589793;
      const float RAD = PI / 180.0;
      void main() {
        v_uv = a_uv;
        float lat = a_lonlat.y * RAD;
        float lon = a_lonlat.x * RAD;
        float lat0 = u_centerLonLat.y * RAD;
        float lon0 = u_centerLonLat.x * RAD;
        float dLon = lon - lon0;
        float cosC = sin(lat0) * sin(lat) + cos(lat0) * cos(lat) * cos(dLon);
        cosC = clamp(cosC, -1.0, 1.0);
        float c = acos(cosC);
        float k = 1.0;
        if (abs(c) > 0.0001) k = c / sin(c);
        float x = u_scale * k * cos(lat) * sin(dLon);
        float y = u_scale * k * (cos(lat0) * sin(lat) - sin(lat0) * cos(lat) * cos(dLon));
        gl_Position = vec4(x / 300.0, y / 300.0, 0, 1);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      void main() {
        gl_FragColor = texture2D(u_tex, v_uv);
      }
    `;

    this.program = this.createProgram(vs, fs);
    this.vertexBuffer = this.gl.createBuffer();
  }

  private async render3D(layer: 'TOPOGRAPHIC' | 'IMAGERY' | 'STREETS'): Promise<void> {
    const gl = this.gl;
    if (!gl || !this.program) return;

    const center = this.projection.getCenter();
    const scale = this.projection.getScale();
    const baseZ = Math.floor(Math.log2(scale / CONFIG.TILE_SCALE_BASE));
    const z = Math.max(0, Math.min(19, baseZ - 1));

    const [fTX, fTY] = this.lonLatToTile(center.lon, center.lat, z);
    const tx = Math.floor(fTX);
    const ty = Math.floor(fTY);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // WebGL Double Buffering Strategy:
    // We clear ONLY once we know we are about to draw the new set
    gl.clearColor(0.05, 0.09, 0.16, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniform2f(gl.getUniformLocation(this.program, 'u_centerLonLat'), center.lon, center.lat);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_scale'), scale);

    const range = CONFIG.TILE_FETCH_RANGE;
    const n = 2 ** z;

    // Use sequential await to prevent CPU saturation on RPi
    for (let x = tx - range; x <= tx + range; x++) {
      for (let y = ty - range; y <= ty + range; y++) {
        const wx = ((x % n) + n) % n;
        if (y < 0 || y >= n) continue;
        const url = this.tileUrls[layer]
          .replace('{z}', z.toString())
          .replace('{x}', wx.toString())
          .replace('{y}', y.toString());
        const img = await this.getTileImage(url);
        if (img) this.drawTile3D(wx, y, z, img);
      }
    }
  }

  private drawTile3D(tx: number, ty: number, z: number, img: HTMLImageElement): void {
    const gl = this.gl!;
    const subdivisions = 8;
    const step = 1 / subdivisions;
    const vertices: number[] = [];

    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; j < subdivisions; j++) {
        const coords = [
          [i, j],
          [i + 1, j],
          [i, j + 1],
          [i, j + 1],
          [i + 1, j],
          [i + 1, j + 1],
        ];
        for (const [si, sj] of coords) {
          const [lon, lat] = this.tileToLonLat(tx + si * step, ty + sj * step, z);
          vertices.push(lon, lat, si * step, sj * step);
        }
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    const aLonLat = gl.getAttribLocation(this.program!, 'a_lonlat');
    const aUV = gl.getAttribLocation(this.program!, 'a_uv');
    gl.enableVertexAttribArray(aLonLat);
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aLonLat, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8);

    const tex = this.createTexture(img);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4);
    gl.deleteTexture(tex);
  }

  private createTexture(img: HTMLImageElement): WebGLTexture | null {
    const gl = this.gl!;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return tex;
  }

  private createProgram(vsSrc: string, fsSrc: string): WebGLProgram | null {
    const gl = this.gl!;
    const v = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(v, vsSrc);
    gl.compileShader(v);
    const f = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(f, fsSrc);
    gl.compileShader(f);
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    return p;
  }

  private async getTileImage(url: string): Promise<HTMLImageElement | null> {
    if (this.tileCache.has(url)) return this.tileCache.get(url)!;
    return new Promise((r) => {
      const i = new Image();
      i.crossOrigin = 'Anonymous';
      i.onload = () => {
        this.tileCache.set(url, i);
        r(i);
      };
      i.onerror = () => r(null);
      i.src = url;
    });
  }

  private lonLatToTile(lon: number, lat: number, z: number): [number, number] {
    const n = 2 ** z;
    const x = ((lon + 180) / 360) * n;
    const c = Math.max(-85.0511, Math.min(85.0511, lat));
    const r = (c * Math.PI) / 180;
    const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
    return [x, y];
  }

  private tileToLonLat(x: number, y: number, z: number): [number, number] {
    const n = 2 ** z;
    const lon = (x / n) * 360 - 180;
    const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
    return [lon, lat];
  }
}
