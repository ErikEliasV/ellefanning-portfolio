import * as THREE from "three";

const BLOCKS_A = 67;
const BLOCKS_B = 40;
const WASH_PAPER = 0.86;
const WASH_ROSE = 0.82;
const CONTRAST = 1.12;
const LINE_PX = 2;
const PAPER = new THREE.Color(0.976, 0.949, 0.957);
const ROSE = new THREE.Color(0.859, 0.478, 0.592);
const LINE_PAPER = new THREE.Color(0.984, 0.969, 0.973);
const LINE_ROSE = new THREE.Color(0.914, 0.627, 0.71);
const WASH_HOLD = 0.08;
const MAX_DPR = 2;
const MAX_ROWS = 220;

const WAVE_AMP = 0.019;
const WAVE_FREQ = 6.4;
const WAVE_SKEW = 3.1;
const WAVE_SPEED = 0.5;
const POINTER_R2 = 0.09;
const POINTER_AMP = 0.055;
const POINTER_RIPPLE = 3.4;
const POINTER_REVEAL = 0.62;
const POINTER_EASE = 0.09;
const POINTER_LIFT = 0.35;
const DEPTH = 0.55;
const DOLLY = 0.18;
const SWAY_X = 0.12;
const SWAY_Y = 0.08;
const FOV = 50;
const MAX_GAP = 0.24;

const glsl = (n: number) => n.toFixed(5);

const VERTEX = `
uniform sampler2D uTex;
uniform vec2 uGrid;
uniform float uTexRatio;
uniform float uAspect;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerA;
uniform float uPointPx;
attribute vec2 aCell;
varying vec3 vColor;
varying float vHalo;

void main() {
  vec2 block = (floor(aCell * uGrid) + 0.5) / uGrid;

  vec2 uv = block;
  if (uAspect > uTexRatio) {
    uv.y = (uv.y - 0.5) * (uTexRatio / uAspect) + 0.5;
  } else {
    uv.x = (uv.x - 0.5) * (uAspect / uTexRatio) + 0.5;
  }

  vec3 tex = texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb;
  float lum = dot(tex, vec3(0.2126, 0.7152, 0.0722));

  vec2 spread = vec2(block.x * uAspect, block.y) - vec2(uPointer.x * uAspect, uPointer.y);
  float halo = exp(-dot(spread, spread) / ${glsl(POINTER_R2)}) * uPointerA;

  float phase = block.x * ${glsl(WAVE_FREQ)} + block.y * ${glsl(WAVE_SKEW)} + uTime;
  float wave = sin(phase - halo * ${glsl(POINTER_RIPPLE)});
  float lift = wave * (${glsl(WAVE_AMP)} + halo * ${glsl(POINTER_AMP)});

  vec3 pos = vec3(
    (block.x - 0.5) * 2.0 * uAspect,
    (block.y - 0.5) * 2.0 + lift * 2.0,
    (lum - 0.5) * ${glsl(DEPTH)} + halo * ${glsl(POINTER_LIFT)}
  );

  vColor = tex;
  vHalo = halo;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uPointPx / max(-mv.z, 0.001);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = `
precision mediump float;
uniform float uWash;
uniform vec3 uTint;
uniform float uGap;
varying vec3 vColor;
varying float vHalo;

