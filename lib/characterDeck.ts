// A geometria e o tempo do deck de CHARACTERS, sem tocar no DOM. Mesmo arranjo
// de lib/filmStage.ts: aqui moram os numeros, o hook so os le e os escreve como
// custom properties e medidas de card. Ter isto separado e o que deixa a
// coreografia conferivel sem abrir o hook.

import { CHARACTERS } from "@/lib/characters";
import { clamp01, easeOut4, smootherstep } from "@/lib/filmStage";

// O limiar de tela estreita e o de lib/filmStage.ts, reexportado em vez de
// redeclarado: dois limiares iguais hoje sao dois limiares diferentes daqui a
// tres meses.
export { NARROW_QUERY, isNarrow } from "@/lib/filmStage";

// Derivado, e nao 8 cravado. Antes havia duas fontes de verdade -- este modulo
// dizia 8 e o palco passava `characters.length`. Apagar uma personagem de
// lib/characters.ts deixava `active` valendo 7 com sete na lista, e `now.name`
// estourava em tempo de render numa posicao especifica de scroll, sem que o
// TypeScript pudesse ver; acrescentar uma a deixava inalcancavel em silencio.
// Derivar torna a divergencia impossivel em vez de detectavel.
//
// O preco e o modulo de geometria importar o de dados, e ele e aceitavel:
// lib/characters.ts e dado puro, sem DOM e sem React, e a checagem continua
// rodando no node sem nada em volta.
export const COUNT = CHARACTERS.length;

export type Geometry = {
  /** Largura do lateral sobre a do central. So o CSS le. */
  sideRatio: number;
  /** Altura do lateral sobre a do central. So o CSS le. */
  sideTall: number;
  /** Passo angular por personagem, em graus. E a derivada do arco em zero. */
  step: number;
  /** Onde o arco satura e as fotos passam a se empilhar, em graus. */
  thetaMax: number;
  /** Raio do arco, em larguras do card central. */
  radius: number;
  /** Queda lateral, em alturas do card central. Positivo desce. */
  drop: number;
  /** Escrita no deck como --persp, em px. */
  perspective: number;
  /** Desfoque da foto mais distante, em px. */
  blurMax: number;
};

// Numeros de PARTIDA, para afinar a olho contra a captura do no -- e nao
// medidas extraidas dele. A razao esta na spec §4.3 e vale repetir aqui, porque
// e a primeira pergunta de quem le este bloco: os tres slots do Figma
// (0,6171 / 0,8729 / 1,1025 larguras de card) NAO sao a projecao de um circulo.
// As duas primeiras distancias implicam 2*cos(passo) = 1,4145, ou seja um passo
// de 45 graus; nesse passo a terceira teria que valer sin(135)/sin(45) = 1,0, e
// o no diz 1,102. O no e uma maquete plana de um movimento que ele nao sabia
// expressar. O quadro parado aproxima o no; nao bate com ele ao pixel.
//
// Estes valores foram rodados num script antes de entrar. No perfil largo, com
// card de 564px, eles produzem as tres fatias que o no desenha e a pilha que a
// §4.1.1 pede:
//
//   distancia      1     2    3    4    5   6   7
//   passo (px)   334   208   93   34   12   4   1
//   queda (px)     6    21   37   49   56  61  64
//
// As tres primeiras espiam, a quarta mal aparece, e da quinta em diante o passo
// e de pixels: coberta. Mexer em qualquer um destes sete mexe na composicao
// inteira, e e por isso que eles estao todos juntos num lugar so.
const WIDE: Geometry = {
  sideRatio: 0.4607,
  sideTall: 1,
  step: 20,
  thetaMax: 66,
  radius: 1.85,
  drop: 0.18,
  perspective: 1600,
  blurMax: 10,
};

