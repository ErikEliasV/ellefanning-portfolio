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

export function grainPulse(trigger: Element, el: Element): Kill {
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(el, { "--grain-a": 0.12 }, { "--grain-a": 0.3, ease: "none", duration: 0.5 })
    .to(el, { "--grain-a": 0.12, ease: "none", duration: 0.5 });

  return bind(tl, { trigger, start: "top bottom", end: "bottom top" });
}
