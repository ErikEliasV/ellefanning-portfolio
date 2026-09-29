// A geometria e o tempo do deck de CHARACTERS, sem tocar no DOM. Mesmo arranjo
// de lib/filmStage.ts: aqui moram os numeros, o hook so os le e os escreve como
// custom properties e medidas de card. Ter isto separado e o que deixa a
// coreografia conferivel sem abrir o hook.
//
// E UMA COMPOSICAO SO, em dois tamanhos. As oito fotos comecam empilhadas na
// ponta direita, viradas de lado; o scroll tira uma de cada vez, gira ela de
// frente ao passar pelo centro e a deposita no monte da esquerda, virada de
// novo. `cursor()` devolve um `u` que anda 1 por personagem e cada foto se
// posiciona pelo deslocamento `o = i - u`; `pose()` faz o resto.
//
// Ate 2026-09-24 eram DUAS: o monte no desktop e um ARCO em 3d no telefone,
// com `arc()` e `depth()` proprios. O arco saiu quando o no 2527:1761 foi
// medido e mostrou que o telefone desenha a mesma coisa que o desktop --
// trapezios girados, monte nas duas pontas, desfoque progressivo no pe -- so
// que com card retrato. Duas composicoes eram duas coreografias para manter em
// fase; agora e uma, parametrizada por `deckGeometry(narrow)`.
//
// Os numeros de cada tamanho estao em docs/2026-09-24-characters-figma-medidas.md.

import { CHARACTERS } from "@/lib/characters";
import { clamp01, smootherstep } from "@/lib/filmStage";

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

// ---------------------------------------------------------------------------
// O tempo. Vale para as duas composicoes.
// ---------------------------------------------------------------------------

// Quanto de scroll cada personagem pede. Sao os numeros de lib/filmStage.ts, de
// proposito: vindo de dezesseis filmes a 0,6167 de tela cada, um passo
// diferente aqui nao leria como secao nova, leria como o site trocando de ritmo
// no meio da pagina.
const CYCLE_WIDE = 0.6167;
// Subiu de 0,34 a pedido do dono do projeto, que queria a animacao do telefone
// "bem lisa". Quem manda na suavidade aqui e este numero: quanto mais tela cada
// personagem pede, menos o deck anda por pixel de rolagem, e mais fino e o
// incremento de cada quadro. O preco e a secao ficar mais alta no telefone --
// com a rampa unificada ela passou de 4,1 para 6,3 telas.
const CYCLE_NARROW = 0.4;
const CYCLE_REDUCED = 0.35;

// Dentro de cada ciclo, os primeiros 20% nao movem nada: e a trava.
//
// Ela sobrevive a reescrita do trilho de proposito, e e a unica coisa que
// impede a esteira de ser perfeitamente lisa. Sem ela `settle` so tocaria 1 num
// instante e a legenda piscaria em vez de assentar: a trava e o tempo de ler o
// nome. Esteira que pousa, e nao esteira que passa.
const DWELL = 0.2;

// E quanto ela pede NO TELEFONE. Menor pela mesma razao que o ciclo e maior: a
// trava e a unica coisa que nao e lisa no percurso, e no telefone ela aparecia
// a cada 0,34 de tela. Menor que isto a legenda deixaria de ter tempo de
// assentar -- `settle` so chega a 1 dentro da trava, e e ela que da o tempo de
// ler o nome.
const DWELL_NARROW = 0.14;

// O escurecimento por profundidade do arco (`DIM`) e a quantizacao do desfoque
// dele (`BLUR_STEP`) moravam aqui e sairam junto com o arco. Nenhum dos dois
// tem equivalente no monte: nos dois nos as fotos estao a 100 por cento, e o
// degrau do desfoque agora vive no hook, que e quem converte `haze` em px.

const DEG = Math.PI / 180;

