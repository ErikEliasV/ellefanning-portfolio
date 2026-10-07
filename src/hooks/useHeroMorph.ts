"use client";

import { useEffect, useRef } from "react";

import { onTick } from "@/lib/scroll";
import { onViewport, smallViewportHeight } from "@/lib/viewport";

const IMG_RATIO = 1900 / 1140;
const SIL_RATIO = 1490 / 1054;
const SIL_LEFT = 224 / 1900;
const SIL_TOP = 86 / 1140;
const SIL_WIDTH = 1490 / 1900;

const FRAME_W = 1920;

const A_SIL_W_VW = 1.0342;
const A_SIL_W_VH = 1.6;
const A_SIL_W_MAX_VW = 1.9;

// O perfil de telefone, medido nos nodes 2523:565 (primeiro estado) e
// 2523:602 (segundo) sobre um quadro de 402 x 874 -- o mesmo iPhone 16/17 Pro
// dos outros mocks. Mesma ideia de `geometry()` em lib/filmStage.ts: os
// numeros moram juntos e `measure()` os le; o que muda entre os perfis e so
// qual tabela responde.
//
// Ele nao e o perfil largo encolhido. A silhueta do telefone e MUITO maior em
// relacao a tela -- 2,07 e 2,76 vezes a largura, contra 1,03 e 1,04 no
// desktop. No desktop cabe a cabeca inteira no quadro; aqui o desenho e um
// corte fechado no rosto, sangrando dos dois lados. O teto de 1,25 que morava
// aqui foi um ajuste feito no escuro, antes destes mocks existirem, para
// consertar uma silhueta que virava o dobro da tela; era ele que deixava a
// cabeca pequena demais.
const NARROW_MAX = 1023;
const PHONE_W = 402;
const PHONE_H = 874;

// Estado A. A largura sai do teto: num telefone o termo de altura
// (A_SIL_W_VH) dispara e satura nele. `A_SIL_SHOW_NARROW` e a fracao da
// silhueta que fica DENTRO do quadro -- o topo do retrato ja nasce inteiro
// dentro dele e so a base estoura, cortada pelo overflow do .hero-frame, entao
// e este numero que decide onde o corte cai.
const A_SIL_W_MAX_VW_NARROW = 830.5 / PHONE_W;
const A_SIL_SHOW_NARROW = (PHONE_H - 533.98) / 587.3;
const A_SIL_CX_VW_NARROW = 257.05 / PHONE_W;

// Estado B. No desktop ele assenta a BASE da silhueta no pe do quadro e deixa
// o quadro crescer para caber ela (B_HEADROOM, mais abaixo). No telefone nao:
// o quadro fica do tamanho da tela e a silhueta vaza 141px por baixo, cortada.
// Entao aqui o que se ancora e o TOPO, e nao a base.
const B_SIL_W_VW_NARROW = 1109.6 / PHONE_W;
const B_SIL_CX_VW_NARROW = 260.62 / PHONE_W;
const B_SIL_TOP_VH_NARROW = 231.05 / PHONE_H;

// Fracao da altura do silhueta A visivel dentro do frame: o topo do
// retrato ja nasce inteiro dentro do frame (nunca corta ali), so a base
// e que estoura para fora e e cortada pelo overflow:hidden do
// .hero-frame — entao e este numero, nao a animacao de entrada, que
// decide onde esse corte cai. Era 0.38 (mostrava ate passar do nariz);
// reduzido a pedido, para o corte voltar a cair perto da ponta do nariz.
const A_SIL_SHOW = 0.37;
const A_SIL_CX_VW = 0.5115;
const A_RISE_VH = 0.22;

const B_SIL_W_VW = 1.04;
const B_SIL_CX_VW = 0.5;
const B_HEADROOM = 0.12;

const MORPH_VH = 0.7;

const PAPER_WIDTH = 2717.464;
const PAPER_CAP_TOP = -6.778;
const PAPER_GLYPH_LEFT = -63.71;
const PAPER_LINE = 736.142;

