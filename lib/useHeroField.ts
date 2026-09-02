"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";

export const HERO_FIELD = "/images/ellefanning-hero-field.webp";

const BLOCKS_A = 64;
const BLOCKS_B = 40;
const WASH_A = 0.86;
const WASH_B = 0.93;
const CONTRAST = 1.12;
const PAPER: [number, number, number] = [0.976, 0.949, 0.957];
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
uniform float uWash;
uniform float uContrast;
uniform vec3 uPaper;
varying vec2 vUv;

void main() {
  vec2 grid = max(uCanvas / uCell, vec2(1.0));
  vec2 block = (floor(vUv * grid) + 0.5) / grid;

  float canvasRatio = uCanvas.x / uCanvas.y;
  vec2 uv = block;
  if (canvasRatio > uTexRatio) {
    uv.y = (uv.y - 0.5) * (uTexRatio / canvasRatio) + 0.5;
  } else {
    uv.x = (uv.x - 0.5) * (canvasRatio / uTexRatio) + 0.5;
  }

  vec3 color = texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb;
  color = clamp((color - 0.5) * uContrast + 0.5, 0.0, 1.0);
  gl_FragColor = vec4(mix(color, uPaper, uWash), 1.0);
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
    const uWash = gl.getUniformLocation(program, "uWash");

    gl.uniform1f(gl.getUniformLocation(program, "uContrast"), CONTRAST);
    gl.uniform3f(gl.getUniformLocation(program, "uPaper"), PAPER[0], PAPER[1], PAPER[2]);

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
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uCanvas, width, height);
      gl.uniform1f(uTexRatio, ratio);
      gl.uniform1f(uCell, width / (BLOCKS_A + (BLOCKS_B - BLOCKS_A) * p));
      gl.uniform1f(uWash, WASH_A + (WASH_B - WASH_A) * p);
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