// Quanto a cortina preta leva para varrer a tela, em TELAS.
//
// Ela entra pela ESQUERDA, e e uma TRANSLACAO e nao uma opacidade -- ate
// 2026-09-28 isto era `FLOOR_IN`, e o chao virava tinta desmaiando no lugar.
// Quem resolve a emenda com a filmografia e esta fase: o palco entrega a tela
// ainda branca, e a cortina a converte. Tem que resolver antes de qualquer foto
// aparecer, que e o pedido literal -- as fotos so sobem depois que a tela ja
// esta toda preta.
const WIPE = 0.65;

// Onde a palavra termina de entrar, DENTRO da varredura.
//
// Ela vem pela direita enquanto a tinta vem pela esquerda, e chega ANTES. Sem
// esta antecipacao as duas terminariam juntas e a palavra nunca seria vista
// preta sobre branco -- que e justamente o efeito. Com 0,6 ela assenta com a
// tinta ainda em dois tercos da tela, e o ultimo terco da varredura a lava de
// preto a branco a vista.
const WORD_IN = 0.6;

// Quanto o monte leva para subir de baixo, e quanto leva para sair por cima.
//
// Sao translacoes da CAIXA do deck, e acontecem com o `u` parado nas duas
// pontas: nao entram na conta da taxa unica que `walk` e `pile` protegem.
const RISE = 0.4;
const LIFT = 0.4;

// Onde a palavra comeca a sair, DENTRO da subida final. As fotos vao primeiro e
// a palavra segue; saindo juntas a tela esvaziaria de uma vez, e o que se quer
// e a secao se desmontando em dois tempos.
const WORD_OUT = 0.25;

// Em quantos slots a fileira encosta no monte e para -- e, pela mesma conta, o
// tamanho da rampa de entrada e o da de saida.
//
// Deixou de ser MEDIDO, e essa e a maior simplificacao desta reescrita. O
// trilho antigo precisava saber quantas fotos cabiam por lado ate a borda
// visivel, e isso dependia da largura da janela e da caixa do <h2>: o hook
// media, escrevia a altura da secao, e ela mudava de uma janela para outra. O
// monte nao tem borda -- a fileira para sozinha no terceiro slot, que e onde o
// no poe a foto mais externa -- entao o numero vale em qualquer tela e mora
// aqui, ao lado do tempo que ele governa.
const PILE = 3;

export type Span = { from: number; to: number };

export type Phases = {
  wipe: Span;
  rise: Span;
  walk: Span;
  reel: Span;
  hold: Span;
  pile: Span;
  lift: Span;
  cycle: number;
};

// SETE tempos, e a ordem e o assunto:
//
//   wipe   a tinta entra pela esquerda, a palavra pela direita
//   rise   o monte da direita sobe de baixo, INTEIRO, com as oito empilhadas
//   walk   a primeira caminha do monte ate o centro
//   reel   as oito atravessam
//   hold   a ultima trava no centro
//   pile   a ultima mergulha no monte da esquerda
//   lift   o monte da esquerda sobe e sai; a palavra sai pela esquerda
//
// `walk` e `pile` sao as rampas de sempre, intactas: PILE slots ao MESMO ritmo
// do reel, e e isso que faz o deck andar a uma taxa so do primeiro ao ultimo
// quadro em que ele anda. `rise` e `lift` nao competem com aquela taxa porque
// nao movem o `u` -- movem a CAIXA, com a fileira parada dentro dela. Foi essa
// separacao que deixou "as fotos vem de baixo" conviver com o monte: o monte
// sobe ja formado, e so entao a primeira sai de dentro dele.
export function phases(reduced: boolean, narrow: boolean): Phases {
  const cycle = reduced ? CYCLE_REDUCED : narrow ? CYCLE_NARROW : CYCLE_WIDE;
  // A entrada e a saida sao os `PILE` slots do monte, andando no MESMO ritmo do
  // reel: a primeira foto sai do monte da direita e leva tres slots de rolagem
  // ate o centro, exatamente o que levaria se ja estivesse no reel.
  const ramped = PILE * cycle;

  const wipe = { from: 0, to: WIPE };
  const rise = { from: wipe.to, to: wipe.to + RISE };
  const walk = { from: rise.to, to: rise.to + ramped };
  const reel = { from: walk.to, to: walk.to + cycle * (COUNT - 1) };
  // A ultima chega no instante final do reel e nao teria trava nenhuma. Esta
  // fase avulsa existe so para dar a ela o mesmo dwell das outras sete.
  const hold = { from: reel.to, to: reel.to + cycle * (narrow ? DWELL_NARROW : DWELL) };
  const pile = { from: hold.to, to: hold.to + ramped };
  const lift = { from: pile.to, to: pile.to + LIFT };

  return { wipe, rise, walk, reel, hold, pile, lift, cycle };
}

