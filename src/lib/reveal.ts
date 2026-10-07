"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { isReduced } from "@/lib/scroll";

export type Kill = () => void;

export const EASE = "power4.out";
export const DUR_REVEAL = 0.9;
export const DUR_ANCHOR = 1.6;
export const STAGGER_GRID = 0.08;
export const STAGGER_LINE = 0.16;
export const START = "top 85%";

const NOOP: Kill = () => {};

function settle(tl: gsap.core.Timeline): Kill {
  tl.progress(1).pause();
  return () => tl.kill();
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

export function maskReveal(
  trigger: Element,
  els: Element[],
  stagger = STAGGER_GRID,
): Kill {
  if (!els.length) return NOOP;

  const tl = gsap.timeline({ paused: true }).fromTo(
    els,
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
