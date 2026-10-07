// A geometria e o tempo do deck de CHARACTERS, sem tocar no DOM. Mesmo arranjo
// de lib/filmStage.ts: aqui moram os numeros, o hook so os le e os escreve como
// custom properties e medidas de card. Ter isto separado e o que deixa a
// coreografia conferivel sem abrir o hook.
//
// E UMA COMPOSICAO SO, em dois tamanhos. Uma foto de frente no centro, as
// outras viradas de lado, encostando nos montes das duas pontas. Um `u` anda 1
// por personagem e cada foto se posiciona pelo deslocamento `o = i - u`;
// `pose()` faz o resto. Quem move o `u` e o relogio no PC e o dedo no telefone;
// o scroll so faz a moldura em volta (ver "O tempo", abaixo).
//
// Ate 2026-09-24 eram DUAS: o monte no desktop e um ARCO em 3d no telefone,
// com `arc()` e `depth()` proprios. O arco saiu quando o no 2527:1761 foi
// medido e mostrou que o telefone desenha a mesma coisa que o desktop --
// trapezios girados, monte nas duas pontas, desfoque progressivo no pe -- so
// que com card retrato. Duas composicoes eram duas coreografias para manter em
// fase; agora e uma, parametrizada por `deckGeometry(narrow)`.
//
// Os numeros de cada tamanho estao em docs/2026-09-24-characters-figma-medidas.md.

import { CHARACTERS } from "@/data/characters";
import { clamp01, smootherstep } from "@/lib/motion/filmStage";

// O limiar de tela estreita e o de lib/filmStage.ts, reexportado em vez de
// redeclarado: dois limiares iguais hoje sao dois limiares diferentes daqui a
// tres meses.
export { NARROW_QUERY, isNarrow } from "@/lib/motion/filmStage";

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
// O tempo.
//
// Desde 2026-10-07 o scroll nao passa mais as fotos em tamanho nenhum. No PC
// elas giram sozinhas, em loop, pelo relogio (`spin`); no telefone andam com o
// dedo, arrastadas de lado (o hook arrasta, `rubber` e `release` dao a fisica).
// O que sobrou para o scroll e a MOLDURA, igual nos dois -- a tinta e a
// palavra entrando (a emenda com a filmografia), o monte subindo, uma janela
// parada em que o palco fica preso, e na saida o monte indo embora com a
// palavra. Ate la o scroll movia o `u` por um reel com rampas e travas
// (`phases()`/`cursor()`), primeiro nos dois tamanhos e depois so no telefone;
// ele saiu quando o ultimo dos dois parou de usa-lo.
// ---------------------------------------------------------------------------

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

// Quanto o monte leva para subir de baixo, e quanto leva para sair. Sao
// translacoes da CAIXA do deck, com as fotos paradas na pose que tiverem.
const RISE = 0.4;
const LIFT = 0.4;

// Onde a palavra comeca a sair, DENTRO da subida final. As fotos vao primeiro e
// a palavra segue; saindo juntas a tela esvaziaria de uma vez, e o que se quer
// e a secao se desmontando em dois tempos.
const WORD_OUT = 0.25;

// Quanto de rolagem o palco fica preso no meio, em TELAS. Uma tela: o bastante
// para quem chega pelo scroll ver o deck antes de a saida comecar, curto o
// bastante para a secao nao ler como travada. No telefone e tambem onde se
// arrasta: o dedo de lado nao rola a pagina, entao o palco fica preso pelo
// tempo que a pessoa quiser.
const STAY = 1;

// Em quantos slots a fileira encosta no monte e para.
//
// Deixou de ser MEDIDO, e essa foi a maior simplificacao da reescrita do
// trilho. O trilho antigo precisava saber quantas fotos cabiam por lado ate a
// borda visivel, e isso dependia da largura da janela e da caixa do <h2>. O
// monte nao tem borda -- a fileira para sozinha no terceiro slot, que e onde o
// no poe a foto mais externa -- entao o numero vale em qualquer tela.
const PILE = 3;

export type Span = { from: number; to: number };

export type FramePhases = { wipe: Span; rise: Span; stay: Span; lift: Span };

