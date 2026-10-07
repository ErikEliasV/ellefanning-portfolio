import { CHARACTERS } from "@/data/characters";
import { clamp01, smootherstep } from "@/lib/motion/filmStage";

export { NARROW_QUERY, isNarrow } from "@/lib/motion/filmStage";

export const COUNT = CHARACTERS.length;

const DEG = Math.PI / 180;

const WIPE = 0.65;

const WORD_IN = 0.6;

const RISE = 0.4;
const LIFT = 0.4;

const WORD_OUT = 0.25;

const STAY = 1;

const PILE = 3;

export type Span = { from: number; to: number };

export type FramePhases = { wipe: Span; rise: Span; stay: Span; lift: Span };

export function framePhases(): FramePhases {
  const wipe = { from: 0, to: WIPE };
  const rise = { from: wipe.to, to: wipe.to + RISE };
  const stay = { from: rise.to, to: rise.to + STAY };
  const lift = { from: stay.to, to: stay.to + LIFT };
  return { wipe, rise, stay, lift };
}

export function trackVh() {
  return 1 + framePhases().lift.to;
}

export function entryLockAt() {
  const { stay } = framePhases();
  return (stay.from + stay.to) / 2;
}

function span(p: number, s: Span) {
  return s.to > s.from ? clamp01((p - s.from) / (s.to - s.from)) : 1;
}

function head(t: number, end: number) {
  return clamp01(t / end);
}

function tail(t: number, start: number) {
  return clamp01((t - start) / (1 - start));
}

function ease(t: number) {
  return t * t * (3 - 2 * t);
}

export type Cursor = {
  u: number;
  active: number;
  wipe: number;
  enter: number;
  rise: number;
  lift: number;
  leave: number;
  settle: number;
  drift: number;
};

const CAPTION_DIP = 4;

export function stage(p: number, u: number): Cursor {
  const f = framePhases();

  const sweep = span(p, f.wipe);
  const away = span(p, f.lift);
  const rise = ease(span(p, f.rise));
  const lift = ease(away);

  const settle = rise * (1 - lift) * (1 - Math.sin(Math.PI * u) ** CAPTION_DIP);

  const active = ((Math.round(u) % COUNT) + COUNT) % COUNT;

  return {
    u,
    active,
    wipe: ease(sweep),
    enter: ease(head(sweep, WORD_IN)),
    rise,
    lift,
    leave: ease(tail(away, WORD_OUT)),
    settle,
    drift: clamp01((p - f.wipe.from) / (f.lift.to - f.wipe.from)),
  };
}

export const SPIN_DWELL = 100;
export const SPIN_TRAVEL = 1100;

export const SPIN_DWELL_REDUCED = 2500;

export function wrap(offset: number) {
  const half = COUNT / 2;
  return ((((offset + half) % COUNT) + COUNT) % COUNT) - half;
}

export type Spin = {
  step: number;
  t: number;
  wait: number;
  moving: boolean;
};

export const SPIN_REST: Spin = { step: 0, t: 0, wait: 0, moving: false };

export function spin(s: Spin, ms: number, hold: boolean, reduced: boolean): Spin {
  if (s.moving) {
    const t = s.t + ms / SPIN_TRAVEL;
    return t >= 1
      ? { step: s.step + 1, t: 0, wait: 0, moving: false }
      : { ...s, t };
  }

  if (hold) return s.wait === 0 ? s : { ...s, wait: 0 };

  const wait = s.wait + ms;
  if (wait < (reduced ? SPIN_DWELL_REDUCED : SPIN_DWELL)) return { ...s, wait };

  return reduced
    ? { step: s.step + 1, t: 0, wait: 0, moving: false }
    : { step: s.step, t: 0, wait: 0, moving: true };
}

export function glide(t: number) {
  return t * t * (6 - 8 * t + 3 * t * t);
}

export function carousel(p: number, s: Spin): Cursor {
  return stage(p, s.step + glide(s.t));
}

const RUBBER_MAX = 0.35;
const RUBBER_GIVE = 0.55;

export function rubber(raw: number) {
  const end = COUNT - 1;
  const base = Math.min(Math.max(raw, 0), end);
  const over = raw - base;
  if (over === 0) return raw;
  const pull = Math.abs(over);
  const give = RUBBER_MAX * (1 - 1 / ((pull * RUBBER_GIVE) / RUBBER_MAX + 1));
  return base + Math.sign(over) * give;
}

const FLING = 0.12;
const FLICK = 1.5;

export function release(raw: number, velocity: number) {
  const end = COUNT - 1;
  const base = Math.min(Math.max(raw, 0), end);
  const near = Math.round(base);
  let target = Math.round(base + velocity * FLING);
  if (target === near && Math.abs(velocity) > FLICK) {
    target = near + Math.sign(velocity);
  }
  return Math.min(Math.max(target, 0), end);
}

export type Deck = {
  half: number;
  turn: number;
  persp: number;
  reach: number;
  spread: number;
  pile: number;
  haze: number;
};

const WIDE: Deck = {
  half: 0.50155,
  turn: 60.76,
  persp: 6.914,
  reach: 0.6171,
  spread: 0.514,
  pile: PILE,
  haze: 0.02774,
};

const PHONE: Deck = {
  half: 0.2948,
  turn: 56,
  persp: 2.517,
  reach: 0.3026,
  spread: 0.63,
  pile: PILE,
  haze: 0.02058,
};

export function deckGeometry(narrow: boolean): Deck {
  return narrow ? PHONE : WIDE;
}

const Z_TOP = 1000;
const Z_STEP = 60;

function slot(d: number, k: Deck) {
  return Math.min(d, k.pile);
}

export type Pose = {
  x: number;
  turn: number;
  scale: number;
  haze: number;
  side: number;
  shade: number;
  z: number;
};

export function pose(offset: number, k: Deck): Pose {
  const d = Math.abs(offset);
  const s = Math.sign(offset);

  const x = s * k.reach * Math.pow(slot(d, k), k.spread);

  const t = smootherstep(clamp01(d));
  const turn = k.turn * t;

  return {
    x,
    turn: -s * turn,
    scale: 1 - (k.half * Math.sin(turn * DEG)) / k.persp,
    haze: k.haze * t,
    side: s,
    shade: 1 - smootherstep(clamp01((d - k.pile) / 1.5)),
    z: Math.max(1, Z_TOP - Math.round(d * Z_STEP)),
  };
}
