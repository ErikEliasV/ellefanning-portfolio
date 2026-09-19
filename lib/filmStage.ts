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

// O limiar (em `p` absoluto, não escalado por `k`) em que a cortina sai do
// caminho. `p = 0` é geométrico — é onde o palco sticky passa a cobrir o
// viewport inteiro, não depende de `phases()` — e 0.02 é a folga contada a
// partir daí (era 0.05; encolhida a pedido — a palavra não precisa esperar a
// tela ficar perfeitamente branca e parada, só o mínimo para o palco sticky
// travar antes da cortina sumir). `rise` usa esta mesma constante como
// início: a subida da palavra só pode começar quando a cortina já saiu,
// senão 80% dela acontece atrás da chapa branca e a palavra "aparece do
// nada" quase no lugar final. Ver o comentário maior em
// `lib/useFilmStage.ts` junto ao `dataset.on`.
export const CURTAIN_OUT = 0.02;

// Dentro de cada ciclo, os primeiros 20% de scroll não movem nada: é a trava.
// Era 45% — quase metade do ciclo sem responder ao scroll lia como duro/preso
// em vez de solto. 20% ainda trava de verdade no centro, mas devolve 80% do
// ciclo ao movimento.
const DWELL = 0.2;
// 0.58 em d = 1, que é exatamente 313/539 do Figma.
const DEPTH_SCALE = 0.42;
const DEPTH_BLUR = 9;

export function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function easeOut4(x: number) {
  return 1 - Math.pow(1 - x, 4);
}

// Derivada zero nos DOIS extremos (e a segunda derivada também), não só na
// chegada como `easeOut4`. É o que faz o card sair do platô deslizando em vez
// de arrancar, e chegar planando em vez de frear de repente. Usada só na
// viagem entre travas do reel — `easeOut4` continua sendo a curva do resto do
// palco (a saída do 16º filme, por exemplo, quer arrancar).
export function smootherstep(x: number) {
  // clamp01 no retorno, não só na entrada: perto de x = 1 a soma de termos de
  // magnitude 6, 15 e 10 cancela por ponto flutuante e pode passar de 1 por
  // ~1e-15 (ex.: 1.0000000000000013). Matematicamente a curva nunca sai de
  // [0, 1]; isto só fecha a folga que o hardware abre.
  return clamp01(x * x * x * (x * (x * 6 - 15) + 10));
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

  // `curtain.to` era -1.0*k -> -0.35*k, depois -0.7*k -> -0.2*k: a cortina
  // saturava e ficava parada, branca, sem nada acontecendo, até `rise.from`
  // soltar a palavra. Trazer `to` para bem perto do limiar (sem ultrapassá-lo
  // — ver a invariante abaixo) praticamente fecha essa folga parada, e
  // `curtain.from` acompanha, então a cortina inteira leva bem menos scroll
  // para cobrir a tela e soltar o texto.
  const curtain = { from: -0.4 * k, to: -0.05 * k };
  // `rise` começa em CURTAIN_OUT, não em `curtain.to`: o limiar da cortina é
  // fixo (ponto geométrico, não uma duração de coreografia), então não pode
  // escalar por `k` — em movimento reduzido `CURTAIN_OUT * k` cairia para
  // 0.01, antes de a cortina sair em 0.02, e reintroduziria o bug só nesse
  // modo. Só a duração da subida (o `0.5 * k` abaixo) escala; o início, não.
  // Isso abre um vão proposital entre `curtain.to` e `rise.from` — a cortina
  // já saturou e continua cobrindo a tela até o limiar geométrico soltá-la.
  // (curtain.to precisa continuar <= CURTAIN_OUT, ou a palavra começaria a
  // subir atrás da cortina ainda fechada — ver invariante em check.ts.)
  const rise = { from: CURTAIN_OUT, to: CURTAIN_OUT + 0.5 * k };
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

// O `p` em que o último filme está travado. A fase `hold` existe só para dar a
// ele o mesmo dwell dos outros quinze (ver `cursor()`), então o meio dela é o
// ponto mais folgado dentro dessa trava — cair na borda deixaria o pulo a um
// pixel de scroll de destravar.
export function lastLockAt(reduced: boolean) {
  const f = phases(reduced);
  return (f.hold.from + f.hold.to) / 2;
}

// Há para onde pular: o reel já começou e o último ainda não travou. Sai daqui,
// e não de uma comparação com `lock`, porque `lock` é -1 em trânsito entre duas
// travas e o botão piscaria a cada passagem.
export function canSkip(p: number, reduced: boolean) {
  const f = phases(reduced);
  return p >= f.reel.from && p < f.hold.from;
}

function span(p: number, s: Span) {
  return clamp01((p - s.from) / (s.to - s.from));
}

export type Cursor = {
  /** Posição contínua do reel. 0 = 1º travado, 15 = 16º travado, cresce além
   * disso durante a fase `exit` até o cursor tirar o 16º de quadro de vez
   * (ver o fator 1.6 em `cursor()`) — não promete um teto exato aqui. */
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
    u = i + smootherstep(clamp01((frac - DWELL) / (1 - DWELL)));
    lock = frac < DWELL ? i : -1;
  } else if (p < f.hold.to) {
    // O 16º chega no instante final do reel e não teria trava nenhuma. Esta
    // fase avulsa existe só para dar a ele o mesmo dwell dos outros quinze.
    u = COUNT - 1;
    lock = COUNT - 1;
  } else {
    // A fase se chama SAIDA: ela tem que tirar o card da TELA, nao so leva-lo um
    // passo para a esquerda. Em u = 16 o ultimo card fica com o centro em 2vw e a
    // borda direita ainda dentro do quadro, e como ele nunca mais se move, sobra
    // um fragmento borrado no canto pelo resto da rolagem. O fator 1.6 leva o
    // centro a -26.8vw, bem alem da borda.
    u = COUNT - 1 + easeOut4(span(p, f.exit)) * 1.6;
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