// QUATRO tempos, nos dois tamanhos: a emenda com a filmografia e a saida para
// o editorial leem igual no PC e no telefone. Sem variante de movimento
// reduzido: a moldura ja troca deslize por opacidade no CSS, e quem atende o
// pedido nas fotos e `spin()` (corte seco) e o hook (sem tween na soltura).
export function framePhases(): FramePhases {
  const wipe = { from: 0, to: WIPE };
  const rise = { from: wipe.to, to: wipe.to + RISE };
  const stay = { from: rise.to, to: rise.to + STAY };
  const lift = { from: stay.to, to: stay.to + LIFT };
  return { wipe, rise, stay, lift };
}

// Altura da trilha em multiplos de vh: o palco sticky (1) mais o percurso.
export function trackVh() {
  return 1 + framePhases().lift.to;
}

// O `p` em que o deck esta montado e parado. E onde o link CHARACTERS do header
// pousa: o topo da secao e a tela ainda clara da emenda com a filmografia, e
// cair ali seria pousar no meio de uma transicao. O alvo e o MEIO da janela
// parada, e nao a borda -- mesma razao do `lastLockAt` de lib/filmStage.ts:
// meia tela de folga para cada lado antes de a moldura voltar a se mexer.
//
// Quem chama isto e o proprio hook, na medicao, e o resultado em px vai
// escrito na trilha para o header ler -- ver `characterEntryTarget` em
// lib/useHeaderGlass.ts.
export function entryLockAt() {
  const { stay } = framePhases();
  return (stay.from + stay.to) / 2;
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
  /**
   * Posicao continua do deck: a foto `i` esta a `i - u` slots do centro. No PC
   * cresce sem limite e o deslocamento passa por `wrap()`; no telefone fica
   * entre 0 e COUNT-1, com a folga do elastico nas pontas.
   */
  u: number;
  /** O indice vivo. Troca no meio do caminho, onde `settle` vale 0. */
  active: number;
  /** A varredura da tinta, 0 a 1. Entra pela esquerda. */
  wipe: number;
  /** A entrada da palavra pela direita, 0 a 1. Termina dentro da varredura. */
  enter: number;
  /** A subida do monte, 0 a 1. */
  rise: number;
  /** A saida do monte, 0 a 1. */
  lift: number;
  /** A saida da palavra pela esquerda, 0 a 1. Comeca dentro da subida. */
  leave: number;
  /** Quanto a legenda esta assentada, 0 a 1. */
  settle: number;
  /** Deriva das palavras de fundo do celular, 0 a 1. */
  drift: number;
};

// Quao estreito e o vale da legenda. Com 1 era o seno puro: a legenda passava
// quase todo o caminho entre duas fotos acendendo ou apagando, e num carrossel
// que troca a cada 1,2s isso e um pisca-pisca. Com a quarta potencia ela fica
// inteira ate um quarto de slot de cada lado da foto e some numa janela curta
// em volta da troca.
const CAPTION_DIP = 4;

