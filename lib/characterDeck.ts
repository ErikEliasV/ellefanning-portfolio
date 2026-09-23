// A geometria e o tempo do deck de CHARACTERS, sem tocar no DOM. Mesmo arranjo
// de lib/filmStage.ts: aqui moram os numeros, o hook so os le e os escreve como
// custom properties e medidas de card. Ter isto separado e o que deixa a
// coreografia conferivel sem abrir o hook.

import { clamp01, easeOut4, smootherstep } from "@/lib/filmStage";

// O limiar de tela estreita e o de lib/filmStage.ts, reexportado em vez de
// redeclarado: dois limiares iguais hoje sao dois limiares diferentes daqui a
// tres meses.
export { NARROW_QUERY, isNarrow } from "@/lib/filmStage";

export const COUNT = 8;

export type Geometry = {
  /** Largura sobre altura do card central. */
  cardRatio: number;
  /** Largura do lateral sobre a do central. */
  sideRatio: number;
  /** Altura do lateral sobre a do central. */
  sideTall: number;
  /** Raio sobre a largura do central. */
  radius: number;
  /** Centro vertical do deck, fracao da altura do palco. */
  deckY: number;
  /** Centros dos slots, em larguras do card central. */
  slots: readonly number[];
};

// 649x649 no centro e 299x649 nos lados, sobre canvas de 1920x1431 (no
// 2527:1629). Os slots sao os centros medidos -- 400,5, 566,5 e 715,5px do
// centro do palco -- divididos pela largura do central. Expressar o leque em
// larguras de card, e nao em vw, e o que o mantem igual a si mesmo em qualquer
// tela: as fatias visiveis que isto produz sao 225, 166 e 149px, que e
// exatamente o que se mede no no.
const WIDE: Geometry = {
  cardRatio: 1,
  sideRatio: 0.4607,
  sideTall: 1,
  radius: 0.1001,
  deckY: 0.5748,
  slots: [0, 0.6171, 0.8729, 1.1025],
};

// 243,527x413,098 no centro e 124,131x421,294 nos lados, sobre canvas de
// 402x874 (no 2527:1760). O leque e mais apertado -- 0,5107 contra 0,6171 no
// primeiro slot -- porque ali o card e retrato e nao quadrado: a mesma fatia
// visivel pede menos deslocamento.
const NARROW: Geometry = {
  cardRatio: 0.5896,
  sideRatio: 0.5097,
  sideTall: 1.0198,
  radius: 0.0871,
  deckY: 0.5335,
  slots: [0, 0.5107, 0.7762, 1.0417],
};

export function geometry(narrow: boolean): Geometry {
  return narrow ? NARROW : WIDE;
}

// Quanto de scroll cada personagem pede. Sao os numeros de lib/filmStage.ts, de
// proposito: vindo de dezesseis filmes a 0,6167 de tela cada, um passo
// diferente aqui nao leria como secao nova, leria como o site trocando de ritmo
// no meio da pagina.
const CYCLE_WIDE = 0.6167;
const CYCLE_NARROW = 0.34;
const CYCLE_REDUCED = 0.35;

// Dentro de cada ciclo, os primeiros 20% nao movem nada: e a trava.
const DWELL = 0.2;

// Quanto o card mais distante escurece. Nao ha blur aqui, e o reel de filmes
// tem: as fatias laterais medem 150px de largura e um desfoque de 9px as
// borraria umas nas outras. La os vizinhos sao cards inteiros a 48vw de
// distancia, e o desfoque tem onde acontecer.
const DIM = 0.28;

// Onde a copia espelhada comeca a aparecer, em unidades de offset. 0,75 poe o
// cruzamento no quarto externo do ultimo salto, com o card ainda estreito e em
// boa parte coberto pelo vizinho -- e nao sobre um rosto inteiro no centro da
// tela.
const MIRROR_FROM = 0.75;

// Quanto da fase `enter` o chao leva para terminar de virar tinta. Menos que a
// fase inteira: a troca de cor tem que acabar antes de a palavra assentar,
// senao o fundo ainda esta mudando quando o primeiro card ja chegou.
const FLOOR = 0.7;

