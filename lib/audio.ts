"use client";

import { asset } from "@/lib/asset";

const TRACK = "/audio/falling-mizlo.mp3";
const GRAINS = [
  "/audio/pixel-1.wav",
  "/audio/pixel-2.wav",
  "/audio/pixel-3.wav",
  "/audio/pixel-4.wav",
] as const;
const TECS = [
  "/audio/tec-1.wav",
  "/audio/tec-2.wav",
  "/audio/tec-3.wav",
  "/audio/tec-4.wav",
] as const;

const STORE = "ef-sound";
const GESTURES = [
  "pointerdown",
  "pointerup",
  "keydown",
  "touchend",
] as const;

const MUSIC = 0.04;
const PIXEL = 0.46;
const RISE = 600;
const DIP = 380;
const RETURN = 620;
const GAP = 0.06;
const VOICES = 6;
const WIDTH = 0.6;

const TEC = 0.5;
const TEC_GAP = 0.045;
const TEC_VOICES = 5;
const TEC_WIDTH = 0.4;

export type SoundState = { on: boolean; live: boolean };

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let grains: (AudioBuffer | null)[] = [];
let loading: Promise<void> | null = null;
let music: HTMLAudioElement | null = null;

let tecBus: GainNode | null = null;
let tecs: (AudioBuffer | null)[] = [];

let wanted = true;
let restored = false;
let armed = false;
let hushed = false;
let gated = true;
let voices = 0;
let lastHit = 0;
let tecVoices = 0;
let lastTec = 0;
let ramp = 0;
let settle = 0;
let stopper = 0;

const watchers = new Set<(state: SoundState) => void>();

function snapshot(): SoundState {
  return { on: wanted, live: armed && wanted && !!music && !music.paused };
}

function announce() {
  const state = snapshot();
  watchers.forEach((watcher) => watcher(state));
}

function restore() {
  if (restored) return;
  restored = true;
  try {
    wanted = window.localStorage.getItem(STORE) !== "off";
  } catch {
    wanted = true;
  }
}

function remember() {
  try {
    window.localStorage.setItem(STORE, wanted ? "on" : "off");
  } catch {}
}

function level() {
  return wanted && !hushed ? MUSIC : 0;
}

function slide(to: number, ms: number) {
  const el = music;
  if (!el) return;

  cancelAnimationFrame(ramp);
  window.clearTimeout(settle);
  ramp = 0;

  const from = el.volume;
  const span = to - from;
  if (!span) return;

  const start = performance.now();
  const land = Math.min(Math.max(to, 0), 1);

  const step = (now: number) => {
    const k = ms > 0 ? Math.min((now - start) / ms, 1) : 1;
    el.volume = Math.min(Math.max(from + span * k, 0), 1);
    ramp = k < 1 ? requestAnimationFrame(step) : 0;
  };

  settle = window.setTimeout(() => {
    cancelAnimationFrame(ramp);
    ramp = 0;
    el.volume = land;
  }, ms + 120);

  ramp = requestAnimationFrame(step);
}

function build() {
  if (music) return music;

  const el = new Audio();
  el.preload = "auto";
  el.loop = true;
  el.volume = 0;
  el.src = asset(TRACK);
  el.load();

  music = el;
  return el;
}

function decode(live: AudioContext, path: string) {
  return fetch(asset(path))
    .then((res) => res.arrayBuffer())
    .then((raw) => live.decodeAudioData(raw))
    .catch(() => null);
}

function grind() {
  if (loading || !ctx) return;
  const live = ctx;

  loading = Promise.all(GRAINS.map((path) => decode(live, path)))
    .then((list) => {
      grains = list;
    })
    .then(() => Promise.all(TECS.map((path) => decode(live, path))))
    .then((list) => {
      tecs = list;
    });
}

function open() {
  if (ctx) return ctx;

  ctx = new AudioContext();
  bus = ctx.createGain();
  bus.gain.value = PIXEL;
  bus.connect(ctx.destination);

  tecBus = ctx.createGain();
  tecBus.gain.value = TEC;
  tecBus.connect(ctx.destination);

  grind();

  return ctx;
}

function arm() {
  restore();

  const live = open();
  if (live.state === "suspended") void live.resume();

  if (!wanted || hushed) return;

  const el = build();
  if (gated) return;

  window.clearTimeout(stopper);

  if (armed && !el.paused) {
    slide(level(), RETURN);
    return;
  }

  el
    .play()
    .then(() => {
      armed = true;
      slide(level(), RISE);
      announce();
    })
    .catch(() => {});
}

function stop(ms: number) {
  slide(0, ms);
  window.clearTimeout(stopper);
  stopper = window.setTimeout(() => {
    music?.pause();
    announce();
  }, ms);
}

function onVisibility() {
  if (!music) return;

  if (document.hidden) {
    music.pause();
    announce();
    return;
  }

  arm();
}

function pick(a: number, b: number, count: number) {
  let h = Math.imul(a, 73856093) ^ Math.imul(b, 19349663);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % count;
}

export function pixel(col: number, row: number, x: number) {
  if (!wanted || gated || !ctx || !bus || ctx.state !== "running") return;

  const now = ctx.currentTime;
  if (now - lastHit < GAP || voices >= VOICES) return;

  const grain = grains[pick(col, row, GRAINS.length)];
  if (!grain) return;

  lastHit = now;
  voices += 1;

  const source = ctx.createBufferSource();
  source.buffer = grain;

  const pan = ctx.createStereoPanner();
  pan.pan.value = (x * 2 - 1) * WIDTH;

  source.connect(pan);
  pan.connect(bus);

  source.onended = () => {
    voices -= 1;
    source.disconnect();
    pan.disconnect();
  };

  source.start();
}

export function reelTick(notch: number, spread: number) {
  if (!wanted || gated || !ctx || !tecBus || ctx.state !== "running") return;

  const now = ctx.currentTime;
  if (now - lastTec < TEC_GAP || tecVoices >= TEC_VOICES) return;

  const grain = tecs[pick(notch, 0, TECS.length)];
  if (!grain) return;

  lastTec = now;
  tecVoices += 1;

  const source = ctx.createBufferSource();
  source.buffer = grain;

  const pan = ctx.createStereoPanner();
  pan.pan.value = (Math.min(Math.max(spread, 0), 1) * 2 - 1) * TEC_WIDTH;

  source.connect(pan);
  pan.connect(tecBus);

  source.onended = () => {
    tecVoices -= 1;
    source.disconnect();
    pan.disconnect();
  };

  source.start();
}

export function release() {
  if (!gated) return;
  gated = false;
  arm();
  announce();
}

export function hush(on: boolean) {
  if (hushed === on) return;
  hushed = on;

  if (on) stop(DIP);
  else arm();

  announce();
}

export function toggle() {
  wanted = !wanted;
  remember();

  if (wanted) arm();
  else stop(DIP);

  announce();
}

export function subscribe(watcher: (state: SoundState) => void) {
  watchers.add(watcher);
  watcher(snapshot());
  return () => {
    watchers.delete(watcher);
  };
}

export function listen() {
  restore();
  open();
  arm();
  announce();

  const wake = () => arm();

  GESTURES.forEach((name) =>
    window.addEventListener(name, wake, { passive: true }),
  );
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    GESTURES.forEach((name) => window.removeEventListener(name, wake));
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
