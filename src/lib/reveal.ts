"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

const NOOP: Kill = () => {};

// Anything already carrying a transform from the morph or from a reel is off
// limits to yPercent: GSAP writes transform inline and the CSS rule loses.
// clip-path, filter and custom properties are free everywhere.

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