void main() {
  vec2 edge = abs(gl_PointCoord - 0.5);
  if (max(edge.x, edge.y) > 0.5 - uGap) discard;

  vec3 color = clamp((vColor - 0.5) * ${glsl(CONTRAST)} + 0.5, 0.0, 1.0);
  color = mix(color, uTint, uWash * (1.0 - vHalo * ${glsl(POINTER_REVEAL)}));
  gl_FragColor = vec4(color, 1.0);
}
`;

export type CloudOptions = {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  onBlock?: (col: number, row: number, x: number) => void;
};

export type Cloud = {
  setProgress(p: number): void;
  setPointer(x: number, y: number, active: boolean): void;
  frame(step: number): void;
  resize(): void;
  dispose(): void;
};

export function createCloud({ canvas, image, onBlock }: CloudOptions): Cloud | null {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    powerPreference: "low-power",
  });

  // The depth of every point is read from the photo in the vertex shader, so a
  // driver without vertex texture units has nothing to render.
  const gl = renderer.getContext();
  if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1) {
    renderer.dispose();
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const fit = 1 / Math.tan((FOV / 2) * (Math.PI / 180));
  camera.position.z = fit;

  const texture = new THREE.Texture(image);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  const ratio = image.naturalWidth / image.naturalHeight || 16 / 9;

  const uniforms = {
    uTex: { value: texture },
    uGrid: { value: new THREE.Vector2(BLOCKS_A, BLOCKS_A) },
    uTexRatio: { value: ratio },
    uAspect: { value: 1 },
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uPointerA: { value: 0 },
    uPointPx: { value: 1 },
    uWash: { value: WASH_PAPER },
    uTint: { value: PAPER.clone() },
    uGap: { value: 0.08 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
  });

  let geometry = new THREE.BufferGeometry();
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const line = LINE_PAPER.clone();
  renderer.setClearColor(line, 1);

  let progress = 0;
  let clock = 0;
  let cols = BLOCKS_A;
  let rows = 0;
  let gridRows = BLOCKS_A;
  let atCol = -1;
  let atRow = -1;

  let aimX = 0.5;
  let aimY = 0.5;
  let aimA = 0;
  let atX = 0.5;
  let atY = 0.5;
  let atA = 0;

  function build(gridCols: number, count: number) {
    const cells = new Float32Array(gridCols * count * 2);
    let at = 0;
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < gridCols; col += 1) {
        cells[at] = (col + 0.5) / gridCols;
        cells[at + 1] = (row + 0.5) / count;
        at += 2;
      }
    }
    geometry.dispose();
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute("aCell", new THREE.BufferAttribute(cells, 2));
    points.geometry = geometry;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    const aspect = width / height;

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = aspect;

    const next = Math.min(Math.max(Math.ceil(BLOCKS_A / aspect), 1), MAX_ROWS);
    if (next !== rows) {
      rows = next;
      build(BLOCKS_A, rows);
    }
  }

  function setProgress(p: number) {
    progress = p < 0 ? 0 : p > 1 ? 1 : p;
  }

  function setPointer(x: number, y: number, active: boolean) {
    aimA = active ? 1 : 0;

    if (!active) {
      atCol = -1;
      atRow = -1;
      return;
    }

    aimX = x;
    aimY = y;

    const col = Math.floor(x * cols);
    const row = Math.floor(y * gridRows);
    if (col === atCol && row === atRow) return;

    atCol = col;
    atRow = row;
    onBlock?.(col, row, x);
  }

  function frame(step: number) {
    clock += step * WAVE_SPEED * Math.PI * 2;

    atX += (aimX - atX) * POINTER_EASE;
    atY += (aimY - atY) * POINTER_EASE;
    atA += (aimA - atA) * POINTER_EASE;

    const ramp = Math.min(Math.max((progress - WASH_HOLD) / (1 - WASH_HOLD), 0), 1);
    const wash = ramp * ramp * (3 - 2 * ramp);
    const aspect = uniforms.uAspect.value;

    cols = BLOCKS_A + (BLOCKS_B - BLOCKS_A) * progress;
    gridRows = Math.max(cols / aspect, 1);
    uniforms.uGrid.value.set(cols, gridRows);

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cellPx = Math.max(canvas.clientWidth, 1) / cols;
    camera.position.z = fit * (1 + progress * DOLLY);
    uniforms.uPointPx.value = cellPx * dpr * camera.position.z;
    uniforms.uGap.value = Math.min(LINE_PX / cellPx, MAX_GAP);

    uniforms.uTime.value = clock;
    uniforms.uPointer.value.set(atX, atY);
    uniforms.uPointerA.value = atA;
    uniforms.uWash.value = WASH_PAPER + (WASH_ROSE - WASH_PAPER) * wash;
    uniforms.uTint.value.copy(PAPER).lerp(ROSE, wash);

    // The gutter between points is not empty in the flat shader either: it is
    // the line colour, and it washes toward rose along with everything else.
    renderer.setClearColor(line.copy(LINE_PAPER).lerp(LINE_ROSE, wash), 1);

    camera.position.x = (atX - 0.5) * SWAY_X;
    camera.position.y = (atY - 0.5) * SWAY_Y;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
    texture.dispose();
    renderer.dispose();
  }

  resize();

  return { setProgress, setPointer, frame, resize, dispose };
}
