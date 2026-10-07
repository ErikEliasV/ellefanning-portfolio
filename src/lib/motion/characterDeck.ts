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

const ENTRY_LEAD = 0.5;

const PILE = 3;

const CYCLE = 0.4;
const CYCLE_REDUCED = 0.35;
const DWELL = 0.14;

export type Span = { from: number; to: number };

export type FramePhases = { wipe: Span; rise: Span; stay: Span; lift: Span };

export function framePhases(): FramePhases {
  const wipe = { from: -ENTRY_LEAD, to: WIPE - ENTRY_LEAD };
  const rise = { from: wipe.to, to: wipe.to + RISE };
  const stay = { from: rise.to, to: rise.to + STAY };
  const lift = { from: stay.to, to: stay.to + LIFT };
  return { wipe, rise, stay, lift };
}

export type ReelPhases = {
  wipe: Span;
  rise: Span;
  walk: Span;
  reel: Span;
  hold: Span;
  pile: Span;
  lift: Span;
  cycle: number;
};

export function reelPhases(reduced: boolean): ReelPhases {
  const cycle = reduced ? CYCLE_REDUCED : CYCLE;
  const ramped = PILE * cycle;

  const wipe = { from: 0, to: WIPE };
  const rise = { from: wipe.to, to: wipe.to + RISE };
  const walk = { from: rise.to, to: rise.to + ramped };
  const reel = { from: walk.to, to: walk.to + cycle * (COUNT - 1) };
  const hold = { from: reel.to, to: reel.to + cycle * DWELL };
  const pile = { from: hold.to, to: hold.to + ramped };
  const lift = { from: pile.to, to: pile.to + LIFT };

  return { wipe, rise, walk, reel, hold, pile, lift, cycle };
}

export function trackVh(narrow: boolean, reduced: boolean) {
  return 1 + (narrow ? reelPhases(reduced).lift.to : framePhases().lift.to);
}

export function lockAt(index: number, reduced: boolean) {
  const f = reelPhases(reduced);
  return f.reel.from + f.cycle * (index + DWELL / 2);
}

export function entryLockAt(narrow: boolean, reduced: boolean) {
  if (narrow) return lockAt(0, reduced);
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

export function reel(p: number, reduced: boolean): Cursor {
  const f = reelPhases(reduced);

  const sweep = span(p, f.wipe);
  const away = span(p, f.lift);

  let u: number;
  let travel: number;

  if (p < f.walk.from) {
    u = -PILE;
    travel = 0;
  } else if (p < f.reel.from) {
    u = -PILE * (1 - span(p, f.walk));
    travel = 0;
  } else if (p < f.reel.to) {
    const raw = span(p, f.reel) * (COUNT - 1);
    const i = Math.min(Math.floor(raw), COUNT - 2);
    const frac = raw - i;
    const t = clamp01((frac - DWELL) / (1 - DWELL));
    u = i + smootherstep(t);
    travel = frac < DWELL ? 0 : t;
  } else {
    u = COUNT - 1 + PILE * span(p, f.pile);
    travel = 0;
  }

  const gate = clamp01(u + 1) * clamp01(COUNT - u);

  return {
    u,
    active: Math.min(Math.max(Math.round(u), 0), COUNT - 1),
    wipe: ease(sweep),
    enter: ease(head(sweep, WORD_IN)),
    rise: ease(span(p, f.rise)),
    lift: ease(away),
    leave: ease(tail(away, WORD_OUT)),
    settle: gate * (1 - Math.sin(Math.PI * travel)),
    drift: clamp01((p - f.wipe.from) / (f.lift.to - f.wipe.from)),
  };
}

const FLING = 0.12;
const FLICK = 1.5;

export function reelTarget(p: number, velocity: number, reduced: boolean) {
  const f = reelPhases(reduced);
  const end = COUNT - 1;
  const at = (p - f.reel.from) / f.cycle - DWELL / 2;
  const ahead = at + velocity * FLING;

  if (ahead < -0.5 || ahead > end + 0.5) {
    const glide = p + velocity * FLING * f.cycle;
    return Math.min(Math.max(glide, 0), f.lift.to);
  }

  const here = Math.min(Math.max(Math.round(at), 0), end);
  let target = Math.min(Math.max(Math.round(ahead), 0), end);
  if (target === here && Math.abs(velocity) > FLICK) {
    target = Math.min(Math.max(here + Math.sign(velocity), 0), end);
  }
  return lockAt(target, reduced);
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
