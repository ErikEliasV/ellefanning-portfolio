"use client";

import { asset } from "@/lib/asset";
import { onTick } from "@/lib/scroll";

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

const IR_SECONDS = 2.2;
const IR_DECAY = 3.4;
const WET_MUSIC = 0.12;
const WET_GRAIN = 0.22;
const WIDTH_MUSIC = 1.4;

const TEC = 0.5;
const TEC_GAP = 0.045;
const TEC_VOICES = 5;
const TEC_WIDTH = 0.4;

export type SoundState = { on: boolean; live: boolean };

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let master: GainNode | null = null;
let send: GainNode | null = null;
let musicSource: MediaElementAudioSourceNode | null = null;
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
let rampOff: (() => void) | null = null;
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

  rampOff?.();
  rampOff = null;
  window.clearTimeout(settle);

  const from = el.volume;
  const span = to - from;
  if (!span) return;

  const start = performance.now();
  const land = Math.min(Math.max(to, 0), 1);

  const step = (now: number) => {
    const k = ms > 0 ? Math.min((now - start) / ms, 1) : 1;
    el.volume = Math.min(Math.max(from + span * k, 0), 1);
    if (k >= 1) {
      rampOff?.();
      rampOff = null;
    }
  };

  settle = window.setTimeout(() => {
    rampOff?.();
    rampOff = null;
    el.volume = land;
  }, ms + 120);

  rampOff = onTick(step);
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

// A decaying burst of noise is a room. Generating it costs nothing to
// download, which matters more here than the accuracy of a sampled hall.
function impulse(live: AudioContext) {
  const length = Math.floor(live.sampleRate * IR_SECONDS);
  const buffer = live.createBuffer(2, length, live.sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let at = 0; at < length; at += 1) {
      data[at] = (Math.random() * 2 - 1) * Math.pow(1 - at / length, IR_DECAY);
    }
  }

  return buffer;
}

// Mid/side: the two mid gains rebuild the centre in both channels and the two
// side gains add the difference with opposite signs, so L = M + wS and
// R = M - wS without a separate inverter.
function widen(live: AudioContext, width: number) {
  const input = live.createGain();
  const output = live.createGain();
  const split = live.createChannelSplitter(2);
  const merge = live.createChannelMerger(2);

  const midL = live.createGain();
  const midR = live.createGain();
  const sideL = live.createGain();
  const sideR = live.createGain();

  midL.gain.value = 0.5;
  midR.gain.value = 0.5;
  sideL.gain.value = width * 0.5;
  sideR.gain.value = -width * 0.5;

  input.connect(split);
  split.connect(midL, 0);
  split.connect(midR, 1);
  split.connect(sideL, 0);
  split.connect(sideR, 1);

  midL.connect(merge, 0, 0);
  sideL.connect(merge, 0, 0);
  midR.connect(merge, 0, 1);
  sideR.connect(merge, 0, 1);

  merge.connect(output);

  return { input, output };
}

function open() {
  if (ctx) return ctx;

  ctx = new AudioContext();

  master = ctx.createGain();
  master.connect(ctx.destination);

  const room = ctx.createConvolver();
  room.buffer = impulse(ctx);
  room.connect(master);

  send = ctx.createGain();
  send.connect(room);

  bus = ctx.createGain();
  bus.gain.value = PIXEL;
  bus.connect(master);

  const grainWet = ctx.createGain();
  grainWet.gain.value = WET_GRAIN;
  bus.connect(grainWet);
  grainWet.connect(send);

  tecBus = ctx.createGain();
  tecBus.gain.value = TEC;
  tecBus.connect(master);

  const tecWet = ctx.createGain();
  tecWet.gain.value = WET_GRAIN;
  tecBus.connect(tecWet);
  tecWet.connect(send);

  grind();

  return ctx;
}

// Routing is deferred until the context is actually running: connecting a media
// element to a suspended context hands back silence.
function route(el: HTMLAudioElement) {
  if (musicSource || !ctx || !master || !send || ctx.state !== "running") return;

  musicSource = ctx.createMediaElementSource(el);

  const wide = widen(ctx, WIDTH_MUSIC);
  musicSource.connect(wide.input);
  wide.output.connect(master);

  const wet = ctx.createGain();
  wet.gain.value = WET_MUSIC;
  wide.output.connect(wet);
  wet.connect(send);
}

function arm() {
  restore();

  const live = open();
  if (live.state === "suspended") void live.resume();

  if (!wanted || hushed) return;

  const el = build();
  route(el);
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
