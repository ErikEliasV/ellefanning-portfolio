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

// The camera dollies with scroll and sways with the pointer, and the moment it
// moves it can see past the edge of the grid. The grid is built wider than the
// frame so there is always another cube out there.
const OVER = 1.2;
const SIDE_DIM = 0.74;
const KEY_FRONT = 0.904;

const THICK = 0.55;
const FOV = 38;
const DOLLY = 0.14;
const SWAY_X = 0.05;
const SWAY_Y = 0.035;

// The idle grid is nearly flat on purpose: at rest this should read as the same
// tidy mosaic it always was, and the depth should be something the pointer does.
const IDLE_AMP = 0.012;
const IDLE_FREQ = 6.4;
const IDLE_SKEW = 3.1;
const IDLE_SPEED = 0.5;

// Rings spreading from the pointer and dying out with distance: struck water,
// not a bulge that follows the cursor around.
const RING_AMP = 0.1;
const RING_FREQ = 8.5;
const RING_SPEED = 4.6;
const RING_FALL = 1.4;
const RING_EASE = 0.12;
const REVEAL = 0.62;
const REVEAL_R2 = 0.16;

const glsl = (n: number) => n.toFixed(5);

const VERTEX = `
uniform sampler2D uTex;
uniform vec2 uGrid;
uniform vec2 uBase;
uniform float uTexRatio;
uniform float uAspect;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerA;
uniform float uGap;
uniform float uOver;
attribute vec2 aCell;
varying vec3 vColor;
varying float vLight;
varying float vHalo;

void main() {
  vec2 slot = floor(aCell * uGrid);
  vec2 center = (slot + 0.5) / uGrid;

  // As the grid coarsens with scroll, several instances land on the same block.
  // One of them owns it and the rest collapse, so no two cubes ever share a
  // place and fight over the depth buffer.
  vec2 owner = floor(center * uBase);
  vec2 self = floor(aCell * uBase);
  float mine = all(equal(owner, self)) ? 1.0 : 0.0;

  // The grid runs wider than the frame, so the visible coordinate is the cell
  // pushed back out from the middle.
  vec2 vis = (center - 0.5) * uOver + 0.5;

  vec2 uv = vis;
  if (uAspect > uTexRatio) {
    uv.y = (uv.y - 0.5) * (uTexRatio / uAspect) + 0.5;
  } else {
    uv.x = (uv.x - 0.5) * (uAspect / uTexRatio) + 0.5;
  }
  vec3 tex = texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb;

  vec2 here = vec2((vis.x - 0.5) * 2.0 * uAspect, (vis.y - 0.5) * 2.0);
  vec2 hit = vec2((uPointer.x - 0.5) * 2.0 * uAspect, (uPointer.y - 0.5) * 2.0);

  float reach = distance(here, hit);
  float ring = sin(reach * ${glsl(RING_FREQ)} - uTime * ${glsl(RING_SPEED)})
    * exp(-reach * ${glsl(RING_FALL)});
  float idle = sin(vis.x * ${glsl(IDLE_FREQ)} + vis.y * ${glsl(IDLE_SKEW)}
    + uTime * ${glsl(IDLE_SPEED)});

  float lift = ring * ${glsl(RING_AMP)} * uPointerA + idle * ${glsl(IDLE_AMP)};

  vHalo = exp(-reach * reach / ${glsl(REVEAL_R2)}) * uPointerA;

  float span = 2.0 * uAspect * uOver / uGrid.x;
  float side = max(span - uGap, 0.0001);
  vec3 body = position * vec3(side, side, side * ${glsl(THICK)}) * mine;

  vec3 place = vec3(here.x, here.y, lift) + body;

  // The face turned toward the camera has to stay at full strength: dimming it
  // darkened the whole field, and on a pale rose darker reads as more rose.
  vec3 face = normalize(normalMatrix * normal);
  float key = max(dot(face, normalize(vec3(0.25, 0.4, 1.0))), 0.0);
  vLight = mix(${glsl(SIDE_DIM)}, 1.0, min(key / ${glsl(KEY_FRONT)}, 1.0));
  vColor = tex;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(place, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
uniform float uWash;
uniform vec3 uTint;
varying vec3 vColor;
varying float vLight;
varying float vHalo;

void main() {
  vec3 color = clamp((vColor - 0.5) * ${glsl(CONTRAST)} + 0.5, 0.0, 1.0);
  color = mix(color, uTint, uWash * (1.0 - vHalo * ${glsl(REVEAL)}));
  gl_FragColor = vec4(color * vLight, 1.0);
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

export function createCloud({
  canvas,
  image,
  onBlock,
}: CloudOptions): Cloud | null {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: (window.devicePixelRatio || 1) < 2,
    powerPreference: "low-power",
  });

  // Every cube reads its colour from the photo in the vertex shader, so a
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
    uBase: { value: new THREE.Vector2(BLOCKS_A, BLOCKS_A) },
    uTexRatio: { value: ratio },
    uAspect: { value: 1 },
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uPointerA: { value: 0 },
    uGap: { value: 0.01 },
    uOver: { value: OVER },
    uWash: { value: WASH_PAPER },
    uTint: { value: PAPER.clone() },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
  });

  let geometry = new THREE.InstancedBufferGeometry();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const line = LINE_PAPER.clone();
  renderer.setClearColor(line, 1);

  let progress = 0;
  let clock = 0;
  let cols = BLOCKS_A;
  let visCols = BLOCKS_A;
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

    // A fresh box each time: disposing the old geometry would take its buffers
    // with it, and a shared one would be gone on the next resize.
    const box = new THREE.BoxGeometry(1, 1, 1);

    geometry.dispose();
    geometry = new THREE.InstancedBufferGeometry();
    geometry.index = box.index;
    geometry.setAttribute("position", box.attributes.position);
    geometry.setAttribute("normal", box.attributes.normal);
    geometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(cells, 2));
    geometry.instanceCount = gridCols * count;

    mesh.geometry = geometry;
    uniforms.uBase.value.set(gridCols, count);
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

    const wide = Math.ceil(BLOCKS_A * OVER);
    const tall = Math.min(Math.max(Math.ceil(wide / aspect), 1), MAX_ROWS);
    if (tall !== rows) {
      rows = tall;
      build(wide, rows);
    }

    if (rows) frame(0);
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

    const col = Math.floor(x * visCols);
    const row = Math.floor(y * visCols / Math.max(uniforms.uAspect.value, 0.001));
    if (col === atCol && row === atRow) return;

    atCol = col;
    atRow = row;
    onBlock?.(col, row, x);
  }

  function frame(step: number) {
    clock += step;

    const ease = 1 - Math.pow(1 - RING_EASE, step * 60);
    atX += (aimX - atX) * ease;
    atY += (aimY - atY) * ease;
    atA += (aimA - atA) * ease;

    const ramp = Math.min(Math.max((progress - WASH_HOLD) / (1 - WASH_HOLD), 0), 1);
    const wash = ramp * ramp * (3 - 2 * ramp);
    const aspect = uniforms.uAspect.value;

    visCols = BLOCKS_A + (BLOCKS_B - BLOCKS_A) * progress;
    cols = visCols * OVER;
    gridRows = Math.max(cols / aspect, 1);
    uniforms.uGrid.value.set(cols, gridRows);

    uniforms.uGap.value = (2 * aspect * LINE_PX) / Math.max(canvas.clientWidth, 1);
    uniforms.uTime.value = clock;
    uniforms.uPointer.value.set(atX, atY);
    uniforms.uPointerA.value = atA;
    uniforms.uWash.value = WASH_PAPER + (WASH_ROSE - WASH_PAPER) * wash;
    uniforms.uTint.value.copy(PAPER).lerp(ROSE, wash);

    // The gutter between cubes is not empty in the flat shader either: it is
    // the line colour, and it washes toward rose along with everything else.
    renderer.setClearColor(line.copy(LINE_PAPER).lerp(LINE_ROSE, wash), 1);

    camera.position.z = fit * (1 + progress * DOLLY);
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
  frame(0);

  return { setProgress, setPointer, frame, resize, dispose };
}
