export type Geometry = {
  widthVw: number;
  ratio: number;
  axis: "x" | "y";
  pitch: number;
  splitVw: number;
  heightVh?: number;
  centerVh?: number;
  nearScale: number;
  nearBlur: number;
  nearFade: number;
};

const WIDE: Geometry = {
  widthVw: 0.281,
  ratio: 812 / 539,
  axis: "x",
  pitch: 0.48,
  splitVw: 0.173,
  nearScale: 0.58,
  nearBlur: 9,
  nearFade: 0,
};

const NARROW: Geometry = {
  widthVw: 0.898,
  heightVh: 0.6224,
  ratio: 812 / 539,
  axis: "y",
  pitch: 0.7998,
  splitVw: 0,
  centerVh: -0.103,
  nearScale: 0.9723,
  nearBlur: 15.5,
  nearFade: 1,
};

export function geometry(narrow: boolean): Geometry {
  return narrow ? NARROW : WIDE;
}

export const NARROW_QUERY = "(width < 64rem)";

export function isNarrow() {
  return typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches;
}

export const COUNT = 16;

export const CURTAIN_OUT = 0.02;

const DWELL = 0.2;
const FALL_NARROW = 0.5;

export function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function easeOut4(x: number) {
  return 1 - Math.pow(1 - x, 4);
}

export function smootherstep(x: number) {
  return clamp01(x * x * x * (x * (x * 6 - 15) + 10));
}

type Span = { from: number; to: number };

export type Phases = {
  curtain: Span;
  rise: Span;
  open: Span;
  reel: Span;
  hold: Span;
  exit: Span;
  close: Span;
  fall: Span;
  reveal: Span;
  cycle: number;
};

export function phases(reduced: boolean, narrow: boolean): Phases {
  const cycle = reduced ? 0.35 : narrow ? 0.34 : 0.6167;
  const k = reduced ? 0.5 : narrow ? 0.7 : 1;

  const curtain = { from: -0.4 * k, to: -0.05 * k };
  const rise = { from: CURTAIN_OUT, to: CURTAIN_OUT + 0.5 * k };
  const open = { from: rise.to, to: rise.to + 0.5 * k };
  const reel = { from: open.to, to: open.to + cycle * (COUNT - 1) };
  const hold = { from: reel.to, to: reel.to + cycle * DWELL };
  const exit = { from: hold.to, to: hold.to + 0.4 * k };
  const close = { from: exit.to, to: exit.to + 0.35 * k };
  const fall = { from: close.to, to: close.to + 0.35 * k };
  const reveal = { from: fall.to, to: fall.to + 0.3 * k };
  const out = narrow
    ? { from: reveal.to - 1, to: reveal.to - 1 + FALL_NARROW }
    : fall;

  return { curtain, rise, open, reel, hold, exit, close, fall: out, reveal, cycle };
}

export function trackVh(reduced: boolean, narrow: boolean) {
  return 1 + phases(reduced, narrow).reveal.to;
}

export function lastLockAt(reduced: boolean, narrow: boolean) {
  const f = phases(reduced, narrow);
  return (f.hold.from + f.hold.to) / 2;
}

export function canSkip(p: number, reduced: boolean, narrow: boolean) {
  const f = phases(reduced, narrow);
  return p >= f.reel.from && p < f.hold.from;
}

function span(p: number, s: Span) {
  return clamp01((p - s.from) / (s.to - s.from));
}

export type Cursor = {
  u: number;
  lock: number;
  curtain: number;
  rise: number;
  split: number;
  enter: number;
  fall: number;
  reveal: number;
};

export function cursor(p: number, reduced: boolean, narrow: boolean): Cursor {
  const f = phases(reduced, narrow);

  const curtain = span(p, f.curtain);
  const rise = span(p, f.rise);

  const opened = span(p, f.open);
  const closed = span(p, f.close);
  const split = opened - closed;

  const enter = clamp01((opened - 0.5) * 2);

  const fall = span(p, f.fall);
  const reveal = span(p, f.reveal);

  let u: number;
  let lock: number;

  if (p < f.reel.from) {
    u = 0;
    lock = -1;
  } else if (p < f.reel.to) {
    const raw = span(p, f.reel) * (COUNT - 1);
    const i = Math.min(Math.floor(raw), COUNT - 2);
    const frac = raw - i;
    u = i + smootherstep(clamp01((frac - DWELL) / (1 - DWELL)));
    lock = frac < DWELL ? i : -1;
  } else if (p < f.hold.to) {
    u = COUNT - 1;
    lock = COUNT - 1;
  } else {
    u = COUNT - 1 + easeOut4(span(p, f.exit)) * 1.6;
    lock = -1;
  }

  return { u, lock, curtain, rise, split, enter, fall, reveal };
}

export type Depth = {
  offset: number;
  scale: number;
  blur: number;
  fade: number;
  live: boolean;
};

export function depth(i: number, u: number, g: Geometry): Depth {
  const offset = i - u;
  const d = clamp01(Math.abs(offset));
  return {
    offset,
    scale: 1 - (1 - g.nearScale) * d,
    blur: g.nearBlur * d,
    fade: g.nearFade * d,
    live: Math.abs(offset) <= 2,
  };
}
