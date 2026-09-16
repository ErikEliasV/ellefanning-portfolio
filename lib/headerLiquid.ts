import * as THREE from "three";

const RING_FREQ = 9.2;
const RING_SPEED = 3.0;
const RING_FALL = 1.55;
const RING_AMP = 0.052;
const DRIFT_AMP = 0.016;
const DRIFT_SPEED = 0.35;
const PUSH_AMP = 0.075;
const PUSH_DECAY = 7;
const CA_AMP = 0.0085;
const SPEC = 0.085;
const ENTRY_GAIN = 4.2;
const MIX_SPEED = 3.2;
const MAX_DPR = 2;

const glsl = (n: number) => n.toFixed(5);

const VERTEX = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;

uniform sampler2D uTex;
uniform sampler2D uPrev;
uniform float uMix;
uniform vec2 uCover;
uniform vec2 uPrevCover;
uniform vec2 uFocus;
uniform vec2 uPrevFocus;
uniform float uAspect;
uniform vec2 uPointer;
uniform float uPointerA;
uniform float uPush;
uniform float uOpen;
uniform float uTime;

varying vec2 vUv;

vec2 place(vec2 uv, vec2 k, vec2 focus) {
  return (uv - focus) * k + focus;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  vec2 q = uPointer * vec2(uAspect, 1.0);
  float d = distance(p, q);
  vec2 dir = normalize(p - q + vec2(1e-5));

  // Aneis nascendo do ponteiro e morrendo com a distancia: agua batida, nao
  // uma bolha que segue o cursor.
  float ring = sin(d * ${glsl(RING_FREQ)} - uTime * ${glsl(RING_SPEED)})
             * exp(-d * ${glsl(RING_FALL)});

  float drift = sin(p.x * 3.1 + uTime * ${glsl(DRIFT_SPEED)})
              * cos(p.y * 2.7 - uTime * ${glsl(DRIFT_SPEED * 0.77)});

  // A abertura empurra amplitude: o conteudo escorre para dentro e assenta.
  float entry = 1.0 + (1.0 - uOpen) * ${glsl(ENTRY_GAIN)};

  vec2 disp = dir * ring * ${glsl(RING_AMP)} * uPointerA * entry
            + vec2(drift) * ${glsl(DRIFT_AMP)} * entry
            + vec2(uPush, 0.0) * ${glsl(PUSH_AMP)};

  // Franja cromatica na crista da onda: e isso que vende vidro.
  vec2 ca = dir * abs(ring) * uPointerA * ${glsl(CA_AMP)};

  vec2 uvA = place(vUv + disp, uCover, uFocus);
  vec2 uvB = place(vUv + disp, uPrevCover, uPrevFocus);

  vec3 a = vec3(
    texture2D(uTex, uvA + ca).r,
    texture2D(uTex, uvA).g,
    texture2D(uTex, uvA - ca).b
  );
  vec3 b = vec3(
    texture2D(uPrev, uvB + ca).r,
    texture2D(uPrev, uvB).g,
    texture2D(uPrev, uvB - ca).b
  );

  vec3 col = mix(b, a, uMix);
  col += ${glsl(SPEC)} * smoothstep(0.55, 1.0, ring) * uPointerA;

  gl_FragColor = vec4(col, 1.0);
}
`;

export type Media = HTMLImageElement | HTMLVideoElement;

export type LiquidOptions = {
  canvas: HTMLCanvasElement;
};

export type Liquid = {
  setMedia(media: Media, focus: number, push: number): void;
  setPointer(x: number, y: number, presence: number): void;
  setOpen(p: number): void;
  frame(step: number): void;
  resize(): void;
  dispose(): void;
};

function measure(media: Media) {
  const w =
    media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
  const h =
    media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
  return { w: w || 1, h: h || 1 };
}

export function createLiquid({ canvas }: LiquidOptions): Liquid | null {
  let renderer: THREE.WebGLRenderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }

  const scene = new THREE.Scene();
  // O vertex shader escreve gl_Position em clip space direto, entao a camera
  // existe so porque o render pede uma.
  const camera = new THREE.Camera();

  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  blank.needsUpdate = true;

  const uniforms = {
    uTex: { value: blank as THREE.Texture },
    uPrev: { value: blank as THREE.Texture },
    uMix: { value: 1 },
    uCover: { value: new THREE.Vector2(1, 1) },
    uPrevCover: { value: new THREE.Vector2(1, 1) },
    uFocus: { value: new THREE.Vector2(0.5, 0.5) },
    uPrevFocus: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: 1 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPointerA: { value: 0 },
    uPush: { value: 0 },
    uOpen: { value: 0 },
    uTime: { value: 0 },
  };

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
  });

  scene.add(new THREE.Mesh(geometry, material));

  const owned = new Set<THREE.Texture>();
  let push = 0;

  // Sem colorSpace, como em lib/heroCloud.ts: o ShaderMaterial cru nao injeta
  // conversao nenhuma, entao a imagem atravessa byte a byte. Marcar sRGB aqui
  // lavaria todo preview.
  function adopt(media: Media) {
    const tex =
      media instanceof HTMLVideoElement
        ? new THREE.VideoTexture(media)
        : new THREE.Texture(media);

    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    owned.add(tex);
    return tex;
  }

  function cover(media: Media) {
    const { w, h } = measure(media);
    const box = uniforms.uAspect.value;
    const ratio = w / h;
    return ratio > box
      ? new THREE.Vector2(box / ratio, 1)
      : new THREE.Vector2(1, ratio / box);
  }

  function drop(tex: THREE.Texture) {
    if (tex === blank) return;
    if (tex === uniforms.uTex.value || tex === uniforms.uPrev.value) return;
    owned.delete(tex);
    tex.dispose();
  }

  return {
    setMedia(media, focus, next) {
      const stale = uniforms.uPrev.value;

      uniforms.uPrev.value = uniforms.uTex.value;
      uniforms.uPrevCover.value = uniforms.uCover.value;
      uniforms.uPrevFocus.value = uniforms.uFocus.value;

      uniforms.uTex.value = adopt(media);
      uniforms.uCover.value = cover(media);
      // O three sobe a imagem com flipY, entao o v do shader corre do rodape
      // para o topo: focus vem contado do topo e precisa inverter.
      uniforms.uFocus.value = new THREE.Vector2(0.5, 1 - focus);
      uniforms.uMix.value = 0;

      push = next;
      drop(stale);
    },

    setPointer(x, y, presence) {
      uniforms.uPointer.value.set(x, y);
      uniforms.uPointerA.value = presence;
    },

    setOpen(p) {
      uniforms.uOpen.value = p;
    },

    frame(step) {
      uniforms.uTime.value += step;
      uniforms.uMix.value = Math.min(uniforms.uMix.value + step * MIX_SPEED, 1);
      // Decaimento por tempo, nao por frame: a 120Hz um fator por frame morreria
      // duas vezes mais rapido que a 60Hz.
      push *= Math.exp(-step * PUSH_DECAY);
      uniforms.uPush.value = push;
      renderer.render(scene, camera);
    },

    resize() {
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return;
      uniforms.uAspect.value = box.width / box.height;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
      renderer.setSize(box.width, box.height, false);
    },

    dispose() {
      owned.forEach((tex) => tex.dispose());
      owned.clear();
      blank.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