// Altura da trilha em multiplos de vh: o palco sticky (1) mais o percurso.
export function trackVh(reduced: boolean, narrow: boolean) {
  return 1 + phases(reduced, narrow).lift.to;
}

// O `p` em que o PRIMEIRO personagem esta travado, com a legenda ja assentada.
// E onde o link CHARACTERS do header pousa: o topo da secao e a tela ainda
// clara da emenda com a filmografia, e cair ali seria pousar no meio de uma
// transicao. O ponto e o MEIO do dwell, e nao a borda -- mesma razao do
// `lastLockAt` de lib/filmStage.ts: pousar na borda deixaria o destravamento a
// um pixel de scroll de distancia.
//
// A FORMA nao mudou com os tempos novos, e e de proposito que ela saia de
// `reel.from` em vez de uma soma escrita aqui: `reel.from` agora e o fim de
// `walk`, que por sua vez ja conta a varredura e a subida do monte. Quem chama
// isto e o proprio hook, na medicao, e o resultado em px vai escrito na trilha
// para o header ler -- ver `characterEntryTarget` em lib/useHeaderGlass.ts.
export function entryLockAt(reduced: boolean, narrow: boolean) {
  const f = phases(reduced, narrow);
  return f.reel.from + (f.cycle * (narrow ? DWELL_NARROW : DWELL)) / 2;
}

// O guarda de `to === from` existe para o caso de uma fase de duracao zero: a
// divisao daria NaN, e um NaN escrito num transform apaga o palco inteiro sem
// erro nenhum no console.
function span(p: number, s: Span) {
  return s.to > s.from ? clamp01((p - s.from) / (s.to - s.from)) : 1;
}

// As duas janelas internas. Leem um `t` que ja e 0..1 dentro de uma fase e
// devolvem o progresso de um TRECHO dela: `head` termina antes do fim (a
// palavra que assenta em 60% da varredura), `tail` comeca depois do inicio (a
// palavra que so parte depois de 25% da subida final).
//
// Trechos de uma fase, e nao fases proprias, porque os dois pares tem que andar
// JUNTOS: a palavra atravessando a tinta e a palavra seguindo as fotos sao um
// gesto so, visto de dois lados. Fases separadas seriam dois numeros para
// manter em fase um com o outro.
function head(t: number, end: number) {
  return clamp01(t / end);
}

function tail(t: number, start: number) {
  return clamp01((t - start) / (1 - start));
}

// Uma smoothstep, e nao a curva de saida do resto do site. Aqui quem manda no
// tempo e o scroll, nao um relogio: e a unica das curvas do projeto que sai do
// zero e chega no um com a velocidade morrendo, que e o que faz a coisa
// acompanhar a mao em vez de parecer um valor sendo escrito.
function ease(t: number) {
  return t * t * (3 - 2 * t);
}

export type Cursor = {
  /** Posicao continua do reel. Vai de -PILE a COUNT-1+PILE. */
  u: number;
  /** O indice vivo. Troca no meio da travessia, onde `settle` vale 0. */
  active: number;
  /** A varredura da tinta, 0 a 1. Entra pela esquerda. */
  wipe: number;
  /** A entrada da palavra pela direita, 0 a 1. Termina dentro da varredura. */
  enter: number;
  /** A subida do monte da direita, 0 a 1. */
  rise: number;
  /** A saida do monte da esquerda por cima, 0 a 1. */
  lift: number;
  /** A saida da palavra pela esquerda, 0 a 1. Comeca dentro da subida. */
  leave: number;
  /** Quanto a legenda esta assentada, 0 a 1. */
  settle: number;
  /** Deriva das palavras de fundo do celular, 0 a 1. */
  drift: number;
};

