// A geometria e o tempo da entrada de CHARACTERS, sem tocar no DOM. Mesmo
// arranjo de lib/filmStage.ts: aqui moram os números, o hook só os lê e os
// escreve como custom properties. Ter isto separado é o que deixa as fases
// legíveis e ajustáveis sem abrir o hook.

// Quanto de scroll a tela fica presa, em múltiplos de vh. A trilha inteira
// mede isto mais o palco (1). É o único número a mexer para a travessia ficar
// mais curta ou mais longa -- tudo abaixo é fração dele.
//
// 1.0, e não os 0.5 da primeira versão. O site tem uma gramática de ritmo e ela
// é medida: cada filme do reel ocupa 62vh de scroll, o `exit` 40, o `close` e o
// `fall` 35 cada. Com ENTRY em 0.5 as batidas daqui davam 23 e 33vh -- metade
// do passo do resto. Vindo de quinze filmes a 62vh cada, isso não lê como uma
// seção nova, lê como o site tropeçando. Em 1.0 elas viram 45 e 65vh, que é o
// mesmo compasso.
const ENTRY = 1;

export type Span = { from: number; to: number };

export type Cursor = {
  /** 0 = o texto ainda está fora, à direita. 1 = assentado no lugar. */
  slide: number;
  /** 0 = nenhum preto. 1 = o painel, vindo da esquerda, cobriu o palco. */
  wipe: number;
};

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function span(p: number, s: Span) {
  return clamp01((p - s.from) / (s.to - s.from));
}

// Uma smoothstep, t²(3-2t), e não a curva de saída do resto do site. A
// diferença importa porque aqui quem manda no tempo é o scroll, não um
// relógio: um power4.out jogaria dois terços da varredura nos primeiros 25% do
// percurso e deixaria o resto se arrastando, e um mapeamento linear parte e
// trava de uma vez nas duas pontas. A smoothstep é a única das três que sai do
// zero e chega no um com a velocidade morrendo, que é o que faz a coisa
// acompanhar a mão em vez de parecer um valor sendo escrito.
function ease(t: number) {
  return t * t * (3 - 2 * t);
}

// As duas fases se sobrepõem de propósito: é a sobreposição que produz o
// quadro pedido, com o texto já parado e o painel ainda a meio caminho, metade
// dele preto e metade branco. `wipe` começa depois e termina depois, então o
// painel ainda está andando quando o texto já parou -- é aí que a virada
// acontece sobre um texto imóvel, que é o que a deixa legível.
//
// Os dois vêm de lados opostos: o texto entra pela direita e o painel varre da
// esquerda. Eles se cruzam, e a inversão corre da esquerda para a direita ao
// longo da palavra.
//
// Depois de `wipe.to` sobra um quarto do orçamento com tudo parado em preto.
// Não é folga perdida: é a batida que separa a entrada da grade que vem
// rolando logo atrás, o mesmo papel do HOLD_MS do preloader.
const SLIDE: Span = { from: 0, to: 0.45 * ENTRY };
const WIPE: Span = { from: 0.1 * ENTRY, to: 0.75 * ENTRY };

// De onde cada peça parte, em porcentagem do próprio tamanho (xPercent e
// yPercent do GSAP) ou em escala, para a do centro. A tabela descreve a grade
// de três colunas, na ordem de leitura:
//
//   direita   baixo    direita
//   esquerda  centro   baixo
//   baixo     direita  esquerda
//
// São nove entradas porque nove é o que três linhas cheias pedem; CHARACTERS
// hoje tem oito, então a última fica de reserva e a nona sobra. Quem consome
// dá a volta pelo tamanho da lista, então nem faltar nem sobrar quebra nada.
//
// O conjunto tem que ler como a grade se montando, não como um punhado de
// coisas entrando ao mesmo tempo: quem escalona são os próprios
// ScrollTriggers, um por peça, porque cada uma cruza a tela num instante
// diferente.
export type Vector = { x?: number; y?: number; scale?: number };

// 45, e não os 60 da primeira tentativa: com a janela de encaixe curta, um
// deslocamento maior que este vira um borrão em vez de um movimento que se
// acompanha. A do centro cresce em vez de viajar, então a medida dela é escala.
export const CELL_VECTORS: readonly Vector[] = [
  { x: 45 },
  { y: 45 },
  { x: 45 },
  { x: -45 },
  { scale: 0.82 },
  { y: 45 },
  { y: 45 },
  { x: 45 },
  { x: -45 },
];

// Altura da trilha em múltiplos de vh: o palco sticky (1) mais o percurso. Sem
// movimento não há percurso -- a trilha vira só o palco e nada prende a tela.
export function trackVh(reduced: boolean) {
  return 1 + (reduced ? 0 : ENTRY);
}

export function cursor(p: number, reduced: boolean): Cursor {
  // Sem `p` nenhum para ler, o estado de repouso é o fim, não o começo: a
  // seção fica vestida, preta e com o texto branco no lugar. Mesma regra da
  // entrada da hero -- nada fica pré-armado esperando um sinal que não vem.
  if (reduced) return { slide: 1, wipe: 1 };
  return { slide: ease(span(p, SLIDE)), wipe: ease(span(p, WIPE)) };
}

// O painel já cobriu o bastante para o cursor precisar virar a pele clara. Sai
// daqui, e não de uma comparação solta no hook, para o limiar morar junto das
// fases que ele acompanha.
export function isDark(wipe: number) {
  return wipe >= 0.5;
}

// O `p` em que a entrada terminou e o título está parado, branco sobre o preto
// cheio, no meio da tela. É onde o link CHARACTERS do header pousa: o topo da
// seção é a tela branca do começo da varredura, e cair ali seria pousar no
// meio de uma transição, sem título nenhum à vista.
//
// O ponto é o MEIO do trecho parado que sobra depois de `WIPE.to`, e não a
// borda dele -- mesma razão do `lastLockAt` de lib/filmStage.ts: pousar na
// borda deixaria o destravamento do pin a um pixel de scroll de distância, e
// qualquer toque na roda já começaria a levar o título embora.
export function entryLockAt(reduced: boolean) {
  if (reduced) return 0;
  return (WIPE.to + ENTRY) / 2;
}
