/**
 * Utility for rendering map tiles within the azimuthal equidistant projection.
 * Supports 2D (Canvas Quad-Grid) and 3D (WebGL Pixel-Warp) modes.
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
  
  // WebGL Resources
  private program: WebGLProgram | null = null;

  constructor(
    private canvas2d: HTMLCanvasElement,
    private canvas3d: HTMLCanvasElement,
    private projection: Projection
  ) {
    this.ctx2d = canvas2d.getContext('2d', { alpha: false });
    this.initWebGL();
  }

  /**
   * Render tiles for the current projection state
   */
  async render(
    layer: 'TOPOGRAPHIC' | 'IMAGERY' | 'STREETS',
    mode: '2D' | '3D'
  ): Promise<void> {
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
  // 2D RENDERING (Canvas Quad Grid)
  // ========================================================================

  private async render2D(layer: 'TOPOGRAPHIC' | 'IMAGERY' | 'STREETS'): Promise<void> {
    if (!this.ctx2d) return;

    this.ctx2d.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx2d.fillStyle = '#0f172a';
    this.ctx2d.fillRect(0, 0, this.canvas2d.width, this.canvas2d.height);

    const center = this.projection.getCenter();
    const scale = this.projection.getScale();
    const tileUrlTemplate = this.tileUrls[layer];

    const baseZ = Math.floor(Math.log2(scale / CONFIG.TILE_SCALE_BASE));
    const z = Math.max(0, Math.min(19, baseZ - 1));

    const [fractionalTX, fractionalTY] = this.lonLatToTile(center.lon, center.lat, z);
    const tx = Math.floor(fractionalTX);
    const ty = Math.floor(fractionalTY);

    const range = 1; // 3x3 grid
    const subdivisions = 4; // Fast for 2D
    const n = 2 ** z;

    for (let x = tx - range; x <= tx + range; x++) {
      for (let y = ty - range; y <= ty + range; y++) {
        const wrappedX = ((x % n) + n) % n;
        if (y < 0 || y >= n) continue;

        const url = tileUrlTemplate
          .replace('{z}', z.toString())
          .replace('{x}', wrappedX.toString())
          .replace('{y}', y.toString());

        await this.renderTile2D(wrappedX, y, z, url, subdivisions);
      }
    }
  }

  private async renderTile2D(
    tx: number, ty: number, z: number, url: string, subdivisions: number
  ): Promise<void> {
    const img = await this.getTileImage(url);
    if (!img || !this.ctx2d) return;

    const step = 1 / subdivisions;
    const tileSize = CONFIG.TILE_SIZE_PX;

    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; j < subdivisions; j++) {
        const sx = i * step * tileSize;
        const sy = j * step * tileSize;
        const sSize = step * tileSize;

        const pNW = this.projection.project(this.tileToLonLat(tx + i * step, ty + j * step, z));
        const pSE = this.projection.project(this.tileToLonLat(tx + (i + 1) * step, ty + (j + 1) * step, z));

        this.ctx2d.drawImage(
          img,
          sx, sy, sSize, sSize,
          pNW[0], pNW[1], pSE[0] - pNW[0] + 1.1, pSE[1] - pNW[1] + 1.1
        );
      }
    }
  }

  // ========================================================================
  // 3D RENDERING (WebGL Pixel Warp)
  // ========================================================================

  private initWebGL(): void {
    this.gl = this.canvas3d.getContext('webgl', { 
      alpha: false, 
      antialias: true,
      preserveDrawingBuffer: true 
    });
    if (!this.gl) return;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = (a_position + 1.0) / 2.0;
      }
    `;

    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      uniform vec2 u_centerLonLat;
      uniform float u_scale;
      uniform vec2 u_tileOriginLonLat;
      uniform float u_tileSizeLonLat;

      const float PI = 3.141592653589793;

      void main() {
        // Screen coords 0 to 1
        vec2 uv = v_texCoord;
        
        // Offset to -0.5 to 0.5 and scale by viewport
        vec2 p = (uv - 0.5) * 600.0;
        
        float dist = length(p);
        float bearing = atan(p.x, -p.y);

        // Inverse Azimuthal Equidistant
        float rho = dist / u_scale;
        float lat = u_centerLonLat.y + rho * cos(bearing) * (180.0 / PI);
        float lon = u_centerLonLat.x + (rho * sin(bearing) / cos(u_centerLonLat.y * PI / 180.0)) * (180.0 / PI);

        // Map to Tile UV
        vec2 tileUV = (vec2(lon, lat) - u_tileOriginLonLat) / u_tileSizeLonLat;
        
        if (tileUV.x < 0.0 || tileUV.x > 1.0 || tileUV.y < 0.0 || tileUV.y > 1.0) {
          gl_FragColor = vec4(0.05, 0.09, 0.16, 1.0); // Ocean
        } else {
          gl_FragColor = texture2D(u_texture, vec2(tileUV.x, 1.0 - tileUV.y));
        }
      }
    `;

    this.program = this.createProgram(vsSource, fsSource);
  }

  private async render3D(layer: 'TOPOGRAPHIC' | 'IMAGERY' | 'STREETS'): Promise<void> {
    const gl = this.gl;
    if (!gl || !this.program) return;

    const center = this.projection.getCenter();
    const scale = this.projection.getScale();
    const tileUrlTemplate = this.tileUrls[layer];

    const baseZ = Math.floor(Math.log2(scale / CONFIG.TILE_SCALE_BASE));
    const z = Math.max(0, Math.min(19, baseZ - 1));

    const [fractionalTX, fractionalTY] = this.lonLatToTile(center.lon, center.lat, z);
    const tx = Math.floor(fractionalTX);
    const ty = Math.floor(fractionalTY);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.05, 0.09, 0.16, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Setup full-screen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    gl.uniform2f(gl.getUniformLocation(this.program, 'u_centerLonLat'), center.lon, center.lat);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_scale'), scale);

    // For simplicity in this reference version, we'll draw tiles one by one
    // In final Rust/WebGL we'll use a multi-texture shader
    const range = 1;
    for (let x = tx - range; x <= tx + range; x++) {
      for (let y = ty - range; y <= ty + range; y++) {
        const n = 2 ** z;
        const wrappedX = ((x % n) + n) % n;
        if (y < 0 || y >= n) continue;

        const url = tileUrlTemplate.replace('{z}', z.toString()).replace('{x}', wrappedX.toString()).replace('{y}', y.toString());
        const img = await this.getTileImage(url);
        if (!img) continue;

        const texture = this.createTexture(img);
        const [lon] = this.tileToLonLat(x, y, z);
        const [lonEnd, latEnd] = this.tileToLonLat(x + 1, y + 1, z);

        gl.uniform2f(gl.getUniformLocation(this.program, 'u_tileOriginLonLat'), lon, latEnd);
        gl.uniform1f(gl.getUniformLocation(this.program, 'u_tileSizeLonLat'), lonEnd - lon);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.deleteTexture(texture); // Cleanup for now to avoid memory leaks
      }
    }
  }

  // ========================================================================
  // UTILS
  // ========================================================================

  private createTexture(img: HTMLImageElement): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return tex;
  }

  private createProgram(vs: string, fs: string): WebGLProgram | null {
    const gl = this.gl;
    if (!gl) return null;
    const vShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vShader, vs);
    gl.compileShader(vShader);
    const fShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fShader, fs);
    gl.compileShader(fShader);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);
    return prog;
  }

  private async getTileImage(url: string): Promise<HTMLImageElement | null> {
    if (this.tileCache.has(url)) return this.tileCache.get(url)!;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => { this.tileCache.set(url, img); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  private lonLatToTile(lon: number, lat: number, z: number): [number, number] {
    const n = 2 ** z;
    const x = ((lon + 180) / 360) * n;
    const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
    const latRad = (clampedLat * Math.PI) / 180;
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
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