export function cursor(
  p: number,
  reduced: boolean,
  narrow: boolean,
): Cursor {
  const f = phases(reduced, narrow);

  // Um `span` bruto por ponta, e dele saem DOIS escalares: a tinta e a palavra
  // na entrada, o monte e a palavra na saida. Ler o mesmo progresso duas vezes
  // e o que garante que os dois pares nao possam sair de fase -- a palavra
  // cruza a tinta num ponto que e sempre o mesmo, em qualquer tamanho de tela.
  const sweep = span(p, f.wipe);
  const wipe = ease(sweep);
  const enter = ease(head(sweep, WORD_IN));

  const rise = ease(span(p, f.rise));

  const away = span(p, f.lift);
  const lift = ease(away);
  const leave = ease(tail(away, WORD_OUT));

  // Quantos slots o `u` percorre antes da primeira e depois da ultima: os PILE
  // slots ate o monte, nos dois tamanhos.
  const wing = PILE;

  let u: number;
  // Fracao da travessia atual: 0 enquanto travado, 1 ao chegar na trava
  // seguinte. E dela que sai `settle`.
  let travel: number;

  if (p < f.walk.from) {
    // Varredura e subida: o monte da direita INTEIRO, parado. O `u` so comeca a
    // andar quando a caixa ja pousou -- e por isso que as oito sobem empilhadas
    // em vez de uma delas ja estar a caminho do centro.
    u = -wing;
    travel = 0;
  } else if (p < f.reel.from) {
    // A rampa de entrada, LINEAR: o monte anda 1:1 com a rolagem.
    u = -wing * (1 - span(p, f.walk));
    travel = 0;
  } else if (p < f.reel.to) {
    const raw = span(p, f.reel) * (COUNT - 1);
    const i = Math.min(Math.floor(raw), COUNT - 2);
    const frac = raw - i;
    const dwell = narrow ? DWELL_NARROW : DWELL;
    const t = clamp01((frac - dwell) / (1 - dwell));
    u = i + smootherstep(t);
    travel = frac < dwell ? 0 : t;
  } else {
    // `hold` cai aqui com `span(p, pile)` valendo 0, entao a ultima fica travada
    // no centro ate a rampa de saida comecar de fato; e `lift` cai com ela ja
    // valendo 1, entao o monte da esquerda esta FORMADO quando a caixa comeca a
    // subir. E o espelho da entrada: monte inteiro, uma peca so.
    u = COUNT - 1 + wing * span(p, f.pile);
    travel = 0;
  }

  // O portao da legenda: ela so pode existir quando ha uma foto no centro.
  //
  // Lido do proprio `u`, o portao abre exatamente no slot em que a primeira
  // chega ao centro e fecha no slot em que a ultima sai dele. Os escalares das
  // pontas nao servem: `walk` dura PILE slots, e um deles valeria meio caminho
  // la pelo meio dela -- a legenda apareceria a 50%, com o nome da primeira
  // personagem, sobre um centro que so vai ser ocupado telas depois.
  const gate = clamp01(u + 1) * clamp01(COUNT - u);

  // 1 na trava, 0 no meio da travessia, 1 de novo na trava seguinte. O seno da
  // um vale simetrico com derivada nula nas duas pontas: a legenda some junto
  // com a foto que sai e volta com a que chega, sem as duas se cruzarem no
  // caminho.
  const settle = gate * (1 - Math.sin(Math.PI * travel));

  // O arredondamento troca exatamente em u = i + 0,5, e smootherstep(0,5) vale
  // 0,5, entao a troca cai no mesmo instante em que `settle` vale 0: o texto da
  // legenda muda enquanto ela esta invisivel, nunca a vista.
  const active = Math.min(Math.max(Math.round(u), 0), COUNT - 1);

  // A deriva das palavras de fundo: 0 no primeiro quadro da secao, 1 no ultimo,
  // LINEAR na rolagem.
  //
  // Duas coisas mudaram aqui em 2026-09-24, e as duas vieram do dono do projeto
  // dizendo que a deriva "nao ta funcionando".
  //
  // A primeira e a UNIDADE. Isto devolvia vw -- 6 por personagem, 42 no
  // percurso inteiro -- e 42vw e 10% do corpo da palavra, que mede uns 430vw
  // naquele tamanho. A palavra andava, so que dez por cento de si mesma: lido
  // na tela, um bloco enorme de letras tremendo no lugar. Agora devolve
  // PROGRESSO, e quem sabe quanto andar e o CSS, que mede a palavra com
  // `100% - 100vw` e a varre inteira. O pedido era ver o nome todo passar.
  //
  // A segunda e a FONTE. Saia de `u`, para a deriva parar junto com o deck; mas
  // `u` tem as travas do dwell, e o fundo herdava as pausas do primeiro plano.
  // Vindo de `p`, ele anda liso do primeiro ao ultimo quadro da secao enquanto
  // o deck faz o ritmo dele na frente -- que e o que se quer de uma textura de
  // fundo, e tambem o que faz a secao do telefone ler como lisa.
  const drift = clamp01((p - f.wipe.from) / (f.lift.to - f.wipe.from));

  return { u, active, wipe, enter, rise, lift, leave, settle, drift };
}

