"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { Vector } from "@/lib/characterStage";
import { isReduced } from "@/lib/scroll";

export type Kill = () => void;

// The shared grammar. Each section plays its own mechanism, but all of them
// borrow this curve, these duration bands, this stagger and this trigger point,
// which is what keeps the scroll reading as one piece instead of a stack of
// blocks that switch on and off. power4.out is the quintic ease-out, the GSAP
// twin of the CSS --ease-out.
export const EASE = "power4.out";
export const DUR_REVEAL = 0.9;
export const DUR_ANCHOR = 1.6;
export const STAGGER_GRID = 0.08;
export const STAGGER_LINE = 0.16;
export const START = "top 85%";

const SCRUB = 0.6;
const NOOP: Kill = () => {};

// Anything already carrying a transform from the morph or from a reel is off
// limits to yPercent: GSAP writes transform inline and the CSS rule loses.
// clip-path, filter and custom properties are free everywhere.

function settle(tl: gsap.core.Timeline): Kill {
  tl.progress(1).pause();
  return () => tl.kill();
}

function bind(tl: gsap.core.Timeline, vars: ScrollTrigger.StaticVars): Kill {
  if (isReduced()) return settle(tl);
  const trigger = ScrollTrigger.create({
    scrub: SCRUB,
    invalidateOnRefresh: true,
    animation: tl,
    ...vars,
  });
  return () => {
    trigger.kill();
    tl.kill();
  };
}

function once(tl: gsap.core.Timeline, vars: ScrollTrigger.StaticVars): Kill {
  if (isReduced()) return settle(tl);
  const trigger = ScrollTrigger.create({
    start: START,
    once: true,
    invalidateOnRefresh: true,
    animation: tl,
    ...vars,
  });
  return () => {
    trigger.kill();
    tl.kill();
  };
}

// The layer travels around its resting place rather than away from it, and
// the zoom buys the margin that keeps its edge out of frame.
export function depthParallax(
  trigger: Element,
  layers: { el: Element; rate: number }[],
  zoom = 1.1,
): Kill {
  // Unlike the other primitives, this one has no useful end state: settling it
  // at progress 1 would leave every layer parked at the far end of its travel.
  // With reduced motion it simply does not exist.
  if (!layers.length || isReduced()) return NOOP;

  const tl = gsap.timeline({ paused: true });
  layers.forEach(({ el, rate }) => {
    tl.fromTo(
      el,
      { yPercent: -rate * 50, scale: zoom },
      { yPercent: rate * 50, scale: zoom, ease: "none" },
      0,
    );
  });

  return bind(tl, { trigger, start: "top bottom", end: "bottom top" });
}

export function paperWipe(
  trigger: Element,
  el: Element,
  dir: "up" | "down",
): Kill {
  const from = dir === "up" ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)";
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(el, { clipPath: from }, { clipPath: "inset(0% 0 0% 0)", ease: "none" });

  return bind(tl, { trigger, start: "top 80%", end: "top 30%" });
}

export function maskReveal(
  trigger: Element,
  els: Element[],
  stagger = STAGGER_GRID,
): Kill {
  if (!els.length) return NOOP;

  const tl = gsap.timeline({ paused: true }).fromTo(
    els,
    // The insets end outside the border box rather than on it: the footer
    // lockup runs its glyphs past its own box, and landing the clip flush
    // would shave them off right before clearProps drops the clip entirely.
    { clipPath: "inset(-18% 0 100% 0)", yPercent: 8 },
    {
      clipPath: "inset(-18% 0 -18% 0)",
      yPercent: 0,
      ease: EASE,
      duration: isReduced() ? 0.12 : DUR_REVEAL,
      stagger: isReduced() ? 0 : stagger,
      clearProps: "clipPath,transform",
    },
  );

  return once(tl, { trigger });
}

// The characters do not simply arrive: each still is grey off centre and only
// resolves to full colour as its cell reaches the middle of the screen, so the
// role comes to life rather than fading in. The scalar goes to a custom
// property because the filter itself stays in CSS, where hover can still win.
export function focusIn(cells: Element[], rise = 2): Kill {
  if (!cells.length) return NOOP;

  const kills = cells.map((cell) => {
    const tl = gsap
      .timeline({ paused: true })
      .fromTo(
        cell,
        { "--sat": 0, yPercent: rise },
        { "--sat": 1, yPercent: 0, ease: "none" },
      );

    return bind(tl, {
      trigger: cell,
      start: "top bottom",
      end: "center center",
    });
  });

  return () => kills.forEach((kill) => kill());
}

