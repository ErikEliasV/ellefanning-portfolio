"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

type Tick = (time: number) => void;
type Watcher = (reduced: boolean) => void;

const REDUCED = "(prefers-reduced-motion: reduce)";
const LERP = 0.085;

let lenis: Lenis | null = null;
let booted = false;
let reduced = false;

const ticks = new Set<Tick>();
const watchers = new Set<Watcher>();

function drive(time: number) {
  lenis?.raf(time * 1000);
  ticks.forEach((fn) => fn(time));
}

export function isReduced() {
  return reduced;
}

export function onReducedChange(fn: Watcher) {
  watchers.add(fn);
  return () => {
    watchers.delete(fn);
  };
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
    watchers.forEach((fn) => fn(reduced));
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