// ---------------------------------------------------------------------------
// O monte (perfil largo).
//
// Reescrito em 2026-09-24 contra o no 2555:131, lido campo a campo no painel do
// Figma -- docs/2026-09-24-characters-figma-medidas.md diz de qual no sai cada
// numero daqui.
//
// O que havia antes era o TRILHO: a foto virava fatia porque o hook escrevia
// uma `width` menor nela a cada quadro e o `object-fit: cover` recortava de
// novo. O desenho nao pede recorte, pede GIRO. Os seis cards laterais do no tem
// todos a MESMA caixa -- 299 x 649, Y 498 -- e sao trapezios: aresta de fora
// alta, aresta de dentro baixa. Isso e o que uma carta girada em torno do eixo
// vertical projeta, e 299/651 = cos(62,7 graus) fecha a conta.
//
// A largura virou consequencia do angulo, e com ela sumiram as sete escritas de
// layout por quadro: sobrou um `transform`, que o compositor resolve sem tocar
// em layout nenhum.
// ---------------------------------------------------------------------------

export type Deck = {
  /** Meia largura do hero, em alturas do card. (651/649)/2. */
  half: number;
  /** Giro do card parado no monte, em graus. */
  turn: number;
  /** Perspectiva aplicada NO CARD, em alturas do card. */
  persp: number;
  /** Onde cai o slot 1, em alturas do card. */
  reach: number;
  /** Expoente da lei de espalhamento da fileira. */
  spread: number;
  /** Em quantos slots a fileira encosta no monte e para. */
  pile: number;
  /** Desfoque do pe do card lateral, em alturas do card. 18/649. */
  haze: number;
};