// O primeiro estado, medido no frame "PRE SCROLL HOME" do Figma (1920x1999).
// E a mesma palavra do segundo estado, so que pequena: o titulo de entrada em
// grotesco, que se trocava por serifado num wipe ao longo da rolagem, deixou
// de existir. As medidas sao todas da tinta de "FANNING.", que e a linha larga.
// No Figma ele esta centrado na largura (465 de margem dos dois lados), entao
// a posicao horizontal sai da tela e nao deste numero.
const START_INK = 989.9986;
const START_CAP = 199.637;
const START_BLOCK = 409.8396;
const START_LINE = 205.16;
const START_TOP = 471.8876;
// O topo da silhueta dentro do frame do Figma: a imagem dela comeca em 1160 e
// a cabeca, em 86/1140 da altura da imagem.
const START_HEAD = 1160 + (86 / 1140) * 1430;

const START_W_VW = START_INK / FRAME_W;
const START_BLOCK_K = START_BLOCK / START_INK;
const START_LINE_K = START_LINE / START_INK;
const START_CAP_K = START_CAP / START_INK;

// O frame do Figma e quase quadrado e a composicao dele tem muito mais ar do
// que cabe num 16:9: ali a cabeca so comeca a 63% da altura, e num 1920x973 ela
// comeca a 47%. Entao o titulo nao se prende ao topo da tela, e sim ao vao
// acima da cabeca, que e a relacao que o desenho tem de fato -- ele cai sempre
// a 37,2% desse vao, e a largura sai do que sobra. Em tela alta o teto de
// largura (a propria proporcao do Figma) e quem ganha e o desenho volta
// identico; em tela baixa o vao encolhe e o lockup encolhe junto.
//
// A folga entre o pe do bloco e a cabeca e medida na propria tinta, para o ar
// crescer junto com o tipo. O piso e o mesmo do titulo de entrada que saiu:
// abaixo de 280 a palavra vira selo num telefone.
const START_TOP_K = START_TOP / START_HEAD;
const START_GAP_K = 0.1;
const START_W_MIN = 280;

// O lockup do telefone, dos mesmos dois nodes. O Figma guarda ele como
// contorno achatado: a tinta de "FANNING." mede 3,58 caixas altas ali contra
// 4,86 na fonte de verdade (medido com o proprio `measureFace()` abaixo), ou
// seja ~70% da largura natural -- e o mesmo esmagamento nos dois estados,
// porque bloco/tinta da 0,5715 em ambos. Como aqui o titulo e texto vivo e nao
// contorno, casar largura E altura e impossivel sem deformar o tipo.
//
// Caso pela TINTA, que e o que fixa a composicao: no estado A a palavra tem
// que caber nas margens de 44 que o proprio mock define, e no B ela esta
// cortada pela borda de qualquer jeito. As letras saem mais baixas que no
// contorno do Figma; o tipo fica intacto, como no desktop.
const START_W_VW_NARROW = 314 / PHONE_W;
const START_TOP_VH_NARROW = 236 / PHONE_H;
const B_INK_VW_NARROW = 1236.84 / PHONE_W;
const B_CAP_TOP_VH_NARROW = 64 / PHONE_H;
const B_INK_LEFT_VW_NARROW = -62 / PHONE_W;

// Entrelinha sobre a caixa alta, medida no SVG achatado do node 2523:565
// (topo de "ELLE" em 0, caixa alta 87,63; topo de "FANNING." em 87,96). As
// duas linhas se encostam: sobram 0,33px entre a base de uma e o topo da
// outra. Razao entre duas medidas verticais, entao o achatamento do contorno
// se cancela nela e ela vale para o tipo de verdade tambem.
//
// O estado B confirma: com esta razao, o transbordo abaixo da linha de base
// (o "G" e o ponto) da 4,4% da caixa alta nos DOIS nodes -- 3,86/87,63 no A e
// 15,2/345,17 no B. E o mesmo lockup em duas escalas.
//
// No desktop a entrelinha ABRE entre os dois estados (1,03 -> 1,34) e e isso
// que `--lock-close` anima. No telefone ela nao muda, entao `lockClose` vai a
// zero la.
const NARROW_LINE_K = 1.0038;

// O segundo tempo da entrada: a copia nitida assenta de uma fracao da caixa
// alta. Era translateY(0.06em) sobre o titulo de entrada, uns 8px em 1920 --
// o mesmo gesto, agora medido no tipo que ficou.
const SETTLE_CAP_K = 0.086;

const SAMPLE = "FANNING.";
const SAMPLE_SIZE = 1000;

type Face = {
  w: number;
  ink: number;
  cap: number;
  asc: number;
  desc: number;
  bbLeft: number;
};

function context2d() {
  return document.createElement("canvas").getContext("2d");
}

