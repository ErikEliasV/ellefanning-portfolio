// O contorno do vidro e um retangulo em repouso. A unica deformacao e uma
// bolha que segue o ponteiro e empurra a borda **para fora**, como um dedo por
// baixo de um tecido: nunca afunda, e nunca mexe no que esta longe dele.
const SPAN_STEPS = 34;
const SIDE_STEPS = 12;
// Fracao de cada aresta em que a normal gira para a diagonal da quina. Sem
// isso a direcao vira 90 graus de uma vez e a quina da um bico.
const BLEND = 0.12;
// A bolha respira. So a bolha: o resto do contorno fica parado.
const BREATH = 0.1;
const BREATH_SPEED = 0.75;
// A gota da barra recolhida: exp(-k^2) amostrada em k = 0, 0.3, ... 2.4, com
// os MESMOS numeros e os mesmos passos do polygon de repouso em
// styles/header.css, e ligada em reta entre as amostras como la. Quando a
// bolha do ponteiro chega a zero e o recorte volta ao CSS, os dois desenhos
// sao o mesmo poligono -- a passagem nao tem salto.
const DROP = [1, 0.914, 0.698, 0.445, 0.237, 0.105, 0.039, 0.012, 0];
const DROP_STEP = 0.3;
// Meia largura da gota em multiplos de --hdr-bump-w (o 2.4 do polygon): quem
// a move precisa disso para ela nao passar da quina da barra.
export const DROP_SPAN = (DROP.length - 1) * DROP_STEP;

export type Goo = {
  width: number;
  // Folgas da caixa: a bolha precisa de espaco para sair do retangulo.
  wing: number;
  lip: number;
  reveal: number;
  // Altura maxima da bolha, em pixels, e o raio em que ela morre.
  amp: number;
  reach: number;
  time: number;
  // Ponteiro em coordenadas da caixa, ja suavizado.
  x: number;
  y: number;
  // Quanto cada borda pode avancar antes de sair da caixa ou da viewport.
  roof: number;
  floor: number;
  side: number;
  // Altura da gota da borda de baixo (o --hdr-bump ja em transicao), o passo
  // da gaussiana que a desenha (--hdr-bump-w) e onde ela pende, em x da caixa
  // (o mesmo --hdr-drop-x do CSS).
  drop: number;
  dropW: number;
  dropX: number;
};

// Satura no limite em vez de bater nele: um Math.min acharia a crista num
// plato reto, que e exatamente o que nao pode parecer liquido.
function soft(v: number, cap: number) {
  return cap > 0 ? cap * Math.tanh(v / cap) : 0;
}

// Quanto a gota desce a `dx` pixels do ponto de onde ela pende.
function dropAt(dx: number, drop: number, dropW: number) {
  if (drop <= 0 || dropW <= 0) return 0;
  const k = Math.abs(dx) / dropW / DROP_STEP;
  const i = Math.floor(k);
  if (i >= DROP.length - 1) return 0;
  return drop * (DROP[i] + (DROP[i + 1] - DROP[i]) * (k - i));
}

// -1 na ponta inicial da aresta, +1 na final, 0 no miolo.
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

  // A borda de baixo e amostrada no passo de sempre e, com gota, tambem nas
  // amostras dela: sao os vertices do polygon do CSS, e sem eles a gota sairia
  // com a resolucao grossa do resto da aresta.
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