// O `turn` NAO e o 62,7 que 299/651 da direto, e a diferenca e a perspectiva.
// Um plano girado theta com perspectiva d projeta largura W*cos(theta)/(1-s^2)
// e aresta de perto H/(1-s), com s = (W/2)*sin(theta)/d. Como o no poe os sete
// cards na mesma altura de caixa (649), a pose leva uma escala de (1-s) para
// devolver a aresta de perto a H -- e essa escala tambem encolhe a largura, que
// passa a valer W*cos(theta)/(1+s). Resolvendo para 299/651 com s = 0,0633 sai
// cos(theta) = 0,4884, ou seja 60,76 graus. Cravar 62,7 aqui deixaria o card
// lateral 2 por cento mais estreito que o no.
//
// `persp` sai da razao medida entre as duas arestas do trapezio (0,881):
// (1-s)/(1+s) = 0,881 da s = 0,0633, e dai d = (W/2)*sin(theta)/s = 4487px num
// canvas onde o card mede 649 -- 6,914 alturas de card. E uma perspectiva
// fraca de proposito: o trapezio do no e sutil.
const WIDE: Deck = {
  half: 0.50155, // (651 / 649) / 2
  turn: 60.76,
  persp: 6.914,
  reach: 0.6171, // 400,5 / 649
  spread: 0.514,
  pile: PILE,
  haze: 0.02774, // 18 / 649
};

// O quadro estreito, medido no no 2527:1761 (402 x 874). A COMPOSICAO e a
// mesma -- trapezios girados, monte nas duas pontas, desfoque progressivo no
// pe. O que muda e que o card e retrato (243,527 x 413,098, razao 0,5896) em
// vez de quase quadrado, e e isso que move todos os outros numeros:
//
//   `half`  = (243,527/413,098)/2, meia largura em ALTURAS de card.
//   `turn`  sai de 124,13/243,527 = 0,5097, corrigido pela perspectiva.
//   `persp` sai da razao medida entre as duas arestas do trapezio: 0,823, mais
//           forte que o 0,881 do desktop porque o card e mais estreito. Vale a
//           conferencia cruzada: em LARGURAS DE TELA os dois dao quase o mesmo
//           -- 2,59 aqui contra 2,38 la. A perspectiva do desenho e a mesma nos
//           dois quadros; so o card mudou de forma.
//   `reach` = 125/413,098. Os tres slots medidos sao 0,3026 / 0,4602 / 0,6178.
//   `haze`  = 8,5/413,098, menor que o do desktop porque as fatias tambem sao.
//
// `spread` merece a ressalva: aqui o passo externo e CONSTANTE (65,13px por
// slot), nao decrescente como no desktop, e uma lei de potencia nao representa
// isso exatamente. 0,63 e o melhor compromisso -- erra no maximo 2,5% nos tres
// slots, que num card de 413 da menos de 7px.
const PHONE: Deck = {
  half: 0.2948, // (243,527 / 413,098) / 2
  turn: 56,
  persp: 2.517,
  reach: 0.3026, // 125 / 413,098
  spread: 0.63,
  pile: PILE,
  haze: 0.02058, // 8,5 / 413,098
};

// Sem variante de movimento reduzido, e a ausencia e deliberada. O giro aqui
// nao e animacao, e a COMPOSICAO parada: e ele que faz o card lateral medir 299
// em vez de 651. Zera-lo poria sete heros de largura inteira uns sobre os
// outros. Quem atende `prefers-reduced-motion` nesta secao e `phases()`, que
// encurta o percurso, como sempre fez.
export function deckGeometry(narrow: boolean): Deck {
  return narrow ? PHONE : WIDE;
}

// O topo da faixa de z-index e o passo por slot. 60 e largo o bastante para
// duas vizinhas nunca empatarem por arredondamento -- um empate trocaria a
// ordem de pintura de um quadro para o outro.
//
// z-index, e nao ordenacao 3D: `perspective` mora em cada CARD
// (`transform: perspective(...) rotateY(...)`), e nao no trilho. A diferenca
// importa. Com a perspectiva no pai, o ponto de fuga e unico e um card a 715px
// do centro ganharia um cisalhamento que cresce com o x -- no no os seis
// laterais tem o trapezio IDENTICO, longe ou perto. Com a perspectiva no card,
// cada um projeta em torno do proprio centro e o trapezio nao depende de onde
// ele esta. O preco e nao haver `preserve-3d`, e portanto nenhuma ordenacao por
// profundidade: a ordem volta a ser z-index, escrita aqui.
const Z_TOP = 1000;
const Z_STEP = 60;

