const TAU = 50;
const START = 150;
const STAY = 60;
const IDLE = 180;

export type Motion = {
  moving: boolean;
  speed: number;
  top: number;
  at: number;
  calm: number;
};

export function sense(m: Motion | null, top: number, now: number): Motion {
  if (!m) return { moving: false, speed: 0, top, at: now, calm: now };

  const dt = now - m.at;
  if (dt <= 0) return m;

  const v = (Math.abs(top - m.top) / dt) * 1000;
  const speed = m.speed + (v - m.speed) * (1 - Math.exp(-dt / TAU));
  const calm = speed > STAY ? now : m.calm;
  const moving = m.moving ? now - calm <= IDLE : speed > START;

  return { moving, speed, top, at: now, calm };
}

export function reelStops(
  count: number,
  cell: number,
  view: number,
  panMax: number,
) {
  const stops: number[] = [];
  for (let k = 0; k < count; k += 1) {
    const at = Math.min(Math.max(k * cell - (view - cell) / 2, 0), panMax);
    if (!stops.length || at > stops[stops.length - 1] + 0.5) stops.push(at);
  }
  return stops;
}

const RUBBER_GIVE = 0.55;

export function reelRubber(raw: number, panMax: number, reach: number) {
  const base = Math.min(Math.max(raw, 0), panMax);
  const over = raw - base;
  if (over === 0) return raw;
  if (reach <= 0) return base;
  const pull = Math.abs(over);
  const give = reach * (1 - 1 / ((pull * RUBBER_GIVE) / reach + 1));
  return base + Math.sign(over) * give;
}

const FLING = 0.12;
const FLICK = 300;

function nearest(stops: number[], at: number) {
  let best = 0;
  for (let i = 1; i < stops.length; i += 1) {
    if (Math.abs(stops[i] - at) < Math.abs(stops[best] - at)) best = i;
  }
  return best;
}

export function reelRelease(raw: number, velocity: number, stops: number[]) {
  const here = nearest(stops, raw);
  let target = nearest(stops, raw + velocity * FLING);
  if (target === here && Math.abs(velocity) > FLICK) {
    target = Math.min(Math.max(here + Math.sign(velocity), 0), stops.length - 1);
  }
  return stops[target];
}