// O cursor dos dois tamanhos: a moldura pelo scroll, o `u` de quem manda nas
// fotos -- o relogio no PC, o dedo no telefone.
export function stage(p: number, u: number): Cursor {
  const f = framePhases();

  // Um `span` bruto por ponta, e dele saem DOIS escalares: a tinta e a palavra
  // na entrada, o monte e a palavra na saida. Ler o mesmo progresso duas vezes
  // e o que garante que os dois pares nao possam sair de fase -- a palavra
  // cruza a tinta num ponto que e sempre o mesmo, em qualquer tamanho de tela.
  const sweep = span(p, f.wipe);
  const away = span(p, f.lift);
  const rise = ease(span(p, f.rise));
  const lift = ease(away);

  // 1 com uma foto de frente, 0 no meio do caminho entre duas. O seno de
  // `PI * u` com potencia par so depende da fracao de `u`, de qualquer lado do
  // zero. O portao e a propria caixa do deck: a legenda sobe com o monte e vai
  // embora com ele, porque sempre ha uma foto no centro.
  const settle = rise * (1 - lift) * (1 - Math.sin(Math.PI * u) ** CAPTION_DIP);

  // Troca em u = n + 0,5, onde `settle` vale 0: o texto da legenda muda
  // enquanto ela esta invisivel, nunca a vista. O modulo cobre o loop do PC; no
  // telefone `u` nunca passa de meio slot alem das pontas (ver `rubber`).
  const active = ((Math.round(u) % COUNT) + COUNT) % COUNT;

  return {
    u,
    active,
    wipe: ease(sweep),
    enter: ease(head(sweep, WORD_IN)),
    rise,
    lift,
    leave: ease(tail(away, WORD_OUT)),
    settle,
    // A deriva das palavras de fundo: 0 no primeiro quadro da secao, 1 no
    // ultimo, LINEAR na rolagem. Devolve PROGRESSO, e quem sabe quanto andar e
    // o CSS, que mede a palavra com `100% - 100vw` e a varre inteira -- o pedido
    // era ver o nome todo passar. E vem de `p`, nao de `u`: o fundo anda liso
    // enquanto o deck faz o ritmo dele na frente.
    drift: clamp01((p - f.wipe.from) / (f.lift.to - f.wipe.from)),
  };
}

// ---------------------------------------------------------------------------
// O PC: o carrossel pelo relogio.
// ---------------------------------------------------------------------------

// Quanto cada personagem fica parada de frente, e quanto a travessia ate a
// seguinte leva, em ms. A trava foi 3s, 1,5 e 0,5, saiu de vez (esteira
// constante) e voltou em 0,1 a pedido do dono do projeto: so um respiro de
// frente, sem o carrossel parecer parado. Quem quer clicar tem a pausa do mouse
// na foto.
export const SPIN_DWELL = 100;
export const SPIN_TRAVEL = 1100;

// Com movimento reduzido nao ha deslize nenhum: a foto fica de frente este
// tempo e a seguinte entra num corte seco. Com a trava curta do PC, o corte
// viraria um pisca a cada fracao de segundo.
export const SPIN_DWELL_REDUCED = 2500;

// O deslocamento de um card no carrossel, embrulhado em [-COUNT/2, COUNT/2).
//
// E isto que faz o loop: com oito fotos, cada uma vive entre -4 e +4 slots do
// centro, e a que passa de -4 reaparece em +4. O salto acontece sempre no
// fundo de um monte -- `pose()` trava a posicao no slot PILE, entao em -4 ela
// esta exatamente sob a foto de -3, na mesma pose e com z menor, e em +4 sob a
// de +3. Some coberta de um lado e nasce coberta do outro.
export function wrap(offset: number) {
  const half = COUNT / 2;
  return ((((offset + half) % COUNT) + COUNT) % COUNT) - half;
}

/** O relogio do carrossel. */
export type Spin = {
  /** Quantas travessias ja terminaram. Cresce sem limite; o loop e de `wrap`. */
  step: number;
  /** Progresso da travessia em curso, 0 a 1. 0 na trava. */
  t: number;
  /** Quanto da trava ja passou, em ms. */
  wait: number;
  moving: boolean;
};

export const SPIN_REST: Spin = { step: 0, t: 0, wait: 0, moving: false };

// Avanca o relogio `ms` milissegundos.
//
// `hold` e a pausa (mouse na foto do centro, foco de teclado num card, modal
// aberto), e ela so vale na TRAVA: a travessia que ja comecou termina, e o
// carrossel para na foto seguinte. Parar no meio deixaria duas fotos de lado,
// nenhuma de frente, e a legenda apagada. E a pausa zera a espera em vez de
// congela-la: quem tira o mouse ganha a trava inteira de novo.
//
// Com movimento reduzido nao ha travessia: vencida SPIN_DWELL_REDUCED, o passo
// vira de uma vez e a foto seguinte ja aparece de frente.
export function spin(s: Spin, ms: number, hold: boolean, reduced: boolean): Spin {
  if (s.moving) {
    const t = s.t + ms / SPIN_TRAVEL;
    return t >= 1
      ? { step: s.step + 1, t: 0, wait: 0, moving: false }
      : { ...s, t };
  }

  if (hold) return s.wait === 0 ? s : { ...s, wait: 0 };

  const wait = s.wait + ms;
  if (wait < (reduced ? SPIN_DWELL_REDUCED : SPIN_DWELL)) return { ...s, wait };

  return reduced
    ? { step: s.step + 1, t: 0, wait: 0, moving: false }
    : { step: s.step, t: 0, wait: 0, moving: true };
}