function measureFace(family: string): Face | null {
  const context = context2d();
  if (!context || !family) return null;

  context.letterSpacing = "-0.01em";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = `400 ${SAMPLE_SIZE}px ${family}`;

  const metrics = context.measureText(SAMPLE);
  if (!metrics.width) return null;

  return {
    w: metrics.width / SAMPLE_SIZE,
    ink: (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) / SAMPLE_SIZE,
    cap: metrics.actualBoundingBoxAscent / SAMPLE_SIZE,
    asc: metrics.fontBoundingBoxAscent / SAMPLE_SIZE,
    desc: metrics.fontBoundingBoxDescent / SAMPLE_SIZE,
    bbLeft: metrics.actualBoundingBoxLeft / SAMPLE_SIZE,
  };
}

function fit(face: Face, width: number, capTop: number, glyphLeft: number, line: number) {
  const size = width / face.w;
  const offset = (line - (face.asc + face.desc) * size) / 2 + face.asc * size;
  return {
    size,
    top: capTop - offset + face.cap * size,
    left: glyphLeft + face.bbLeft * size,
  };
}

function imageBox(silWidth: number, silCenterX: number, silTop: number) {
  const width = silWidth / SIL_WIDTH;
  const height = width / IMG_RATIO;
  return {
    width,
    height,
    x: silCenterX - silWidth / 2 - SIL_LEFT * width,
    y: silTop - SIL_TOP * height,
  };
}

