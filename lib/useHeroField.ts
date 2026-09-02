"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";

export const HERO_FIELD = "/images/ellefanning-hero-field.webp";

const BLOCKS_A = 67;
const BLOCKS_B = 40;
const WASH_PAPER = 0.86;
const WASH_ROSE = 0.82;
const CONTRAST = 1.12;
const LINE_PX = 2;
const PAPER: [number, number, number] = [0.976, 0.949, 0.957];
const ROSE: [number, number, number] = [0.859, 0.478, 0.592];
const LINE_PAPER: [number, number, number] = [0.984, 0.969, 0.973];
const LINE_ROSE: [number, number, number] = [0.914, 0.627, 0.71];
const WASH_HOLD = 0.08;
const MAX_DPR = 2;

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uCanvas;
uniform float uTexRatio;
uniform float uCell;
uniform float uGap;
uniform float uContrast;
uniform float uWash;
uniform vec3 uTint;
uniform vec3 uLine;
varying vec2 vUv;

void main() {
  vec2 grid = max(uCanvas / uCell, vec2(1.0));
  vec2 scaled = vUv * grid;
  vec2 block = (floor(scaled) + 0.5) / grid;

  float canvasRatio = uCanvas.x / uCanvas.y;
  vec2 uv = block;
  if (canvasRatio > uTexRatio) {
    uv.y = (uv.y - 0.5) * (uTexRatio / canvasRatio) + 0.5;
  } else {
    uv.x = (uv.x - 0.5) * (canvasRatio / uTexRatio) + 0.5;
  }

  vec3 color = texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb;
  color = clamp((color - 0.5) * uContrast + 0.5, 0.0, 1.0);
  color = mix(color, uTint, uWash);

  vec2 edge = fract(scaled);
  float inside = min(step(uGap, edge.x), step(uGap, edge.y));
  gl_FragColor = vec4(mix(uLine, color, inside), 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function blend(a: [number, number, number], b: [number, number, number], k: number) {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

export function useHeroField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const paint = useRef<(() => void) | null>(null);
  const value = useRef(0);
  const ticket = useRef(0);

  const progress = useCallback((p: number) => {
    value.current = p;
    if (!paint.current || ticket.current) return;
    ticket.current = requestAnimationFrame(() => {
      ticket.current = 0;
      paint.current?.();
    });
  }, []);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;

    const gl = node.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });

    if (!gl) {
      setFailed(true);
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();

    if (!vertex || !fragment || !program) {
      setFailed(true);
      return;
    }

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uCanvas = gl.getUniformLocation(program, "uCanvas");
    const uTexRatio = gl.getUniformLocation(program, "uTexRatio");
    const uCell = gl.getUniformLocation(program, "uCell");
    const uGap = gl.getUniformLocation(program, "uGap");
    const uWash = gl.getUniformLocation(program, "uWash");
    const uTint = gl.getUniformLocation(program, "uTint");
    const uLine = gl.getUniformLocation(program, "uLine");

    gl.uniform1f(gl.getUniformLocation(program, "uContrast"), CONTRAST);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let ratio = 16 / 9;
    let ready = false;

    const draw = () => {
      if (!ready) return;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.max(Math.round(node.clientWidth * dpr), 1);
      const height = Math.max(Math.round(node.clientHeight * dpr), 1);

      if (node.width !== width || node.height !== height) {
        node.width = width;
        node.height = height;
      }

      const p = value.current;
      const ramp = Math.min(Math.max((p - WASH_HOLD) / (1 - WASH_HOLD), 0), 1);
      const wash = ramp * ramp * (3 - 2 * ramp);
      const cell = width / (BLOCKS_A + (BLOCKS_B - BLOCKS_A) * p);
      const tint = blend(PAPER, ROSE, wash);
      const line = blend(LINE_PAPER, LINE_ROSE, wash);

      gl.viewport(0, 0, width, height);
      gl.uniform2f(uCanvas, width, height);
      gl.uniform1f(uTexRatio, ratio);
      gl.uniform1f(uCell, cell);
      gl.uniform1f(uGap, ((1 - wash) * LINE_PX * dpr) / cell);
      gl.uniform1f(uWash, WASH_PAPER + (WASH_ROSE - WASH_PAPER) * wash);
      gl.uniform3f(uTint, tint[0], tint[1], tint[2]);
      gl.uniform3f(uLine, line[0], line[1], line[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    paint.current = draw;

    const image = new Image();
    image.decoding = "async";

    image.onload = () => {
      ratio = image.naturalWidth / image.naturalHeight;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      ready = true;
      node.dataset.ready = "";
      draw();
    };

    image.onerror = () => setFailed(true);
    image.src = asset(HERO_FIELD);

    const observer = new ResizeObserver(draw);
    observer.observe(node);

    return () => {
      cancelAnimationFrame(ticket.current);
      ticket.current = 0;
      paint.current = null;
      observer.disconnect();
      image.onload = null;
      image.onerror = null;
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return { canvas, progress, failed };
}