// A curva da travessia do carrossel: EMPURRA E PLANA. E a integral de
// v = 12t(1-t)^2 -- a velocidade sobe ate o pico em um terco do tempo e passa
// os outros dois tercos freando, e chega a zero sem aceleracao, entao a foto
// POUSA no centro em vez de frear nele.
//
// Era a smootherstep, e ela e simetrica: acelera metade do tempo e freia a
// outra metade, com pico de 1,875 vezes a media. Com a trava de 0,1s o
// carrossel quase nunca para, e aquele pico lia como as fotos chicoteando pelo
// meio. Esta tem pico menor (1,78) e poe a maior parte do tempo no pouso, que e
// o trecho que o olho acompanha e que da a sensacao de peso.
export function glide(t: number) {
  return t * t * (6 - 8 * t + 3 * t * t);
}

// O cursor do PC. Devolve o mesmo `Cursor` do telefone para o hook escrever as
// mesmas custom properties sem saber de onde elas vieram; so o `u` muda de
// natureza -- aqui ele cresce sem limite, e quem le precisa passar o
// deslocamento por `wrap()`.
export function carousel(p: number, s: Spin): Cursor {
  return stage(p, s.step + glide(s.t));
}

// ---------------------------------------------------------------------------
// O telefone: o deck arrastado.
//
// O hook converte o arrasto em `u` cru (um slot por `reach` alturas de card de
// dedo, que e o quanto a foto do centro anda ate o primeiro slot) e passa por
// `rubber` para desenhar; na soltura, `release` diz em que foto assentar. O
// deck tem pontas, a pedido: na primeira e na ultima ele resiste e volta.
// ---------------------------------------------------------------------------

// Ate onde o elastico deixa passar da ponta, em slots, e quanto ele cede no
// comeco do puxao. Abaixo de meio slot, de proposito: alem disso o indice vivo
// viraria para uma personagem que nao existe.
const RUBBER_MAX = 0.35;
const RUBBER_GIVE = 0.55;

// A posicao desenhada para um `u` cru. Dentro das pontas e a identidade; fora,
// a curva do elastico do iOS -- cede RUBBER_GIVE no comeco e nunca passa de
// RUBBER_MAX, por mais que o dedo va.
export function rubber(raw: number) {
  const end = COUNT - 1;
  const base = Math.min(Math.max(raw, 0), end);
  const over = raw - base;
  if (over === 0) return raw;
  const pull = Math.abs(over);
  const give = RUBBER_MAX * (1 - 1 / ((pull * RUBBER_GIVE) / RUBBER_MAX + 1));
  return base + Math.sign(over) * give;
}

// Quanto de impulso a soltura projeta, em segundos de velocidade, e a partir de
// que velocidade (slots/s) o gesto conta como um peteleco que tem de andar ao
// menos uma foto mesmo sem ter passado da metade do caminho.
const FLING = 0.12;
const FLICK = 1.5;

// Em que foto o deck assenta quando o dedo solta em `raw` com `velocity`
// slots/s (positivo e para a frente). A velocidade projeta o gesto um pouco
// adiante; um peteleco rapido anda pelo menos uma; e nada passa das pontas.
export function release(raw: number, velocity: number) {
  const end = COUNT - 1;
  const base = Math.min(Math.max(raw, 0), end);
  const near = Math.round(base);
  let target = Math.round(base + velocity * FLING);
  if (target === near && Math.abs(velocity) > FLICK) {
    target = near + Math.sign(velocity);
  }
  return Math.min(Math.max(target, 0), end);
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
// outros. Quem atende `prefers-reduced-motion` nesta secao e o tempo: `spin()`
// corta seco no PC, e no telefone a soltura assenta sem tween.
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