// A mesma resolução de cinza para cor do focusIn, mas cada peça chega do seu
// lado em vez de todas subirem dois por cento. É o que faz a grade ler como se
// montando, e não como uma lista aparecendo.
//
// Quem se move é o cartão, não a célula: as linhas da grade moram na célula, e
// arrastá-las junto abriria vãos nos fios enquanto as peças viajam. Com a
// moldura parada e o conteúdo voando, o movimento vira o encaixe que ele quer
// ser. O --sat herda para dentro do cartão, então o filtro do still continua
// funcionando como antes e o hover ainda ganha dele pelo --lift.
// São dois tempos, não um, e a diferença entre eles é a razão de existirem.
//
// O encaixe é curto de propósito: a peça sai do lugar e chega nele enquanto o
// topo dela atravessa de baixo da tela até a linha dos 55%. O alcance longo do
// focusIn (`center center`) não serve aqui -- lá o deslocamento é de 2% e nem
// se nota, aqui é de mais de um terço do cartão, e esticá-lo por uma tela
// inteira deixa buracos pretos abertos na grade tempo demais. Buraco parado lê
// como layout quebrado, não como peça a caminho.
//
// A cor, ao contrário, quer o alcance longo: é o mesmo `--sat` do focusIn, que
// resolve de cinza para cor conforme a célula chega ao meio da tela, e é o que
// faz o papel ganhar vida em vez de simplesmente aparecer. Como uma linha mexe
// em transform e a outra numa custom property, as duas podem correr no mesmo
// elemento sem disputar a mesma declaração.
export function flyIn(pairs: { el: Element; from: Vector }[]): Kill {
  if (!pairs.length) return NOOP;

  const kills = pairs.flatMap(({ el, from }) => {
    const snap = gsap.timeline({ paused: true }).fromTo(
      el,
      {
        xPercent: from.x ?? 0,
        yPercent: from.y ?? 0,
        scale: from.scale ?? 1,
      },
      // A única das primitivas daqui que não usa `ease: "none"`. As outras
      // mapeiam scroll em valor, e ali o linear é o certo; esta é uma chegada,
      // e chegada sem desaceleração bate em vez de assentar. É a mesma curva
      // que o resto do site usa para entrada.
      { xPercent: 0, yPercent: 0, scale: 1, ease: EASE },
    );

    const bloom = gsap
      .timeline({ paused: true })
      .fromTo(el, { "--sat": 0 }, { "--sat": 1, ease: "none" });

    return [
      bind(snap, { trigger: el, start: "top bottom", end: "top 55%" }),
      bind(bloom, { trigger: el, start: "top bottom", end: "center center" }),
    ];
  });

  return () => kills.forEach((kill) => kill());
}

// Reserved for the anchor moments, where the site is allowed to breathe: the
// lines land one at a time, slower than anywhere else.
export function lineCascade(
  trigger: Element,
  els: Element[],
  stagger = STAGGER_LINE,
): Kill {
  if (!els.length) return NOOP;

  const tl = gsap.timeline({ paused: true }).fromTo(
    els,
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      ease: EASE,
      duration: isReduced() ? 0.12 : DUR_ANCHOR,
      stagger: isReduced() ? 0 : stagger,
      clearProps: "opacity,transform",
    },
  );

  return once(tl, { trigger });
}

// The counterpoint of silence. No stagger, no travel, nothing to read as an
// effect: after the weight of the Now panel the footer only needs to be there.
export function quietFade(trigger: Element, els: Element[]): Kill {
  if (!els.length) return NOOP;

  const tl = gsap.timeline({ paused: true }).fromTo(
    els,
    { opacity: 0 },
    {
      opacity: 1,
      ease: EASE,
      duration: isReduced() ? 0.12 : DUR_REVEAL,
      clearProps: "opacity",
    },
  );

  return once(tl, { trigger });
}

export function grainPulse(trigger: Element, el: Element): Kill {
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(el, { "--grain-a": 0.12 }, { "--grain-a": 0.3, ease: "none", duration: 0.5 })
    .to(el, { "--grain-a": 0.12, ease: "none", duration: 0.5 });

  return bind(tl, { trigger, start: "top bottom", end: "bottom top" });
}
