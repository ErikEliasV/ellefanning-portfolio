const SPAN_STEPS = 34;
const SIDE_STEPS = 12;
const BLEND = 0.12;
const BREATH = 0.1;
const BREATH_SPEED = 0.75;
const DROP = [1, 0.914, 0.698, 0.445, 0.237, 0.105, 0.039, 0.012, 0];
const DROP_STEP = 0.3;
export const DROP_SPAN = (DROP.length - 1) * DROP_STEP;

export type Goo = {
  width: number;
  wing: number;
  lip: number;
  reveal: number;
  amp: number;
  reach: number;
  time: number;
  x: number;
  y: number;
  roof: number;
  floor: number;
  side: number;
  drop: number;
  dropW: number;
  dropX: number;
};

function soft(v: number, cap: number) {
  return cap > 0 ? cap * Math.tanh(v / cap) : 0;
}

function dropAt(dx: number, drop: number, dropW: number) {
  if (drop <= 0 || dropW <= 0) return 0;
  const k = Math.abs(dx) / dropW / DROP_STEP;
  const i = Math.floor(k);
  if (i >= DROP.length - 1) return 0;
  return drop * (DROP[i] + (DROP[i + 1] - DROP[i]) * (k - i));
}

function bend(t: number) {
  if (t < BLEND) return t / BLEND - 1;
  if (t > 1 - BLEND) return (t - 1 + BLEND) / BLEND;
  return 0;
}

export function gooPath({
  width,
  wing,
  lip,
  reveal,
  amp,
  reach,
  time,
  x,
  y,
  roof,
  floor,
  side,
  drop,
  dropW,
  dropX,
}: Goo) {
  const left = wing;
  const right = width - wing;
  const top = lip;
  const bottom = lip + reveal;
  const span = right - left;
  const swell = amp * (1 + BREATH * Math.sin(time * BREATH_SPEED));

  const pts: string[] = [];

  function lift(px: number, py: number, nx: number, ny: number, cap: number) {
    const k = Math.hypot(px - x, py - y) / reach;
    const rise = soft(swell * Math.exp(-k * k), cap);
    const len = Math.hypot(nx, ny) || 1;
    const ox = px + (nx / len) * rise;
    const oy = py + (ny / len) * rise;
    pts.push(`${ox.toFixed(1)}px ${oy.toFixed(1)}px`);
  }

  for (let i = 0; i <= SPAN_STEPS; i++) {
    const t = i / SPAN_STEPS;
    lift(left + span * t, top, bend(t), -1, roof);
  }

  for (let i = 1; i < SIDE_STEPS; i++) {
    const t = i / SIDE_STEPS;
    lift(right, top + reveal * t, 1, bend(t), side);
  }

  const floorXs: number[] = [];
  for (let i = 0; i <= SPAN_STEPS; i++) floorXs.push(left + span * (i / SPAN_STEPS));
  if (drop > 0) {
    const last = DROP.length - 1;
    for (let i = -last; i <= last; i++) floorXs.push(dropX + i * DROP_STEP * dropW);
  }
  floorXs.sort((a, b) => b - a);

  for (const px of floorXs) {
    const t = (px - left) / span;
    lift(px, bottom + dropAt(px - dropX, drop, dropW), bend(t), 1, floor);
  }

  for (let i = SIDE_STEPS - 1; i >= 1; i--) {
    const t = i / SIDE_STEPS;
    lift(left, top + reveal * t, -1, bend(t), side);
  }

  return `polygon(${pts.join(",")})`;
}
