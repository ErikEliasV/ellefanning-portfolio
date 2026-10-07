export const LENS = 128;
export const BOX = 512;

export const BEND = 26;

const MAG = 0.22;
const RIM = 4.2;

const TAIL = 2.5;
const TIP = 0.3;
const NECK = 0.35;
const HEAD = 0.16;

const R = LENS / 2;
const C = BOX / 2;

function bend(r: number) {
  return MAG * r + (1 - MAG) * r ** RIM;
}

export function lensMap() {
  const canvas = document.createElement("canvas");
  canvas.width = BOX;
  canvas.height = BOX;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const image = ctx.createImageData(BOX, BOX);

  for (let y = 0; y < BOX; y++) {
    for (let x = 0; x < BOX; x++) {
      const nx = (x + 0.5 - C) / R;
      const ny = (y + 0.5 - C) / R;
      const r = Math.hypot(nx, ny);
      const k = r > 0 ? bend(Math.min(r, 1)) / r : 0;
      const at = (y * BOX + x) * 4;

      image.data[at] = Math.round(128 - Math.max(-1, Math.min(1, nx * k)) * 127);
      image.data[at + 1] = Math.round(128 - Math.max(-1, Math.min(1, ny * k)) * 127);
      image.data[at + 2] = 128;
      image.data[at + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

const fix = (n: number) => n.toFixed(2);

export function dropPath(turn: number, stretch: number) {
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const sx = 1 + HEAD * stretch;
  const sy = 1 - HEAD * 0.5 * stretch;
  const tilt = fix((turn * 180) / Math.PI);

  const at = (u: number, v: number) => {
    const x = u * sx;
    const y = v * sy;
    return `${fix(C + x * cos - y * sin)} ${fix(C + x * sin + y * cos)}`;
  };

  const lobe = `A ${fix(R * sx)} ${fix(R * sy)} ${tilt} 1 0`;
  const pull = Math.max(stretch, 0);
  const back = R * TAIL * pull;

  if (back < 0.5) {
    return `M ${at(R, 0)} ${lobe} ${at(-R, 0)} ${lobe} ${at(R, 0)} Z`;
  }

  const tip = R * (1 - (1 - TIP) * pull);
  const side = Math.acos(-(R - tip) / back);
  const bow = NECK * pull;
  const head = side + bow;
  const tail = side - bow;

  const hu = R * Math.cos(head);
  const hv = R * Math.sin(head);
  const tu = -back + tip * Math.cos(tail);
  const tv = tip * Math.sin(tail);
  const grip = Math.hypot(tu - hu, tv - hv) * 0.36;
  const hcu = hu - grip * Math.sin(head);
  const hcv = hv + grip * Math.cos(head);
  const tcu = tu + grip * Math.sin(tail);
  const tcv = tv - grip * Math.cos(tail);

  const wide = 2 * Math.PI - 2 * tail > Math.PI ? 1 : 0;
  const cap = `A ${fix(tip * sx)} ${fix(tip * sy)} ${tilt} ${wide} 0`;

  return [
    `M ${at(hu, hv)}`,
    `${lobe} ${at(hu, -hv)}`,
    `C ${at(hcu, -hcv)} ${at(tcu, -tcv)} ${at(tu, -tv)}`,
    `${cap} ${at(tu, tv)}`,
    `C ${at(tcu, tcv)} ${at(hcu, hcv)} ${at(hu, hv)}`,
    "Z",
  ].join(" ");
}
