"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { isReduced } from "@/lib/scroll";

export type Kill = () => void;

const SCRUB = 0.6;
const NOOP: Kill = () => {};

// Anything already carrying a transform from the morph or from a reel is off
// limits to yPercent: GSAP writes transform inline and the CSS rule loses.
// clip-path and filter are free everywhere.

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
    start: "top 78%",
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

export function depthParallax(
  trigger: Element,
  layers: { el: Element; rate: number }[],
): Kill {
  if (!layers.length) return NOOP;

  const tl = gsap.timeline({ paused: true });
  layers.forEach(({ el, rate }) => {
    tl.fromTo(el, { yPercent: 0 }, { yPercent: -rate * 100, ease: "none" }, 0);
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
  stagger = 0.08,
): Kill {
  if (!els.length) return NOOP;

  const tl = gsap.timeline({ paused: true }).fromTo(
    els,
    { clipPath: "inset(0 0 100% 0)", yPercent: 8 },
    {
      clipPath: "inset(0 0 0% 0)",
      yPercent: 0,
      ease: "power2.out",
      duration: isReduced() ? 0.12 : 0.6,
      stagger: isReduced() ? 0 : stagger,
      clearProps: "clipPath,transform",
    },
  );

  return once(tl, { trigger });
}

export function rgbSplit(trigger: Element, el: Element, amount = 7): Kill {
  const clear =
    "drop-shadow(0 0 0 rgba(224,114,149,0)) drop-shadow(0 0 0 rgba(141,154,196,0))";
  const split =
    `drop-shadow(${amount}px 0 0 rgba(224,114,149,0.55))` +
    ` drop-shadow(${-amount}px 0 0 rgba(141,154,196,0.55))`;

  const tl = gsap
    .timeline({ paused: true })
    .fromTo(el, { filter: clear }, { filter: split, ease: "none", duration: 0.5 })
    .to(el, { filter: clear, ease: "none", duration: 0.5 });

  return bind(tl, { trigger, start: "top bottom", end: "bottom top" });
}

export function grainPulse(trigger: Element, el: Element): Kill {
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(el, { "--grain-a": 0.12 }, { "--grain-a": 0.3, ease: "none", duration: 0.5 })
    .to(el, { "--grain-a": 0.12, ease: "none", duration: 0.5 });

  return bind(tl, { trigger, start: "top bottom", end: "bottom top" });
}