export function useHeroMorph(onProgress?: (value: number) => void) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;

    let morph = 1;
    let live = true;
    let face: Face | null = null;

    function progress() {
      if (!trackNode) return;
      const value = Math.min(Math.max(-trackNode.getBoundingClientRect().top / morph, 0), 1);
      trackNode.style.setProperty("--p", value.toFixed(4));
      trackNode.style.setProperty("--inv", (1 - value).toFixed(4));
      onProgress?.(value);
    }

    function measure() {
      if (!trackNode || !face) return;
      const vw = document.documentElement.clientWidth;
      const vh = smallViewportHeight();
      if (!vw || !vh) return;

      const ub = vw / FRAME_W;

      const narrow = vw <= NARROW_MAX;
      const capVw = narrow ? A_SIL_W_MAX_VW_NARROW : A_SIL_W_MAX_VW;
      const show = narrow ? A_SIL_SHOW_NARROW : A_SIL_SHOW;

      const silWa = Math.min(
        Math.max(A_SIL_W_VW * vw, A_SIL_W_VH * vh),
        capVw * vw,
      );
      const silHa = silWa / SIL_RATIO;

      const silWb = Math.max((narrow ? B_SIL_W_VW_NARROW : B_SIL_W_VW) * vw, silWa);
      const silHb = silWb / SIL_RATIO;
      // No telefone o quadro nao cresce: ele fica do tamanho da tela e a
      // silhueta vaza por baixo, cortada. Ver B_SIL_TOP_VH_NARROW.
      const frameHb = narrow ? vh : Math.max(vh, silHb / (1 - B_HEADROOM));
      const silTb = narrow ? B_SIL_TOP_VH_NARROW * vh : frameHb - silHb;
      const boxB = imageBox(
        silWb,
        (narrow ? B_SIL_CX_VW_NARROW : B_SIL_CX_VW) * vw,
        silTb,
      );

      const silTa = Math.max(vh - show * silHa, silTb + A_RISE_VH * vh);
      const boxA = imageBox(
        silWa,
        (narrow ? A_SIL_CX_VW_NARROW : A_SIL_CX_VW) * vw,
        silTa,
      );

      morph = MORPH_VH * vh;

      // A ancora horizontal e vertical da tinta no segundo estado. Elas saem
      // daqui, e nao de dentro do `fit()`, porque `lockDx`/`lockDy` mais
      // abaixo precisam das MESMAS duas medidas para montar a viagem de volta
      // ao primeiro estado -- se os dois lados lessem numeros diferentes, o
      // titulo chegaria torto numa das pontas.
      const paperGlyphLeft = narrow ? B_INK_LEFT_VW_NARROW * vw : PAPER_GLYPH_LEFT * ub;
      const paperCapTop = narrow ? B_CAP_TOP_VH_NARROW * vh : PAPER_CAP_TOP * ub;

      // `fit()` dimensiona pela largura de AVANCO (`face.w`) e o que o mock do
      // telefone da e a TINTA, que e mais estreita. Converter antes e o que faz
      // `paperInk` sair exatamente nos 1236,84 do Figma em vez de por perto.
      const paperWidth = narrow
        ? ((B_INK_VW_NARROW * vw) / face.ink) * face.w
        : PAPER_WIDTH * ub;
      const paperLine = narrow
        ? (NARROW_LINE_K * face.cap * (B_INK_VW_NARROW * vw)) / face.ink
        : PAPER_LINE * ub;
      const paper = fit(face, paperWidth, paperCapTop, paperGlyphLeft, paperLine);

      // Do segundo estado para o primeiro: um translate e uma escala sobre a
      // mesma face, do mesmo jeito que o retrato aqui embaixo. Nao ha mais dois
      // titulos trocando de lugar -- e uma palavra so, que cresce.
      //
      // O que a escala nao alcanca e a entrelinha: no Figma as duas linhas
      // quase se tocam (1,03 da caixa alta) e no segundo estado elas estao a
      // 1,38. A diferenca vai em --lock-close, que sobe so a segunda linha, nas
      // unidades de dentro da face, para a escala carregar ela junto.
      // No telefone o topo do bloco e medido na tela (0,270vh, os 236 do mock);
      // no desktop ele se prende ao vao acima da cabeca, que la e a relacao que
      // o desenho tem de fato -- ver START_TOP_K.
      const startTop = narrow ? START_TOP_VH_NARROW * vh : START_TOP_K * silTa;
      // A trava contra a cabeca vale nos dois: numa tela baixa (um telefone
      // deitado, por exemplo) o vao encolhe e o lockup tem que encolher junto,
      // senao ele desce por cima do rosto.
      const room = Math.max(silTa - startTop, 0);
      const startInk = Math.max(
        Math.min(
          (narrow ? START_W_VW_NARROW : START_W_VW) * vw,
          room / (START_BLOCK_K + START_GAP_K),
        ),
        START_W_MIN,
      );
      const paperInk = face.ink * paper.size;
      const lockK = paperInk ? startInk / paperInk : 1;
      const lockLeft = (vw - startInk) / 2;
      const lockDx = lockLeft - paper.left - lockK * (paperGlyphLeft - paper.left);
      const lockDy = startTop - paper.top - lockK * (paperCapTop - paper.top);
      // Zero no telefone: la as duas linhas guardam a mesma distancia nos dois
      // estados, entao `paperLine` ja e a entrelinha certa em qualquer ponto da
      // rolagem. Ver NARROW_LINE_K.
      const lockClose = narrow ? 0 : (START_LINE_K * startInk) / lockK - paperLine;

      const set = (name: string, value: number, unit = "px") =>
        trackNode.style.setProperty(name, `${Math.round(value * 100) / 100}${unit}`);

      set("--morph", morph);
      set("--frame-h-a", vh);
      set("--frame-h-b", frameHb);

      set("--img-w", boxB.width);
      set("--img-h", boxB.height);
      set("--img-dx", boxA.x - boxB.x);
      set("--img-dy", boxA.y - boxB.y);
      set("--img-x", boxB.x);
      set("--img-y", boxB.y);
      set("--img-k", silWa / silWb, "");

      set("--paper-line", paperLine);
      set("--paper-size", paper.size);
      set("--paper-top", paper.top);
      set("--paper-left", paper.left);
      trackNode.style.setProperty("--lock-k", lockK.toFixed(4));
      set("--lock-dx", lockDx);
      set("--lock-dy", lockDy);
      set("--lock-close", lockClose);
      set("--lock-settle", SETTLE_CAP_K * START_CAP_K * startInk);

      trackNode.dataset.ready = "";
      progress();
    }

    const root = getComputedStyle(document.documentElement);
    const editorial = root.getPropertyValue("--font-oskon").trim();

    document.fonts.ready.then(() => {
      if (!live) return;
      const lockup = measureFace(editorial);
      if (!lockup) return;
      face = lockup;
      measure();
    });

    // Uma inscricao so, com debounce e sem o ruido da barra de endereco do
    // celular -- ver lib/viewport.ts. Aqui morava um ResizeObserver do
    // documentElement MAIS um ouvinte de `resize`, e os dois disparavam a cada
    // recolher da barra de URL para remedir numeros que nao tinham mudado.
    const unwatch = onViewport(measure);
    const untick = onTick(progress);

    return () => {
      live = false;
      untick();
      unwatch();
    };
  }, [onProgress]);

  return track;
}