// O telefone quer o arco mais curto e mais apertado: ha menos largura para ele
// acontecer, e uma perspectiva longa ali acha o movimento pequeno. O desfoque
// cai porque as fatias tambem sao menores e um borrao de 10px as apagaria.
const NARROW: Geometry = {
  sideRatio: 0.5097,
  sideTall: 1.0198,
  step: 22,
  thetaMax: 64,
  radius: 1.6,
  drop: 0.14,
  perspective: 1100,
  blurMax: 6,
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

// Quanto o card mais distante escurece. Anda junto com o desfoque: os dois sao
// profundidade, um em luz e outro em foco.
const DIM = 0.28;

// Degraus de meio pixel no desfoque. `filter: blur()` cujo raio muda a cada
// quadro forca rerasterizacao; quantizado, o valor muda raramente em vez de
// sempre. Foi a condicao para o desfoque progressivo entrar no desenho: a
// objecao original -- fatias estreitas borrando uma na outra -- nao desapareceu,
// virou tratamento.
const BLUR_STEP = 0.5;

const DEG = Math.PI / 180;

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
    // -1 a 0, e nao 0 fixo: em u = -1 a primeira personagem esta a um passo da
    // direita, ou seja, as oito estao no monte e e de la que ela sai para o
    // centro. Era isto que faltava para "no comeco tudo num canto so".
    u = -1 + enter;
    travel = 0;
  } else if (p < f.reel.to) {
    const raw = span(p, f.reel) * (COUNT - 1);
    const i = Math.min(Math.floor(raw), COUNT - 2);
    const frac = raw - i;
    const t = clamp01((frac - DWELL) / (1 - DWELL));
    u = i + smootherstep(t);
    travel = frac < DWELL ? 0 : t;
  } else {
    // COUNT-1 a COUNT: durante `hold` o oitavo fica travado no centro, e
    // durante `exit` ele entra no monte da esquerda enquanto o deck inteiro sai
    // de cena pela translacao da caixa. Simetrico com a entrada -- os dois
    // extremos deixam tudo num canto so.
    u = COUNT - 1 + leave;
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

  // A deriva nao acompanha o `u` negativo da entrada: as palavras de fundo
  // comecariam deslocadas 6vw sem razao nenhuma.
  return { u, active, enter, leave, floor, settle, drift: Math.max(0, u) * DRIFT_VW };
}

// A posicao de uma foto no arco, em funcao da distancia assinada ao centro.
//
// A tanh e a peca central e resolve dois pedidos com uma conta so. Perto do
// centro ela e praticamente linear -- a derivada em zero e exatamente `step`,
// entao a foto percorre o arco com o passo pedido. Longe, satura em `thetaMax`,
// e e isso que faz as fotos que ja passaram PARAREM de se afastar e se
// acumularem na borda, uma cobrindo a outra. Sem a saturacao, um cilindro de
// verdade levaria as fotos para tras da cena e elas voltariam pelo outro lado.
//
// O monte nao espalha, ele COBRE: no perfil largo os passos entre vizinhas caem
// para 34, 12, 4 e 1px da quarta em diante. As tres de cima espiam, que e o que
// o no do Figma desenha, e o resto fica atras. Nao ha corte nem regra de
// "esconder alem de N" -- a saturacao produz isso sozinha, e foi justamente um
// corte desses, na versao anterior, que fazia as fotos sumirem em vez de
// empilhar (e que derrubava o foco do teclado junto).
//
// `y` positivo desce: o centro e o ponto alto da curva. Foi escolha do dono do
// projeto entre as tres possiveis; o no estatico, com tudo na mesma altura, nao
// decidia.
export function arc(offset: number, g: Geometry) {
  const theta = g.thetaMax * Math.tanh((offset * g.step) / g.thetaMax);
  const r = theta * DEG;
  return {
    /** Graus. */
    theta,
    /** Em larguras do card central. */
    x: g.radius * Math.sin(r),
    /** Em alturas do card central, positivo para baixo. */
    y: g.drop * (1 - Math.cos(r)),
    /** Em larguras do card central, sempre <= 0. */
    z: g.radius * (Math.cos(r) - 1),
  };
}

export type Depth = {
  theta: number;
  x: number;
  y: number;
  z: number;
  /** px, ja quantizado em degraus de meio pixel. */
  blur: number;
  dim: number;
};

// Nao devolve mais `live` nem `z-index`, e as duas ausencias sao a mudanca.
//
// `live` cortava tudo alem da terceira posicao. Era ela que fazia as fotos
// sumirem em vez de empilhar, e era ela que derrubava o foco do teclado: um
// card escondido com o foco dentro faz o browser soltar o foco para o <body>.
//
// `z-index` deixou de ser necessario porque o trilho e `preserve-3d`: ali os
// filhos sao ordenados pela POSICAO em profundidade, nao por z-index. Como `z`
// vale 0 no centro e fica mais negativo quanto mais na ponta, o centro e o mais
// proximo e pinta por cima, e cada foto pinta sobre a vizinha mais externa. No
// monte, duas vizinhas tem angulos quase iguais, mas a que passou mais
// recentemente tem |theta| menor, logo z menos negativo, logo esta na frente. A
// ordem que a versao anterior escrevia a mao virou consequencia da geometria.
export function depth(i: number, u: number, g: Geometry): Depth {
  const offset = i - u;
  const d = Math.abs(offset);
  const a = arc(offset, g);
  const blur = g.blurMax * clamp01(d / 3);
  return {
    ...a,
    blur: Math.round(blur / BLUR_STEP) * BLUR_STEP,
    dim: 1 - DIM * clamp01(d),
  };
}