// Onde o card esta na fileira, em slots, com a trava do monte.
//
// A trava e um `min` cru, sem suavizacao, e isso foi escolha e nao esquecimento.
// Suavizar pede derivada nula em `pile` com o valor ainda batendo em pile-1, e
// uma curva assim tem que passar ACIMA da reta no meio do trecho: o card
// aceleraria para fora antes de parar. O `min` troca isso por uma quina na
// derivada, e a quina acontece exatamente onde o card acabou de entrar no monte
// -- atras de outros dois, quase todo coberto. Trocar uma aceleracao visivel
// por uma quina invisivel e o negocio certo.
function slot(d: number, k: Deck) {
  return Math.min(d, k.pile);
}

export type Pose = {
  /** Centro do card, em alturas do card, a partir do centro do palco. */
  x: number;
  /** Giro em torno do eixo vertical, em graus. Negativo do lado direito. */
  turn: number;
  /** A escala que devolve a aresta de perto a altura do hero. */
  scale: number;
  /** Desfoque do pe do card, em alturas do card. */
  haze: number;
  /** -1, 0 ou 1: de que lado do centro o card esta. So a sombra le. */
  side: number;
  /** Quanto da sombra sobra, 0 a 1. So a sombra le. */
  shade: number;
  /** z-index inteiro. O centro por cima de tudo. */
  z: number;
};

/**
 * A pose de um card em funcao do deslocamento assinado ate o centro.
 * Positivo ainda vem (monte da direita), negativo ja passou (monte da esquerda).
 *
 * Nao ha ramo nenhum aqui, e isso nao e economia de linhas: a entrada e a saida
 * SAO a mesma perna, e escrever duas seria abrir espaco para elas divergirem.
 * O sinal do deslocamento e a unica coisa que distingue um lado do outro.
 */
export function pose(offset: number, k: Deck): Pose {
  const d = Math.abs(offset);
  const s = Math.sign(offset);

  // A fileira. A lei de espalhamento e praticamente uma RAIZ, e ela sai dos
  // tres slots que o no mede: 0,6171 / 0,8729 / 1,1025 alturas de card. As
  // razoes entre eles dao expoente 0,5003 e 0,5285; 0,514 e o meio, e erra
  // menos de 1 por cento nos tres. O passo despenca -- 0,617 do centro ao
  // primeiro, 0,256 ao segundo, 0,229 ao terceiro -- e e esse desabamento que
  // faz a fileira virar monte em vez de leque.
  const x = s * k.reach * Math.pow(slot(d, k), k.spread);

  // O giro. De 0 no centro a `turn` no monte em UM slot, com derivada nula nas
  // duas pontas: a foto se apresenta de frente ao chegar ao centro em vez de
  // passar reta por ele, e encosta no monte sem quina.
  const t = smootherstep(clamp01(d));
  const turn = k.turn * t;

  return {
    x,
    turn: -s * turn,
    scale: 1 - (k.half * Math.sin(turn * DEG)) / k.persp,
    // Quantizado em degraus de meio pixel pelo hook, nao aqui: o valor em
    // alturas de card so vira px la.
    haze: k.haze * t,
    side: s,
    // A sombra some com a profundidade, e isto NAO esta no no: la os seis
    // laterais tem todos a mesma sombra. A diferenca e que la eles estao
    // espalhados e aqui, no monte, ficam um exatamente sobre o outro -- oito
    // sombras de 41% empilhadas dao 99% de preto, um borrao solido em volta da
    // pilha, que foi o que se viu ao rodar. So a de cima aparece, entao as de
    // tras sao apagadas.
    //
    // Pelo `d` CRU, e nao pelo de `slot()`: o que a trava do monte congela e a
    // POSICAO, nao a contagem, entao aqui os cards do monte continuam
    // distinguiveis um do outro. E e so por isso que este fade tem como
    // existir.
    shade: 1 - smootherstep(clamp01((d - k.pile) / 1.5)),
    z: Math.max(1, Z_TOP - Math.round(d * Z_STEP)),
  };
}
