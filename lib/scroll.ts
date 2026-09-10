"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

type Tick = (now: number) => void;

const REDUCED = "(prefers-reduced-motion: reduce)";
const LERP = 0.085;

let lenis: Lenis | null = null;
let booted = false;
let reduced = false;

const ticks = new Set<Tick>();

// The ticker counts from its own start, but everything downstream was written
// against rAF timestamps and compares them to performance.now(). Handing out
// that same clock keeps both epochs identical.
function drive() {
  const now = performance.now();
  lenis?.raf(now);
  ticks.forEach((fn) => fn(now));
}

export function isReduced() {
  return reduced;
}

export function onTick(fn: Tick) {
  ticks.add(fn);
  return () => {
    ticks.delete(fn);
  };
}

export function scrollTo(
  target: string | number,
  opts?: Parameters<Lenis["scrollTo"]>[1],
) {
  if (lenis) {
    lenis.scrollTo(target, opts);
    return;
  }
  if (typeof target === "number") {
    window.scrollTo(0, target);
    return;
  }
  document.querySelector(target)?.scrollIntoView();
}

export function lockScroll(on: boolean) {
  if (lenis) {
    if (on) lenis.stop();
    else lenis.start();
    return;
  }
  document.documentElement.style.overflow = on ? "hidden" : "";
}

export function bootScroll() {
  if (booted) return () => {};
  booted = true;

  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0);

  const query = window.matchMedia(REDUCED);
  reduced = query.matches;

  const build = () => {
    if (reduced || lenis) return;
    lenis = new Lenis({ lerp: LERP, syncTouch: false });
    // Lenis hands the callback its own instance, which ScrollTrigger.update
    // would read as its `force` flag and rebuild everything on every scroll.
    lenis.on("scroll", () => ScrollTrigger.update());
  };

  const tear = () => {
    lenis?.destroy();
    lenis = null;
  };

  const onChange = () => {
    reduced = query.matches;
    if (reduced) tear();
    else build();
    ScrollTrigger.refresh();
  };

  build();
  gsap.ticker.add(drive);
  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
    gsap.ticker.remove(drive);
    tear();
    booted = false;
  };
}
