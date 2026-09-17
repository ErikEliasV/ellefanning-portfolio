// Todo o palco é função de `p`: a posição de scroll em múltiplos de altura de
// viewport, medida a partir do topo da trilha. Negativo quer dizer que a trilha
// ainda não alcançou o topo — é lá que a cortina age, sobre a hero visível.

export type Geometry = {
  widthVw: number;
  ratio: number;
  pitchVw: number;
  splitVw: number;
};

// 539 × 812 sobre canvas de 1920 × 1083, centro exato do quadro. O passo de
// 0.48 é 1881.5 − 960.5 = 921 entre centros de vizinhos, e o split é metade do
// vão de 665 entre as palavras.
const WIDE: Geometry = { widthVw: 0.281, ratio: 812 / 539, pitchVw: 0.48, splitVw: 0.173 };

// Abaixo de 64rem o vão de 0.173 são 65px a 375 de largura e nenhum pôster
// entra ali. A lógica se inverte: a palavra fica proporcionalmente maior que o
// vão e o pôster sobrepõe as duas metades já em repouso, o que torna o recorte
// branco permanente em vez de momentâneo.
const NARROW: Geometry = { widthVw: 0.58, ratio: 812 / 539, pitchVw: 0.82, splitVw: 0.04 };

// Fonte única da geometria. O CSS não declara nenhuma destas medidas: custom
// property não resolve unidade, então o JS não conseguiria ler `48vw` de volta,
// e uma media query sobrescrevendo o passo deixaria o CSS e o JS discordando
// sobre onde cada card está.
export function geometry(narrow: boolean): Geometry {
  return narrow ? NARROW : WIDE;
}

export const NARROW_QUERY = "(width < 64rem)";

export const COUNT = 16;

// Dentro de cada ciclo, os primeiros 45% de scroll não movem nada: é a trava.
const DWELL = 0.45;
// 0.58 em d = 1, que é exatamente 313/539 do Figma.
const DEPTH_SCALE = 0.42;
const DEPTH_BLUR = 9;

export function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function easeOut4(x: number) {
  return 1 - Math.pow(1 - x, 4);
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

// Movimento reduzido não pode apagar o mapeamento — ele É a navegação. Encolhe:
// o ciclo cai de 0.6167 para 0.35 e as fases de coreografia caem pela metade,
// porque prender quem pediu menos movimento em doze telas contraria o pedido.
export function phases(reduced: boolean): Phases {
  const cycle = reduced ? 0.35 : 0.6167;
  const k = reduced ? 0.5 : 1;

  const curtain = { from: -1.0 * k, to: -0.35 * k };
  const rise = { from: curtain.to, to: curtain.to + 0.5 * k };
  const open = { from: rise.to, to: rise.to + 0.5 * k };
  const reel = { from: open.to, to: open.to + cycle * (COUNT - 1) };
  const hold = { from: reel.to, to: reel.to + cycle * DWELL };
  const exit = { from: hold.to, to: hold.to + 0.4 * k };
  const close = { from: exit.to, to: exit.to + 0.35 * k };
  const fall = { from: close.to, to: close.to + 0.35 * k };
  const reveal = { from: fall.to, to: fall.to + 0.3 * k };

  return { curtain, rise, open, reel, hold, exit, close, fall, reveal, cycle };
}

// Altura da trilha em múltiplos de vh: o palco sticky (1) mais o percurso.
export function trackVh(reduced: boolean) {
  return 1 + phases(reduced).reveal.to;
}

function span(p: number, s: Span) {
  return clamp01((p - s.from) / (s.to - s.from));
}

export type Cursor = {
  /** Posição contínua do reel. 0 = 1º travado, 15 = 16º travado, 16 = fora. */
  u: number;
  /** Índice travado neste instante, ou -1 se algo está em trânsito. */
  lock: number;
  curtain: number;
  rise: number;
  split: number;
  /** Subida vertical do 1º pôster pelo vão, 0 a 1. */
  enter: number;
  fall: number;
  reveal: number;
};

export function cursor(p: number, reduced: boolean): Cursor {
  const f = phases(reduced);

  const curtain = span(p, f.curtain);
  const rise = span(p, f.rise);

  // O vão abre na fase `open` e fecha na `close`. As duas não se sobrepõem, e
  // é essa a razão de a subtração bastar: durante a abertura `closed` é 0, e
  // durante o fechamento `opened` já saturou em 1, então o vão anda de 1 a 0.
  const opened = span(p, f.open);
  const closed = span(p, f.close);
  const split = opened - closed;

  // O pôster sobe na segunda metade da abertura: a palavra abre, o filme sobe
  // pelo vão que ela acabou de abrir. Sai de `opened`, não de `split`, senão o
  // fechamento no fim da seção faria o primeiro pôster subir de novo.
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
    u = i + easeOut4(clamp01((frac - DWELL) / (1 - DWELL)));
    lock = frac < DWELL ? i : -1;
  } else if (p < f.hold.to) {
    // O 16º chega no instante final do reel e não teria trava nenhuma. Esta
    // fase avulsa existe só para dar a ele o mesmo dwell dos outros quinze.
    u = COUNT - 1;
    lock = COUNT - 1;
  } else {
    u = COUNT - 1 + easeOut4(span(p, f.exit));
    lock = -1;
  }

  return { u, lock, curtain, rise, split, enter, fall, reveal };
}

export type Depth = {
  /** Deslocamento horizontal do centro, em múltiplos de pitch. */
  offset: number;
  scale: number;
  blur: number;
  /** Fora da janela de render o card não é desenhado. */
  live: boolean;
};

export function depth(i: number, u: number): Depth {
  const offset = i - u;
  const d = clamp01(Math.abs(offset));
  return {
    offset,
    scale: 1 - DEPTH_SCALE * d,
    blur: DEPTH_BLUR * d,
    live: Math.abs(offset) <= 2,
  };
}