// Deriva das duas palavras de fundo do celular, em vw por personagem. Sete
// travessias dao 42vw, que e o bastante para ler como movimento continuo num
// quadro de 402 de largura.
const DRIFT_VW = 6;

export type Span = { from: number; to: number };

export type Phases = {
  enter: Span;
  reel: Span;
  hold: Span;
  exit: Span;
  cycle: number;
};

export function phases(reduced: boolean, narrow: boolean): Phases {
  const cycle = reduced ? CYCLE_REDUCED : narrow ? CYCLE_NARROW : CYCLE_WIDE;
  // `k` encolhe so as fases de coreografia em volta do reel. O reel em si anda
  // pelo `cycle`, porque ele e a navegacao e nao a decoracao: encurta-lo em
  // movimento reduzido tiraria o acesso as oito personagens de quem pediu menos
  // movimento.
  const k = reduced ? 0.5 : narrow ? 0.7 : 1;

  const enter = { from: 0, to: 0.5 * k };
  const reel = { from: enter.to, to: enter.to + cycle * (COUNT - 1) };
  // O oitavo chega no instante final do reel e nao teria trava nenhuma. Esta
  // fase avulsa existe so para dar a ele o mesmo dwell dos outros sete.
  const hold = { from: reel.to, to: reel.to + cycle * DWELL };
  const exit = { from: hold.to, to: hold.to + 0.4 * k };

  return { enter, reel, hold, exit, cycle };
}

// Altura da trilha em multiplos de vh: o palco sticky (1) mais o percurso.
export function trackVh(reduced: boolean, narrow: boolean) {
  return 1 + phases(reduced, narrow).exit.to;
}

// O `p` em que o PRIMEIRO personagem esta travado, com a legenda ja assentada.
// E onde o link CHARACTERS do header pousa: o topo da secao e a tela ainda
// clara da emenda com a filmografia, e cair ali seria pousar no meio de uma
// transicao. O ponto e o MEIO do dwell, e nao a borda -- mesma razao do
// `lastLockAt` de lib/filmStage.ts: pousar na borda deixaria o destravamento a
// um pixel de scroll de distancia.
export function entryLockAt(reduced: boolean, narrow: boolean) {
  const f = phases(reduced, narrow);
  return f.reel.from + (f.cycle * DWELL) / 2;
}

function span(p: number, s: Span) {
  return clamp01((p - s.from) / (s.to - s.from));
}

// Uma smoothstep, e nao a curva de saida do resto do site. Aqui quem manda no
// tempo e o scroll, nao um relogio: e a unica das curvas do projeto que sai do
// zero e chega no um com a velocidade morrendo, que e o que faz a coisa
// acompanhar a mao em vez de parecer um valor sendo escrito.
function ease(t: number) {
  return t * t * (3 - 2 * t);
}

export type Cursor = {
  /** Posicao continua do reel, 0 a COUNT-1. Fica parada durante `exit`. */
  u: number;
  /** O indice vivo. Troca no meio da travessia, onde `settle` vale 0. */
  active: number;
  /** A entrada, 0 a 1. */
  enter: number;
  /** A saida, 0 a 1. */
  leave: number;
  /** Quanto o chao ja virou tinta, 0 a 1. */
  floor: number;
  /** Quanto a legenda esta assentada, 0 a 1. */
  settle: number;
  /** Deriva das palavras de fundo do celular, em vw. */
  drift: number;
};

