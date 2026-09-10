"use client";

const MAX_DPR = 1.5;

const VERTEX = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// Shared preamble: every seam gets the same value noise and fbm, so the two
// effects read as the same material even though the motion differs.
export const NOISE = `
precision mediump float;

uniform vec2 uRes;
uniform float uTime;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i += 1) {
    sum += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return sum;
}
`;

export type Seam = {
  set(name: string, value: number | readonly number[]): void;
  frame(now: number): void;
  resize(): void;
  dispose(): void;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // A shader that fails here fails silently everywhere else, so it says so.
    console.warn("seam shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createSeam(
  canvas: HTMLCanvasElement,
  fragment: string,
): Seam | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const frag = compile(gl, gl.FRAGMENT_SHADER, NOISE + fragment);
  const program = gl.createProgram();

  if (!vertex || !frag || !program) return null;

  gl.attachShader(program, vertex);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("seam program:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const spots = new Map<string, WebGLUniformLocation | null>();

  function at(name: string) {
    if (!spots.has(name)) spots.set(name, gl!.getUniformLocation(program!, name));
    return spots.get(name) ?? null;
  }

  function set(name: string, value: number | readonly number[]) {
    const spot = at(name);
    if (!spot) return;
    if (typeof value === "number") gl!.uniform1f(spot, value);
    else if (value.length === 2) gl!.uniform2f(spot, value[0], value[1]);
    else if (value.length === 3) gl!.uniform3f(spot, value[0], value[1], value[2]);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const width = Math.max(Math.round(canvas.clientWidth * dpr), 1);
    const height = Math.max(Math.round(canvas.clientHeight * dpr), 1);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl!.viewport(0, 0, width, height);
    set("uRes", [width, height]);
  }

  function frame(now: number) {
    resize();
    set("uTime", now / 1000);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function dispose() {
    gl!.deleteBuffer(buffer);
    gl!.deleteProgram(program);
    gl!.deleteShader(vertex!);
    gl!.deleteShader(frag!);
  }

  resize();

  return { set, frame, resize, dispose };
}
