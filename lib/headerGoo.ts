// A silhueta do vidro, desenhada ponto a ponto. O topo fica reto porque e a
// aresta que encosta na moldura da pagina; os lados ondulam para dentro e a
// base e onde a gosma realmente escorre.
const COLS = 30;
const SIDES = 6;
const SIDE_GAIN = 0.34;
const PULL_GAIN = 1.15;
const PULL_WIDTH = 0.022;

export type Goo = {
  width: number;
  reveal: number;
  amp: number;
  time: number;
  // Onde o ponteiro esta na horizontal, 0 a 1: a base cede mais debaixo dele.
  at: number;
};

// Tres senos em frequencias que nao sao multiplas entre si, para a onda nunca
// repetir visivelmente o proprio periodo.
function crest(u: number, time: number) {
  return (
    Math.sin(u * 6.1 + time * 1.9) * 0.6 +
    Math.sin(u * 11.3 - time * 1.3) * 0.28 +
    Math.sin(u * 3.1 + time * 0.7) * 0.42
  );
}

function flank(v: number, time: number, way: number) {
  return SIDE_GAIN * (0.5 + 0.5 * Math.sin(v * 7.7 + time * 1.6 * way));
}

export function gooPath({ width, reveal, amp, time, at }: Goo) {
  const pts: string[] = ["0px 0px", `${width.toFixed(1)}px 0px`];

  for (let i = 1; i <= SIDES; i++) {
    const v = i / SIDES;
    const inset = amp * flank(v, time, 1);
    pts.push(`${(width - inset).toFixed(1)}px ${(reveal * v).toFixed(1)}px`);
  }

  for (let i = COLS; i >= 0; i--) {
    const u = i / COLS;
    const pull = Math.exp(-((u - at) ** 2) / PULL_WIDTH) * PULL_GAIN;
    const y = reveal + amp * (crest(u, time) + pull);
    pts.push(`${(u * width).toFixed(1)}px ${y.toFixed(1)}px`);
  }

  for (let i = SIDES - 1; i >= 1; i--) {
    const v = i / SIDES;
    const inset = amp * flank(v, time, -1);
    pts.push(`${inset.toFixed(1)}px ${(reveal * v).toFixed(1)}px`);
  }

  return `polygon(${pts.join(",")})`;
}