export function cursor(p: number, reduced: boolean, narrow: boolean): Cursor {
  const f = phases(reduced, narrow);

  const enter = ease(span(p, f.enter));
  const leave = easeOut4(span(p, f.exit));
  const floor = clamp01(span(p, f.enter) / FLOOR);

  let u: number;
  // Fracao da travessia atual: 0 enquanto travado, 1 ao chegar na trava
  // seguinte. E dela que sai `settle`.
  let travel: number;

  if (p < f.reel.from) {
    u = 0;
    travel = 0;
  } else if (p < f.reel.to) {
    const raw = span(p, f.reel) * (COUNT - 1);
    const i = Math.min(Math.floor(raw), COUNT - 2);
    const frac = raw - i;
    const t = clamp01((frac - DWELL) / (1 - DWELL));
    u = i + smootherstep(t);
    travel = frac < DWELL ? 0 : t;
  } else {
    // Vale para `hold` e para `exit`: o oitavo fica travado no centro e quem
    // tira o deck de cena e a translacao da caixa inteira, pelo `leave`. Fazer
    // isso pelo `u` pediria um estouro de onze personagens inexistentes --
    // os slots se afastam do centro a 0,23 largura de card por unidade.
    u = COUNT - 1;
    travel = 0;
  }

  // 1 na trava, 0 no meio da travessia, 1 de novo na trava seguinte. O seno da
  // um vale simetrico com derivada nula nas duas pontas: a legenda some junto
  // com a foto que sai e volta com a que chega, sem as duas se cruzarem no
  // caminho. `enter` segura o comeco (nada de legenda durante a entrada) e
  // `1 - leave` a leva embora no fim.
  const settle = enter * (1 - Math.sin(Math.PI * travel)) * (1 - leave);

  // O arredondamento troca exatamente em u = i + 0,5, e smootherstep(0,5) vale
  // 0,5, entao a troca cai no mesmo instante em que `settle` vale 0: o texto da
  // legenda muda enquanto ela esta invisivel, nunca a vista.
  const active = Math.min(Math.max(Math.round(u), 0), COUNT - 1);

  return { u, active, enter, leave, floor, settle, drift: u * DRIFT_VW };
}

// A posicao do slot para uma distancia real, nao inteira: a tabela medida com
// interpolacao linear entre as entradas. Alem da ultima a reta continua com a
// inclinacao do ultimo trecho -- o card so precisa ter de onde vir, porque ali
// ele ja nao e desenhado.
export function slotAt(d: number, g: Geometry) {
  const last = g.slots.length - 1;
  if (d >= last) {
    return g.slots[last] + (d - last) * (g.slots[last] - g.slots[last - 1]);
  }
  const i = Math.floor(d);
  return g.slots[i] + (g.slots[i + 1] - g.slots[i]) * (d - i);
}

// Quanto da copia espelhada aparece. No Figma os cards da direita estao
// espelhados e os da esquerda e o do centro nao; e o que deixa o leque
// simetrico. Esquerda e centro ficam em 0, a direita inteira a partir de um
// salto de distancia fica em 1, e entre 0,75 e 1 as duas copias se cruzam.
export function mirror(offset: number) {
  return offset <= 0 ? 0 : clamp01((offset - MIRROR_FROM) / (1 - MIRROR_FROM));
}

export type Depth = {
  /** Deslocamento do centro, em larguras do card central. */
  x: number;
  /** Largura, em fracao da largura do card central. */
  width: number;
  /** Altura, em fracao da altura do card central. */
  height: number;
  dim: number;
  mirror: number;
  z: number;
  /** Fora da janela de render o card nao e desenhado. */
  live: boolean;
};

export function depth(i: number, u: number, g: Geometry): Depth {
  const offset = i - u;
  const d = Math.abs(offset);
  const c = clamp01(d);
  return {
    x: Math.sign(offset) * slotAt(d, g),
    // O card nao escala: ele ABRE. No Figma o lateral e o central tem a mesma
    // altura e larguras diferentes, entao o que anda entre os dois e a largura,
    // com a foto em object-fit: cover recortando de novo a cada passo. Um
    // scaleX esticaria o rosto.
    width: 1 + (g.sideRatio - 1) * c,
    height: 1 + (g.sideTall - 1) * c,
    dim: 1 - DIM * c,
    mirror: mirror(offset),
    // O centro por cima, cada card sobre o vizinho mais externo. Inteiro
    // porque z-index nao aceita fracao.
    z: 100 - Math.round(d * 10),
    live: d <= g.slots.length - 1,
  };
}
