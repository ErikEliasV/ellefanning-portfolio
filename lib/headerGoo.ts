// A silhueta do vidro, desenhada ponto a ponto. As duas bordas horizontais
// cedem na direcao do ponteiro, e quem cede e a que ele esta rondando: perto do
// topo, o topo incha para cima; perto da base, a base escorre para baixo.
const COLS = 40;
const SIDES = 10;
const SIDE_GAIN = 0.8;
const PULL_GAIN = 2.4;
// Largura da bolha que segue o ponteiro. Larga de proposito: estreita vira
// bico, larga vira massa.
const PULL_WIDTH = 0.05;
// O topo tem menos folga que a base antes de bater na viewport, entao puxa um
// pouco menos.
const PULL_UP = 0.8;
// Quao rapido a adesao de uma borda morre conforme o ponteiro se afasta dela.
const GRIP = 1.5;
const CREST_GAIN = 0.5;

export type Goo = {
  width: number;
  // Teto e chao do que cada borda pode avancar. O topo tem pouco: alem da
  // folga ele sai pela viewport. A base tem de sobra.
  roof: number;
  floor: number;
  // Folga acima da barra, onde o topo tem para onde inchar.
  lip: number;
  // Altura visivel do vidro, contada a partir de lip.
  reveal: number;
  amp: number;
  time: number;
  // Ponteiro em x dentro da caixa, 0 a 1.
  at: number;
  // Ponteiro em y dentro do vidro, 0 no topo, 1 na base.
  near: number;
};

// Tres senos em frequencias que nao sao multiplas entre si, para a onda nunca
// repetir visivelmente o proprio periodo. As velocidades sao baixas: o desenho
// e agressivo, o movimento e que tem de ser lento.
function crest(u: number, time: number) {
  return (
    Math.sin(u * 6.1 + time * 0.85) * 0.6 +
    Math.sin(u * 11.3 - time * 0.58) * 0.28 +
    Math.sin(u * 3.1 + time * 0.31) * 0.42
  );
}

function flank(v: number, time: number, way: number) {
  return SIDE_GAIN * (0.5 + 0.5 * Math.sin(v * 7.7 + time * 0.7 * way));
}

function pull(u: number, at: number) {
  return Math.exp(-((u - at) ** 2) / PULL_WIDTH);
}

// Satura no limite em vez de bater nele: um Math.min acharia a crista num
// plato reto, que e exatamente o que nao pode parecer liquido.
function soft(v: number, cap: number) {
  return cap > 0 ? cap * Math.tanh(v / cap) : 0;
}

export function gooPath({
  width,
  roof,
  floor,
  lip,
  reveal,
  amp,
  time,
  at,
  near,
}: Goo) {
  const base = lip + reveal;
  const up = Math.max(0, 1 - near * GRIP);
  const down = Math.max(0, 1 - (1 - near) * GRIP);

  const pts: string[] = [];

  for (let i = 0; i <= COLS; i++) {
    const u = i / COLS;
    // O deslocamento de fase separa a onda do topo da onda da base, senao as
    // duas respiram juntas e a faixa inteira parece um retangulo balancando.
    const rise =
      amp *
      (crest(u, time + 11) * CREST_GAIN +
        pull(u, at) * PULL_GAIN * up * PULL_UP);
    pts.push(`${(u * width).toFixed(1)}px ${(lip - soft(rise, roof)).toFixed(1)}px`);
  }

  for (let i = 1; i < SIDES; i++) {
    const v = i / SIDES;
    const inset = amp * flank(v, time, 1);
    pts.push(
      `${(width - inset).toFixed(1)}px ${(lip + reveal * v).toFixed(1)}px`,
    );
  }

  for (let i = COLS; i >= 0; i--) {
    const u = i / COLS;
    const sag =
      amp * (crest(u, time) * CREST_GAIN + pull(u, at) * PULL_GAIN * down);
    pts.push(
      `${(u * width).toFixed(1)}px ${(base + soft(sag, floor)).toFixed(1)}px`,
    );
  }

  for (let i = SIDES - 1; i >= 1; i--) {
    const v = i / SIDES;
    const inset = amp * flank(v, time, -1);
    pts.push(`${inset.toFixed(1)}px ${(lip + reveal * v).toFixed(1)}px`);
  }

  return `polygon(${pts.join(",")})`;
}
